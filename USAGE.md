# East Developer Guide

Usage guide for the East programming language. For formatting, conversion, and generation utilities, see **[STDLIB.md](./STDLIB.md)**.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Types](#types)
- [East Namespace](#east-namespace)
- [Functions](#functions)
- [Expressions](#expressions)

---

## Quick Start

East is a **statically typed, expression-based language** embedded in TypeScript. Write programs using a fluent API, compile to portable **IR** that executes in different environments.

**Workflow:**
1. Define platform functions with `East.platform()`
2. Define East functions with `East.function()`
3. Build expressions using fluent methods
4. Compile with `East.compile(fn, platform)`
5. (Optional) Serialize to IR with `.toIR()` for transmission

```typescript
import { East, IntegerType, ArrayType, StructType, StringType, DictType, NullType } from "@elaraai/east";

const log = East.platform("log", [StringType], NullType);
const platform = [log.implement(console.log)];

const SaleType = StructType({ product: StringType, quantity: IntegerType, price: IntegerType });

const calculateRevenue = East.function(
    [ArrayType(SaleType)],
    DictType(StringType, IntegerType),
    ($, sales) => {
        const revenueByProduct = sales.groupSum(
            ($, sale) => sale.product,
            ($, sale) => sale.quantity.multiply(sale.price)
        );
        $(log(East.str`Total Revenue: ${revenueByProduct.sum()}`));
        $.return(revenueByProduct);
    }
);

const compiled = East.compile(calculateRevenue, platform);
const result = compiled([
    { product: "Widget", quantity: 10n, price: 50n },
    { product: "Gadget", quantity: 5n, price: 100n },
]);
// Result: Map { "Widget" => 500n, "Gadget" => 500n }
```

---

## Types

East is statically typed with **structural typing**. All types (except functions) have **total ordering**.

**Type System Concepts:**
- **`EastType`** - Type descriptor (e.g., `IntegerType`, `ArrayType<IntegerType>`)
- **`ValueTypeOf<T>`** - JavaScript runtime value for type (e.g., `bigint` for `IntegerType`)
- **`Expr<T>`** - Typed expression (e.g., `IntegerExpr`)
- Most functions accept `Expr<T>` OR `ValueTypeOf<T>`

| Type | `ValueTypeOf<Type>` | Mutability | Description |
|------|-----------------|------------|-------------|
| **Primitive Types** |
| `NullType` | `null` | Immutable | Unit type |
| `BooleanType` | `boolean` | Immutable | True or false |
| `IntegerType` | `bigint` | Immutable | 64-bit signed integers |
| `FloatType` | `number` | Immutable | IEEE 754 double-precision (distinguishes `-0.0` from `0.0`) |
| `StringType` | `string` | Immutable | UTF-8 text |
| `DateTimeType` | `Date` | Immutable | UTC timestamp with millisecond precision |
| `BlobType` | `Uint8Array` | Immutable | Binary data |
| **Compound Types** |
| `ArrayType<T>` | `ValueTypeOf<T>[]` | **Mutable** | Ordered collection |
| `SetType<K>` | `Set<ValueTypeOf<K>>` | **Mutable** | Sorted set (keys ordered by total ordering) |
| `DictType<K, V>` | `Map<ValueTypeOf<K>, ValueTypeOf<V>>` | **Mutable** | Sorted dict (keys ordered by total ordering) |
| `StructType<Fields>` | `{...}` | Immutable | Product type (field order matters) |
| `VariantType<Cases>` | `variant` | Immutable | Sum type (cases sorted alphabetically) |
| `RecursiveType<T>` | `ValueTypeOf<T>` | Immutable | Trees, DAGs, circular structures |
| `RefType<T>` | `ref<ValueTypeOf<T>>` | **Mutable** | Shared mutable state across closures |
| **Function Type** |
| `FunctionType<I, O>` | Function | Immutable | First-class function (serializable as IR, not as data) |

**Key Notes:**
- **Total ordering**: All types (even `Float` with `NaN`, `-0.0`) have defined ordering
- **Dict keys / Set elements**: Immutable types only (excludes Array, Set, Dict, Function)
- **Equality**: Deep structural equality; mutable types also support `East.is()` for reference equality
- **❗** in tables = can throw runtime error

---

## East Namespace

Main entry point for building East programs.

| Signature | Description | Example |
|-----------|-------------|---------|
| **Expression Creation** |
| `value<V>(val: ValueTypeOf<V>): Expr<V>` | Create expression from JavaScript value | `East.value(42n)` |
| `value<T extends EastType>(val: Expr<T> \| ValueTypeOf<T>, type: T): Expr<T>` | Create expression with explicit type | `East.value(x, IntegerType)` |
| <code>str\`...\`: StringExpr</code> | String interpolation template | <code>East.str\`Hello ${name}\`</code> |
| `print<T extends EastType>(expr: Expr<T>): StringExpr` | Convert any expression to string | `East.print(x)` |
| **Function Definition** |
| `function<I extends EastType[], O extends EastType>(inputs: I, output: O, body: ($, ...args) => Expr \| value): FunctionExpr` | Define a function | `East.function([IntegerType], IntegerType, ($, x) => x.add(1n))` |
| `compile<I extends EastType[], O extends EastType>(fn: FunctionExpr<I, O>, platform: PlatformFunction[]): (...inputs) => ValueTypeOf<O>` | Compile to executable JavaScript | `East.compile(myFunction, [log.implement(console.log)])` |
| `platform<I extends EastType[], O extends EastType>(name: string, inputs: I, output: O): (...args) => ExprType<O>` | Create platform function helper | `const log = East.platform("log", [StringType], NullType)` |
| **Comparisons** |
| `equal<T extends EastType>(a: Expr<T>, b: Expr<T> \| ValueTypeOf<T>): BooleanExpr` | Deep equality | `East.equal(x, 10n)` |
| `notEqual<T extends EastType>(a: Expr<T>, b: Expr<T> \| ValueTypeOf<T>): BooleanExpr` | Deep inequality | `East.notEqual(x, 0n)` |
| `less<T extends EastType>(a: Expr<T>, b: Expr<T> \| ValueTypeOf<T>): BooleanExpr` | Less than (total ordering) | `East.less(x, 100n)` |
| `lessEqual<T extends EastType>(a: Expr<T>, b: Expr<T> \| ValueTypeOf<T>): BooleanExpr` | Less than or equal | `East.lessEqual(x, y)` |
| `greater<T extends EastType>(a: Expr<T>, b: Expr<T> \| ValueTypeOf<T>): BooleanExpr` | Greater than | `East.greater(x, 0n)` |
| `greaterEqual<T extends EastType>(a: Expr<T>, b: Expr<T> \| ValueTypeOf<T>): BooleanExpr` | Greater than or equal | `East.greaterEqual(score, 50n)` |
| `is<T extends DataType>(a: Expr<T>, b: Expr<T> \| ValueTypeOf<T>): BooleanExpr` | Reference equality (mutable types) | `East.is(arr1, arr2)` |
| **Utilities** |
| `min<T extends EastType>(a: Expr<T>, b: Expr<T> \| ValueTypeOf<T>): Expr<T>` | Minimum (total ordering) | `East.min(x, 100n)` |
| `max<T extends EastType>(a: Expr<T>, b: Expr<T> \| ValueTypeOf<T>): Expr<T>` | Maximum (total ordering) | `East.max(x, 0n)` |
| `clamp<T extends EastType>(x: Expr<T>, min: Expr<T> \| ValueTypeOf<T>, max: Expr<T> \| ValueTypeOf<T>): Expr<T>` | Clamp between min and max | `East.clamp(x, 0n, 100n)` |

---

## Functions

Functions are first-class with concrete input/output types.

### Platform Functions

East code interacts with outside world only through platform functions you provide:

```typescript
const log = East.platform("log", [StringType], NullType);
const platform = [log.implement(console.log)];

const greet = East.function([StringType], NullType, ($, name) => {
    $(log(East.str`Hello, ${name}!`));
    $.return(null);
});

const compiled = East.compile(greet, platform);
compiled("Alice");  // Logs: "Hello, Alice!"

// Serialization
const ir = greet.toIR();
const json = JSON.stringify(ir.toJSON());
// Remote: EastIR.fromJSON(JSON.parse(json)).compile(platform)
```

### BlockBuilder Operations

The first argument (`$`) in function body provides scope operations:

| Signature | Description | Example |
|-----------|-------------|---------|
| **Variables** |
| `const<V>(value: ValueTypeOf<V>): Expr<V>` | Declare immutable variable (infers type) | `const x = $.const(42n)` |
| `const<T extends EastType>(value: Expr<T> \| ValueTypeOf<T>, type: T): Expr<T>` | Declare with explicit type | `const x = $.const(y, IntegerType)` |
| `let<V>(value: ValueTypeOf<V>): Expr<V>` | Declare mutable variable (infers type) | `const x = $.let(0n)` |
| `let<T extends EastType>(value: Expr<T> \| ValueTypeOf<T>, type: T): Expr<T>` | Declare with explicit type | `const x = $.let(y, IntegerType)` |
| `assign<T extends EastType>(variable: Expr<T>, value: Expr<T> \| ValueTypeOf<T>): NullExpr` | Reassign mutable variable | `$.assign(x, 10n)` |
| **Execution** |
| `$<T extends EastType>(expr: Expr<T>): Expr<T>` | Execute expression (for side effects) | `$(arr.pushLast(42n))` |
| `return<Ret>(value: Expr<Ret> \| ValueTypeOf<Ret>): NeverExpr` | Early return | `$.return(x)` |
| `error(message: StringExpr \| string, location?: Location): NeverExpr` | Throw error | `$.error("Invalid input")` |
| **Control Flow** |
| `if(condition: BooleanExpr \| boolean, body: ($) => void \| Expr): IfBuilder` | If statement (chain `.elseIf()`, `.else()`) | `$.if(East.greater(x, 0n), $ => $.return(x))` |
| `while(condition: BooleanExpr \| boolean, body: ($, label) => void \| Expr): NullExpr` | While loop | `$.while(East.greater(x, 0n), ($, label) => $.assign(x, x.subtract(1n)))` |
| `for<T extends EastType>(array: ArrayExpr<T>, body: ($, value, index, label) => void): NullExpr` | For loop over array | `$.for(arr, ($, val, i, label) => $(total.add(val)))` |
| `for<K extends DataType>(set: SetExpr<K>, body: ($, key, label) => void): NullExpr` | For loop over set | `$.for(s, ($, key, label) => $(arr.pushLast(key)))` |
| `for<K extends DataType, V extends EastType>(dict: DictExpr<K, V>, body: ($, value, key, label) => void): NullExpr` | For loop over dict | `$.for(d, ($, val, key, label) => $(total.add(val)))` |
| `break(label: Label): NeverExpr` | Break from loop | `$.break(label)` |
| `continue(label: Label): NeverExpr` | Continue to next iteration | `$.continue(label)` |
| `match<Cases>(variant: VariantExpr<Cases>, cases: { [K]: ($, data) => void \| Expr }): NullExpr` | Pattern match (statement form) | `$.match(opt, { Some: ($, x) => $.return(x), None: $ => $.return(0n) })` |
| **Error Handling** |
| `try(body: ($) => void \| Expr)` | Try block; chain `.catch()` and/or `.finally()` | `$.try($ => arr.get(i)).catch(($, msg, stack) => ...).finally($ => ...)` |
| `.catch(body: ($, message: StringExpr, stack: ArrayExpr<{filename, line, column}>) => void \| Expr)` | Handle errors (chainable) | `.catch(($, msg, stack) => $.assign(result, -1n))` |
| `.finally(body: ($) => void \| Expr)` | Cleanup (always executes) | `.finally($ => $.assign(cleaned, true))` |

### Error Handling

```typescript
const safeArrayAccess = East.function([ArrayType(IntegerType), IntegerType], IntegerType, ($, arr, index) => {
    const result = $.let(0n);
    $.try($ => {
        $.assign(result, arr.get(index));
    }).catch(($, message, stack) => {
        $.assign(result, -1n);
    }).finally($ => {
        // Cleanup - always runs, even on return/break/continue
    });
    $.return(result);
});
```

**Key behaviors:**
- **Catch**: Receives `message` (string) and `stack` (array of strings)
- **Finally**: Always executes for cleanup; does not affect return type
- **Return type**: Union of try and catch blocks (finally ignored)

---

## Expressions

Operations on typed expression objects.

### Boolean

```typescript
const validate = East.function([IntegerType, BooleanType], BooleanType, ($, price, isPremium) => {
    const isValid = $.let(true);
    $.if(East.greater(price, 10000n), $ => $.assign(isValid, false));
    const result = isValid.and($ => isPremium.or($ => East.greater(price, 100n)));
    $.return(result);
});
```

| Signature | Description | Example |
|-----------|-------------|---------|
| **Short-Circuiting** |
| `not(): BooleanExpr` | Logical NOT | `x.not()` |
| `and(y: ($) => BooleanExpr \| boolean): BooleanExpr` | Logical AND (short-circuit) | `x.and($ => y)` |
| `or(y: ($) => BooleanExpr \| boolean): BooleanExpr` | Logical OR (short-circuit) | `x.or($ => y)` |
| `ifElse(thenFn: ($) => any, elseFn: ($) => any): ExprType<TypeUnion<...>>` | Conditional (ternary) | `condition.ifElse($ => trueValue, $ => falseValue)` |
| **Non-Short-Circuiting** |
| `bitAnd(y: BooleanExpr \| boolean): BooleanExpr` | Bitwise AND | `x.bitAnd(y)` |
| `bitOr(y: BooleanExpr \| boolean): BooleanExpr` | Bitwise OR | `x.bitOr(y)` |
| `bitXor(y: BooleanExpr \| boolean): BooleanExpr` | Bitwise XOR | `x.bitXor(y)` |

---

### Integer

```typescript
const calc = East.function([IntegerType], IntegerType, ($, x) => {
    const price = $.let(47n);
    const rounded = price.add(5n).divide(10n).multiply(10n);
    $.return(rounded);
});
```

| Signature | Description | Example |
|-----------|-------------|---------|
| `negate(): IntegerExpr` | Unary negation | `x.negate()` |
| `add(y: IntegerExpr \| bigint): IntegerExpr` | Addition | `x.add(5n)` |
| `subtract(y: IntegerExpr \| bigint): IntegerExpr` | Subtraction | `x.subtract(3n)` |
| `multiply(y: IntegerExpr \| bigint): IntegerExpr` | Multiplication | `x.multiply(2n)` |
| `divide(y: IntegerExpr \| bigint): IntegerExpr` | Integer division (floored), `0 / 0 = 0` | `x.divide(10n)` |
| `remainder(y: IntegerExpr \| bigint): IntegerExpr` | Remainder (floored modulo) | `x.remainder(3n)` |
| `pow(y: IntegerExpr \| bigint): IntegerExpr` | Exponentiation | `x.pow(2n)` |
| `abs(): IntegerExpr` | Absolute value | `x.abs()` |
| `sign(): IntegerExpr` | Sign (-1, 0, or 1) | `x.sign()` |
| `log(base: IntegerExpr \| bigint): IntegerExpr` | Logarithm (floored, custom base) | `x.log(10n)` |
| `toFloat(): FloatExpr` | Convert to float (may be approximate) | `x.toFloat()` |

**Standard Library:** See [STDLIB.md](./STDLIB.md#integer) for formatting and rounding.

---

### Float

```typescript
const calc = East.function([FloatType], FloatType, ($, radius) => {
    const pi = $.let(3.14159);
    $.return(pi.multiply(radius.pow(2.0)));
});
```

| Signature | Description | Example |
|-----------|-------------|---------|
| `negate(): FloatExpr` | Unary negation | `x.negate()` |
| `add(y: FloatExpr \| number): FloatExpr` | Addition | `x.add(2.5)` |
| `subtract(y: FloatExpr \| number): FloatExpr` | Subtraction | `x.subtract(1.5)` |
| `multiply(y: FloatExpr \| number): FloatExpr` | Multiplication | `x.multiply(2.0)` |
| `divide(y: FloatExpr \| number): FloatExpr` | Division, `0.0 / 0.0 = NaN` | `x.divide(2.0)` |
| `remainder(y: FloatExpr \| number): FloatExpr` | Remainder (floored modulo) | `x.remainder(3.0)` |
| `pow(y: FloatExpr \| number): FloatExpr` | Exponentiation | `x.pow(2.0)` |
| `abs(): FloatExpr` | Absolute value | `x.abs()` |
| `sign(): FloatExpr` | Sign (-1, 0, or 1) | `x.sign()` |
| `sqrt(): FloatExpr` | Square root | `x.sqrt()` |
| `exp(): FloatExpr` | Exponential (e^x) | `x.exp()` |
| `log(): FloatExpr` | Natural logarithm | `x.log()` |
| `sin(): FloatExpr` | Sine | `x.sin()` |
| `cos(): FloatExpr` | Cosine | `x.cos()` |
| `tan(): FloatExpr` | Tangent | `x.tan()` |
| `toInteger(): IntegerExpr` **❗** | Convert to integer (must be exact) | `x.toInteger()` |

---

### String

```typescript
const process = East.function([StringType], StringType, ($, email) => {
    const atIndex = email.indexOf("@");
    const domain = email.substring(atIndex.add(1n), email.length());
    $.return(domain.upperCase());
});
```

| Signature | Description | Example |
|-----------|-------------|---------|
| **Manipulation** |
| `concat(other: StringExpr \| string): StringExpr` | Concatenate | `str.concat(" world")` |
| `repeat(count: IntegerExpr \| bigint): StringExpr` | Repeat n times | `str.repeat(3n)` |
| `substring(from: IntegerExpr \| bigint, to: IntegerExpr \| bigint): StringExpr` | Extract substring | `str.substring(0n, 5n)` |
| `upperCase(): StringExpr` | Convert to uppercase | `str.upperCase()` |
| `lowerCase(): StringExpr` | Convert to lowercase | `str.lowerCase()` |
| `trim(): StringExpr` | Remove whitespace from both ends | `str.trim()` |
| `trimStart(): StringExpr` | Remove whitespace from start | `str.trimStart()` |
| `trimEnd(): StringExpr` | Remove whitespace from end | `str.trimEnd()` |
| `split(separator: StringExpr \| string): ArrayExpr<StringType>` | Split into array | `str.split(",")` |
| `replace(search: StringExpr \| string, replacement: StringExpr \| string): StringExpr` | Replace first occurrence | `str.replace("old", "new")` |
| **Query** |
| `length(): IntegerExpr` | String length (UTF-16 code units) | `str.length()` |
| `startsWith(prefix: StringExpr \| string): BooleanExpr` | Test if starts with prefix | `str.startsWith("Hello")` |
| `endsWith(suffix: StringExpr \| string): BooleanExpr` | Test if ends with suffix | `str.endsWith(".txt")` |
| `contains(substring: StringExpr \| string): BooleanExpr` | Test if contains substring | `str.contains("world")` |
| `contains(regex: RegExp): BooleanExpr` | Test if matches regex | `str.contains(/[0-9]+/)` |
| `indexOf(substring: StringExpr \| string): IntegerExpr` | Find index (-1 if not found) | `str.indexOf("world")` |
| `indexOf(regex: RegExp): IntegerExpr` | Find regex match index | `str.indexOf(/[0-9]+/)` |
| **Encoding** |
| `encodeUtf8(): BlobExpr` | Encode as UTF-8 bytes | `str.encodeUtf8()` |
| `encodeUtf16(): BlobExpr` | Encode as UTF-16 bytes (little-endian with BOM) | `str.encodeUtf16()` |
| **Parsing** |
| `parse<T extends DataType>(type: T): ExprType<T>` **❗** | Parse string to type | `str.parse(IntegerType)` |
| `parseJson<T extends DataType>(type: T): ExprType<T>` **❗** | Parse JSON to type | `str.parseJson(IntegerType)` |

**Standard Library:** See [STDLIB.md](./STDLIB.md#string) for error formatting.

---

### DateTime

```typescript
const addDays = East.function([DateTimeType, IntegerType], DateTimeType, ($, date, days) => {
    const result = date.addDays(days);
    $.return(East.DateTime.roundDownDay(result, 1n));
});
```

| Signature | Description | Example |
|-----------|-------------|---------|
| **Component Access** |
| `getYear(): IntegerExpr` | Get year | `date.getYear()` |
| `getMonth(): IntegerExpr` | Get month (1-12) | `date.getMonth()` |
| `getDayOfMonth(): IntegerExpr` | Get day of month (1-31) | `date.getDayOfMonth()` |
| `getDayOfWeek(): IntegerExpr` | Get day of week (0-6, Sunday=0) | `date.getDayOfWeek()` |
| `getHour(): IntegerExpr` | Get hour (0-23) | `date.getHour()` |
| `getMinute(): IntegerExpr` | Get minute (0-59) | `date.getMinute()` |
| `getSecond(): IntegerExpr` | Get second (0-59) | `date.getSecond()` |
| `getMillisecond(): IntegerExpr` | Get millisecond (0-999) | `date.getMillisecond()` |
| **Arithmetic** |
| `addMilliseconds(ms: IntegerExpr \| FloatExpr \| bigint \| number): DateTimeExpr` | Add milliseconds | `date.addMilliseconds(1000n)` |
| `subtractMilliseconds(ms: IntegerExpr \| FloatExpr \| bigint \| number): DateTimeExpr` | Subtract milliseconds | `date.subtractMilliseconds(500n)` |
| `addSeconds(s: IntegerExpr \| FloatExpr \| bigint \| number): DateTimeExpr` | Add seconds | `date.addSeconds(60n)` |
| `subtractSeconds(s: IntegerExpr \| FloatExpr \| bigint \| number): DateTimeExpr` | Subtract seconds | `date.subtractSeconds(30n)` |
| `addMinutes(m: IntegerExpr \| FloatExpr \| bigint \| number): DateTimeExpr` | Add minutes | `date.addMinutes(10n)` |
| `subtractMinutes(m: IntegerExpr \| FloatExpr \| bigint \| number): DateTimeExpr` | Subtract minutes | `date.subtractMinutes(5n)` |
| `addHours(h: IntegerExpr \| FloatExpr \| bigint \| number): DateTimeExpr` | Add hours | `date.addHours(2n)` |
| `subtractHours(h: IntegerExpr \| FloatExpr \| bigint \| number): DateTimeExpr` | Subtract hours | `date.subtractHours(1n)` |
| `addDays(d: IntegerExpr \| FloatExpr \| bigint \| number): DateTimeExpr` | Add days | `date.addDays(7n)` |
| `subtractDays(d: IntegerExpr \| FloatExpr \| bigint \| number): DateTimeExpr` | Subtract days | `date.subtractDays(1n)` |
| `addWeeks(w: IntegerExpr \| FloatExpr \| bigint \| number): DateTimeExpr` | Add weeks | `date.addWeeks(2n)` |
| `subtractWeeks(w: IntegerExpr \| FloatExpr \| bigint \| number): DateTimeExpr` | Subtract weeks | `date.subtractWeeks(1n)` |
| **Duration** |
| `durationMilliseconds(other: DateTimeExpr \| Date): IntegerExpr` | Duration in ms (positive if other > this) | `date.durationMilliseconds(otherDate)` |
| `durationSeconds(other: DateTimeExpr \| Date): FloatExpr` | Duration in seconds | `date.durationSeconds(otherDate)` |
| `durationMinutes(other: DateTimeExpr \| Date): FloatExpr` | Duration in minutes | `date.durationMinutes(otherDate)` |
| `durationHours(other: DateTimeExpr \| Date): FloatExpr` | Duration in hours | `date.durationHours(otherDate)` |
| `durationDays(other: DateTimeExpr \| Date): FloatExpr` | Duration in days | `date.durationDays(otherDate)` |
| `durationWeeks(other: DateTimeExpr \| Date): FloatExpr` | Duration in weeks | `date.durationWeeks(otherDate)` |
| **Conversion** |
| `toEpochMilliseconds(): IntegerExpr` | Milliseconds since Unix epoch | `date.toEpochMilliseconds()` |

**Standard Library:** See [STDLIB.md](./STDLIB.md#datetime) for construction and rounding.

---

### Blob

```typescript
const encode = East.function([IntegerType], BlobType, ($, value) => {
    $.return(East.Blob.encodeBeast(value, 'v2'));
});
```

| Signature | Description | Example |
|-----------|-------------|---------|
| `size(): IntegerExpr` | Size in bytes | `blob.size()` |
| `getUint8(offset: IntegerExpr \| bigint): IntegerExpr` **❗** | Get byte at offset (0-255) | `blob.getUint8(0n)` |
| `decodeUtf8(): StringExpr` **❗** | Decode as UTF-8 | `blob.decodeUtf8()` |
| `decodeUtf16(): StringExpr` **❗** | Decode as UTF-16 | `blob.decodeUtf16()` |
| `decodeBeast<T extends EastType>(type: T, version: 'v1' \| 'v2' = 'v1'): ExprType<T>` **❗** | Decode BEAST format | `blob.decodeBeast(IntegerType, 'v2')` |

**Standard Library:** See [STDLIB.md](./STDLIB.md#blob) for BEAST encoding.

---

### Array

```typescript
const process = East.function([ArrayType(IntegerType)], IntegerType, ($, prices) => {
    const doubled = prices.map(($, x, i) => x.multiply(2n));
    const filtered = doubled.filter(($, x, i) => East.greater(x, 100n));
    $(prices.pushLast(999n));  // Mutate
    $.return(filtered.sum());
});
```

| Signature | Description | Example |
|-----------|-------------|---------|
| **Read Operations** |
| `size(): IntegerExpr` | Array length | `array.size()` |
| `has(index: IntegerExpr \| bigint): BooleanExpr` | Check if index valid | `array.has(5n)` |
| `get<V extends EastType>(index: IntegerExpr \| bigint): ExprType<V>` **❗** | Get element | `array.get(0n)` |
| `get<V extends EastType>(index: IntegerExpr \| bigint, defaultFn: FunctionType<[IntegerType], V>): ExprType<V>` | Get or compute default | `array.get(10n, East.function([IntegerType], IntegerType, ($, i) => 0n))` |
| `tryGet<V extends EastType>(index: IntegerExpr \| bigint): OptionExpr<V>` | Safe get returning Option | `array.tryGet(0n)` |
| **Mutation Operations** |
| `update<V extends EastType>(index: IntegerExpr \| bigint, value: ExprType<V> \| ValueTypeOf<V>): NullExpr` **❗** | Replace element | `array.update(0n, 42n)` |
| `merge<V extends EastType, T2 extends EastType>(index: IntegerExpr \| bigint, value: Expr<T2>, updateFn: FunctionType<[V, T2, IntegerType], V>): ExprType<V>` | Merge with function | `array.merge(0n, 5n, ($, old, new, i) => old.add(new))` |
| `pushLast<V extends EastType>(value: ExprType<V> \| ValueTypeOf<V>): NullExpr` | Append to end | `array.pushLast(42n)` |
| `popLast<V extends EastType>(): ExprType<V>` **❗** | Remove from end | `array.popLast()` |
| `pushFirst<V extends EastType>(value: ExprType<V> \| ValueTypeOf<V>): NullExpr` | Prepend to start | `array.pushFirst(42n)` |
| `popFirst<V extends EastType>(): ExprType<V>` **❗** | Remove from start | `array.popFirst()` |
| `append<V extends EastType>(other: ArrayExpr<V>): NullExpr` | Append all (mutating) | `array.append(otherArray)` |
| `prepend<V extends EastType>(other: ArrayExpr<V>): NullExpr` | Prepend all (mutating) | `array.prepend(otherArray)` |
| `mergeAll<V extends EastType, T2 extends EastType>(other: ArrayExpr<T2>, mergeFn: FunctionType<[V, T2, IntegerType], V>): NullExpr` | Merge all | `array.mergeAll(other, ($, cur, new, i) => cur.add(new))` |
| `clear(): NullExpr` | Remove all elements | `array.clear()` |
| `sortInPlace<V extends EastType>(byFn?: FunctionType<[V], DataType>): NullExpr` | Sort in-place | `array.sortInPlace()` |
| `reverseInPlace(): NullExpr` | Reverse in-place | `array.reverseInPlace()` |
| **Functional Operations (Immutable)** |
| `copy<V extends EastType>(): ArrayExpr<V>` | Shallow copy | `array.copy()` |
| `slice<V extends EastType>(start: IntegerExpr \| bigint, end: IntegerExpr \| bigint): ArrayExpr<V>` | Extract subarray | `array.slice(0n, 10n)` |
| `concat<V extends EastType>(other: ArrayExpr<V>): ArrayExpr<V>` | Concatenate into new array | `array.concat(otherArray)` |
| `getKeys<V extends EastType>(keys: ArrayExpr<IntegerType>, onMissing?: FunctionType<[IntegerType], V>): ArrayExpr<V>` | Get values at indices | `array.getKeys(indices, East.function([IntegerType], IntegerType, ($, i) => 0n))` |
| `sort<V extends EastType>(byFn?: FunctionType<[V], DataType>): ArrayExpr<V>` | Sorted copy | `array.sort()` |
| `reverse<V extends EastType>(): ArrayExpr<V>` | Reversed copy | `array.reverse()` |
| `isSorted<V extends EastType>(byFn?: FunctionType<[V], DataType>): BooleanExpr` | Check if sorted | `array.isSorted()` |
| `findSortedFirst<V extends EastType, T2 extends EastType>(value: T2, byFn?: FunctionType<[V], TypeOf<T2>>): IntegerExpr` | Binary search first ≥ value | `array.findSortedFirst(42n)` |
| `findSortedLast<V extends EastType, T2 extends EastType>(value: T2, byFn?: FunctionType<[V], TypeOf<T2>>): IntegerExpr` | Binary search last ≤ value | `array.findSortedLast(42n)` |
| `findSortedRange<V extends EastType, T2 extends EastType>(value: T2, byFn?: FunctionType<[V], TypeOf<T2>>): StructExpr<{start, end}>` | Binary search range | `array.findSortedRange(42n)` |
| `map<V extends EastType, U extends EastType>(fn: FunctionType<[V, IntegerType], U>): ArrayExpr<U>` | Transform each | `array.map(($, x, i) => x.multiply(2n))` |
| `filter<V extends EastType>(predicate: FunctionType<[V, IntegerType], BooleanType>): ArrayExpr<V>` | Keep matching | `array.filter(($, x, i) => East.greater(x, 0n))` |
| `filterMap<V extends EastType, U extends EastType>(fn: FunctionType<[V, IntegerType], OptionType<U>>): ArrayExpr<U>` | Filter and map with Option | `array.filterMap(($, x, i) => East.greater(x, 0n) ? East.some(x.multiply(2n)) : East.none())` |
| `firstMap<V extends EastType, U extends EastType>(fn: FunctionType<[V, IntegerType], OptionType<U>>): OptionExpr<U>` | First successful | `array.firstMap(($, x, i) => East.greater(x, 0n) ? East.some(x) : East.none())` |
| `findFirst<V extends EastType>(value: V): OptionExpr<IntegerType>` | Find first index | `array.findFirst(42n)` |
| `findFirst<V extends EastType, T2 extends EastType>(value: T2, by: FunctionType<[V, IntegerType], T2>): OptionExpr<IntegerType>` | Find first with projection | `array.findFirst("active", ($, u, i) => u.status)` |
| `findAll<V extends EastType>(value: V): ArrayExpr<IntegerType>` | Find all indices | `array.findAll(42n)` |
| `findAll<V extends EastType, T2 extends EastType>(value: T2, by: FunctionType<[V, IntegerType], T2>): ArrayExpr<IntegerType>` | Find all with projection | `array.findAll("active", ($, u, i) => u.status)` |
| `forEach<V extends EastType>(fn: FunctionType<[V, IntegerType], any>): NullExpr` | Execute for each | `array.forEach(($, x, i) => $(total.add(x)))` |
| **Reduction Operations** |
| `reduce<V extends EastType, T extends EastType>(combineFn: FunctionType<[T, V, IntegerType], T>, init: T): ExprType<T>` | Fold with initial | `array.reduce(($, acc, x, i) => acc.add(x), 0n)` |
| `reduce<V extends EastType>(combineFn: FunctionType<[V, V, IntegerType], V>): ExprType<V>` | Fold without initial | `array.reduce(($, acc, x, i) => acc.add(x))` |
| `mapReduce<V extends EastType, U extends EastType, T extends EastType>(mapFn: FunctionType<[V, IntegerType], U>, combineFn: FunctionType<[T, U, IntegerType], T>, init: T): ExprType<T>` | Map then reduce | `array.mapReduce(($, x, i) => x.multiply(2n), ($, acc, x, i) => acc.add(x), 0n)` |
| `mapReduce<V extends EastType, U extends EastType>(mapFn: FunctionType<[V, IntegerType], U>, combineFn: FunctionType<[U, U, IntegerType], U>): ExprType<U>` | Map then reduce | `array.mapReduce(($, x, i) => x.multiply(2n), ($, acc, x, i) => acc.add(x))` |
| `every<V extends EastType>(predicate?: FunctionType<[V, IntegerType], BooleanType>): BooleanExpr` | All match | `array.every()` |
| `some<V extends EastType>(predicate?: FunctionType<[V, IntegerType], BooleanType>): BooleanExpr` | Any match | `array.some()` |
| `sum<V extends IntegerType \| FloatType>(): IntegerExpr \| FloatExpr` | Sum | `array.sum()` |
| `sum<V extends EastType>(fn: FunctionType<[V, IntegerType], IntegerType \| FloatType>): IntegerExpr \| FloatExpr` | Sum with projection | `array.sum(($, x, i) => x.multiply(2n))` |
| `mean<V extends IntegerType \| FloatType>(): FloatExpr` | Mean (NaN if empty) | `array.mean()` |
| `mean<V extends EastType>(fn: FunctionType<[V, IntegerType], IntegerType \| FloatType>): FloatExpr` | Mean with projection | `array.mean(($, x, i) => x.toFloat())` |
| `findMaximum<V extends EastType>(by?: FunctionType<[V, IntegerType], any>): OptionExpr<IntegerType>` | Index of maximum | `array.findMaximum()` |
| `findMinimum<V extends EastType>(by?: FunctionType<[V, IntegerType], any>): OptionExpr<IntegerType>` | Index of minimum | `array.findMinimum()` |
| `maximum<V extends EastType>(by?: FunctionType<[V, IntegerType], any>): ExprType<V>` | Maximum value (errors if empty) | `array.maximum()` |
| `minimum<V extends EastType>(by?: FunctionType<[V, IntegerType], any>): ExprType<V>` | Minimum value (errors if empty) | `array.minimum()` |
| **Conversion Operations** |
| `stringJoin<V extends StringType>(separator: StringExpr \| string): StringExpr` | Join string array | `array.stringJoin(", ")` |
| `toSet<V extends EastType, K extends DataType>(keyFn?: FunctionType<[V, IntegerType], K>): SetExpr<K>` | Convert to set | `array.toSet()` |
| `toDict<V extends EastType, K extends DataType, U extends EastType>(keyFn?: FunctionType<[V, IntegerType], K>, valueFn?: FunctionType<[V, IntegerType], U>, onConflictFn?: FunctionType<[U, U, K], U>): DictExpr<K, U>` | Convert to dict | `array.toDict(($, x, i) => i)` |
| `flatMap<V extends EastType, U extends EastType>(fn?: FunctionType<[V, IntegerType], ArrayType<U>>): ArrayExpr<U>` | Flatten arrays | `array.flatMap()` |
| `flattenToSet<V extends EastType, K extends DataType>(fn?: FunctionType<[V, IntegerType], SetType<K>>): SetExpr<K>` | Flatten to set | `array.flattenToSet()` |
| `flattenToDict<V extends EastType, K extends DataType, U extends EastType>(fn?: FunctionType<[V, IntegerType], DictType<K, U>>, onConflictFn?: FunctionType<[U, U, K], U>): DictExpr<K, U>` | Flatten to dict | `array.flattenToDict()` |
| **Grouping Operations** |
| `groupReduce<V extends EastType, K extends DataType, U extends EastType, T extends EastType>(keyFn: FunctionType<[V, IntegerType], K>, valueFn: FunctionType<[V, IntegerType], U>, initFn: FunctionType<[K], T>, reduceFn: FunctionType<[T, U, K], T>): DictExpr<K, T>` | Group and reduce | `array.groupReduce(($, x, i) => x.remainder(2n), ($, x, i) => x, ($, key) => 0n, ($, acc, val, key) => acc.add(val))` |
| `groupSize<V extends EastType, K extends DataType>(keyFn?: FunctionType<[V, IntegerType], K>): DictExpr<K, IntegerType>` | Count per group | `array.groupSize(($, x, i) => x.remainder(2n))` |
| `groupEvery<V extends EastType, K extends DataType>(keyFn: FunctionType<[V, IntegerType], K>, predFn: FunctionType<[V, IntegerType], BooleanType>): DictExpr<K, BooleanType>` | All match per group | `array.groupEvery(($, x, i) => x.remainder(2n), ($, x, i) => East.greater(x, 0n))` |
| `groupSome<V extends EastType, K extends DataType>(keyFn: FunctionType<[V, IntegerType], K>, predFn: FunctionType<[V, IntegerType], BooleanType>): DictExpr<K, BooleanType>` | Any match per group | `array.groupSome(($, x, i) => x.remainder(2n), ($, x, i) => East.greater(x, 10n))` |
| `groupFindFirst<V extends EastType, K extends DataType, T2 extends EastType>(keyFn: FunctionType<[V, IntegerType], K>, value: T2, projFn?: FunctionType<[V, IntegerType], T2>): DictExpr<K, OptionType<IntegerType>>` | Find first per group | `array.groupFindFirst(($, x, i) => x.remainder(2n), 42n)` |
| `groupFindAll<V extends EastType, K extends DataType, T2 extends EastType>(keyFn: FunctionType<[V, IntegerType], K>, value: T2, projFn?: FunctionType<[V, IntegerType], T2>): DictExpr<K, ArrayType<IntegerType>>` | Find all per group | `array.groupFindAll(($, x, i) => x.remainder(2n), 42n)` |
| `groupFindMinimum<V extends EastType, K extends DataType>(keyFn: FunctionType<[V, IntegerType], K>, byFn?: FunctionType<[V, IntegerType], any>): DictExpr<K, IntegerType>` | Min index per group | `array.groupFindMinimum(($, x, i) => x.remainder(2n))` |
| `groupFindMaximum<V extends EastType, K extends DataType>(keyFn: FunctionType<[V, IntegerType], K>, byFn?: FunctionType<[V, IntegerType], any>): DictExpr<K, IntegerType>` | Max index per group | `array.groupFindMaximum(($, x, i) => x.remainder(2n))` |
| `groupSum<V extends EastType, K extends DataType>(keyFn: FunctionType<[V, IntegerType], K>, valueFn?: FunctionType<[V, IntegerType], IntegerType \| FloatType>): DictExpr<K, IntegerType \| FloatType>` | Sum per group | `array.groupSum(($, x, i) => x.remainder(2n))` |
| `groupMean<V extends EastType, K extends DataType>(keyFn: FunctionType<[V, IntegerType], K>, valueFn?: FunctionType<[V, IntegerType], IntegerType \| FloatType>): DictExpr<K, FloatType>` | Mean per group | `array.groupMean(($, x, i) => x.remainder(2n))` |
| `groupMinimum<V extends EastType, K extends DataType>(keyFn: FunctionType<[V, IntegerType], K>, byFn?: FunctionType<[V, IntegerType], any>): DictExpr<K, V>` | Min value per group | `array.groupMinimum(($, x, i) => x.remainder(2n))` |
| `groupMaximum<V extends EastType, K extends DataType>(keyFn: FunctionType<[V, IntegerType], K>, byFn?: FunctionType<[V, IntegerType], any>): DictExpr<K, V>` | Max value per group | `array.groupMaximum(($, x, i) => x.remainder(2n))` |
| `groupToArrays<V extends EastType, K extends DataType, U extends EastType>(keyFn: FunctionType<[V, IntegerType], K>, valueFn?: FunctionType<[V, IntegerType], U>): DictExpr<K, ArrayType<U>>` | Collect to arrays | `array.groupToArrays(($, x, i) => x.remainder(2n))` |
| `groupToSets<V extends EastType, K extends DataType, U extends DataType>(keyFn: FunctionType<[V, IntegerType], K>, valueFn?: FunctionType<[V, IntegerType], U>): DictExpr<K, SetType<U>>` | Collect to sets | `array.groupToSets(($, x, i) => x.remainder(2n))` |
| `groupToDicts<V extends EastType, K extends DataType, K2 extends DataType, U extends EastType>(keyFn: FunctionType<[V, IntegerType], K>, keyFn2: FunctionType<[V, IntegerType], K2>, valueFn?: FunctionType<[V, IntegerType], U>, combineFn?: FunctionType<[U, U, K2], U>): DictExpr<K, DictType<K2, U>>` | Collect to nested dicts | `array.groupToDicts(($, x, i) => x.remainder(2n), ($, x, i) => i, ($, x, i) => x)` |

**Standard Library:** See [STDLIB.md](./STDLIB.md#array) for generation functions (range, linspace, generate).

---

### Set

```typescript
const process = East.function([SetType(IntegerType), SetType(IntegerType)], IntegerType, ($, a, b) => {
    const unionSet = a.union(b);
    $(a.insert(999n));  // Mutate
    $.return(unionSet.sum());
});
```

| Signature | Description | Example |
|-----------|-------------|---------|
| **Read Operations** |
| `size(): IntegerExpr` | Set size | `set.size()` |
| `has<K extends DataType>(key: ExprType<K> \| ValueTypeOf<K>): BooleanExpr` | Check if key exists | `set.has(42n)` |
| **Mutation Operations** |
| `insert<K extends DataType>(key: ExprType<K> \| ValueTypeOf<K>): NullExpr` **❗** | Insert (errors if exists) | `set.insert(42n)` |
| `tryInsert<K extends DataType>(key: ExprType<K> \| ValueTypeOf<K>): BooleanExpr` | Safe insert (returns success) | `set.tryInsert(42n)` |
| `delete<K extends DataType>(key: ExprType<K> \| ValueTypeOf<K>): NullExpr` **❗** | Delete (errors if missing) | `set.delete(42n)` |
| `tryDelete<K extends DataType>(key: ExprType<K> \| ValueTypeOf<K>): BooleanExpr` | Safe delete (returns success) | `set.tryDelete(42n)` |
| `clear(): NullExpr` | Remove all | `set.clear()` |
| `unionInPlace<K extends DataType>(other: SetExpr<K>): NullExpr` | Union in-place | `set.unionInPlace(otherSet)` |
| **Set Operations** |
| `copy<K extends DataType>(): SetExpr<K>` | Shallow copy | `set.copy()` |
| `union<K extends DataType>(other: SetExpr<K>): SetExpr<K>` | Union | `set.union(otherSet)` |
| `intersection<K extends DataType>(other: SetExpr<K>): SetExpr<K>` | Intersection | `set.intersection(otherSet)` |
| `difference<K extends DataType>(other: SetExpr<K>): SetExpr<K>` | Difference (in this, not other) | `set.difference(otherSet)` |
| `symmetricDifference<K extends DataType>(other: SetExpr<K>): SetExpr<K>` | Symmetric difference | `set.symmetricDifference(otherSet)` |
| `isSubsetOf<K extends DataType>(other: SetExpr<K>): BooleanExpr` | Check subset | `set.isSubsetOf(otherSet)` |
| `isSupersetOf<K extends DataType>(other: SetExpr<K>): BooleanExpr` | Check superset | `set.isSupersetOf(otherSet)` |
| `isDisjointFrom<K extends DataType>(other: SetExpr<K>): BooleanExpr` | Check no common elements | `set.isDisjointFrom(otherSet)` |
| **Functional Operations (Immutable)** |
| `filter<K extends DataType>(predicate: FunctionType<[K], BooleanType>): SetExpr<K>` | Keep matching | `set.filter(($, key) => East.greater(key, 0n))` |
| `filterMap<K extends DataType, V extends EastType>(fn: FunctionType<[K], OptionType<V>>): ArrayExpr<V>` | Filter and map | `set.filterMap(($, key) => East.greater(key, 0n) ? East.some(key) : East.none())` |
| `firstMap<K extends DataType, V extends EastType>(fn: FunctionType<[K], OptionType<V>>): OptionExpr<V>` | First successful | `set.firstMap(($, key) => East.greater(key, 10n) ? East.some(key) : East.none())` |
| `forEach<K extends DataType>(fn: FunctionType<[K], any>): NullExpr` | Execute for each | `set.forEach(($, key) => $(arr.pushLast(key)))` |
| `map<K extends DataType, V extends EastType>(fn: FunctionType<[K], V>): DictExpr<K, V>` | Map to dict | `set.map(($, key) => key.multiply(2n))` |
| `reduce<K extends DataType, T extends EastType>(fn: FunctionType<[T, K], T>, init: T): ExprType<T>` | Fold | `set.reduce(($, acc, key) => acc.add(key), 0n)` |
| `every<K extends DataType>(fn?: FunctionType<[K], BooleanType>): BooleanExpr` | All match | `set.every()` |
| `some<K extends DataType>(fn?: FunctionType<[K], BooleanType>): BooleanExpr` | Any match | `set.some()` |
| `sum<K extends IntegerType \| FloatType>(): IntegerExpr \| FloatExpr` | Sum | `set.sum()` |
| `sum<K extends DataType>(fn: FunctionType<[K], IntegerType \| FloatType>): IntegerExpr \| FloatExpr` | Sum with projection | `set.sum(($, key) => key.multiply(2n))` |
| `mean<K extends IntegerType \| FloatType>(): FloatExpr` | Mean (NaN if empty) | `set.mean()` |
| `mean<K extends DataType>(fn: FunctionType<[K], IntegerType \| FloatType>): FloatExpr` | Mean with projection | `set.mean(($, key) => key.toFloat())` |
| **Conversion Operations** |
| `toArray<K extends DataType, V extends EastType>(fn?: FunctionType<[K], V>): ArrayExpr<V>` | Convert to array | `set.toArray()` |
| `toSet<K extends DataType, U extends DataType>(keyFn?: FunctionType<[K], U>): SetExpr<U>` | Convert to new set | `set.toSet(($, key) => key.multiply(2n))` |
| `toDict<K extends DataType, K2 extends DataType, V extends EastType>(keyFn?: FunctionType<[K], K2>, valueFn?: FunctionType<[K], V>, onConflictFn?: FunctionType<[V, V, K2], V>): DictExpr<K2, V>` | Convert to dict | `set.toDict()` |
| `flattenToArray<K extends DataType, V extends EastType>(fn: FunctionType<[K], ArrayType<V>>): ArrayExpr<V>` | Flatten to array | `set.flattenToArray(($, key) => East.Array.range(0n, key))` |
| `flattenToSet<K extends DataType, U extends DataType>(fn: FunctionType<[K], SetType<U>>): SetExpr<U>` | Flatten to set | `set.flattenToSet(($, key) => otherSetDict.get(key))` |
| `flattenToDict<K extends DataType, K2 extends DataType, V extends EastType>(fn: FunctionType<[K], DictType<K2, V>>, onConflictFn?: FunctionType<[V, V, K2], V>): DictExpr<K2, V>` | Flatten to dict | `set.flattenToDict(($, key) => nestedDicts.get(key), ($, v1, v2, k) => v1.add(v2))` |
| **Grouping Operations** |
| `groupReduce<K extends DataType, K2 extends DataType, V extends EastType, T extends EastType>(keyFn: FunctionType<[K], K2>, valueFn: FunctionType<[K], V>, initFn: FunctionType<[K2], T>, reduceFn: FunctionType<[T, V, K2], T>): DictExpr<K2, T>` | Group and reduce | `set.groupReduce(($, key) => key.remainder(2n), ($, key) => key, ($, grp) => 0n, ($, acc, val, grp) => acc.add(val))` |
| `groupSize<K extends DataType, K2 extends DataType>(keyFn?: FunctionType<[K], K2>): DictExpr<K2, IntegerType>` | Count per group | `set.groupSize(($, key) => key.remainder(2n))` |
| `groupEvery<K extends DataType, K2 extends DataType>(keyFn: FunctionType<[K], K2>, predFn: FunctionType<[K], BooleanType>): DictExpr<K2, BooleanType>` | All match per group | `set.groupEvery(($, key) => key.remainder(2n), ($, key) => East.greater(key, 0n))` |
| `groupSome<K extends DataType, K2 extends DataType>(keyFn: FunctionType<[K], K2>, predFn: FunctionType<[K], BooleanType>): DictExpr<K2, BooleanType>` | Any match per group | `set.groupSome(($, key) => key.remainder(2n), ($, key) => East.greater(key, 10n))` |
| `groupSum<K extends DataType, K2 extends DataType>(keyFn: FunctionType<[K], K2>, valueFn?: FunctionType<[K], IntegerType \| FloatType>): DictExpr<K2, IntegerType \| FloatType>` | Sum per group | `set.groupSum(($, key) => key.remainder(2n))` |
| `groupMean<K extends DataType, K2 extends DataType>(keyFn: FunctionType<[K], K2>, valueFn?: FunctionType<[K], IntegerType \| FloatType>): DictExpr<K2, FloatType>` | Mean per group | `set.groupMean(($, key) => key.remainder(2n))` |
| `groupToArrays<K extends DataType, K2 extends DataType, V extends EastType>(keyFn: FunctionType<[K], K2>, valueFn?: FunctionType<[K], V>): DictExpr<K2, ArrayType<V>>` | Collect to arrays | `set.groupToArrays(($, key) => key.remainder(2n))` |
| `groupToSets<K extends DataType, K2 extends DataType, U extends DataType>(keyFn: FunctionType<[K], K2>, valueFn?: FunctionType<[K], U>): DictExpr<K2, SetType<U>>` | Collect to sets | `set.groupToSets(($, key) => key.remainder(2n))` |
| `groupToDicts<K extends DataType, K2 extends DataType, K3 extends DataType, V extends EastType>(keyFn: FunctionType<[K], K2>, keyFn2: FunctionType<[K], K3>, valueFn?: FunctionType<[K], V>, combineFn?: FunctionType<[V, V, K3], V>): DictExpr<K2, DictType<K3, V>>` | Collect to nested dicts | `set.groupToDicts(($, key) => key.remainder(2n), ($, key) => key, ($, key) => key)` |

**Standard Library:** See [STDLIB.md](./STDLIB.md#set) for generation functions.

---

### Dict

```typescript
const lookup = East.function([DictType(StringType, IntegerType), StringType], IntegerType, ($, inventory, item) => {
    const count = inventory.get(item, East.function([StringType], IntegerType, ($, key) => 0n));
    $(inventory.merge("widget", 5n, ($, old, newVal, key) => old.add(newVal)));
    $.return(count);
});
```

| Signature | Description | Example |
|-----------|-------------|---------|
| **Read Operations** |
| `size(): IntegerExpr` | Dict size | `dict.size()` |
| `has<K extends DataType>(key: ExprType<K> \| ValueTypeOf<K>): BooleanExpr` | Check if key exists | `dict.has("foo")` |
| `get<K extends DataType, V extends EastType>(key: ExprType<K> \| ValueTypeOf<K>): ExprType<V>` **❗** | Get value | `dict.get("foo")` |
| `get<K extends DataType, V extends EastType>(key: ExprType<K> \| ValueTypeOf<K>, defaultFn: FunctionType<[K], V>): ExprType<V>` | Get or compute default | `dict.get("foo", East.function([StringType], IntegerType, ($, key) => 0n))` |
| `tryGet<K extends DataType, V extends EastType>(key: ExprType<K> \| ValueTypeOf<K>): OptionExpr<V>` | Safe get returning Option | `dict.tryGet("foo")` |
| `keys<K extends DataType>(): SetExpr<K>` | Get all keys | `dict.keys()` |
| `getKeys<K extends DataType, V extends EastType>(keys: SetExpr<K>, onMissing?: FunctionType<[K], V>): DictExpr<K, V>` | Get values for keys | `dict.getKeys(keySet, East.function([StringType], IntegerType, ($, key) => 0n))` |
| **Mutation Operations** |
| `insert<K extends DataType, V extends EastType>(key: ExprType<K> \| ValueTypeOf<K>, value: ExprType<V> \| ValueTypeOf<V>): NullExpr` **❗** | Insert (errors if exists) | `dict.insert("foo", 42n)` |
| `insertOrUpdate<K extends DataType, V extends EastType>(key: ExprType<K> \| ValueTypeOf<K>, value: ExprType<V> \| ValueTypeOf<V>): NullExpr` | Insert or update | `dict.insertOrUpdate("foo", 42n)` |
| `update<K extends DataType, V extends EastType>(key: ExprType<K> \| ValueTypeOf<K>, value: ExprType<V> \| ValueTypeOf<V>): NullExpr` **❗** | Update (errors if missing) | `dict.update("foo", 100n)` |
| `merge<K extends DataType, V extends EastType, T2 extends EastType>(key: ExprType<K> \| ValueTypeOf<K>, value: T2, updateFn: FunctionType<[V, T2, K], V>, initialFn?: FunctionType<[K], V>): NullExpr` | Merge with function | `dict.merge("count", 1n, ($, old, new, key) => old.add(new), ($, key) => 0n)` |
| `getOrInsert<K extends DataType, V extends EastType>(key: ExprType<K> \| ValueTypeOf<K>, defaultFn: FunctionType<[K], V>): ExprType<V>` | Get or insert default | `dict.getOrInsert("foo", East.function([StringType], IntegerType, ($, key) => 0n))` |
| `delete<K extends DataType>(key: ExprType<K> \| ValueTypeOf<K>): NullExpr` **❗** | Delete (errors if missing) | `dict.delete("foo")` |
| `tryDelete<K extends DataType>(key: ExprType<K> \| ValueTypeOf<K>): BooleanExpr` | Safe delete | `dict.tryDelete("foo")` |
| `pop<K extends DataType, V extends EastType>(key: ExprType<K> \| ValueTypeOf<K>): ExprType<V>` **❗** | Remove and return | `dict.pop("foo")` |
| `swap<K extends DataType, V extends EastType>(key: ExprType<K> \| ValueTypeOf<K>, value: ExprType<V> \| ValueTypeOf<V>): ExprType<V>` **❗** | Replace and return old | `dict.swap("foo", 100n)` |
| `clear(): NullExpr` | Remove all | `dict.clear()` |
| `unionInPlace<K extends DataType, V extends EastType>(other: DictExpr<K, V>, mergeFn?: FunctionType<[V, V, K], V>): NullExpr` **❗** | Union in-place | `dict.unionInPlace(otherDict, ($, v1, v2, key) => v2)` |
| `mergeAll<K extends DataType, V extends EastType, V2 extends EastType>(other: DictExpr<K, V2>, mergeFn: FunctionType<[V, V2, K], V>, initialFn?: FunctionType<[K], V>): NullExpr` | Merge all entries | `dict.mergeAll(other, ($, cur, new, key) => cur.add(new))` |
| **Functional Operations** |
| `copy<K extends DataType, V extends EastType>(): DictExpr<K, V>` | Shallow copy | `dict.copy()` |
| `map<K extends DataType, V extends EastType, U extends EastType>(fn: FunctionType<[V, K], U>): DictExpr<K, U>` | Transform values | `dict.map(($, val, key) => val.multiply(2n))` |
| `filter<K extends DataType, V extends EastType>(predicate: FunctionType<[V, K], BooleanType>): DictExpr<K, V>` | Keep matching | `dict.filter(($, val, key) => East.greater(val, 0n))` |
| `filterMap<K extends DataType, V extends EastType, U extends EastType>(fn: FunctionType<[V, K], OptionType<U>>): DictExpr<K, U>` | Filter and map | `dict.filterMap(($, val, key) => East.greater(val, 0n) ? East.some(val.multiply(2n)) : East.none())` |
| `firstMap<K extends DataType, V extends EastType, U extends EastType>(fn: FunctionType<[V, K], OptionType<U>>): OptionExpr<U>` | First successful | `dict.firstMap(($, val, key) => East.greater(val, 10n) ? East.some(val) : East.none())` |
| `forEach<K extends DataType, V extends EastType>(fn: FunctionType<[V, K], any>): NullExpr` | Execute for each | `dict.forEach(($, val, key) => $(arr.pushLast(val)))` |
| `reduce<K extends DataType, V extends EastType, T extends EastType>(fn: FunctionType<[T, V, K], T>, init: T): ExprType<T>` | Fold | `dict.reduce(($, acc, val, key) => acc.add(val), 0n)` |
| `every<K extends DataType, V extends EastType>(fn?: FunctionType<[V, K], BooleanType>): BooleanExpr` | All match | `dict.every()` |
| `some<K extends DataType, V extends EastType>(fn?: FunctionType<[V, K], BooleanType>): BooleanExpr` | Any match | `dict.some()` |
| `sum<V extends IntegerType \| FloatType>(): IntegerExpr \| FloatExpr` | Sum values | `dict.sum()` |
| `sum<K extends DataType, V extends EastType>(fn: FunctionType<[V, K], IntegerType \| FloatType>): IntegerExpr \| FloatExpr` | Sum with projection | `dict.sum(($, val, key) => val.multiply(2n))` |
| `mean<V extends IntegerType \| FloatType>(): FloatExpr` | Mean (NaN if empty) | `dict.mean()` |
| `mean<K extends DataType, V extends EastType>(fn: FunctionType<[V, K], IntegerType \| FloatType>): FloatExpr` | Mean with projection | `dict.mean(($, val, key) => val.toFloat())` |
| **Conversion Operations** |
| `toArray<K extends DataType, V extends EastType, U extends EastType>(fn?: FunctionType<[V, K], U>): ArrayExpr<U>` | Convert to array | `dict.toArray()` |
| `toSet<K extends DataType, V extends EastType, U extends DataType>(keyFn?: FunctionType<[V, K], U>): SetExpr<U>` | Convert to set | `dict.toSet(($, val, key) => key)` |
| `toDict<K extends DataType, V extends EastType, K2 extends DataType, V2 extends EastType>(keyFn?: FunctionType<[V, K], K2>, valueFn?: FunctionType<[V, K], V2>, onConflictFn?: FunctionType<[V2, V2, K2], V2>): DictExpr<K2, V2>` | Convert to new dict | `dict.toDict(($, val, key) => key)` |
| `flattenToArray<K extends DataType, V extends EastType, U extends EastType>(fn?: FunctionType<[V, K], ArrayType<U>>): ArrayExpr<U>` | Flatten to array | `dict.flattenToArray()` |
| `flattenToSet<K extends DataType, V extends EastType, K2 extends DataType>(fn?: FunctionType<[V, K], SetType<K2>>): SetExpr<K2>` | Flatten to set | `dict.flattenToSet()` |
| `flattenToDict<K extends DataType, V extends EastType, K2 extends DataType, V2 extends EastType>(fn?: FunctionType<[V, K], DictType<K2, V2>), onConflictFn?: FunctionType<[V2, V2, K2], V2>): DictExpr<K2, V2>` | Flatten to dict | `dict.flattenToDict()` |
| **Grouping Operations** |
| `groupReduce<K extends DataType, V extends EastType, K2 extends DataType, U extends EastType, T extends EastType>(keyFn: FunctionType<[V, K], K2>, valueFn: FunctionType<[V, K], U>, initFn: FunctionType<[K2], T>, reduceFn: FunctionType<[T, U, K2], T>): DictExpr<K2, T>` | Group and reduce | `dict.groupReduce(($, val, key) => key.remainder(2n), ($, val, key) => val, ($, grp) => 0n, ($, acc, v, grp) => acc.add(v))` |
| `groupSize<K extends DataType, V extends EastType, K2 extends DataType>(keyFn?: FunctionType<[V, K], K2>): DictExpr<K2, IntegerType>` | Count per group | `dict.groupSize(($, val, key) => key.remainder(2n))` |
| `groupEvery<K extends DataType, V extends EastType, K2 extends DataType>(keyFn: FunctionType<[V, K], K2>, predFn: FunctionType<[V, K], BooleanType>): DictExpr<K2, BooleanType>` | All match per group | `dict.groupEvery(($, val, key) => key.remainder(2n), ($, val, key) => East.greater(val, 0n))` |
| `groupSome<K extends DataType, V extends EastType, K2 extends DataType>(keyFn: FunctionType<[V, K], K2>, predFn: FunctionType<[V, K], BooleanType>): DictExpr<K2, BooleanType>` | Any match per group | `dict.groupSome(($, val, key) => key.remainder(2n), ($, val, key) => East.greater(val, 10n))` |
| `groupSum<K extends DataType, V extends EastType, K2 extends DataType>(keyFn: FunctionType<[V, K], K2>, valueFn?: FunctionType<[V, K], IntegerType \| FloatType>): DictExpr<K2, IntegerType \| FloatType>` | Sum per group | `dict.groupSum(($, val, key) => key.remainder(2n))` |
| `groupMean<K extends DataType, V extends EastType, K2 extends DataType>(keyFn: FunctionType<[V, K], K2>, valueFn?: FunctionType<[V, K], IntegerType \| FloatType>): DictExpr<K2, FloatType>` | Mean per group | `dict.groupMean(($, val, key) => key.remainder(2n))` |
| `groupToArrays<K extends DataType, V extends EastType, K2 extends DataType, U extends EastType>(keyFn: FunctionType<[V, K], K2>, valueFn?: FunctionType<[V, K], U>): DictExpr<K2, ArrayType<U>>` | Collect to arrays | `dict.groupToArrays(($, val, key) => key.remainder(2n))` |
| `groupToSets<K extends DataType, V extends EastType, K2 extends DataType, U extends DataType>(keyFn: FunctionType<[V, K], K2>, valueFn?: FunctionType<[V, K], U>): DictExpr<K2, SetType<U>>` | Collect to sets | `dict.groupToSets(($, val, key) => key.remainder(2n))` |
| `groupToDicts<K extends DataType, V extends EastType, K2 extends DataType, K3 extends DataType, U extends EastType>(keyFn: FunctionType<[V, K], K2>, keyFn2: FunctionType<[V, K], K3>, valueFn?: FunctionType<[V, K], U>, combineFn?: FunctionType<[U, U, K3], U>): DictExpr<K2, DictType<K3, U>>` | Collect to nested dicts | `dict.groupToDicts(($, val, key) => key.remainder(2n), ($, val, key) => key, ($, val, key) => val)` |

**Standard Library:** See [STDLIB.md](./STDLIB.md#dict) for generation functions.

---

### Struct

Struct fields accessed directly as properties. Structs are immutable (use spread for copies).

```typescript
const PersonType = StructType({ name: StringType, age: IntegerType });

const getAge = East.function([PersonType], IntegerType, ($, person) => {
    $.return(person.age);
});
```

| Signature | Description | Example |
|-----------|-------------|---------|
| `field: ExprType<Fields[field]>` | Access struct field | `person.name` |

---

### Variant

Variants represent tagged unions (sum types). Use `variant()` to create values.

```typescript
import { East, variant, VariantType, IntegerType, NullType } from "@elaraai/east";

const OptionType = VariantType({ Some: IntegerType, None: NullType });

const process = East.function([OptionType], IntegerType, ($, opt) => {
    const result = $.let(0n);
    $.match(opt, {
        Some: ($, x) => $.assign(result, x.add(1n)),
        None: $ => $.assign(result, 0n),
    });
    $.return(result);
});

const compiled = East.compile(process, []);
compiled(variant("Some", 41n));  // 42n
compiled(variant("None", null)); // 0n
```

| Signature | Description | Example |
|-----------|-------------|---------|
| `match(cases: { [K]: ($, data) => Expr }): ExprType<T>` | Pattern match on all cases | `opt.match({ Some: ($, x) => x, None: $ => 0n })` |
| `unwrap(tag?: string): ExprType<Cases[tag]>` **❗** | Extract value (errors if wrong tag) | `opt.unwrap("Some")` |
| `unwrap(tag: string, defaultFn: ($) => Expr): ExprType<Cases[tag]>` | Extract or compute default | `opt.unwrap("Some", $ => 0n)` |
| `getTag(): StringExpr` | Get tag as string | `opt.getTag()` |
| `hasTag(tag: string): BooleanExpr` | Check if has tag | `opt.hasTag("Some")` |

---

### Ref

Ref expressions represent mutable reference cells for shared state across closures. Unlike `$.let()` variables, refs can be captured and modified from nested functions.

```typescript
import { East, ref, RefType, IntegerType } from "@elaraai/east";

const counter = East.function([], IntegerType, ($) => {
    const count = $.let(East.value(ref(0n)));
    $(count.update(count.get().add(1n)));
    $(count.merge(5n, ($, current, delta) => current.add(delta)));
    $.return(count.get());  // 6n
});
```

| Signature | Description | Example |
|-----------|-------------|---------|
| `get(): ExprType<T>` | Get current value | `refCell.get()` |
| `update(value: ExprType<T> \| ValueTypeOf<T>): NullExpr` | Replace value | `refCell.update(42n)` |
| `merge<T2>(value: Expr<T2>, updateFn: FunctionType<[T, T2], T>): NullExpr` | Merge with function | `refCell.merge(5n, ($, cur, new) => cur.add(new))` |

**Notes:**
- Refs have identity semantics
- Can be compared for reference equality using `East.is()`
