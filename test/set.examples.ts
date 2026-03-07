/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import { East, Expr, IntegerType, FloatType, SetType, StringType, BooleanType, DictType, some, none, example } from "@elaraai/east";
import type { option } from "@elaraai/east";

// ---------------------------------------------------------------------------
// Set Creation and Basic Ops
// ---------------------------------------------------------------------------

export const setSize = example({
    keywords: ["set", "SetType", "size", "count", "length"],
    description: "Get the size of a set",
    fn: East.function([], IntegerType, ($) => {
        const s = $.const(new Set([1n, 2n, 3n]), SetType(IntegerType));
        return s.size();
    }),
    inputs: [],
    returns: 3n,
});

export const setHas = example({
    keywords: ["set", "SetType", "has", "contains", "member"],
    description: "Check if a set contains a value",
    fn: East.function([], BooleanType, ($) => {
        const s = $.const(new Set([1n, 2n, 3n]), SetType(IntegerType));
        return s.has(2n);
    }),
    inputs: [],
    returns: true,
});

export const setGenerate = example({
    keywords: ["set", "SetType", "generate", "create", "build"],
    description: "Generate a set from a count and a mapping function",
    fn: East.function([], SetType(IntegerType), ($) => {
        return East.Set.generate(5n, IntegerType, (_$, i) => i.add(1n));
    }),
    inputs: [],
    returns: new Set([1n, 2n, 3n, 4n, 5n]),
});

// ---------------------------------------------------------------------------
// Insert and Delete
// ---------------------------------------------------------------------------

export const setTryInsert = example({
    keywords: ["set", "SetType", "tryInsert", "add", "insert"],
    description: "Try to insert a value into a set, returning whether it was added",
    fn: East.function([], BooleanType, ($) => {
        const s = $.let(new Set([1n, 2n]), SetType(IntegerType));
        return s.tryInsert(3n);
    }),
    inputs: [],
    returns: true,
});

export const setInsert = example({
    keywords: ["set", "SetType", "insert", "add", "strict"],
    description: "Insert a value into a set (throws if already present)",
    fn: East.function([], IntegerType, ($) => {
        const s = $.let(new Set([1n, 2n]), SetType(IntegerType));
        $(s.insert(3n));
        return s.size();
    }),
    inputs: [],
    returns: 3n,
});

export const setTryDelete = example({
    keywords: ["set", "SetType", "tryDelete", "remove", "delete"],
    description: "Try to delete a value from a set, returning whether it was removed",
    fn: East.function([], BooleanType, ($) => {
        const s = $.let(new Set([1n, 2n, 3n]), SetType(IntegerType));
        return s.tryDelete(2n);
    }),
    inputs: [],
    returns: true,
});

// ---------------------------------------------------------------------------
// Set Operations
// ---------------------------------------------------------------------------

export const setUnion = example({
    keywords: ["set", "SetType", "union", "combine", "merge"],
    description: "Compute the union of two sets",
    fn: East.function([], IntegerType, ($) => {
        const s1 = $.const(new Set([1n, 2n]), SetType(IntegerType));
        const s2 = $.const(new Set([2n, 3n, 4n]), SetType(IntegerType));
        const result = $.let(s1.union(s2));
        return result.size();
    }),
    inputs: [],
    returns: 4n,
});

export const setUnionInPlace = example({
    keywords: ["set", "SetType", "unionInPlace", "merge", "mutate"],
    description: "Merge another set into this set in-place",
    fn: East.function([], IntegerType, ($) => {
        const s = $.let(new Set([1n, 2n]), SetType(IntegerType));
        const s2 = $.const(new Set([2n, 3n, 4n]), SetType(IntegerType));
        $(s.unionInPlace(s2));
        return s.size();
    }),
    inputs: [],
    returns: 4n,
});

export const setIntersection = example({
    keywords: ["set", "SetType", "intersection", "common", "overlap"],
    description: "Compute the intersection of two sets",
    fn: East.function([], IntegerType, ($) => {
        const s1 = $.const(new Set([1n, 2n, 3n]), SetType(IntegerType));
        const s2 = $.const(new Set([2n, 3n, 4n]), SetType(IntegerType));
        const result = $.let(s1.intersection(s2));
        return result.size();
    }),
    inputs: [],
    returns: 2n,
});

export const setDifference = example({
    keywords: ["set", "SetType", "difference", "subtract", "except"],
    description: "Compute the difference of two sets (elements in first but not second)",
    fn: East.function([], IntegerType, ($) => {
        const s1 = $.const(new Set([1n, 2n, 3n]), SetType(IntegerType));
        const s2 = $.const(new Set([2n, 3n, 4n]), SetType(IntegerType));
        const result = $.let(s1.difference(s2));
        return result.size();
    }),
    inputs: [],
    returns: 1n,
});

export const setSymmetricDifference = example({
    keywords: ["set", "SetType", "symmetricDifference", "xor", "exclusive"],
    description: "Compute the symmetric difference of two sets",
    fn: East.function([], IntegerType, ($) => {
        const s1 = $.const(new Set([1n, 2n, 3n]), SetType(IntegerType));
        const s2 = $.const(new Set([2n, 3n, 4n, 5n]), SetType(IntegerType));
        const result = $.let(s1.symmetricDifference(s2));
        return result.size();
    }),
    inputs: [],
    returns: 3n,
});

// ---------------------------------------------------------------------------
// Subset/Superset/Disjoint Predicates
// ---------------------------------------------------------------------------

export const setIsSubsetOf = example({
    keywords: ["set", "SetType", "isSubsetOf", "subset", "predicate"],
    description: "Check if a set is a subset of another",
    fn: East.function([], BooleanType, ($) => {
        const s1 = $.const(new Set([1n, 2n]), SetType(IntegerType));
        const s2 = $.const(new Set([1n, 2n, 3n]), SetType(IntegerType));
        return s1.isSubsetOf(s2);
    }),
    inputs: [],
    returns: true,
});

export const setIsSupersetOf = example({
    keywords: ["set", "SetType", "isSupersetOf", "superset", "predicate"],
    description: "Check if a set is a superset of another",
    fn: East.function([], BooleanType, ($) => {
        const s1 = $.const(new Set([1n, 2n, 3n]), SetType(IntegerType));
        const s2 = $.const(new Set([1n, 2n]), SetType(IntegerType));
        return s1.isSupersetOf(s2);
    }),
    inputs: [],
    returns: true,
});

export const setIsDisjointFrom = example({
    keywords: ["set", "SetType", "isDisjointFrom", "disjoint", "predicate"],
    description: "Check if two sets are disjoint (no common elements)",
    fn: East.function([], BooleanType, ($) => {
        const s1 = $.const(new Set([1n, 2n]), SetType(IntegerType));
        const s2 = $.const(new Set([3n, 4n]), SetType(IntegerType));
        return s1.isDisjointFrom(s2);
    }),
    inputs: [],
    returns: true,
});

// ---------------------------------------------------------------------------
// Printing and Parsing
// ---------------------------------------------------------------------------

export const setPrint = example({
    keywords: ["set", "SetType", "print", "display", "serialize"],
    description: "Print a set as a string representation",
    fn: East.function([], StringType, ($) => {
        const s = $.const(new Set([3n, 1n, 2n]), SetType(IntegerType));
        return East.print(s);
    }),
    inputs: [],
    returns: "{1,2,3}",
});

export const setParse = example({
    keywords: ["set", "SetType", "parse", "deserialize", "text"],
    description: "Parse a string into a set",
    fn: East.function([], SetType(IntegerType), ($) => {
        const s = $.const("{1,2,3}");
        return s.parse(SetType(IntegerType));
    }),
    inputs: [],
    returns: new Set([1n, 2n, 3n]),
});

// ---------------------------------------------------------------------------
// Comparisons
// ---------------------------------------------------------------------------

export const setEquals = example({
    keywords: ["set", "SetType", "equals", "equality", "comparison"],
    description: "Check set equality with equals",
    fn: East.function([], BooleanType, ($) => {
        const s = $.const(new Set([1n, 2n, 3n]), SetType(IntegerType));
        return s.equals(new Set([1n, 2n, 3n]));
    }),
    inputs: [],
    returns: true,
});

export const setNotEquals = example({
    keywords: ["set", "SetType", "notEquals", "inequality", "comparison"],
    description: "Check set inequality with notEquals",
    fn: East.function([], BooleanType, ($) => {
        const s = $.const(new Set([1n, 2n, 3n]), SetType(IntegerType));
        return s.notEquals(new Set([1n, 2n]));
    }),
    inputs: [],
    returns: true,
});

// ---------------------------------------------------------------------------
// Map, Filter, Reduce, ForEach, Copy
// ---------------------------------------------------------------------------

export const setCopy = example({
    keywords: ["set", "SetType", "copy", "clone", "duplicate"],
    description: "Copy a set",
    fn: East.function([], SetType(IntegerType), ($) => {
        const s = $.const(new Set([1n, 2n, 3n]), SetType(IntegerType));
        return s.copy();
    }),
    inputs: [],
    returns: new Set([1n, 2n, 3n]),
});

export const setFilter = example({
    keywords: ["set", "SetType", "filter", "select", "predicate"],
    description: "Filter a set by a predicate",
    fn: East.function([], SetType(IntegerType), ($) => {
        const s = $.const(new Set([1n, 2n, 3n]), SetType(IntegerType));
        return s.filter(($, x) => East.equal(x.remainder(2n), 1n));
    }),
    inputs: [],
    returns: new Set([1n, 3n]),
});

export const setForEach = example({
    keywords: ["set", "SetType", "forEach", "iterate", "loop"],
    description: "Iterate over set elements with a callback",
    fn: East.function([], IntegerType, ($) => {
        const s = $.const(new Set([1n, 2n, 3n]), SetType(IntegerType));
        const acc = $.let(0n);
        $(s.forEach(($, x) => $.assign(acc, acc.add(x))));
        return acc;
    }),
    inputs: [],
    returns: 6n,
});

export const setMap = example({
    keywords: ["set", "SetType", "map", "transform", "dict"],
    description: "Map set elements to key-value pairs producing a dict",
    fn: East.function([], DictType(IntegerType, StringType), ($) => {
        const s = $.const(new Set([1n, 2n, 3n]), SetType(IntegerType));
        return s.map(($, x) => East.print(x));
    }),
    inputs: [],
    returns: new Map([[1n, "1"], [2n, "2"], [3n, "3"]]),
});

export const setReduce = example({
    keywords: ["set", "SetType", "reduce", "fold", "accumulate"],
    description: "Reduce a set to a single value with an accumulator",
    fn: East.function([], IntegerType, ($) => {
        const s = $.const(new Set([1n, 2n, 3n]), SetType(IntegerType));
        return s.reduce(($, acc, x) => acc.add(x), 0n);
    }),
    inputs: [],
    returns: 6n,
});

export const setSum = example({
    keywords: ["set", "SetType", "sum", "total", "aggregate"],
    description: "Sum all elements in a set",
    fn: East.function([], IntegerType, ($) => {
        const s = $.const(new Set([1n, 2n, 3n]), SetType(IntegerType));
        return s.sum();
    }),
    inputs: [],
    returns: 6n,
});

export const setEvery = example({
    keywords: ["set", "SetType", "every", "all", "predicate"],
    description: "Check if all elements in a boolean set are true",
    fn: East.function([], BooleanType, ($) => {
        const s = $.const(new Set([true]), SetType(BooleanType));
        return s.every();
    }),
    inputs: [],
    returns: true,
});

export const setSome = example({
    keywords: ["set", "SetType", "some", "any", "predicate"],
    description: "Check if any element in a boolean set is true",
    fn: East.function([], BooleanType, ($) => {
        const s = $.const(new Set([true, false]), SetType(BooleanType));
        return s.some();
    }),
    inputs: [],
    returns: true,
});

// ---------------------------------------------------------------------------
// FilterMap, FirstMap, MapReduce
// ---------------------------------------------------------------------------

export const setFilterMap = example({
    keywords: ["set", "SetType", "filterMap", "filter", "transform"],
    description: "Filter and map set elements, returning a dict of matching entries",
    fn: East.function([], DictType(IntegerType, StringType), ($) => {
        const s = $.const(new Set([1n, 2n, 3n, 4n, 5n]), SetType(IntegerType));
        return s.filterMap(($, x) =>
            East.equal(x.remainder(2n), 0n).ifElse(
                () => some(East.print(x)),
                () => none
            )
        );
    }),
    inputs: [],
    returns: new Map([[2n, "2"], [4n, "4"]]),
});

export const setFirstMap = example({
    keywords: ["set", "SetType", "firstMap", "find", "first"],
    description: "Find the first set element matching a predicate and map it",
    fn: East.function([], StringType, ($) => {
        const s = $.const(new Set([1n, 2n, 3n, 4n, 5n, 6n]), SetType(IntegerType));
        return s.firstMap(($, x) =>
            East.equal(x.remainder(2n), 1n).ifElse(
                () => some(East.print(x)),
                () => none
            )
        ).unwrap();
    }),
    inputs: [],
    returns: "1",
});

export const setMapReduce = example({
    keywords: ["set", "SetType", "mapReduce", "transform", "aggregate"],
    description: "Map set elements then reduce pairs with a combining function",
    fn: East.function([], IntegerType, ($) => {
        const s = $.const(new Set([1n, 2n, 3n, 4n, 5n]), SetType(IntegerType));
        return s.mapReduce(
            ($, x) => x.multiply(x),
            ($, a, b) => a.add(b)
        );
    }),
    inputs: [],
    returns: 55n,
});

// ---------------------------------------------------------------------------
// Conversion: toArray, toDict, toSet
// ---------------------------------------------------------------------------

export const setToArray = example({
    keywords: ["set", "SetType", "toArray", "convert", "array"],
    description: "Convert a set to a sorted array",
    fn: East.function([], IntegerType, ($) => {
        const s = $.const(new Set([3n, 1n, 2n]), SetType(IntegerType));
        const arr = $.let(s.toArray());
        return arr.get(0n);
    }),
    inputs: [],
    returns: 1n,
});

export const setToDict = example({
    keywords: ["set", "SetType", "toDict", "convert", "dict"],
    description: "Convert a set to a dict with key and value projections",
    fn: East.function([], DictType(StringType, IntegerType), ($) => {
        const s = $.const(new Set([1n, 2n, 3n]), SetType(IntegerType));
        return s.toDict((_$, x) => East.print(x), (_$, x) => x.add(10n));
    }),
    inputs: [],
    returns: new Map([["1", 11n], ["2", 12n], ["3", 13n]]),
});

export const setToSet = example({
    keywords: ["set", "SetType", "toSet", "convert", "project"],
    description: "Project a set to a new set with a mapping function",
    fn: East.function([], SetType(IntegerType), ($) => {
        const s = $.const(new Set([1n, 2n, 3n]), SetType(IntegerType));
        return s.toSet((_$, x) => x.add(1n));
    }),
    inputs: [],
    returns: new Set([2n, 3n, 4n]),
});

// ---------------------------------------------------------------------------
// Flatten operations
// ---------------------------------------------------------------------------

export const setFlattenToArray = example({
    keywords: ["set", "SetType", "flattenToArray", "flat", "array"],
    description: "Flatten set elements into a single array",
    fn: East.function([], IntegerType, ($) => {
        const s = $.const(new Set([1n, 2n, 3n]), SetType(IntegerType));
        const arr = $.let(s.flattenToArray((_$, x) => East.Array.range(0n, x)));
        return arr.size();
    }),
    inputs: [],
    returns: 6n,
});

export const setFlattenToSet = example({
    keywords: ["set", "SetType", "flattenToSet", "flat", "set"],
    description: "Flatten set elements into a single set",
    fn: East.function([], SetType(IntegerType), ($) => {
        const s = $.const(new Set([1n, 2n, 3n]), SetType(IntegerType));
        return s.flattenToSet((_$, x) => East.Array.range(0n, x).toSet());
    }),
    inputs: [],
    returns: new Set([0n, 1n, 2n]),
});

export const setFlattenToDict = example({
    keywords: ["set", "SetType", "flattenToDict", "flat", "dict"],
    description: "Flatten set elements into a single dict",
    fn: East.function([], DictType(StringType, IntegerType), ($) => {
        const s = $.const(new Set([1n, 2n]), SetType(IntegerType));
        return s.flattenToDict((_$, x) => East.Array.range(0n, x).toDict(($, y) => East.str`${x}:${y}`, (_$, _y) => x.add(10n)));
    }),
    inputs: [],
    returns: new Map([["1:0", 11n], ["2:0", 12n], ["2:1", 12n]]),
});

// ---------------------------------------------------------------------------
// Group operations
// ---------------------------------------------------------------------------

export const setGroupSize = example({
    keywords: ["set", "SetType", "groupSize", "group", "count"],
    description: "Group set elements by key and count each group",
    fn: East.function([], DictType(IntegerType, IntegerType), ($) => {
        const s = $.const(new Set([1n, 2n, 3n]), SetType(IntegerType));
        return s.groupSize((_$, x) => x.remainder(2n));
    }),
    inputs: [],
    returns: new Map([[0n, 1n], [1n, 2n]]),
});

export const setGroupEvery = example({
    keywords: ["set", "SetType", "groupEvery", "group", "all"],
    description: "Group set elements by key and check if all satisfy a predicate",
    fn: East.function([], DictType(IntegerType, BooleanType), ($) => {
        const s = $.const(new Set([1n, 2n, 3n, 4n, 5n, 6n]), SetType(IntegerType));
        return s.groupEvery((_$, x) => x.remainder(2n), (_$, x) => East.greater(x, 0n));
    }),
    inputs: [],
    returns: new Map([[0n, true], [1n, true]]),
});

export const setGroupSome = example({
    keywords: ["set", "SetType", "groupSome", "group", "any"],
    description: "Group set elements by key and check if any satisfy a predicate",
    fn: East.function([], DictType(IntegerType, BooleanType), ($) => {
        const s = $.const(new Set([1n, 2n, 3n, 4n, 5n, 6n]), SetType(IntegerType));
        return s.groupSome((_$, x) => x.remainder(2n), (_$, x) => East.greater(x, 4n));
    }),
    inputs: [],
    returns: new Map([[0n, true], [1n, true]]),
});

export const setGroupSum = example({
    keywords: ["set", "SetType", "groupSum", "group", "total"],
    description: "Group set elements by key and sum each group",
    fn: East.function([], DictType(IntegerType, IntegerType), ($) => {
        const s = $.const(new Set([1n, 2n, 3n, 4n, 5n, 6n]), SetType(IntegerType));
        return s.groupSum((_$, x) => x.remainder(2n));
    }),
    inputs: [],
    returns: new Map([[0n, 12n], [1n, 9n]]),
});

export const setGroupMean = example({
    keywords: ["set", "SetType", "groupMean", "group", "average"],
    description: "Group set elements by key and compute the mean of each group",
    fn: East.function([], DictType(IntegerType, FloatType), ($) => {
        const s = $.const(new Set([1n, 2n, 3n, 4n, 5n, 6n]), SetType(IntegerType));
        return s.groupMean((_$, x) => x.remainder(2n));
    }),
    inputs: [],
    returns: new Map<bigint, number>([[0n, 4.0], [1n, 3.0]]),
});

export const setGroupReduce = example({
    keywords: ["set", "SetType", "groupReduce", "group", "fold"],
    description: "Group set elements by key and reduce each group with an init and combiner",
    fn: East.function([], DictType(IntegerType, IntegerType), ($) => {
        const s = $.const(new Set([1n, 2n, 3n]), SetType(IntegerType));
        return s.groupReduce((_$, x) => x.remainder(2n), (_$, _k) => 10n, (_$, a, b) => a.add(b));
    }),
    inputs: [],
    returns: new Map([[0n, 12n], [1n, 14n]]),
});

