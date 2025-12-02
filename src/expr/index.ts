/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */

// Re-export all types
export * from './types.js';

// Re-export abstract base and concrete classes
import { Expr } from './expr.js';
export { Expr } from './expr.js';

// Import factory implementation
import { from, equal, notEqual, less, lessEqual, print, is, greaterEqual, greater, func, str, platform } from './block.js';
export { BlockBuilder } from './block.js';
// import type { FunctionExpr } from './function.js';


// Import standard libraries
import IntegerLib from './libs/integer.js';
import FloatLib from './libs/float.js';
import DateTimeLib from './libs/datetime.js';
import StringLib from './libs/string.js';
import BlobLib from './libs/blob.js';
import ArrayLib from './libs/array.js';
import SetLib from './libs/set.js';
import DictLib from './libs/dict.js';

// Set up the factory in concrete classes so they can create expressions
// This allows methods like str.length() to work without passing factory manually
export type { ToExpr as ExprFactory } from './expr.js';

// /** Compile an East function to executable JavaScript.
//  *
//  * This is a convenience wrapper around `fn.toIR().compile(platform)`.
//  *
//  * @param fn - The East function to compile
//  * @param platform - Object mapping platform function names to their JavaScript implementations
//  * @returns Compiled JavaScript function that can be called with the specified input types
//  *
//  * @example
//  * ```ts
//  * const add = East.function([IntegerType, IntegerType], IntegerType, ($, a, b) => a.add(b));
//  * const compiled = East.compile(add, {});
//  * const result = compiled(5n, 3n); // 8n
//  * ```
//  */
// function compile<I extends any[], O extends any>(
//   fn: FunctionExpr<I, O>,
//   platform: Record<string, (...args: any[]) => any>
// ): any {
//   return fn.toIR().compile(platform);
// }

/**
 * Standard entry point for constructing East expressions.
 *
 * @example
 * ```ts
 * // Create expressions from values
 * East.value(3.14).add(2)
 *
 * // String interpolation
 * East.str`Hello, ${name}!`
 *
 * // Comparisons
 * East.equal(x, y)
 * East.less(x, y)
 *
 * // Create functions
 * East.function([IntegerType], IntegerType, ($, x) => $.return(x.add(1n)))
 *
 * // Standard library
 * East.Integer.printCommaSeperated(1234567890n)
 * East.Array.range(0n, 10n)
 * ```
 */
export const East = {
  // Expr factories

  /**
   * Creates an East expression from a JavaScript value.
   * Type is inferred from the value, or can be explicitly specified.
   *
   * @param value - The JavaScript value to convert to an East expression
   * @param type - Optional explicit type specification
   * @returns An East expression wrapping the value
   *
   * @example
   * ```ts
   * East.value(42n)                    // IntegerExpr
   * East.value(3.14)                   // FloatExpr
   * East.value("hello")                // StringExpr
   * East.value([1n, 2n, 3n])           // ArrayExpr<IntegerType>
   * East.value(new Map([[1n, "a"]]))   // DictExpr<IntegerType, StringType>
   * ```
   */
  value: from,

  /**
   * Creates a string expression with interpolation support.
   * Allows embedding East expressions inside template literals.
   *
   * @returns A StringExpr with the interpolated values
   *
   * @example
   * ```ts
   * East.str`Hello, ${name}!`
   * East.str`Total: ${count} items`
   * East.str`Result: ${x.add(y)}`
   * ```
   */
  str,

  /**
   * Creates an East function with typed inputs and output.
   * Functions can be nested, serialized to IR, and compiled to JavaScript.
   *
   * @param inputs - Array of East types for function parameters
   * @param output - East type for function return value
   * @param body - Function body using block builder and parameters
   * @returns A FunctionExpr that can be compiled or serialized
   *
   * @example
   * ```ts
   * const add = East.function(
   *   [IntegerType, IntegerType],
   *   IntegerType,
   *   ($, a, b) => $.return(a.add(b))
   * );
   *
   * const fibonacci = East.function([IntegerType], IntegerType, ($, n) => {
   *   $.if(East.lessEqual(n, 1n), $ => $.return(n));
   *   $.return(fibonacci(n.subtract(1n)).add(fibonacci(n.subtract(2n))));
   * });
   * ```
   */
  function: func,

  /**
   * Defines a platform function that can be called from East code.
   * Platform functions allow East code to interact with the external environment.
   *
   * @param name - The name of the platform function
   * @param inputs - Array of East types for the function parameters
   * @param output - East type for the function return value
   * @returns A callable platform function helper
   *
   * @example
   * ```ts
   * const log = East.platform("log", [StringType], NullType);
   * const readFile = East.platform("readFile", [StringType], StringType);
   *
   * const myFunction = East.function([StringType], NullType, ($, msg) => {
   *   $(log(East.str`Message: ${msg}`));
   *   $.return(null);
   * });
   *
   * const platform = [
   *   log.implement(console.log),
   *   readFile.implement(fs.readFileSync),
   * ];
   * ```
   */
  platform,
  // compile,
  // block,
  // error,
  // tryCatch,
  // match: matchExpr,

  // builtins

  /**
   * Converts any East expression to its string representation.
   * Uses the East serialization format (not JSON).
   *
   * @param expr - The expression to convert to a string
   * @returns A StringExpr containing the string representation
   *
   * @example
   * ```ts
   * East.print(42n)                    // "42"
   * East.print(3.14)                   // "3.14"
   * East.print([1n, 2n, 3n])           // "[1, 2, 3]"
   * East.print({a: 1n, b: true})       // "(a=1, b=true)"
   * ```
   */
  print,

  /**
   * Deep equality comparison between two expressions.
   * Compares values recursively, including nested structures.
   *
   * @param a - First expression to compare
   * @param b - Second expression to compare
   * @returns BooleanExpr that is true if values are deeply equal
   *
   * @example
   * ```ts
   * East.equal(42n, 42n)                     // true
   * East.equal([1n, 2n], [1n, 2n])           // true
   * East.equal({a: 1n}, {a: 1n})             // true
   * East.equal(x, y)                         // compare two expressions
   * ```
   */
  equal,

  /**
   * Deep inequality comparison between two expressions.
   * Returns true if values are not deeply equal.
   *
   * @param a - First expression to compare
   * @param b - Second expression to compare
   * @returns BooleanExpr that is true if values are not equal
   *
   * @example
   * ```ts
   * East.notEqual(42n, 43n)                  // true
   * East.notEqual([1n, 2n], [1n, 3n])        // true
   * ```
   */
  notEqual,

  /**
   * Less-than comparison using East's total ordering.
   * All East types have a defined total ordering, even complex structures.
   *
   * @param a - First expression to compare
   * @param b - Second expression to compare
   * @returns BooleanExpr that is true if a < b
   *
   * @example
   * ```ts
   * East.less(1n, 2n)                        // true
   * East.less(3.14, 2.0)                     // false
   * East.less("apple", "banana")             // true
   * ```
   */
  less,

  /**
   * Less-than-or-equal comparison using East's total ordering.
   *
   * @param a - First expression to compare
   * @param b - Second expression to compare
   * @returns BooleanExpr that is true if a <= b
   *
   * @example
   * ```ts
   * East.lessEqual(1n, 1n)                   // true
   * East.lessEqual(2n, 1n)                   // false
   * ```
   */
  lessEqual,

  /**
   * Greater-than comparison using East's total ordering.
   *
   * @param a - First expression to compare
   * @param b - Second expression to compare
   * @returns BooleanExpr that is true if a > b
   *
   * @example
   * ```ts
   * East.greater(2n, 1n)                     // true
   * East.greater("banana", "apple")          // true
   * ```
   */
  greater,

  /**
   * Greater-than-or-equal comparison using East's total ordering.
   *
   * @param a - First expression to compare
   * @param b - Second expression to compare
   * @returns BooleanExpr that is true if a >= b
   *
   * @example
   * ```ts
   * East.greaterEqual(2n, 2n)                // true
   * East.greaterEqual(1n, 2n)                // false
   * ```
   */
  greaterEqual,

  /**
   * Reference equality comparison for mutable types (Array, Set, Dict).
   * Checks if two expressions reference the same object in memory.
   *
   * @param a - First expression to compare
   * @param b - Second expression to compare
   * @returns BooleanExpr that is true if they reference the same object
   *
   * @example
   * ```ts
   * const arr = $.let(East.value([1n, 2n]));
   * East.is(arr, arr)                        // true (same reference)
   * East.is([1n, 2n], [1n, 2n])              // false (different objects)
   * ```
   */
  is,

  // Root stdlib

  /**
   * Returns the minimum of two values using East's total ordering.
   *
   * @param a - First value
   * @param b - Second value
   * @returns The smaller of the two values
   *
   * @example
   * ```ts
   * East.min(5n, 3n)                         // 3n
   * East.min(3.14, 2.71)                     // 2.71
   * ```
   */
  min: Expr.min,

  /**
   * Returns the maximum of two values using East's total ordering.
   *
   * @param a - First value
   * @param b - Second value
   * @returns The larger of the two values
   *
   * @example
   * ```ts
   * East.max(5n, 3n)                         // 5n
   * East.max(3.14, 2.71)                     // 3.14
   * ```
   */
  max: Expr.max,

  /**
   * Clamps a value between minimum and maximum bounds.
   *
   * @param value - The value to clamp
   * @param min - The minimum bound
   * @param max - The maximum bound
   * @returns The clamped value
   *
   * @example
   * ```ts
   * East.clamp(5n, 0n, 10n)                  // 5n
   * East.clamp(-5n, 0n, 10n)                 // 0n
   * East.clamp(15n, 0n, 10n)                 // 10n
   * ```
   */
  clamp: Expr.clamp,

  // Type stdlibs

  /**
   * Standard library functions for Integer operations.
   * Provides formatting, rounding, and utility functions for integers.
   *
   * @example
   * ```ts
   * East.Integer.printCommaSeperated(1234567n)   // "1,234,567"
   * East.Integer.printCompact(1500000n)          // "1.5M"
   * East.Integer.printOrdinal(42n)               // "42nd"
   * East.Integer.roundNearest(47n, 10n)          // 50n
   * ```
   */
  Integer: IntegerLib,

  /**
   * Standard library functions for Float operations.
   * Provides rounding, formatting, and comparison functions for floating-point numbers.
   *
   * @example
   * ```ts
   * East.Float.roundToDecimals(3.14159, 2n)      // 3.14
   * East.Float.printCurrency(1234.56)            // "$1234.56"
   * East.Float.printPercentage(0.452, 1n)        // "45.2%"
   * East.Float.approxEqual(0.1, 0.10001, 0.001)  // true
   * ```
   */
  Float: FloatLib,

  /**
   * Standard library functions for DateTime operations.
   * Provides construction, parsing, and rounding functions for date/time values.
   *
   * @example
   * ```ts
   * East.DateTime.fromEpochMilliseconds(1640000000000n)
   * East.DateTime.fromComponents(2025n, 1n, 15n, 10n, 30n)
   * East.DateTime.roundDownDay(date, 1n)
   * East.DateTime.parseFormatted("%Y-%m-%d", "2025-01-15")
   * ```
   */
  DateTime: DateTimeLib,

  /**
   * Standard library functions for String operations.
   * Provides error formatting utilities.
   *
   * @example
   * ```ts
   * East.String.printError(errorMsg, stackTrace)
   * ```
   */
  String: StringLib,

  /**
   * Standard library functions for Blob operations.
   * Provides binary encoding utilities.
   *
   * @example
   * ```ts
   * East.Blob.encodeBeast(myValue, 'v2')         // Encode to BEAST format
   * ```
   */
  Blob: BlobLib,

  /**
   * Standard library functions for Array operations.
   * Provides generation utilities for creating arrays.
   *
   * @example
   * ```ts
   * East.Array.range(0n, 10n, 2n)                // [0n, 2n, 4n, 6n, 8n]
   * East.Array.linspace(0.0, 1.0, 11n)           // [0.0, 0.1, ..., 1.0]
   * East.Array.generate(5n, IntegerType, ($, i) => i.multiply(i))
   * ```
   */
  Array: ArrayLib,

  /**
   * Standard library functions for Set operations.
   * Provides generation utilities for creating sets.
   *
   * @example
   * ```ts
   * East.Set.generate(5n, IntegerType, ($, i) => i.multiply(2n))
   * ```
   */
  Set: SetLib,

  /**
   * Standard library functions for Dict operations.
   * Provides generation utilities for creating dictionaries.
   *
   * @example
   * ```ts
   * East.Dict.generate(
   *   5n,
   *   IntegerType,
   *   IntegerType,
   *   ($, i) => i,
   *   ($, i) => i.multiply(10n)
   * )
   * ```
   */
  Dict: DictLib,
};
