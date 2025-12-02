/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import { East, BooleanType } from "../src/index.js";
import { describeEast as describe, assertEast as assert } from "./platforms.spec.js";

describe("Boolean", (test) => {
    test("Boolean operations", $ => {
        $(assert.equal(East.value(true).not(), false));
        $(assert.equal(East.value(false).not(), true));

        $(assert.equal(East.value(true).bitAnd(true), true));
        $(assert.equal(East.value(true).bitAnd(false), false));
        $(assert.equal(East.value(false).bitAnd(true), false));
        $(assert.equal(East.value(false).bitAnd(false), false));

        $(assert.equal(East.value(true).bitOr(true), true));
        $(assert.equal(East.value(true).bitOr(false), true));
        $(assert.equal(East.value(false).bitOr(true), true));
        $(assert.equal(East.value(false).bitOr(false), false));

        $(assert.equal(East.value(true).bitXor(true), false));
        $(assert.equal(East.value(true).bitXor(false), true));
        $(assert.equal(East.value(false).bitXor(true), true));
        $(assert.equal(East.value(false).bitXor(false), false));
    });

    test("Printing", $ => {
        $(assert.equal(East.print(East.value(true)), "true"));
        $(assert.equal(East.print(East.value(false)), "false"));
    });

    test("Comparisons", $ => {
        // Equality tests
        $(assert.equal(East.value(true), true));
        $(assert.equal(East.value(false), false));
        $(assert.notEqual(East.value(true), false));
        $(assert.notEqual(East.value(false), true));

        // Ordering tests - false < true in most boolean orderings
        $(assert.less(East.value(false), true));
        $(assert.greater(East.value(true), false));
        $(assert.lessEqual(East.value(false), false));
        $(assert.lessEqual(East.value(false), true));
        $(assert.lessEqual(East.value(true), true));
        $(assert.greaterEqual(East.value(true), true));
        $(assert.greaterEqual(East.value(true), false));
        $(assert.greaterEqual(East.value(false), false));

        // East.is, East.equal, East.less methods
        $(assert.equal(East.is(East.value(true), true), true));
        $(assert.equal(East.is(East.value(false), false), true));
        $(assert.equal(East.is(East.value(true), false), false));
        $(assert.equal(East.equal(East.value(true), true), true));
        $(assert.equal(East.equal(East.value(false), false), true));
        $(assert.equal(East.notEqual(East.value(true), false), true));
        $(assert.equal(East.less(East.value(false), true), true));
        $(assert.equal(East.less(East.value(true), false), false));
        $(assert.equal(East.lessEqual(East.value(false), true), true));
        $(assert.equal(East.lessEqual(East.value(true), true), true));
        $(assert.equal(East.greater(East.value(true), false), true));
        $(assert.equal(East.greaterEqual(East.value(true), false), true));
    });

    test("Parsing", $ => {
        $(assert.equal(East.value("true").parse(BooleanType), true));
        $(assert.equal(East.value("false").parse(BooleanType), false));
        $(assert.throws(East.value("maybe").parse(BooleanType)));
    });
});
