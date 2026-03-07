/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import { East, Expr, ArrayType, IntegerType, FloatType, StringType, BooleanType, some, none, SetType, DictType, StructType, NullType, OptionType, example } from "@elaraai/east";
import type { option } from "@elaraai/east";

// ---------------------------------------------------------------------------
// Construction & Access
// ---------------------------------------------------------------------------

export const arraySize = example({
    keywords: ["array", "ArrayType", "size", "length"],
    description: "Get the size of an array",
    fn: East.function([], IntegerType, ($) => {
        const a = $.const([1n, 2n, 3n], ArrayType(IntegerType));
        return a.size();
    }),
    inputs: [],
    returns: 3n,
});

export const arrayGet = example({
    keywords: ["array", "ArrayType", "get", "index", "access"],
    description: "Get an element by index",
    fn: East.function([], IntegerType, ($) => {
        const a = $.const([10n, 20n, 30n], ArrayType(IntegerType));
        return a.get(1n);
    }),
    inputs: [],
    returns: 20n,
});

export const arrayGetWithDefault = example({
    keywords: ["array", "ArrayType", "get", "default", "fallback"],
    description: "Get an element by index with a default for out-of-bounds",
    fn: East.function([], IntegerType, ($) => {
        const a = $.const([10n, 20n, 30n], ArrayType(IntegerType));
        return a.get(3n, _ => 40n);
    }),
    inputs: [],
    returns: 40n,
});

export const arrayTryGet = example({
    keywords: ["array", "ArrayType", "tryGet", "option", "safe-access"],
    description: "Safely get an element by index, returning an option",
    fn: East.function([], undefined, ($) => {
        const a = $.const([10n, 20n, 30n], ArrayType(IntegerType));
        return a.tryGet(2n);
    }),
    inputs: [],
    returns: some(30n),
});

export const arrayHas = example({
    keywords: ["array", "ArrayType", "has", "bounds-check"],
    description: "Check if an index is within bounds",
    fn: East.function([], BooleanType, ($) => {
        const a = $.const([10n, 20n, 30n], ArrayType(IntegerType));
        return a.has(1n);
    }),
    inputs: [],
    returns: true,
});

// ---------------------------------------------------------------------------
// Mutation
// ---------------------------------------------------------------------------

export const arrayPushLast = example({
    keywords: ["array", "ArrayType", "pushLast", "mutation", "append"],
    description: "Push items to the end of an array",
    fn: East.function([], ArrayType(IntegerType), ($) => {
        const a = $.let([], ArrayType(IntegerType));
        $(a.pushLast(1n));
        $(a.pushLast(2n));
        return a;
    }),
    inputs: [],
    returns: [1n, 2n],
});

export const arrayPushFirst = example({
    keywords: ["array", "ArrayType", "pushFirst", "mutation", "prepend"],
    description: "Push an item to the front of an array",
    fn: East.function([], ArrayType(IntegerType), ($) => {
        const a = $.let([1n, 2n], ArrayType(IntegerType));
        $(a.pushFirst(0n));
        return a;
    }),
    inputs: [],
    returns: [0n, 1n, 2n],
});

export const arrayPopLast = example({
    keywords: ["array", "ArrayType", "popLast", "mutation"],
    description: "Remove and return the last element",
    fn: East.function([], IntegerType, ($) => {
        const a = $.let([1n, 2n, 3n], ArrayType(IntegerType));
        return a.popLast();
    }),
    inputs: [],
    returns: 3n,
});

export const arrayPopFirst = example({
    keywords: ["array", "ArrayType", "popFirst", "mutation"],
    description: "Remove and return the first element",
    fn: East.function([], IntegerType, ($) => {
        const a = $.let([1n, 2n, 3n], ArrayType(IntegerType));
        return a.popFirst();
    }),
    inputs: [],
    returns: 1n,
});

export const arrayMerge = example({
    keywords: ["array", "ArrayType", "merge", "mutation", "update"],
    description: "Merge a value at an index using a combine function",
    fn: East.function([], ArrayType(IntegerType), ($) => {
        const a = $.let([1n, 2n, 3n], ArrayType(IntegerType));
        $(a.merge(0n, East.value(10n), ($, existing, newValue) => existing.add(newValue)));
        return a;
    }),
    inputs: [],
    returns: [11n, 2n, 3n],
});

export const arrayMergeAll = example({
    keywords: ["array", "ArrayType", "mergeAll", "mutation", "update"],
    description: "Merge all elements pairwise with another array",
    fn: East.function([], ArrayType(IntegerType), ($) => {
        const a = $.let([1n, 2n, 3n], ArrayType(IntegerType));
        $(a.mergeAll(East.value([10n, 10n, 10n]), ($, existing, newValue) => existing.add(newValue)));
        return a;
    }),
    inputs: [],
    returns: [11n, 12n, 13n],
});

export const arrayAppend = example({
    keywords: ["array", "ArrayType", "append", "mutation", "concat"],
    description: "Append another array to the end (mutating)",
    fn: East.function([], ArrayType(IntegerType), ($) => {
        const a = $.let([1n, 2n, 3n], ArrayType(IntegerType));
        $(a.append([4n, 5n, 6n]));
        return a;
    }),
    inputs: [],
    returns: [1n, 2n, 3n, 4n, 5n, 6n],
});

export const arrayPrepend = example({
    keywords: ["array", "ArrayType", "prepend", "mutation"],
    description: "Prepend another array to the front (mutating)",
    fn: East.function([], ArrayType(IntegerType), ($) => {
        const a = $.let([1n, 2n, 3n], ArrayType(IntegerType));
        $(a.prepend([4n, 5n, 6n]));
        return a;
    }),
    inputs: [],
    returns: [4n, 5n, 6n, 1n, 2n, 3n],
});

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

export const arraySort = example({
    keywords: ["array", "ArrayType", "sort", "orderBy"],
    description: "Sort an array (returns new sorted array)",
    fn: East.function([], ArrayType(IntegerType), ($) => {
        const a = $.const([2n, 3n, 1n], ArrayType(IntegerType));
        return a.sort();
    }),
    inputs: [],
    returns: [1n, 2n, 3n],
});

export const arraySortByKey = example({
    keywords: ["array", "ArrayType", "sort", "orderBy", "projection"],
    description: "Sort an array by a projected key (descending via negate)",
    fn: East.function([], ArrayType(IntegerType), ($) => {
        const a = $.const([2n, 3n, 1n], ArrayType(IntegerType));
        return a.sort(($, x) => x.negate());
    }),
    inputs: [],
    returns: [3n, 2n, 1n],
});

export const arraySortInPlace = example({
    keywords: ["array", "ArrayType", "sortInPlace", "mutation", "sort"],
    description: "Sort an array in place (mutating)",
    fn: East.function([], ArrayType(IntegerType), ($) => {
        const a = $.let([3n, 1n, 2n], ArrayType(IntegerType));
        $(a.sortInPlace());
        return a;
    }),
    inputs: [],
    returns: [1n, 2n, 3n],
});

export const arrayReverse = example({
    keywords: ["array", "ArrayType", "reverse"],
    description: "Reverse the order of elements (returns new array)",
    fn: East.function([], ArrayType(IntegerType), ($) => {
        const a = $.const([1n, 2n, 3n], ArrayType(IntegerType));
        return a.reverse();
    }),
    inputs: [],
    returns: [3n, 2n, 1n],
});

export const arrayReverseInPlace = example({
    keywords: ["array", "ArrayType", "reverseInPlace", "mutation", "reverse"],
    description: "Reverse an array in place (mutating)",
    fn: East.function([], ArrayType(IntegerType), ($) => {
        const a = $.let([1n, 2n, 3n], ArrayType(IntegerType));
        $(a.reverseInPlace());
        return a;
    }),
    inputs: [],
    returns: [3n, 2n, 1n],
});

export const arrayIsSorted = example({
    keywords: ["array", "ArrayType", "isSorted", "check"],
    description: "Check if an array is sorted",
    fn: East.function([], BooleanType, ($) => {
        const a = $.const([1n, 2n, 3n], ArrayType(IntegerType));
        return a.isSorted();
    }),
    inputs: [],
    returns: true,
});

// ---------------------------------------------------------------------------
// Bulk Construction
// ---------------------------------------------------------------------------

export const arrayGenerate = example({
    keywords: ["array", "ArrayType", "generate", "create", "East.Array"],
    description: "Generate an array of N elements using a builder function",
    fn: East.function([], ArrayType(IntegerType), ($) => {
        return East.Array.generate(6n, IntegerType, ($, i) => i.add(1n));
    }),
    inputs: [],
    returns: [1n, 2n, 3n, 4n, 5n, 6n],
});

export const arrayRange = example({
    keywords: ["array", "ArrayType", "range", "East.Array"],
    description: "Create an array with a range of integers",
    fn: East.function([], ArrayType(IntegerType), ($) => {
        return East.Array.range(0n, 6n);
    }),
    inputs: [],
    returns: [0n, 1n, 2n, 3n, 4n, 5n],
});

export const arrayRangeWithStep = example({
    keywords: ["array", "ArrayType", "range", "step", "East.Array"],
    description: "Create an array with a range of integers with a step",
    fn: East.function([], ArrayType(IntegerType), ($) => {
        return East.Array.range(0n, 6n, 2n);
    }),
    inputs: [],
    returns: [0n, 2n, 4n],
});

export const arrayLinspace = example({
    keywords: ["array", "ArrayType", "linspace", "East.Array", "float"],
    description: "Create equally-spaced float values between start and stop",
    fn: East.function([], ArrayType(FloatType), ($) => {
        return East.Array.linspace(0.0, 1.0, 5n);
    }),
    inputs: [],
    returns: [0.0, 0.25, 0.5, 0.75, 1.0],
});

// ---------------------------------------------------------------------------
// Transform
// ---------------------------------------------------------------------------

export const arrayMap = example({
    keywords: ["array", "ArrayType", "map", "transform"],
    description: "Transform each element with map",
    fn: East.function([], ArrayType(IntegerType), ($) => {
        const a = $.const([10n, 20n, 30n], ArrayType(IntegerType));
        return a.map(($, x) => x.multiply(2n));
    }),
    inputs: [],
    returns: [20n, 40n, 60n],
});

export const arrayMapWithIndex = example({
    keywords: ["array", "ArrayType", "map", "index", "transform"],
    description: "Transform each element with map using the index",
    fn: East.function([], ArrayType(IntegerType), ($) => {
        const a = $.const([10n, 20n, 30n], ArrayType(IntegerType));
        return a.map(($, x, i) => x.multiply(i));
    }),
    inputs: [],
    returns: [0n, 20n, 60n],
});

export const arrayFilter = example({
    keywords: ["array", "ArrayType", "filter"],
    description: "Filter elements matching a condition",
    fn: East.function([], ArrayType(IntegerType), ($) => {
        const a = $.const([10n, 20n, 30n], ArrayType(IntegerType));
        return a.filter(($, x) => East.equal(x.remainder(20n), 0n));
    }),
    inputs: [],
    returns: [20n],
});

export const arrayFilterMap = example({
    keywords: ["array", "ArrayType", "filterMap", "option"],
    description: "Filter and transform in one step using option return",
    fn: East.function([], ArrayType(StringType), ($) => {
        const a = $.const([1n, 2n, 3n, 4n, 5n, 6n], ArrayType(IntegerType));
        return a.filterMap(($, x) => East.equal(x.remainder(2n), 1n).ifElse(() => some(Expr.print(x)), () => none));
    }),
    inputs: [],
    returns: ["1", "3", "5"],
});

export const arrayFlatMap = example({
    keywords: ["array", "ArrayType", "flatMap", "flatten"],
    description: "Map each element to an array and flatten the result",
    fn: East.function([], ArrayType(IntegerType), ($) => {
        const a = $.const([1n, 2n, 3n], ArrayType(IntegerType));
        return a.flatMap((_$, x) => [x, x.add(10n)]);
    }),
    inputs: [],
    returns: [1n, 11n, 2n, 12n, 3n, 13n],
});

export const arrayFlatMapFlatten = example({
    keywords: ["array", "ArrayType", "flatMap", "flatten", "nested"],
    description: "Flatten a nested array of arrays",
    fn: East.function([], ArrayType(IntegerType), ($) => {
        const a = $.const([[1n, 2n], [3n]], ArrayType(ArrayType(IntegerType)));
        return a.flatMap();
    }),
    inputs: [],
    returns: [1n, 2n, 3n],
});

export const arrayForEach = example({
    keywords: ["array", "ArrayType", "forEach", "iterate", "loop"],
    description: "Iterate over array elements with forEach",
    fn: East.function([], ArrayType(StringType), ($) => {
        const from = $.const(["a", "b", "c"], ArrayType(StringType));
        const log = $.let([], ArrayType(StringType));
        $(from.forEach(($, x) => log.pushLast(x)));
        return log;
    }),
    inputs: [],
    returns: ["a", "b", "c"],
});

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export const arrayFindFirst = example({
    keywords: ["array", "ArrayType", "findFirst", "search", "indexOf"],
    description: "Find the index of the first occurrence of a value",
    fn: East.function([], undefined, ($) => {
        const a = $.const([1n, 2n, 3n], ArrayType(IntegerType));
        return a.findFirst(2n);
    }),
    inputs: [],
    returns: some(1n),
});

export const arrayFindFirstWithProjection = example({
    keywords: ["array", "ArrayType", "findFirst", "search", "projection"],
    description: "Find the first element matching a projected value",
    fn: East.function([], undefined, ($) => {
        const a = $.const([10n, 20n, 30n], ArrayType(IntegerType));
        return a.findFirst(4n, ($, x) => x.divide(5n));
    }),
    inputs: [],
    returns: some(1n),
});

export const arrayFindAll = example({
    keywords: ["array", "ArrayType", "findAll", "search", "indicesOf"],
    description: "Find the indices of all occurrences of a value",
    fn: East.function([], ArrayType(IntegerType), ($) => {
        const a = $.const([5n, 10n, 5n, 20n, 5n], ArrayType(IntegerType));
        return a.findAll(5n);
    }),
    inputs: [],
    returns: [0n, 2n, 4n],
});

export const arrayFirstMap = example({
    keywords: ["array", "ArrayType", "firstMap", "search", "find"],
    description: "Find first element that maps to some, returning the mapped value",
    fn: East.function([], undefined, ($) => {
        const a = $.const([2n, 4n, 5n, 7n, 9n], ArrayType(IntegerType));
        return a.firstMap(($, x) => East.equal(x.remainder(2n), 1n).ifElse(() => some(x.multiply(10n)), () => none));
    }),
    inputs: [],
    returns: some(50n),
});

export const arrayFindSortedFirst = example({
    keywords: ["array", "ArrayType", "findSortedFirst", "binary-search", "sorted"],
    description: "Binary search for the first position of a value in a sorted array",
    fn: East.function([], IntegerType, ($) => {
        const a = $.const([1n, 3n, 3n, 3n, 4n], ArrayType(IntegerType));
        return a.findSortedFirst(3n);
    }),
    inputs: [],
    returns: 1n,
});

export const arrayFindSortedRange = example({
    keywords: ["array", "ArrayType", "findSortedRange", "binary-search", "sorted"],
    description: "Binary search for the range of a value in a sorted array",
    fn: East.function([], undefined, ($) => {
        const a = $.const([1n, 3n, 3n, 3n, 4n], ArrayType(IntegerType));
        return a.findSortedRange(3n);
    }),
    inputs: [],
    returns: { start: 1n, end: 4n },
});

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

export const arrayReduce = example({
    keywords: ["array", "ArrayType", "reduce", "fold", "aggregation"],
    description: "Reduce an array to a single value with an initial accumulator",
    fn: East.function([], IntegerType, ($) => {
        const a = $.const([1n, 2n, 3n], ArrayType(IntegerType));
        return a.reduce(($, acc, x) => acc.add(x), 10n);
    }),
    inputs: [],
    returns: 16n,
});

export const arrayMapReduce = example({
    keywords: ["array", "ArrayType", "mapReduce", "aggregation"],
    description: "Map then reduce without an initial value",
    fn: East.function([], IntegerType, ($) => {
        const a = $.const([1n, 2n, 3n], ArrayType(IntegerType));
        return a.mapReduce((_$, x, _i) => x.multiply(2n), ($, acc, x) => acc.add(x));
    }),
    inputs: [],
    returns: 12n,
});

export const arraySum = example({
    keywords: ["array", "ArrayType", "sum", "aggregation"],
    description: "Sum all elements in an array",
    fn: East.function([], IntegerType, ($) => {
        const a = $.const([1n, 2n, 3n], ArrayType(IntegerType));
        return a.sum();
    }),
    inputs: [],
    returns: 6n,
});

export const arraySumWithProjection = example({
    keywords: ["array", "ArrayType", "sum", "projection", "aggregation"],
    description: "Sum projected values",
    fn: East.function([], IntegerType, ($) => {
        const a = $.const([1n, 2n, 3n], ArrayType(IntegerType));
        return a.sum(($, x) => x.add(1n));
    }),
    inputs: [],
    returns: 9n,
});

export const arrayMean = example({
    keywords: ["array", "ArrayType", "mean", "average", "aggregation"],
    description: "Compute the mean of array elements",
    fn: East.function([], FloatType, ($) => {
        const a = $.const([1n, 2n, 3n], ArrayType(IntegerType));
        return a.mean();
    }),
    inputs: [],
    returns: 2.0,
});

export const arrayMaximum = example({
    keywords: ["array", "ArrayType", "maximum", "max", "aggregation"],
    description: "Find the maximum element",
    fn: East.function([], IntegerType, ($) => {
        const a = $.const([3n, 1n, 2n], ArrayType(IntegerType));
        return a.maximum();
    }),
    inputs: [],
    returns: 3n,
});

export const arrayMinimum = example({
    keywords: ["array", "ArrayType", "minimum", "min", "aggregation"],
    description: "Find the minimum element",
    fn: East.function([], IntegerType, ($) => {
        const a = $.const([3n, 1n, 2n], ArrayType(IntegerType));
        return a.minimum();
    }),
    inputs: [],
    returns: 1n,
});

export const arrayFindMaximum = example({
    keywords: ["array", "ArrayType", "findMaximum", "argmax", "aggregation"],
    description: "Find the index of the maximum element",
    fn: East.function([], undefined, ($) => {
        const a = $.const([1n, 3n, 2n], ArrayType(IntegerType));
        return a.findMaximum();
    }),
    inputs: [],
    returns: some(1n),
});

export const arrayFindMinimum = example({
    keywords: ["array", "ArrayType", "findMinimum", "argmin", "aggregation"],
    description: "Find the index of the minimum element",
    fn: East.function([], undefined, ($) => {
        const a = $.const([3n, 1n, 2n], ArrayType(IntegerType));
        return a.findMinimum();
    }),
    inputs: [],
    returns: some(1n),
});

export const arrayEvery = example({
    keywords: ["array", "ArrayType", "every", "all", "predicate"],
    description: "Check if all elements satisfy a condition (boolean array)",
    fn: East.function([], BooleanType, ($) => {
        const a = $.const([true, true], ArrayType(BooleanType));
        return a.every();
    }),
    inputs: [],
    returns: true,
});

export const arraySome = example({
    keywords: ["array", "ArrayType", "some", "any", "predicate"],
    description: "Check if any element satisfies a condition (boolean array)",
    fn: East.function([], BooleanType, ($) => {
        const a = $.const([true, false], ArrayType(BooleanType));
        return a.some();
    }),
    inputs: [],
    returns: true,
});

// ---------------------------------------------------------------------------
// Slice & Combine
// ---------------------------------------------------------------------------

export const arraySlice = example({
    keywords: ["array", "ArrayType", "slice", "subarray"],
    description: "Extract a slice of an array",
    fn: East.function([], ArrayType(IntegerType), ($) => {
        const a = $.const([1n, 2n, 3n, 4n, 5n, 6n], ArrayType(IntegerType));
        return a.slice(0n, 3n);
    }),
    inputs: [],
    returns: [1n, 2n, 3n],
});

export const arrayGetKeys = example({
    keywords: ["array", "ArrayType", "getKeys", "select", "indices"],
    description: "Get elements at specific indices",
    fn: East.function([], ArrayType(IntegerType), ($) => {
        const a = $.const([1n, 2n, 3n, 4n, 5n, 6n], ArrayType(IntegerType));
        return a.getKeys([0n, 2n, 4n]);
    }),
    inputs: [],
    returns: [1n, 3n, 5n],
});

export const arrayConcat = example({
    keywords: ["array", "ArrayType", "concat", "combine"],
    description: "Concatenate two arrays (returns new array)",
    fn: East.function([], ArrayType(IntegerType), ($) => {
        const a = $.const([1n, 2n, 3n, 4n], ArrayType(IntegerType));
        return a.concat([5n, 6n]);
    }),
    inputs: [],
    returns: [1n, 2n, 3n, 4n, 5n, 6n],
});

// ---------------------------------------------------------------------------
// Conversion
// ---------------------------------------------------------------------------

export const arrayToSet = example({
    keywords: ["array", "ArrayType", "toSet", "SetType", "unique", "deduplicate"],
    description: "Convert an array to a set (removes duplicates)",
    fn: East.function([], SetType(IntegerType), ($) => {
        const a = $.const([1n, 2n, 2n, 3n, 3n, 3n], ArrayType(IntegerType));
        return a.toSet();
    }),
    inputs: [],
    returns: new Set([1n, 2n, 3n]),
});

export const arrayToSetWithProjection = example({
    keywords: ["array", "ArrayType", "toSet", "SetType", "projection"],
    description: "Convert to set with a projection function",
    fn: East.function([], SetType(IntegerType), ($) => {
        const a = $.const([1n, 2n, 3n], ArrayType(IntegerType));
        return a.toSet(($, x) => x.negate());
    }),
    inputs: [],
    returns: new Set([-1n, -2n, -3n]),
});

export const arrayToDict = example({
    keywords: ["array", "ArrayType", "toDict", "DictType", "index"],
    description: "Convert an array to a dict keyed by index",
    fn: East.function([], DictType(IntegerType, IntegerType), ($) => {
        const a = $.const([1n, 2n, 3n], ArrayType(IntegerType));
        return a.toDict();
    }),
    inputs: [],
    returns: new Map([[0n, 1n], [1n, 2n], [2n, 3n]]),
});

export const arrayToDictWithKeyFn = example({
    keywords: ["array", "ArrayType", "toDict", "DictType", "key-function"],
    description: "Convert to dict with a custom key function",
    fn: East.function([], DictType(StringType, IntegerType), ($) => {
        const a = $.const([1n, 2n, 3n], ArrayType(IntegerType));
        return a.toDict((_$, _x, i) => East.print(i));
    }),
    inputs: [],
    returns: new Map([["0", 1n], ["1", 2n], ["2", 3n]]),
});

export const arrayToDictWithConflict = example({
    keywords: ["array", "ArrayType", "toDict", "DictType", "groupMapReduce", "conflict"],
    description: "Convert to dict with conflict resolution (group-map-reduce pattern)",
    fn: East.function([], DictType(IntegerType, IntegerType), ($) => {
        const a = $.const([1n, 2n, 3n, 4n, 5n, 6n], ArrayType(IntegerType));
        return a.toDict((_$, x) => x.remainder(2n), (_$, x) => x, (_$, a, b, _k) => a.add(b));
    }),
    inputs: [],
    returns: new Map([[0n, 12n], [1n, 9n]]),
});

export const arrayStringJoin = example({
    keywords: ["array", "ArrayType", "stringJoin", "join", "string"],
    description: "Join string array elements with a separator",
    fn: East.function([], StringType, ($) => {
        const a = $.const(["a", "b", "c"], ArrayType(StringType));
        return a.stringJoin(", ");
    }),
    inputs: [],
    returns: "a, b, c",
});

export const arrayStringJoinObject = example({
    keywords: ["array", "ArrayType", "stringJoin", "join", "string"],
    description: "Join string array elements with a separator",
    fn: East.function([], StringType, ($) => {
        const a = $.const([{ key: "a" }, { key: "b" }, { key: "c" }], ArrayType(StructType({ key: StringType })));
        return a.map(($, x) => x.key).stringJoin(", ");
    }),
    inputs: [],
    returns: "a, b, c",
});

// ---------------------------------------------------------------------------
// Flatten to Set / Dict
// ---------------------------------------------------------------------------

export const arrayFlattenToSet = example({
    keywords: ["array", "ArrayType", "flattenToSet", "SetType", "flatten"],
    description: "Map elements to sets and flatten into one set",
    fn: East.function([], SetType(IntegerType), ($) => {
        const a = $.const([1n, 2n, 3n], ArrayType(IntegerType));
        return a.flattenToSet((_$, x) => new Set([x, x.add(10n)]));
    }),
    inputs: [],
    returns: new Set([1n, 2n, 3n, 11n, 12n, 13n]),
});

export const arrayFlattenToDict = example({
    keywords: ["array", "ArrayType", "flattenToDict", "DictType", "flatten"],
    description: "Map elements to dicts and flatten into one dict",
    fn: East.function([], DictType(StringType, IntegerType), ($) => {
        const a = $.const([1n, 2n, 3n], ArrayType(IntegerType));
        return a.flattenToDict((_$, x) => new Map([[East.print(x), x], [East.print(x.add(10n)), x.add(10n)]]));
    }),
    inputs: [],
    returns: new Map([["1", 1n], ["2", 2n], ["3", 3n], ["11", 11n], ["12", 12n], ["13", 13n]]),
});

// ---------------------------------------------------------------------------
// Group operations
// ---------------------------------------------------------------------------

export const arrayGroupSize = example({
    keywords: ["array", "ArrayType", "groupSize", "count", "group"],
    description: "Count occurrences of each element",
    fn: East.function([], DictType(IntegerType, IntegerType), ($) => {
        const a = $.const([1n, 2n, 3n, 1n, 2n], ArrayType(IntegerType));
        return a.groupSize();
    }),
    inputs: [],
    returns: new Map([[1n, 2n], [2n, 2n], [3n, 1n]]),
});

export const arrayGroupSizeByKey = example({
    keywords: ["array", "ArrayType", "groupSize", "group", "projection"],
    description: "Count elements grouped by a key function (even/odd)",
    fn: East.function([], DictType(IntegerType, IntegerType), ($) => {
        const a = $.const([1n, 2n, 3n, 1n, 2n], ArrayType(IntegerType));
        return a.groupSize((_$, x) => x.remainder(2n));
    }),
    inputs: [],
    returns: new Map([[0n, 2n], [1n, 3n]]),
});

export const arrayGroupReduce = example({
    keywords: ["array", "ArrayType", "groupReduce", "group", "aggregation"],
    description: "Group elements and reduce each group with an init function",
    fn: East.function([], DictType(IntegerType, IntegerType), ($) => {
        const a = $.const([1n, 2n, 3n], ArrayType(IntegerType));
        return a.groupReduce((_$, x, _i) => x.remainder(2n), (_$, _k) => 10n, (_$, acc, x, _i) => acc.add(x));
    }),
    inputs: [],
    returns: new Map([[0n, 12n], [1n, 14n]]),
});

export const arrayGroupSum = example({
    keywords: ["array", "ArrayType", "groupSum", "group", "sum"],
    description: "Sum elements grouped by a key function",
    fn: East.function([], DictType(IntegerType, IntegerType), ($) => {
        const a = $.const([1n, 2n, 3n, 4n, 5n, 6n], ArrayType(IntegerType));
        return a.groupSum((_$, x) => x.remainder(2n));
    }),
    inputs: [],
    returns: new Map([[0n, 12n], [1n, 9n]]),
});

export const arrayGroupMean = example({
    keywords: ["array", "ArrayType", "groupMean", "group", "average"],
    description: "Compute mean for each group",
    fn: East.function([], DictType(IntegerType, FloatType), ($) => {
        const a = $.const([1n, 2n, 3n, 4n, 5n, 6n], ArrayType(IntegerType));
        return a.groupMean((_$, x) => x.remainder(2n));
    }),
    inputs: [],
    returns: new Map([[0n, 4.0], [1n, 3.0]]),
});

export const arrayGroupEvery = example({
    keywords: ["array", "ArrayType", "groupEvery", "group", "all"],
    description: "Check if all elements in each group satisfy a predicate",
    fn: East.function([], DictType(IntegerType, BooleanType), ($) => {
        const a = $.const([1n, 2n, 3n, 4n, 5n, 6n], ArrayType(IntegerType));
        return a.groupEvery((_$, x) => x.remainder(2n), (_$, x) => East.greater(x, 0n));
    }),
    inputs: [],
    returns: new Map([[0n, true], [1n, true]]),
});

export const arrayGroupSome = example({
    keywords: ["array", "ArrayType", "groupSome", "group", "any"],
    description: "Check if any element in each group satisfies a predicate",
    fn: East.function([], DictType(IntegerType, BooleanType), ($) => {
        const a = $.const([1n, 2n, 3n, 4n, 5n, 6n], ArrayType(IntegerType));
        return a.groupSome((_$, x) => x.remainder(2n), (_$, x) => East.greater(x, 4n));
    }),
    inputs: [],
    returns: new Map([[0n, true], [1n, true]]),
});

export const arrayGroupToArrays = example({
    keywords: ["array", "ArrayType", "groupToArrays", "group", "collect"],
    description: "Collect elements into arrays grouped by a key",
    fn: East.function([], DictType(IntegerType, ArrayType(IntegerType)), ($) => {
        const a = $.const([1n, 2n, 3n, 4n, 5n, 6n], ArrayType(IntegerType));
        return a.groupToArrays((_$, x) => x.remainder(2n));
    }),
    inputs: [],
    returns: new Map([[0n, [2n, 4n, 6n]], [1n, [1n, 3n, 5n]]]),
});

export const arrayGroupToSets = example({
    keywords: ["array", "ArrayType", "groupToSets", "group", "SetType"],
    description: "Collect elements into sets grouped by a key (deduplicates)",
    fn: East.function([], DictType(IntegerType, SetType(IntegerType)), ($) => {
        const a = $.const([1n, 2n, 3n, 1n, 2n, 3n], ArrayType(IntegerType));
        return a.groupToSets((_$, x) => x.remainder(2n));
    }),
    inputs: [],
    returns: new Map([[0n, new Set([2n])], [1n, new Set([1n, 3n])]]),
});

export const arrayGroupMinimum = example({
    keywords: ["array", "ArrayType", "groupMinimum", "group", "min"],
    description: "Find the minimum element in each group",
    fn: East.function([], DictType(IntegerType, IntegerType), ($) => {
        const a = $.const([1n, 2n, 3n, 4n, 5n, 6n], ArrayType(IntegerType));
        return a.groupMinimum((_$, x) => x.remainder(2n));
    }),
    inputs: [],
    returns: new Map([[0n, 2n], [1n, 1n]]),
});

export const arrayGroupMaximum = example({
    keywords: ["array", "ArrayType", "groupMaximum", "group", "max"],
    description: "Find the maximum element in each group",
    fn: East.function([], DictType(IntegerType, IntegerType), ($) => {
        const a = $.const([1n, 2n, 3n, 4n, 5n, 6n], ArrayType(IntegerType));
        return a.groupMaximum((_$, x) => x.remainder(2n));
    }),
    inputs: [],
    returns: new Map([[0n, 6n], [1n, 5n]]),
});

export const arrayGroupFindFirst = example({
    keywords: ["array", "ArrayType", "groupFindFirst", "group", "search"],
    description: "Find first occurrence of a value within each group",
    fn: East.function([], undefined, ($) => {
        const a = $.const([1n, 2n, 3n, 4n, 5n, 6n], ArrayType(IntegerType));
        return a.groupFindFirst((_$, x) => x.remainder(2n), 4n);
    }),
    inputs: [],
    returns: new Map<bigint, option<bigint>>([[0n, some(3n)], [1n, none]]),
});

export const arrayGroupFindAll = example({
    keywords: ["array", "ArrayType", "groupFindAll", "group", "search"],
    description: "Find all occurrences of a value within each group",
    fn: East.function([], undefined, ($) => {
        const a = $.const([1n, 2n, 3n, 2n, 5n, 2n], ArrayType(IntegerType));
        return a.groupFindAll((_$, x) => x.remainder(2n), 2n);
    }),
    inputs: [],
    returns: new Map([[0n, [1n, 3n, 5n]], [1n, []]]),
});

export const arrayGroupFindMinimum = example({
    keywords: ["array", "ArrayType", "groupFindMinimum", "group", "argmin"],
    description: "Find index of minimum element within each group",
    fn: East.function([], DictType(IntegerType, IntegerType), ($) => {
        const a = $.const([1n, 2n, 3n, 4n, 5n, 6n], ArrayType(IntegerType));
        return a.groupFindMinimum((_$, x) => x.remainder(2n));
    }),
    inputs: [],
    returns: new Map([[0n, 1n], [1n, 0n]]),
});

export const arrayGroupFindMaximum = example({
    keywords: ["array", "ArrayType", "groupFindMaximum", "group", "argmax"],
    description: "Find index of maximum element within each group",
    fn: East.function([], DictType(IntegerType, IntegerType), ($) => {
        const a = $.const([1n, 2n, 3n, 4n, 5n, 6n], ArrayType(IntegerType));
        return a.groupFindMaximum((_$, x) => x.remainder(2n));
    }),
    inputs: [],
    returns: new Map([[0n, 5n], [1n, 4n]]),
});

export const arrayGroupToDicts = example({
    keywords: ["array", "ArrayType", "groupToDicts", "group", "DictType", "nested"],
    description: "Group into nested dicts (outer key + inner key)",
    fn: East.function([], undefined, ($) => {
        const a = $.const([1n, 2n, 3n, 4n, 5n, 6n], ArrayType(IntegerType));
        return a.groupToDicts((_$, x) => x.remainder(2n), (_$, x) => x);
    }),
    inputs: [],
    returns: new Map([
        [0n, new Map([[2n, 2n], [4n, 4n], [6n, 6n]])],
        [1n, new Map([[1n, 1n], [3n, 3n], [5n, 5n]])],
    ]),
});

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

export const arrayEncodeCsv = example({
    keywords: ["array", "ArrayType", "encodeCsv", "csv", "StructType", "serialize"],
    description: "Encode an array of structs as CSV",
    fn: East.function([], StringType, ($) => {
        const T = StructType({ name: StringType, age: IntegerType });
        const arr = $.const([
            { name: "Alice", age: 30n },
            { name: "Bob", age: 25n },
        ], ArrayType(T));
        const result = $.let(arr.encodeCsv());
        return result.decodeUtf8();
    }),
    inputs: [],
    returns: "name,age\r\nAlice,30\r\nBob,25",
});

// ---------------------------------------------------------------------------
// Comparisons
// ---------------------------------------------------------------------------

export const arrayEquals = example({
    keywords: ["array", "ArrayType", "equals", "comparison"],
    description: "Check if two arrays are equal",
    fn: East.function([], BooleanType, ($) => {
        const a = $.const([1n, 2n, 3n], ArrayType(IntegerType));
        return a.equals([1n, 2n, 3n]);
    }),
    inputs: [],
    returns: true,
});

export const arrayNotEquals = example({
    keywords: ["array", "ArrayType", "notEquals", "comparison"],
    description: "Check if two arrays are not equal",
    fn: East.function([], BooleanType, ($) => {
        const a = $.const([1n, 2n, 3n], ArrayType(IntegerType));
        return a.notEquals([1n, 2n]);
    }),
    inputs: [],
    returns: true,
});
