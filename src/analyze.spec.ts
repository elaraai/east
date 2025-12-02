/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import { describe, test } from "node:test";
import util from "node:util";
import assert from "node:assert";
import { analyzeIR, type AnalyzedIR } from "./analyze.js";
import { East } from "./expr/index.js";
import type { FunctionIR, ReturnIR, PlatformIR, ValueIR, BlockIR, LetIR } from "./ir.js";
import {
    NullType,
    BooleanType,
    IntegerType,
    StringType,
} from "./types.js";

// Force node test to show full stack traces for easier debugging
Error.stackTraceLimit = Infinity;

// Force node to print full objects in console.log output
util.inspect.defaultOptions.depth = null;

describe("analyzeIR - Basic validation", () => {
    test("should accept valid Value IR", () => {
        const fn = East.function([], IntegerType, $ => {
            $.return(East.value(42n));
        });

        const ir = fn.toIR().ir;
        const analyzed = analyzeIR(ir, []);

        assert.strictEqual(analyzed.type, "Function");
        assert.strictEqual(analyzed.value.isAsync, false);
    });
});

describe("analyzeIR - isAsync propagation", () => {
    test("Value expressions should be synchronous", () => {
        const fn = East.function([], IntegerType, $ => {
            $.return(East.value(42n));
        });

        const ir = fn.toIR().ir;
        const analyzed = analyzeIR(ir, []);

        assert.strictEqual(analyzed.type, "Function");
        assert.strictEqual(analyzed.value.isAsync, false);
    });

    test("Async platform function call should be async", async () => {
        const asyncFetch = East.platform("asyncFetch", [StringType], StringType);
        const platform = [asyncFetch.implementAsync(async (url: string) => url)];
        const asyncPlatforms = new Set(["asyncFetch"]);

        const fn = East.function([], StringType, $ => {
            $.return(asyncFetch(East.value("url")));
        });

        const ir = fn.toIR().ir;
        const analyzed = analyzeIR(ir, platform) as AnalyzedIR<FunctionIR>;

        // Check Function node
        assert.strictEqual(analyzed.type, "Function");
        assert.strictEqual(analyzed.value.isAsync, false, "Creating function should be sync");
        assert.strictEqual(analyzed.value.type.type, "Function");
        assert.strictEqual(analyzed.value.type.value.platforms.some(p => asyncPlatforms.has(p)), true, "Function body should be async");

        // Check Return node
        const body = (analyzed as FunctionIR).value.body as ReturnIR & AnalyzedIR;
        assert.strictEqual(body.type, "Return");
        assert.strictEqual(body.value.isAsync, true, "Return should be async");

        // Check Platform node
        const platformNode = body.value.value as PlatformIR & AnalyzedIR;
        assert.strictEqual(platformNode.type, "Platform");
        assert.strictEqual(platformNode.value.isAsync, true, "Platform call should be async");

        // Check Value node (argument)
        const argNode = platformNode.value.arguments[0] as ValueIR & AnalyzedIR;
        assert.strictEqual(argNode.type, "Value");
        assert.strictEqual(argNode.value.isAsync, false, "Value arg should be sync");

        // Execute the compiled function and verify it works
        // Use compileAsync for async platform functions
        const compiled = fn.toIR().compileAsync(platform);
        const result = await compiled();
        assert.strictEqual(result, "url", "Compiled function should return the correct result");
    });

    test("Sync platform function call should be synchronous", async () => {
        const log = East.platform("log", [StringType], NullType);
        const platform = [log.implement((msg: string) => console.log(msg))];

        const fn = East.function([], NullType, $ => {
            $(log(East.value("hello")));
            $.return(East.value(null));
        });

        const ir = fn.toIR().ir;
        const analyzed = analyzeIR(ir, platform);

        // Check Function node
        assert.strictEqual(analyzed.type, "Function");
        assert.strictEqual(analyzed.value.isAsync, false);

        // Check Block node
        const body = (analyzed as FunctionIR).value.body as BlockIR & AnalyzedIR;
        assert.strictEqual(body.type, "Block");
        assert.strictEqual(body.value.isAsync, false, "Block should be sync");

        // Execute the compiled function and verify it works
        // Use compile for sync platform functions
        const compiled = fn.toIR().compile(platform);
        const result = compiled();
        assert.strictEqual(result, null, "Compiled function should return null");
    });

    test("Platform function with async argument should be async", async () => {
        const asyncFetch = East.platform("asyncFetch", [StringType], StringType);
        const log = East.platform("log", [StringType], NullType);
        const platform = [
            asyncFetch.implementAsync(async (url: string) => url),
            log.implement((msg: string) => console.log(msg)),
        ];

        const fn = East.function([], NullType, $ => {
            $(log(asyncFetch(East.value("url"))));
            $.return(East.value(null));
        });

        const ir = fn.toIR().ir;
        const analyzed = analyzeIR(ir, platform);

        // Check Block node
        const body = (analyzed as FunctionIR).value.body as AnalyzedIR;
        assert.strictEqual(body.type, "Block");
        assert.strictEqual(body.value.isAsync, true, "Block should be async");

        // Check log() call (should be async due to async argument)
        const logCall = body.value.statements[0] as AnalyzedIR;
        assert.strictEqual(logCall.type, "Platform");
        assert.strictEqual(logCall.value.isAsync, true, "log call should be async");

        // Check asyncFetch() inside
        const asyncFetchCall = logCall.value.arguments[0] as AnalyzedIR;
        assert.strictEqual(asyncFetchCall.type, "Platform");
        assert.strictEqual(asyncFetchCall.value.isAsync, true, "asyncFetch should be async");

        // Execute and verify
        const compiled = fn.toIR().compileAsync(platform);
        const result = await compiled();
        assert.strictEqual(result, null);
    });

    test("Let with async value should be async", async () => {
        const asyncFetch = East.platform("asyncFetch", [StringType], StringType);
        const platform = [asyncFetch.implementAsync(async (url: string) => url)];

        const fn = East.function([], StringType, $ => {
            const x = $.let(asyncFetch(East.value("url")));
            $.return(x);
        });

        const ir = fn.toIR().ir;
        const analyzed = analyzeIR(ir, platform);

        // Check Block node
        const body = (analyzed as FunctionIR).value.body as AnalyzedIR;
        assert.strictEqual(body.type, "Block");
        assert.strictEqual(body.value.isAsync, true, "Block should be async");

        // Check Let statement
        const letStmt = body.value.statements[0] as AnalyzedIR;
        assert.strictEqual(letStmt.type, "Let");
        assert.strictEqual(letStmt.value.isAsync, true, "Let should be async");

        // Execute and verify
        const compiled = fn.toIR().compileAsync(platform);
        const result = await compiled();
        assert.strictEqual(result, "url");
    });

    test("Block with async statement should be async", async () => {
        const asyncFetch = East.platform("asyncFetch", [StringType], StringType);
        const platform = [asyncFetch.implementAsync(async (url: string) => url)];

        const fn = East.function([], StringType, $ => {
            $(East.value(1n));
            $.return(asyncFetch(East.value("url")));
        });

        const ir = fn.toIR().ir;
        const analyzed = analyzeIR(ir, platform);

        const body = (analyzed as FunctionIR).value.body as AnalyzedIR;
        assert.strictEqual(body.type, "Block");
        assert.strictEqual(body.value.isAsync, true, "Block should be async");

        // Execute and verify
        const compiled = fn.toIR().compileAsync(platform);
        const result = await compiled();
        assert.strictEqual(result, "url");
    });

    test("Block with only sync statements should be sync", () => {
        const fn = East.function([], IntegerType, $ => {
            $(East.value(1n));
            $.return(East.value(2n));
        });

        const ir = fn.toIR().ir;
        const analyzed = analyzeIR(ir, []);

        const body = (analyzed as FunctionIR).value.body as AnalyzedIR;
        assert.strictEqual(body.type, "Block");
        assert.strictEqual(body.value.isAsync, false, "Block should be sync");
    });

    test("IfElse with async predicate should be async", async () => {
        const asyncCheck = East.platform("asyncCheck", [], BooleanType);
        const platform = [asyncCheck.implementAsync(async () => true)];

        const fn = East.function([], IntegerType, $ => {
            $.if(asyncCheck(), () => {
                $.return(East.value(1n));
            }).else(() => {
                $.return(East.value(2n));
            });
        });

        const ir = fn.toIR().ir;
        const analyzed = analyzeIR(ir, platform);

        // The body is a Block containing the if/else
        const body = (analyzed as FunctionIR).value.body as BlockIR & AnalyzedIR;
        assert.strictEqual(body.type, "Block");
        assert.strictEqual(body.value.isAsync, true, "Block containing async if/else should be async");

        // Check the IfElse statement inside the block
        const ifElse = body.value.statements[1] as AnalyzedIR;
        assert.strictEqual(ifElse.type, "IfElse");
        assert.strictEqual(ifElse.value.isAsync, true, "IfElse with async predicate should be async");

        // Execute and verify
        const compiled = fn.toIR().compileAsync(platform);
        const result = await compiled();
        assert.strictEqual(result, 1n);
    });

    test("IfElse with async branch body should be async", async () => {
        const asyncFetch = East.platform("asyncFetch", [StringType], StringType);
        const platform = [asyncFetch.implementAsync(async (url: string) => url)];

        const fn = East.function([], StringType, $ => {
            $.if(East.value(true), () => {
                $.return(asyncFetch(East.value("url")));
            }).else(() => {
                $.return(East.value("default"));
            });
        });

        const ir = fn.toIR().ir;
        const analyzed = analyzeIR(ir, platform);

        const body = (analyzed as FunctionIR).value.body as BlockIR & AnalyzedIR;
        assert.strictEqual(body.type, "Block");
        assert.strictEqual(body.value.isAsync, true, "Block containing async should be async");

        // The async call is in the Return statement, not the IfElse itself
        const returnStmt = body.value.statements[0] as ReturnIR & AnalyzedIR;
        assert.strictEqual(returnStmt.type, "Return");
        assert.strictEqual(returnStmt.value.isAsync, true, "Return with async call should be async");

        // Execute and verify
        const compiled = fn.toIR().compileAsync(platform);
        const result = await compiled();
        assert.strictEqual(result, "url");
    });

    test("IfElse with async else body should be async", async () => {
        const asyncFetch = East.platform("asyncFetch", [StringType], StringType);
        const platform = [asyncFetch.implementAsync(async (url: string) => url)];

        const fn = East.function([], StringType, $ => {
            $.if(East.value(true), () => {
                $.return(East.value("sync"));
            }).else(() => {
                $.return(asyncFetch(East.value("url")));
            });
        });

        const ir = fn.toIR().ir;
        const analyzed = analyzeIR(ir, platform);

        const body = (analyzed as FunctionIR).value.body as BlockIR & AnalyzedIR;
        assert.strictEqual(body.type, "Block");
        assert.strictEqual(body.value.isAsync, true, "Block containing async should be async");

        // The async call is in the else Return statement (statement 2)
        const elseReturnStmt = body.value.statements[2] as ReturnIR & AnalyzedIR;
        assert.strictEqual(elseReturnStmt.type, "Return");
        assert.strictEqual(elseReturnStmt.value.isAsync, true, "Return with async call should be async");

        // Execute and verify (predicate is true so takes if-branch, returns "sync")
        const compiled = fn.toIR().compileAsync(platform);
        const result = await compiled();
        assert.strictEqual(result, "sync");
    });

    test("IfElse with all sync branches should be sync", () => {
        const fn = East.function([], IntegerType, $ => {
            $.if(East.value(true), () => {
                $.return(East.value(1n));
            }).else(() => {
                $.return(East.value(2n));
            });
        });

        const ir = fn.toIR().ir;
        const analyzed = analyzeIR(ir, []);

        const body = (analyzed as FunctionIR).value.body as BlockIR & AnalyzedIR;
        assert.strictEqual(body.type, "Block");
        assert.strictEqual(body.value.isAsync, false, "Block with all sync statements should be sync");

        const ifElse = body.value.statements[1] as AnalyzedIR;
        assert.strictEqual(ifElse.type, "IfElse");
        assert.strictEqual(ifElse.value.isAsync, false, "IfElse with all sync branches should be sync");
    });

    test("While with async predicate should be async", async () => {
        const asyncCheck = East.platform("asyncCheck", [], BooleanType);
        const platform = [asyncCheck.implementAsync(async () => false)];

        const fn = East.function([], NullType, $ => {
            $.while(asyncCheck(), () => {
                $(East.value(null));
            });
            $.return(East.value(null));
        });

        const ir = fn.toIR().ir;
        const analyzed = analyzeIR(ir, platform);

        const body = (analyzed as FunctionIR).value.body as AnalyzedIR;
        assert.strictEqual(body.type, "Block");
        assert.strictEqual(body.value.isAsync, true, "Block containing async should be async");

        const whileStmt = body.value.statements[1] as AnalyzedIR;
        assert.strictEqual(whileStmt.type, "While");
        assert.strictEqual(whileStmt.value.isAsync, true, "While with async predicate should be async");

        // Execute and verify
        const compiled = fn.toIR().compileAsync(platform);
        const result = await compiled();
        assert.strictEqual(result, null);
    });

    test("While with async body should be async", async () => {
        const asyncWork = East.platform("asyncWork", [], NullType);
        const platform = [asyncWork.implementAsync(async () => null)];

        const fn = East.function([], NullType, $ => {
            $.while(East.value(true), ($, label) => {
                $(asyncWork());
                $.break(label);
            });
            $.return(East.value(null));
        });

        const ir = fn.toIR().ir;
        const analyzed = analyzeIR(ir, platform);

        const body = (analyzed as FunctionIR).value.body as AnalyzedIR;
        assert.strictEqual(body.type, "Block");
        assert.strictEqual(body.value.isAsync, true, "Block should be async");

        // Execute and verify
        const compiled = fn.toIR().compileAsync(platform);
        const result = await compiled();
        assert.strictEqual(result, null);
    });

    test("ForEach with async body should be async", async () => {
        const asyncProcess = East.platform("asyncProcess", [IntegerType], NullType);
        const platform = [asyncProcess.implementAsync(async (_x: bigint) => null)];

        const fn = East.function([], NullType, $ => {
            const arr = $.const(East.value([1n, 2n, 3n]));
            $(arr.forEach(($, v: any) => {
                $(asyncProcess(v));
                return East.value(null);
            }));
            $.return(East.value(null));
        });

        const ir = fn.toIR().ir;
        const analyzed = analyzeIR(ir, platform) as AnalyzedIR<FunctionIR>;

        const body = (analyzed as FunctionIR).value.body as AnalyzedIR;
        assert.strictEqual(body.type, "Block");
        assert.strictEqual(body.value.isAsync, true, "Block should be async");

        // Execute the compiled function and verify it works
        // Use compileAsync for async platform functions
        const compiled = fn.toIR().compileAsync(platform);
        const result = await compiled();
        assert.strictEqual(result, null, "Compiled function should return null");
    });

    test("Call with async function body should be async", async () => {
        const asyncWork = East.platform("asyncWork", [], NullType);
        const platform = [asyncWork.implementAsync(async () => null)];

        const innerFn = East.function([], NullType, $ => {
            $.return(asyncWork());
        });

        const outerFn = East.function([], NullType, $ => {
            $.return(innerFn());
        });

        const ir = outerFn.toIR().ir;
        const analyzed = analyzeIR(ir, platform);

        const body = (analyzed as FunctionIR).value.body as AnalyzedIR;
        assert.strictEqual(body.type, "Return");
        assert.strictEqual(body.value.isAsync, true, "Return should be async");

        const callNode = (body as ReturnIR).value.value as AnalyzedIR;
        assert.strictEqual(callNode.type, "Call");
        assert.strictEqual(callNode.value.isAsync, true, "Call should be async");

        // Execute the compiled function and verify it works
        // Use compileAsync for async platform functions
        const compiled = outerFn.toIR().compileAsync(platform);
        const result = await compiled();
        assert.strictEqual(result, null, "Compiled function should return null");
    });

    test("Function node should track async in body", async () => {
        const asyncWork = East.platform("asyncWork", [], NullType);
        const platform = [asyncWork.implementAsync(async () => null)];
        const asyncPlatformFns = new Set(["asyncWork"]);

        const outerFn = East.function([], NullType, $ => {
            const innerFn = $.const(East.function([], NullType, $inner => {
                $inner.return(asyncWork());
            }));

            $.return(innerFn());
        });

        const ir = outerFn.toIR().ir;
        const analyzed = analyzeIR(ir, platform);

        const body = (analyzed as FunctionIR).value.body as AnalyzedIR;
        assert.strictEqual(body.type, "Block");

        const letStmt = body.value.statements[0] as AnalyzedIR;
        assert.strictEqual(letStmt.type, "Let");

        const functionNode = (letStmt as LetIR).value.value as AnalyzedIR<FunctionIR>;
        assert.strictEqual(functionNode.type, "Function");
        assert.strictEqual(functionNode.value.isAsync, false, "Creating function should be sync");
        assert.strictEqual(functionNode.value.type.type, "Function");
        assert.strictEqual(functionNode.value.type.value.platforms.some(p => asyncPlatformFns.has(p)), true, "Function should track async in body");

        // Execute and verify
        const compiled = outerFn.toIR().compileAsync(platform);
        const result = await compiled();
        assert.strictEqual(result, null);
    });

    test("Nested async propagation through multiple levels", async () => {
        const asyncFetch = East.platform("asyncFetch", [StringType], StringType);
        const platform = [asyncFetch.implementAsync(async (url: string) => url)];

        const fn = East.function([], StringType, $ => {
            const x = $.let(asyncFetch(East.value("url")));
            $.return(x);
        });

        const ir = fn.toIR().ir;
        const analyzed = analyzeIR(ir, platform);

        const body = (analyzed as FunctionIR).value.body as AnalyzedIR;
        assert.strictEqual(body.type, "Block");
        assert.strictEqual(body.value.isAsync, true, "Async should propagate");

        // Execute and verify
        const compiled = fn.toIR().compileAsync(platform);
        const result = await compiled();
        assert.strictEqual(result, "url");
    });
});

describe("analyzeIR - Error cases", () => {
    test("should reject unknown platform function", () => {
        const unknownFunc = East.platform("unknownFunc", [], NullType);

        const fn = East.function([], NullType, $ => {
            $.return(unknownFunc());
        });

        const ir = fn.toIR().ir;

        assert.throws(() => analyzeIR(ir, []), {
            message: /Platform function 'unknownFunc' not found/,
        });
    });
});

describe("compile/compileAsync - Error checking", () => {
    test("compile() should throw when given async platform functions", () => {
        const asyncFetch = East.platform("asyncFetch", [StringType], StringType);
        const platform = [asyncFetch.implementAsync(async (url: string) => url)];

        const fn = East.function([], StringType, $ => {
            $.return(asyncFetch(East.value("url")));
        });

        assert.throws(() => {
            fn.toIR().compile(platform);
        }, {
            message: /Cannot use compile\(\) with async platform functions: asyncFetch/,
        });
    });

    test("compileAsync() should throw when no async platform functions", () => {
        const log = East.platform("log", [StringType], NullType);
        const platform = [log.implement((msg: string) => console.log(msg))];

        const fn = East.function([], NullType, $ => {
            $(log(East.value("hello")));
            $.return(East.value(null));
        });

        assert.throws(() => {
            fn.toIR().compileAsync(platform);
        }, {
            message: /No async platform functions found. Use compile\(\) instead/,
        });
    });

    test("compile() should succeed with only sync platform functions", () => {
        const log = East.platform("log", [StringType], NullType);
        const platform = [log.implement((msg: string) => console.log(msg))];

        const fn = East.function([], NullType, $ => {
            $(log(East.value("hello")));
            $.return(East.value(null));
        });

        const compiled = fn.toIR().compile(platform);
        const result = compiled();
        assert.strictEqual(result, null);
    });

    test("compileAsync() should succeed with async platform functions", async () => {
        const asyncFetch = East.platform("asyncFetch", [StringType], StringType);
        const platform = [asyncFetch.implementAsync(async (url: string) => url)];

        const fn = East.function([], StringType, $ => {
            $.return(asyncFetch(East.value("test")));
        });

        const compiled = fn.toIR().compileAsync(platform);
        const result = await compiled();
        assert.strictEqual(result, "test");
    });
});
