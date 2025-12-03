/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import {
    East,
    IntegerType,
    NullType,
    StringType,
    FunctionType,
    StructType,
    OptionType,
    ArrayType,
    VariantType,
    RecursiveType,
    variant,
} from "../src/index.js";
import { describeEast as describe, assertEast as assert } from "./platforms.spec.js";

await describe("Function", (test) => {
    test("simple function call returns correct result", $ => {
        const addOne = East.function([IntegerType], IntegerType, ($, x) => {
            return x.add(1n);
        });
        $(assert.equal(addOne(5n), 6n));
    });

    test("function with multiple arguments", $ => {
        const add = East.function([IntegerType, IntegerType], IntegerType, ($, a, b) => {
            return a.add(b);
        });
        $(assert.equal(add(3n, 4n), 7n));
    });

    test("function with no arguments", $ => {
        const getFortyTwo = East.function([], IntegerType, _$ => {
            return 42n;
        });
        $(assert.equal(getFortyTwo(), 42n));
    });

    test("function returning null", $ => {
        const doNothing = East.function([], NullType, _$ => {
            return null;
        });
        $(assert.equal(doNothing(), null));
    });

    test("function stored in variable and called", $ => {
        const fn = $.const(East.function([IntegerType], IntegerType, ($, x) => {
            return x.multiply(2n);
        }));
        $(assert.equal(fn(10n), 20n));
    });

    test("function passed as argument to another function", $ => {
        const apply = East.function(
            [FunctionType([IntegerType], IntegerType), IntegerType],
            IntegerType,
            ($, f, x) => {
                return f(x);
            }
        );
        const double = East.function([IntegerType], IntegerType, ($, x) => x.multiply(2n));
        $(assert.equal(apply(double, 5n), 10n));
    });

    test("function returned from another function", $ => {
        const makeAdder = East.function([IntegerType], FunctionType([IntegerType], IntegerType), ($, n) => {
            return East.function([IntegerType], IntegerType, ($, x) => x.add(n));
        });
        const addFive = makeAdder(5n);
        $(assert.equal(addFive(10n), 15n));
    });

    test("nested function calls", $ => {
        const square = East.function([IntegerType], IntegerType, ($, x) => x.multiply(x));
        const double = East.function([IntegerType], IntegerType, ($, x) => x.multiply(2n));
        // double(square(3)) = double(9) = 18
        $(assert.equal(double(square(3n)), 18n));
    });

    test("function with early return", $ => {
        const absValue = East.function([IntegerType], IntegerType, ($, x) => {
            $.if(East.less(x, 0n), $ => {
                $.return(x.negate());
            });
            return x;
        });
        $(assert.equal(absValue(-5n), 5n));
        $(assert.equal(absValue(5n), 5n));
        $(assert.equal(absValue(0n), 0n));
    });

    test("function capturing outer variable (closure)", $ => {
        const multiplier = $.const(3n);
        const multiplyByThree = East.function([IntegerType], IntegerType, ($, x) => {
            return x.multiply(multiplier);
        });
        $(assert.equal(multiplyByThree(4n), 12n));
    });

    test("function with string argument and return", $ => {
        const greet = East.function([StringType], StringType, ($, name) => {
            return East.str`Hello, ${name}!`;
        });
        $(assert.equal(greet("World"), "Hello, World!"));
    });

    test("struct with two functions", $ => {
        // Define a struct type containing two functions
        const MathOpsType = StructType({
            add: FunctionType([IntegerType, IntegerType], IntegerType),
            multiply: FunctionType([IntegerType, IntegerType], IntegerType),
        });

        // Create an instance with actual function implementations
        const mathOps = $.const({
            add: East.function([IntegerType, IntegerType], IntegerType, ($, a, b) => a.add(b)),
            multiply: East.function([IntegerType, IntegerType], IntegerType, ($, a, b) => a.multiply(b)),
        }, MathOpsType);

        // Call the functions from the struct
        $(assert.equal(mathOps.add(3n, 4n), 7n));
        $(assert.equal(mathOps.multiply(3n, 4n), 12n));

        // Chain operations
        $(assert.equal(mathOps.add(mathOps.multiply(2n, 3n), 4n), 10n));
    });

    test("variant Option containing a function - some case", $ => {
        // Define an Option type containing a function
        const MaybeTransformType = OptionType(FunctionType([IntegerType], IntegerType));

        // Create a some variant with a function
        const someTransform = $.const(
            variant("some", East.function([IntegerType], IntegerType, ($, x) => x.multiply(3n))),
            MaybeTransformType
        );

        // Match on the variant and call the function if present
        const result = $.let(0n);
        $.match(someTransform, {
            some: ($, fn) => {
                $.assign(result, fn(7n));
            },
            none: $ => {
                $.assign(result, -1n);
            },
        });
        $(assert.equal(result, 21n));
    });

    test("variant Option containing a function - none case", $ => {
        // Define an Option type containing a function
        const MaybeTransformType = OptionType(FunctionType([IntegerType], IntegerType));

        // Create a none variant
        const noTransform = $.const(variant("none", null), MaybeTransformType);

        // Match on the variant - should take the none branch
        const result = $.let(0n);
        $.match(noTransform, {
            some: ($, fn) => {
                $.assign(result, fn(7n));
            },
            none: $ => {
                $.assign(result, -1n);
            },
        });
        $(assert.equal(result, -1n));
    });

    test("array of functions", $ => {
        // Define an array type containing functions
        const TransformArrayType = ArrayType(FunctionType([IntegerType], IntegerType));

        // Create an array with multiple function implementations
        const transforms = $.const([
            East.function([IntegerType], IntegerType, ($, x) => x.add(1n)),
            East.function([IntegerType], IntegerType, ($, x) => x.multiply(2n)),
            East.function([IntegerType], IntegerType, ($, x) => x.multiply(x)),
        ], TransformArrayType);

        // Call each function from the array by index
        $(assert.equal(transforms.get(0n)(5n), 6n));   // 5 + 1 = 6
        $(assert.equal(transforms.get(1n)(5n), 10n));  // 5 * 2 = 10
        $(assert.equal(transforms.get(2n)(5n), 25n));  // 5 * 5 = 25

        // Apply all transforms in sequence to a value
        const value = $.let(3n);
        $.for(transforms, ($, fn) => {
            $.assign(value, fn(value));
        });
        // 3 -> 4 (add 1) -> 8 (multiply 2) -> 64 (square)
        $(assert.equal(value, 64n));
    });

    test("linked list of functions using RecursiveType", $ => {
        // Define a linked list type where each node contains a function
        const FnListType = RecursiveType(self => VariantType({
            nil: NullType,
            cons: StructType({
                fn: FunctionType([IntegerType], IntegerType),
                next: self
            })
        }));

        // Create a linked list: add1 -> double -> square -> nil
        const nil = East.value(variant("nil"), FnListType);
        const squareNode = East.value(variant("cons", {
            fn: East.function([IntegerType], IntegerType, ($, x) => x.multiply(x)),
            next: nil
        }), FnListType);
        const doubleNode = East.value(variant("cons", {
            fn: East.function([IntegerType], IntegerType, ($, x) => x.multiply(2n)),
            next: squareNode
        }), FnListType);
        const add1Node = East.value(variant("cons", {
            fn: East.function([IntegerType], IntegerType, ($, x) => x.add(1n)),
            next: doubleNode
        }), FnListType);

        // Traverse the list and apply each function in sequence
        const result = $.let(3n);
        const current = $.let(add1Node, FnListType);

        $.while(true, ($, label) => {
            $.match(current, {
                nil: $ => {
                    $.break(label);
                },
                cons: ($, node) => {
                    $.assign(result, node.fn(result));
                    $.assign(current, node.next);
                },
            });
        });

        // 3 -> 4 (add 1) -> 8 (double) -> 64 (square)
        $(assert.equal(result, 64n));
    });

    test("simple async function returns resolved promise", $ => {
        const asyncGreet = East.asyncFunction([], StringType, _$ => {
            return "Hello, async!";
        });
        $(assert.equal(asyncGreet(), "Hello, async!"));
    });

    test("async function calls another async function", $ => {
        const asyncDouble = East.asyncFunction([IntegerType], IntegerType, (_$, x) => {
            return x.multiply(2n);
        });
        const asyncQuadruple = East.asyncFunction([IntegerType], IntegerType, ($, x) => {
            const doubled = $.let(asyncDouble(x));
            return asyncDouble(doubled);
        });
        $(assert.equal(asyncQuadruple(5n), 20n));
    });
});
