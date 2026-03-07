/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import { East, ArrayType, IntegerType, StringType, BooleanType, example } from "@elaraai/east";

// ---------------------------------------------------------------------------
// Printing and Parsing
// ---------------------------------------------------------------------------

export const stringPrint = example({
    keywords: ["string", "StringType", "print", "display", "serialize"],
    description: "Print a value as its East text representation",
    fn: East.function([], StringType, ($) => {
        const v = $.const(42n);
        return East.print(v);
    }),
    inputs: [],
    returns: "42",
});

export const stringParse = example({
    keywords: ["string", "StringType", "parse", "deserialize", "text"],
    description: "Parse a string into a typed value using East text format",
    fn: East.function([], IntegerType, ($) => {
        const s = $.const("42");
        return s.parse(IntegerType);
    }),
    inputs: [],
    returns: 42n,
});

export const stringPrintJson = example({
    keywords: ["string", "StringType", "printJson", "JSON", "serialize"],
    description: "Print a value as its JSON representation",
    fn: East.function([], StringType, ($) => {
        const v = $.const({ name: "Alice", age: 30n });
        return East.String.printJson(v);
    }),
    inputs: [],
    returns: '{"name":"Alice","age":"30"}',
});

export const stringParseJson = example({
    keywords: ["string", "StringType", "parseJson", "JSON", "deserialize"],
    description: "Parse a JSON string into a typed value",
    fn: East.function([], IntegerType, ($) => {
        const s = $.const('"42"');
        return s.parseJson(IntegerType);
    }),
    inputs: [],
    returns: 42n,
});

// ---------------------------------------------------------------------------
// String Length
// ---------------------------------------------------------------------------

export const stringLength = example({
    keywords: ["string", "StringType", "length", "size", "count"],
    description: "Get the length of a string in codepoints",
    fn: East.function([], IntegerType, ($) => {
        const s = $.const("hello");
        return s.length();
    }),
    inputs: [],
    returns: 5n,
});

// ---------------------------------------------------------------------------
// Substring
// ---------------------------------------------------------------------------

export const stringSubstring = example({
    keywords: ["string", "StringType", "substring", "slice", "extract"],
    description: "Extract a substring by start and end codepoint indices",
    fn: East.function([], StringType, ($) => {
        const s = $.const("hello");
        return s.substring(1n, 4n);
    }),
    inputs: [],
    returns: "ell",
});

// ---------------------------------------------------------------------------
// Case Conversion
// ---------------------------------------------------------------------------

export const stringUpperCase = example({
    keywords: ["string", "StringType", "upperCase", "case", "uppercase"],
    description: "Convert a string to upper case",
    fn: East.function([], StringType, ($) => {
        const s = $.const("hello");
        return s.upperCase();
    }),
    inputs: [],
    returns: "HELLO",
});

export const stringLowerCase = example({
    keywords: ["string", "StringType", "lowerCase", "case", "lowercase"],
    description: "Convert a string to lower case",
    fn: East.function([], StringType, ($) => {
        const s = $.const("WORLD");
        return s.lowerCase();
    }),
    inputs: [],
    returns: "world",
});

// ---------------------------------------------------------------------------
// Split
// ---------------------------------------------------------------------------

export const stringSplit = example({
    keywords: ["string", "StringType", "split", "tokenize", "delimiter"],
    description: "Split a string by a delimiter into an array",
    fn: East.function([], ArrayType(StringType), ($) => {
        const s = $.const("a,b,c");
        return s.split(",");
    }),
    inputs: [],
    returns: ["a", "b", "c"],
});

// ---------------------------------------------------------------------------
// Trim
// ---------------------------------------------------------------------------

export const stringTrim = example({
    keywords: ["string", "StringType", "trim", "whitespace", "strip"],
    description: "Trim whitespace from both ends of a string",
    fn: East.function([], StringType, ($) => {
        const s = $.const("  hello  ");
        return s.trim();
    }),
    inputs: [],
    returns: "hello",
});

export const stringTrimStart = example({
    keywords: ["string", "StringType", "trimStart", "whitespace", "leading"],
    description: "Trim whitespace from the start of a string",
    fn: East.function([], StringType, ($) => {
        const s = $.const("  hello  ");
        return s.trimStart();
    }),
    inputs: [],
    returns: "hello  ",
});

export const stringTrimEnd = example({
    keywords: ["string", "StringType", "trimEnd", "whitespace", "trailing"],
    description: "Trim whitespace from the end of a string",
    fn: East.function([], StringType, ($) => {
        const s = $.const("  hello  ");
        return s.trimEnd();
    }),
    inputs: [],
    returns: "  hello",
});

// ---------------------------------------------------------------------------
// Starts/Ends With
// ---------------------------------------------------------------------------

export const stringStartsWith = example({
    keywords: ["string", "StringType", "startsWith", "prefix", "check"],
    description: "Check if a string starts with a given prefix",
    fn: East.function([], BooleanType, ($) => {
        const s = $.const("hello world");
        return s.startsWith("hello");
    }),
    inputs: [],
    returns: true,
});

export const stringEndsWith = example({
    keywords: ["string", "StringType", "endsWith", "suffix", "check"],
    description: "Check if a string ends with a given suffix",
    fn: East.function([], BooleanType, ($) => {
        const s = $.const("hello world");
        return s.endsWith("world");
    }),
    inputs: [],
    returns: true,
});

// ---------------------------------------------------------------------------
// Contains
// ---------------------------------------------------------------------------

export const stringContains = example({
    keywords: ["string", "StringType", "contains", "search", "includes"],
    description: "Check if a string contains a substring",
    fn: East.function([], BooleanType, ($) => {
        const s = $.const("hello world");
        return s.contains("lo wo");
    }),
    inputs: [],
    returns: true,
});

export const stringContainsRegex = example({
    keywords: ["string", "StringType", "contains", "regex", "pattern"],
    description: "Check if a string matches a regex pattern",
    fn: East.function([], BooleanType, ($) => {
        const s = $.const("test123");
        return s.contains(/\d+/);
    }),
    inputs: [],
    returns: true,
});

// ---------------------------------------------------------------------------
// IndexOf
// ---------------------------------------------------------------------------

export const stringIndexOf = example({
    keywords: ["string", "StringType", "indexOf", "search", "position"],
    description: "Find the codepoint index of the first occurrence of a substring",
    fn: East.function([], IntegerType, ($) => {
        const s = $.const("hello world");
        return s.indexOf("world");
    }),
    inputs: [],
    returns: 6n,
});

export const stringIndexOfRegex = example({
    keywords: ["string", "StringType", "indexOf", "regex", "position"],
    description: "Find the codepoint index of the first regex match",
    fn: East.function([], IntegerType, ($) => {
        const s = $.const("test123abc");
        return s.indexOf(/\d+/);
    }),
    inputs: [],
    returns: 4n,
});

// ---------------------------------------------------------------------------
// Replace
// ---------------------------------------------------------------------------

export const stringReplace = example({
    keywords: ["string", "StringType", "replace", "substitution", "string"],
    description: "Replace all occurrences of a substring",
    fn: East.function([], StringType, ($) => {
        const s = $.const("hello hello");
        return s.replace("hello", "hi");
    }),
    inputs: [],
    returns: "hi hi",
});

export const stringReplaceRegex = example({
    keywords: ["string", "StringType", "replace", "regex", "pattern"],
    description: "Replace all regex matches in a string",
    fn: East.function([], StringType, ($) => {
        const s = $.const("hello123world456");
        return s.replace(/\d+/g, "X");
    }),
    inputs: [],
    returns: "helloXworldX",
});

// ---------------------------------------------------------------------------
// Comparisons
// ---------------------------------------------------------------------------

export const stringEquals = example({
    keywords: ["string", "StringType", "equals", "equality", "comparison"],
    description: "Check string equality with equals",
    fn: East.function([], BooleanType, ($) => {
        const s = $.const("hello");
        return s.equals("hello");
    }),
    inputs: [],
    returns: true,
});

export const stringNotEquals = example({
    keywords: ["string", "StringType", "notEquals", "inequality", "comparison"],
    description: "Check string inequality with notEquals",
    fn: East.function([], BooleanType, ($) => {
        const s = $.const("hello");
        return s.notEquals("world");
    }),
    inputs: [],
    returns: true,
});

export const stringLessThan = example({
    keywords: ["string", "StringType", "lessThan", "ordering", "comparison"],
    description: "Check if a string is lexically less than another",
    fn: East.function([], BooleanType, ($) => {
        const s = $.const("apple");
        return s.lessThan("banana");
    }),
    inputs: [],
    returns: true,
});

export const stringLessThanOrEqual = example({
    keywords: ["string", "StringType", "lessThanOrEqual", "ordering", "comparison"],
    description: "Check if a string is lexically less than or equal to another",
    fn: East.function([], BooleanType, ($) => {
        const s = $.const("hello");
        return s.lessThanOrEqual("hello");
    }),
    inputs: [],
    returns: true,
});

export const stringGreaterThan = example({
    keywords: ["string", "StringType", "greaterThan", "ordering", "comparison"],
    description: "Check if a string is lexically greater than another",
    fn: East.function([], BooleanType, ($) => {
        const s = $.const("banana");
        return s.greaterThan("apple");
    }),
    inputs: [],
    returns: true,
});

export const stringGreaterThanOrEqual = example({
    keywords: ["string", "StringType", "greaterThanOrEqual", "ordering", "comparison"],
    description: "Check if a string is lexically greater than or equal to another",
    fn: East.function([], BooleanType, ($) => {
        const s = $.const("hello");
        return s.greaterThanOrEqual("hello");
    }),
    inputs: [],
    returns: true,
});

