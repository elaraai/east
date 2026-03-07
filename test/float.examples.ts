/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import { East, FloatType, IntegerType, BooleanType, StringType, example } from "@elaraai/east";

// ---------------------------------------------------------------------------
// Arithmetic
// ---------------------------------------------------------------------------

export const floatNegate = example({
    keywords: ["float", "FloatType", "negate", "negative", "arithmetic"],
    description: "Negate a float value",
    fn: East.function([], FloatType, ($) => {
        const x = $.const(10.0, FloatType);
        return x.negate();
    }),
    inputs: [],
    returns: -10.0,
});

export const floatAdd = example({
    keywords: ["float", "FloatType", "add", "addition", "arithmetic"],
    description: "Add two float values",
    fn: East.function([], FloatType, ($) => {
        const x = $.const(10.0, FloatType);
        return x.add(5.0);
    }),
    inputs: [],
    returns: 15.0,
});

export const floatSubtract = example({
    keywords: ["float", "FloatType", "subtract", "subtraction", "arithmetic"],
    description: "Subtract two float values",
    fn: East.function([], FloatType, ($) => {
        const x = $.const(10.0, FloatType);
        return x.subtract(5.0);
    }),
    inputs: [],
    returns: 5.0,
});

export const floatMultiply = example({
    keywords: ["float", "FloatType", "multiply", "multiplication", "arithmetic"],
    description: "Multiply two float values",
    fn: East.function([], FloatType, ($) => {
        const x = $.const(10.0, FloatType);
        return x.multiply(5.0);
    }),
    inputs: [],
    returns: 50.0,
});

export const floatDivide = example({
    keywords: ["float", "FloatType", "divide", "division", "arithmetic"],
    description: "Divide two float values",
    fn: East.function([], FloatType, ($) => {
        const x = $.const(10.0, FloatType);
        return x.divide(5.0);
    }),
    inputs: [],
    returns: 2.0,
});

export const floatRemainder = example({
    keywords: ["float", "FloatType", "remainder", "modulo", "arithmetic"],
    description: "Get the remainder of float division",
    fn: East.function([], FloatType, ($) => {
        const x = $.const(10.0, FloatType);
        return x.remainder(3.0);
    }),
    inputs: [],
    returns: 1.0,
});

export const floatPow = example({
    keywords: ["float", "FloatType", "pow", "power", "exponent", "arithmetic"],
    description: "Raise a float to a power",
    fn: East.function([], FloatType, ($) => {
        const x = $.const(2.0, FloatType);
        return x.pow(10.0);
    }),
    inputs: [],
    returns: 1024.0,
});

// ---------------------------------------------------------------------------
// Mixed Integer/Float Arithmetic
// ---------------------------------------------------------------------------

export const floatMixedAdd = example({
    keywords: ["float", "FloatType", "add", "integer", "mixed", "arithmetic"],
    description: "Add a float and an integer (mixed arithmetic)",
    fn: East.function([], FloatType, ($) => {
        const x = $.const(10.0, FloatType);
        return x.add(5n);
    }),
    inputs: [],
    returns: 15.0,
});

// ---------------------------------------------------------------------------
// Printing and Parsing
// ---------------------------------------------------------------------------

export const floatPrint = example({
    keywords: ["float", "FloatType", "print", "string", "display"],
    description: "Print a float as a string",
    fn: East.function([], StringType, ($) => {
        const x = $.const(1234.0, FloatType);
        return East.print(x);
    }),
    inputs: [],
    returns: "1234.0",
});

export const floatParse = example({
    keywords: ["float", "FloatType", "parse", "string", "convert"],
    description: "Parse a string into a float",
    fn: East.function([], FloatType, ($) => {
        const s = $.const("3.14159");
        return s.parse(FloatType);
    }),
    inputs: [],
    returns: 3.14159,
});

// ---------------------------------------------------------------------------
// Comparisons (Instance Methods)
// ---------------------------------------------------------------------------

export const floatEquals = example({
    keywords: ["float", "FloatType", "equals", "equality", "comparison"],
    description: "Check float equality with equals",
    fn: East.function([], BooleanType, ($) => {
        const x = $.const(10.0, FloatType);
        return x.equals(10.0);
    }),
    inputs: [],
    returns: true,
});

export const floatNotEquals = example({
    keywords: ["float", "FloatType", "notEquals", "inequality", "comparison"],
    description: "Check float inequality with notEquals",
    fn: East.function([], BooleanType, ($) => {
        const x = $.const(10.0, FloatType);
        return x.notEquals(5.0);
    }),
    inputs: [],
    returns: true,
});

export const floatLessThan = example({
    keywords: ["float", "FloatType", "lessThan", "comparison", "ordering"],
    description: "Check if a float is less than another",
    fn: East.function([], BooleanType, ($) => {
        const x = $.const(5.0, FloatType);
        return x.lessThan(10.0);
    }),
    inputs: [],
    returns: true,
});

export const floatLessThanOrEqual = example({
    keywords: ["float", "FloatType", "lessThanOrEqual", "comparison", "ordering"],
    description: "Check if a float is less than or equal to another",
    fn: East.function([], BooleanType, ($) => {
        const x = $.const(10.0, FloatType);
        return x.lessThanOrEqual(10.0);
    }),
    inputs: [],
    returns: true,
});

export const floatGreaterThan = example({
    keywords: ["float", "FloatType", "greaterThan", "comparison", "ordering"],
    description: "Check if a float is greater than another",
    fn: East.function([], BooleanType, ($) => {
        const x = $.const(10.0, FloatType);
        return x.greaterThan(5.0);
    }),
    inputs: [],
    returns: true,
});

export const floatGreaterThanOrEqual = example({
    keywords: ["float", "FloatType", "greaterThanOrEqual", "comparison", "ordering"],
    description: "Check if a float is greater than or equal to another",
    fn: East.function([], BooleanType, ($) => {
        const x = $.const(10.0, FloatType);
        return x.greaterThanOrEqual(10.0);
    }),
    inputs: [],
    returns: true,
});

// ---------------------------------------------------------------------------
// Mathematical Functions
// ---------------------------------------------------------------------------

export const floatAbs = example({
    keywords: ["float", "FloatType", "abs", "absolute", "math"],
    description: "Get the absolute value of a float",
    fn: East.function([], FloatType, ($) => {
        const x = $.const(-5.0, FloatType);
        return x.abs();
    }),
    inputs: [],
    returns: 5.0,
});

export const floatSign = example({
    keywords: ["float", "FloatType", "sign", "signum", "math"],
    description: "Get the sign of a float (-1, 0, or 1)",
    fn: East.function([], FloatType, ($) => {
        const x = $.const(-5.0, FloatType);
        return x.sign();
    }),
    inputs: [],
    returns: -1.0,
});

export const floatSqrt = example({
    keywords: ["float", "FloatType", "sqrt", "squareRoot", "math"],
    description: "Compute the square root of a float",
    fn: East.function([], FloatType, ($) => {
        const x = $.const(4.0, FloatType);
        return x.sqrt();
    }),
    inputs: [],
    returns: 2.0,
});

export const floatLog = example({
    keywords: ["float", "FloatType", "log", "naturalLog", "math"],
    description: "Compute the natural logarithm of a float",
    fn: East.function([], FloatType, ($) => {
        const x = $.const(1.0, FloatType);
        return x.log();
    }),
    inputs: [],
    returns: 0.0,
});

export const floatExp = example({
    keywords: ["float", "FloatType", "exp", "exponential", "math"],
    description: "Compute e raised to the power of a float",
    fn: East.function([], FloatType, ($) => {
        const x = $.const(0.0, FloatType);
        return x.exp();
    }),
    inputs: [],
    returns: 1.0,
});

export const floatSin = example({
    keywords: ["float", "FloatType", "sin", "sine", "trigonometry", "math"],
    description: "Compute the sine of a float (radians)",
    fn: East.function([], FloatType, ($) => {
        const x = $.const(0.0, FloatType);
        return x.sin();
    }),
    inputs: [],
    returns: 0.0,
});

export const floatCos = example({
    keywords: ["float", "FloatType", "cos", "cosine", "trigonometry", "math"],
    description: "Compute the cosine of a float (radians)",
    fn: East.function([], FloatType, ($) => {
        const x = $.const(0.0, FloatType);
        return x.cos();
    }),
    inputs: [],
    returns: 1.0,
});

export const floatTan = example({
    keywords: ["float", "FloatType", "tan", "tangent", "trigonometry", "math"],
    description: "Compute the tangent of a float (radians)",
    fn: East.function([], FloatType, ($) => {
        const x = $.const(0.0, FloatType);
        return x.tan();
    }),
    inputs: [],
    returns: 0.0,
});

// ---------------------------------------------------------------------------
// Float to Integer Conversion
// ---------------------------------------------------------------------------

export const floatToInteger = example({
    keywords: ["float", "FloatType", "toInteger", "convert", "integer"],
    description: "Convert a whole float to an integer",
    fn: East.function([], IntegerType, ($) => {
        const x = $.const(42.0, FloatType);
        return x.toInteger();
    }),
    inputs: [],
    returns: 42n,
});

// ---------------------------------------------------------------------------
// approxEqual
// ---------------------------------------------------------------------------

export const floatApproxEqual = example({
    keywords: ["float", "FloatType", "approxEqual", "approximate", "tolerance"],
    description: "Check if two floats are approximately equal within a tolerance",
    fn: East.function([], BooleanType, ($) => {
        return East.Float.approxEqual(1.0, 1.0001, 0.001);
    }),
    inputs: [],
    returns: true,
});

// ---------------------------------------------------------------------------
// Rounding to Integer
// ---------------------------------------------------------------------------

export const floatRoundFloor = example({
    keywords: ["float", "FloatType", "roundFloor", "floor", "rounding"],
    description: "Round a float down to the nearest integer (floor)",
    fn: East.function([], IntegerType, ($) => {
        return East.Float.roundFloor(3.7);
    }),
    inputs: [],
    returns: 3n,
});

export const floatRoundCeil = example({
    keywords: ["float", "FloatType", "roundCeil", "ceiling", "rounding"],
    description: "Round a float up to the nearest integer (ceiling)",
    fn: East.function([], IntegerType, ($) => {
        return East.Float.roundCeil(3.2);
    }),
    inputs: [],
    returns: 4n,
});

export const floatRoundHalf = example({
    keywords: ["float", "FloatType", "roundHalf", "round", "rounding"],
    description: "Round a float to the nearest integer (half rounds away from zero)",
    fn: East.function([], IntegerType, ($) => {
        return East.Float.roundHalf(3.5);
    }),
    inputs: [],
    returns: 4n,
});

export const floatRoundTrunc = example({
    keywords: ["float", "FloatType", "roundTrunc", "truncate", "rounding"],
    description: "Truncate a float toward zero to the nearest integer",
    fn: East.function([], IntegerType, ($) => {
        return East.Float.roundTrunc(-3.7);
    }),
    inputs: [],
    returns: -3n,
});

// ---------------------------------------------------------------------------
// Step-Based Rounding (Float → Float)
// ---------------------------------------------------------------------------

export const floatRoundNearest = example({
    keywords: ["float", "FloatType", "roundNearest", "round", "step"],
    description: "Round a float to the nearest multiple of a step",
    fn: East.function([], FloatType, ($) => {
        return East.Float.roundNearest(12.0, 5.0);
    }),
    inputs: [],
    returns: 10.0,
});

export const floatRoundUp = example({
    keywords: ["float", "FloatType", "roundUp", "ceiling", "step"],
    description: "Round a float up to the next multiple of a step",
    fn: East.function([], FloatType, ($) => {
        return East.Float.roundUp(12.0, 5.0);
    }),
    inputs: [],
    returns: 15.0,
});

export const floatRoundDown = example({
    keywords: ["float", "FloatType", "roundDown", "floor", "step"],
    description: "Round a float down to the previous multiple of a step",
    fn: East.function([], FloatType, ($) => {
        return East.Float.roundDown(12.0, 5.0);
    }),
    inputs: [],
    returns: 10.0,
});

export const floatRoundTruncate = example({
    keywords: ["float", "FloatType", "roundTruncate", "truncate", "step"],
    description: "Truncate a float toward zero to the nearest multiple of a step",
    fn: East.function([], FloatType, ($) => {
        return East.Float.roundTruncate(-12.0, 5.0);
    }),
    inputs: [],
    returns: -10.0,
});

export const floatRoundToDecimals = example({
    keywords: ["float", "FloatType", "roundToDecimals", "decimals", "precision"],
    description: "Round a float to a specific number of decimal places",
    fn: East.function([], FloatType, ($) => {
        return East.Float.roundToDecimals(3.14159, 2n);
    }),
    inputs: [],
    returns: 3.14,
});

// ---------------------------------------------------------------------------
// Formatted Printing
// ---------------------------------------------------------------------------

export const floatPrintCommaSeperated = example({
    keywords: ["float", "FloatType", "printCommaSeperated", "format", "comma"],
    description: "Format a float with comma separators and fixed decimals",
    fn: East.function([], StringType, ($) => {
        return East.Float.printCommaSeperated(1234.56, 2n);
    }),
    inputs: [],
    returns: "1,234.56",
});

export const floatPrintCurrency = example({
    keywords: ["float", "FloatType", "printCurrency", "format", "dollar"],
    description: "Format a float as a currency string",
    fn: East.function([], StringType, ($) => {
        return East.Float.printCurrency(1234.56);
    }),
    inputs: [],
    returns: "$1,234.56",
});

export const floatPrintFixed = example({
    keywords: ["float", "FloatType", "printFixed", "format", "decimals"],
    description: "Format a float with a fixed number of decimal places",
    fn: East.function([], StringType, ($) => {
        return East.Float.printFixed(3.14159, 2n);
    }),
    inputs: [],
    returns: "3.14",
});

export const floatPrintCompact = example({
    keywords: ["float", "FloatType", "printCompact", "format", "abbreviation"],
    description: "Format a float in compact notation (K, M, B)",
    fn: East.function([], StringType, ($) => {
        return East.Float.printCompact(1500000.0);
    }),
    inputs: [],
    returns: "1.5M",
});

export const floatPrintPercentage = example({
    keywords: ["float", "FloatType", "printPercentage", "format", "percent"],
    description: "Format a float as a percentage string",
    fn: East.function([], StringType, ($) => {
        return East.Float.printPercentage(0.1234, 2n);
    }),
    inputs: [],
    returns: "12.34%",
});

