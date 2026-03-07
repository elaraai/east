/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import { East, IntegerType, NullType, StringType, FunctionType, AsyncFunctionType, StructType, ArrayType, BlobType, example } from "@elaraai/east";

// ---------------------------------------------------------------------------
// Basic function features
// ---------------------------------------------------------------------------

export const functionSimpleCall = example({
    keywords: ["function", "East.function", "call", "argument"],
    description: "Create and call a simple function with one argument",
    fn: East.function([], IntegerType, ($) => {
        const addOne = $.const(East.function([IntegerType], IntegerType, ($, x) => {
            return x.add(1n);
        }));
        return addOne(5n);
    }),
    inputs: [],
    returns: 6n,
});

export const functionMultipleArgs = example({
    keywords: ["function", "East.function", "multiple arguments"],
    description: "Create and call a function with multiple arguments",
    fn: East.function([], IntegerType, ($) => {
        const add = $.const(East.function([IntegerType, IntegerType], IntegerType, ($, a, b) => {
            return a.add(b);
        }));
        return add(3n, 4n);
    }),
    inputs: [],
    returns: 7n,
});

export const functionNoArgs = example({
    keywords: ["function", "East.function", "no arguments", "zero-arg"],
    description: "Create and call a function with no arguments",
    fn: East.function([], IntegerType, ($) => {
        const getFortyTwo = $.const(East.function([], IntegerType, _$ => {
            return 42n;
        }));
        return getFortyTwo();
    }),
    inputs: [],
    returns: 42n,
});

export const functionReturningNull = example({
    keywords: ["function", "East.function", "NullType", "null", "void"],
    description: "Create a function that returns null",
    fn: East.function([], NullType, ($) => {
        const doNothing = $.const(East.function([], NullType, _$ => {
            return null;
        }));
        $(doNothing());
    }),
    inputs: [],
});

export const functionStoredInVariable = example({
    keywords: ["function", "East.function", "variable", "$.const"],
    description: "Store a function in a variable and call it",
    fn: East.function([], IntegerType, ($) => {
        const fn = $.const(East.function([IntegerType], IntegerType, ($, x) => {
            return x.multiply(2n);
        }));
        return fn(10n);
    }),
    inputs: [],
    returns: 20n,
});

export const functionHigherOrder = example({
    keywords: ["function", "FunctionType", "higher-order", "callback"],
    description: "Pass a function as an argument to another function",
    fn: East.function([], IntegerType, ($) => {
        const apply = $.const(East.function(
            [FunctionType([IntegerType], IntegerType), IntegerType],
            IntegerType,
            ($, f, x) => {
                return f(x);
            }
        ));
        const double = $.const(East.function([IntegerType], IntegerType, ($, x) => x.multiply(2n)));
        return apply(double, 5n);
    }),
    inputs: [],
    returns: 10n,
});

export const functionReturningFunction = example({
    keywords: ["function", "FunctionType", "currying", "returning function"],
    description: "Return a function from another function (currying)",
    fn: East.function([], IntegerType, ($) => {
        const makeAdder = $.const(East.function([IntegerType], FunctionType([IntegerType], IntegerType), ($, n) => {
            return East.function([IntegerType], IntegerType, ($, x) => x.add(n));
        }));
        const addFive = $.let(makeAdder(5n));
        return addFive(10n);
    }),
    inputs: [],
    returns: 15n,
});

export const functionNestedCalls = example({
    keywords: ["function", "East.function", "nested", "composition"],
    description: "Compose nested function calls",
    fn: East.function([], IntegerType, ($) => {
        const square = $.const(East.function([IntegerType], IntegerType, ($, x) => x.multiply(x)));
        const double = $.const(East.function([IntegerType], IntegerType, ($, x) => x.multiply(2n)));
        return double(square(3n));
    }),
    inputs: [],
    returns: 18n,
});

export const functionEarlyReturn = example({
    keywords: ["function", "East.function", "early return", "$.return", "conditional"],
    description: "Function with early return using $.if and $.return",
    fn: East.function([], IntegerType, ($) => {
        const absValue = $.const(East.function([IntegerType], IntegerType, ($, x) => {
            $.if(East.less(x, 0n), $ => {
                $.return(x.negate());
            });
            return x;
        }));
        return absValue(-5n);
    }),
    inputs: [],
    returns: 5n,
});

export const functionClosure = example({
    keywords: ["function", "East.function", "closure", "capture", "outer variable"],
    description: "Create a closure that captures an outer variable",
    fn: East.function([], IntegerType, ($) => {
        const multiplier = $.const(3n, IntegerType);
        const multiplyByThree = $.const(East.function([IntegerType], IntegerType, ($, x) => {
            return x.multiply(multiplier);
        }));
        return multiplyByThree(4n);
    }),
    inputs: [],
    returns: 12n,
});

export const functionClosureMultipleCaptures = example({
    keywords: ["function", "East.function", "closure", "multiple captures"],
    description: "Create a closure that captures multiple outer variables",
    fn: East.function([], IntegerType, ($) => {
        const offset = $.const(100n, IntegerType);
        const multiplier = $.const(3n, IntegerType);
        const divisor = $.const(2n, IntegerType);
        const transform = $.const(East.function([IntegerType], IntegerType, ($, x) => {
            const scaled = $.let(x.multiply(multiplier));
            const shifted = $.let(scaled.add(offset));
            return shifted.divide(divisor);
        }));
        return transform(10n);
    }),
    inputs: [],
    returns: 65n,
});

export const functionStringArg = example({
    keywords: ["function", "East.function", "string", "StringType"],
    description: "Create a function with string argument and return",
    fn: East.function([], StringType, ($) => {
        const greet = $.const(East.function([StringType], StringType, ($, name) => {
            return East.str`Hello, ${name}!`;
        }));
        return greet("World");
    }),
    inputs: [],
    returns: "Hello, World!",
});

export const functionInStruct = example({
    keywords: ["function", "FunctionType", "struct", "StructType", "method"],
    description: "Store functions in a struct and call them",
    fn: East.function([], IntegerType, ($) => {
        const MathOpsType = StructType({
            add: FunctionType([IntegerType, IntegerType], IntegerType),
            multiply: FunctionType([IntegerType, IntegerType], IntegerType),
        });
        const mathOps = $.const({
            add: East.function([IntegerType, IntegerType], IntegerType, ($, a, b) => a.add(b)),
            multiply: East.function([IntegerType, IntegerType], IntegerType, ($, a, b) => a.multiply(b)),
        }, MathOpsType);
        return mathOps.add(mathOps.multiply(2n, 3n), 4n);
    }),
    inputs: [],
    returns: 10n,
});

export const functionInArray = example({
    keywords: ["function", "FunctionType", "array", "ArrayType"],
    description: "Store functions in an array and call them by index",
    fn: East.function([], IntegerType, ($) => {
        const TransformArrayType = ArrayType(FunctionType([IntegerType], IntegerType));
        const transforms = $.const([
            East.function([IntegerType], IntegerType, ($, x) => x.add(1n)),
            East.function([IntegerType], IntegerType, ($, x) => x.multiply(2n)),
            East.function([IntegerType], IntegerType, ($, x) => x.multiply(x)),
        ], TransformArrayType);
        return transforms.get(2n)(5n);
    }),
    inputs: [],
    returns: 25n,
});

// ---------------------------------------------------------------------------
// Async functions
// ---------------------------------------------------------------------------

export const asyncFunctionSimple = example({
    keywords: ["function", "East.asyncFunction", "async", "AsyncFunctionType"],
    description: "Create and call a simple async function",
    fn: East.asyncFunction([], StringType, ($) => {
        const asyncGreet = $.const(East.asyncFunction([], StringType, _$ => {
            return "Hello, async!";
        }));
        return asyncGreet();
    }),
    inputs: [],
    returns: "Hello, async!",
});

export const asyncFunctionChain = example({
    keywords: ["function", "East.asyncFunction", "async", "chain", "compose"],
    description: "Async function that calls another async function",
    fn: East.asyncFunction([], IntegerType, ($) => {
        const asyncDouble = $.const(East.asyncFunction([IntegerType], IntegerType, (_$, x) => {
            return x.multiply(2n);
        }));
        const asyncQuadruple = $.const(East.asyncFunction([IntegerType], IntegerType, ($, x) => {
            const doubled = $.let(asyncDouble(x));
            return asyncDouble(doubled);
        }));
        return asyncQuadruple(5n);
    }),
    inputs: [],
    returns: 20n,
});

// ---------------------------------------------------------------------------
// Function Serialization (BEAST2)
// ---------------------------------------------------------------------------

export const functionSerializeBeast = example({
    keywords: ["function", "East.Blob.encodeBeast", "decodeBeast", "serialize", "BEAST2"],
    description: "Serialize a function to BEAST2 and deserialize it back",
    fn: East.function([], IntegerType, ($) => {
        const FnType = FunctionType([IntegerType], IntegerType);
        const addOne = $.const(East.function([IntegerType], IntegerType, ($, x) => {
            return x.add(1n);
        }));
        const blob = $.let(East.Blob.encodeBeast(addOne, 'v2'));
        const decoded = $.let(blob.decodeBeast(FnType, 'v2'));
        return decoded(41n);
    }),
    inputs: [],
    returns: 42n,
});

export const functionSerializeMultipleParams = example({
    keywords: ["function", "East.Blob.encodeBeast", "decodeBeast", "multiple params", "BEAST2"],
    description: "Serialize a multi-param function to BEAST2",
    fn: East.function([], IntegerType, ($) => {
        const FnType = FunctionType([IntegerType, IntegerType], IntegerType);
        const add = $.const(East.function([IntegerType, IntegerType], IntegerType, ($, a, b) => {
            return a.add(b);
        }));
        const blob = $.let(East.Blob.encodeBeast(add, 'v2'));
        const decoded = $.let(blob.decodeBeast(FnType, 'v2'));
        return decoded(10n, 20n);
    }),
    inputs: [],
    returns: 30n,
});

export const functionSerializeControlFlow = example({
    keywords: ["function", "East.Blob.encodeBeast", "decodeBeast", "control flow", "BEAST2"],
    description: "Serialize a function with control flow (if/return) to BEAST2",
    fn: East.function([], IntegerType, ($) => {
        const FnType = FunctionType([IntegerType], IntegerType);
        const abs = $.const(East.function([IntegerType], IntegerType, ($, x) => {
            $.if(East.less(x, 0n), ($) => {
                $.return(x.negate());
            });
            return x;
        }));
        const blob = $.let(East.Blob.encodeBeast(abs, 'v2'));
        const decoded = $.let(blob.decodeBeast(FnType, 'v2'));
        return decoded(-5n);
    }),
    inputs: [],
    returns: 5n,
});

export const functionSerializeLoop = example({
    keywords: ["function", "East.Blob.encodeBeast", "decodeBeast", "loop", "BEAST2"],
    description: "Serialize a function with a loop to BEAST2",
    fn: East.function([], IntegerType, ($) => {
        const FnType = FunctionType([IntegerType], IntegerType);
        const sumTo = $.const(East.function([IntegerType], IntegerType, ($, n) => {
            const sum = $.let(0n);
            const i = $.let(1n);
            $.while(East.lessEqual(i, n), ($) => {
                $.assign(sum, sum.add(i));
                $.assign(i, i.add(1n));
            });
            return sum;
        }));
        const blob = $.let(East.Blob.encodeBeast(sumTo, 'v2'));
        const decoded = $.let(blob.decodeBeast(FnType, 'v2'));
        return decoded(5n);
    }),
    inputs: [],
    returns: 15n,
});

export const functionSerializeArrayOfFunctions = example({
    keywords: ["function", "East.Blob.encodeBeast", "decodeBeast", "array", "BEAST2"],
    description: "Serialize an array of functions to BEAST2",
    fn: East.function([], IntegerType, ($) => {
        const FnType = FunctionType([IntegerType], IntegerType);
        const ArrayFnType = ArrayType(FnType);
        const funcs = $.const([
            East.function([IntegerType], IntegerType, ($, x) => x.add(1n)),
            East.function([IntegerType], IntegerType, ($, x) => x.multiply(2n)),
            East.function([IntegerType], IntegerType, ($, x) => x.negate()),
        ], ArrayFnType);
        const blob = $.let(East.Blob.encodeBeast(funcs, 'v2'));
        const decoded = $.let(blob.decodeBeast(ArrayFnType, 'v2'));
        return decoded.get(1n)(10n);
    }),
    inputs: [],
    returns: 20n,
});

export const functionSerializeStruct = example({
    keywords: ["function", "East.Blob.encodeBeast", "decodeBeast", "struct", "BEAST2"],
    description: "Serialize a struct containing a function to BEAST2",
    fn: East.function([], IntegerType, ($) => {
        const FnType = FunctionType([IntegerType], IntegerType);
        const StructWithFn = StructType({
            name: StringType,
            transform: FnType
        });
        const obj = $.const({
            name: "addOne",
            transform: East.function([IntegerType], IntegerType, ($, x) => x.add(1n)),
        }, StructWithFn);
        const blob = $.let(East.Blob.encodeBeast(obj, 'v2'));
        const decoded = $.let(blob.decodeBeast(StructWithFn, 'v2'));
        return decoded.transform(5n);
    }),
    inputs: [],
    returns: 6n,
});

// ---------------------------------------------------------------------------
// Closure Serialization
// ---------------------------------------------------------------------------

export const closureSerializeIntCapture = example({
    keywords: ["function", "closure", "East.Blob.encodeBeast", "decodeBeast", "capture", "BEAST2"],
    description: "Serialize a closure with an integer capture to BEAST2",
    fn: East.function([], IntegerType, ($) => {
        const FnType = FunctionType([], IntegerType);
        const x = $.let(42n, IntegerType);
        const getCaptured = $.let(East.function([], IntegerType, (_$) => {
            return x;
        }));
        const blob = $.let(East.Blob.encodeBeast(getCaptured, 'v2'));
        const decoded = $.let(blob.decodeBeast(FnType, 'v2'));
        return decoded();
    }),
    inputs: [],
    returns: 42n,
});

export const closureSerializeMultipleCaptures = example({
    keywords: ["function", "closure", "East.Blob.encodeBeast", "decodeBeast", "multiple captures", "BEAST2"],
    description: "Serialize a closure with multiple captures to BEAST2",
    fn: East.function([], IntegerType, ($) => {
        const FnType = FunctionType([], IntegerType);
        const a = $.let(10n, IntegerType);
        const b = $.let(20n, IntegerType);
        const c = $.let(12n, IntegerType);
        const sumCaptures = $.let(East.function([], IntegerType, (_$) => {
            return a.add(b).add(c);
        }));
        const blob = $.let(East.Blob.encodeBeast(sumCaptures, 'v2'));
        const decoded = $.let(blob.decodeBeast(FnType, 'v2'));
        return decoded();
    }),
    inputs: [],
    returns: 42n,
});

export const closureSerializeArrayCapture = example({
    keywords: ["function", "closure", "East.Blob.encodeBeast", "decodeBeast", "array capture", "BEAST2"],
    description: "Serialize a closure that captures an array to BEAST2",
    fn: East.function([], IntegerType, ($) => {
        const FnType = FunctionType([], IntegerType);
        const arr = $.let([1n, 2n, 3n], ArrayType(IntegerType));
        const getLength = $.let(East.function([], IntegerType, (_$) => {
            return arr.length();
        }));
        const blob = $.let(East.Blob.encodeBeast(getLength, 'v2'));
        const decoded = $.let(blob.decodeBeast(FnType, 'v2'));
        return decoded();
    }),
    inputs: [],
    returns: 3n,
});

export const closureSerializeFunctionCapture = example({
    keywords: ["function", "closure", "East.Blob.encodeBeast", "decodeBeast", "function capture", "BEAST2"],
    description: "Serialize a closure that captures another function to BEAST2",
    fn: East.function([], IntegerType, ($) => {
        const OuterFnType = FunctionType([IntegerType], IntegerType);
        const addOne = $.let(East.function([IntegerType], IntegerType, ($, x) => {
            return x.add(1n);
        }));
        const applyAddOne = $.let(East.function([IntegerType], IntegerType, ($, x) => {
            return addOne(x);
        }));
        const blob = $.let(East.Blob.encodeBeast(applyAddOne, 'v2'));
        const decoded = $.let(blob.decodeBeast(OuterFnType, 'v2'));
        return decoded(41n);
    }),
    inputs: [],
    returns: 42n,
});

export const closureSerializeNested = example({
    keywords: ["function", "closure", "East.Blob.encodeBeast", "decodeBeast", "nested", "BEAST2"],
    description: "Serialize a nested closure (closure returning closure) to BEAST2",
    fn: East.function([], IntegerType, ($) => {
        const InnerFnType = FunctionType([IntegerType], IntegerType);
        const makeAdder = $.const(East.function([IntegerType], InnerFnType, ($, n) => {
            return East.function([IntegerType], IntegerType, ($, x) => {
                return x.add(n);
            });
        }));
        const addFive = $.let(makeAdder(5n));
        const blob = $.let(East.Blob.encodeBeast(addFive, 'v2'));
        const decoded = $.let(blob.decodeBeast(InnerFnType, 'v2'));
        return decoded(37n);
    }),
    inputs: [],
    returns: 42n,
});

export const closureSerializeStructCapture = example({
    keywords: ["function", "closure", "East.Blob.encodeBeast", "decodeBeast", "struct capture", "BEAST2"],
    description: "Serialize a closure that captures a struct value to BEAST2",
    fn: East.function([], IntegerType, ($) => {
        const PointType = StructType({ x: IntegerType, y: IntegerType });
        const FnType = FunctionType([], IntegerType);
        const point = $.const({ x: 10n, y: 32n }, PointType);
        const getSum = $.let(East.function([], IntegerType, (_$) => {
            return point.x.add(point.y);
        }));
        const blob = $.let(East.Blob.encodeBeast(getSum, 'v2'));
        const decoded = $.let(blob.decodeBeast(FnType, 'v2'));
        return decoded();
    }),
    inputs: [],
    returns: 42n,
});

export const closureSerializeDeeplyNested = example({
    keywords: ["function", "closure", "East.Blob.encodeBeast", "decodeBeast", "deeply nested", "BEAST2"],
    description: "Serialize deeply nested closures (A→B→C→value) to BEAST2",
    fn: East.function([], IntegerType, ($) => {
        const InnerType = FunctionType([], IntegerType);
        const MiddleType = FunctionType([], InnerType);
        const OuterType = FunctionType([], MiddleType);
        const value = $.let(42n, IntegerType);
        const c = $.let(East.function([], IntegerType, (_$) => { return value; }));
        const b = $.let(East.function([], InnerType, (_$) => { return c; }));
        const a = $.let(East.function([], MiddleType, (_$) => { return b; }));
        const blob = $.let(East.Blob.encodeBeast(a, 'v2'));
        const decoded = $.let(blob.decodeBeast(OuterType, 'v2'));
        return decoded()()();
    }),
    inputs: [],
    returns: 42n,
});

export const closureSerializeAsync = example({
    keywords: ["function", "closure", "East.asyncFunction", "AsyncFunctionType", "East.Blob.encodeBeast", "BEAST2"],
    description: "Serialize an async closure with captures to BEAST2",
    fn: East.asyncFunction([], IntegerType, ($) => {
        const FnType = AsyncFunctionType([], IntegerType);
        const x = $.let(42n, IntegerType);
        const getAsync = $.let(East.asyncFunction([], IntegerType, (_$) => {
            return x;
        }));
        const blob = $.let(East.Blob.encodeBeast(getAsync, 'v2'));
        const decoded = $.let(blob.decodeBeast(FnType, 'v2'));
        return decoded();
    }),
    inputs: [],
    returns: 42n,
});

export const closureSerializeBlobCapture = example({
    keywords: ["function", "closure", "East.Blob.encodeBeast", "decodeBeast", "Blob capture", "BEAST2"],
    description: "Serialize a closure that captures a Blob value to BEAST2",
    fn: East.function([], IntegerType, ($) => {
        const FnType = FunctionType([], IntegerType);
        const b = $.const(new Uint8Array([1, 2, 3, 4, 5]), BlobType);
        const getLength = $.let(East.function([], IntegerType, (_$) => {
            return b.size();
        }));
        const blob = $.let(East.Blob.encodeBeast(getLength, 'v2'));
        const decoded = $.let(blob.decodeBeast(FnType, 'v2'));
        return decoded();
    }),
    inputs: [],
    returns: 5n,
});

export const closureSharedMutableVariable = example({
    keywords: ["function", "closure", "mutable", "shared", "capture"],
    description: "Two closures sharing a mutable variable at top level",
    fn: East.function([], IntegerType, ($) => {
        const counter = $.let(0n, IntegerType);
        const inc = $.let(East.function([], NullType, ($) => {
            $.assign(counter, counter.add(1n));
        }));
        const get = $.let(East.function([], IntegerType, (_$) => {
            return counter;
        }));
        $(inc());
        $(inc());
        $(inc());
        return get();
    }),
    inputs: [],
    returns: 3n,
});
