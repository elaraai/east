# Generic Platform Functions Design

This document describes the design for adding generic (polymorphic) platform functions to East, enabling platform authors to define type-parameterized functions similar to how builtins work.

## Motivation

Currently, platform functions have fixed concrete types:

```typescript
const log = East.platform("log", [StringType], NullType);
```

This forces users to either:
1. Define separate platform functions for each type (`logString`, `logInteger`, etc.)
2. Wrap `East.platform` in a TypeScript generic function to simulate polymorphism:

```typescript
export const alns_optimize = <S extends EastType>(solutionType: S) =>
    East.platform(
        "alns_optimize",
        [
            solutionType,
            FunctionType([solutionType], FloatType),
            ArrayType(FunctionType([solutionType], solutionType)),
            ArrayType(FunctionType([solutionType], solutionType)),
            ALNSConfigType,
        ],
        ALNSResultType(solutionType)
    );
```

The second approach works but:
- Creates a new platform function definition for each type instantiation
- Doesn't carry type parameters through to the IR
- Implementation cannot access type information at runtime

Builtins already support type parameters via `BuiltinIR.type_parameters`. This design extends the same capability to platform functions.

## API Design

### `East.genericPlatform`

A single variadic function that works with any number of type parameters, using mapped tuple types (similar to how `East.function` handles variable input types):

```typescript
function genericPlatform<
  const TParams extends readonly string[],
  const Inputs extends readonly EastType[],
  Output extends EastType
>(
  name: string,
  typeParams: TParams,
  inputsFn: (...placeholders: Placeholders<TParams>) => Inputs,
  outputFn: (...placeholders: Placeholders<TParams>) => Output
): GenericPlatformCallable<TParams, Inputs, Output>
```

The `inputsFn` and `outputFn` receive indexed placeholder types that are mapped from the `typeParams` array. These placeholders are substituted with actual types at call sites, enabling full TypeScript type safety.

**Simple example (1 type parameter):**

```typescript
const log = East.genericPlatform(
  "log",
  ["T"],
  (T) => [T],
  (_T) => NullType
);

// User calls with explicit type first, then value args:
log(StringType, myStringExpr)
log(IntegerType, myIntegerExpr)
```

**Multiple type parameters (2 type parameters):**

```typescript
const map = East.genericPlatform(
  "map",
  ["T", "U"],
  (T, U) => [T, FunctionType([T], U)],
  (_T, U) => U
);

// Call:
map(StringType, IntegerType, myString, myMapperFn)
```

**Complex computed output type:**

```typescript
const alns_optimize = East.genericPlatform(
  "alns_optimize",
  ["S"],
  (S) => [
    S,                                           // initial_solution: S
    FunctionType([S], FloatType),                // objective: S -> Float
    ArrayType(FunctionType([S], S)),             // destroy_operators: Array<S -> S>
    ArrayType(FunctionType([S], S)),             // repair_operators: Array<S -> S>
    ALNSConfigType,
  ],
  (S) => ALNSResultType(S)
);

// Call:
alns_optimize(MySolutionType, initial, objective, destroyOps, repairOps, config)
```

### Type Safety

TypeScript provides **full call-site type safety** using indexed placeholder types with mapped tuples (similar to how `East.function` handles variable input types). When you call `log(StringType, myIntegerExpr)`, TypeScript produces an error because `Expr<IntegerType>` is not assignable to a parameter expecting `Expr<StringType>`.

This is achieved through:

1. **Indexed placeholder types** - `Placeholder<K>` branded by position index
2. **Mapped tuple types** - convert `typeParams` array to placeholder types for callbacks
3. **Substitution types** - replace `Placeholder<K>` with `ActualTypes[K]` at call sites
4. **`const` type parameter** modifier to infer narrow tuple types (no `as const` needed)

#### Indexed Placeholder Types

Unlike fixed `T_`, `U_`, `V_` types, we use a single `Placeholder<K>` type branded by its index:

```typescript
// Placeholder type branded by its index position
declare const PlaceholderBrand: unique symbol;
type Placeholder<K extends PropertyKey> = EastType & {
  readonly [PlaceholderBrand]: K
};

// Map type params array to placeholder types
type Placeholders<TParams extends readonly string[]> = {
  [K in keyof TParams]: TParams[K] extends string ? Placeholder<K> : never
};

// Example:
// Placeholders<["T", "U"]> = [Placeholder<0>, Placeholder<1>]
```

#### Substitution Types

These replace `Placeholder<K>` with `ActualTypes[K]`. The `[Type] extends [X]` pattern prevents TypeScript from distributing over union types:

```typescript
// Substitute all placeholders with actual types from the tuple
type SubstituteAll<Type, ActualTypes extends readonly EastType[]> =
  [Type] extends [Placeholder<infer K>]
    ? K extends keyof ActualTypes
      ? ActualTypes[K]
      : Type
    : [Type] extends [FunctionType<infer I extends EastType[], infer O extends EastType>]
      ? FunctionType<SubstituteAllArray<I, ActualTypes>, SubstituteAll<O, ActualTypes>>
      : [Type] extends [ArrayType<infer E extends EastType>]
        ? ArrayType<SubstituteAll<E, ActualTypes>>
        : Type;

type SubstituteAllArray<Types extends readonly EastType[], ActualTypes extends readonly EastType[]> = {
  [K in keyof Types]: Types[K] extends EastType ? SubstituteAll<Types[K], ActualTypes> : never
};
```

#### Function Signature

The `const` type parameter modifier (TypeScript 5.0+) ensures narrow type inference without requiring `as const`:

```typescript
// The callable type applies substitution at call time
type GenericPlatformCallable<
  TParams extends readonly string[],
  Inputs extends readonly EastType[],
  Output extends EastType
> = <ActualTypes extends { [K in keyof TParams]: EastType }>(
  ...args: [...ActualTypes, ...ToExprArgs<SubstituteAllArray<Inputs, ActualTypes>>]
) => ExprType<SubstituteAll<Output, ActualTypes>>;

function genericPlatform<
  const TParams extends readonly string[],
  const Inputs extends readonly EastType[],
  Output extends EastType
>(
  name: string,
  typeParams: TParams,
  inputsFn: (...placeholders: Placeholders<TParams>) => Inputs,
  outputFn: (...placeholders: Placeholders<TParams>) => Output
): GenericPlatformCallable<TParams, Inputs, Output>
```

#### Example: Type Safety in Action

```typescript
// Define log: (T) => [T] -> Null
const log = genericPlatform(
  "log",
  ["T"],
  (t) => [t],      // Inputs inferred as [Placeholder<0>]
  (_t) => NullType
);

declare const stringExpr: Expr<StringType>;
declare const intExpr: Expr<IntegerType>;

// Good: types match
log(StringType, stringExpr);  // OK

// Bad: type mismatch - TypeScript ERROR
log(StringType, intExpr);
// Error: Argument of type 'Expr<IntegerType>' is not assignable to
//        parameter of type 'string | Expr<StringType>'
```

#### Multiple Type Parameters

```typescript
// Define map: (T, U) => [T, (T) -> U] -> U
const map = genericPlatform(
  "map",
  ["T", "U"],
  (t, u) => [t, FunctionType([t], u)],  // Inputs: [Placeholder<0>, FunctionType<[Placeholder<0>], Placeholder<1>>]
  (_t, u) => u
);

declare const strToIntFn: Expr<FunctionType<[StringType], IntegerType>>;
declare const intToStrFn: Expr<FunctionType<[IntegerType], StringType>>;

// Good: all types match
map(StringType, IntegerType, stringExpr, strToIntFn);  // OK

// Bad: wrong first arg type
map(StringType, IntegerType, intExpr, strToIntFn);  // ERROR

// Bad: wrong function type (output doesn't match U)
map(StringType, IntegerType, stringExpr, intToStrFn);  // ERROR

// Bad: function input doesn't match T
map(StringType, IntegerType, stringExpr, intToIntFn);  // ERROR
```

#### Return Type Inference

Return types are also correctly substituted:

```typescript
// wrap: (T) => [T] -> Array<T>
const wrap = genericPlatform(
  "wrap",
  ["T"],
  (t) => [t],
  (t) => ArrayType(t)
);

// Return type is correctly inferred as ExprType<ArrayType<IntegerType>>
const wrapped = wrap(IntegerType, intExpr);
const _typeCheck: ExprType<ArrayType<IntegerType>> = wrapped;  // OK
```

### Calling Convention

When calling a generic platform function, type parameters are passed first (in declaration order), followed by value arguments:

```
genericPlatformFn(Type1, Type2, ..., TypeN, arg1, arg2, ..., argM)
                  ^^^^^^^^^^^^^^^^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^
                  N type parameters           M value arguments
```

This mirrors the pattern used by builtins like `decodeBeast`:

```typescript
// From blob.ts - user passes type explicitly
blob.decodeBeast(ArrayType(IntegerType), 'v2')
```

### `.implement` Method

The implementation receives type parameters as a factory function:

```typescript
const log = East.genericPlatform(
  "log",
  ["T"],
  (T) => [T],
  (_T) => NullType
);

// Implementation receives type params, returns the actual evaluator
log.implement((T: EastTypeValue) => (value: any) => {
  console.log(printFor(T)(value));
  return null;
});

// Multiple type params:
const map = East.genericPlatform("map", ["T", "U"], ...);

map.implement((T: EastTypeValue, U: EastTypeValue) => (value: any, fn: any) => {
  return fn(value);
});
```

This mirrors the `builtin_evaluators` pattern in `compile.ts`:

```typescript
// From compile.ts
Print: (_location, _platformDef, T: EastTypeValue) => {
  return printFor(T);
},
```

The `.implement` method returns a `PlatformFunction` where `fn` is the factory.

## IR Changes

### PlatformIR

Add `type_parameters` field to `PlatformIR` in `src/ir.ts:264-270`:

```typescript
// Current (src/ir.ts:264-270):
export type PlatformIR = variant<"Platform", {
  type: EastTypeValue,
  location: LocationValue,
  name: string,
  arguments: any[], // IR[]
  async: boolean,
}>;

// After:
export type PlatformIR = variant<"Platform", {
  type: EastTypeValue,
  location: LocationValue,
  name: string,
  type_parameters: EastTypeValue[],  // NEW - mirrors BuiltinIR (ir.ts:260)
  arguments: any[], // IR[]
  async: boolean,
}>;
```

For reference, `BuiltinIR` already has this field (src/ir.ts:256-262):
```typescript
export type BuiltinIR = variant<"Builtin", {
  type: EastTypeValue,
  location: LocationValue,
  builtin: BuiltinName,
  type_parameters: EastTypeValue[],  // <-- We mirror this
  arguments: any[], // IR[]
}>;
```

### PlatformAST

Add `type_parameters` field to `PlatformAST` in `src/ast.ts:301-308`:

```typescript
// Current (src/ast.ts:301-308):
export type PlatformAST = {
  ast_type: "Platform",
  type: EastType,
  location: Location,
  name: string,
  arguments: AST[],
  async: boolean,
};

// After:
export type PlatformAST = {
  ast_type: "Platform",
  type: EastType,
  location: Location,
  name: string,
  type_parameters: EastType[],  // NEW
  arguments: AST[],
  async: boolean,
};
```

## Platform Function Definition Changes

### PlatformFunction Type

Update `PlatformFunction` in `src/platform.ts:10-21`:

```typescript
// Current (src/platform.ts:10-21):
export type PlatformFunction = {
    name: string,
    inputs: EastTypeValue[],
    output: EastTypeValue,
    type: 'sync' | 'async',
    fn: (...args: any) => any;
}

// After:
export type PlatformFunction = {
  name: string,
  inputs: EastTypeValue[],
  output: EastTypeValue,
  type: 'sync' | 'async',
  fn: (...args: any) => any;
  // NEW fields for generic platform functions:
  type_parameters?: string[];  // ["T", "U"] or undefined for non-generic
  inputsFn?: (...typeParams: EastTypeValue[]) => EastTypeValue[];
  outputFn?: (...typeParams: EastTypeValue[]) => EastTypeValue;
}
```

**Design decision**: Rather than changing the signature format to use string references (like `Builtins` in `builtins.ts`), we keep `inputs`/`output` as concrete types for non-generic functions and add optional `inputsFn`/`outputFn` callbacks for generic functions. This maintains backwards compatibility.

For non-generic platform functions:
- `type_parameters` is undefined or `[]`
- `inputs`/`output` are concrete `EastTypeValue`
- `fn` is the evaluator directly

For generic platform functions:
- `type_parameters` contains the parameter names (for error messages and debugging)
- `inputsFn`/`outputFn` compute concrete types from resolved type params
- `fn` is a factory that receives type params and returns the evaluator

## Expression Layer Changes

### `src/expr/block.ts`

The expression layer uses indexed placeholder types with mapped tuples for full call-site type safety. A single `genericPlatform` function works with any number of type parameters, similar to how `East.function` handles variable input types.

#### Indexed Placeholder Types

```typescript
// Placeholder type branded by its index position
declare const PlaceholderBrand: unique symbol;
type Placeholder<K extends PropertyKey> = EastType & {
  readonly [PlaceholderBrand]: K
};

// Map type params array to placeholder types
type Placeholders<TParams extends readonly string[]> = {
  [K in keyof TParams]: TParams[K] extends string ? Placeholder<K> : never
};

// Create runtime placeholder values from type params
function createPlaceholders<TParams extends readonly string[]>(
  typeParams: TParams
): Placeholders<TParams> {
  return typeParams.map((_, i) => ({ type: "Null" } as any)) as Placeholders<TParams>;
}
```

#### Substitution Types

```typescript
// Map array of types to SubtypeExprOrValue for call arguments
type ToExprArgs<Types extends readonly EastType[]> = {
  [K in keyof Types]: Types[K] extends EastType ? SubtypeExprOrValue<Types[K]> : never
};

// Substitute all placeholders with actual types from the tuple
type SubstituteAll<Type, ActualTypes extends readonly EastType[]> =
  [Type] extends [Placeholder<infer K>]
    ? K extends keyof ActualTypes
      ? ActualTypes[K]
      : Type
    : [Type] extends [FunctionType<infer I extends EastType[], infer O extends EastType>]
      ? FunctionType<SubstituteAllArray<I, ActualTypes>, SubstituteAll<O, ActualTypes>>
      : [Type] extends [ArrayType<infer E extends EastType>]
        ? ArrayType<SubstituteAll<E, ActualTypes>>
        : Type;

type SubstituteAllArray<Types extends readonly EastType[], ActualTypes extends readonly EastType[]> = {
  [K in keyof Types]: Types[K] extends EastType ? SubstituteAll<Types[K], ActualTypes> : never
};
```

#### `genericPlatform` - Single Variadic Function

```typescript
// Callable type with substitution at call time
type GenericPlatformCallable<
  TParams extends readonly string[],
  Inputs extends readonly EastType[],
  Output extends EastType
> = <ActualTypes extends { [K in keyof TParams]: EastType }>(
  ...args: [...ActualTypes, ...ToExprArgs<SubstituteAllArray<Inputs, ActualTypes>>]
) => ExprType<SubstituteAll<Output, ActualTypes>>;

export function genericPlatform<
  const TParams extends readonly string[],
  const Inputs extends readonly EastType[],
  Output extends EastType
>(
  name: string,
  typeParams: TParams,
  inputsFn: (...placeholders: Placeholders<TParams>) => Inputs,
  outputFn: (...placeholders: Placeholders<TParams>) => Output
): GenericPlatformCallable<TParams, Inputs, Output> & {
  implement: (factory: (...typeParams: EastTypeValue[]) => (...args: any[]) => any) => PlatformFunction;
} {
  const numTypeParams = typeParams.length;
  const placeholders = createPlaceholders(typeParams);

  const fn = (...args: any[]): any => {
    // First N args are type parameters
    const typeArgs = args.slice(0, numTypeParams) as EastType[];
    const valueArgs = args.slice(numTypeParams);

    // Validate type args are EastTypes
    for (let i = 0; i < numTypeParams; i++) {
      if (!isEastType(typeArgs[i])) {
        throw new Error(
          `Generic platform function '${name}' expects type parameter ${i + 1} ` +
          `(${typeParams[i]}) to be an EastType`
        );
      }
    }

    // Compute concrete types using the callbacks
    const inputTypes = inputsFn(...(typeArgs as any));
    const outputType = outputFn(...(typeArgs as any));

    // Validate value args count
    if (valueArgs.length !== inputTypes.length) {
      throw new Error(
        `Generic platform function '${name}' expects ${inputTypes.length} ` +
        `value arguments, got ${valueArgs.length}`
      );
    }

    // Convert value args to AST
    const argAsts: AST[] = valueArgs.map((arg, i) => {
      return valueOrExprToAstTyped(arg, inputTypes[i]!);
    });

    // Create PlatformAST with type_parameters
    return fromAst({
      ast_type: "Platform",
      type: outputType,
      location: get_location(2),
      name: name,
      type_parameters: typeArgs,
      arguments: argAsts,
      async: false,
    });
  };

  fn.implement = (
    factory: (...typeParams: EastTypeValue[]) => (...args: any[]) => any
  ): PlatformFunction => {
    return {
      name,
      type_parameters: [...typeParams],
      inputs: [],  // Computed at call time
      output: { type: "Null" },  // Computed at call time
      inputsFn: (...tps) => inputsFn(...(tps as any)).map(toEastTypeValue),
      outputFn: (...tps) => toEastTypeValue(outputFn(...(tps as any))),
      type: 'sync' as const,
      fn: factory,
    };
  };

  return fn as any;
}
```

#### `asyncGenericPlatform`

Async variant follows the same pattern but sets `async: true` in the AST and uses async factory functions:

```typescript
export function asyncGenericPlatform<
  const TParams extends readonly string[],
  const Inputs extends readonly EastType[],
  Output extends EastType
>(
  name: string,
  typeParams: TParams,
  inputsFn: (...placeholders: Placeholders<TParams>) => Inputs,
  outputFn: (...placeholders: Placeholders<TParams>) => Output
): AsyncGenericPlatformCallable<TParams, Inputs, Output> & {
  implement: (factory: (...typeParams: EastTypeValue[]) => (...args: any[]) => Promise<any>) => PlatformFunction;
}
```

### Type Signature Representation

**Recommendation: Keep callbacks in PlatformFunction**

Rather than trying to serialize type parameter references in the `inputs`/`output` arrays, we keep the callbacks (`inputsFn`/`outputFn`) in `PlatformFunction`. This avoids complexity in type representation:

```typescript
export type PlatformFunction = {
  name: string,
  type_parameters: string[],
  inputsFn: (...params: EastTypeValue[]) => EastTypeValue[],  // Computes concrete types
  outputFn: (...params: EastTypeValue[]) => EastTypeValue,
  type: 'sync' | 'async',
  fn: (...args: any) => any;
}
```

This is simpler - the signature is always computed at call sites, avoiding complexity in type representation.

## AST to IR Conversion

Update `src/ast_to_ir.ts` Platform handling (currently at lines 194-205).

**Current implementation** (ast_to_ir.ts:194-205):
```typescript
} else if (ast.ast_type === "Platform") {
  if (ctx.async === false && ast.async === true) {
    throw new Error(`Async platform call not allowed outside async function at ${printLocation(ast.location)}`);
  }

  return variant("Platform", {
    type: toEastTypeValue(ast.type),
    location: toLocationValue(ast.location),
    name: ast.name,
    arguments: ast.arguments.map(ast => ast_to_ir(ast, ctx)),
    async: ast.async,
  });
}
```

**Updated implementation**:
```typescript
} else if (ast.ast_type === "Platform") {
  if (ctx.async === false && ast.async === true) {
    throw new Error(`Async platform call not allowed outside async function at ${printLocation(ast.location)}`);
  }

  // NEW: Convert type parameters from EastType to EastTypeValue
  const typeParamsIR = (ast.type_parameters ?? []).map(tp => toEastTypeValue(tp));

  return variant("Platform", {
    type: toEastTypeValue(ast.type),
    location: toLocationValue(ast.location),
    name: ast.name,
    type_parameters: typeParamsIR,  // NEW
    arguments: ast.arguments.map(ast => ast_to_ir(ast, ctx)),
    async: ast.async,
  });
}
```

**Key change**: Convert `ast.type_parameters` (EastType[]) to IR representation (EastTypeValue[]) using `toEastTypeValue`.

## Analysis Phase

### PlatformDefinition Type

Update `PlatformDefinition` in `src/analyze.ts:44-49`:

```typescript
// Current (analyze.ts:44-49):
export type PlatformDefinition = {
  name: string,
  inputs: EastTypeValue[],
  output: EastTypeValue,
  type: 'sync' | 'async',
};

// After:
export type PlatformDefinition = {
  name: string,
  inputs: EastTypeValue[],
  output: EastTypeValue,
  type: 'sync' | 'async',
  // NEW fields for generic platform functions:
  type_parameters?: string[];
  inputsFn?: (...typeParams: EastTypeValue[]) => EastTypeValue[];
  outputFn?: (...typeParams: EastTypeValue[]) => EastTypeValue;
};
```

Note: `PlatformDefinition` (analyze.ts) mirrors `PlatformFunction` (platform.ts) but without the `fn` implementation. Both need the same generic fields.

### Platform Handling

Update `src/analyze.ts` Platform handling (currently at lines 402-470).

**Current implementation** (analyze.ts:402-470):
```typescript
else if (node.type === "Platform") {
  // Look up platform function
  const platformFn = platformMap.get(node.value.name);
  if (!platformFn) {
    throw new Error(`Platform function '${node.value.name}' not found ...`);
  }

  // Validate argument count
  if (node.value.arguments.length !== platformFn.inputs.length) { ... }

  // Visit all arguments, check types against platformFn.inputs[i]
  for (let i = 0; i < node.value.arguments.length; i++) {
    const expectedType = platformFn.inputs[i]!;
    // ... validate exact type match
  }

  // Validate return type matches
  if (!isTypeValueEqual(node.value.type, platformFn.output)) { ... }

  // ...
}
```

**Updated implementation** with generic support:
```typescript
else if (node.type === "Platform") {
  const platformFn = platformMap.get(node.value.name);
  if (!platformFn) {
    throw new Error(`Platform function '${node.value.name}' not found ...`);
  }

  // NEW: Handle generic platform functions
  const typeParams = node.value.type_parameters ?? [];
  const expectedTypeParamCount = platformFn.type_parameters?.length ?? 0;

  if (typeParams.length !== expectedTypeParamCount) {
    throw new Error(
      `Platform function '${node.value.name}' expects ${expectedTypeParamCount} ` +
      `type parameters, got ${typeParams.length}`
    );
  }

  // NEW: Compute concrete input/output types by substituting type parameters
  let inputTypes: EastTypeValue[];
  let outputType: EastTypeValue;

  if (expectedTypeParamCount > 0 && platformFn.inputsFn && platformFn.outputFn) {
    // Generic platform function - use callbacks to compute types
    inputTypes = platformFn.inputsFn(...typeParams);
    outputType = platformFn.outputFn(...typeParams);
  } else {
    // Non-generic - use stored concrete types
    inputTypes = platformFn.inputs;
    outputType = platformFn.output;
  }

  // Validate argument count (now using computed inputTypes)
  if (node.value.arguments.length !== inputTypes.length) {
    throw new Error(
      `Platform function '${node.value.name}' expects ${inputTypes.length} ` +
      `arguments, got ${node.value.arguments.length}`
    );
  }

  // Validate argument types (using computed inputTypes)
  const analyzedArgs: AnalyzedIR[] = [];
  for (let i = 0; i < node.value.arguments.length; i++) {
    const arg = node.value.arguments[i]!;
    const argAnalyzed = visit(arg, ctx, expectedReturnType);
    analyzedArgs.push(argAnalyzed);

    const expectedType = inputTypes[i]!;
    if (argAnalyzed.value.type.type !== "Never" &&
        !isTypeValueEqual(argAnalyzed.value.type, expectedType)) {
      throw new Error(
        `Platform function '${node.value.name}' argument ${i + 1} ` +
        `requires exact type match. Expected type ${printTypeValue(expectedType)} ` +
        `but got ${printTypeValue(argAnalyzed.value.type)}. ...`
      );
    }

    if (argAnalyzed.value.isAsync) {
      isAsync = true;
    }
  }

  // Validate output type matches (using computed outputType)
  if (!isTypeValueEqual(node.value.type, outputType)) {
    throw new Error(
      `Platform function '${node.value.name}' return type ` +
      `expected to be ${printTypeValue(outputType)} ` +
      `but IR has ${printTypeValue(node.value.type)} ...`
    );
  }

  // Platform function itself might be async
  if (platformFn.type === 'async') {
    isAsync = true;
  }

  return {
    ...node,
    value: {
      ...node.value,
      arguments: analyzedArgs as IR[],
      isAsync,
    },
  } as AnalyzedIR;
}
```

**Key changes**:
1. Read `type_parameters` from IR node (defaults to `[]`)
2. Validate type parameter count matches definition
3. Compute `inputTypes`/`outputType` using callbacks for generic functions
4. Use computed types for validation instead of stored concrete types

## Compilation Phase

Update `src/compile.ts` Platform handling (currently at lines 1081-1104).

**Current implementation** (compile.ts:1081-1104):
```typescript
} else if (ir.type === "Platform") {
  let argsAsync = false;
  const args = ir.value.arguments.map(a => {
    if (a.value.isAsync) {
      argsAsync = true;
    }
    return compile_internal(a, ctx, platform, asyncPlatformFns, platformDef, false, compilingNodes)
  });
  const evaluator = platform[ir.value.name];  // Direct lookup by name
  if (evaluator === undefined) {
    throw new Error(`Evaluator for platform function ${JSON.stringify(ir.value.name)} not found ...`);
  }
  if (argsAsync) {
    return async (ctx: Record<string, any>) => {
      const args_resolved: any[] = [];
      for (const a of args) {
        args_resolved.push(await a(ctx));
      }
      return evaluator(...args_resolved);
    }
  } else {
    return (ctx: Record<string, any>) => evaluator(...args.map(a => a(ctx)));
  }
}
```

**Updated implementation** with generic support:
```typescript
} else if (ir.type === "Platform") {
  let argsAsync = false;
  const args = ir.value.arguments.map(a => {
    if (a.value.isAsync) {
      argsAsync = true;
    }
    return compile_internal(a, ctx, platform, asyncPlatformFns, platformDef, false, compilingNodes);
  });

  // NEW: Look up platform function definition to check if generic
  const platformFn = platformDef.find(p => p.name === ir.value.name);
  if (!platformFn) {
    throw new Error(`Platform function '${ir.value.name}' not found in platform definition`);
  }

  // NEW: Get evaluator - for generic functions, call factory with type params
  let evaluator: (...args: any[]) => any;
  const typeParams = ir.value.type_parameters ?? [];

  if (typeParams.length > 0 && platformFn.type_parameters && platformFn.type_parameters.length > 0) {
    // Generic platform function - fn is a factory that takes type params
    evaluator = platformFn.fn(...typeParams);
  } else {
    // Non-generic - fn is the evaluator directly (or use platform map)
    evaluator = platform[ir.value.name];
    if (evaluator === undefined) {
      throw new Error(`Evaluator for platform function ${JSON.stringify(ir.value.name)} not found ...`);
    }
  }

  if (ir.value.async || argsAsync) {
    return async (ctx: Record<string, any>) => {
      const args_resolved: any[] = [];
      for (const a of args) {
        args_resolved.push(await a(ctx));
      }
      return evaluator(...args_resolved);
    };
  } else {
    return (ctx: Record<string, any>) => evaluator(...args.map(a => a(ctx)));
  }
}
```

**Key changes**:
1. Look up `platformFn` from `platformDef` to access type parameter info
2. Read `type_parameters` from IR node (defaults to `[]`)
3. If generic, call `platformFn.fn(...typeParams)` as factory to get evaluator
4. Otherwise, use existing `platform[name]` lookup for backwards compatibility

## Backwards Compatibility

### Non-Generic Platform Functions

The existing `East.platform` function remains unchanged. Non-generic platform functions have:
- `type_parameters: []` (empty array)
- `inputs`/`output` as concrete `EastTypeValue[]`/`EastTypeValue`
- `fn` as the direct evaluator (not a factory)

The compiler and analyzer detect non-generic functions by checking `type_parameters.length === 0` and handle them with the existing code path.

### IR Compatibility

The `type_parameters` field is added to `PlatformIR`. For backwards compatibility with existing IR:
- When reading IR without `type_parameters`, default to `[]`
- The field is always written (even if empty) for new IR

## File Changes Summary

| File | Lines | Changes |
|------|-------|---------|
| `src/ir.ts` | 264-270 | Add `type_parameters: EastTypeValue[]` to `PlatformIR` |
| `src/ast.ts` | 301-308 | Add `type_parameters: EastType[]` to `PlatformAST` |
| `src/platform.ts` | 10-21 | Update `PlatformFunction` type with `type_parameters`, `inputsFn`, `outputFn` |
| `src/analyze.ts` | 44-49 | Update `PlatformDefinition` type with same generic fields |
| `src/analyze.ts` | 402-470 | Validate generic platform calls with type parameter substitution |
| `src/ast_to_ir.ts` | 194-205 | Convert `type_parameters` from EastType to EastTypeValue |
| `src/compile.ts` | 1081-1104 | Call factory with type params for generic platform functions |
| `src/expr/block.ts` | NEW | Add indexed placeholder type (`Placeholder<K>`), substitution types, `genericPlatform`, and `asyncGenericPlatform` |
| `src/expr/index.ts` | | Export `genericPlatform`, `asyncGenericPlatform`, add to `East` object |

## Test Plan

### Unit Tests (`src/platform.spec.ts`)

Test the `genericPlatform` function directly:

```typescript
describe("genericPlatform", () => {
  it("creates a callable with correct arity", () => {
    const log = East.genericPlatform("log", ["T"], (T) => [T], () => NullType);
    // Should accept (Type, value)
  });

  it("validates type arguments are EastTypes", () => {
    const log = East.genericPlatform("log", ["T"], (T) => [T], () => NullType);
    expect(() => log("not a type", someExpr)).toThrow(/expects type parameter/);
  });

  it("validates value argument count", () => {
    const log = East.genericPlatform("log", ["T"], (T) => [T], () => NullType);
    expect(() => log(StringType)).toThrow(/expects 1 value arguments/);
    expect(() => log(StringType, a, b)).toThrow(/expects 1 value arguments/);
  });

  it("computes input types from type parameters", () => {
    const identity = East.genericPlatform("id", ["T"], (T) => [T], (T) => T);
    const expr = identity(IntegerType, 42n);
    expect(Expr.type(expr)).toEqual(IntegerType);
  });

  it("computes output types from type parameters", () => {
    const wrap = East.genericPlatform(
      "wrap",
      ["T"],
      (T) => [T],
      (T) => ArrayType(T)
    );
    const expr = wrap(StringType, "hello");
    expect(Expr.type(expr)).toEqual(ArrayType(StringType));
  });
});

describe("genericPlatform", () => {
  it("supports multiple type parameters", () => {
    const pair = East.genericPlatform(
      "pair",
      ["A", "B"],
      (A, B) => [A, B],
      (A, B) => StructType({ first: A, second: B })
    );
    const expr = pair(IntegerType, StringType, 1n, "x");
    expect(Expr.type(expr)).toEqual(StructType({ first: IntegerType, second: StringType }));
  });
});
```

### Integration Tests (`test/platform.spec.ts`)

Test the full compile and execute flow:

```typescript
describe("generic platform functions", () => {
  it("passes type parameters to implementation", () => {
    const log = East.genericPlatform("log", ["T"], (T) => [T], () => NullType);

    let receivedType: EastTypeValue | undefined;
    const impl = log.implement((T) => (value) => {
      receivedType = T;
      return null;
    });

    const fn = East.function([IntegerType], NullType, ($, x) => {
      $.return(log(IntegerType, x));
    });

    const compiled = East.compile(fn.toIR(), [impl]);
    compiled(42n);

    expect(receivedType).toEqual(toEastTypeValue(IntegerType));
  });

  it("implementation can use type for type-specific behavior", () => {
    const print = East.genericPlatform("print", ["T"], (T) => [T], () => StringType);

    const impl = print.implement((T) => (value) => {
      return printFor(T)(value);
    });

    const fn = East.function([IntegerType], StringType, ($, x) => {
      $.return(print(IntegerType, x));
    });

    const compiled = East.compile(fn.toIR(), [impl]);
    expect(compiled(42n)).toBe("42");
  });

  it("works with complex computed output types", () => {
    const ResultType = (T: EastType) => VariantType({ ok: T, error: StringType });

    const tryParse = East.genericPlatform(
      "tryParse",
      ["T"],
      (_T) => [StringType],
      (T) => ResultType(T)
    );

    const impl = tryParse.implement((T) => (str) => {
      try {
        const result = parseFor(T)(str);
        if (result.success) {
          return variant("ok", result.value);
        }
        return variant("error", result.error);
      } catch (e) {
        return variant("error", String(e));
      }
    });

    const fn = East.function([StringType], ResultType(IntegerType), ($, s) => {
      $.return(tryParse(IntegerType, s));
    });

    const compiled = East.compile(fn.toIR(), [impl]);
    expect(compiled("42")).toEqual(variant("ok", 42n));
    expect(compiled("abc").type).toBe("error");
  });

  it("async generic platform functions work", () => {
    const fetchAs = East.asyncGenericPlatform(
      "fetchAs",
      ["T"],
      (_T) => [StringType],
      (T) => T
    );

    const impl = fetchAs.implement((T) => async (url) => {
      // Simulated fetch
      return parseFor(T)("42").value;
    });

    const fn = East.asyncFunction([StringType], IntegerType, async ($, url) => {
      $.return(await fetchAs(IntegerType, url));
    });

    const compiled = East.compile(fn.toIR(), [impl]);
    return expect(compiled("http://example.com")).resolves.toBe(42n);
  });
});
```

### Analysis Tests

Test that the analyzer properly validates generic platform calls:

```typescript
describe("analyze generic platform functions", () => {
  it("rejects wrong number of type parameters", () => {
    const log = East.genericPlatform("log", ["T"], (T) => [T], () => NullType);
    // Manually construct IR with wrong type param count
    // ... expect analyze to throw
  });

  it("rejects type mismatch in arguments", () => {
    const log = East.genericPlatform("log", ["T"], (T) => [T], () => NullType);
    // Call log(IntegerType, "string") - type mismatch
    // ... expect analyze to throw
  });

  it("validates computed output type", () => {
    // Ensure IR output type matches what outputFn computes
  });
});
```

## Implementation Plan

### Phase 1: IR and AST Changes
1. Add `type_parameters` to `PlatformIR` in `src/ir.ts`
2. Add `type_parameters` to `PlatformAST` in `src/ast.ts`
3. Update `ast_to_ir.ts` to handle the new field
4. Update IR serialization if needed

### Phase 2: Platform Definition Changes
1. Update `PlatformFunction` type in `src/platform.ts`
2. Ensure backwards compatibility for non-generic platform functions

### Phase 3: Expression Layer
1. Implement indexed placeholder type (`Placeholder<K>`) and substitution types
2. Implement `genericPlatform` (single variadic function) in `src/expr/block.ts`
3. Implement async variant `asyncGenericPlatform`
4. Export from `src/expr/index.ts` and add to `East` object
5. Add unit tests

### Phase 4: Analysis
1. Update `analyze.ts` to validate generic platform calls
2. Implement type parameter substitution for input/output type checking
3. Add analysis tests

### Phase 5: Compilation
1. Update `compile.ts` to detect generic vs non-generic platform functions
2. Call factory with type params for generic functions
3. Add integration tests

### Phase 6: Documentation and Examples
1. Update USAGE.md with `genericPlatform` documentation
2. Add examples to `example/` directory
3. Update TypeDoc comments

## Resolved Design Decisions

1. **Call-site type safety approach**
   - **Decision**: Use indexed placeholder types (`Placeholder<K>`) branded by position index with substitution types
   - **Rationale**: TypeScript cannot "execute" callbacks at the type level to infer relationships. Indexed placeholders provide distinguishable markers that substitution types can replace with actual types at call sites.
   - **Key insight**: Tuple-wrapping in conditional types (`[Type] extends [Placeholder<K>]`) prevents TypeScript from distributing over union types, avoiding infinite recursion errors.

2. **Single variadic function vs separate functions per arity**
   - **Decision**: Provide a single `genericPlatform` function that works with any number of type parameters
   - **Rationale**: Using mapped tuple types (like `East.function` does), we can map the `typeParams` array to placeholder types dynamically. The `Placeholders<TParams>` mapped type converts `["T", "U"]` to `[Placeholder<0>, Placeholder<1>]`, enabling a single variadic function signature.

3. **`as const` requirement**
   - **Decision**: Use `const` type parameter modifier (TypeScript 5.0+) to eliminate `as const` requirement
   - **Rationale**: `const Inputs extends readonly EastType[]` tells TypeScript to infer narrow tuple types, so `(t) => [t]` is inferred as `readonly [Placeholder<0>]` not `Placeholder<0>[]`.

## Open Questions

1. **Should non-generic platform functions also use the callback pattern?**
   - Pro: Uniform API
   - Con: More verbose for simple cases
   - Current decision: Keep both APIs (`platform` for simple, `genericPlatform` for generic)

2. **Should we support type constraints?**
   - Example: `["T extends StructType"]` to restrict T to struct types
   - Current decision: No, keep it simple. TypeScript generics provide some constraint checking at the expression layer.

3. **Should type parameters be named or positional?**
   - Current decision: Named (like `["T", "U"]`) for clarity and self-documentation
   - The names are used in error messages and potentially in future IDE tooling

4. **IR serialization format for type_parameters?**
   - Current decision: Array of `EastTypeValue`, same as `BuiltinIR.type_parameters`
   - This is already handled by existing IR serialization code
