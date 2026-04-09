/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import { East, IntegerType, StringType, FunctionType } from "../src/index.js";
import { describeEast, assertEast } from "./platforms.spec.js";
import { toEastTypeValue } from "../src/type_of_type.js";
import { variant } from "../src/containers/variant.js";
import type { IR } from "../src/ir.js";

const assert = assertEast;

// Create symbol IR definitions for the test suite.
// These are IR values — they represent pre-compiled module symbols
// that a runtime would provide to the compiler.

function makeValueIR(value: null | boolean | bigint | number | string, type: any): IR {
    return variant("Value", {
        type: toEastTypeValue(type),
        location: [],
        value: variant(type.type, value),
    });
}

function makeFunctionIR(fn: any): IR {
    return fn.toIR().ir;
}

const addFn = East.function([IntegerType, IntegerType], IntegerType, ($, a, b) => a.add(b));
const mulFn = East.function([IntegerType, IntegerType], IntegerType, ($, a, b) => a.multiply(b));
const greetFn = East.function([StringType], StringType, ($, name) => East.str`Hello, ${name}!`);

// Symbol names must match what East.extern produces (using printIdentifier for each segment)
const symbolIRs = new Map<string, IR>([
    ["math.pi", makeValueIR(314n, IntegerType)],
    ["math.add", makeFunctionIR(addFn)],
    ["math.multiply", makeFunctionIR(mulFn)],
    ["greet.hello", makeFunctionIR(greetFn)],
]);

await describeEast("Module", (test) => {
    test("symbol resolves to a constant value", $ => {
        const pi = East.extern("math", "pi", IntegerType);
        $(assert.equal(pi, 314n));
    });

    test("symbol resolves to a function and can be called", $ => {
        const add = East.extern("math", "add", FunctionType([IntegerType, IntegerType], IntegerType));
        $(assert.equal(add(3n, 4n), 7n));
    });

    test("multiple symbols can be used together", $ => {
        const add = East.extern("math", "add", FunctionType([IntegerType, IntegerType], IntegerType));
        const mul = East.extern("math", "multiply", FunctionType([IntegerType, IntegerType], IntegerType));
        const pi = East.extern("math", "pi", IntegerType);
        // (3 + 4) * pi = 7 * 314 = 2198
        $(assert.equal(mul(add(3n, 4n), pi), 2198n));
    });

    test("symbol function with string type works", $ => {
        const hello = East.extern("greet", "hello", FunctionType([StringType], StringType));
        $(assert.equal(hello("World"), "Hello, World!"));
    });

    test("symbol used in nested function body", $ => {
        const add = East.extern("math", "add", FunctionType([IntegerType, IntegerType], IntegerType));
        const adder = $.const(East.function([IntegerType], IntegerType, ($, x) => add(x, 10n)));
        $(assert.equal(adder(5n), 15n));
    });

    test("missing symbol throws at runtime", $ => {
        const missing = East.extern("missing", "value", IntegerType);
        $(assert.throws(missing));
    });
}, symbolIRs);
