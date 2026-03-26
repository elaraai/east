/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import { describe, test } from "node:test";
import assert from "node:assert";

import { East, IntegerType, FloatType, StringType, FunctionType } from "./index.js";
import { Expr } from "./expr/expr.js";
import { Module } from "./expr/block.js";

describe("East.export", () => {
    test("creates an export from a constant value", () => {
        const pi = East.export("pi", 3.14159);
        const ast = Expr.ast(pi);
        assert.strictEqual(ast.ast_type, "ExportRef");
        if (ast.ast_type === "ExportRef") {
            assert.strictEqual(ast.localName, "pi");
            assert.strictEqual(ast.type.type, "Float");
        }
    });

    test("creates an export from a function", () => {
        const add = East.export("add",
            East.function([IntegerType, IntegerType], IntegerType, ($, a, b) => a.add(b)));
        const ast = Expr.ast(add);
        assert.strictEqual(ast.ast_type, "ExportRef");
        if (ast.ast_type === "ExportRef") {
            assert.strictEqual(ast.localName, "add");
            assert.strictEqual(ast.type.type, "Function");
        }
    });

    test("exported function is callable", () => {
        const add = East.export("add",
            East.function([IntegerType, IntegerType], IntegerType, ($, a, b) => a.add(b)));
        const callAst = Expr.ast(add(1n, 2n));
        assert.strictEqual(callAst.ast_type, "Call");
    });

    test("export used outside module context throws", () => {
        const pi = East.export("pi", 3.14159);
        assert.throws(() => {
            const fn = East.function([FloatType], FloatType, ($, x) => x.add(pi));
            East.compile(fn, new Map());
        }, /Export "pi" not found in module context/);
    });
});

describe("East.extern", () => {
    test("creates a symbol reference with full name", () => {
        const readFile = East.extern("east-node-std.fs", "readFile", FunctionType([StringType], StringType));
        const ast = Expr.ast(readFile);
        assert.strictEqual(ast.ast_type, "Symbol");
        if (ast.ast_type === "Symbol") {
            assert.strictEqual(ast.name, "east-node-std.fs.readFile");
        }
    });

    test("extern function is callable", () => {
        const log = East.extern("east-node-std.console", "log", FunctionType([StringType], StringType));
        const callAst = Expr.ast(log("hello"));
        assert.strictEqual(callAst.ast_type, "Call");
    });
});

describe("East.module", () => {
    test("creates a module from exports", () => {
        const pi = East.export("pi", 3.14159);
        const add = East.export("add",
            East.function([IntegerType, IntegerType], IntegerType, ($, a, b) => a.add(b)));
        const mod = East.module("math", pi, add);

        assert.ok(mod instanceof Module);
        assert.strictEqual(Module.name(mod), "math");
        // Check that symbols dict has the expected keys
        const symbols = Module.symbols(mod);
        assert.ok("math.pi" in symbols);
        assert.ok("math.add" in symbols);
    });

    test("rejects non-export arguments", () => {
        const notAnExport = East.function([IntegerType], IntegerType, ($, x) => x);
        assert.throws(() => {
            East.module("bad", notAnExport as any);
        }, /East\.module\(\) arguments must be created with East\.export\(\)/);
    });

    test("rejects duplicate export names", () => {
        const a = East.export("dup", 1n);
        const b = East.export("dup", 2n);
        assert.throws(() => {
            East.module("bad", a, b);
        }, /Duplicate export name "dup"/);
    });

    test("module descriptor has field getters", () => {
        const pi = East.export("pi", 3.14159);
        const mod = East.module("math", pi);

        // Field access should return an Expr wrapping SymbolAST
        const piRef = mod.pi;
        assert.ok(piRef instanceof Expr);
        const ast = Expr.ast(piRef);
        assert.strictEqual(ast.ast_type, "Symbol");
        if (ast.ast_type === "Symbol") {
            assert.strictEqual(ast.name, "math.pi");
        }
    });

    test("module metadata accessible via Module static methods", () => {
        const pi = East.export("pi", 3.14159);
        const mod = East.module("math", pi);

        assert.strictEqual(Module.name(mod), "math");
        const symbols = Module.symbols(mod);
        assert.ok(typeof symbols === "object");
        assert.ok("math.pi" in symbols);
    });
});

describe("Same-module deduplication", () => {
    test("export referenced from another export becomes SymbolIR", () => {
        const addOne = East.export("addOne",
            East.function([IntegerType], IntegerType, ($, x) => x.add(1n)));
        const addTwo = East.export("addTwo",
            East.function([IntegerType], IntegerType, ($, x) => addOne(addOne(x))));
        const mod = East.module("math", addOne, addTwo);

        // Find SymbolIR nodes in the module's symbols IR
        const symbols = Module.symbols(mod);
        const addTwoIR = symbols["math.addTwo"];
        assert.ok(addTwoIR, "Expected addTwo symbol IR");

        // Walk addTwo's IR looking for SymbolIR references
        const symRefs: string[] = [];
        function walk(node: any) {
            if (!node || typeof node !== 'object') return;
            if (node.type === "Symbol" && node.value?.name && typeof node.value.name === 'string') {
                symRefs.push(node.value.name);
            }
            for (const v of Object.values(node)) {
                if (Array.isArray(v)) v.forEach(walk);
                else if (typeof v === 'object' && v !== null) walk(v);
            }
        }
        walk(addTwoIR);

        assert.ok(symRefs.includes("math.addOne"),
            `Expected SymbolIR("math.addOne") in addTwo IR, got: ${JSON.stringify(symRefs)}`);
    });

    test("non-export helper is inlined, not deduplicated", () => {
        const helper = East.function([IntegerType], IntegerType, ($, x) => x.add(1n));
        const useHelper = East.export("useHelper",
            East.function([IntegerType], IntegerType, ($, x) => helper(x)));
        const mod = East.module("inline", useHelper);

        const symbols = Module.symbols(mod);
        const useHelperIR = symbols["inline.useHelper"];

        const symRefs: string[] = [];
        function walk(node: any) {
            if (!node || typeof node !== 'object') return;
            if (node.type === "Symbol" && node.value?.name && typeof node.value.name === 'string') {
                symRefs.push(node.value.name);
            }
            for (const v of Object.values(node)) {
                if (Array.isArray(v)) v.forEach(walk);
                else if (typeof v === 'object' && v !== null) walk(v);
            }
        }
        walk(useHelperIR);

        assert.strictEqual(symRefs.length, 0,
            `Expected no SymbolIR references (helper should be inlined), got: ${JSON.stringify(symRefs)}`);
    });
});

describe("Cross-module references", () => {
    test("module descriptor field access generates SymbolIR in another module", () => {
        const add = East.export("add",
            East.function([IntegerType, IntegerType], IntegerType, ($, a, b) => a.add(b)));
        const mathModule = East.module("math", add);

        const process = East.export("process",
            East.function([IntegerType], IntegerType, ($, x) => {
                return mathModule.add(x, 1n);
            }));
        const mainModule = East.module("main", process);

        // Check dependencies include math
        const deps = Module.dependencies(mainModule);
        const depNames = [...deps].map(d => Module.name(d));
        assert.ok(depNames.includes("math"),
            `Expected dependency on "math", got: ${depNames}`);
    });

    test("transitive dependencies are collected", () => {
        const val = East.export("val", 100n);
        const modA = East.module("a", val);

        const useA = East.export("useA",
            East.function([IntegerType], IntegerType, ($, x) => x.add(modA.val)));
        const modB = East.module("b", useA);

        const useB = East.export("useB",
            East.function([IntegerType], IntegerType, ($, x) => modB.useA(x)));
        const modC = East.module("c", useB);

        // modC should transitively depend on modA and modB
        const deps = Module.dependencies(modC);
        const depNames = [...deps].map(d => Module.name(d));
        assert.ok(depNames.includes("a"), `Expected a in deps, got: ${depNames}`);
        assert.ok(depNames.includes("b"), `Expected b in deps, got: ${depNames}`);
    });
});

describe("Module end-to-end compilation", () => {
    test("same-module export references compile and execute correctly", () => {
        const addOne = East.export("addOne",
            East.function([IntegerType], IntegerType, ($, x) => x.add(1n)));
        const addTwo = East.export("addTwo",
            East.function([IntegerType], IntegerType, ($, x) => addOne(addOne(x))));
        const mod = East.module("math", addOne, addTwo);

        // Use East.compile which collects symbols automatically
        const symbolValues = new Map<string, any>();
        const fn = East.function([IntegerType], IntegerType, ($, x) => mod.addTwo(x));
        const compiled = East.compile(fn, symbolValues);
        assert.strictEqual(compiled(5n), 7n);  // 5 + 1 + 1 = 7
    });

    test("cross-module references compile and execute correctly", () => {
        const add = East.export("add",
            East.function([IntegerType, IntegerType], IntegerType, ($, a, b) => a.add(b)));
        const mathModule = East.module("math", add);

        const process = East.export("process",
            East.function([IntegerType], IntegerType, ($, x) => {
                return mathModule.add(x, 1n);
            }));
        const mainModule = East.module("main", process);

        // Use East.compile which collects symbols automatically
        const symbolValues = new Map<string, any>();
        const fn = East.function([IntegerType], IntegerType, ($, x) => mainModule.process(x));
        const compiled = East.compile(fn, symbolValues);
        assert.strictEqual(compiled(5n), 6n);
        assert.strictEqual(compiled(10n), 11n);
    });

    test("East.compile with automatic module symbol collection", () => {
        const add = East.export("add",
            East.function([IntegerType, IntegerType], IntegerType, ($, a, b) => a.add(b)));
        const mathModule = East.module("math", add);

        const symbolValues = new Map<string, any>();
        const fn = East.function([IntegerType], IntegerType, ($, x) => {
            return mathModule.add(x, 1n);
        });
        const compiled = East.compile(fn, symbolValues);
        assert.strictEqual(compiled(5n), 6n);
        assert.strictEqual(compiled(10n), 11n);
    });
});
