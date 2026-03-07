/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import { East, IntegerType, StringType, BooleanType, ArrayType, SetType, DictType, StructType, VariantType, variant, SortedSet, example } from "@elaraai/east";

// ---------------------------------------------------------------------------
// Primitives - East.diff
// ---------------------------------------------------------------------------

export const patchDiffUnchanged = example({
    keywords: ["patch", "diff", "unchanged", "identical"],
    description: "Diff identical values produces an 'unchanged' patch",
    fn: East.function([], StringType, ($) => {
        const before = $.const(42n, IntegerType);
        const after = $.const(42n, IntegerType);
        const patch = $.const(East.diff(before, after));
        return patch.getTag();
    }),
    inputs: [],
    returns: "unchanged",
});

export const patchDiffReplace = example({
    keywords: ["patch", "diff", "replace", "changed"],
    description: "Diff different primitive values produces a 'replace' patch",
    fn: East.function([], StringType, ($) => {
        const before = $.const(0n, IntegerType);
        const after = $.const(100n, IntegerType);
        const patch = $.const(East.diff(before, after));
        return patch.getTag();
    }),
    inputs: [],
    returns: "replace",
});

// ---------------------------------------------------------------------------
// Round-trips - East.applyPatch, East.invertPatch
// ---------------------------------------------------------------------------

export const patchApplyReplace = example({
    keywords: ["patch", "applyPatch", "apply", "replace"],
    description: "Apply a replace patch to transform a value",
    fn: East.function([], IntegerType, ($) => {
        const before = $.const(42n, IntegerType);
        const after = $.const(100n, IntegerType);
        const patch = $.const(East.diff(before, after));
        return East.applyPatch(before, patch);
    }),
    inputs: [],
    returns: 100n,
});

export const patchInvert = example({
    keywords: ["patch", "invertPatch", "invert", "reverse"],
    description: "Invert a patch and apply to restore the original value",
    fn: East.function([], IntegerType, ($) => {
        const before = $.const(42n, IntegerType);
        const after = $.const(100n, IntegerType);
        const patch = $.const(East.diff(before, after));
        const inverted = $.const(East.invertPatch(patch, IntegerType));
        return East.applyPatch(after, inverted);
    }),
    inputs: [],
    returns: 42n,
});

export const patchStringRoundTrip = example({
    keywords: ["patch", "diff", "applyPatch", "invertPatch", "string", "round-trip"],
    description: "Full round-trip: diff, apply forward, invert, apply backward on strings",
    fn: East.function([], StringType, ($) => {
        const before = $.const("hello", StringType);
        const after = $.const("world", StringType);
        const patch = $.const(East.diff(before, after));
        const inverted = $.const(East.invertPatch(patch, StringType));
        return East.applyPatch(after, inverted);
    }),
    inputs: [],
    returns: "hello",
});

// ---------------------------------------------------------------------------
// Arrays
// ---------------------------------------------------------------------------

export const patchDiffArrayInsert = example({
    keywords: ["patch", "diff", "array", "insert", "ArrayType"],
    description: "Diff arrays where an element was inserted produces a 'patch'",
    fn: East.function([], StringType, ($) => {
        const before = $.const([], ArrayType(IntegerType));
        const after = $.const([42n], ArrayType(IntegerType));
        const patch = $.const(East.diff(before, after));
        return patch.getTag();
    }),
    inputs: [],
    returns: "patch",
});

export const patchApplyArray = example({
    keywords: ["patch", "applyPatch", "array", "ArrayType"],
    description: "Apply an array patch to update a single element",
    fn: East.function([], IntegerType, ($) => {
        const before = $.const([1n, 2n, 3n], ArrayType(IntegerType));
        const after = $.const([1n, 99n, 3n], ArrayType(IntegerType));
        const patch = $.const(East.diff(before, after));
        const result = $.const(East.applyPatch(before, patch));
        return result.get(1n);
    }),
    inputs: [],
    returns: 99n,
});

export const patchInvertArray = example({
    keywords: ["patch", "invertPatch", "array", "ArrayType", "restore"],
    description: "Invert an array patch to restore the original array",
    fn: East.function([], IntegerType, ($) => {
        const before = $.const([1n, 2n, 3n], ArrayType(IntegerType));
        const after = $.const([1n, 3n], ArrayType(IntegerType));
        const patch = $.const(East.diff(before, after));
        const inverted = $.const(East.invertPatch(patch, ArrayType(IntegerType)));
        const restored = $.const(East.applyPatch(after, inverted));
        return restored.length();
    }),
    inputs: [],
    returns: 3n,
});

// ---------------------------------------------------------------------------
// Sets
// ---------------------------------------------------------------------------

export const patchDiffSet = example({
    keywords: ["patch", "diff", "set", "SetType", "insert"],
    description: "Diff sets where an element was inserted",
    fn: East.function([], StringType, ($) => {
        const before = $.const(new SortedSet([1n, 2n]), SetType(IntegerType));
        const after = $.const(new SortedSet([1n, 2n, 3n]), SetType(IntegerType));
        const patch = $.const(East.diff(before, after));
        return patch.getTag();
    }),
    inputs: [],
    returns: "patch",
});

export const patchApplySet = example({
    keywords: ["patch", "applyPatch", "set", "SetType"],
    description: "Apply a set patch to insert an element",
    fn: East.function([], BooleanType, ($) => {
        const before = $.const(new SortedSet([1n, 2n]), SetType(IntegerType));
        const after = $.const(new SortedSet([1n, 2n, 3n]), SetType(IntegerType));
        const patch = $.const(East.diff(before, after));
        const result = $.const(East.applyPatch(before, patch));
        return result.has(3n);
    }),
    inputs: [],
    returns: true,
});

// ---------------------------------------------------------------------------
// Dicts
// ---------------------------------------------------------------------------

export const patchDiffDict = example({
    keywords: ["patch", "diff", "dict", "DictType", "insert"],
    description: "Diff dicts where a key was inserted",
    fn: East.function([], StringType, ($) => {
        const before = $.const(new Map([["a", 1n]]), DictType(StringType, IntegerType));
        const after = $.const(new Map([["a", 1n], ["b", 2n]]), DictType(StringType, IntegerType));
        const patch = $.const(East.diff(before, after));
        return patch.getTag();
    }),
    inputs: [],
    returns: "patch",
});

export const patchApplyDict = example({
    keywords: ["patch", "applyPatch", "dict", "DictType"],
    description: "Apply a dict patch with inserts and updates",
    fn: East.function([], IntegerType, ($) => {
        const before = $.const(new Map([["a", 1n], ["b", 2n]]), DictType(StringType, IntegerType));
        const after = $.const(new Map([["a", 10n], ["c", 3n]]), DictType(StringType, IntegerType));
        const patch = $.const(East.diff(before, after));
        const result = $.const(East.applyPatch(before, patch));
        return result.get("a");
    }),
    inputs: [],
    returns: 10n,
});

// ---------------------------------------------------------------------------
// Structs
// ---------------------------------------------------------------------------

export const patchDiffStruct = example({
    keywords: ["patch", "diff", "struct", "StructType", "field"],
    description: "Diff structs with a field change produces a 'patch'",
    fn: East.function([], StringType, ($) => {
        const PersonType = StructType({ name: StringType, age: IntegerType });
        const before = $.const({ name: "Alice", age: 30n }, PersonType);
        const after = $.const({ name: "Alice", age: 31n }, PersonType);
        const patch = $.const(East.diff(before, after));
        return patch.getTag();
    }),
    inputs: [],
    returns: "patch",
});

export const patchApplyStruct = example({
    keywords: ["patch", "applyPatch", "struct", "StructType"],
    description: "Apply a struct patch to update fields",
    fn: East.function([], StringType, ($) => {
        const PersonType = StructType({ name: StringType, age: IntegerType });
        const before = $.const({ name: "Alice", age: 30n }, PersonType);
        const after = $.const({ name: "Bob", age: 25n }, PersonType);
        const patch = $.const(East.diff(before, after));
        const result = $.const(East.applyPatch(before, patch));
        return result.name;
    }),
    inputs: [],
    returns: "Bob",
});

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

export const patchDiffVariantSameCase = example({
    keywords: ["patch", "diff", "variant", "VariantType", "same case"],
    description: "Diff variants with same case but different data produces a 'patch'",
    fn: East.function([], StringType, ($) => {
        const ResultType = VariantType({ ok: IntegerType, error: StringType });
        const before = $.const(variant("ok", 1n), ResultType);
        const after = $.const(variant("ok", 99n), ResultType);
        const patch = $.const(East.diff(before, after));
        return patch.getTag();
    }),
    inputs: [],
    returns: "patch",
});

export const patchDiffVariantDifferentCase = example({
    keywords: ["patch", "diff", "variant", "VariantType", "different case", "replace"],
    description: "Diff variants with different cases produces a 'replace' patch",
    fn: East.function([], StringType, ($) => {
        const ResultType = VariantType({ ok: IntegerType, error: StringType });
        const before = $.const(variant("ok", 42n), ResultType);
        const after = $.const(variant("error", "failed"), ResultType);
        const patch = $.const(East.diff(before, after));
        return patch.getTag();
    }),
    inputs: [],
    returns: "replace",
});

export const patchApplyVariant = example({
    keywords: ["patch", "applyPatch", "variant", "VariantType"],
    description: "Apply a variant patch to update the inner data",
    fn: East.function([], IntegerType, ($) => {
        const ResultType = VariantType({ ok: IntegerType, error: StringType });
        const before = $.const(variant("ok", 1n), ResultType);
        const after = $.const(variant("ok", 99n), ResultType);
        const patch = $.const(East.diff(before, after));
        const result = $.const(East.applyPatch(before, patch));
        return result.unwrap("ok");
    }),
    inputs: [],
    returns: 99n,
});

// ---------------------------------------------------------------------------
// Compose
// ---------------------------------------------------------------------------

export const patchCompose = example({
    keywords: ["patch", "composePatch", "compose", "combine"],
    description: "Compose two patches into a single patch",
    fn: East.function([], IntegerType, ($) => {
        const a = $.const(1n, IntegerType);
        const b = $.const(2n, IntegerType);
        const c = $.const(3n, IntegerType);
        const ab = $.const(East.diff(a, b));
        const bc = $.const(East.diff(b, c));
        const composed = $.const(East.composePatch(ab, bc, IntegerType));
        return East.applyPatch(a, composed);
    }),
    inputs: [],
    returns: 3n,
});

export const patchComposeUnchanged = example({
    keywords: ["patch", "composePatch", "unchanged", "identity"],
    description: "Composing two unchanged patches produces unchanged",
    fn: East.function([], StringType, ($) => {
        const v = $.const(42n, IntegerType);
        const p1 = $.const(East.diff(v, v));
        const p2 = $.const(East.diff(v, v));
        const composed = $.const(East.composePatch(p1, p2, IntegerType));
        return composed.getTag();
    }),
    inputs: [],
    returns: "unchanged",
});

// ---------------------------------------------------------------------------
// Algebraic Properties
// ---------------------------------------------------------------------------

export const patchDoubleInvert = example({
    keywords: ["patch", "invertPatch", "double invert", "algebraic", "identity"],
    description: "Double invert of a patch produces equivalent result to original",
    fn: East.function([], IntegerType, ($) => {
        const before = $.const(42n, IntegerType);
        const after = $.const(100n, IntegerType);
        const patch = $.const(East.diff(before, after));
        const inv1 = $.const(East.invertPatch(patch, IntegerType));
        const inv2 = $.const(East.invertPatch(inv1, IntegerType));
        return East.applyPatch(before, inv2);
    }),
    inputs: [],
    returns: 100n,
});

// ---------------------------------------------------------------------------
// Nested Types
// ---------------------------------------------------------------------------

export const patchNestedStruct = example({
    keywords: ["patch", "diff", "applyPatch", "nested", "struct", "array"],
    description: "Diff and apply a patch on an array of structs",
    fn: East.function([], StringType, ($) => {
        const ItemType = StructType({ id: IntegerType, name: StringType });
        const before = $.const([{ id: 1n, name: "a" }, { id: 2n, name: "b" }], ArrayType(ItemType));
        const after = $.const([{ id: 1n, name: "a" }, { id: 2n, name: "updated" }], ArrayType(ItemType));
        const patch = $.const(East.diff(before, after));
        const result = $.const(East.applyPatch(before, patch));
        return result.get(1n).name;
    }),
    inputs: [],
    returns: "updated",
});

// ---------------------------------------------------------------------------
// E2E Round-trip
// ---------------------------------------------------------------------------

export const patchE2ERoundTrip = example({
    keywords: ["patch", "diff", "applyPatch", "invertPatch", "composePatch", "E2E", "round-trip"],
    description: "End-to-end: diff, compose, apply, invert, and restore original",
    fn: East.function([], IntegerType, ($) => {
        const v1 = $.const(10n, IntegerType);
        const v2 = $.const(20n, IntegerType);
        const v3 = $.const(30n, IntegerType);
        const p1 = $.const(East.diff(v1, v2));
        const p2 = $.const(East.diff(v2, v3));
        const composed = $.const(East.composePatch(p1, p2, IntegerType));
        const inverted = $.const(East.invertPatch(composed, IntegerType));
        return East.applyPatch(v3, inverted);
    }),
    inputs: [],
    returns: 10n,
});
