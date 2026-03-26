/**
 * Example: East module system
 *
 * Demonstrates defining exports, creating modules, cross-module references,
 * and compiling with a symbol table.
 */
import { East, IntegerType, FunctionType } from "../../src/index.js";
import { Module } from "../../src/expr/block.js";

// ── Define exports (named symbols) ──────────────────────────────────

const add = East.export("add",
    East.function([IntegerType, IntegerType], IntegerType, ($, a, b) => a.add(b)));

const pi = East.export("pi", 42n);

// Non-exported helper — will be inlined wherever used (not deduplicated)
const helper = East.function([IntegerType], IntegerType, ($, x) => x.add(1n));

const compute = East.export("compute",
    East.function([IntegerType], IntegerType, ($, x) => {
        // `add` and `pi` are exports → resolved via SymbolIR
        // `helper` is NOT an export → inlined directly
        return add(helper(x), pi);
    }));

// ── Create module ───────────────────────────────────────────────────

const mathModule = East.module("example.math", add, pi, compute);

console.log("Module name:", Module.name(mathModule));
console.log("Module symbols:", Object.keys(Module.symbols(mathModule)));

// ── Cross-module reference ──────────────────────────────────────────

const process = East.export("process",
    East.function([IntegerType], IntegerType, ($, x) => {
        // mathModule.add creates a SymbolAST("example.math.add") reference
        return mathModule.add(x, 1n);
    }));

const mainModule = East.module("example.main", process);

console.log("Main dependencies:", [...Module.dependencies(mainModule)].map(d => Module.name(d)));

// ── Compile and execute ─────────────────────────────────────────────

// East.compile collects symbols automatically
const symbolValues = new Map<string, any>();
const fn = East.compile(
    East.function([IntegerType], IntegerType, ($, x) => {
        return mathModule.add(x, 1n);
    }),
    symbolValues,
);

console.log("fn(5n) =", fn(5n));   // 6n
console.log("fn(10n) =", fn(10n)); // 11n
