/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import { East, BooleanType, IntegerType, StringType, example } from "@elaraai/east";

// ---------------------------------------------------------------------------
// Boolean Operations
// ---------------------------------------------------------------------------

export const booleanNot = example({
    keywords: ["boolean", "BooleanType", "not", "negation", "logical"],
    description: "Negate a boolean with not",
    fn: East.function([], BooleanType, ($) => {
        const x = $.const(true, BooleanType);
        return x.not();
    }),
    inputs: [],
    returns: false,
});

export const booleanBitAnd = example({
    keywords: ["boolean", "BooleanType", "bitAnd", "and", "logical"],
    description: "Logical AND with bitAnd",
    fn: East.function([], BooleanType, ($) => {
        const x = $.const(true, BooleanType);
        return x.bitAnd(false);
    }),
    inputs: [],
    returns: false,
});

export const booleanBitOr = example({
    keywords: ["boolean", "BooleanType", "bitOr", "or", "logical"],
    description: "Logical OR with bitOr",
    fn: East.function([], BooleanType, ($) => {
        const x = $.const(false, BooleanType);
        return x.bitOr(true);
    }),
    inputs: [],
    returns: true,
});

export const booleanBitXor = example({
    keywords: ["boolean", "BooleanType", "bitXor", "xor", "logical"],
    description: "Logical XOR with bitXor",
    fn: East.function([], BooleanType, ($) => {
        const x = $.const(true, BooleanType);
        return x.bitXor(true);
    }),
    inputs: [],
    returns: false,
});

// ---------------------------------------------------------------------------
// Printing
// ---------------------------------------------------------------------------

export const booleanPrint = example({
    keywords: ["boolean", "BooleanType", "print", "format", "string"],
    description: "Print a boolean value as a string",
    fn: East.function([], StringType, ($) => {
        const x = $.const(true, BooleanType);
        return East.print(x);
    }),
    inputs: [],
    returns: "true",
});

// ---------------------------------------------------------------------------
// Comparisons
// ---------------------------------------------------------------------------

export const booleanEquals = example({
    keywords: ["boolean", "BooleanType", "equals", "equality", "comparison"],
    description: "Check boolean equality with equals",
    fn: East.function([], BooleanType, ($) => {
        const x = $.const(true, BooleanType);
        return x.equals(true);
    }),
    inputs: [],
    returns: true,
});

export const booleanNotEquals = example({
    keywords: ["boolean", "BooleanType", "notEquals", "inequality", "comparison"],
    description: "Check boolean inequality with notEquals",
    fn: East.function([], BooleanType, ($) => {
        const x = $.const(true, BooleanType);
        return x.notEquals(false);
    }),
    inputs: [],
    returns: true,
});

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

export const booleanParse = example({
    keywords: ["boolean", "BooleanType", "parse", "string", "convert"],
    description: "Parse a string into a boolean",
    fn: East.function([], BooleanType, ($) => {
        const s = $.const("true", StringType);
        return s.parse(BooleanType);
    }),
    inputs: [],
    returns: true,
});

// ---------------------------------------------------------------------------
// Short-circuit Operators
// ---------------------------------------------------------------------------

export const booleanAnd = example({
    keywords: ["boolean", "BooleanType", "and", "short-circuit", "lazy"],
    description: "Short-circuit AND with .and()",
    fn: East.function([], BooleanType, ($) => {
        const x = $.const(true, BooleanType);
        return x.and(_$ => false);
    }),
    inputs: [],
    returns: false,
});

export const booleanOr = example({
    keywords: ["boolean", "BooleanType", "or", "short-circuit", "lazy"],
    description: "Short-circuit OR with .or()",
    fn: East.function([], BooleanType, ($) => {
        const x = $.const(false, BooleanType);
        return x.or(_$ => true);
    }),
    inputs: [],
    returns: true,
});

export const booleanAndCapture = example({
    keywords: ["boolean", "BooleanType", "and", "short-circuit", "closure", "capture"],
    description: "Short-circuit AND capturing outer variables",
    fn: East.function([], BooleanType, ($) => {
        const threshold = $.const(5n, IntegerType);
        const value = $.const(3n, IntegerType);
        return East.greater(value, 0n).and(_$ => East.less(value, threshold));
    }),
    inputs: [],
    returns: true,
});

