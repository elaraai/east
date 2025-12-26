---
name: east
description: East programming language - a statically typed, expression-based language embedded in TypeScript. Use when writing East programs with @elaraai/east. Triggers for: (1) Writing East functions with East.function() or East.asyncFunction(), (2) Defining types (IntegerType, StringType, ArrayType, StructType, VariantType, etc.), (3) Using platform functions with East.platform() or East.asyncPlatform(), (4) Compiling East programs with East.compile(), (5) Working with East expressions (arithmetic, collections, control flow), (6) Serializing East IR with .toIR() and EastIR.fromJSON(), (7) Standard library operations (formatting, rounding, generation).
---

# East Language

A statically typed, expression-based programming language embedded in TypeScript. Write programs using a fluent API, compile to portable IR.

## Quick Start

```typescript
import { East, IntegerType, ArrayType, NullType } from "@elaraai/east";

// 1. Define platform functions
const log = East.platform("log", [StringType], NullType);
const platform = [log.implement(console.log)];

// 2. Define East function
const sumArray = East.function([ArrayType(IntegerType)], IntegerType, ($, arr) => {
    $.return(arr.sum());
});

// 3. Compile and execute
const compiled = East.compile(sumArray, platform);
compiled([1n, 2n, 3n]);  // 6n
```

## Decision Tree: What Do You Need?

```
Task → What do you need?
    │
    ├─ Define a Type
    │   ├─ Primitive → IntegerType, FloatType, StringType, BooleanType, DateTimeType, BlobType, NullType
    │   ├─ Collection → ArrayType(T), SetType(K), DictType(K, V), RefType(T)
    │   ├─ Compound → StructType({...}), VariantType({...}), RecursiveType(...)
    │   └─ Function → FunctionType<I, O>, AsyncFunctionType<I, O>
    │
    ├─ Write a Function
    │   ├─ Synchronous → East.function([inputs], output, ($, ...args) => { ... })
    │   └─ Asynchronous → East.asyncFunction([inputs], output, ($, ...args) => { ... })
    │
    ├─ Use Platform Effects
    │   ├─ Sync effect → East.platform("name", [inputs], output).implement(fn)
    │   └─ Async effect → East.asyncPlatform("name", [inputs], output).implement(fn)
    │
    ├─ Block Operations ($)
    │   ├─ Variables → $.let(value), $.const(value), $.assign(var, value)
    │   ├─ Execute → $(expr), $.return(value), $.error(message)
    │   ├─ Control Flow → $.if(...), $.while(...), $.for(...), $.match(...)
    │   └─ Error Handling → $.try(...).catch(...).finally(...)
    │
    ├─ Expression Operations
    │   ├─ Boolean
    │   │   ├─ Logic → .and($=>), .or($=>), .not(), .ifElse($=>,$=>)
    │   │   ├─ Bitwise → .bitAnd(), .bitOr(), .bitXor()
    │   │   └─ Compare → .equals(), .notEquals()
    │   ├─ Integer
    │   │   ├─ Math → .add(), .subtract(), .multiply(), .divide(), .remainder(), .pow(), .abs(), .sign(), .negate(), .log()
    │   │   ├─ Convert → .toFloat()
    │   │   └─ Compare → .equals(), .notEquals(), .lessThan(), .greaterThan(), .lessThanOrEqual(), .greaterThanOrEqual()
    │   ├─ Float
    │   │   ├─ Math → .add(), .subtract(), .multiply(), .divide(), .remainder(), .pow(), .abs(), .sign(), .negate()
    │   │   ├─ Advanced → .sqrt(), .exp(), .log(), .sin(), .cos(), .tan()
    │   │   ├─ Convert → .toInteger()
    │   │   └─ Compare → .equals(), .notEquals(), .lessThan(), .greaterThan(), .lessThanOrEqual(), .greaterThanOrEqual()
    │   ├─ String
    │   │   ├─ Transform → .concat(), .repeat(), .substring(), .upperCase(), .lowerCase(), .trim(), .trimStart(), .trimEnd()
    │   │   ├─ Replace → .replace(), .replaceAll(), .split()
    │   │   ├─ Query → .length(), .startsWith(), .endsWith(), .contains(), .indexOf(), .charAt()
    │   │   ├─ Parse → .parse(), .parseJson()
    │   │   ├─ Encode → .encodeUtf8(), .encodeUtf16()
    │   │   └─ Compare → .equals(), .notEquals(), .lessThan(), .greaterThan()
    │   ├─ DateTime
    │   │   ├─ Components → .getYear(), .getMonth(), .getDayOfMonth(), .getDayOfWeek(), .getHour(), .getMinute(), .getSecond(), .getMillisecond()
    │   │   ├─ Arithmetic → .addDays(), .subtractDays(), .addHours(), .subtractHours(), .addMinutes(), .addSeconds(), .addMilliseconds(), .addWeeks()
    │   │   ├─ Duration → .durationDays(), .durationHours(), .durationMinutes(), .durationSeconds(), .durationMilliseconds(), .durationWeeks()
    │   │   ├─ Convert → .toEpochMilliseconds(), .printFormatted()
    │   │   └─ Compare → .equals(), .notEquals(), .lessThan(), .greaterThan()
    │   ├─ Blob
    │   │   ├─ Read → .size(), .getUint8()
    │   │   ├─ Decode → .decodeUtf8(), .decodeUtf16(), .decodeBeast(), .decodeCsv()
    │   │   └─ Compare → .equals(), .notEquals()
    │   ├─ Array
    │   │   ├─ Read → .size(), .length(), .has(), .get(), .at(), .tryGet(), .getKeys()
    │   │   ├─ Mutate → .update(), .pushLast(), .popLast(), .pushFirst(), .popFirst(), .append(), .prepend(), .clear(), .sortInPlace(), .reverseInPlace()
    │   │   ├─ Transform → .copy(), .slice(), .concat(), .sort(), .reverse(), .map(), .filter(), .filterMap(), .flatMap()
    │   │   ├─ Search → .findFirst(), .findAll(), .firstMap(), .isSorted()
    │   │   ├─ Reduce → .reduce(), .every(), .some(), .sum(), .mean(), .maximum(), .minimum(), .findMaximum(), .findMinimum()
    │   │   ├─ Convert → .stringJoin(), .toSet(), .toDict(), .flattenToSet(), .flattenToDict(), .encodeCsv()
    │   │   ├─ Group → .groupReduce(), .groupSize(), .groupSum(), .groupMean(), .groupMinimum(), .groupMaximum(), .groupToArrays(), .groupToSets(), .groupToDicts(), .groupEvery(), .groupSome()
    │   │   └─ Compare → .equals(), .notEquals()
    │   ├─ Set
    │   │   ├─ Read → .size(), .has()
    │   │   ├─ Mutate → .insert(), .tryInsert(), .delete(), .tryDelete(), .clear(), .unionInPlace()
    │   │   ├─ Set Ops → .copy(), .union(), .intersection(), .difference(), .symmetricDifference(), .isSubsetOf(), .isSupersetOf(), .isDisjointFrom()
    │   │   ├─ Transform → .filter(), .filterMap(), .map(), .forEach(), .firstMap()
    │   │   ├─ Reduce → .reduce(), .every(), .some(), .sum(), .mean()
    │   │   ├─ Convert → .toArray(), .toSet(), .toDict(), .flattenToArray(), .flattenToSet(), .flattenToDict()
    │   │   ├─ Group → .groupReduce(), .groupSize(), .groupSum(), .groupMean(), .groupToArrays(), .groupToSets(), .groupToDicts(), .groupEvery(), .groupSome()
    │   │   └─ Compare → .equals(), .notEquals()
    │   ├─ Dict
    │   │   ├─ Read → .size(), .has(), .get(), .tryGet(), .keys(), .getKeys()
    │   │   ├─ Mutate → .insert(), .insertOrUpdate(), .update(), .merge(), .getOrInsert(), .delete(), .tryDelete(), .pop(), .swap(), .clear(), .unionInPlace()
    │   │   ├─ Transform → .copy(), .map(), .filter(), .filterMap(), .forEach(), .firstMap()
    │   │   ├─ Reduce → .reduce(), .every(), .some(), .sum(), .mean()
    │   │   ├─ Convert → .toArray(), .toSet(), .toDict(), .flattenToArray(), .flattenToSet(), .flattenToDict()
    │   │   ├─ Group → .groupReduce(), .groupSize(), .groupSum(), .groupMean(), .groupToArrays(), .groupToSets(), .groupToDicts(), .groupEvery(), .groupSome()
    │   │   └─ Compare → .equals(), .notEquals()
    │   ├─ Struct → .fieldName (direct property access)
    │   ├─ Variant → .match(), .unwrap(), .hasTag(), .getTag(), .equals(), .notEquals()
    │   └─ Ref → .get(), .update(), .merge()
    │
    ├─ Standard Library (East.*)
    │   ├─ Integer → East.Integer.printCommaSeperated(), .roundNearest(), .printOrdinal()
    │   ├─ Float → East.Float.roundToDecimals(), .printCurrency(), .printCompact()
    │   ├─ DateTime → East.DateTime.fromComponents(), .roundDownDay(), .parseFormatted()
    │   ├─ Array → East.Array.range(), .linspace(), .generate()
    │   ├─ Set → East.Set.generate()
    │   ├─ Dict → East.Dict.generate()
    │   ├─ Blob → East.Blob.encodeBeast(), blob.decodeCsv(), array.encodeCsv()
    │   └─ String → East.String.printJson(), East.String.printError()
    │
    ├─ Comparisons (East.*)
    │   └─ East.equal(), .notEqual(), .less(), .greater(), .min(), .max(), .clamp()
    │
    └─ Serialization
        ├─ IR → fn.toIR(), ir.toJSON(), EastIR.fromJSON(data).compile(platform)
        └─ Data → East.Blob.encodeBeast(value, 'v2'), blob.decodeBeast(type, 'v2')
```

## Reference Documentation

- **[API Reference](./reference/api.md)** - Complete function signatures, types, and arguments
- **[Examples](./reference/examples.md)** - Working code examples by use case

## Type System Summary

| Type | `ValueTypeOf<Type>` | Mutability |
|------|---------------------|------------|
| `NullType` | `null` | Immutable |
| `BooleanType` | `boolean` | Immutable |
| `IntegerType` | `bigint` | Immutable |
| `FloatType` | `number` | Immutable |
| `StringType` | `string` | Immutable |
| `DateTimeType` | `Date` | Immutable |
| `BlobType` | `Uint8Array` | Immutable |
| `ArrayType<T>` | `ValueTypeOf<T>[]` | **Mutable** |
| `SetType<K>` | `Set<ValueTypeOf<K>>` | **Mutable** |
| `DictType<K, V>` | `Map<ValueTypeOf<K>, ValueTypeOf<V>>` | **Mutable** |
| `RefType<T>` | `ref<ValueTypeOf<T>>` | **Mutable** |
| `StructType<Fields>` | `{...}` | Immutable |
| `VariantType<Cases>` | `variant` | Immutable |
| `FunctionType<I, O>` | Function | Immutable |

## Key Patterns

### Creating Values
```typescript
// Use variant() for sum types
import { variant } from "@elaraai/east";
const some = variant("some", 42n);
const none = variant("none", null);

// Use ref() for mutable references
import { ref } from "@elaraai/east";
const counter = ref(0n);
```

### String Interpolation
```typescript
// Use East.str`` for string templates
$(log(East.str`Value: ${x}, Total: ${arr.sum()}`));
```

### Error Handling
```typescript
$.try($ => {
    $.assign(result, arr.get(index));
}).catch(($, message, stack) => {
    $.assign(result, -1n);
}).finally($ => {
    // cleanup
});
```
