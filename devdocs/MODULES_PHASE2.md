# Modules Phase 2: Native Distribution, Generics, and PlatformIR Retirement

> **Status**: Design document. Phase 1 (core module system, `-l` linking, e3 auto-collection, UIPageType) is implemented across east, east-node, east-py, east-c, e3, east-ui, and e3-cloud.

## Goal

Complete the module story so that:

1. Runtime packages (east-py-std, east-py-datascience, east-node-std, etc.) present themselves as modules — not just flat lists of platform functions
2. User code imports these modules in npm packages (internally using `East.extern()`) with full type safety
3. East functions can be generic (parametric polymorphism), enabling module exports like `array.get<T>` and `xgboost.train<Features>`
4. `PlatformIR` is retired — all external function calls go through the module system
5. Complex builtins migrate to runtime-provided modules; remaining builtins become IR primitives

## Current State (Phase 1)

- `SymbolIR` — IR node for cross-module references, resolved by late-binding lookup in `symbol_values` map
- `EastModuleType` — serialized symbol table (`Dict<String, IR>`) stored as `.beast2` objects
- CLI `-l` flag — east-node, east-py, east-c load modules and pass symbols to compiler
- e3 tasks — auto-collect modules, store as datasets, generate `-l` flags in command IR
- east-ui `UIPageType` — bundles modules with component tree, late-binding decode on client
- Beast2 decode options — `{ symbols }` threads symbol values to function compilation during deserialization

What's missing: runtime packages still use `PlatformIR` for all external calls. Generic functions don't exist. There's no mechanism for a module to export a polymorphic function.

---

## Part 1: Runtime-Provided and Native Modules

### Problem

Today, `east-py-datascience` provides 50+ platform functions as a flat `PlatformFunction[]` list loaded via `-p`. The SDK wraps each one with `East.platform()` or `East.genericPlatform()`. The user never sees modules — they call `XGBoost.trainRegressor(X, y, config)` which emits `PlatformIR("xgboost_train_regressor", ...)`.

We want the user to instead write `East.extern("east-py-datascience.xgboost", "trainRegressor", ...)` and have it resolve at runtime from a module registry.

### Module Registry Convention

Runtime packages gain a `modules` export alongside `platform`:

**Python** (`east_py_datascience/__init__.py`):
```python
# Existing (backward compat):
platform = [xgboost_train_impl, xgboost_predict_impl, ...]

# New:
modules = {
    "east-py-datascience.xgboost": {
        "trainRegressor": xgboost_train_impl.fn,
        "predict": xgboost_predict_impl.fn,
    },
    "east-py-datascience.sklearn": {
        "computeMetrics": sklearn_metrics_impl.fn,
        ...
    },
}
```

**Node.js** (`@elaraai/east-node-std/modules`):
```typescript
export default {
    "east-node-std.console": {
        log: console_log_fn,
        error: console_error_fn,
    },
    "east-node-std.fs": {
        readFile: fs_read_fn,
        writeFile: fs_write_fn,
    },
};
```

**C** (`east-c-std`):
```c
// Existing:
EastPlatformRegistry *platform = east_std_platform();

// New:
EastModuleRegistry *modules = east_std_modules();
// where EastModuleRegistry maps name → EastValue (struct of functions)
```

### Runner Integration

The CLI runners (`east-node run`, `east-py run`, `east-c run`) load module registries from `-p` packages and merge them into `symbol_values` alongside `-l` module files:

```
symbol_values = {}

# 1. Load native modules from -p packages
for package in packages:
    for name, value in package.modules.items():
        symbol_values[name] = value

# 2. Load East IR modules from -l files
for module_file in link_files:
    module = decode_beast2(module_file)
    for name, ir in module.symbols.items():
        compiled = compile(ir, symbol_values)
        symbol_values[name] = compiled

# 3. Compile and run the main program with all symbols available
result = compile(main_ir, symbol_values, platform).run(inputs)
```

Note: native modules provide pre-compiled **values** (JavaScript/Python functions), not IR. They go directly into `symbol_values`. East IR modules provide IR that gets compiled with the accumulated symbol values.

### SDK Ergonomics

The SDK continues to provide typed wrappers. Today's `XGBoost.trainRegressor(X, y, config)` would become:

```typescript
// In @elaraai/east-py-datascience SDK:
const XGBoost = {
    trainRegressor: East.extern(
        "east-py-datascience.xgboost", "trainRegressor",
        FunctionType([MatrixType(FloatType), VectorType(FloatType), XGBConfigType], XGBModelType)
    ),
    predict: East.extern(
        "east-py-datascience.xgboost", "predict",
        FunctionType([XGBModelType, MatrixType(FloatType)], VectorType(FloatType))
    ),
};
```

User code is unchanged — `XGBoost.trainRegressor(X, y, config)` still works. The difference is that it emits `SymbolIR("east-py-datascience.xgboost.trainRegressor")` instead of `PlatformIR("xgboost_train_regressor")`.

### Environment Setup

For e3-cloud, the runtime environment determines which native modules are available. Three tiers:

**Tier 1: Pre-installed (current model)**
The Docker image includes east-py, east-py-std, east-py-io, east-py-datascience. All native modules from these packages are always available. Tasks declare which modules they need; the runner verifies availability.

**Tier 2: Cached `uv` environments**
For user-specified Python dependencies, the task object includes an environment spec (pyproject.toml hash). The runner creates/caches a `uv`-managed virtual environment per spec hash. First run: cold start (install). Subsequent runs: cache hit (instant).

```
init_tree = { "pyproject.toml": "<hash>" }
init = .some ["uv", "sync", "--project", .bin]
run = ["uv", "run", "--project", .bin, "east-py", "run", ...]
```

Note that `uv run` can perform sync (very quickly, with automated caching too) so we could skip initialization for simplicity.

**Tier 3: Custom container images**
For heavy dependencies (TensorFlow, CUDA, etc.), the task specifies a container image. e3-cloud runs the task in that image via Fargate or ECS or our own firecracker-based solution.

### Rollout

1. Add `./modules` export convention to east-py-std, east-py-io, east-py-datascience, east-node-std, east-node-io
2. Update runners to load module registries from `-p` packages into `symbol_values`
3. Update SDK wrappers to use `East.extern()` instead of `East.platform()`
4. Keep `-p` + `PlatformIR` working for backward compat during transition
5. Update e3 task command IR to stop passing `-p` once all functions are module-provided

---

## Part 2: Generic (Parametric) Function Types

### Problem

Many module exports need to be generic. `array.get<T>(array: Array<T>, index: Integer) -> T` can't be expressed as a monomorphic function. Today, this is handled by `BuiltinIR` and `PlatformIR` which have `type_parameters` fields. Module-exported functions via `SymbolIR` have no equivalent.

### Design

Three new concepts in the East type system and IR:

#### 2.1 TypeParam in EastTypeValue

A new variant representing an unresolved type parameter:

```typescript
// New case in EastTypeType:
TypeParam: StructType({ name: StringType })

// Example:
TypeParam("T")  // represents an unresolved type variable
```

`TypeParam` can appear anywhere a concrete type appears — in `FunctionType` inputs/output, `ArrayType` element type, `StructType` field types, etc.
They act similarly to variables, but represent types not values (and follow typical lexical scoping and closure capture rules).

#### 2.2 GenericFunctionType

A function type with type parameters:

```typescript
GenericFunctionType: StructType({
    type_parameters: ArrayType(StringType),    // ["T", "U", ...]
    inputs: ArrayType(EastTypeType),           // may contain TypeParam references
    output: EastTypeType,                      // may contain TypeParam references
})
```

This is a **type**, not an IR node. It describes the shape of a generic function value.

#### 2.3 SpecializeIR

A new IR node that instantiates a generic function with concrete types:

```typescript
SpecializeIR = variant<"Specialize", {
    type: EastTypeType,                     // the resulting concrete FunctionType
    location: ArrayType(LocationType),
    function: IR,                           // the generic function (SymbolIR, Variable, etc.)
    type_arguments: ArrayType(EastTypeType), // concrete types for each parameter
}>
```

### SDK: Type parameter scoping

Specializing one generic function can result in specializing a generic function that it calls.
Sometimes, that second generic function is a closure defined inside the first generic function, and implicitly "inherits" the same type parameter because it captures a variable relying on that type parameter.
In some cases, the closure may even be a return value which is specialized elsewhere in the program.
This process is equivalent to variable capture in closures, except applied to type parameters, and will need special handling in `ast_to_ir` much like variables.

Just as a whole program (the `main` function) has no captures, a whole program will have no "free" type parameters.
After linking is complete, the concrete type of any remaining type parameters can be filled in recursively (e.g. by abstract interpretation).
At this point we do so via monomorphization.

### Compilation: Monomorphization

`SpecializeIR` performs **compile-time monomorphization**:

1. Evaluate the `function` expression → get the generic function value
2. Substitute `TypeParam("T")` → `type_arguments[0]` throughout the function's body IR
3. Compile the specialized body → concrete callable
4. Cache by (function identity, type arguments) to avoid recompilation

This is the same strategy as C++ templates and Rust generics.
Each unique combination of type arguments produces a separate compiled function.
Note that for higher-order functions, the "identity" of any input or output functions will need to be tracked by the final stage of the compiler and specialized separately for this to work correctly.
(An alternative approach is to lazily specialize functions and perform run-time dispatch).

For **native modules**, the runtime provides a factory function instead of a value:

```python
# Python native module with generic export:
modules = {
    "east-py-datascience.xgboost": {
        "train": GenericModuleExport(
            type_parameters=["Features"],
            factory=lambda Features: xgboost_train_specialized(Features),
        ),
    },
}
```

When `SpecializeIR` encounters a native generic, it calls the factory with the concrete type arguments.

### SDK API

```typescript
// Define a generic platform function as a module export:
const arrayGet = East.extern(
    "east-std.array", "get",
    GenericFunctionType(["T"], [ArrayType(TypeParam("T")), IntegerType], TypeParam("T"))
);

// At call sites, type inference resolves T from the array's known type:
const x = arrayGet(myIntArray, 0n);  // T inferred as IntegerType

// Or explicit specialization:
const getInt = arrayGet.specialize(IntegerType);
const x = getInt(myIntArray, 0n);
```

The SDK already has the `genericPlatform()` pattern (see `GENERIC_PLATFORM_FUNCTIONS.md`). The migration is: `genericPlatform("name", ...)` → `East.extern("module.name", GenericFunctionType(...))` + `specialize()`.

### Interaction with SymbolIR

A generic function is a **value** — it can be stored in `symbol_values`, passed as an argument, returned from a function. The `SymbolIR` lookup returns the generic value. `SpecializeIR` then monomorphizes it at each call site.

This means module exports can be generic without any change to `SymbolIR` or the module system. The generics are orthogonal to modules — they're a type system feature.

### Rollout

1. Add `TypeParam` to `EastTypeType` (all runtimes: TS, Python, C)
2. Add `GenericFunctionType` to the type system
3. Add `SpecializeIR` to `IRType` (all runtimes)
4. Implement monomorphization in the JS compiler, Python compiler, and C interpreter
5. Add `East.genericExtern()` or extend `East.extern()` to accept generic types
6. Add type inference at call sites (infer type arguments from concrete argument types)

---

## Part 3: PlatformIR Retirement and Builtin Consolidation

### The Migration

Once Parts 1 and 2 are complete:

1. **Every `PlatformIR` call has a module equivalent** — `PlatformIR("xgboost_train", args)` becomes `Call(GetField(Symbol("east-py-datascience.xgboost"), "train"), args)`
2. **Every `GenericPlatformFunction` has a generic module equivalent** — factory pattern replaced by `SpecializeIR` on a generic module export
3. **Deprecate `PlatformIR`** — mark as deprecated, emit warnings
4. **Remove `PlatformIR`** — clean removal after all downstream code migrates

### Builtin Consolidation

Today, `BuiltinIR` handles ~100 operations: arithmetic, comparison, string manipulation, collection operations, type conversions, formatting, etc. Some of these are true language primitives; others are library functions that happen to be built-in.

**Candidates for migration to runtime modules:**

- String formatting (`StringFormat`, `StringPadLeft`, `StringTrim`, etc.) → `east-core.string`
- DateTime operations (`DateTimeAddDays`, `DateTimeFormat`, etc.) → `east-core.datetime`
- Math functions (`FloatSin`, `FloatCos`, `FloatLog`, etc.) → `east-core.math`
- Collection algorithms (`ArraySort`, `ArrayGroupBy`, `DictMerge`, etc.) → `east-core.collections`

These would become East IR modules that internally use a small set of remaining builtins.

**Candidates for becoming IR primitives (replacing BuiltinIR):**

- Arithmetic: `Add`, `Subtract`, `Multiply`, `Divide`, `Negate`, `Remainder`
- Comparison: `Equal`, `Less`, `LessEqual`, `Greater`, `GreaterEqual`
- Boolean: `And`, `Or`, `Not`
- Type conversion: `IntToFloat`, `FloatToInt`, `ToString`
- Collection access: `ArrayGet`, `ArraySet`, `ArraySize`, `DictGet`, `SetHas`
- Reference: `RefGet`, `RefSet`

These are small enough and universal enough to be direct IR nodes. This would make `BuiltinIR` (with its string-based dispatch and factory pattern) unnecessary.

**Net result**: IR nodes cover the primitive operations. Everything else is a module function — either a pure East IR module or a native module provided by the runtime.

### Rollout

1. Create `east-core` module package with East IR implementations of string, datetime, math, collection algorithms
2. Migrate SDK to use module imports for these operations
3. Add primitive IR nodes for arithmetic, comparison, boolean, access operations
4. Migrate builtins to either modules or primitives
5. Remove `BuiltinIR` dispatch infrastructure
6. Remove `PlatformIR` from IR type

---

## Open Questions

### Beast2 Symbol Embedding

The current approach stores modules at the type level (`UIPageType`, `-l` files). An alternative: embed the symbol table in the Beast2 format between header and value.

**Arguments for (do it):**
- Any `.beast2` file with functions becomes self-contained
- CLI runners could accept a single file instead of IR + modules
- Eliminates wrapper types like `UIPageType`
- Natural extension of Beast2 already compiling functions during decode

**Arguments against (defer):**
- Format version bump affects all runtimes (TS, Python, C/WASM)
- Late-binding via shared `symbol_values` map works today
- The `-l` flag and `UIPageType` handle the current use cases

**Recommendation:** Defer until Part 1 stabilizes. If module-dependent functions appear in many different types beyond UI pages, the format change becomes worth it. If `UIPageType` remains the only consumer, the type-level approach is sufficient.

### east-c Integration

east-c is a tree-walking C interpreter (not a code generator). It compiles to native binaries and to WASM via Emscripten.

**Phase 1 complete:** `IR_SYMBOL` has been added to `IRNodeKind`, `eval_ir()`, and `convert_ir()`. The symbol registry uses file-static arrays (`east_set_symbols()`/`east_clear_symbols()`). The CLI supports `-l` for loading `.beast2` module files. Symbol variant index 34 matches the TypeScript/Python IR order.

**Remaining IR gaps:** `IR_AS` and `IR_NEW_MATRIX` are still missing (stubbed with warnings). These are unrelated to modules but needed for full IR compliance.

**WASM bridge:** The east-c-wasm package bridges East IR execution to the browser via Emscripten. Platform functions cross the WASM/JS boundary via Beast2-encoded calls. For modules:
- East IR modules can be compiled inside WASM natively (the C interpreter's `IR_SYMBOL` + symbol registry handles them)
- The WASM API needs a `wasm_set_symbols()` entry point so the JS host can pass compiled symbol values before execution
- Native modules (east-node-std equivalents) could be provided as JS implementations registered via the existing platform bridge, or compiled inside WASM if pure East IR

**Remaining work for east-c:**
1. Add `IR_AS` and `IR_NEW_MATRIX` to close remaining IR gaps
2. Expose `east_set_symbols()` through the WASM API so the JS host can pass module values
3. For Part 2 (generics): add `SpecializeIR` to `eval_ir()` — substitute type params and re-evaluate

---

## Dependency Graph

```
Part 1 (runtime modules)
  ├── Module registry convention in runtime packages
  ├── Runner integration (-p packages → symbol_values)
  ├── SDK migration (East.platform → East.extern)
  └── Environment setup (uv, cached envs)

Part 2 (generics)           ← can proceed in parallel with Part 1
  ├── TypeParam in EastTypeType
  ├── GenericFunctionType
  ├── SpecializeIR + monomorphization
  └── Type inference at call sites

Part 3 (PlatformIR retirement)  ← requires Part 1 + Part 2
  ├── All platform functions → module exports
  ├── Builtin consolidation (modules + IR primitives)
  ├── Deprecate PlatformIR
  └── Remove PlatformIR + BuiltinIR

Beast2 embedding           ← independent, defer decision
east-c WASM bridge         ← expose east_set_symbols() to JS host
```

Parts 1 and 2 are independent and can proceed in parallel. Part 3 requires both. Beast2 embedding is an independent decision with no blocking dependencies. east-c core module support is complete; remaining work is WASM bridge exposure and IR gap closure.
