/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import { East, BooleanType, VariantType, NullType, RecursiveType, variant, StructType, StringType, ArrayType, DictType, example } from "@elaraai/east";

const LinkedListType = RecursiveType(self => VariantType({
    nil: NullType,
    cons: StructType({
        head: BooleanType,
        tail: self
    })
}));

// ---------------------------------------------------------------------------
// Construct and Compare
// ---------------------------------------------------------------------------

export const recursiveEqual = example({
    keywords: ["recursive", "RecursiveType", "equal", "equality", "comparison"],
    description: "Check equality of two recursive linked list values",
    fn: East.function([], BooleanType, ($) => {
        const list1 = $.const(variant("cons", { head: true, tail: variant("nil") }), LinkedListType);
        const list1b = $.const(variant("cons", { head: true, tail: variant("nil") }), LinkedListType);
        return East.equal(list1, list1b);
    }),
    inputs: [],
    returns: true,
});

export const recursiveNotEqual = example({
    keywords: ["recursive", "RecursiveType", "notEqual", "inequality", "comparison"],
    description: "Check inequality of two different recursive values",
    fn: East.function([], BooleanType, ($) => {
        const list0 = $.const(variant("nil"), LinkedListType);
        const list1 = $.const(variant("cons", { head: true, tail: variant("nil") }), LinkedListType);
        return East.notEqual(list0, list1);
    }),
    inputs: [],
    returns: true,
});

export const recursiveLess = example({
    keywords: ["recursive", "RecursiveType", "less", "ordering", "comparison"],
    description: "Check ordering of recursive values",
    fn: East.function([], BooleanType, ($) => {
        const list0 = $.const(variant("nil"), LinkedListType);
        const list1 = $.const(variant("cons", { head: true, tail: variant("nil") }), LinkedListType);
        // "cons" < "nil" in variant ordering
        return East.less(list1, list0);
    }),
    inputs: [],
    returns: true,
});

export const recursiveGreater = example({
    keywords: ["recursive", "RecursiveType", "greater", "ordering", "comparison"],
    description: "Check greater-than ordering of recursive values",
    fn: East.function([], BooleanType, ($) => {
        const list0 = $.const(variant("nil"), LinkedListType);
        const list1 = $.const(variant("cons", { head: true, tail: variant("nil") }), LinkedListType);
        return East.greater(list0, list1);
    }),
    inputs: [],
    returns: true,
});

export const recursiveLessEqual = example({
    keywords: ["recursive", "RecursiveType", "lessEqual", "ordering", "comparison"],
    description: "Check less-than-or-equal ordering of recursive values",
    fn: East.function([], BooleanType, ($) => {
        const list1 = $.const(variant("cons", { head: true, tail: variant("nil") }), LinkedListType);
        const list1b = $.const(variant("cons", { head: true, tail: variant("nil") }), LinkedListType);
        return East.lessEqual(list1, list1b);
    }),
    inputs: [],
    returns: true,
});

export const recursiveGreaterEqual = example({
    keywords: ["recursive", "RecursiveType", "greaterEqual", "ordering", "comparison"],
    description: "Check greater-than-or-equal ordering of recursive values",
    fn: East.function([], BooleanType, ($) => {
        const list0 = $.const(variant("nil"), LinkedListType);
        const list1 = $.const(variant("cons", { head: true, tail: variant("nil") }), LinkedListType);
        return East.greaterEqual(list0, list1);
    }),
    inputs: [],
    returns: true,
});

// ---------------------------------------------------------------------------
// Unwrapping
// ---------------------------------------------------------------------------

export const recursiveUnwrap = example({
    keywords: ["recursive", "RecursiveType", "unwrap", "access", "dereference"],
    description: "Unwrap a recursive value to access inner fields",
    fn: East.function([], BooleanType, ($) => {
        const list2 = $.const(variant("cons", { head: false, tail: variant("cons", { head: true, tail: variant("nil") }) }), LinkedListType);
        return list2.unwrap().unwrap("cons").head;
    }),
    inputs: [],
    returns: false,
});

// ---------------------------------------------------------------------------
// Printing and Parsing
// ---------------------------------------------------------------------------

export const recursivePrint = example({
    keywords: ["recursive", "RecursiveType", "print", "display", "serialize"],
    description: "Print a recursive linked list as a string",
    fn: East.function([], StringType, ($) => {
        const list1 = $.const(variant("cons", { head: true, tail: variant("nil") }), LinkedListType);
        return East.print(list1);
    }),
    inputs: [],
    returns: ".cons (head=true, tail=.nil)",
});

export const recursiveParse = example({
    keywords: ["recursive", "RecursiveType", "parse", "deserialize", "text"],
    description: "Parse a string into a recursive linked list value",
    fn: East.function([], LinkedListType, ($) => {
        const s = $.const(".cons (head=true, tail=.nil)", StringType);
        return s.parse(LinkedListType);
    }),
    inputs: [],
    returns: variant("cons", { head: true, tail: variant("nil", null) }),
});

// ---------------------------------------------------------------------------
// Struct-based recursive type
// ---------------------------------------------------------------------------

export const recursiveStructBased = example({
    keywords: ["recursive", "RecursiveType", "struct", "StructType", "tree", "XML"],
    description: "Create a struct-based recursive type (like an XML node)",
    fn: East.function([], StringType, ($) => {
        const XmlNodeType = RecursiveType(self => StructType({
            tag: StringType,
            attributes: DictType(StringType, StringType),
            children: ArrayType(VariantType({
                TEXT: StringType,
                ELEMENT: self
            }))
        }));
        const node = $.const({
            tag: "div",
            attributes: new Map([["class", "container"]]),
            children: [variant("TEXT", "Hello world")],
        }, XmlNodeType);
        return node.unwrap().tag;
    }),
    inputs: [],
    returns: "div",
});
