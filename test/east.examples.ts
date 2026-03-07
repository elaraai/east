/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import { East, IntegerType, StringType, BooleanType, ArrayType, StructType, OptionType, some, example } from "@elaraai/east";

// ---------------------------------------------------------------------------
// East.value()
// ---------------------------------------------------------------------------

export const eastValue = example({
    keywords: ["East", "value", "create", "literal"],
    description: "Create an East value from a JavaScript literal",
    fn: East.function([], IntegerType, ($) => {
        return $.const(42n, IntegerType);
    }),
    inputs: [],
    returns: 42n,
});

export const eastValueWithType = example({
    keywords: ["East", "value", "type", "typed", "variant"],
    description: "Create an East value with an explicit type annotation",
    fn: East.function([], BooleanType, ($) => {
        const v = $.const(some(5n), OptionType(IntegerType));
        return East.equal(v, some(5n));
    }),
    inputs: [],
    returns: true,
});

// ---------------------------------------------------------------------------
// East.function()
// ---------------------------------------------------------------------------

export const eastFunction = example({
    keywords: ["East", "function", "call", "define"],
    description: "Define and call an East function with arguments",
    fn: East.function([], IntegerType, ($) => {
        const add = $.const(East.function([IntegerType, IntegerType], IntegerType, ($, x, y) => {
            return x.add(y);
        }));
        return add(5n, 10n);
    }),
    inputs: [],
    returns: 15n,
});

// ---------------------------------------------------------------------------
// East.str
// ---------------------------------------------------------------------------

export const eastStr = example({
    keywords: ["East", "str", "string", "interpolation", "template"],
    description: "Build a string using East.str template literal interpolation",
    fn: East.function([], StringType, ($) => {
        const x = $.const(42n, IntegerType);
        return East.str`The answer is ${x}`;
    }),
    inputs: [],
    returns: "The answer is 42",
});

export const eastStrMultiple = example({
    keywords: ["East", "str", "string", "interpolation", "multiple"],
    description: "Interpolate multiple values into a string template",
    fn: East.function([], StringType, ($) => {
        const x = $.const(5n, IntegerType);
        const y = $.const(10n, IntegerType);
        return East.str`${x} + ${y} = ${x.add(y)}`;
    }),
    inputs: [],
    returns: "5 + 10 = 15",
});

// ---------------------------------------------------------------------------
// East.is() — identity semantics for mutable types
// ---------------------------------------------------------------------------

export const eastIsIdentity = example({
    keywords: ["East", "is", "identity", "mutable", "array", "reference"],
    description: "East.is() returns false for distinct mutable objects with same values",
    fn: East.function([], BooleanType, ($) => {
        const a = $.let([1n, 2n, 3n], ArrayType(IntegerType));
        const b = $.let([1n, 2n, 3n], ArrayType(IntegerType));
        return East.is(a, b);
    }),
    inputs: [],
    returns: false,
});

// ---------------------------------------------------------------------------
// East.print() — variant and alias printing (unique to east.spec)
// ---------------------------------------------------------------------------

export const eastPrintVariant = example({
    keywords: ["East", "print", "variant", "display", "option"],
    description: "Print a variant value as a string",
    fn: East.function([], StringType, ($) => {
        const v = $.const(some(42n), OptionType(IntegerType));
        return East.print(v);
    }),
    inputs: [],
    returns: ".some 42",
});

export const eastPrintAlias = example({
    keywords: ["East", "print", "alias", "shared", "reference", "mutable"],
    description: "Print shared mutable references with alias notation",
    fn: East.function([], StringType, ($) => {
        const shared = $.let([1n, 2n, 3n], ArrayType(IntegerType));
        const s = $.let({ a: shared, b: shared }, StructType({ a: ArrayType(IntegerType), b: ArrayType(IntegerType) }));
        return East.print(s);
    }),
    inputs: [],
    returns: "(a=[1, 2, 3], b=1#.a)",
});
