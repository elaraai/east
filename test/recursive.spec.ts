/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import { East, BooleanType, VariantType, NullType, RecursiveType, variant, StructType, Expr, isTypeEqual } from "../src/index.js";
import { describeEast as describe, assertEast as assert } from "./platforms.spec.js";

await describe("Recursive", (test) => {
    const LinkedListType = RecursiveType(self => VariantType({
        nil: NullType,
        cons: StructType({
            head: BooleanType,
            tail: self
        })
    }));

    // Create some test values and check they infer correctly
    // This is a mixture of wrapping JavaScript values and East Exprs to ensure both work
    const list0 = East.value(variant("nil"), LinkedListType);
    const list1 = East.value(variant("cons", { head: true, tail: list0 }), LinkedListType);
    const list1b = East.value(variant("cons", { head: true, tail: variant("nil") }), LinkedListType);
    const list2 = East.value(variant("cons", { head: false, tail: list1 }), LinkedListType);
    const list2b = East.value(variant("cons", { head: false, tail: variant("cons", { head: true, tail: list0 }) }), LinkedListType);
    const list2c = East.value(variant("cons", { head: false, tail: variant("cons", { head: true, tail: variant("nil") }) }), LinkedListType);

    test("Comparisons", $ => {
        // Equality tests
        $(assert.equal(list0, list0));
        $(assert.equal(list1, list1));
        $(assert.equal(list1, list1b));
        $(assert.equal(list2, list2));
        $(assert.equal(list2, list2b));
        $(assert.equal(list2, list2c));

        $(assert.notEqual(list0, list1));
        $(assert.notEqual(list1, list2));
        $(assert.notEqual(list0, list2));

        $(assert.is(list0, list0));
        $(assert.is(list1, list1));
        $(assert.is(list1, list1b));
        $(assert.is(list2, list2));
        $(assert.is(list2, list2b));
        $(assert.is(list2, list2c));

        // Ordering tests - because of variant case names list2 < list1 < list0
        $(assert.less(list2, list1));
        $(assert.greater(list1, list2));
        $(assert.lessEqual(list2, list1));
        $(assert.lessEqual(list2, list2));
        $(assert.lessEqual(list1, list1));
        $(assert.greaterEqual(list1, list2));
        $(assert.greaterEqual(list1, list1));
        $(assert.greaterEqual(list2, list2));
    });

    test("Unwrapping", $ => {
        // Unwrap list2
        const unwrapped2 = list2.unwrap("cons").tail;
        $(assert.equal(unwrapped2, list1));

        const t1 = Expr.type(list1);
        const t2 = Expr.type(unwrapped2);
        $(assert.equal(East.value(isTypeEqual(t1, t2)), true));
    });

    test("Printing", $ => {
        $(assert.equal(East.print(list0), ".nil"));
        $(assert.equal(East.print(list1), ".cons (head=true, tail=.nil)"));
        $(assert.equal(East.print(list2), ".cons (head=false, tail=.cons (head=true, tail=.nil))"));
    });

    test("Parsing", $ => {
        $(assert.equal(East.value(".nil").parse(LinkedListType), list0));
        $(assert.equal(East.value(".cons (head=true, tail=.nil)").parse(LinkedListType), list1));
        $(assert.equal(East.value(".cons (head=false, tail=.cons (head=true, tail=.nil))").parse(LinkedListType), list2));

        $(assert.throws(East.value(".cons (head=false, tail=.cons (head=true, tail=true))").parse(LinkedListType)));
    });
});
