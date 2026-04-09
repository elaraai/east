# East Module System

This document describes the module system for East: how code is organized into symbols and modules, how they reference each other, and how they are linked and executed.

> **Status**: Core implementation complete. SymbolIR, compiler, analyzer, SDK interface (`East.export`, `East.module`, `East.extern`), and compliance tests are all implemented.

## Definitions

- **Symbol** — the atomic unit of the module system. A named, typed value. Defined by `East.export()` (has IR) or referenced by `East.extern()` (unresolved, provided by runtime).
- **Module** — a named collection of symbol definitions. A partial symbol table. Created by `East.module()`.
- **Symbol table** — the complete set of symbols needed for linking. Composed by combining modules. Represented as `Map<string, IR>` mapping fully-qualified symbol names to their IR.
- **Program** — a complete symbol table + an entry point. The runner looks up the entry point in the symbol table and executes it.

## Symbols

A symbol is a named, typed value — the atomic unit of the module system. Symbols are what `SymbolIR` nodes reference, and what the linker resolves.

### Defining symbols: `East.export()`

`East.export(name, value)` creates a symbol definition. It carries a local name and value, and produces IR that can be included in a module.

```typescript
const pi = East.export("pi", 3.14159);
const add = East.export("add",
    East.function([IntegerType, IntegerType], IntegerType, ($, a, b) => a.add(b)));
```

The returned value is fully transparent — callable if the value is a function, has field access if it's a struct, etc. The TypeScript types are preserved: `add` is a callable `FunctionExpr`, `pi` is a `FloatExpr`.

Exports are validated at creation time: only values and free functions can be exported. Control flow, re-exports, and recursive export references are rejected with clear error messages.

### Referencing external symbols: `East.extern()`

`East.extern(module, name, type)` creates a reference to a symbol that will be provided by the runtime (not backed by East IR). Intended for platform-defined modules (native capabilities like `fs`, `net`, etc.):

```typescript
const readFile = East.extern("east-node-std.fs", "readFile", FunctionType([StringType], StringType));
// readFile(path) generates Call(Symbol("east-node-std.fs.readFile"), [path])
```

### Non-symbol values

Values not wrapped in `East.export()` are NOT symbols. They are inlined wherever they appear in the IR — no deduplication, no SymbolIR. Using an `East.export()` value outside of a module context is an error — use `East.extern()` for references to externally-provided symbols.

```typescript
// NOT a symbol — will be inlined in every function body that uses it
const helper = East.function([IntegerType], IntegerType, ($, x) => x.add(1n));
```

## SymbolIR

`SymbolIR` is the IR node that references a symbol by name:

```
SymbolIR = variant<"Symbol", {
    type: EastTypeValue,         // expected type of the resolved value
    location: LocationValue[],   // source location for error reporting
    name: String,                // symbol name (e.g. "math.add")
}>
```

Symbol names use East's path notation: identifiers joined by `.`, with backtick-quoting for non-standard identifiers (e.g., `` `my-app`.math.add ``). The SDK constructs these names using `printIdentifier()` for each segment. Names are opaque strings to the IR — the linker matches them exactly.

`SymbolIR` is analogous to an unresolved symbol in a C object file. It says: "I need a value of this type, identified by this name. The linker will provide it."

### Relationship to PlatformIR

`PlatformIR` is a **direct call** to a named external function. `SymbolIR` is a **value reference** — it resolves to a value, and the caller uses standard IR nodes (`GetField`, `Call`) to interact with it.

The migration path: runtime packages currently provide platform function implementations. With modules, they additionally provide symbols exporting those same functions. New code should prefer the module interface. `PlatformIR` remains available as the lower-level direct mechanism.

### Relationship to VariableIR

- **VariableIR** references a lexically-scoped local variable, resolved during AST-to-IR compilation.
- **SymbolIR** references an externally-provided value, resolved by the linker before execution.

A variable is part of the program's control flow. A symbol is a hole to be filled by the environment.

## Modules

A module is a named collection of symbol definitions — a partial symbol table. Each symbol's fully-qualified name is `printIdentifier({module}).printIdentifier({symbol})` using East's path notation.

### Creating modules

`East.module(name, ...symbols)` creates a module from named symbols (varargs):

```typescript
const mathModule = East.module("math", pi, add, compute);
// Creates symbols: "math.pi", "math.add", "math.compute"
```

This follows the same pattern as `e3.package(name, version, ...items)` — each item already carries its own name and dependencies are tracked automatically.

### How `East.module()` works

1. Validates each argument is an `East.export()` symbol (checks `ast_type === "ExportRef"`).
2. Builds an export registry mapping local names to full symbol names and types.
3. For each export, unwraps the `ExportRefAST` to get the inner AST, then calls `ast_to_ir` with the export registry as context. Any `ExportRefAST` nodes in sub-expressions (e.g., one export referencing another) are resolved to `SymbolIR` using the registry.
4. Stores each symbol's IR keyed by fully-qualified name.
5. Tracks cross-module dependencies automatically: when the `ast_to_ir` context encounters `SymbolAST` nodes (from `East.extern()` or module descriptor field access), the referenced modules are added to the dependency set.
6. Returns a `Module` descriptor with dynamic field getters for cross-module references.

### Module descriptor

The `Module` class returned by `East.module()` uses hidden JS `Symbol` properties for metadata. The visible (enumerable) properties are dynamic getters for each exported symbol:

```typescript
const mathModule = East.module("math", add, pi);

// Field access — returns typed Expr wrapping SymbolAST
mathModule.add(x, 1n)  // generates Call(Symbol("math.add"), [x, Value(1)])
mathModule.pi           // generates Symbol("math.pi")

// Module metadata — accessed via static methods
Module.name(mathModule)          // "math"
Module.symbols(mathModule)       // Record<string, IR> — the symbol table
Module.dependencies(mathModule)  // Set<Module> — transitively referenced modules
```

No clashes between symbol names and metadata. Clean enumeration (`Object.keys`, spread) shows only exported symbols. TypeScript types are fully preserved — `mathModule.add` returns a correctly-typed callable `FunctionExpr`.

### Cross-module references

```typescript
// math.ts
export const mathModule = East.module("math", add, pi);

// main.ts
import { mathModule } from "./math";

const process = East.export("process",
    East.function([IntegerType], IntegerType, ($, x) => {
        return mathModule.add(x, 1n);
        // Generates: Call(Symbol("math.add"), [x, Value(1)])
    }));
const mainModule = East.module("main", process);
```

Dependencies are tracked automatically via the `SymbolAST.modules` field. When a module descriptor getter creates a `SymbolAST`, it includes a reference to the containing module and its transitive dependencies. During `ast_to_ir`, these are collected into the `imports` set. The TypeScript `import` IS the East import.

## Symbol Tables and Compilation

### Symbol table

A symbol table is a `Map<string, IR>` — mapping fully-qualified symbol names to the IR that constructs their values. Composed by combining modules:

```typescript
const symbolIRs = new Map<string, IR>();
for (const [name, ir] of Object.entries(Module.symbols(mathModule))) {
    symbolIRs.set(name, ir);
}
```

### Compilation

The compiler accepts two maps:

- **`symbol_irs: Map<string, IR>`** — the symbol table (name → IR). Symbols are compiled and evaluated on first reference, with results cached in `symbol_values`.
- **`symbol_values: Map<string, any>`** — the shared memoization cache (name → evaluated JS value). Pre-populated values are used directly; new symbols are compiled from `symbol_irs` and cached here.

```typescript
const symbolIRs = new Map<string, IR>(Object.entries(Module.symbols(mathModule)));
const symbolValues = new Map<string, any>();  // shared cache

const compiled = East.compile(fn, symbolValues, platform);
```

The `symbol_values` map serves as the **environment** — it defines the scope of shared mutable state. Functions compiled with the same `symbol_values` map share module-scoped mutable values (Refs, Arrays). Functions compiled with different maps are isolated. This is analogous to:

- **east-ui**: one `symbol_values` per application. All UI components share state.
- **e3**: one `symbol_values` per task execution. Different tasks are isolated.

### Automatic symbol collection via `toIR()`

`FunctionExpr.toIR(symbols?)` accepts an optional `Map<string, IR>` parameter. If provided, the function's transitive module dependencies are collected into it:

```typescript
const symbolIRs = new Map<string, IR>();
const ir = fn.toIR(symbolIRs);  // collects all referenced module symbols
// symbolIRs now contains all symbols needed to compile fn
```

`East.compile()` does this automatically — it creates the symbol IR map, calls `toIR()` to collect dependencies, then compiles with the collected symbols.

### Program

A **program** is a complete symbol table + an entry point. No formal `Program` class — just the pattern:

```typescript
// { main: IR, symbols: Map<string, IR> }
```

The entry point is just a function — typically a `FunctionIR`. The function's signature defines how the program is invoked:

- `(input: T) => U` — transformation (e3 dataflow tasks)
- `(args: Array<String>) => Integer` — CLI program
- `(request: HttpRequest) => HttpResponse` — HTTP handler

The `EastProgramType` East type captures this for serialization:

```ts
const EastProgramType = StructType({
    main: IRType,                                // the entry point function IR
    symbols: DictType(StringType, IRType),        // complete symbol table
    imports: DictType(StringType, EastTypeType),  // unresolved external dependencies
});
```

## Serialization

### Module format

The serialized form of a module (`EastModuleType` in `src/module.ts`):

```ts
const EastModuleType = StructType({
    symbols: DictType(StringType, IRType),        // symbol name → IR
    imports: DictType(StringType, EastTypeType),  // unresolved deps → expected type
});
```

This is a flat symbol table with explicit dependency metadata. No module name — naming is the packaging layer's concern (e3 object store, file system, etc.).

### Function serialization and symbols

Functions serialize as IR via BEAST2. `SymbolIR` nodes in the function body are preserved in the serialized form — they are "holes" that the linker fills at load time.

**The function does NOT include its symbol implementations.** The symbol table is a separate artifact. This is the C model: a `.o` file has unresolved symbols; libraries are separate; the linker combines them.

```typescript
// Serialize: function and module are separate blobs
const fnBlob = encodeBeast2For(FunctionType(...))(fn);
const moduleBlob = encodeBeast2For(EastModuleType)(module);

// Deserialize: provide symbols to the decoder
const symbols = decodeBeast2For(EastModuleType)(moduleBlob);
const fn = decodeBeast2For(FunctionType(...), { symbols: symbolIRs })(fnBlob);
```

For bundled distribution (e.g., sending to a browser), compose a struct:

```typescript
const BundleType = StructType({
    main: FunctionType([IntegerType], IntegerType),
    symbols: DictType(StringType, IRType),
});
```

The user controls what goes in the blob:
- **Lean (separate)**: function alone + module `.o` files alongside. Good for e3 (content-addressed dedup), CLI runners.
- **Fat (bundled)**: function + symbols as one struct. Good for east-ui (server → browser).
- **Partial**: server resolves user symbols, sends partially-linked IR to client. Client provides only native symbols. Works with the lenient compiler (unresolved symbols become runtime stubs).

## ExportRefAST — the deduplication mechanism

`East.export()` returns a fully transparent Expr whose internal AST is an `ExportRefAST`:

```
ExportRefAST = {
    ast_type: "ExportRef",
    type: EastType,              // the symbol value's type
    location: Location[],
    localName: String,           // symbol name, e.g. "pi"
    innerAst: AST,              // the value's actual AST
}
```

`ExportRefAST` is an **AST-only** node — it never appears in IR. It solves the timing problem: function body callbacks run eagerly (before `East.module()` assigns full symbol names), so the AST captures the local name.

When `East.module()` calls `ast_to_ir`, it provides an export registry (`Map<localName, { symbol: fullName, type }>`) as context:

- **Inside a module context**: `ExportRefAST` → `SymbolIR("{module}.{symbol}")`.
- **Outside a module context**: error — exports must be used within a module. Use `East.extern()` for standalone symbol references.

### Deduplication rules

1. **Only symbols (exports) are deduplicated.** Values wrapped in `East.export()` carry `ExportRefAST`. When they appear inside other exports' function bodies, `ast_to_ir` converts them to `SymbolIR`.
2. **Non-symbols are always inlined.** Plain values not wrapped in `East.export()` are embedded directly in the IR wherever they appear.
3. **Detection is by AST node type.** No `===` scanning, no structural comparison, no content hashing.
4. **Any East type can be a symbol.** The deduplication mechanism is type-agnostic.

## Linking

Linking resolves `SymbolIR` nodes to concrete values before execution.

### How the JS compiler resolves symbols

The JS compiler uses **late binding**: `SymbolIR` compiles to a dynamic lookup in `symbol_values` at call time. This allows symbols to be compiled and evaluated in any order — the memoization cache is populated lazily.

```typescript
// compile_internal for SymbolIR:
return (_ctx) => {
    const ret = symbol_values.get(name);
    if (ret === undefined) throw new EastError(`Symbol '${name}' is not available`);
    return ret;
};
```

`EastIR.compile()` pre-populates `symbol_values` by compiling each symbol's IR from `symbol_irs` before compiling the main function. Symbols that depend on other symbols are resolved transitively.

### Error handling

- **Missing symbol**: throws `EastError` at runtime when the symbol is accessed (not at compile time). This supports partial compilation for SSR and other two-phase workflows.
- **Self-references**: A module may reference its own symbols via SymbolIR. This works because function bodies are lazy — not evaluated during module construction.

## Distribution: Static Linking vs Separate Modules

When producing an artifact (e.g., an e3 package), the SDK has two strategies:

**Static linking** — recursively collect all referenced modules into a single flat symbol table. Simple and self-contained. `FunctionExpr.toIR(symbolIRs)` does this automatically.

**Separate modules** — store each module as an independent object. The runner composes the symbol table at load time. This enables:

- **Dedup within a package**: if task1 and task2 both use `math`, the module is stored once.
- **Dedup across packages**: in the e3 object store, content-addressed modules are shared.
- **Incremental updates**: changing one module only invalidates that module's object.

The `extern` distinction controls this: `East.extern()` symbols are never bundled — they are provided by the runtime. `East.export()` + `East.module()` symbols can be either bundled or kept separate.

## Runtime Environment Contract

The East language specification does not define packages, package management, or module resolution. These are concerns of the runtime environment (e.g., e3).

The specification requires only that:

1. **Uniqueness**: Symbol names resolve unambiguously within an execution context.
2. **Availability**: All symbols are available before execution begins.
3. **Linking errors**: Unresolved symbols produce errors when accessed at runtime.
4. **Type checking**: Resolved values have types compatible with what importers expect.

## Module Identity and Content Addressing

Modules are identified by **name** for linking purposes. In the object store, modules are content-addressed by **hash** (like all e3 objects). The environment (e3) enforces that only one version of a given name is active in a workspace.

## Package Publishing (e3 Context)

> This section describes how e3 uses the module system. It is not part of the East language specification.

When publishing modules as part of an e3 package:

1. The publisher provides a **package name** (e.g., `east-python`, `myapp`).
2. The publisher declares which modules are **public** and their names within the package namespace.
3. The full module identifier becomes `{package}.{module}` (e.g., `east-python.fs`).
4. Private/internal modules are bundled but not exposed in the package's public API.

Each e3 task has a manifest of required modules. The e3 runner composes the symbol table from these modules (plus runtime-provided native modules) before executing the task.

Native modules (effectful things like `fs`, `net`, database connectors) are provided by the runtime and referenced via `East.extern()`. The design of native module distribution is phase 2.

## Worked Examples

### Self-referencing symbols within a module

```typescript
const addOne = East.export("addOne",
    East.function([IntegerType], IntegerType, ($, x) => x.add(1n)));

const addTwo = East.export("addTwo",
    East.function([IntegerType], IntegerType, ($, x) => {
        return addOne(addOne(x));
    }));

const mathModule = East.module("math", addOne, addTwo);
```

**Step by step:**

1. `East.export("addOne", fn)` — creates a FunctionExpr whose internal AST is `ExportRefAST { localName: "addOne", innerAst: FunctionAST { ... } }`.

2. Inside `addTwo`'s body, `addOne(x)` calls the FunctionExpr. Since `addOne`'s AST is an `ExportRefAST`, the resulting `CallAST` has `ExportRefAST` as its function child.

3. `East.module("math", addOne, addTwo)` builds the export registry: `{ "addOne" → "math.addOne", "addTwo" → "math.addTwo" }`. Each export's `ExportRefAST` is unwrapped to get the inner AST.

4. During `ast_to_ir` with this registry, the `ExportRefAST` nodes inside `addTwo`'s function body are resolved to `SymbolIR("math.addOne")`.

5. The resulting symbol table:

```
"math.addOne" → FunctionIR { params: [x], body: Builtin("Add", [x, Value(1)]) }
"math.addTwo" → FunctionIR { params: [x], body:
    Call(Symbol("math.addOne"), [Call(Symbol("math.addOne"), [Variable(x)])])
}
```

Self-references work because function bodies are lazy — not evaluated during module construction.

### Cross-module references

```typescript
// math.ts
const add = East.export("add",
    East.function([IntegerType, IntegerType], IntegerType, ($, a, b) => a.add(b)));
export const mathModule = East.module("math", add);

// main.ts
import { mathModule } from "./math";

const process = East.export("process",
    East.function([IntegerType], IntegerType, ($, x) => {
        return mathModule.add(x, 1n);
    }));
const mainModule = East.module("main", process);
```

`mathModule.add` is a dynamic getter that returns an Expr wrapping `SymbolAST { name: "math.add", modules: Set{mathModule} }`. The `modules` field tracks dependencies automatically — when `ast_to_ir` processes this `SymbolAST`, the referenced modules are added to the dependency set.

### Compilation

```typescript
// East.compile handles symbol collection automatically
const symbolValues = new Map<string, any>();
const compiled = East.compile(
    East.function([IntegerType], IntegerType, ($, x) => mathModule.add(x, 1n)),
    symbolValues,
);
compiled(5n);  // 6n
```

## Future: Parametric Functions

When East adds user-defined parametric (generic) functions, modules will be able to export them. The linker's role expands slightly:

- A `SymbolIR` may include `type_args` for specialization.
- The linker specializes the generic function to a concrete type, memoizing the result.
- This is link-time monomorphization — the same approach used by C++ templates and Rust generics.

## Compliance Test Suite

The compliance test suite exports IR + symbols for testing on all East runtimes (east-py, east-c, etc.).

### Test data format

The exported test data includes an optional symbol table alongside the test IR:

```json
{
    "ir": { ... },                    // the test suite function IR
    "symbols": { "name": { ... } }   // symbol name → IR (default: {})
}
```

Runners that don't support symbols yet can ignore the `symbols` field — the lenient compiler stubs unresolved symbols.

### Test categories

**Compliance tests** (`test/module.spec.ts`): SymbolIR in the IR layer — functions with SymbolIR nodes compile and execute correctly when symbols are provided. Exported as IR for cross-runtime testing.

**SDK unit tests** (`src/module.spec.ts`): The TypeScript SDK interface — `East.export()`, `East.module()`, `East.extern()`, deduplication, dependency tracking, compilation. JS-only (not exported as IR).

**Examples** (`contrib/examples/module.ts`): Informal examples demonstrating module usage.

## Implementation Checklist

### IR layer (`src/ir.ts`)
- [x] `SymbolIR` type definition, `IR` union, homoiconic `IRType`

### Compiler (`src/compile.ts`)
- [x] `SymbolIR` handler: late-binding lookup in `symbol_values` map
- [x] `symbol_irs` and `symbol_values` maps threaded through `compile_internal`

### Analysis (`src/analyze.ts`)
- [x] `SymbolIR` handler (lenient: skip missing, type-check present)

### Serialization (`src/module.ts`)
- [x] `EastModuleType` — `{ symbols: Dict<String, IR>, imports: Dict<String, EastType> }`
- [x] `EastProgramType` — `{ main: IR, symbols: Dict<String, IR>, imports: Dict<String, EastType> }`

### AST layer (`src/ast.ts`, `src/ast_to_ir.ts`)
- [x] `SymbolAST` with `modules: Set` for automatic dependency tracking
- [x] `ExportRefAST` for intra-module deduplication
- [x] `exports` and `imports` fields in `ast_to_ir` `Ctx`
- [x] `ExportRefAST` → `SymbolIR` (in module context) or error (outside)
- [x] `SymbolAST` → `SymbolIR` with dependency collection

### SDK (`src/expr/block.ts`)
- [x] `East.export(name, value)` — validates, wraps in `ExportRefAST`, returns transparent Expr
- [x] `East.extern(module, name, type)` — creates `SymbolAST`-based Expr
- [x] `East.module(name, ...symbols)` — varargs, typed, with field getters
- [x] `Module` class with hidden metadata (`Module.name()`, `Module.symbols()`, `Module.dependencies()`)
- [x] `FunctionExpr.toIR(symbols?)` — collects transitive module dependencies

### SDK unit tests (`src/module.spec.ts`)
- [x] Export creation, transparency, callability
- [x] Export outside module context errors
- [x] Extern name construction and callability
- [x] Module construction, validation, field getters, metadata
- [x] Same-module dedup (ExportRef → SymbolIR)
- [x] Non-export inlining
- [x] Cross-module references and transitive dependencies
- [x] End-to-end compile + execute (same-module, cross-module, automatic collection)

### Compliance tests (`test/module.spec.ts`)
- [x] `describeEast` updated to support symbol tables
- [x] Symbol resolution (constants, functions, multiple symbols)
- [x] Nested function bodies referencing symbols
- [x] Missing symbol runtime error

## Ecosystem Integration

### CLI runners (east-node, east-py)

Both CLIs support `-l, --link <file>` to load `.beast2` module files at execution time. Module files contain serialized `EastModuleType` (a flat symbol table). The runner decodes modules, compiles symbol IRs, and passes `symbol_values` to the compiler.

### e3 (East Execution Engine)

Tasks automatically collect module dependencies via `fn.toIR(symbols)`. Module symbols are stored as a dataset at `.tasks.${name}.module` (typed as `EastModuleType`), and the command IR generates `-l` flags for the runner.

### east-ui (UI Dashboards)

`UIPageType` wraps a `UIComponentType` component tree with a `modules: Dict<String, IR>` field. The client uses **late-binding symbol resolution**:

1. Create empty `symbolValues` map
2. Decode `UIPageType` with `{ symbols: symbolValues }` — functions compile with reference to the map
3. Compile module IRs → populate `symbolValues`
4. All embedded functions (onClick, Reactive.Root) resolve symbols when called

This works because `SymbolIR` does runtime lookup (`symbol_values.get(name)`), not compile-time resolution. Module exports should be treated as constants or pure functions — mutable state mutations don't cross the server-client serialization boundary.

## Future: Beast2 Symbol Embedding

The current approach stores modules at the **type level** (wrapper types like `UIPageType`). An alternative for the future: embed the symbol table directly in the Beast2 binary format:

```
[magic] [type schema] [symbol table: Dict<String, IR>] [value]
```

This would make **any** Beast2 file containing functions with module dependencies self-contained, without requiring a wrapper type. The decoder would read the symbol table before the value, compile symbols eagerly, then decode the value with symbols available.

**Advantages**: No wrapper types needed. Any type with embedded functions automatically carries module dependencies. CLI runners could accept a single `.beast2` file instead of separate IR + module files.

**Trade-offs**: Requires a Beast2 format version bump and updates to encoders/decoders in all runtimes (TypeScript, Python, future Julia).

**When to consider**: If module-dependent functions appear in many different types beyond UI pages, or if the two-phase type-level pattern proves cumbersome. The late-binding approach used today avoids the two-phase problem, but format-level embedding would be even cleaner.
