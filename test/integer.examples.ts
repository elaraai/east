/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import { East, IntegerType, FloatType, BooleanType, StringType, example } from "@elaraai/east";

// ---------------------------------------------------------------------------
// Arithmetic
// ---------------------------------------------------------------------------

export const integerNegate = example({
    keywords: ["integer", "IntegerType", "negate", "negation", "unary minus"],
    description: "Negate an integer value",
    fn: East.function([], IntegerType, ($) => {
        const x = $.const(10n, IntegerType);
        return x.negate();
    }),
    inputs: [],
    returns: -10n,
});

export const integerAdd = example({
    keywords: ["integer", "IntegerType", "add", "addition", "sum"],
    description: "Add two integers",
    fn: East.function([], IntegerType, ($) => {
        const x = $.const(10n, IntegerType);
        return x.add(5n);
    }),
    inputs: [],
    returns: 15n,
});

export const integerSubtract = example({
    keywords: ["integer", "IntegerType", "subtract", "subtraction", "difference"],
    description: "Subtract two integers",
    fn: East.function([], IntegerType, ($) => {
        const x = $.const(10n, IntegerType);
        return x.subtract(5n);
    }),
    inputs: [],
    returns: 5n,
});

export const integerMultiply = example({
    keywords: ["integer", "IntegerType", "multiply", "multiplication", "product"],
    description: "Multiply two integers",
    fn: East.function([], IntegerType, ($) => {
        const x = $.const(10n, IntegerType);
        return x.multiply(5n);
    }),
    inputs: [],
    returns: 50n,
});

export const integerDivide = example({
    keywords: ["integer", "IntegerType", "divide", "division", "quotient"],
    description: "Divide two integers (integer division)",
    fn: East.function([], IntegerType, ($) => {
        const x = $.const(10n, IntegerType);
        return x.divide(5n);
    }),
    inputs: [],
    returns: 2n,
});

export const integerRemainder = example({
    keywords: ["integer", "IntegerType", "remainder", "modulo"],
    description: "Get the remainder of integer division",
    fn: East.function([], IntegerType, ($) => {
        const x = $.const(10n, IntegerType);
        return x.remainder(5n);
    }),
    inputs: [],
    returns: 0n,
});

export const integerPow = example({
    keywords: ["integer", "IntegerType", "pow", "power", "exponentiation"],
    description: "Raise an integer to a power",
    fn: East.function([], IntegerType, ($) => {
        const x = $.const(10n, IntegerType);
        return x.pow(5n);
    }),
    inputs: [],
    returns: 100_000n,
});

// ---------------------------------------------------------------------------
// Printing
// ---------------------------------------------------------------------------

export const integerPrint = example({
    keywords: ["integer", "IntegerType", "print", "display", "serialize"],
    description: "Print an integer as a string",
    fn: East.function([], StringType, ($) => {
        const x = $.const(1234n, IntegerType);
        return East.print(x);
    }),
    inputs: [],
    returns: "1234",
});

export const integerPrintCommaSeperated = example({
    keywords: ["integer", "IntegerType", "printCommaSeperated", "comma", "format", "thousands"],
    description: "Print an integer with comma separators",
    fn: East.function([], StringType, ($) => {
        const f = $.const(East.Integer.printCommaSeperated);
        return f(1234567n);
    }),
    inputs: [],
    returns: "1,234,567",
});

export const integerPrintCompact = example({
    keywords: ["integer", "IntegerType", "printCompact", "compact", "abbreviation"],
    description: "Print an integer in compact notation (K, M, B, T)",
    fn: East.function([], StringType, ($) => {
        const f = $.const(East.Integer.printCompact);
        return f(1234567n);
    }),
    inputs: [],
    returns: "1.23M",
});

export const integerPrintCompactSI = example({
    keywords: ["integer", "IntegerType", "printCompactSI", "SI", "metric", "prefix"],
    description: "Print an integer in SI compact notation (k, M, G, T)",
    fn: East.function([], StringType, ($) => {
        const f = $.const(East.Integer.printCompactSI);
        return f(1234567n);
    }),
    inputs: [],
    returns: "1.23M",
});

export const integerPrintCompactComputing = example({
    keywords: ["integer", "IntegerType", "printCompactComputing", "binary", "computing", "IEC"],
    description: "Print an integer in computing compact notation (ki, Mi, Gi, Ti)",
    fn: East.function([], StringType, ($) => {
        const f = $.const(East.Integer.printCompactComputing);
        return f(1234567n);
    }),
    inputs: [],
    returns: "1.17Mi",
});

// ---------------------------------------------------------------------------
// Comparisons
// ---------------------------------------------------------------------------

export const integerEquals = example({
    keywords: ["integer", "IntegerType", "equals", "equality", "comparison"],
    description: "Check integer equality using instance method",
    fn: East.function([], BooleanType, ($) => {
        const x = $.const(10n, IntegerType);
        return x.equals(10n);
    }),
    inputs: [],
    returns: true,
});

export const integerNotEquals = example({
    keywords: ["integer", "IntegerType", "notEquals", "inequality", "comparison"],
    description: "Check integer inequality using instance method",
    fn: East.function([], BooleanType, ($) => {
        const x = $.const(10n, IntegerType);
        return x.notEquals(5n);
    }),
    inputs: [],
    returns: true,
});

export const integerLessThan = example({
    keywords: ["integer", "IntegerType", "lessThan", "less", "comparison"],
    description: "Check if one integer is less than another",
    fn: East.function([], BooleanType, ($) => {
        const x = $.const(5n, IntegerType);
        return x.lessThan(10n);
    }),
    inputs: [],
    returns: true,
});

export const integerLessThanOrEqual = example({
    keywords: ["integer", "IntegerType", "lessThanOrEqual", "comparison"],
    description: "Check if one integer is less than or equal to another",
    fn: East.function([], BooleanType, ($) => {
        const x = $.const(10n, IntegerType);
        return x.lessThanOrEqual(10n);
    }),
    inputs: [],
    returns: true,
});

export const integerGreaterThan = example({
    keywords: ["integer", "IntegerType", "greaterThan", "greater", "comparison"],
    description: "Check if one integer is greater than another",
    fn: East.function([], BooleanType, ($) => {
        const x = $.const(10n, IntegerType);
        return x.greaterThan(5n);
    }),
    inputs: [],
    returns: true,
});

export const integerGreaterThanOrEqual = example({
    keywords: ["integer", "IntegerType", "greaterThanOrEqual", "comparison"],
    description: "Check if one integer is greater than or equal to another",
    fn: East.function([], BooleanType, ($) => {
        const x = $.const(10n, IntegerType);
        return x.greaterThanOrEqual(10n);
    }),
    inputs: [],
    returns: true,
});

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

export const integerParse = example({
    keywords: ["integer", "IntegerType", "parse", "deserialize", "text"],
    description: "Parse a string into an integer",
    fn: East.function([], IntegerType, ($) => {
        const s = $.const("123", StringType);
        return s.parse(IntegerType);
    }),
    inputs: [],
    returns: 123n,
});

// ---------------------------------------------------------------------------
// Mathematical functions
// ---------------------------------------------------------------------------

export const integerAbs = example({
    keywords: ["integer", "IntegerType", "abs", "absolute", "magnitude"],
    description: "Get the absolute value of an integer",
    fn: East.function([], IntegerType, ($) => {
        const x = $.const(-5n, IntegerType);
        return x.abs();
    }),
    inputs: [],
    returns: 5n,
});

export const integerSign = example({
    keywords: ["integer", "IntegerType", "sign", "signum"],
    description: "Get the sign of an integer (-1, 0, or 1)",
    fn: East.function([], IntegerType, ($) => {
        const x = $.const(5n, IntegerType);
        return x.sign();
    }),
    inputs: [],
    returns: 1n,
});

export const integerLog = example({
    keywords: ["integer", "IntegerType", "log", "logarithm"],
    description: "Compute the integer logarithm in a given base",
    fn: East.function([], IntegerType, ($) => {
        const x = $.const(100n, IntegerType);
        return x.log(10n);
    }),
    inputs: [],
    returns: 2n,
});

// ---------------------------------------------------------------------------
// Stdlib functions
// ---------------------------------------------------------------------------

export const integerRoundNearest = example({
    keywords: ["integer", "IntegerType", "roundNearest", "round", "nearest"],
    description: "Round an integer to the nearest multiple of a step",
    fn: East.function([], IntegerType, ($) => {
        const f = $.const(East.Integer.roundNearest);
        return f(127n, 10n);
    }),
    inputs: [],
    returns: 130n,
});

export const integerRoundUp = example({
    keywords: ["integer", "IntegerType", "roundUp", "ceiling", "round"],
    description: "Round an integer up to the next multiple of a step",
    fn: East.function([], IntegerType, ($) => {
        const f = $.const(East.Integer.roundUp);
        return f(123n, 10n);
    }),
    inputs: [],
    returns: 130n,
});

export const integerRoundDown = example({
    keywords: ["integer", "IntegerType", "roundDown", "floor", "round"],
    description: "Round an integer down to the previous multiple of a step",
    fn: East.function([], IntegerType, ($) => {
        const f = $.const(East.Integer.roundDown);
        return f(127n, 10n);
    }),
    inputs: [],
    returns: 120n,
});

export const integerRoundTruncate = example({
    keywords: ["integer", "IntegerType", "roundTruncate", "truncate", "round"],
    description: "Round an integer towards zero to the nearest multiple of a step",
    fn: East.function([], IntegerType, ($) => {
        const f = $.const(East.Integer.roundTruncate);
        return f(127n, 10n);
    }),
    inputs: [],
    returns: 120n,
});

export const integerDigitCount = example({
    keywords: ["integer", "IntegerType", "digitCount", "digits", "length"],
    description: "Count the number of digits in an integer",
    fn: East.function([], IntegerType, ($) => {
        const f = $.const(East.Integer.digitCount);
        return f(123n);
    }),
    inputs: [],
    returns: 3n,
});

export const integerPrintOrdinal = example({
    keywords: ["integer", "IntegerType", "printOrdinal", "ordinal", "suffix"],
    description: "Print an integer with ordinal suffix (1st, 2nd, 3rd, etc.)",
    fn: East.function([], StringType, ($) => {
        const f = $.const(East.Integer.printOrdinal);
        return f(3n);
    }),
    inputs: [],
    returns: "3rd",
});

export const integerPrintPercentage = example({
    keywords: ["integer", "IntegerType", "printPercentage", "percent", "format"],
    description: "Print an integer as a percentage",
    fn: East.function([], StringType, ($) => {
        const f = $.const(East.Integer.printPercentage);
        return f(25n);
    }),
    inputs: [],
    returns: "25%",
});

export const integerPrintCurrency = example({
    keywords: ["integer", "IntegerType", "printCurrency", "currency", "dollar", "money"],
    description: "Print an integer as a currency value",
    fn: East.function([], StringType, () => {
        return East.Integer.printCurrency(1234n);
    }),
    inputs: [],
    returns: "$1,234",
});

// ---------------------------------------------------------------------------
// Min, Max, Clamp
// ---------------------------------------------------------------------------

export const integerMin = example({
    keywords: ["integer", "IntegerType", "min", "minimum"],
    description: "Get the minimum of two integers",
    fn: East.function([], IntegerType, ($) => {
        const x = $.const(5n, IntegerType);
        return East.min(x, 10n);
    }),
    inputs: [],
    returns: 5n,
});

export const integerMax = example({
    keywords: ["integer", "IntegerType", "max", "maximum"],
    description: "Get the maximum of two integers",
    fn: East.function([], IntegerType, ($) => {
        const x = $.const(5n, IntegerType);
        return East.max(x, 10n);
    }),
    inputs: [],
    returns: 10n,
});

export const integerClamp = example({
    keywords: ["integer", "IntegerType", "clamp", "bound", "range"],
    description: "Clamp an integer within a min/max range",
    fn: East.function([], IntegerType, ($) => {
        const x = $.const(15n, IntegerType);
        return East.clamp(x, 1n, 10n);
    }),
    inputs: [],
    returns: 10n,
});

// ---------------------------------------------------------------------------
// Conversion
// ---------------------------------------------------------------------------

export const integerToFloat = example({
    keywords: ["integer", "IntegerType", "toFloat", "conversion", "float"],
    description: "Convert an integer to a float",
    fn: East.function([], FloatType, ($) => {
        const x = $.const(42n, IntegerType);
        return x.toFloat();
    }),
    inputs: [],
    returns: 42.0,
});
