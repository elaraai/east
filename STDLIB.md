# East Standard Library

The East Standard Library provides utility functions that extend East's core expression types with additional formatting, conversion, and generation capabilities.

---

## Table of Contents

- [Boolean](#boolean)
- [Integer](#integer)
- [Float](#float)
- [String](#string)
- [DateTime](#datetime)
- [Blob](#blob)
- [Array](#array)
- [Set](#set)
- [Dict](#dict)
- [Struct](#struct)
- [Variant](#variant)

---

## Standard Library Expressions

This section documents the standard library expression available for each East type. These are accessed through the `East` namespace (e.g., `East.Integer.printCommaSeparated()`, `East.DateTime.fromEpochMilliseconds()`).

For core operations on expressions (like `.add()`, `.multiply()`, `.map()`), see [USAGE.md](./USAGE.md).

### Boolean

Boolean expressions currently have no standard library methods.

---

### Integer

The Integer standard library provides formatting and rounding utilities for integer values.

**Example:**
```typescript
const formatNumber = East.function([IntegerType], StringType, ($, value) => {
    // Format with thousand separators
    const commaSeparated = East.Integer.printCommaSeperated(value);
    // Alternative ways:
    // const commaSeparated = $.let(East.Integer.printCommaSeperated);
    // $(commaSeparated(value));

    // Format with compact units (K, M, B, etc.)
    const compact = East.Integer.printCompact(value);

    // Round to nearest multiple
    const rounded = East.Integer.roundNearest(value, 10n);

    // Format as ordinal (1st, 2nd, 3rd, etc.)
    const ordinal = East.Integer.printOrdinal(rounded);

    $.return(East.str`${commaSeparated} = ${compact}, rounded to ${ordinal}`);
});

const compiled = East.compile(formatNumber, []);
console.log(compiled(1234567n));  // "1,234,567 = 1.23M, rounded to 1234570th"
console.log(compiled(47n));       // "47 = 47, rounded to 50th"
```

**Operations:**
| Signature | Description | Example |
|-----------|-------------|---------|
| **Formatting** |
| `East.Integer.printCommaSeperated(x: IntegerExpr \| bigint): StringExpr` | Format with commas: `"1,234,567"` | `East.Integer.printCommaSeperated(1234567n)` |
| `East.Integer.printCompact(x: IntegerExpr \| bigint): StringExpr` | Business units: `"1.5M"`, `"21K"` | `East.Integer.printCompact(1500000n)` |
| `East.Integer.printCompactSI(x: IntegerExpr \| bigint): StringExpr` | SI units: `"1.5M"`, `"21k"` | `East.Integer.printCompactSI(21000n)` |
| `East.Integer.printCompactComputing(x: IntegerExpr \| bigint): StringExpr` | Binary units (1024): `"1.5Mi"`, `"21ki"` | `East.Integer.printCompactComputing(21504n)` |
| `East.Integer.printOrdinal(x: IntegerExpr \| bigint): StringExpr` | Ordinal: `"1st"`, `"2nd"`, `"3rd"` | `East.Integer.printOrdinal(1n)` |
| `East.Integer.printPercentage(x: IntegerExpr \| bigint): StringExpr` | Format as percentage: `"45%"` | `East.Integer.printPercentage(45n)` |
| **Utilities** |
| `East.Integer.digitCount(x: IntegerExpr \| bigint): IntegerExpr` | Count decimal digits (excluding sign) | `East.Integer.digitCount(1234n)` |
| **Rounding** |
| `East.Integer.roundNearest(x: IntegerExpr \| bigint, step: IntegerExpr \| bigint): IntegerExpr` | Round to nearest multiple of step | `East.Integer.roundNearest(47n, 10n)` |
| `East.Integer.roundUp(x: IntegerExpr \| bigint, step: IntegerExpr \| bigint): IntegerExpr` | Round up (ceiling) to multiple of step | `East.Integer.roundUp(41n, 10n)` |
| `East.Integer.roundDown(x: IntegerExpr \| bigint, step: IntegerExpr \| bigint): IntegerExpr` | Round down (floor) to multiple of step | `East.Integer.roundDown(47n, 10n)` |
| `East.Integer.roundTruncate(x: IntegerExpr \| bigint, step: IntegerExpr \| bigint): IntegerExpr` | Round towards zero to multiple of step | `East.Integer.roundTruncate(-47n, 10n)` |


---

### Float

The Float standard library provides rounding, comparison, and formatting utilities for floating-point values.

**Example:**
```typescript
const formatNumber = East.function([FloatType], StringType, ($, value) => {
    // Round to 2 decimal places
    const rounded = East.Float.roundToDecimals(value, 2n);

    // Format as currency with $ sign
    const currency = East.Float.printCurrency(value);

    // Format with comma separators
    const formatted = East.Float.printCommaSeperated(value, 2n);

    // Format as percentage
    const percentage = East.Float.printPercentage(value, 1n);

    // Format in compact form (21.5K, 1.82M, etc.)
    const compact = East.Float.printCompact(value);

    $.return(East.str`Currency: ${currency}, Formatted: ${formatted}, Compact: ${compact}`);
});

const compiled = East.compile(formatNumber, []);
console.log(compiled(1234567.89));
// "Currency: $1234567.89, Formatted: 1234567.89, Compact: 1.23M"
```

**Operations:**
| Signature | Description | Example |
|-----------|-------------|---------|
| **Rounding to Integers** |
| `East.Float.roundFloor(x: FloatExpr \| number): IntegerExpr` | Round down to nearest integer (floor) | `East.Float.roundFloor(3.7)` → `3n` |
| `East.Float.roundCeil(x: FloatExpr \| number): IntegerExpr` | Round up to nearest integer (ceiling) | `East.Float.roundCeil(3.2)` → `4n` |
| `East.Float.roundHalf(x: FloatExpr \| number): IntegerExpr` | Round to nearest integer (half-away-from-zero) | `East.Float.roundHalf(3.5)` → `4n` |
| `East.Float.roundTrunc(x: FloatExpr \| number): IntegerExpr` | Truncate towards zero | `East.Float.roundTrunc(-3.7)` → `-3n` |
| **Rounding to Step Values** |
| `East.Float.roundNearest(x: FloatExpr \| number, step: FloatExpr \| number): FloatExpr` | Round to nearest multiple of step | `East.Float.roundNearest(47.3, 10.0)` → `50.0` |
| `East.Float.roundUp(x: FloatExpr \| number, step: FloatExpr \| number): FloatExpr` | Round up (ceiling) to multiple of step | `East.Float.roundUp(41.2, 10.0)` → `50.0` |
| `East.Float.roundDown(x: FloatExpr \| number, step: FloatExpr \| number): FloatExpr` | Round down (floor) to multiple of step | `East.Float.roundDown(47.8, 10.0)` → `40.0` |
| `East.Float.roundTruncate(x: FloatExpr \| number, step: FloatExpr \| number): FloatExpr` | Round towards zero to multiple of step | `East.Float.roundTruncate(-47.8, 10.0)` → `-40.0` |
| `East.Float.roundToDecimals(x: FloatExpr \| number, decimals: IntegerExpr \| bigint): FloatExpr` | Round to specified number of decimal places | `East.Float.roundToDecimals(3.14159, 2n)` → `3.14` |
| **Comparison** |
| `East.Float.approxEqual(x: FloatExpr \| number, y: FloatExpr \| number, epsilon: FloatExpr \| number): BooleanExpr` | Check if two floats are approximately equal within tolerance | `East.Float.approxEqual(0.1, 0.10001, 0.001)` → `true` |
| **Formatting** |
| `East.Float.printCommaSeperated(x: FloatExpr \| number, decimals: IntegerExpr \| bigint): StringExpr` | Format with comma separators | `East.Float.printCommaSeperated(1234.567, 2n)` → `"1,234.57"` |
| `East.Float.printCurrency(x: FloatExpr \| number): StringExpr` | Format as currency with $ and 2 decimals | `East.Float.printCurrency(1234.567)` → `"$1234.57"` |
| `East.Float.printFixed(x: FloatExpr \| number, decimals: IntegerExpr \| bigint): StringExpr` | Format with fixed decimal places | `East.Float.printFixed(3.1, 3n)` → `"3.100"` |
| `East.Float.printCompact(x: FloatExpr \| number): StringExpr` | Business units: `"21.5K"`, `"1.82M"`, `"314B"` | `East.Float.printCompact(1500000.0)` → `"1.5M"` |
| `East.Float.printPercentage(x: FloatExpr \| number, decimals: IntegerExpr \| bigint): StringExpr` | Format as percentage | `East.Float.printPercentage(0.452, 1n)` → `"45.2%"` |

---

### String

The String standard library provides error formatting utilities.

**Operations:**
| Signature | Description | Example |
|-----------|-------------|---------|
| `East.String.printError(message: StringExpr \| string, stack: ArrayExpr<StructType<{filename, line, column}>>): StringExpr` | Pretty-print error with stack trace | `East.String.printError(errorMsg, stackTrace)` |


---

### DateTime

The DateTime standard library provides construction and rounding utilities for date and time values.

**Example:**
```typescript
const processDate = East.function([DateTimeType], StringType, ($, timestamp) => {
    // Create from epoch milliseconds
    const epoch = East.DateTime.fromEpochMilliseconds(1710498645123n);

    // Create from components (year, month, day, hour, minute, second, millisecond)
    const constructed = East.DateTime.fromComponents(2024n, 3n, 15n, 10n, 30n, 45n, 123n);

    // Round timestamp to start of day
    const dayStart = East.DateTime.roundDownDay(timestamp, 1n);

    // Round to nearest hour
    const nearestHour = East.DateTime.roundNearestHour(timestamp, 1n);

    // Round to start of ISO week (Monday)
    const weekStart = East.DateTime.roundDownWeek(timestamp, 1n);

    $.return(East.str`Day: ${dayStart}, Hour: ${nearestHour}, Week: ${weekStart}`);
});

const compiled = East.compile(processDate, []);
const date = new Date("2024-03-15T14:30:45.123Z");
console.log(compiled(date));
// Output: Day: 2024-03-15T00:00:00.000, Hour: 2024-03-15T15:00:00.000, Week: 2024-03-11T00:00:00.000
```

**Operations:**
| Signature | Description | Example |
|-----------|-------------|---------|
| **Construction** |
| `East.DateTime.fromEpochMilliseconds(ms: IntegerExpr \| bigint): DateTimeExpr` | Create from Unix epoch milliseconds | `East.DateTime.fromEpochMilliseconds(1640000000000n)` |
| `East.DateTime.fromComponents(y: IntegerExpr \| bigint, m: IntegerExpr \| bigint = 1n, d: IntegerExpr \| bigint = 1n, h: IntegerExpr \| bigint = 0n, min: IntegerExpr \| bigint = 0n, s: IntegerExpr \| bigint = 0n, ms: IntegerExpr \| bigint = 0n): DateTimeExpr` | Create from components | `East.DateTime.fromComponents(2025n, 1n, 15n)` |
| `East.DateTime.parseFormatted(format: StringExpr \| string, dateString: StringExpr \| string): DateTimeExpr` **❗** | Parse datetime from formatted string (fallible) | `East.DateTime.parseFormatted("%Y-%m-%d", "2025-01-15")` |
| **Rounding - Milliseconds** |
| `East.DateTime.roundNearestMillisecond(date: DateTimeExpr, step: IntegerExpr \| bigint): DateTimeExpr` | Round to nearest multiple of milliseconds | `East.DateTime.roundNearestMillisecond(date, 100n)` |
| `East.DateTime.roundUpMillisecond(date: DateTimeExpr, step: IntegerExpr \| bigint): DateTimeExpr` | Round up to next multiple of milliseconds | `East.DateTime.roundUpMillisecond(date, 10n)` |
| `East.DateTime.roundDownMillisecond(date: DateTimeExpr, step: IntegerExpr \| bigint): DateTimeExpr` | Round down to previous multiple of milliseconds | `East.DateTime.roundDownMillisecond(date, 5n)` |
| **Rounding - Seconds** |
| `East.DateTime.roundNearestSecond(date: DateTimeExpr, step: IntegerExpr \| bigint): DateTimeExpr` | Round to nearest multiple of seconds | `East.DateTime.roundNearestSecond(date, 30n)` |
| `East.DateTime.roundUpSecond(date: DateTimeExpr, step: IntegerExpr \| bigint): DateTimeExpr` | Round up to next multiple of seconds | `East.DateTime.roundUpSecond(date, 15n)` |
| `East.DateTime.roundDownSecond(date: DateTimeExpr, step: IntegerExpr \| bigint): DateTimeExpr` | Round down to previous multiple of seconds | `East.DateTime.roundDownSecond(date, 10n)` |
| **Rounding - Minutes** |
| `East.DateTime.roundNearestMinute(date: DateTimeExpr, step: IntegerExpr \| bigint): DateTimeExpr` | Round to nearest multiple of minutes | `East.DateTime.roundNearestMinute(date, 15n)` |
| `East.DateTime.roundUpMinute(date: DateTimeExpr, step: IntegerExpr \| bigint): DateTimeExpr` | Round up to next multiple of minutes | `East.DateTime.roundUpMinute(date, 5n)` |
| `East.DateTime.roundDownMinute(date: DateTimeExpr, step: IntegerExpr \| bigint): DateTimeExpr` | Round down to previous multiple of minutes | `East.DateTime.roundDownMinute(date, 30n)` |
| **Rounding - Hours** |
| `East.DateTime.roundNearestHour(date: DateTimeExpr, step: IntegerExpr \| bigint): DateTimeExpr` | Round to nearest multiple of hours | `East.DateTime.roundNearestHour(date, 1n)` |
| `East.DateTime.roundUpHour(date: DateTimeExpr, step: IntegerExpr \| bigint): DateTimeExpr` | Round up to next multiple of hours | `East.DateTime.roundUpHour(date, 6n)` |
| `East.DateTime.roundDownHour(date: DateTimeExpr, step: IntegerExpr \| bigint): DateTimeExpr` | Round down to previous multiple of hours | `East.DateTime.roundDownHour(date, 1n)` |
| **Rounding - Days** |
| `East.DateTime.roundNearestDay(date: DateTimeExpr, step: IntegerExpr \| bigint): DateTimeExpr` | Round to nearest multiple of days | `East.DateTime.roundNearestDay(date, 1n)` |
| `East.DateTime.roundUpDay(date: DateTimeExpr, step: IntegerExpr \| bigint): DateTimeExpr` | Round up to next multiple of days | `East.DateTime.roundUpDay(date, 7n)` |
| `East.DateTime.roundDownDay(date: DateTimeExpr, step: IntegerExpr \| bigint): DateTimeExpr` | Round down to previous multiple of days | `East.DateTime.roundDownDay(date, 1n)` |
| **Rounding - Weeks** |
| `East.DateTime.roundNearestWeek(date: DateTimeExpr, step: IntegerExpr \| bigint): DateTimeExpr` | Round to nearest Monday (ISO week start) | `East.DateTime.roundNearestWeek(date, 1n)` |
| `East.DateTime.roundUpWeek(date: DateTimeExpr, step: IntegerExpr \| bigint): DateTimeExpr` | Round up to next Monday (ISO week start) | `East.DateTime.roundUpWeek(date, 1n)` |
| `East.DateTime.roundDownWeek(date: DateTimeExpr, step: IntegerExpr \| bigint): DateTimeExpr` | Round down to previous Monday (ISO week start) | `East.DateTime.roundDownWeek(date, 1n)` |
| **Rounding - Months & Years** |
| `East.DateTime.roundDownMonth(date: DateTimeExpr, step: IntegerExpr \| bigint): DateTimeExpr` | Round down to start of month | `East.DateTime.roundDownMonth(date, 1n)` |
| `East.DateTime.roundDownYear(date: DateTimeExpr, step: IntegerExpr \| bigint): DateTimeExpr` | Round down to start of year | `East.DateTime.roundDownYear(date, 1n)` |


---

### Blob

The Blob standard library provides binary encoding utilities.

**Example:**
```typescript
const serializeValue = East.function([IntegerType], BlobType, ($, value) => {
    // Encode value to BEAST binary format (version 1 or 2)
    const encoded = East.Blob.encodeBeast(value, 'v2');
    // Alternative: const encoded = East.Blob.encodeBeast(value, 'v1');

    $.return(encoded);
});

const compiled = East.compile(serializeValue, []);
const blob = compiled(42n);
console.log(blob);  // Uint8Array containing BEAST-encoded 42n
```

**Operations:**
| Signature | Description | Example |
|-----------|-------------|---------|
| `East.Blob.encodeBeast(value: Expr, version: 'v1' \| 'v2' = 'v1'): BlobExpr` | Encode value to binary BEAST format (v1 or v2) | `East.Blob.encodeBeast(myValue, 'v2')` |


---

### Array

The Array standard library provides generation utilities for creating arrays.

**Example:**
```typescript
const createSequences = East.function([], ArrayType(IntegerType), $ => {
    // Generate integer range [0, 10) with step of 2
    const range = East.Array.range(0n, 10n, 2n);
    // Result: [0, 2, 4, 6, 8]

    // Generate 11 equally-spaced floats from 0.0 to 1.0 (inclusive)
    const linspace = East.Array.linspace(0.0, 1.0, 11n);
    // Result: [0.0, 0.1, 0.2, ..., 0.9, 1.0]

    // Generate array using function (index -> value)
    const generated = East.Array.generate(5n, IntegerType, ($, i) => i.multiply(i));
    // Result: [0, 1, 4, 9, 16]

    $.return(range);
});

const compiled = East.compile(createSequences, []);
console.log(compiled());  // [0n, 2n, 4n, 6n, 8n]
```

**Operations:**
| Signature | Description | Example |
|-----------|-------------|---------|
| `East.Array.range(start: IntegerExpr \| bigint, end: IntegerExpr \| bigint, step: IntegerExpr \| bigint = 1n): ArrayExpr<IntegerType>` | Generate integer range [start, end) | `East.Array.range(0n, 10n, 2n)` |
| `East.Array.linspace(start: FloatExpr \| number, stop: FloatExpr \| number, size: IntegerExpr \| bigint): ArrayExpr<FloatType>` | Generate equally-spaced floats [start, stop] (inclusive) | `East.Array.linspace(0.0, 1.0, 11n)` |
| `East.Array.generate<T extends EastType>(size: IntegerExpr \| bigint, valueType: T, valueFn: FunctionType<[IntegerType], T>): ArrayExpr<T>` | Generate n elements using function from index | `East.Array.generate(10n, IntegerType, ($, i) => i.multiply(2n))` |


---

### Set

The Set standard library provides generation utilities for creating sets.

**Example:**
```typescript
const createSet = East.function([], SetType(IntegerType), $ => {
    // Generate set using function (index -> key)
    const generated = East.Set.generate(5n, IntegerType, ($, i) => i.multiply(2n));
    // Result: Set {0, 2, 4, 6, 8}

    $.return(generated);
});

const compiled = East.compile(createSet, []);
console.log(compiled());  // Set {0n, 2n, 4n, 6n, 8n}
```

**Operations:**
| Signature | Description | Example |
|-----------|-------------|---------|
| `East.Set.generate<K extends DataType>(size: IntegerExpr \| bigint, keyType: K, keyFn: FunctionType<[IntegerType], K>, onConflict?: FunctionType<[K], K>): SetExpr<K>` | Generate set from function (errors on duplicates) | `East.Set.generate(10n, IntegerType, ($, i) => i)` |


---

### Dict

The Dict standard library provides generation utilities for creating dictionaries.

**Example:**
```typescript
const createDict = East.function([], DictType(IntegerType, IntegerType), $ => {
    // Generate dict using functions (index -> key, index -> value)
    const generated = East.Dict.generate(
        5n,
        IntegerType,
        IntegerType,
        ($, i) => i,              // key function
        ($, i) => i.multiply(10n) // value function
    );
    // Result: Map {0 => 0, 1 => 10, 2 => 20, 3 => 30, 4 => 40}

    $.return(generated);
});

const compiled = East.compile(createDict, []);
console.log(compiled());  // Map {0n => 0n, 1n => 10n, 2n => 20n, 3n => 30n, 4n => 40n}
```

**Operations:**
| Signature | Description | Example |
|-----------|-------------|---------|
| `East.Dict.generate<K extends DataType, V extends EastType>(size: IntegerExpr \| bigint, keyType: K, valueType: V, keyFn: FunctionType<[IntegerType], K>, valueFn: FunctionType<[IntegerType], V>, onConflict?: FunctionType<[V, V, K], V>): DictExpr<K, V>` | Generate dict from functions (errors on duplicates) | `East.Dict.generate(10n, IntegerType, IntegerType, ($, i) => i, ($, i) => i.multiply(2n))` |

---

### Struct

Struct expressions currently have no standard library methods.

---

### Variant

Variant expressions currently have no standard library methods.