/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import { East, IntegerType, BooleanType, StringType, ref, RefType, example } from "@elaraai/east";

// ---------------------------------------------------------------------------
// Construct and Access
// ---------------------------------------------------------------------------

export const refGet = example({
    keywords: ["ref", "RefType", "get", "dereference", "access"],
    description: "Create a ref and get its inner value",
    fn: East.function([], IntegerType, ($) => {
        const r = $.const(ref(42n), RefType(IntegerType));
        return r.get();
    }),
    inputs: [],
    returns: 42n,
});

export const refUpdate = example({
    keywords: ["ref", "RefType", "update", "set", "mutate"],
    description: "Update the value inside a ref",
    fn: East.function([], IntegerType, ($) => {
        const r = $.let(ref(0n), RefType(IntegerType));
        $(r.update(East.value(100n)));
        return r.get();
    }),
    inputs: [],
    returns: 100n,
});

export const refMerge = example({
    keywords: ["ref", "RefType", "merge", "combine", "update"],
    description: "Merge a value into a ref using a combining function",
    fn: East.function([], IntegerType, ($) => {
        const r = $.let(ref(10n), RefType(IntegerType));
        const v = $.const(5n);
        $(r.merge(v, ($, i1, i2) => i1.add(i2)));
        return r.get();
    }),
    inputs: [],
    returns: 15n,
});

// ---------------------------------------------------------------------------
// Comparisons
// ---------------------------------------------------------------------------

export const refEqual = example({
    keywords: ["ref", "RefType", "equal", "equality", "comparison"],
    description: "Check ref equality (compares by inner value)",
    fn: East.function([], BooleanType, ($) => {
        const r1 = $.let(ref(10n), RefType(IntegerType));
        const r2 = $.let(r1);
        return East.equal(r1, r2);
    }),
    inputs: [],
    returns: true,
});

export const refNotEqual = example({
    keywords: ["ref", "RefType", "notEqual", "inequality", "comparison"],
    description: "Check ref inequality",
    fn: East.function([], BooleanType, ($) => {
        const r1 = $.let(ref(10n), RefType(IntegerType));
        const r2 = $.let(ref(20n), RefType(IntegerType));
        return East.notEqual(r1, r2);
    }),
    inputs: [],
    returns: true,
});

// ---------------------------------------------------------------------------
// Printing and Parsing
// ---------------------------------------------------------------------------

export const refPrint = example({
    keywords: ["ref", "RefType", "print", "display", "serialize"],
    description: "Print a ref as a string representation",
    fn: East.function([], StringType, ($) => {
        const r = $.const(ref(42n), RefType(IntegerType));
        return East.print(r);
    }),
    inputs: [],
    returns: "&42",
});

export const refParse = example({
    keywords: ["ref", "RefType", "parse", "deserialize", "text"],
    description: "Parse a string into a ref value",
    fn: East.function([], RefType(IntegerType), ($) => {
        const s = $.const("&42");
        return s.parse(RefType(IntegerType));
    }),
    inputs: [],
    returns: ref(42n),
});
