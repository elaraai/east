/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import { describe, test } from "node:test";
import assert from "node:assert";
import { East } from "./expr/index.js";
import { IntegerType, StringType, NullType, ArrayType, FunctionType, FloatType, StructType } from "./types.js";
import { printFor } from "./serialization/east.js";
import type { EastTypeValue } from "./type_of_type.js";

describe("platform functions", () => {
    describe("non-generic platform", () => {
        test("can define and call a simple platform function", () => {
            const log = East.platform("log", [StringType], NullType);

            const platform = [
                log.implement((_s: string) => { /* no-op */ }),
            ];

            const f = East.function([StringType], NullType, ($, input) => {
                $(log(input));
                $.return(null);
            });

            const f_compiled = East.compile(f, platform);
            const result = f_compiled("hello");

            assert.strictEqual(result, null);
        });

        test("can pass values through platform functions", () => {
            const double = East.platform("double", [IntegerType], IntegerType);

            const platform = [
                double.implement((x: bigint) => x * 2n),
            ];

            const f = East.function([IntegerType], IntegerType, ($, input) => {
                $.return(double(input));
            });

            const f_compiled = East.compile(f, platform);
            const result = f_compiled(21n);

            assert.strictEqual(result, 42n);
        });
    });

    describe("genericPlatform", () => {
        test("can define a generic log function with 1 type parameter", () => {
            const getTypeName = East.genericPlatform(
                "getTypeName",
                ["T"],
                ["T"],
                StringType
            );

            const platform = [
                getTypeName.implement((T: EastTypeValue) => (_value: unknown) => {
                    return T.type;
                }),
            ];

            const f = East.function([IntegerType], StringType, ($, input) => {
                $.return(getTypeName([IntegerType], input));
            });

            const f_compiled = East.compile(f, platform);
            const result = f_compiled(42n);

            assert.strictEqual(result, "Integer");
        });

        test("can use type parameter to format output", () => {
            const genericPrint = East.genericPlatform(
                "genericPrint",
                ["T"],
                ["T"],
                StringType
            );

            const platform = [
                genericPrint.implement((T: EastTypeValue) => (value: unknown) => {
                    return printFor(T)(value);
                }),
            ];

            // Test with Integer
            const f1 = East.function([IntegerType], StringType, ($, input) => {
                $.return(genericPrint([IntegerType], input));
            });
            const f1_compiled = East.compile(f1, platform);
            assert.strictEqual(f1_compiled(42n), "42");

            // Test with String
            const f2 = East.function([StringType], StringType, ($, input) => {
                $.return(genericPrint([StringType], input));
            });
            const f2_compiled = East.compile(f2, platform);
            assert.strictEqual(f2_compiled("hello"), '"hello"');
        });

        test("can define a generic function with computed output type", () => {
            const wrap = East.genericPlatform(
                "wrap",
                ["T"],
                ["T"],
                ArrayType("T")
            );

            const platform = [
                wrap.implement((_T: EastTypeValue) => (value: unknown) => {
                    return [value];
                }),
            ];

            const f = East.function([IntegerType], ArrayType(IntegerType), ($, input) => {
                $.return(wrap([IntegerType], input));
            });

            const f_compiled = East.compile(f, platform);
            const result = f_compiled(42n);

            assert.deepStrictEqual(result, [42n]);
        });

        test("can define a generic function with 2 type parameters", () => {
            const pair = East.genericPlatform(
                "pair",
                ["A", "B"],
                ["A", "B"],
                StructType({ first: "A", second: "B" })
            );

            const platform = [
                pair.implement((_A: EastTypeValue, _B: EastTypeValue) => (a: unknown, b: unknown) => {
                    return { first: a, second: b };
                }),
            ];

            const f = East.function(
                [IntegerType, StringType],
                StructType({ first: IntegerType, second: StringType }),
                ($, a, b) => {
                    $.return(pair([IntegerType, StringType], a, b));
                }
            );

            const f_compiled = East.compile(f, platform);
            const result = f_compiled(42n, "hello");

            assert.deepStrictEqual(result, { first: 42n, second: "hello" });
        });

        test("can use function type parameters in input types", () => {
            const map = East.genericPlatform(
                "map",
                ["T", "U"],
                ["T", FunctionType(["T"], "U")],
                "U"
            );

            const platform = [
                map.implement((_T: EastTypeValue, _U: EastTypeValue) => (value: unknown, fn: unknown) => {
                    return (fn as (v: unknown) => unknown)(value);
                }),
            ];

            // Map Integer -> String
            const intToString = East.function([IntegerType], StringType, ($, x) => {
                $.return(East.str`${x}`);
            });

            const f = East.function([IntegerType], StringType, ($, input) => {
                $.return(map([IntegerType, StringType], input, intToString));
            });

            const f_compiled = East.compile(f, platform);
            const result = f_compiled(42n);

            assert.strictEqual(result, "42");
        });

        test("validates type arguments are EastTypes", () => {
            const log = East.genericPlatform(
                "log",
                ["T"],
                ["T"],
                NullType
            );

            assert.throws(() => {
                // @ts-expect-error - intentionally passing invalid type
                log(["not a type"], 42n);
            }, /expects type parameter/);
        });

        test("validates value argument count", () => {
            const log = East.genericPlatform(
                "log",
                ["T"],
                ["T"],
                NullType
            );

            assert.throws(() => {
                // @ts-expect-error - missing value argument
                log([IntegerType]);
            }, /expects 1 value arguments/);

            assert.throws(() => {
                // @ts-expect-error - too many value arguments
                log([IntegerType], 1n, 2n);
            }, /expects 1 value arguments/);
        });
    });

    describe("asyncGenericPlatform", () => {
        test("can define an async generic function", async () => {
            const asyncFetch = East.asyncGenericPlatform(
                "asyncFetch",
                ["T"],
                [StringType],
                "T"
            );

            const platform = [
                asyncFetch.implement((T: EastTypeValue) => async (_url: unknown) => {
                    // Simulate async operation
                    await new Promise(resolve => setTimeout(resolve, 10));
                    if (T.type === "Integer") {
                        return 42n;
                    }
                    return "result";
                }),
            ];

            const f = East.asyncFunction([StringType], IntegerType, ($, url) => {
                $.return(asyncFetch([IntegerType], url));
            });

            const f_compiled = East.compileAsync(f, platform);
            const result = await f_compiled("http://example.com");

            assert.strictEqual(result, 42n);
        });

        test("async generic functions work with computed output types", async () => {
            const asyncWrap = East.asyncGenericPlatform(
                "asyncWrap",
                ["T"],
                ["T"],
                ArrayType("T")
            );

            const platform = [
                asyncWrap.implement((_T: EastTypeValue) => async (value: unknown) => {
                    await new Promise(resolve => setTimeout(resolve, 10));
                    return [value, value];
                }),
            ];

            const f = East.asyncFunction([StringType], ArrayType(StringType), ($, input) => {
                $.return(asyncWrap([StringType], input));
            });

            const f_compiled = East.compileAsync(f, platform);
            const result = await f_compiled("hello");

            assert.deepStrictEqual(result, ["hello", "hello"]);
        });
    });

    describe("type safety at call site", () => {
        test("infers correct return type for generic functions", () => {
            const wrap = East.genericPlatform(
                "wrap",
                ["T"],
                ["T"],
                ArrayType("T")
            );

            // This should compile - the return type is ArrayType(IntegerType)
            const f = East.function([IntegerType], ArrayType(IntegerType), ($, input) => {
                $.return(wrap([IntegerType], input));
            });

            // Verify the function was created successfully
            assert.ok(f !== undefined);
        });

        test("allows multiple instantiations of the same generic function", () => {
            const identity = East.genericPlatform(
                "identity",
                ["T"],
                ["T"],
                "T"
            );

            const platform = [
                identity.implement((_T: EastTypeValue) => (value: unknown) => value),
            ];

            // Use with Integer
            const f1 = East.function([IntegerType], IntegerType, ($, input) => {
                $.return(identity([IntegerType], input));
            });
            const f1_compiled = East.compile(f1, platform);
            assert.strictEqual(f1_compiled(42n), 42n);

            // Use with String
            const f2 = East.function([StringType], StringType, ($, input) => {
                $.return(identity([StringType], input));
            });
            const f2_compiled = East.compile(f2, platform);
            assert.strictEqual(f2_compiled("hello"), "hello");

            // Use with Float
            const f3 = East.function([FloatType], FloatType, ($, input) => {
                $.return(identity([FloatType], input));
            });
            const f3_compiled = East.compile(f3, platform);
            assert.strictEqual(f3_compiled(3.14), 3.14);
        });
    });
});
