/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import { East, DictType, IntegerType, StringType, BooleanType, FloatType, SetType, ArrayType, example, some, none } from "@elaraai/east";

const { str } = East;

// ---------------------------------------------------------------------------
// Basic Operations
// ---------------------------------------------------------------------------

export const dictSize = example({
    keywords: ["dict", "DictType", "size", "length", "count"],
    description: "Get the number of entries in a dict",
    fn: East.function([], IntegerType, ($) => {
        const d = $.const(new Map([[1n, "a"], [2n, "b"], [3n, "c"]]), DictType(IntegerType, StringType));
        return d.size();
    }),
    inputs: [],
    returns: 3n,
});

export const dictHas = example({
    keywords: ["dict", "DictType", "has", "contains", "key"],
    description: "Check if a dict contains a key",
    fn: East.function([], BooleanType, ($) => {
        const d = $.const(new Map([[1n, "a"], [2n, "b"], [3n, "c"]]), DictType(IntegerType, StringType));
        return d.has(2n);
    }),
    inputs: [],
    returns: true,
});

export const dictGenerate = example({
    keywords: ["dict", "DictType", "generate", "create", "build"],
    description: "Generate a dict from a count with key and value functions",
    fn: East.function([], DictType(IntegerType, StringType), ($) => {
        return East.Dict.generate(3n, IntegerType, StringType, (_$, i) => i.add(1n), (_$, i) => East.print(i));
    }),
    inputs: [],
    returns: new Map([[1n, "0"], [2n, "1"], [3n, "2"]]),
});

// ---------------------------------------------------------------------------
// Printing and Parsing
// ---------------------------------------------------------------------------

export const dictPrint = example({
    keywords: ["dict", "DictType", "print", "string", "display"],
    description: "Print a dict as a string representation",
    fn: East.function([], StringType, ($) => {
        const d = $.const(new Map([[1n, "a"], [2n, "b"], [3n, "c"]]), DictType(IntegerType, StringType));
        return East.print(d);
    }),
    inputs: [],
    returns: '{1:"a",2:"b",3:"c"}',
});

export const dictParse = example({
    keywords: ["dict", "DictType", "parse", "string", "deserialize"],
    description: "Parse a string into a dict",
    fn: East.function([], DictType(IntegerType, StringType), ($) => {
        const s = $.const('{1:"a",2:"b",3:"c"}');
        return s.parse(DictType(IntegerType, StringType));
    }),
    inputs: [],
    returns: new Map([[1n, "a"], [2n, "b"], [3n, "c"]]),
});

// ---------------------------------------------------------------------------
// Mutation: Insert, Delete, Pop
// ---------------------------------------------------------------------------

export const dictInsert = example({
    keywords: ["dict", "DictType", "insert", "add", "mutation"],
    description: "Insert a new key-value pair into a dict",
    fn: East.function([], IntegerType, ($) => {
        const d = $.let(new Map([[1n, "a"], [2n, "b"]]), DictType(IntegerType, StringType));
        $(d.insert(3n, "c"));
        return d.size();
    }),
    inputs: [],
    returns: 3n,
});

export const dictDelete = example({
    keywords: ["dict", "DictType", "delete", "remove", "mutation"],
    description: "Delete a key-value pair from a dict",
    fn: East.function([], IntegerType, ($) => {
        const d = $.let(new Map([[1n, "a"], [2n, "b"], [3n, "c"]]), DictType(IntegerType, StringType));
        $(d.delete(2n));
        return d.size();
    }),
    inputs: [],
    returns: 2n,
});

export const dictPop = example({
    keywords: ["dict", "DictType", "pop", "remove", "return"],
    description: "Remove a key and return its value",
    fn: East.function([], StringType, ($) => {
        const d = $.let(new Map([[1n, "a"], [2n, "b"], [3n, "c"]]), DictType(IntegerType, StringType));
        return d.pop(2n);
    }),
    inputs: [],
    returns: "b",
});

// ---------------------------------------------------------------------------
// Get
// ---------------------------------------------------------------------------

export const dictGet = example({
    keywords: ["dict", "DictType", "get", "lookup", "access"],
    description: "Get a value by key from a dict",
    fn: East.function([], StringType, ($) => {
        const d = $.const(new Map([[1n, "a"], [2n, "b"], [3n, "c"]]), DictType(IntegerType, StringType));
        return d.get(2n);
    }),
    inputs: [],
    returns: "b",
});

export const dictGetDefault = example({
    keywords: ["dict", "DictType", "get", "default", "missing"],
    description: "Get a value by key with a default for missing keys",
    fn: East.function([], StringType, ($) => {
        const d = $.const(new Map([[1n, "a"], [2n, "b"]]), DictType(IntegerType, StringType));
        return d.get(4n, () => "missing");
    }),
    inputs: [],
    returns: "missing",
});

// ---------------------------------------------------------------------------
// InsertOrUpdate, Update, Merge, Swap
// ---------------------------------------------------------------------------

export const dictInsertOrUpdate = example({
    keywords: ["dict", "DictType", "insertOrUpdate", "upsert", "mutation"],
    description: "Insert a new key or overwrite an existing one",
    fn: East.function([], StringType, ($) => {
        const d = $.let(new Map([[1n, "a"], [2n, "b"]]), DictType(IntegerType, StringType));
        $(d.insertOrUpdate(3n, "c"));
        $(d.insertOrUpdate(1n, "A"));
        return d.get(1n);
    }),
    inputs: [],
    returns: "A",
});

export const dictInsertOrUpdateConflict = example({
    keywords: ["dict", "DictType", "insertOrUpdate", "conflict", "merge"],
    description: "Insert or update with a custom conflict handler",
    fn: East.function([], StringType, ($) => {
        const d = $.let(new Map([[1n, "a"], [2n, "b"]]), DictType(IntegerType, StringType));
        $(d.insertOrUpdate(2n, "_updated", ($, existing, newVal) => existing.concat(newVal)));
        return d.get(2n);
    }),
    inputs: [],
    returns: "b_updated",
});

export const dictUpdate = example({
    keywords: ["dict", "DictType", "update", "replace", "mutation"],
    description: "Update the value for an existing key",
    fn: East.function([], StringType, ($) => {
        const d = $.let(new Map([[1n, "a"], [2n, "b"]]), DictType(IntegerType, StringType));
        $(d.update(1n, "A"));
        return d.get(1n);
    }),
    inputs: [],
    returns: "A",
});

export const dictMerge = example({
    keywords: ["dict", "DictType", "merge", "combine", "mutation"],
    description: "Merge a value into an existing key using a combine function",
    fn: East.function([], StringType, ($) => {
        const d = $.let(new Map([[1n, "a"], [2n, "b"]]), DictType(IntegerType, StringType));
        $(d.merge(1n, "_merged", ($, existing, value) => existing.concat(value)));
        return d.get(1n);
    }),
    inputs: [],
    returns: "a_merged",
});

export const dictSwap = example({
    keywords: ["dict", "DictType", "swap", "exchange", "replace"],
    description: "Replace a value and return the old value",
    fn: East.function([], StringType, ($) => {
        const d = $.let(new Map([[1n, "a"], [2n, "b"]]), DictType(IntegerType, StringType));
        return d.swap(2n, "B");
    }),
    inputs: [],
    returns: "b",
});

// ---------------------------------------------------------------------------
// Union and MergeAll
// ---------------------------------------------------------------------------

export const dictUnionInPlace = example({
    keywords: ["dict", "DictType", "unionInPlace", "union", "combine"],
    description: "Union two dicts in place with a conflict handler",
    fn: East.function([], DictType(IntegerType, StringType), ($) => {
        const d1 = $.let(new Map([[1n, "a"], [2n, "b"]]), DictType(IntegerType, StringType));
        const d2 = $.const(new Map([[2n, "B"], [3n, "C"]]), DictType(IntegerType, StringType));
        $(d1.unionInPlace(d2, ($, v1, v2) => v1.concat("+").concat(v2)));
        return d1;
    }),
    inputs: [],
    returns: new Map([[1n, "a"], [2n, "b+B"], [3n, "C"]]),
});

export const dictMergeAll = example({
    keywords: ["dict", "DictType", "mergeAll", "combine", "missing"],
    description: "Merge all entries from another dict with conflict and missing handlers",
    fn: East.function([], DictType(IntegerType, StringType), ($) => {
        const d1 = $.let(new Map([[1n, "a"], [2n, "b"]]), DictType(IntegerType, StringType));
        const d2 = $.const(new Map([[2n, "B"], [3n, "C"]]), DictType(IntegerType, StringType));
        $(d1.mergeAll(d2, ($, v1, v2) => v1.concat("+").concat(v2), () => "default"));
        return d1;
    }),
    inputs: [],
    returns: new Map([[1n, "a"], [2n, "b+B"], [3n, "default+C"]]),
});

// ---------------------------------------------------------------------------
// Comparisons
// ---------------------------------------------------------------------------

export const dictEquals = example({
    keywords: ["dict", "DictType", "equals", "equality", "comparison"],
    description: "Check if two dicts are equal",
    fn: East.function([], BooleanType, ($) => {
        const d = $.const(new Map([[1n, "a"], [2n, "b"]]), DictType(IntegerType, StringType));
        return d.equals(new Map([[1n, "a"], [2n, "b"]]));
    }),
    inputs: [],
    returns: true,
});

export const dictNotEquals = example({
    keywords: ["dict", "DictType", "notEquals", "inequality", "comparison"],
    description: "Check if two dicts are not equal",
    fn: East.function([], BooleanType, ($) => {
        const d = $.const(new Map([[1n, "a"], [2n, "b"]]), DictType(IntegerType, StringType));
        return d.notEquals(new Map([[1n, "a"]]));
    }),
    inputs: [],
    returns: true,
});

// ---------------------------------------------------------------------------
// Keys, GetKeys, ForEach, Copy
// ---------------------------------------------------------------------------

export const dictKeys = example({
    keywords: ["dict", "DictType", "keys", "keySet"],
    description: "Get the set of keys from a dict",
    fn: East.function([], SetType(IntegerType), ($) => {
        const d = $.const(new Map([[1n, "a"], [2n, "b"], [3n, "c"]]), DictType(IntegerType, StringType));
        return d.keys();
    }),
    inputs: [],
    returns: new Set([1n, 2n, 3n]),
});

export const dictGetKeys = example({
    keywords: ["dict", "DictType", "getKeys", "subset", "filter"],
    description: "Get a sub-dict containing only specified keys",
    fn: East.function([], DictType(IntegerType, StringType), ($) => {
        const d = $.const(new Map([[1n, "a"], [2n, "b"], [3n, "c"]]), DictType(IntegerType, StringType));
        return d.getKeys(new Set([2n, 3n]));
    }),
    inputs: [],
    returns: new Map([[2n, "b"], [3n, "c"]]),
});

export const dictForEach = example({
    keywords: ["dict", "DictType", "forEach", "iterate", "loop"],
    description: "Iterate over dict entries with forEach",
    fn: East.function([], StringType, ($) => {
        const d = $.const(new Map([[1n, "a"], [2n, "b"], [3n, "c"]]), DictType(IntegerType, StringType));
        const result = $.let("");
        $(d.forEach(($, value, key) => $.assign(result, str`${result}${key}:${value};`)));
        return result;
    }),
    inputs: [],
    returns: "1:a;2:b;3:c;",
});

export const dictCopy = example({
    keywords: ["dict", "DictType", "copy", "clone", "duplicate"],
    description: "Create an independent shallow copy of a dict",
    fn: East.function([], DictType(IntegerType, StringType), ($) => {
        const d = $.let(new Map([[1n, "a"], [2n, "b"]]), DictType(IntegerType, StringType));
        const copy = $.let(d.copy());
        $(d.insert(3n, "c"));
        return copy;
    }),
    inputs: [],
    returns: new Map([[1n, "a"], [2n, "b"]]),
});

// ---------------------------------------------------------------------------
// Map, Filter, FilterMap, Reduce
// ---------------------------------------------------------------------------

export const dictMap = example({
    keywords: ["dict", "DictType", "map", "transform", "values"],
    description: "Transform dict values with a mapping function",
    fn: East.function([], DictType(IntegerType, StringType), ($) => {
        const d = $.const(new Map([[1n, "a"], [2n, "b"], [3n, "c"]]), DictType(IntegerType, StringType));
        return d.map(($, value, key) => str`${key}:${value}`);
    }),
    inputs: [],
    returns: new Map([[1n, "1:a"], [2n, "2:b"], [3n, "3:c"]]),
});

export const dictFilter = example({
    keywords: ["dict", "DictType", "filter", "select", "predicate"],
    description: "Filter dict entries by a predicate on keys",
    fn: East.function([], DictType(IntegerType, StringType), ($) => {
        const d = $.const(new Map([[1n, "a"], [2n, "b"], [3n, "c"]]), DictType(IntegerType, StringType));
        return d.filter((_$, _value, key) => East.equal(key.remainder(2n), 1n));
    }),
    inputs: [],
    returns: new Map([[1n, "a"], [3n, "c"]]),
});

export const dictFilterMap = example({
    keywords: ["dict", "DictType", "filterMap", "transform", "option"],
    description: "Filter and transform dict values using option type",
    fn: East.function([], DictType(IntegerType, StringType), ($) => {
        const d = $.const(new Map([[1n, "a"], [2n, "b"], [3n, "c"], [4n, "d"]]), DictType(IntegerType, StringType));
        return d.filterMap(($, value, key) => East.equal(key.remainder(2n), 1n).ifElse(_$ => some(str`${key}:${value}`), _$ => none));
    }),
    inputs: [],
    returns: new Map([[1n, "1:a"], [3n, "3:c"]]),
});

export const dictReduce = example({
    keywords: ["dict", "DictType", "reduce", "fold", "accumulate"],
    description: "Reduce dict entries to a single value",
    fn: East.function([], StringType, ($) => {
        const d = $.const(new Map([[1n, "a"], [2n, "b"], [3n, "c"]]), DictType(IntegerType, StringType));
        return d.reduce((_$, acc, value, key) => acc.concat(str`${key}:${value};`), "");
    }),
    inputs: [],
    returns: "1:a;2:b;3:c;",
});

// ---------------------------------------------------------------------------
// Common Reductions: Sum, Every, Some
// ---------------------------------------------------------------------------

export const dictSum = example({
    keywords: ["dict", "DictType", "sum", "total", "aggregate"],
    description: "Sum all values in a dict",
    fn: East.function([], IntegerType, ($) => {
        const d = $.const(new Map([["a", 1n], ["b", 2n], ["c", 3n]]), DictType(StringType, IntegerType));
        return d.sum();
    }),
    inputs: [],
    returns: 6n,
});

export const dictEvery = example({
    keywords: ["dict", "DictType", "every", "all", "predicate"],
    description: "Check if every value in a boolean dict is true",
    fn: East.function([], BooleanType, ($) => {
        const d = $.const(new Map([["a", true], ["b", false]]), DictType(StringType, BooleanType));
        return d.every();
    }),
    inputs: [],
    returns: false,
});

export const dictSome = example({
    keywords: ["dict", "DictType", "some", "any", "predicate"],
    description: "Check if any value in a boolean dict is true",
    fn: East.function([], BooleanType, ($) => {
        const d = $.const(new Map([["a", true], ["b", false]]), DictType(StringType, BooleanType));
        return d.some();
    }),
    inputs: [],
    returns: true,
});

// ---------------------------------------------------------------------------
// Conversion: toArray, toSet, toDict
// ---------------------------------------------------------------------------

export const dictToArray = example({
    keywords: ["dict", "DictType", "toArray", "convert", "values"],
    description: "Convert dict values to an array",
    fn: East.function([], ArrayType(StringType), ($) => {
        const d = $.const(new Map([[1n, "a"], [2n, "b"], [3n, "c"]]), DictType(IntegerType, StringType));
        return d.toArray();
    }),
    inputs: [],
    returns: ["a", "b", "c"],
});

export const dictToSet = example({
    keywords: ["dict", "DictType", "toSet", "convert", "unique"],
    description: "Convert dict to a set using a mapping function",
    fn: East.function([], SetType(IntegerType), ($) => {
        const d = $.const(new Map([[1n, "a"], [2n, "b"], [3n, "c"]]), DictType(IntegerType, StringType));
        return d.toSet((_$, _x, k) => k.add(1n));
    }),
    inputs: [],
    returns: new Set([2n, 3n, 4n]),
});

export const dictToDict = example({
    keywords: ["dict", "DictType", "toDict", "convert", "remap"],
    description: "Remap dict keys to create a new dict",
    fn: East.function([], DictType(StringType, StringType), ($) => {
        const d = $.const(new Map([[1n, "a"], [2n, "b"], [3n, "c"]]), DictType(IntegerType, StringType));
        return d.toDict((_$, _x, k) => East.print(k));
    }),
    inputs: [],
    returns: new Map([["1", "a"], ["2", "b"], ["3", "c"]]),
});

// ---------------------------------------------------------------------------
// Flatten: flattenToArray, flattenToSet, flattenToDict
// ---------------------------------------------------------------------------

export const dictFlattenToArray = example({
    keywords: ["dict", "DictType", "flattenToArray", "flatten", "expand"],
    description: "Flatten dict of arrays into a single array",
    fn: East.function([], ArrayType(IntegerType), ($) => {
        const d = $.const(new Map([["a", [1n, 2n]], ["b", [3n]]]), DictType(StringType, ArrayType(IntegerType)));
        return d.flattenToArray();
    }),
    inputs: [],
    returns: [1n, 2n, 3n],
});

export const dictFlattenToSet = example({
    keywords: ["dict", "DictType", "flattenToSet", "flatten", "unique"],
    description: "Flatten dict of sets into a single set",
    fn: East.function([], SetType(IntegerType), ($) => {
        const d = $.const(new Map([["a", new Set([1n, 2n])], ["b", new Set([2n, 3n])]]), DictType(StringType, SetType(IntegerType)));
        return d.flattenToSet();
    }),
    inputs: [],
    returns: new Set([1n, 2n, 3n]),
});

export const dictFlattenToDict = example({
    keywords: ["dict", "DictType", "flattenToDict", "flatten", "merge"],
    description: "Flatten dict of dicts into a single dict",
    fn: East.function([], DictType(StringType, IntegerType), ($) => {
        const d = $.const(
            new Map([["a", new Map([["1", 1n], ["2", 2n]])], ["b", new Map([["3", 3n]])]]),
            DictType(StringType, DictType(StringType, IntegerType))
        );
        return d.flattenToDict();
    }),
    inputs: [],
    returns: new Map([["1", 1n], ["2", 2n], ["3", 3n]]),
});

// ---------------------------------------------------------------------------
// Group Operations
// ---------------------------------------------------------------------------

export const dictGroupSize = example({
    keywords: ["dict", "DictType", "groupSize", "group", "count"],
    description: "Group dict values and count entries per group",
    fn: East.function([], DictType(IntegerType, IntegerType), ($) => {
        const d = $.const(new Map([["a", 1n], ["b", 2n], ["c", 3n], ["d", 1n], ["e", 2n]]), DictType(StringType, IntegerType));
        return d.groupSize();
    }),
    inputs: [],
    returns: new Map([[1n, 2n], [2n, 2n], [3n, 1n]]),
});

export const dictGroupEvery = example({
    keywords: ["dict", "DictType", "groupEvery", "group", "all"],
    description: "Group dict values and check if all satisfy a predicate per group",
    fn: East.function([], DictType(IntegerType, BooleanType), ($) => {
        const d = $.const(new Map([["a", 1n], ["b", 2n], ["c", 3n], ["d", 4n], ["e", 5n], ["f", 6n]]), DictType(StringType, IntegerType));
        return d.groupEvery((_$, v) => v.remainder(2n), (_$, v) => East.greater(v, East.value(0n)));
    }),
    inputs: [],
    returns: new Map([[0n, true], [1n, true]]),
});

export const dictGroupSome = example({
    keywords: ["dict", "DictType", "groupSome", "group", "any"],
    description: "Group dict values and check if any satisfy a predicate per group",
    fn: East.function([], DictType(IntegerType, BooleanType), ($) => {
        const d = $.const(new Map([["a", 1n], ["b", 2n], ["c", 3n], ["d", 4n], ["e", 5n], ["f", 6n]]), DictType(StringType, IntegerType));
        return d.groupSome((_$, v) => v.remainder(2n), (_$, v) => East.greater(v, East.value(4n)));
    }),
    inputs: [],
    returns: new Map([[0n, true], [1n, true]]),
});

export const dictGroupSum = example({
    keywords: ["dict", "DictType", "groupSum", "group", "aggregate"],
    description: "Group dict values and sum per group",
    fn: East.function([], DictType(IntegerType, IntegerType), ($) => {
        const d = $.const(new Map([["a", 1n], ["b", 2n], ["c", 3n], ["d", 4n], ["e", 5n], ["f", 6n]]), DictType(StringType, IntegerType));
        return d.groupSum((_$, v) => v.remainder(2n));
    }),
    inputs: [],
    returns: new Map([[0n, 12n], [1n, 9n]]),
});

export const dictGroupMean = example({
    keywords: ["dict", "DictType", "groupMean", "group", "average"],
    description: "Group dict values and compute mean per group",
    fn: East.function([], DictType(IntegerType, FloatType), ($) => {
        const d = $.const(new Map([["a", 1n], ["b", 2n], ["c", 3n], ["d", 4n], ["e", 5n], ["f", 6n]]), DictType(StringType, IntegerType));
        return d.groupMean((_$, v) => v.remainder(2n));
    }),
    inputs: [],
    returns: new Map([[0n, 4.0], [1n, 3.0]]),
});

export const dictGroupReduce = example({
    keywords: ["dict", "DictType", "groupReduce", "group", "fold"],
    description: "Group dict values and reduce each group with an init and combine function",
    fn: East.function([], DictType(IntegerType, IntegerType), ($) => {
        const d = $.const(new Map([["a", 1n], ["b", 2n], ["c", 3n]]), DictType(StringType, IntegerType));
        return d.groupReduce((_$, v, _k) => v.remainder(2n), (_$, _k2) => 10n, (_$, a, b, _k) => a.add(b));
    }),
    inputs: [],
    returns: new Map([[0n, 12n], [1n, 14n]]),
});

