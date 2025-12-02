# East Developer Guide

Usage guide for the East programming language.

This guide covers core expression types and their operations. For additional formatting, conversion, and generation utilities, see the **[Standard Library documentation](./STDLIB.md)**.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Types](#types)
- [East Namespace](#east-namespace)
- [Functions](#functions)
- [Expressions](#expressions)

---

## Quick Start

East is a **statically typed, expression-based language** embedded in TypeScript. You write East programs using a fluent TypeScript API, then compile them to portable **IR (Intermediate Representation)** that can execute in different environments (javascript, julia, python, etc). East code runs in a controlled environment - you define **platform functions** that your East code can call, providing access to external capabilities like logging, database access, or any other effects you want to expose.

**Workflow:**
1. **Define platform functions** - create an object with the external functions you want East code to access (e.g., logging, I/O, database queries)
2. **Define East functions** using `East.function()` with explicit types
3. **Build expressions** using methods on typed expression objects (`.add()`, `.map()`, etc.)
4. **Compile and run** using `East.compile(fn, platform)` to execute the code
5. **(Optional) Serialize to IR** using `.toIR()` for transmission/storage across environments

### Basic Example

```typescript
import { East, IntegerType, ArrayType, StructType, StringType, DictType, NullType } from "@elaraai/east";

// Platform function for logging
const log = East.platform("log", [StringType], NullType);

const platform = [
    log.implement(console.log),
];

// Define sale data type
const SaleType = StructType({
    product: StringType,
    quantity: IntegerType,
    price: IntegerType
});

// Calculate revenue per product from sales data
const calculateRevenue = East.function(
    [ArrayType(SaleType)],
    DictType(StringType, IntegerType),
    ($, sales) => {
        // Group sales by product and sum revenue (quantity × price)
        const revenueByProduct = sales.groupSum(
            // Group by product name
            ($, sale) => sale.product,          
            // Sum quantity × price    
            ($, sale) => sale.quantity.multiply(sale.price)  
        );

        // Log revenue for each product
         $(log(East.str`Total Revenue: ${revenueByProduct.sum()}`));

        $.return(revenueByProduct);
    }
);

// Compile and execute
const compiled = East.compile(calculateRevenue, platform);

const sales = [
    { product: "Widget", quantity: 10n, price: 50n },
    { product: "Gadget", quantity: 5n, price: 100n },
    { product: "Widget", quantity: 3n, price: 50n }
];

const result = compiled(sales);
// Result: Map { "Widget" => 650n, "Gadget" => 500n }
// Logs: "Gadget: $500" and "Widget: $650"
```
---

## Types

East is statically typed for speed and correctness, using **structural typing** for ease of use. All types (except functions) have a **total ordering**, enabling their use as Dict keys and Set elements, and allowing deep comparison operations.

### Type System Concepts

- **`EastType`** - A type descriptor (e.g., `IntegerType`, `StringType`, `ArrayType<IntegerType>`)
- **`ValueTypeOf<T>`** - The JavaScript runtime value for a type (e.g., `bigint` for `IntegerType`, `string` for `StringType`)
- **`Expr<T>`** - A typed expression that can be composed and compiled (e.g., `IntegerExpr`, `StringExpr`)

**Key insight:** Most East functions accept either `Expr<T>` OR `ValueTypeOf<T>`, allowing you to mix expressions and raw values.

| Type | `ValueTypeOf<Type>` | Mutability | Description |
|------|-----------------|------------|-------------|
| **Primitive Types** | | | |
| `NullType` | `null` | Immutable | Unit type (single value) |
| `BooleanType` | `boolean` | Immutable | True or false |
| `IntegerType` | `bigint` | Immutable | 64-bit signed integers |
| `FloatType` | `number` | Immutable | IEEE 754 double-precision (distinguishes `-0.0` from `0.0`) |
| `StringType` | `string` | Immutable | UTF-8 text |
| `DateTimeType` | `Date` | Immutable | UTC timestamp with millisecond precision |
| `BlobType` | `Uint8Array` | Immutable | Binary data |
| **Compound Types** | | | |
| `ArrayType<T>` | `ValueTypeOf<T>[]` | **Mutable** | Ordered collection |
| `SetType<K>` | `Set<ValueTypeOf<K>>` | **Mutable** | Sorted set (keys ordered by total ordering) |
| `DictType<K, V>` | `Map<ValueTypeOf<K>, ValueTypeOf<V>>` | **Mutable** | Sorted dict (keys ordered by total ordering) |
| `StructType<Fields>` | `{...}` | Immutable | Product type (field order matters) |
| `VariantType<Cases>` | `variant` | Immutable | Sum type (cases sorted alphabetically) |
| `RecursiveType<T>` | `ValueTypeOf<T>` | Immutable | Recursive references for trees, DAGs, and circular structures |
| `RefType<T>` | `ref<ValueTypeOf<T>>` | **Mutable** | Reference cell for shared mutable state across closures |
| **Function Type** | | | |
| `FunctionType<I, O>` | Function | Immutable | First-class function (serializable as IR, not as data) |

### Important Notes

- **Total ordering**: All types (even `Float` with `NaN`, `-0.0`) have a defined total ordering
- **Immutable types**: Can be used as Dict keys and Set elements
  - Includes: All primitives, Blob, Struct, Variant, Ref
  - Excludes: Array, Set, Dict, Function
- **Data types**: Can be serialized (excludes Function)
- **Equality**: Deep structural equality for all types
  - Mutable types also support reference equality via `East.is()`
- **Field/case order**:
  - Struct field order is significant for structural typing
  - Variant cases are automatically sorted alphabetically
- **Operations marked ❗**: Can throw runtime errors

---

## East Namespace

The `East` namespace is the main entry point for building East programs using a **fluent interface**. In East, you construct programs by building **expressions** - typed values that can be composed, transformed, and eventually compiled to executable code.

Think of expressions as building blocks: `East.value(42n)` creates an integer expression, and you can call methods on it like `.add(1n)` to build larger expressions. The `East` namespace provides functions to create expressions from JavaScript values, perform comparisons, and access type-specific utilities.

**Operations:**
| Signature | Description | Example |
|-----------|-------------|---------|
| **Expression Creation** |
| `value<V>(val: ValueTypeOf<V>): Expr<V>` | Create expression from JavaScript value | `East.value(42n)` |
| `value<T extends EastType>(val: Expr<T> \| ValueTypeOf<T>, type: T): Expr<T>` | Create expression with explicit type | `East.value(x, IntegerType)` |
| <code>str\`...\`: StringExpr</code> | String interpolation template | <code>East.str\`Hello ${name}\`</code> |
| `print<T extends EastType>(expr: Expr<T>): StringExpr` | Convert any expression to string representation | `East.print(x)` |
| **Function Definition** |
| `function<I extends EastType[], O extends EastType>(inputs: I, output: O, body: ($, ...args) => Expr \| value): FunctionExpr` | Define a function (see [Function](#function)) | `East.function([IntegerType], IntegerType, ($, x) => x.add(1n))` |
| `compile<I extends EastType[], O extends EastType>(fn: FunctionExpr<I, O>, platform: PlatformFunction[]): (...inputs) => ValueTypeOf<O>` | Compile East function to executable JavaScript | `East.compile(myFunction, [log.implement(console.log)])` |
| `platform<I extends EastType[], O extends EastType>(name: string, inputs: I, output: O): (...args) => ExprType<O>` | Create callable helper for platform function | `const log = East.platform("log", [StringType], NullType)` |
| **Comparisons** |
| `equal<T extends EastType>(a: Expr<T>, b: Expr<T> \| ValueTypeOf<T>): BooleanExpr` | Deep equality comparison | `East.equal(x, 10n)` |
| `notEqual<T extends EastType>(a: Expr<T>, b: Expr<T> \| ValueTypeOf<T>): BooleanExpr` | Deep inequality comparison | `East.notEqual(x, 0n)` |
| `less<T extends EastType>(a: Expr<T>, b: Expr<T> \| ValueTypeOf<T>): BooleanExpr` | Less than comparison (total ordering) | `East.less(x, 100n)` |
| `lessEqual<T extends EastType>(a: Expr<T>, b: Expr<T> \| ValueTypeOf<T>): BooleanExpr` | Less than or equal comparison | `East.lessEqual(x, y)` |
| `greater<T extends EastType>(a: Expr<T>, b: Expr<T> \| ValueTypeOf<T>): BooleanExpr` | Greater than comparison | `East.greater(x, 0n)` |
| `greaterEqual<T extends EastType>(a: Expr<T>, b: Expr<T> \| ValueTypeOf<T>): BooleanExpr` | Greater than or equal comparison | `East.greaterEqual(score, 50n)` |
| `is<T extends DataType>(a: Expr<T>, b: Expr<T> \| ValueTypeOf<T>): BooleanExpr` | Reference equality (for mutable types) | `East.is(arr1, arr2)` |
| **Utilities** |
| `min<T extends EastType>(a: Expr<T>, b: Expr<T> \| ValueTypeOf<T>): Expr<T>` | Minimum of two values (uses total ordering) | `East.min(x, 100n)` |
| `max<T extends EastType>(a: Expr<T>, b: Expr<T> \| ValueTypeOf<T>): Expr<T>` | Maximum of two values (uses total ordering) | `East.max(x, 0n)` |
| `clamp<T extends EastType>(x: Expr<T>, min: Expr<T> \| ValueTypeOf<T>, max: Expr<T> \| ValueTypeOf<T>): Expr<T>` | Clamp value between min and max | `East.clamp(x, 0n, 100n)` |

---

### Functions

Functions in East are first-class values that can be defined, passed around, and called. They have concrete input and output types, and their bodies are written using a fluent interface.

This section follows the workflow from [Quick Start](#quick-start):
1. Define platform functions
2. Define East functions
3. Compile and execute
4. (Optional) Serialize for transmission

---

#### Defining Platform Functions

East code runs in a sandboxed environment and can only interact with the outside world through **platform functions** that you explicitly provide. This ensures security and makes East code portable across different environments.

**Creating platform functions:**

Use `East.platform()` to create callable helpers that reference platform functions:

```typescript
import { East, StringType, NullType, IntegerType } from "@elaraai/east";

// Define platform function helpers
const log = East.platform("log", [StringType], NullType);

// define the run-time implementation
const platform = [
    log.implement(console.log),
];
```

**Defining and compiling an East function:**

```typescript
const greet = East.function([StringType], NullType, ($, name) => {
    // Call platform function from East code
    $(log(East.str`Hello, ${name}!`));
    $.return(null);
});

const compiled = East.compile(greet, platform);
compiled("Alice");  // Logs: "Hello, Alice!"
```

The compiled function has proper TypeScript types that match the East function signature.

**Serializing an East function:**

```typescript
// Serialize to JSON
const ir = greet.toIR();
const jsonString = JSON.stringify(ir.toJSON());

// ... Send jsonString over network ...
```

Dynamically compile and execute the function on the remote environment

```typescript
import { EastIR } from "@elaraai/east";

// define the remote environment run-time implementation
const remote_platform = {
    log: (msg: string) => {
        console.log(`Result: ${msg}`)
    }
};
// Deserialize and compile on remote environment
const receivedIR = EastIR.fromJSON(JSON.parse("... jsonString value ... "));
// comile with a platform implementation on the remote environment!
const remote_compiled = receivedIR.compile(platform);

compiled("Bob");  // Logs: "Result: Hello, Bob!"
```


**Operations:**

The first argument in an east function body (`$`) is a `BlockBuilder`, which is an entry point to scope specific operations.

| Signature | Description | Example |
|-----------|-------------|---------|
| **Variables** |
| `const<V>(value: ValueTypeOf<V>): Expr<V>` | Declare immutable variable (infers type) | `const x = $.const(42n)` |
| `const<T extends EastType>(value: Expr<T> \| ValueTypeOf<T>, type: T): Expr<T>` | Declare immutable variable with explicit type | `const x = $.const(y, IntegerType)` |
| `let<V>(value: ValueTypeOf<V>): Expr<V>` | Declare mutable variable (infers type) | `const x = $.let(0n)` |
| `let<T extends EastType>(value: Expr<T> \| ValueTypeOf<T>, type: T): Expr<T>` | Declare mutable variable with explicit type | `const x = $.let(y, IntegerType)` |
| `assign<T extends EastType>(variable: Expr<T>, value: Expr<T> \| ValueTypeOf<T>): NullExpr` | Reassign mutable variable (must be declared with `$.let`) | `$.assign(x, 10n)` |
| **Execution** |
| `$<T extends EastType>(expr: Expr<T>): Expr<T>` | Execute expression (often for side effects), returns the expression | `$(arr.pushLast(42n))` |
| `return<Ret>(value: Expr<Ret> \| ValueTypeOf<Ret>): NeverExpr` | Early return from function | `$.return(x)` |
| `error(message: StringExpr \| string, location?: Location): NeverExpr` | Throw error with message | `$.error("Invalid input")` |
| **Control Flow** |
| `if(condition: BooleanExpr \| boolean, body: ($) => void \| Expr): IfBuilder` | If statement (chain with `.elseIf()`, `.else()`) | `$.if(East.greater(x, 0n), $ => $.return(x))` |
| `while(condition: BooleanExpr \| boolean, body: ($, label) => void \| Expr): NullExpr` | While loop | `$.while(East.greater(x, 0n), ($, label) => $.assign(x, x.subtract(1n)))` |
| `for<T extends EastType>(array: ArrayExpr<T>, body: ($, value, index, label) => void): NullExpr` | For loop over array elements | `$.for(arr, ($, val, i, label) => $(total.add(val)))` |
| `for<K extends DataType>(set: SetExpr<K>, body: ($, key, label) => void): NullExpr` | For loop over set keys | `$.for(s, ($, key, label) => $(arr.pushLast(key)))` |
| `for<K extends DataType, V extends EastType>(dict: DictExpr<K, V>, body: ($, value, key, label) => void): NullExpr` | For loop over dict entries | `$.for(d, ($, val, key, label) => $(total.add(val)))` |
| `break(label: Label): NeverExpr` | Break from loop (use label from loop body) | `$.break(label)` |
| `continue(label: Label): NeverExpr` | Continue to next iteration (use label from loop body) | `$.continue(label)` |
| `match<Cases>(variant: VariantExpr<Cases>, cases: { [K]: ($, data) => void \| Expr }): NullExpr` | Pattern match on variant (statement form) | `$.match(opt, { Some: ($, x) => $.return(x), None: $ => $.return(0n) })` |
| **Error Handling** |
| `try(body: ($) => void \| Expr): TryCatchBuilder` | Try block (chain with `.catch()` and/or `.finally()`) | `$.try($ => arr.get(i)).catch(($, msg, stack) => $.return(0n))` |
| `TryCatchBuilder.catch(body: ($, message, stack) => void \| Expr): TryCatchBuilder` | Catch block for error handling (returns builder for chaining `.finally()`) | `.catch(($, msg, stack) => $.assign(result, -1n))` |
| `TryCatchBuilder.finally(body: ($) => void \| Expr): void` | Finally block for cleanup (always executes, does not affect return type) | `.finally($ => $.assign(cleaned, true))` |

---

#### Error Handling

East provides `try-catch-finally` for error handling with familiar JavaScript-like semantics. The finally block is useful for cleanup operations that must execute regardless of whether an error occurred.

**Key behaviors:**
- **Try block**: Code that may throw errors
- **Catch block** (optional): Handles errors, receives `message` (string) and `stack` (array of strings)
- **Finally block** (optional): Always executes for cleanup, runs after try or catch completes
- **Return type**: Determined by union of try and catch blocks (finally does not affect return type)
- **Control flow**: Finally executes on normal completion, errors, returns, breaks, and continues

**Pattern matching:**
- `try-catch`: Handle errors with fallback behavior
- `try-finally`: Ensure cleanup without error handling
- `try-catch-finally`: Handle errors and ensure cleanup

**Example: Basic error handling**
```typescript
import { East, ArrayType, IntegerType } from "@elaraai/east";

const safeArrayAccess = East.function([ArrayType(IntegerType), IntegerType], IntegerType, ($, arr, index) => {
    const result = $.let(0n);

    $.try($ => {
        $.assign(result, arr.get(index));
    }).catch(($, message, stack) => {
        // Handle out-of-bounds error
        $.assign(result, -1n);
    });

    $.return(result);
});

const compiled = East.compile(safeArrayAccess, []);
console.log(compiled([1n, 2n, 3n], 1n));   // 2n
console.log(compiled([1n, 2n, 3n], 10n));  // -1n (error handled)
```

**Example: Cleanup with finally**
```typescript
const processWithCleanup = East.function([ArrayType(IntegerType)], IntegerType, ($, arr) => {
    const resource = $.let(true);  // Represents a resource that needs cleanup
    const result = $.let(0n);

    $.try($ => {
        $.assign(result, arr.get(0n));
    }).catch(($, message, stack) => {
        $.assign(result, -1n);
    }).finally($ => {
        // Always cleanup, even if error occurred or early return
        $.assign(resource, false);
    });

    $.return(result);
});

const compiled = East.compile(processWithCleanup, []);
console.log(compiled([42n]));   // 42n (resource cleaned up)
console.log(compiled([]));      // -1n (resource still cleaned up despite error)
```

**Example: Finally with early returns**
```typescript
const searchWithCleanup = East.function([ArrayType(IntegerType), IntegerType], IntegerType, ($, arr, target) => {
    const searchExecuted = $.let(false);

    $.try($ => {
        $.for(arr, ($, value, i) => {
            $.if(East.equal(value, target), $ => {
                // Early return - finally still executes
                $.return(i);
            });
        });
        $.return(-1n);  // Not found
    }).finally($ => {
        // Executes even when returning from inside try block
        $.assign(searchExecuted, true);
    });

    return -1n;  // This line is unreachable
});

const compiled = East.compile(searchWithCleanup, []);
console.log(compiled([10n, 20n, 30n], 20n));  // 1n (searchExecuted = true)
console.log(compiled([10n, 20n, 30n], 99n));  // -1n (searchExecuted = true)
```

**Example: Try-finally without catch**
```typescript
const loggedOperation = East.function([IntegerType], IntegerType, ($, x) => {
    const logged = $.let(false);

    $.try($ => {
        // Operation that may or may not error
        $.return(x.divide(x));  // Returns 1n for any non-zero input
    }).finally($ => {
        // Log that operation was attempted, regardless of success
        $.assign(logged, true);
    });

    return 0n;  // Unreachable if divide succeeds
});

const compiled = East.compile(loggedOperation, []);
console.log(compiled(5n));  // 1n (logged = true)
```

**Important notes:**
- Cannot call `.catch()` twice on the same try block (throws error)
- Finally block is for side effects only - it cannot change the return value
- Finally executes even with early returns, breaks, or continues from try/catch
- Type of try-catch-finally expression is `TypeUnion<try_type, catch_type>` (finally ignored)

---

## Expressions

This section describes the operations available on each type's expressions.

### Boolean

Boolean expressions support logical operations and conditional branching using the ternary-like `ifElse` method.

**Example:**
```typescript
import { East, IntegerType, BooleanType } from "@elaraai/east";

const validateOrder = East.function([IntegerType, IntegerType, BooleanType], BooleanType, ($, quantity, price, isPremium) => {
    // Create mutable boolean - starts as true, can be updated
    const isValid = $.let(true);
    // Alternative ways to create boolean values:
    // const isValid = $.let(true, BooleanType);
    // const isValid = $.let(East.value(true));
    // const isValid = $.let(East.value(true, BooleanType));

    // Check if order is too expensive without approval
    $.if(East.greater(price, 10000n), $ => {
        $.assign(isValid, false);
    });

    // Check for invalid quantity or price
    $.if(East.less(quantity, 1n).or($ => East.less(price, 0n)), $ => {
        $.assign(isValid, false);
    });

    // Combine checks: valid AND (premium OR large order)
    const finalCheck = isValid.and($ => isPremium.or($ => East.greater(quantity, 100n)));

    $.return(finalCheck);
});

const compiled = East.compile(validateOrder, []);
console.log(compiled(150n, 500n, true));    // true
console.log(compiled(50n, 500n, false));    // false
console.log(compiled(0n, 50n, false));      // false (invalid quantity)
```

**Operations:**
| Signature | Description | Example |
|-----------|-------------|---------|
| **Short-Circuiting Operations** |
| `not(): BooleanExpr` | Logical NOT | `x.not()` |
| `and(y: ($) => BooleanExpr \| boolean): BooleanExpr` | Logical AND (short-circuit) | `x.and($ => y)` |
| `or(y: ($) => BooleanExpr \| boolean): BooleanExpr` | Logical OR (short-circuit) | `x.or($ => y)` |
| `ifElse(thenFn: ($) => any, elseFn: ($) => any): ExprType<TypeUnion<...>>` | Conditional expression (ternary) | `condition.ifElse($ => trueValue, $ => falseValue)` |
| **Non-Short-Circuiting Operations** |
| `bitAnd(y: BooleanExpr \| boolean): BooleanExpr` | Bitwise AND (always evaluates both) | `x.bitAnd(y)` |
| `bitOr(y: BooleanExpr \| boolean): BooleanExpr` | Bitwise OR (always evaluates both) | `x.bitOr(y)` |
| `bitXor(y: BooleanExpr \| boolean): BooleanExpr` | Bitwise XOR (always evaluates both) | `x.bitXor(y)` |


---

### Integer

Integer expressions (`IntegerExpr`) represent 64-bit signed integers with standard arithmetic, mathematical functions, and rich formatting utilities in the standard library.

**Example:**
```typescript
import { East, IntegerType, StringType } from "@elaraai/east";

const formatRevenue = East.function([IntegerType], StringType, ($, revenue) => {
    // Create integer value with $.let() and East.value() (type inference)
    const price = $.let(East.value(47n));
    const rounded = price.add(5n).divide(10n).multiply(10n); // Round to nearest 10

    // Alternative: Create integer value with $.let() and East.value() with explicit type
    const bonus = $.let(East.value(1000n, IntegerType));

    const quarterly = revenue.add(bonus).divide(12n).multiply(3n);

    $.return(East.str`Revenue: ${revenue}, Price: ${rounded}, Quarterly: ${quarterly}`);
});

const compiled = East.compile(formatRevenue, []);
console.log(compiled(1234567n));  // "Revenue: 1234567, Price: 50, Quarterly: 308641"
```

**Operations:**
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

**Standard Library:** See [STDLIB.md](./STDLIB.md#integer) for additional formatting and rounding functions.

---

### Float

Float expressions (`FloatExpr`) represent IEEE 754 double-precision floating-point numbers with standard arithmetic and mathematical functions.

**Example:**
```typescript
const calculateCircle = East.function([FloatType], FloatType, ($, radius) => {
    // Create float value with $.let() and East.value() (type inference)
    const pi = $.let(East.value(3.14159));
    const area = pi.multiply(radius.pow(2.0));

    // Alternative: Create float value with $.let() and East.value() with explicit type
    const scaleFactor = $.let(East.value(1.5, FloatType));

    const scaled = area.multiply(scaleFactor);

    $.return(scaled);
});

const compiled = East.compile(calculateCircle, []);
console.log(compiled(10.0));  // 471.2385
```

**Operations:**
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
| `toInteger(): IntegerExpr` **❗** | Convert to integer (must be exact, errors otherwise) | `x.toInteger()` |

---

### String

String expressions (`StringExpr`) provide text manipulation, pattern matching, encoding, and parsing capabilities.

**Example:**
```typescript
const processEmail = East.function([StringType], StringType, ($, email) => {
    const atIndex = email.indexOf("@");
    const domain = email.substring(atIndex.add(1n), email.length());

    // Create string value with $.let() and East.value() (type inference)
    const greeting = $.let(East.value("Hello"));

    // Alternative: Create string value with $.let() and East.value() with explicit type
    const separator = $.let(East.value(" ", StringType));

    const message = greeting.concat(separator).concat(domain);

    $.return(message.upperCase());
});

const compiled = East.compile(processEmail, []);
console.log(compiled("user@example.com"));  // "HELLO EXAMPLE.COM"
```

**Operations:**
| Signature | Description | Example |
|-----------|-------------|---------|
| **Manipulation** |
| `concat(other: StringExpr \| string): StringExpr` | Concatenate strings | `str.concat(" world")` |
| `repeat(count: IntegerExpr \| bigint): StringExpr` | Repeat string n times | `str.repeat(3n)` |
| `substring(from: IntegerExpr \| bigint, to: IntegerExpr \| bigint): StringExpr` | Extract substring | `str.substring(0n, 5n)` |
| `upperCase(): StringExpr` | Convert to uppercase | `str.upperCase()` |
| `lowerCase(): StringExpr` | Convert to lowercase | `str.lowerCase()` |
| `trim(): StringExpr` | Remove whitespace from both ends | `str.trim()` |
| `trimStart(): StringExpr` | Remove whitespace from start | `str.trimStart()` |
| `trimEnd(): StringExpr` | Remove whitespace from end | `str.trimEnd()` |
| `split(separator: StringExpr \| string): ArrayExpr<StringType>` | Split into array | `str.split(",")` |
| `replace(search: StringExpr \| string, replacement: StringExpr \| string): StringExpr` | Replace first occurrence | `str.replace("old", "new")` |
| **Query** |
| `length(): IntegerExpr` | Get string length (UTF-16 code units) | `str.length()` |
| `startsWith(prefix: StringExpr \| string): BooleanExpr` | Test if starts with prefix | `str.startsWith("Hello")` |
| `endsWith(suffix: StringExpr \| string): BooleanExpr` | Test if ends with suffix | `str.endsWith(".txt")` |
| `contains(substring: StringExpr \| string): BooleanExpr` | Test if contains substring | `str.contains("world")` |
| `contains(regex: RegExp): BooleanExpr` | Test if matches regex | `str.contains(/[0-9]+/)` |
| `indexOf(substring: StringExpr \| string): IntegerExpr` | Find index of substring (-1 if not found) | `str.indexOf("world")` |
| `indexOf(regex: RegExp): IntegerExpr` | Find index of regex match (-1 if not found) | `str.indexOf(/[0-9]+/)` |
| **Encoding** |
| `encodeUtf8(): BlobExpr` | Encode as UTF-8 bytes | `str.encodeUtf8()` |
| `encodeUtf16(): BlobExpr` | Encode as UTF-16 bytes (little-endian with BOM) | `str.encodeUtf16()` |
| **Parsing** |
| `parse<T extends DataType>(type: T): ExprType<T>` **❗** | Parse string to given type (fallible) | `str.parse(IntegerType)` |
| `parseJson<T extends DataType>(type: T): ExprType<T>` **❗** | Parse JSON to given type (fallible) | `str.parseJson(IntegerType)` |

**Standard Library:** See [STDLIB.md](./STDLIB.md#string) for error formatting utilities.

---

### DateTime

DateTime expressions (`DateTimeExpr`) represent UTC timestamps with millisecond precision, supporting component access, arithmetic, and rounding operations.

**Example:**
```typescript
const addBusinessDays = East.function([DateTimeType, IntegerType], DateTimeType, ($, startDate, days) => {
    // Create datetime value with $.let() and East.value() (type inference)
    const baseDate = $.let(East.value(new Date("2025-01-01T00:00:00Z")));

    // Alternative: Create datetime value with $.let() and East.value() with explicit type
    const epoch = $.let(East.value(new Date("1970-01-01T00:00:00Z"), DateTimeType));

    const result = startDate.addDays(days);
    const rounded = East.DateTime.roundDownDay(result, 1n);
    $.return(rounded);
});

const compiled = East.compile(addBusinessDays, []);
const start = new Date("2025-10-10T14:30:00Z");
const end = compiled(start, 7n);
console.log(end);  // 2025-10-17 00:00:00 UTC
```

**Operations:**
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
| `addMilliseconds(ms: IntegerExpr \| FloatExpr \| bigint \| number): DateTimeExpr` | Add milliseconds (int or float) | `date.addMilliseconds(1000n)` |
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
| `durationMilliseconds(other: DateTimeExpr \| Date): IntegerExpr` | Duration in milliseconds (positive if other > this) | `date.durationMilliseconds(otherDate)` |
| `durationSeconds(other: DateTimeExpr \| Date): FloatExpr` | Duration in seconds | `date.durationSeconds(otherDate)` |
| `durationMinutes(other: DateTimeExpr \| Date): FloatExpr` | Duration in minutes | `date.durationMinutes(otherDate)` |
| `durationHours(other: DateTimeExpr \| Date): FloatExpr` | Duration in hours | `date.durationHours(otherDate)` |
| `durationDays(other: DateTimeExpr \| Date): FloatExpr` | Duration in days | `date.durationDays(otherDate)` |
| `durationWeeks(other: DateTimeExpr \| Date): FloatExpr` | Duration in weeks | `date.durationWeeks(otherDate)` |
| **Conversion** |
| `toEpochMilliseconds(): IntegerExpr` | Milliseconds since Unix epoch | `date.toEpochMilliseconds()` |

**Standard Library:** See [STDLIB.md](./STDLIB.md#datetime) for construction from components and additional rounding functions.

---

### Blob

Blob expressions (`BlobExpr`) represent immutable binary data with byte access and encoding/decoding operations.

**Example:**
```typescript
const encodeData = East.function([IntegerType], BlobType, ($, value) => {
    const encoded = East.Blob.encodeBeast(value, 'v2');

    // Create blob value with $.let() and East.value() (type inference)
    const header = $.let(East.value(new Uint8Array([0x42, 0x45])));

    // Alternative: Create blob value with $.let() and East.value() with explicit type
    const footer = $.let(East.value(new Uint8Array([0xFF]), BlobType));

    $.return(encoded);
});

const compiled = East.compile(encodeData, []);
const blob = compiled(42n);
console.log(blob);  // Uint8Array containing BEAST-encoded 42n
```

**Operations:**
| Signature | Description | Example |
|-----------|-------------|---------|
| **Base Operations** |
| `size(): IntegerExpr` | Get size in bytes | `blob.size()` |
| `getUint8(offset: IntegerExpr \| bigint): IntegerExpr` **❗** | Get byte at offset (0-255, errors if out of bounds) | `blob.getUint8(0n)` |
| `decodeUtf8(): StringExpr` **❗** | Decode as UTF-8 (fallible) | `blob.decodeUtf8()` |
| `decodeUtf16(): StringExpr` **❗** | Decode as UTF-16 (fallible) | `blob.decodeUtf16()` |
| `decodeBeast<T extends EastType>(type: T, version: 'v1' \| 'v2' = 'v1'): ExprType<T>` **❗** | Decode binary BEAST format (v1 or v2, fallible) | `blob.decodeBeast(IntegerType, 'v2')` |

**Standard Library:** See [STDLIB.md](./STDLIB.md#blob) for BEAST encoding utilities.

---

### Array

Array expressions (`ArrayExpr<T>`) represent mutable, ordered collections with rich functional operations, mutations, and conversions.

**Example:**
```typescript
const processPrices = East.function([ArrayType(IntegerType)], IntegerType, ($, prices) => {
    const doubled = prices.map(($, x, i) => x.multiply(2n));
    const filtered = doubled.filter(($, x, i) => East.greater(x, 100n));
    const sum = filtered.sum();

    // Create array value with $.let() and East.value() (type inference)
    const bonuses = $.let(East.value([10n, 20n, 30n]));

    // Alternative: Create array value with $.let() and East.value() with explicit type
    const fees = $.let(East.value([5n, 10n], ArrayType(IntegerType)));

    $(prices.pushLast(999n));  // Mutate original array

    $.return(sum);
});

const compiled = East.compile(processPrices, []);
console.log(compiled([50n, 60n, 70n]));  // 260n (60*2 + 70*2)
```

**Operations:**
| Signature | Description | Example |
|-----------|-------------|---------|
| **Read Operations** |
| `size(): IntegerExpr` | Get array length | `array.size()` |
| `has(index: IntegerExpr \| bigint): BooleanExpr` | Check if index is valid (0 ≤ index < size) | `array.has(5n)` |
| `get<V extends EastType>(index: IntegerExpr \| bigint): ExprType<V>` **❗** | Get element (errors if out of bounds) | `array.get(0n)` |
| `get<V extends EastType>(index: IntegerExpr \| bigint, defaultFn: FunctionType<[IntegerType], V>): ExprType<V>` | Get element or compute default | `array.get(10n, East.function([IntegerType], IntegerType, ($, i) => 0n))` |
| `tryGet<V extends EastType>(index: IntegerExpr \| bigint): OptionExpr<V>` | Safe get returning Option | `array.tryGet(0n)` |
| **Mutation Operations** |
| `update<V extends EastType>(index: IntegerExpr \| bigint, value: ExprType<V> \| ValueTypeOf<V>): NullExpr` **❗** | Replace element (errors if out of bounds) | `array.update(0n, 42n)` |
| `merge<V extends EastType, T2 extends EastType>(index: IntegerExpr \| bigint, value: Expr<T2>, updateFn: FunctionType<[V, T2, IntegerType], V>): ExprType<V>` | Merge value with existing element using function | `array.merge(0n, 5n, ($, old, new, i) => old.add(new))` |
| `pushLast<V extends EastType>(value: ExprType<V> \| ValueTypeOf<V>): NullExpr` | Append to end | `array.pushLast(42n)` |
| `popLast<V extends EastType>(): ExprType<V>` **❗** | Remove from end (errors if empty) | `array.popLast()` |
| `pushFirst<V extends EastType>(value: ExprType<V> \| ValueTypeOf<V>): NullExpr` | Prepend to start | `array.pushFirst(42n)` |
| `popFirst<V extends EastType>(): ExprType<V>` **❗** | Remove from start (errors if empty) | `array.popFirst()` |
| `append<V extends EastType>(other: ArrayExpr<V>): NullExpr` | Append all elements from other array (mutating) | `array.append(otherArray)` |
| `prepend<V extends EastType>(other: ArrayExpr<V>): NullExpr` | Prepend all elements from other array (mutating) | `array.prepend(otherArray)` |
| `mergeAll<V extends EastType, T2 extends EastType>(other: ArrayExpr<T2>, mergeFn: FunctionType<[V, T2, IntegerType], V>): NullExpr` | Merge all elements from another array using function | `array.mergeAll(other, ($, cur, new, i) => cur.add(new))` |
| `clear(): NullExpr` | Remove all elements | `array.clear()` |
| `sortInPlace<V extends EastType>(byFn?: FunctionType<[V], DataType>): NullExpr` | Sort in-place | `array.sortInPlace()` |
| `reverseInPlace(): NullExpr` | Reverse in-place | `array.reverseInPlace()` |
| **Functional Operations (Immutable)** |
| `copy<V extends EastType>(): ArrayExpr<V>` | Shallow copy | `array.copy()` |
| `slice<V extends EastType>(start: IntegerExpr \| bigint, end: IntegerExpr \| bigint): ArrayExpr<V>` | Extract subarray | `array.slice(0n, 10n)` |
| `concat<V extends EastType>(other: ArrayExpr<V>): ArrayExpr<V>` | Concatenate into new array | `array.concat(otherArray)` |
| `getKeys<V extends EastType>(keys: ArrayExpr<IntegerType>, onMissing?: FunctionType<[IntegerType], V>): ArrayExpr<V>` | Get values at given indices | `array.getKeys(indices, East.function([IntegerType], IntegerType, ($, i) => 0n))` |
| `sort<V extends EastType>(byFn?: FunctionType<[V], DataType>): ArrayExpr<V>` | Return sorted copy | `array.sort()` |
| `reverse<V extends EastType>(): ArrayExpr<V>` | Return reversed copy | `array.reverse()` |
| `isSorted<V extends EastType>(byFn?: FunctionType<[V], DataType>): BooleanExpr` | Check if sorted | `array.isSorted()` |
| `findSortedFirst<V extends EastType, T2 extends EastType>(value: T2, byFn?: FunctionType<[V], TypeOf<T2>>): IntegerExpr` | Binary search for first element ≥ value | `array.findSortedFirst(42n)` |
| `findSortedLast<V extends EastType, T2 extends EastType>(value: T2, byFn?: FunctionType<[V], TypeOf<T2>>): IntegerExpr` | Binary search for last element ≤ value | `array.findSortedLast(42n)` |
| `findSortedRange<V extends EastType, T2 extends EastType>(value: T2, byFn?: FunctionType<[V], TypeOf<T2>>): StructExpr<{start, end}>` | Binary search for range of elements equal to value | `array.findSortedRange(42n)` |
| `map<V extends EastType, U extends EastType>(fn: FunctionType<[V, IntegerType], U>): ArrayExpr<U>` | Transform each element | `array.map(($, x, i) => x.multiply(2n))` |
| `filter<V extends EastType>(predicate: FunctionType<[V, IntegerType], BooleanType>): ArrayExpr<V>` | Keep matching elements | `array.filter(($, x, i) => East.greater(x, 0n))` |
| `filterMap<V extends EastType, U extends EastType>(fn: FunctionType<[V, IntegerType], OptionType<U>>): ArrayExpr<U>` | Filter and map using Option | `array.filterMap(($, x, i) => East.greater(x, 0n) ? East.some(x.multiply(2n)) : East.none())` |
| `firstMap<V extends EastType, U extends EastType>(fn: FunctionType<[V, IntegerType], OptionType<U>>): OptionExpr<U>` | Map until first successful result (returns Option) | `array.firstMap(($, x, i) => East.greater(x, 0n) ? East.some(x) : East.none())` |
| `findFirst<V extends EastType>(value: V): OptionExpr<IntegerType>` | Find index of first matching element | `array.findFirst(42n)` |
| `findFirst<V extends EastType, T2 extends EastType>(value: T2, by: FunctionType<[V, IntegerType], T2>): OptionExpr<IntegerType>` | Find first match with projection | `array.findFirst("active", ($, u, i) => u.status)` |
| `findAll<V extends EastType>(value: V): ArrayExpr<IntegerType>` | Find all indices of matching elements | `array.findAll(42n)` |
| `findAll<V extends EastType, T2 extends EastType>(value: T2, by: FunctionType<[V, IntegerType], T2>): ArrayExpr<IntegerType>` | Find all matches with projection | `array.findAll("active", ($, u, i) => u.status)` |
| `forEach<V extends EastType>(fn: FunctionType<[V, IntegerType], any>): NullExpr` | Execute function for each element | `array.forEach(($, x, i) => $(total.add(x)))` |
| **Reduction Operations** |
| `reduce<V extends EastType, T extends EastType>(combineFn: FunctionType<[T, V, IntegerType], T>, init: T): ExprType<T>` | Fold/reduce with initial value | `array.reduce(($, acc, x, i) => acc.add(x), 0n)` |
| `reduce<V extends EastType>(combineFn: FunctionType<[V, V, IntegerType], V>): ExprType<V>` | Fold/reduce without initial (uses first element) | `array.reduce(($, acc, x, i) => acc.add(x))` |
| `mapReduce<V extends EastType, U extends EastType, T extends EastType>(mapFn: FunctionType<[V, IntegerType], U>, combineFn: FunctionType<[T, U, IntegerType], T>, init: T): ExprType<T>` | Map then reduce with initial value | `array.mapReduce(($, x, i) => x.multiply(2n), ($, acc, x, i) => acc.add(x), 0n)` |
| `mapReduce<V extends EastType, U extends EastType>(mapFn: FunctionType<[V, IntegerType], U>, combineFn: FunctionType<[U, U, IntegerType], U>): ExprType<U>` | Map then reduce without initial | `array.mapReduce(($, x, i) => x.multiply(2n), ($, acc, x, i) => acc.add(x))` |
| `every<V extends EastType>(predicate?: FunctionType<[V, IntegerType], BooleanType>): BooleanExpr` | True if all match predicate | `array.every()` |
| `some<V extends EastType>(predicate?: FunctionType<[V, IntegerType], BooleanType>): BooleanExpr` | True if any match predicate | `array.some()` |
| `sum<V extends IntegerType \| FloatType>(): IntegerExpr \| FloatExpr` | Sum of numeric array | `array.sum()` |
| `sum<V extends EastType>(fn: FunctionType<[V, IntegerType], IntegerType \| FloatType>): IntegerExpr \| FloatExpr` | Sum with projection | `array.sum(($, x, i) => x.multiply(2n))` |
| `mean<V extends IntegerType \| FloatType>(): FloatExpr` | Mean (NaN if empty) | `array.mean()` |
| `mean<V extends EastType>(fn: FunctionType<[V, IntegerType], IntegerType \| FloatType>): FloatExpr` | Mean with projection | `array.mean(($, x, i) => x.toFloat())` |
| `findMaximum<V extends EastType>(by?: FunctionType<[V, IntegerType], any>): OptionExpr<IntegerType>` | Find index of maximum element | `array.findMaximum()` |
| `findMinimum<V extends EastType>(by?: FunctionType<[V, IntegerType], any>): OptionExpr<IntegerType>` | Find index of minimum element | `array.findMinimum()` |
| `maximum<V extends EastType>(by?: FunctionType<[V, IntegerType], any>): ExprType<V>` | Get maximum element value (errors if empty) | `array.maximum()` |
| `minimum<V extends EastType>(by?: FunctionType<[V, IntegerType], any>): ExprType<V>` | Get minimum element value (errors if empty) | `array.minimum()` |
| **Conversion Operations** |
| `stringJoin<V extends StringType>(separator: StringExpr \| string): StringExpr` | Join string array (only for `ArrayType<StringType>`) | `array.stringJoin(", ")` |
| `toSet<V extends EastType, K extends DataType>(keyFn?: FunctionType<[V, IntegerType], K>): SetExpr<K>` | Convert to set (ignoring duplicates) | `array.toSet()` |
| `toDict<V extends EastType, K extends DataType, U extends EastType>(keyFn?: FunctionType<[V, IntegerType], K>, valueFn?: FunctionType<[V, IntegerType], U>, onConflictFn?: FunctionType<[U, U, K], U>): DictExpr<K, U>` | Convert to dict | `array.toDict(($, x, i) => i)` |
| `flatMap<V extends EastType, U extends EastType>(fn?: FunctionType<[V, IntegerType], ArrayType<U>>): ArrayExpr<U>` | Flatten array of arrays | `array.flatMap()` |
| `flattenToSet<V extends EastType, K extends DataType>(fn?: FunctionType<[V, IntegerType], SetType<K>>): SetExpr<K>` | Flatten to set | `array.flattenToSet()` |
| `flattenToDict<V extends EastType, K extends DataType, U extends EastType>(fn?: FunctionType<[V, IntegerType], DictType<K, U>>, onConflictFn?: FunctionType<[U, U, K], U>): DictExpr<K, U>` | Flatten to dict | `array.flattenToDict()` |
| **Grouping Operations** |
| `groupReduce<V extends EastType, K extends DataType, U extends EastType, T extends EastType>(keyFn: FunctionType<[V, IntegerType], K>, valueFn: FunctionType<[V, IntegerType], U>, initFn: FunctionType<[K], T>, reduceFn: FunctionType<[T, U, K], T>): DictExpr<K, T>` | Group by key and reduce groups | `array.groupReduce(($, x, i) => x.remainder(2n), ($, x, i) => x, ($, key) => 0n, ($, acc, val, key) => acc.add(val))` |
| `groupSize<V extends EastType, K extends DataType>(keyFn?: FunctionType<[V, IntegerType], K>): DictExpr<K, IntegerType>` | Count elements in each group | `array.groupSize(($, x, i) => x.remainder(2n))` |
| `groupEvery<V extends EastType, K extends DataType>(keyFn: FunctionType<[V, IntegerType], K>, predFn: FunctionType<[V, IntegerType], BooleanType>): DictExpr<K, BooleanType>` | Check if all elements in each group match predicate | `array.groupEvery(($, x, i) => x.remainder(2n), ($, x, i) => East.greater(x, 0n))` |
| `groupSome<V extends EastType, K extends DataType>(keyFn: FunctionType<[V, IntegerType], K>, predFn: FunctionType<[V, IntegerType], BooleanType>): DictExpr<K, BooleanType>` | Check if any element in each group matches predicate | `array.groupSome(($, x, i) => x.remainder(2n), ($, x, i) => East.greater(x, 10n))` |
| `groupFindFirst<V extends EastType, K extends DataType, T2 extends EastType>(keyFn: FunctionType<[V, IntegerType], K>, value: T2, projFn?: FunctionType<[V, IntegerType], T2>): DictExpr<K, OptionType<IntegerType>>` | Find first matching index in each group | `array.groupFindFirst(($, x, i) => x.remainder(2n), 42n)` |
| `groupFindAll<V extends EastType, K extends DataType, T2 extends EastType>(keyFn: FunctionType<[V, IntegerType], K>, value: T2, projFn?: FunctionType<[V, IntegerType], T2>): DictExpr<K, ArrayType<IntegerType>>` | Find all matching indices in each group | `array.groupFindAll(($, x, i) => x.remainder(2n), 42n)` |
| `groupFindMinimum<V extends EastType, K extends DataType>(keyFn: FunctionType<[V, IntegerType], K>, byFn?: FunctionType<[V, IntegerType], any>): DictExpr<K, IntegerType>` | Find index of minimum in each group | `array.groupFindMinimum(($, x, i) => x.remainder(2n))` |
| `groupFindMaximum<V extends EastType, K extends DataType>(keyFn: FunctionType<[V, IntegerType], K>, byFn?: FunctionType<[V, IntegerType], any>): DictExpr<K, IntegerType>` | Find index of maximum in each group | `array.groupFindMaximum(($, x, i) => x.remainder(2n))` |
| `groupSum<V extends EastType, K extends DataType>(keyFn: FunctionType<[V, IntegerType], K>, valueFn?: FunctionType<[V, IntegerType], IntegerType \| FloatType>): DictExpr<K, IntegerType \| FloatType>` | Sum values in each group | `array.groupSum(($, x, i) => x.remainder(2n))` |
| `groupMean<V extends EastType, K extends DataType>(keyFn: FunctionType<[V, IntegerType], K>, valueFn?: FunctionType<[V, IntegerType], IntegerType \| FloatType>): DictExpr<K, FloatType>` | Mean of values in each group | `array.groupMean(($, x, i) => x.remainder(2n))` |
| `groupMinimum<V extends EastType, K extends DataType>(keyFn: FunctionType<[V, IntegerType], K>, byFn?: FunctionType<[V, IntegerType], any>): DictExpr<K, V>` | Get minimum value in each group | `array.groupMinimum(($, x, i) => x.remainder(2n))` |
| `groupMaximum<V extends EastType, K extends DataType>(keyFn: FunctionType<[V, IntegerType], K>, byFn?: FunctionType<[V, IntegerType], any>): DictExpr<K, V>` | Get maximum value in each group | `array.groupMaximum(($, x, i) => x.remainder(2n))` |
| `groupToArrays<V extends EastType, K extends DataType, U extends EastType>(keyFn: FunctionType<[V, IntegerType], K>, valueFn?: FunctionType<[V, IntegerType], U>): DictExpr<K, ArrayType<U>>` | Collect elements into arrays by group | `array.groupToArrays(($, x, i) => x.remainder(2n))` |
| `groupToSets<V extends EastType, K extends DataType, U extends DataType>(keyFn: FunctionType<[V, IntegerType], K>, valueFn?: FunctionType<[V, IntegerType], U>): DictExpr<K, SetType<U>>` | Collect elements into sets by group | `array.groupToSets(($, x, i) => x.remainder(2n))` |
| `groupToDicts<V extends EastType, K extends DataType, K2 extends DataType, U extends EastType>(keyFn: FunctionType<[V, IntegerType], K>, keyFn2: FunctionType<[V, IntegerType], K2>, valueFn?: FunctionType<[V, IntegerType], U>, combineFn?: FunctionType<[U, U, K2], U>): DictExpr<K, DictType<K2, U>>` | Collect elements into nested dicts | `array.groupToDicts(($, x, i) => x.remainder(2n), ($, x, i) => i, ($, x, i) => x)` |

**Standard Library:** See [STDLIB.md](./STDLIB.md#array) for array generation functions (range, linspace, generate).

---

### Set

Set expressions (`SetExpr<K>`) represent mutable, sorted collections of unique keys with set operations and functional transformations.

**Example:**
```typescript
const processSet = East.function([SetType(IntegerType), SetType(IntegerType)], IntegerType, ($, setA, setB) => {
    const unionSet = setA.union(setB);
    const intersection = setA.intersection(setB);

    // Create set value with $.let() and East.value() (type inference)
    const extras = $.let(East.value(new Set([100n, 200n])));

    // Alternative: Create set value with $.let() and East.value() with explicit type
    const defaults = $.let(East.value(new Set([1n, 2n]), SetType(IntegerType)));

    $(setA.insert(999n));  // Mutate original set

    const total = unionSet.sum();
    $.return(total);
});

const compiled = East.compile(processSet, []);
const a = new Set([1n, 2n, 3n]);
const b = new Set([3n, 4n, 5n]);
console.log(compiled(a, b));  // 15n (1+2+3+4+5)
```

**Operations:**
| Signature | Description | Example |
|-----------|-------------|---------|
| **Read Operations** |
| `size(): IntegerExpr` | Get set size | `set.size()` |
| `has<K extends DataType>(key: ExprType<K> \| ValueTypeOf<K>): BooleanExpr` | Check if key exists | `set.has(42n)` |
| **Mutation Operations** |
| `insert<K extends DataType>(key: ExprType<K> \| ValueTypeOf<K>): NullExpr` **❗** | Insert key (errors if exists) | `set.insert(42n)` |
| `tryInsert<K extends DataType>(key: ExprType<K> \| ValueTypeOf<K>): BooleanExpr` | Safe insert (returns success) | `set.tryInsert(42n)` |
| `delete<K extends DataType>(key: ExprType<K> \| ValueTypeOf<K>): NullExpr` **❗** | Delete key (errors if missing) | `set.delete(42n)` |
| `tryDelete<K extends DataType>(key: ExprType<K> \| ValueTypeOf<K>): BooleanExpr` | Safe delete (returns success) | `set.tryDelete(42n)` |
| `clear(): NullExpr` | Remove all elements | `set.clear()` |
| `unionInPlace<K extends DataType>(other: SetExpr<K>): NullExpr` | Union in-place (mutating) | `set.unionInPlace(otherSet)` |
| **Set Operations** |
| `copy<K extends DataType>(): SetExpr<K>` | Shallow copy | `set.copy()` |
| `union<K extends DataType>(other: SetExpr<K>): SetExpr<K>` | Return union | `set.union(otherSet)` |
| `intersection<K extends DataType>(other: SetExpr<K>): SetExpr<K>` | Return intersection | `set.intersection(otherSet)` |
| `difference<K extends DataType>(other: SetExpr<K>): SetExpr<K>` | Return difference (in this, not in other) | `set.difference(otherSet)` |
| `symmetricDifference<K extends DataType>(other: SetExpr<K>): SetExpr<K>` | Return symmetric difference | `set.symmetricDifference(otherSet)` |
| `isSubsetOf<K extends DataType>(other: SetExpr<K>): BooleanExpr` | Check if subset | `set.isSubsetOf(otherSet)` |
| `isSupersetOf<K extends DataType>(other: SetExpr<K>): BooleanExpr` | Check if superset | `set.isSupersetOf(otherSet)` |
| `isDisjointFrom<K extends DataType>(other: SetExpr<K>): BooleanExpr` | Check if no common elements | `set.isDisjointFrom(otherSet)` |
| **Functional Operations (Immutable)** |
| `filter<K extends DataType>(predicate: FunctionType<[K], BooleanType>): SetExpr<K>` | Keep matching elements | `set.filter(($, key) => East.greater(key, 0n))` |
| `filterMap<K extends DataType, V extends EastType>(fn: FunctionType<[K], OptionType<V>>): ArrayExpr<V>` | Filter and map using Option | `set.filterMap(($, key) => East.greater(key, 0n) ? East.some(key) : East.none())` |
| `firstMap<K extends DataType, V extends EastType>(fn: FunctionType<[K], OptionType<V>>): OptionExpr<V>` | Map until first successful result | `set.firstMap(($, key) => East.greater(key, 10n) ? East.some(key) : East.none())` |
| `forEach<K extends DataType>(fn: FunctionType<[K], any>): NullExpr` | Execute function for each element | `set.forEach(($, key) => $(arr.pushLast(key)))` |
| `map<K extends DataType, V extends EastType>(fn: FunctionType<[K], V>): DictExpr<K, V>` | Map to dict (keys unchanged, values from fn) | `set.map(($, key) => key.multiply(2n))` |
| `reduce<K extends DataType, T extends EastType>(fn: FunctionType<[T, K], T>, init: T): ExprType<T>` | Fold/reduce over set | `set.reduce(($, acc, key) => acc.add(key), 0n)` |
| `every<K extends DataType>(fn?: FunctionType<[K], BooleanType>): BooleanExpr` | True if all match | `set.every()` |
| `some<K extends DataType>(fn?: FunctionType<[K], BooleanType>): BooleanExpr` | True if any match | `set.some()` |
| `sum<K extends IntegerType \| FloatType>(): IntegerExpr \| FloatExpr` | Sum of numeric set | `set.sum()` |
| `sum<K extends DataType>(fn: FunctionType<[K], IntegerType \| FloatType>): IntegerExpr \| FloatExpr` | Sum with projection | `set.sum(($, key) => key.multiply(2n))` |
| `mean<K extends IntegerType \| FloatType>(): FloatExpr` | Mean (NaN if empty) | `set.mean()` |
| `mean<K extends DataType>(fn: FunctionType<[K], IntegerType \| FloatType>): FloatExpr` | Mean with projection | `set.mean(($, key) => key.toFloat())` |
| **Conversion Operations** |
| `toArray<K extends DataType, V extends EastType>(fn?: FunctionType<[K], V>): ArrayExpr<V>` | Convert to array | `set.toArray()` |
| `toSet<K extends DataType, U extends DataType>(keyFn?: FunctionType<[K], U>): SetExpr<U>` | Convert to new set (ignoring duplicates) | `set.toSet(($, key) => key.multiply(2n))` |
| `toDict<K extends DataType, K2 extends DataType, V extends EastType>(keyFn?: FunctionType<[K], K2>, valueFn?: FunctionType<[K], V>, onConflictFn?: FunctionType<[V, V, K2], V>): DictExpr<K2, V>` | Convert to dict | `set.toDict()` |
| `flattenToArray<K extends DataType, V extends EastType>(fn: FunctionType<[K], ArrayType<V>>): ArrayExpr<V>` | Flatten to array | `set.flattenToArray(($, key) => East.Array.range(0n, key))` |
| `flattenToSet<K extends DataType, U extends DataType>(fn: FunctionType<[K], SetType<U>>): SetExpr<U>` | Flatten to set | `set.flattenToSet(($, key) => otherSetDict.get(key))` |
| `flattenToDict<K extends DataType, K2 extends DataType, V extends EastType>(fn: FunctionType<[K], DictType<K2, V>>, onConflictFn?: FunctionType<[V, V, K2], V>): DictExpr<K2, V>` | Flatten to dict | `set.flattenToDict(($, key) => nestedDicts.get(key), ($, v1, v2, k) => v1.add(v2))` |
| **Grouping Operations** |
| `groupReduce<K extends DataType, K2 extends DataType, V extends EastType, T extends EastType>(keyFn: FunctionType<[K], K2>, valueFn: FunctionType<[K], V>, initFn: FunctionType<[K2], T>, reduceFn: FunctionType<[T, V, K2], T>): DictExpr<K2, T>` | Group by key and reduce groups | `set.groupReduce(($, key) => key.remainder(2n), ($, key) => key, ($, grp) => 0n, ($, acc, val, grp) => acc.add(val))` |
| `groupSize<K extends DataType, K2 extends DataType>(keyFn?: FunctionType<[K], K2>): DictExpr<K2, IntegerType>` | Count elements in each group | `set.groupSize(($, key) => key.remainder(2n))` |
| `groupEvery<K extends DataType, K2 extends DataType>(keyFn: FunctionType<[K], K2>, predFn: FunctionType<[K], BooleanType>): DictExpr<K2, BooleanType>` | Check if all elements in each group match predicate | `set.groupEvery(($, key) => key.remainder(2n), ($, key) => East.greater(key, 0n))` |
| `groupSome<K extends DataType, K2 extends DataType>(keyFn: FunctionType<[K], K2>, predFn: FunctionType<[K], BooleanType>): DictExpr<K2, BooleanType>` | Check if any element in each group matches predicate | `set.groupSome(($, key) => key.remainder(2n), ($, key) => East.greater(key, 10n))` |
| `groupSum<K extends DataType, K2 extends DataType>(keyFn: FunctionType<[K], K2>, valueFn?: FunctionType<[K], IntegerType \| FloatType>): DictExpr<K2, IntegerType \| FloatType>` | Sum values in each group | `set.groupSum(($, key) => key.remainder(2n))` |
| `groupMean<K extends DataType, K2 extends DataType>(keyFn: FunctionType<[K], K2>, valueFn?: FunctionType<[K], IntegerType \| FloatType>): DictExpr<K2, FloatType>` | Mean of values in each group | `set.groupMean(($, key) => key.remainder(2n))` |
| `groupToArrays<K extends DataType, K2 extends DataType, V extends EastType>(keyFn: FunctionType<[K], K2>, valueFn?: FunctionType<[K], V>): DictExpr<K2, ArrayType<V>>` | Collect elements into arrays by group | `set.groupToArrays(($, key) => key.remainder(2n))` |
| `groupToSets<K extends DataType, K2 extends DataType, U extends DataType>(keyFn: FunctionType<[K], K2>, valueFn?: FunctionType<[K], U>): DictExpr<K2, SetType<U>>` | Collect elements into sets by group | `set.groupToSets(($, key) => key.remainder(2n))` |
| `groupToDicts<K extends DataType, K2 extends DataType, K3 extends DataType, V extends EastType>(keyFn: FunctionType<[K], K2>, keyFn2: FunctionType<[K], K3>, valueFn?: FunctionType<[K], V>, combineFn?: FunctionType<[V, V, K3], V>): DictExpr<K2, DictType<K3, V>>` | Collect elements into nested dicts | `set.groupToDicts(($, key) => key.remainder(2n), ($, key) => key, ($, key) => key)` |

**Standard Library:** See [STDLIB.md](./STDLIB.md#set) for set generation functions.

---

### Dict

Dict expressions (`DictExpr<K, V>`) represent mutable, sorted key-value mappings with functional operations and flexible merging strategies.


**Example:**
```typescript
import { East, DictType, StringType, IntegerType } from "@elaraai/east";

const inventoryLookup = East.function([DictType(StringType, IntegerType), StringType], IntegerType, ($, inventory, item) => {
    const count = inventory.get(item, East.function([StringType], IntegerType, ($, key) => 0n));

    // Create dict value with $.let() and East.value() (type inference)
    const defaults = $.let(East.value(new Map([["apple", 0n], ["banana", 0n]])));

    // Alternative: Create dict value with $.let() and East.value() with explicit type
    const prices = $.let(East.value(new Map([["apple", 5n]]), DictType(StringType, IntegerType)));

    $(inventory.merge("widget", 5n, ($, old, newVal, key) => old.add(newVal)));

    const total = inventory.sum();
    $.return(count);
});

const compiled = East.compile(inventoryLookup, []);
const inventory = new Map([["apple", 10n], ["banana", 5n]]);
console.log(compiled(inventory, "apple"));  // 10n
```

**Operations:**
| Signature | Description | Example |
|-----------|-------------|---------|
| **Read Operations** |
| `size(): IntegerExpr` | Get dict size | `dict.size()` |
| `has<K extends DataType>(key: ExprType<K> \| ValueTypeOf<K>): BooleanExpr` | Check if key exists | `dict.has("foo")` |
| `get<K extends DataType, V extends EastType>(key: ExprType<K> \| ValueTypeOf<K>): ExprType<V>` **❗** | Get value (errors if missing) | `dict.get("foo")` |
| `get<K extends DataType, V extends EastType>(key: ExprType<K> \| ValueTypeOf<K>, defaultFn: FunctionType<[K], V>): ExprType<V>` | Get value or compute default | `dict.get("foo", East.function([StringType], IntegerType, ($, key) => 0n))` |
| `tryGet<K extends DataType, V extends EastType>(key: ExprType<K> \| ValueTypeOf<K>): OptionExpr<V>` | Safe get returning Option | `dict.tryGet("foo")` |
| `keys<K extends DataType>(): SetExpr<K>` | Get all keys as set | `dict.keys()` |
| `getKeys<K extends DataType, V extends EastType>(keys: SetExpr<K>, onMissing?: FunctionType<[K], V>): DictExpr<K, V>` | Get values for given keys | `dict.getKeys(keySet, East.function([StringType], IntegerType, ($, key) => 0n))` |
| **Mutation Operations** |
| `insert<K extends DataType, V extends EastType>(key: ExprType<K> \| ValueTypeOf<K>, value: ExprType<V> \| ValueTypeOf<V>): NullExpr` **❗** | Insert (errors if exists) | `dict.insert("foo", 42n)` |
| `insertOrUpdate<K extends DataType, V extends EastType>(key: ExprType<K> \| ValueTypeOf<K>, value: ExprType<V> \| ValueTypeOf<V>): NullExpr` | Insert or update (idempotent) | `dict.insertOrUpdate("foo", 42n)` |
| `update<K extends DataType, V extends EastType>(key: ExprType<K> \| ValueTypeOf<K>, value: ExprType<V> \| ValueTypeOf<V>): NullExpr` **❗** | Update existing (errors if missing) | `dict.update("foo", 100n)` |
| `merge<K extends DataType, V extends EastType, T2 extends EastType>(key: ExprType<K> \| ValueTypeOf<K>, value: T2, updateFn: FunctionType<[V, T2, K], V>, initialFn?: FunctionType<[K], V>): NullExpr` | Merge value with existing using function | `dict.merge("count", 1n, ($, old, new, key) => old.add(new), ($, key) => 0n)` |
| `getOrInsert<K extends DataType, V extends EastType>(key: ExprType<K> \| ValueTypeOf<K>, defaultFn: FunctionType<[K], V>): ExprType<V>` | Get or insert default if missing | `dict.getOrInsert("foo", East.function([StringType], IntegerType, ($, key) => 0n))` |
| `delete<K extends DataType>(key: ExprType<K> \| ValueTypeOf<K>): NullExpr` **❗** | Delete (errors if missing) | `dict.delete("foo")` |
| `tryDelete<K extends DataType>(key: ExprType<K> \| ValueTypeOf<K>): BooleanExpr` | Safe delete (returns success) | `dict.tryDelete("foo")` |
| `pop<K extends DataType, V extends EastType>(key: ExprType<K> \| ValueTypeOf<K>): ExprType<V>` **❗** | Remove and return value (errors if missing) | `dict.pop("foo")` |
| `swap<K extends DataType, V extends EastType>(key: ExprType<K> \| ValueTypeOf<K>, value: ExprType<V> \| ValueTypeOf<V>): ExprType<V>` **❗** | Replace and return old value (errors if missing) | `dict.swap("foo", 100n)` |
| `clear(): NullExpr` | Remove all entries | `dict.clear()` |
| `unionInPlace<K extends DataType, V extends EastType>(other: DictExpr<K, V>, mergeFn?: FunctionType<[V, V, K], V>): NullExpr` **❗** | Union in-place (errors on conflict without mergeFn) | `dict.unionInPlace(otherDict, ($, v1, v2, key) => v2)` |
| `mergeAll<K extends DataType, V extends EastType, V2 extends EastType>(other: DictExpr<K, V2>, mergeFn: FunctionType<[V, V2, K], V>, initialFn?: FunctionType<[K], V>): NullExpr` | Merge all entries from another dict | `dict.mergeAll(other, ($, cur, new, key) => cur.add(new))` |
| **Functional Operations** |
| `copy<K extends DataType, V extends EastType>(): DictExpr<K, V>` | Shallow copy | `dict.copy()` |
| `map<K extends DataType, V extends EastType, U extends EastType>(fn: FunctionType<[V, K], U>): DictExpr<K, U>` | Transform values (keys unchanged) | `dict.map(($, val, key) => val.multiply(2n))` |
| `filter<K extends DataType, V extends EastType>(predicate: FunctionType<[V, K], BooleanType>): DictExpr<K, V>` | Keep matching entries | `dict.filter(($, val, key) => East.greater(val, 0n))` |
| `filterMap<K extends DataType, V extends EastType, U extends EastType>(fn: FunctionType<[V, K], OptionType<U>>): DictExpr<K, U>` | Filter and map using Option | `dict.filterMap(($, val, key) => East.greater(val, 0n) ? East.some(val.multiply(2n)) : East.none())` |
| `firstMap<K extends DataType, V extends EastType, U extends EastType>(fn: FunctionType<[V, K], OptionType<U>>): OptionExpr<U>` | Map until first successful result | `dict.firstMap(($, val, key) => East.greater(val, 10n) ? East.some(val) : East.none())` |
| `forEach<K extends DataType, V extends EastType>(fn: FunctionType<[V, K], any>): NullExpr` | Execute function for each entry | `dict.forEach(($, val, key) => $(arr.pushLast(val)))` |
| `reduce<K extends DataType, V extends EastType, T extends EastType>(fn: FunctionType<[T, V, K], T>, init: T): ExprType<T>` | Fold/reduce over dict | `dict.reduce(($, acc, val, key) => acc.add(val), 0n)` |
| `every<K extends DataType, V extends EastType>(fn?: FunctionType<[V, K], BooleanType>): BooleanExpr` | True if all match | `dict.every()` |
| `some<K extends DataType, V extends EastType>(fn?: FunctionType<[V, K], BooleanType>): BooleanExpr` | True if any match | `dict.some()` |
| `sum<V extends IntegerType \| FloatType>(): IntegerExpr \| FloatExpr` | Sum of numeric values | `dict.sum()` |
| `sum<K extends DataType, V extends EastType>(fn: FunctionType<[V, K], IntegerType \| FloatType>): IntegerExpr \| FloatExpr` | Sum with projection | `dict.sum(($, val, key) => val.multiply(2n))` |
| `mean<V extends IntegerType \| FloatType>(): FloatExpr` | Mean (NaN if empty) | `dict.mean()` |
| `mean<K extends DataType, V extends EastType>(fn: FunctionType<[V, K], IntegerType \| FloatType>): FloatExpr` | Mean with projection | `dict.mean(($, val, key) => val.toFloat())` |
| **Conversion Operations** |
| `toArray<K extends DataType, V extends EastType, U extends EastType>(fn?: FunctionType<[V, K], U>): ArrayExpr<U>` | Convert to array | `dict.toArray()` |
| `toSet<K extends DataType, V extends EastType, U extends DataType>(keyFn?: FunctionType<[V, K], U>): SetExpr<U>` | Convert to set (ignoring duplicates) | `dict.toSet(($, val, key) => key)` |
| `toDict<K extends DataType, V extends EastType, K2 extends DataType, V2 extends EastType>(keyFn?: FunctionType<[V, K], K2>, valueFn?: FunctionType<[V, K], V2>, onConflictFn?: FunctionType<[V2, V2, K2], V2>): DictExpr<K2, V2>` | Convert to new dict | `dict.toDict(($, val, key) => key)` |
| `flattenToArray<K extends DataType, V extends EastType, U extends EastType>(fn?: FunctionType<[V, K], ArrayType<U>>): ArrayExpr<U>` | Flatten to array | `dict.flattenToArray()` |
| `flattenToSet<K extends DataType, V extends EastType, K2 extends DataType>(fn?: FunctionType<[V, K], SetType<K2>>): SetExpr<K2>` | Flatten to set | `dict.flattenToSet()` |
| `flattenToDict<K extends DataType, V extends EastType, K2 extends DataType, V2 extends EastType>(fn?: FunctionType<[V, K], DictType<K2, V2>), onConflictFn?: FunctionType<[V2, V2, K2], V2>): DictExpr<K2, V2>` | Flatten to dict | `dict.flattenToDict()` |
| **Grouping Operations** |
| `groupReduce<K extends DataType, V extends EastType, K2 extends DataType, U extends EastType, T extends EastType>(keyFn: FunctionType<[V, K], K2>, valueFn: FunctionType<[V, K], U>, initFn: FunctionType<[K2], T>, reduceFn: FunctionType<[T, U, K2], T>): DictExpr<K2, T>` | Group by key and reduce groups | `dict.groupReduce(($, val, key) => key.remainder(2n), ($, val, key) => val, ($, grp) => 0n, ($, acc, v, grp) => acc.add(v))` |
| `groupSize<K extends DataType, V extends EastType, K2 extends DataType>(keyFn?: FunctionType<[V, K], K2>): DictExpr<K2, IntegerType>` | Count elements in each group | `dict.groupSize(($, val, key) => key.remainder(2n))` |
| `groupEvery<K extends DataType, V extends EastType, K2 extends DataType>(keyFn: FunctionType<[V, K], K2>, predFn: FunctionType<[V, K], BooleanType>): DictExpr<K2, BooleanType>` | Check if all elements in each group match predicate | `dict.groupEvery(($, val, key) => key.remainder(2n), ($, val, key) => East.greater(val, 0n))` |
| `groupSome<K extends DataType, V extends EastType, K2 extends DataType>(keyFn: FunctionType<[V, K], K2>, predFn: FunctionType<[V, K], BooleanType>): DictExpr<K2, BooleanType>` | Check if any element in each group matches predicate | `dict.groupSome(($, val, key) => key.remainder(2n), ($, val, key) => East.greater(val, 10n))` |
| `groupSum<K extends DataType, V extends EastType, K2 extends DataType>(keyFn: FunctionType<[V, K], K2>, valueFn?: FunctionType<[V, K], IntegerType \| FloatType>): DictExpr<K2, IntegerType \| FloatType>` | Sum values in each group | `dict.groupSum(($, val, key) => key.remainder(2n))` |
| `groupMean<K extends DataType, V extends EastType, K2 extends DataType>(keyFn: FunctionType<[V, K], K2>, valueFn?: FunctionType<[V, K], IntegerType \| FloatType>): DictExpr<K2, FloatType>` | Mean of values in each group | `dict.groupMean(($, val, key) => key.remainder(2n))` |
| `groupToArrays<K extends DataType, V extends EastType, K2 extends DataType, U extends EastType>(keyFn: FunctionType<[V, K], K2>, valueFn?: FunctionType<[V, K], U>): DictExpr<K2, ArrayType<U>>` | Collect elements into arrays by group | `dict.groupToArrays(($, val, key) => key.remainder(2n))` |
| `groupToSets<K extends DataType, V extends EastType, K2 extends DataType, U extends DataType>(keyFn: FunctionType<[V, K], K2>, valueFn?: FunctionType<[V, K], U>): DictExpr<K2, SetType<U>>` | Collect elements into sets by group | `dict.groupToSets(($, val, key) => key.remainder(2n))` |
| `groupToDicts<K extends DataType, V extends EastType, K2 extends DataType, K3 extends DataType, U extends EastType>(keyFn: FunctionType<[V, K], K2>, keyFn2: FunctionType<[V, K], K3>, valueFn?: FunctionType<[V, K], U>, combineFn?: FunctionType<[U, U, K3], U>): DictExpr<K2, DictType<K3, U>>` | Collect elements into nested dicts | `dict.groupToDicts(($, val, key) => key.remainder(2n), ($, val, key) => key, ($, val, key) => val)` |

**Standard Library:** See [STDLIB.md](./STDLIB.md#dict) for dict generation functions.

---

### Struct

Struct fields are accessed directly as properties.


**Example:**
```typescript
const PersonType = StructType({ name: StringType, age: IntegerType });

const updateAge = East.function([PersonType, IntegerType], PersonType, ($, person, yearsToAdd) => {
    const newAge = person.age.add(yearsToAdd);

    // Create struct value with $.let() and East.value() (type inference)
    const updated = $.let(East.value({ ...person, age: newAge }));

    // Alternative: Create struct value with $.let() and East.value() with explicit type
    const defaultPerson = $.let(East.value({ name: "Unknown", age: 0n }, PersonType));

    $.return(updated);
});

const compiled = East.compile(updateAge, []);
const result = compiled({ name: "Alice", age: 30n }, 5n);
console.log(result);  // { name: "Alice", age: 35n }
```

**Operations:**
| Signature | Description | Example |
|-----------|-------------|---------|
| **Read Operations** |
| `field: ExprType<Fields[field]>` | Access struct field | `person.name` |

**Notes:**
- Structs are immutable (use spread to create modified copies)

---

### Variant

Variants represent tagged unions (sum types).

**Example:**

```typescript
import { East, variant, VariantType, IntegerType, NullType } from "@elaraai/east";

const OptionType = VariantType({ Some: IntegerType, None: NullType });

const processOption = East.function([OptionType], IntegerType, ($, value) => {
    // Create variant value with $.let() and East.value() (type inference)
    const defaultValue = $.let(East.value(variant("None", null)));

    // Alternative: Create variant value with $.let() and East.value() with explicit type
    const someValue = $.let(East.value(variant("Some", 10n), OptionType));

    // Pattern match using statement form
    const result = $.let(0n);
    $.match(value, {
        Some: ($, x) => $.assign(result, x.add(1n)),
        None: $ => $.assign(result, 0n),
    });
    $.return(result);
});

const compiled = East.compile(processOption, []);
console.log(compiled(variant("Some", 41n)));  // 42n
console.log(compiled(variant("None", null))); // 0n
```

**Operations:**
| Signature | Description | Example |
|-----------|-------------|---------|
| **Base Operations** |
| `match(cases: { [K]: ($, data) => Expr }): ExprType<T>` | Pattern match on all cases | `opt.match({ Some: ($, x) => x, None: $ => 0n })` |
| `unwrap(tag?: string): ExprType<Cases[tag]>` **❗** | Extract value (errors if wrong tag) | `opt.unwrap("Some")` |
| `unwrap(tag: string, defaultFn: ($) => Expr): ExprType<Cases[tag]>` | Extract value or compute default | `opt.unwrap("Some", $ => 0n)` |
| `getTag(): StringExpr` | Get tag as string | `opt.getTag()` |
| `hasTag(tag: string): BooleanExpr` | Check if has specific tag | `opt.hasTag("Some")` |
---

### Ref

Ref expressions (`RefExpr<T>`) represent mutable reference cells that can be shared across closures and modified. Unlike variables declared with `$.let()`, references can be captured and modified from within nested functions.

**Example:**
```typescript
import { East, ref, RefType, IntegerType } from "@elaraai/east";

const sharedCounter = East.function([], IntegerType, ($) => {
    // Create ref value with $.let() and East.value() (type inference)
    const counter = $.let(East.value(ref(0n)));

    // Alternative: Create ref value with $.let() and East.value() with explicit type
    const total = $.let(East.value(ref(100n), RefType(IntegerType)));

    // Update the reference
    $(counter.update(counter.get().add(1n)));

    // Merge with a function
    $(counter.merge(5n, ($, current, delta) => current.add(delta)));

    $.return(counter.get());
});

const compiled = East.compile(sharedCounter, []);
console.log(compiled());  // 6n
```

**Operations:**
| Signature | Description | Example |
|-----------|-------------|---------|
| **Base Operations** |
| `get(): ExprType<T>` | Get current value from reference cell | `refCell.get()` |
| `update(value: ExprType<T> \| ValueTypeOf<T>): NullExpr` | Replace value in reference cell | `refCell.update(42n)` |
| `merge<T2>(value: Expr<T2>, updateFn: FunctionType<[T, T2], T>): NullExpr` | Merge value using function (current, new) => result | `refCell.merge(5n, ($, cur, new) => cur.add(new))` |

**Notes:**
- Refs are mutable containers with identity semantics
- Useful for shared state across closures
- Can be compared for reference equality using `East.is()`

---
