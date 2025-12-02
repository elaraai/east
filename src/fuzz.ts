/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 *
 * @remarks
 */

import {
  type EastType,
  type ValueTypeOf,
  NullType,
  BooleanType,
  IntegerType,
  FloatType,
  StringType,
  DateTimeType,
  BlobType,
  ArrayType,
  SetType,
  DictType,
  StructType,
  VariantType,
  OptionType,
} from "./types.js";
import { isVariant, variant } from "./containers/variant.js";
import { printType } from "./types.js";
import { printFor } from "./serialization/east.js";
import { toEastTypeValue, type EastTypeValue } from "./type_of_type.js";
import { ref } from "./containers/ref.js";

// TODO generate RefType
// TODO generate RecursiveType

/**
 * Generates a random East type for fuzz testing.
 *
 * @param depth - Current nesting depth (used internally to limit recursion)
 * @returns A randomly generated {@link EastType}
 *
 * @remarks
 * Types are kept reasonably simple to avoid generating huge nested structures:
 * - Maximum nesting depth of 3 levels
 * - Higher chance of primitives at deeper levels
 * - Sets and Dicts use {@link StringType} keys (immutability constraint)
 * - Structs have 0-4 random fields
 * - Variants have 1-3 random cases, with 30% chance of {@link OptionType}
 */
export function randomType(depth: number = 0): EastType {
  // Limit nesting to avoid stack overflow and keep tests fast
  const maxDepth = 3;

  // Higher chance of primitives at deeper levels
  const primitiveWeight = depth >= maxDepth ? 0.9 : 0.5;

  if (Math.random() < primitiveWeight) {
    // Primitive type
    const r = Math.random() * 7;
    if (r < 1) return NullType;
    if (r < 2) return BooleanType;
    if (r < 3) return IntegerType;
    if (r < 4) return FloatType;
    if (r < 5) return StringType;
    if (r < 6) return DateTimeType;
    return BlobType;
  }

  // Complex type
  const r = Math.random() * 5;
  if (r < 1) {
    // Array
    return ArrayType(randomType(depth + 1));
  } else if (r < 2) {
    // Set (keys must be immutable)
    return SetType(StringType);
  } else if (r < 3) {
    // Dict (keys must be immutable)
    return DictType(StringType, randomType(depth + 1));
  } else if (r < 4) {
    // Struct with 0-4 fields
    const fieldCount = Math.floor(Math.random() * 5);
    const fields: Record<string, EastType> = {};
    for (let i = 0; i < fieldCount; i++) {
      fields[`field${i}`] = randomType(depth + 1);
    }
    return StructType(fields);
  } else {
    // Variant
    if (Math.random() < 0.3) {
      // Option type (common variant pattern)
      return OptionType(randomType(depth + 1));
    } else {
      // Custom variant with 1-3 cases
      const caseCount = 1 + Math.floor(Math.random() * 3);
      const cases: Record<string, EastType> = {};
      for (let i = 0; i < caseCount; i++) {
        cases[`case${i}`] = randomType(depth + 1);
      }
      return VariantType(cases);
    }
  }
}

/**
 * Creates a function that generates random values of a given type.
 *
 * @typeParam T - The {@link EastType} to generate values for
 * @param type - The type to generate values for
 * @returns A function that returns a new random value each time it's called
 * @throws When the type is {@link NeverType} or {@link FunctionType}
 *
 * @remarks
 * Generates diverse test values for each type:
 * - Floats include special values (NaN, ±Infinity, ±0.0)
 * - Integers range from -100 to 100 (as bigint)
 * - Strings use random alphanumeric sequences (0-20 chars)
 * - DateTimes are within one year of 2025-01-01
 * - Collections have 0-4 elements (kept small for performance)
 * - Variants randomly select one of their cases
 */
export function randomValueFor(type: EastTypeValue): () => any
export function randomValueFor<T extends EastType>(type: T): () => ValueTypeOf<T>
export function randomValueFor(type: EastTypeValue | EastType): () => any {
  // Convert EastTypeValue to EastType if needed
  if (!isVariant(type)) {
    type = toEastTypeValue(type);
  }

  if (type.type === "Never") {
    throw new Error("Cannot generate values for Never type");
  } else if (type.type === "Null") {
    return () => null as any;
  } else if (type.type === "Boolean") {
    return (() => Math.random() < 0.5) as any;
  } else if (type.type === "Integer") {
    return (() => BigInt(Math.floor(Math.random() * 200) - 100)) as any;
  } else if (type.type === "Float") {
    return (() => {
      const r = Math.random();
      if (r < 0.05) return NaN;
      if (r < 0.10) return Infinity;
      if (r < 0.15) return -Infinity;
      if (r < 0.20) return 0.0;
      if (r < 0.25) return -0.0;
      return Math.random() * 200 - 100;
    }) as any;
  } else if (type.type === "String") {
    return (() => {
      const length = Math.floor(Math.random() * 20);
      if (length === 0) return "";
      return Math.random().toString(36).substring(2, 2 + length);
    }) as any;
  } else if (type.type === "DateTime") {
    return (() => {
      const year2025 = new Date("2025-01-01T00:00:00.000Z").valueOf();
      const oneYear = 1000 * 60 * 60 * 24 * 365;
      return new Date(year2025 + Math.floor(Math.random() * oneYear));
    }) as any;
  } else if (type.type === "Blob") {
    return (() => {
      const length = Math.floor(Math.random() * 100); // Keep small for speed
      const arr = new Uint8Array(length);
      for (let i = 0; i < length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }) as any;
  } else if (type.type === "Ref") {
    const valueFn = randomValueFor(type.value);
    return (() => ref(valueFn())) as any;
  } else if (type.type === "Array") {
    const itemFn = randomValueFor(type.value);
    return (() => {
      const length = Math.floor(Math.random() * 5);
      return Array.from({ length }, itemFn);
    }) as any;
  } else if (type.type === "Set") {
    const itemFn = randomValueFor(type.value);
    return (() => {
      const length = Math.floor(Math.random() * 5);
      const set = new Set();
      for (let i = 0; i < length; i++) {
        set.add(itemFn());
      }
      return set;
    }) as any;
  } else if (type.type === "Dict") {
    const keyFn = randomValueFor(type.value.key);
    const valueFn = randomValueFor(type.value.value);
    return (() => {
      const length = Math.floor(Math.random() * 5);
      const dict = new Map();
      for (let i = 0; i < length; i++) {
        dict.set(keyFn(), valueFn());
      }
      return dict;
    }) as any;
  } else if (type.type === "Struct") {
    const fieldFns = Object.fromEntries(
      type.value.map(({ name, type: fieldType }) => [name, randomValueFor(fieldType)])
    );
    return (() => {
      const obj: Record<string, any> = {};
      for (const [key, fn] of Object.entries(fieldFns)) {
        obj[key] = fn();
      }
      return obj;
    }) as any;
  } else if (type.type === "Variant") {
    const caseKeys = type.value.map(({ name }) => name);
    const caseFns = Object.fromEntries(
      type.value.map(({ name, type: caseType }) => [name, randomValueFor(caseType)])
    );
    return (() => {
      const caseKey = caseKeys[Math.floor(Math.random() * caseKeys.length)]!;
      return variant(caseKey, caseFns[caseKey]!());
    }) as any;
  } else if (type.type === "Recursive") {
    throw new Error("Cannot generate values for Recursive type");
  } else if (type.type === "Function") {
    throw new Error("Cannot generate values for Function type");
  } else if (type.type === "AsyncFunction") {
    throw new Error("Cannot generate values for AsyncFunction type");
  } else {
    throw new Error(`Unhandled type: ${printType(type)}`);
  }
}

/**
 * Runs a fuzz test over a generic function parameterized by a type.
 *
 * @param fn - Factory function that takes a type and returns a test function for values of that type
 * @param n_types - Number of random types to test
 * @param n_samples - Number of random values to test per type
 * @returns `true` if all tests passed, `false` if any failed
 *
 * @remarks
 * For each randomly generated type:
 * 1. Creates a test function using the provided factory
 * 2. Generates random values of that type
 * 3. Runs the test function on each value
 * 4. Reports any failures to stderr with type, value, and error details
 *
 * Attempts to generate unique types (up to 100 attempts per type) to maximize
 * test coverage. Prints summary statistics showing success/failure counts.
 *
 * @example
 * ```ts
 * import { printFor, parseFor } from "./serialization/east.js";
 *
 * // Test that serialization and parsing work
 * await fuzzerTest(
 *   (type) => async (value) => {
 *     const parse = parseFor(type);
 *     const result = parse(serialized);
 *     if (!result.success) {
 *       throw new Error(`Parse failed: ${result.error}`);
 *     }
 *   },
 *   100,  // test 100 random types
 *   10    // with 10 random values each
 * );
 * ```
 */
export async function fuzzerTest(
  fn: (type: EastType) => (value: any) => Promise<void>,
  n_types: number = 100,
  n_samples: number = 10
): Promise<boolean> {
  let n_type_success = 0;
  let n_type_fail = 0;
  const type_cache = new Set<string>();

  for (let i = 0; i < n_types; i++) {
    let n_success = 0;
    let n_fail = 0;

    // Generate a unique random type
    let type: EastType;
    let attempts = 0;
    while (true) {
      type = randomType();
      const typeStr = printType(type);
      if (!type_cache.has(typeStr)) {
        type_cache.add(typeStr);
        break;
      }
      attempts++;
      if (attempts > 100) {
        // Give up and allow duplicates
        break;
      }
    }

    const type_fn = fn(type);
    const randomValue = randomValueFor(type);
    const print = printFor(type);

    for (let j = 0; j < n_samples; j++) {
      const value = randomValue();
      try {
        await type_fn(value);
        n_success++;
      } catch (e) {
        n_fail++;
        console.error(`    Test failed for type ${printType(type)}`);
        console.error(`    Value: ${print(value)}`);
        console.error(`    Error: ${(e as any)?.stack ?? e}`);
      }
    }

    if (n_fail > 0) {
      n_type_fail++;
      console.error(`  FAILED: ${n_success}/${n_samples} samples passed for type ${printType(type)}`);
    } else {
      n_type_success++;
    }
  }

  if (n_type_fail > 0) {
    console.error(`FAILED: ${n_type_success}/${n_types} types passed`);
    return false;
  } else {
    return true;
  }
}
