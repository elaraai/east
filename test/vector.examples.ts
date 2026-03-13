/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import { East, ArrayType, FloatType, IntegerType, example } from "@elaraai/east";

// ---------------------------------------------------------------------------
// Vector Creation
// ---------------------------------------------------------------------------

export const vectorZeros = example({
    keywords: ["vector", "VectorType", "zeros", "create", "float"],
    description: "Create a vector of zeros",
    fn: East.function([], FloatType, ($) => {
        const v = $.let(East.Vector.zeros(3n));
        return v.get(0n);
    }),
    inputs: [],
    returns: 0.0,
});

export const vectorOnes = example({
    keywords: ["vector", "VectorType", "ones", "create", "float"],
    description: "Create a vector of ones",
    fn: East.function([], FloatType, ($) => {
        const v = $.let(East.Vector.ones(3n));
        return v.get(1n);
    }),
    inputs: [],
    returns: 1.0,
});

export const vectorFill = example({
    keywords: ["vector", "VectorType", "fill", "create", "value"],
    description: "Create a vector filled with a specific value",
    fn: East.function([], FloatType, ($) => {
        const v = $.let(East.Vector.fill(4n, 3.14));
        return v.get(0n);
    }),
    inputs: [],
    returns: 3.14,
});

export const vectorFromArray = example({
    keywords: ["vector", "VectorType", "fromArray", "create", "convert"],
    description: "Create a vector from an array",
    fn: East.function([], FloatType, ($) => {
        const v = $.let(East.Vector.fromArray([1.0, 2.0, 3.0]));
        return v.get(2n);
    }),
    inputs: [],
    returns: 3.0,
});

// ---------------------------------------------------------------------------
// Dimensions and Element Access
// ---------------------------------------------------------------------------

export const vectorLength = example({
    keywords: ["vector", "VectorType", "length", "size", "count"],
    description: "Get the length of a vector",
    fn: East.function([], IntegerType, ($) => {
        const v = $.let(East.Vector.fromArray([1.0, 2.0, 3.0]));
        return v.length();
    }),
    inputs: [],
    returns: 3n,
});

export const vectorGet = example({
    keywords: ["vector", "VectorType", "get", "element", "access"],
    description: "Get an element from a vector by index",
    fn: East.function([], FloatType, ($) => {
        const v = $.let(East.Vector.fromArray([10.0, 20.0, 30.0]));
        return v.get(1n);
    }),
    inputs: [],
    returns: 20.0,
});

export const vectorSet = example({
    keywords: ["vector", "VectorType", "set", "element", "mutate"],
    description: "Set an element in a vector by index",
    fn: East.function([], FloatType, ($) => {
        const v = $.let(East.Vector.zeros(3n));
        $(v.set(1n, 42.0));
        return v.get(1n);
    }),
    inputs: [],
    returns: 42.0,
});

// ---------------------------------------------------------------------------
// Slicing and Concatenation
// ---------------------------------------------------------------------------

export const vectorSlice = example({
    keywords: ["vector", "VectorType", "slice", "subvector", "range"],
    description: "Slice a vector to get a sub-range",
    fn: East.function([], FloatType, ($) => {
        const v = $.let(East.Vector.fromArray([1.0, 2.0, 3.0, 4.0, 5.0]));
        const s = $.let(v.slice(1n, 4n));
        return s.get(0n);
    }),
    inputs: [],
    returns: 2.0,
});

export const vectorConcat = example({
    keywords: ["vector", "VectorType", "concat", "join", "combine"],
    description: "Concatenate two vectors",
    fn: East.function([], IntegerType, ($) => {
        const a = $.let(East.Vector.fill(2n, 1.0));
        const b = $.let(East.Vector.fill(3n, 2.0));
        const c = $.let(a.concat(b));
        return c.length();
    }),
    inputs: [],
    returns: 5n,
});

// ---------------------------------------------------------------------------
// Conversion
// ---------------------------------------------------------------------------

export const vectorToArray = example({
    keywords: ["vector", "VectorType", "toArray", "convert", "array"],
    description: "Convert a vector to an array",
    fn: East.function([], ArrayType(FloatType), ($) => {
        const v = $.let(East.Vector.fromArray([1.0, 2.0, 3.0]));
        return v.toArray();
    }),
    inputs: [],
    returns: [1.0, 2.0, 3.0],
});

export const vectorToMatrix = example({
    keywords: ["vector", "VectorType", "toMatrix", "reshape", "matrix"],
    description: "Reshape a vector into a matrix",
    fn: East.function([], IntegerType, ($) => {
        const v = $.let(East.Vector.fromArray([1.0, 2.0, 3.0, 4.0, 5.0, 6.0]));
        const m = $.let(v.toMatrix(2n, 3n));
        return m.rows();
    }),
    inputs: [],
    returns: 2n,
});

// ---------------------------------------------------------------------------
// Map and Reduce
// ---------------------------------------------------------------------------

export const vectorMap = example({
    keywords: ["vector", "VectorType", "map", "transform", "element"],
    description: "Map over vector elements with a transformation function",
    fn: East.function([], FloatType, ($) => {
        const v = $.let(East.Vector.fromArray([1.0, 2.0, 3.0]));
        const doubled = $.let(v.map(($, x) => x.multiply(2.0)));
        return doubled.get(1n);
    }),
    inputs: [],
    returns: 4.0,
});

export const vectorReduce = example({
    keywords: ["vector", "VectorType", "reduce", "fold", "accumulate"],
    description: "Reduce a vector to a single value with an accumulator",
    fn: East.function([], FloatType, ($) => {
        const v = $.let(East.Vector.fromArray([1.0, 2.0, 3.0, 4.0]));
        return v.reduce(($, acc, val) => acc.add(val), 0.0);
    }),
    inputs: [],
    returns: 10.0,
});
