# East Module System

This document describes the module system for East: how code is organized into modules, how modules reference each other, and how they are linked and executed.

> **Status**: Design specification. Modules are not yet implemented in the East codebase.

## Overview

East modules are **values**. A module is a named struct of **exports** — named values that can be referenced by other modules via `SymbolIR`. Each export is a "module global": a named value that the linker can resolve across module boundaries.

The key principles are:

1. **A module is a struct of exports** — each export is a named value of any East type (functions, constants, mutable state, etc.).
2. **Exports are module globals** — an export is a value that can be referenced by name from any function body within the same module or other modules, via `SymbolIR`.
3. **Non-export values are inlined** — values not marked as exports are embedded directly in the IR wherever they appear. No deduplication, no SymbolIR.
4. **Linking is value substitution** — the linker resolves `SymbolIR` nodes by substituting concrete values from a flat registry.
5. **Module IR constructs the export value** — the stored module contains IR that constructs its export struct. This is pure value construction (no platform calls, no effects). The IR is evaluated at load time to produce the module's value.

### Why modules are values (not evaluated code)

Earlier designs had modules evaluate arbitrary IR on first import (like Python or Node.js). The current design restricts module IR to pure value construction:

- No platform calls in module IR — side effects belong in program execution, not module loading.
- No ordering concerns — value construction is deterministic and order-independent.
- Runtimes are simpler — evaluate the IR (trivial struct/function assembly), register the value, done.
- East now supports closure serialization, so functions can carry their own captured state without module-level initialization.

## SymbolIR

`SymbolIR` is a new IR node — a named reference to an export value, resolved by the linker:

```
SymbolIR = variant<"Symbol", {
    type: EastTypeValue,         // expected type of the resolved value
    location: LocationValue[],   // source location for error reporting
    name: String,                // symbol name (opaque string, typically "module/export")
}>
```

`SymbolIR` is analogous to an unresolved symbol in a C object file. It says: "I need a value of this type, identified by this name. The linker will provide it."

### How it appears in IR

A function body that uses an imported module's `add` function:

```
// IR for: math.add(x, 1)
Call(
    Symbol("myapp/math.add"),       // resolves to the add function directly
    [Variable("x"), Value(1)]
)
```

Or equivalently, referencing the module struct and accessing a field:

```
Call(
    GetField(Symbol("myapp/math"), "add"),
    [Variable("x"), Value(1)]
)
```

Both forms are valid. The first is a direct symbol reference (flat namespace). The second accesses a field on a module-level symbol. The SDK and linker may use either form — the choice is a convention, not a language constraint. Symbol names are opaque strings.

### Relationship to PlatformIR

East currently uses `PlatformIR` for calling external functions. Platform functions are flat — identified by name with no namespacing:

```
PlatformIR = variant<"Platform", {
    type: EastType,
    location: LocationValue[],
    name: String,
    type_parameters: EastTypeValue[],
    arguments: IR[],
    async: Boolean,
    optional: Boolean,
}>
```

`PlatformIR` is a **direct call** to a named external function. `SymbolIR` is a **value reference** — it resolves to a value, and the caller uses standard IR nodes (`GetField`, `Call`) to interact with it.

The migration path:

- Runtime packages (e.g., `east-node-std`) currently provide platform function implementations. With modules, they additionally provide a module that exports a struct of those same functions.
- New code should prefer the module interface. `PlatformIR` remains available as the lower-level direct mechanism.
- `BuiltinIR` (language primitives like arithmetic, comparison, collection operations) is unrelated to modules. Builtins are intrinsic to the East language and are always available.

### Relationship to VariableIR

`SymbolIR` resembles `VariableIR` but is fundamentally different:

- **VariableIR** references a lexically-scoped local variable, resolved during AST-to-IR compilation.
- **SymbolIR** references an externally-provided value, resolved by the linker before execution.

A variable is part of the program's control flow. A symbol is a hole to be filled by the environment.

## Exports and Deduplication

### `East.export()` — named module globals

`East.export(name, value)` creates a named module global. The export carries its own name from the start, making SymbolIR generation straightforward — when the export appears inside another export's function body, the SDK emits a `SymbolIR` reference using the export's name.

```typescript
const pi = East.export("pi", 3.14159);
const add = East.export("add",
    East.function([FloatType, FloatType], FloatType, ($, a, b) => a.add(b)));

// helper is NOT exported — it will be inlined wherever it appears
const helper = East.function([FloatType], FloatType, ($, x) => x.multiply(2.0));

const compute = East.export("compute",
    East.function([FloatType], FloatType, ($, x) => {
        // pi → SymbolIR("myapp/math/pi")       (pi is a named export)
        // add → SymbolIR("myapp/math/add")      (add is a named export)
        // helper → inlined FunctionIR           (helper is NOT an export)
        return add(x, pi);
    }));

East.module("myapp/math", pi, add, compute);
```

`East.export()` returns an `ExportExpr` — a special AST node that carries the export name and wrapped value. When the SDK encounters an `ExportExpr` inside a function body during AST-to-IR conversion, it emits `SymbolIR("{module}/{export}")` instead of inlining the value. No `===` scanning needed — the export IS a distinct AST node type.

### Deduplication rules

1. **Only exports are deduplicated.** Values wrapped in `East.export()` are tracked by the SDK. When they appear inside other exports' function bodies, they are replaced with `SymbolIR` references.

2. **Non-exports are always inlined.** Plain values (not wrapped in `East.export()`) are embedded directly in the IR wherever they appear. If the same helper function is used in three places, it appears three times in the IR. This is the correct behavior for private implementation details.

3. **Detection is by export identity.** The SDK recognizes `ExportExpr` nodes during AST-to-IR conversion. Each export has a unique identity (the `ExportExpr` object) and a name. No structural comparison or content hashing.

4. **Any East type can be an export.** Functions, constants, mutable values (Ref, Array), structs, variants — all are valid exports. The deduplication mechanism is type-agnostic.

### Why only exports?

- **Explicit control** — the user decides what gets deduplicated. No magic heuristics.
- **Clear semantics** — exports are module globals with names. Non-exports are private implementation details with no identity beyond the IR they produce.
- **Mutable state works correctly** — an exported `Ref` or `Array` that appears in multiple function bodies resolves to the same value at runtime (via SymbolIR), preserving shared identity. A non-exported mutable value would be inlined, creating separate instances — different semantics.

## Module Structure

### StoredModule

The canonical on-disk representation of a module:

```ts
type StoredModuleType = StructType<{
    name: StringType,                                    // fully-qualified name, e.g. "myapp/math"
    type: EastTypeValueType,                             // type of the export struct
    ir: IRType,                                          // IR that constructs the export value
    imports: DictType<StringType, EastTypeValueType>,    // symbol name → expected type
}>;
```

Key fields:

- **name**: Unique identifier for this module within an execution environment. Opaque string.
- **type**: The East type of the module's export value (typically a struct type). Used for type checking at link time.
- **ir**: East IR that constructs the module's export value. This is pure value construction — struct assembly, function definitions, constant values, `NewArray`, `NewRef`, etc. No platform calls, no side effects. Evaluated at load time to produce the module's runtime value.
- **imports**: The symbols that function bodies within this module reference via `SymbolIR`. Maps symbol name to expected type. The linker uses this to verify all dependencies are available and type-compatible before execution.

### Why `ir` and not `value`

The module stores IR (an expression that constructs the export value) rather than a pre-serialized value because:

- Function values ARE their IR — serializing a function means serializing its `FunctionIR`. A struct of functions is a struct of IR nodes.
- Mutable values (Array, Ref, etc.) need fresh instances per load. The IR specifies how to create them (`NewArrayIR`, `NewRefIR`), and each load evaluates the IR to produce fresh instances.
- Self-referencing exports work correctly — function bodies contain `SymbolIR` nodes that reference the module's own exports. The module's IR constructs the struct, the runtime registers it, and function bodies resolve symbols against the registry.

The "evaluation" of module IR is trivial: construct a struct from literal values, functions, and fresh mutable instances. No loops, no branching, no platform calls. This is equivalent to C's `.data` section initialization — allocation + initialization of known values.

### Why `imports` is a manifest (not derived)

The `imports` dict could theoretically be derived by walking all function bodies and collecting `SymbolIR` nodes. We include it explicitly because:

- The linker can check dependency availability and type compatibility without deserializing all function bodies.
- It serves as documentation — you can inspect a module's dependencies without parsing its code.
- It enables fast dependency graph construction for build systems like e3.

The SDK generates the `imports` manifest automatically during module construction.

### Naming

Module names are opaque strings in a single flat namespace. East requires only that names are unique within an execution environment.

By convention, systems like e3 use `{package}/{module}` with `/` as a separator (e.g., `"east-node-std/console"`, `"acme-forecast/train"`). Symbol names for individual exports may use `.` as a field separator (e.g., `"myapp/math.add"`), but the East language does not parse or interpret these — they are opaque strings.

## Programs

A **program** is a module whose exported value is a `Function` (or a struct containing a main function). The function's signature defines how the program is invoked:

- `(input: T) => U` — transformation (e3 dataflow tasks)
- `(args: Array<String>) => Integer` — CLI program
- `(request: HttpRequest) => HttpResponse` — HTTP handler

The runner determines what signatures it supports and how to provide arguments. In e3, the primary pattern is transformation: a task reads input datasets, calls the program function, and writes the output.

```typescript
// A program module — exports a single function
const main = East.export("main",
    East.function([StringType], IntegerType, ($, input) => {
        // ... program logic ...
        return 0n;
    }));
East.module("myapp/main", main);
```

## Linking

Linking is the process of resolving `SymbolIR` nodes to concrete values before execution.

### The linker's job

1. Build a **symbol registry**: `Dict<String, Value>` — populated from stored modules and native runtime modules.
2. **Type check**: For each module's `imports`, verify the registry has an entry with a compatible type (structural equality via `isTypeEqual`).
3. **Resolve**: Replace `SymbolIR` nodes in function bodies with their concrete values from the registry.

### Resolution strategies

The linker may resolve symbols in different ways depending on the runtime:

**Static linking (pre-execution substitution):**
Walk all function bodies, replace `SymbolIR` nodes with the resolved value. The resulting IR has no unresolved symbols and can be compiled/executed without a registry. Enables further optimization (constant propagation, inlining).

**Runtime linking (registry lookup):**
Compile `SymbolIR` to a registry lookup (e.g., `__symbols["myapp/math.add"]` in JavaScript). Simpler to implement, no IR rewriting needed, but the registry must be available at runtime.

Both are valid. The East specification does not mandate a strategy.

### Link-time optimization

Since imports are known constant values, the linker can perform constant propagation:

```
// Before:
Call(Symbol("myapp/math.add"), [x, Value(1)])

// After symbol resolution:
Call(Value(<add function>), [x, Value(1)])

// After inlining (optional):
Builtin("Add", [x, Value(1)])
```

For module-as-struct references with `GetField`:

```
// Before:
Call(GetField(Symbol("myapp/math"), "add"), [x, Value(1)])

// After symbol resolution + constant propagation:
Call(Value(<add function>), [x, Value(1)])
```

Standard constant propagation — no special LTO mechanism needed.

### Error handling

- **Missing symbol**: If a symbol name is not in the registry, the linker MUST produce an error before execution begins.
- **Type mismatch**: If a resolved value's type doesn't match the expected type in `imports`, the linker MUST produce an error before execution begins.
- **Self-references**: A module may reference its own exports via SymbolIR. This is valid because function bodies are lazy — they are not evaluated during module construction. The runtime registers the module's value before any function bodies execute.

## Runtime Environment Contract

The East language specification does not define packages, package management, or module resolution. These are concerns of the runtime environment (e.g., e3).

The specification requires only that:

1. **Uniqueness**: The environment MUST ensure that symbol names resolve unambiguously within an execution context.
2. **Availability**: The environment MUST ensure that all symbols are available before execution begins. This includes native modules which MUST be pre-registered by the runtime.
3. **Linking errors**: If a symbol cannot be resolved, the environment MUST produce an error during linking, prior to execution.
4. **Type checking**: The environment MUST verify that resolved values have types compatible with what importers expect (structural equality).

The symbol registry is a flat `Dict<String, Value>` keyed by symbol name.

## Module Identity and Content Addressing

Modules are identified by **name** (a string) for linking purposes.

In the object store, modules are content-addressed by **hash** (like all e3 objects). This means:

- Two modules with identical content share the same hash and are stored once.
- Two modules with the same name but different content are different objects — the environment (e3) enforces that only one version of a given name is active in a workspace.

## Package Publishing (e3 Context)

> This section describes how e3 uses the module system. It is not part of the East language specification.

When publishing a module as part of an e3 package:

1. The publisher provides a **package name** (e.g., `east-python`, `myapp`).
2. The publisher declares which modules are **public** and their names within the package namespace.
3. The full module identifier becomes `{package}/{module}` (e.g., `east-python/fs`).
4. Private/internal modules are bundled but not exposed in the package's public API.

See the e3 design documents for the full package object structure and deployment model.

## TypeScript SDK API

### Creating exports

`East.export(name, value)` creates a named module global:

```typescript
import { East, IntegerType, FloatType, FunctionType, RefType } from "@elaraai/east";

// Function export
const add = East.export("add",
    East.function([IntegerType, IntegerType], IntegerType, ($, a, b) => a.add(b)));

// Constant export
const pi = East.export("pi", 3.14159);

// Mutable state export
const counter = East.export("counter", East.ref(0n));
```

Each export carries its own name. This name becomes part of the symbol name when the export is assigned to a module.

### Creating modules

`East.module(name, ...exports)` creates a module from named exports (varargs):

```typescript
const mathModule = East.module("myapp/math", add, pi, counter);
```

This follows the same pattern as `e3.package(name, version, ...items)` — each item already carries its own name and dependencies are tracked automatically.

`East.module()` returns a module descriptor that doubles as an Expr — accessing fields on it produces `SymbolIR`-based expressions for use in other modules.

### Cross-module references

```typescript
// math.ts
export const mathModule = East.module("myapp/math", add, pi);

// main.ts
import { mathModule } from "./math";

const process = East.export("process",
    East.function([IntegerType], IntegerType, ($, x) => {
        return mathModule.add(x, 1n);
        // Generates: Call(Symbol("myapp/math/add"), [x, Value(1)])
    }));
East.module("myapp/main", process);
```

Dependencies are tracked automatically — the SDK collects `SymbolIR` references from function body IR and builds the `imports` manifest. No explicit `$.import()` needed. The TypeScript `import` IS the East import.

### External (runtime-provided) modules

For modules that don't exist as TypeScript values (provided by the runtime at link time):

```typescript
const fs = East.extern("east-node-std/fs", FsType);
// fs is an Expr wrapping SymbolIR("east-node-std/fs")
// fs.readFile(path) generates GetField(SymbolIR, "readFile") + Call

const process = East.export("process",
    East.function([StringType], IntegerType, ($, path) => {
        const data = $.let(fs.readFile(path));
        return data.length();
    }));
```

### Module operations

A module descriptor supports:

1. **Export to .o file** — serialize the module's IR and metadata (AST → IR conversion, no JS compilation).
2. **Compile** — compile the module's IR to executable JavaScript, given a symbol registry for linking.
3. **Field access** — `mathModule.add` returns a typed Expr for use in other expressions (generates SymbolIR-based IR).
4. **ES module export** — standard TypeScript `export` for use across `.ts` files.

### How the SDK generates IR

When `East.module("myapp/math", add, pi, compute)` is called:

1. Collect all `ExportExpr` items. Each carries its own name (e.g., `"add"`, `"pi"`, `"compute"`).
2. Assign full symbol names by combining the module name with each export name: `"myapp/math/add"`, `"myapp/math/pi"`, `"myapp/math/compute"`.
3. For each export, convert its Expr/AST to IR. During AST-to-IR conversion, when an `ExportExpr` node is encountered as a sub-expression, emit `SymbolIR("{module}/{export}")` instead of inlining the value.
4. The top-level IR is a `StructIR` assembling all exports by name.
5. Walk all IR trees, collect `SymbolIR` references → build the `imports` manifest.
6. Return `{ name, type, ir, imports }`.

### Worked example: self-referencing exports

A module where one export references another:

```typescript
const addOne = East.export("addOne",
    East.function([IntegerType], IntegerType, ($, x) => x.add(1n)));

const addTwo = East.export("addTwo",
    East.function([IntegerType], IntegerType, ($, x) => {
        // addOne is an ExportExpr — the SDK emits SymbolIR instead of inlining
        return addOne(addOne(x));
    }));

const mathModule = East.module("myapp/math", addOne, addTwo);
```

The resulting IR for module `"myapp/math"`:

```
StructIR {
    fields: [
        { name: "addOne", value: FunctionIR { params: [x], body: Builtin("Add", [x, Value(1)]) } },
        { name: "addTwo", value: FunctionIR { params: [x], body:
            Call(Symbol("myapp/math/addOne"),
                [Call(Symbol("myapp/math/addOne"), [Variable(x)])])
        } },
    ]
}
```

`addOne`'s IR appears once (as the "addOne" field). `addTwo` references it via `SymbolIR("myapp/math/addOne")`.

At runtime:
1. The module's IR is evaluated → creates a struct with `addOne` and `addTwo` fields.
2. The struct is registered in the symbol registry as `"myapp/math"`, and each export is registered individually as `"myapp/math/addOne"`, `"myapp/math/addTwo"`.
3. When `addTwo(5n)` is called, `Symbol("myapp/math/addOne")` resolves to the `addOne` function in the registry → calls it → returns the result.

Self-references work because function bodies are lazy — they are not evaluated during struct construction. By the time a function body executes, all exports are registered.

## Future: Parametric Functions

When East adds user-defined parametric (generic) functions, modules will be able to export them. The linker's role expands slightly:

- A `SymbolIR` may include `type_args` for specialization: `Symbol("math.add", type_args: [FloatType])`.
- The linker specializes the generic function to a concrete type, memoizing the result.
- This is link-time monomorphization — the same approach used by C++ templates and Rust generics.

The module structure doesn't change. The function value in the module is parametric; the linker produces concrete instantiations on demand.

## Homoiconic IR Type

`SymbolIR` must be added to the `IRType` definition in `src/ir.ts` so it can be serialized as an East value:

```ts
// Added to the IRType RecursiveType variant:
Symbol: StructType({
    type: EastTypeType,
    location: ArrayType(LocationType),
    name: StringType,
}),
```

This extends the existing `IRType` which already includes all other IR nodes (`Value`, `Variable`, `Call`, `Platform`, etc.).

## Implementation Checklist

### IR layer (`src/ir.ts`)
- [ ] Add `SymbolIR` type definition
- [ ] Add `Symbol` to the `IR` union type
- [ ] Add `Symbol` variant to the homoiconic `IRType`

### Compiler (`src/compile.ts`)
- [ ] Handle `SymbolIR` in the JS compiler (emit registry lookup or resolved value)
- [ ] Accept a symbol registry parameter in `compile_internal`

### Analysis (`src/analyze.ts`)
- [ ] Handle `SymbolIR` in IR analysis (no async propagation needed — symbols are values, not calls)

### Serialization
- [ ] Handle `Symbol` variant in BEAST2 IR encoder/decoder (automatic via `IRType`)
- [ ] Handle `Symbol` variant in East text format
- [ ] Handle `Symbol` variant in JSON format

### Fluent interface (`src/expr/`)
- [ ] Add `ExportExpr` AST node type (carries export name + wrapped value)
- [ ] Add `East.export(name, value)` — creates named `ExportExpr`
- [ ] Add `East.extern(name, type)` — creates SymbolIR-based Expr for runtime-provided modules
- [ ] Add `East.module(name, ...exports)` — constructs module from varargs exports
- [ ] Module descriptor acts as Expr (field access returns SymbolIR-based expressions)
- [ ] Wire up SymbolIR generation during AST-to-IR conversion (emit SymbolIR when `ExportExpr` encountered as sub-expression)

### Testing (`test/`)
- [ ] SymbolIR round-trip through BEAST2
- [ ] Module construction via SDK
- [ ] Export deduplication (same export referenced in multiple function bodies)
- [ ] Non-export inlining (helper functions remain inlined)
- [ ] Cross-module references via module descriptor field access
- [ ] External references via `East.extern()`
- [ ] Linking with resolved symbols
- [ ] Type checking at link time
- [ ] Error cases: missing symbol, type mismatch
- [ ] Mutable exports (Ref, Array) with shared identity
