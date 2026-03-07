/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import { East, IntegerType, BooleanType, StringType, ArrayType, SetType, DictType, example } from "@elaraai/east";

// ---------------------------------------------------------------------------
// Variable Declaration
// ---------------------------------------------------------------------------

export const blockConst = example({
    keywords: ["block", "const", "declaration", "immutable"],
    description: "Declare an immutable constant with $.const",
    fn: East.function([], IntegerType, ($) => {
        const x = $.const(42n, IntegerType);
        return x;
    }),
    inputs: [],
    returns: 42n,
});

export const blockLet = example({
    keywords: ["block", "let", "declaration", "mutable"],
    description: "Declare a mutable variable with $.let",
    fn: East.function([], IntegerType, ($) => {
        const x = $.let(42n, IntegerType);
        return x;
    }),
    inputs: [],
    returns: 42n,
});

export const blockAssign = example({
    keywords: ["block", "assign", "reassignment", "mutation"],
    description: "Reassign a mutable variable with $.assign",
    fn: East.function([], IntegerType, ($) => {
        const x = $.let(0n, IntegerType);
        $.assign(x, 42n);
        return x;
    }),
    inputs: [],
    returns: 42n,
});

// ---------------------------------------------------------------------------
// Conditionals
// ---------------------------------------------------------------------------

export const blockIf = example({
    keywords: ["block", "if", "conditional", "branch"],
    description: "Execute a block conditionally with $.if",
    fn: East.function([], IntegerType, ($) => {
        const result = $.let(0n, IntegerType);
        $.if(true, $ => {
            $.assign(result, 42n);
        });
        return result;
    }),
    inputs: [],
    returns: 42n,
});

export const blockIfElse = example({
    keywords: ["block", "if", "else", "conditional", "branch"],
    description: "Execute an if-else conditional with $.if().else()",
    fn: East.function([], IntegerType, ($) => {
        const result = $.let(0n, IntegerType);
        $.if(false, $ => {
            $.assign(result, 42n);
        }).else($ => {
            $.assign(result, 99n);
        });
        return result;
    }),
    inputs: [],
    returns: 99n,
});

export const blockIfElseIf = example({
    keywords: ["block", "if", "elseIf", "else", "conditional", "chain"],
    description: "Chain conditions with $.if().elseIf().else()",
    fn: East.function([], IntegerType, ($) => {
        const result = $.let(0n, IntegerType);
        const x = $.const(5n, IntegerType);
        $.if(East.equal(x, 0n), $ => {
            $.assign(result, 1n);
        }).elseIf(East.equal(x, 5n), $ => {
            $.assign(result, 2n);
        }).else($ => {
            $.assign(result, 3n);
        });
        return result;
    }),
    inputs: [],
    returns: 2n,
});

// ---------------------------------------------------------------------------
// While Loop
// ---------------------------------------------------------------------------

export const blockWhile = example({
    keywords: ["block", "while", "loop", "iteration"],
    description: "Loop with a condition using $.while",
    fn: East.function([], IntegerType, ($) => {
        const i = $.let(0n, IntegerType);
        $.while(East.less(i, 5n), $ => {
            $.assign(i, i.add(1n));
        });
        return i;
    }),
    inputs: [],
    returns: 5n,
});

export const blockWhileBreak = example({
    keywords: ["block", "while", "break", "loop", "early-exit"],
    description: "Break out of a while loop with $.break",
    fn: East.function([], IntegerType, ($) => {
        const i = $.let(0n, IntegerType);
        $.while(true, ($, label) => {
            $.assign(i, i.add(1n));
            $.if(East.equal(i, 3n), $ => {
                $.break(label);
            });
        });
        return i;
    }),
    inputs: [],
    returns: 3n,
});

export const blockWhileContinue = example({
    keywords: ["block", "while", "continue", "loop", "skip"],
    description: "Skip an iteration with $.continue in a while loop",
    fn: East.function([], IntegerType, ($) => {
        const i = $.let(0n, IntegerType);
        const sum = $.let(0n, IntegerType);
        $.while(East.less(i, 5n), ($, label) => {
            $.assign(i, i.add(1n));
            $.if(East.equal(i, 3n), $ => {
                $.continue(label);
            });
            $.assign(sum, sum.add(i));
        });
        return sum;
    }),
    inputs: [],
    returns: 12n, // 1 + 2 + 4 + 5
});

// ---------------------------------------------------------------------------
// For Loop
// ---------------------------------------------------------------------------

export const blockForArray = example({
    keywords: ["block", "for", "array", "loop", "iteration"],
    description: "Iterate over an array with $.for",
    fn: East.function([], IntegerType, ($) => {
        const arr = $.const([1n, 2n, 3n], ArrayType(IntegerType));
        const sum = $.let(0n, IntegerType);
        $.for(arr, ($, value) => {
            $.assign(sum, sum.add(value));
        });
        return sum;
    }),
    inputs: [],
    returns: 6n,
});

export const blockForSet = example({
    keywords: ["block", "for", "set", "loop", "iteration"],
    description: "Iterate over a set with $.for",
    fn: East.function([], IntegerType, ($) => {
        const set = $.const(new Set([1n, 2n, 3n]), SetType(IntegerType));
        const sum = $.let(0n, IntegerType);
        $.for(set, ($, key) => {
            $.assign(sum, sum.add(key));
        });
        return sum;
    }),
    inputs: [],
    returns: 6n,
});

export const blockForDict = example({
    keywords: ["block", "for", "dict", "loop", "iteration"],
    description: "Iterate over a dict with $.for",
    fn: East.function([], IntegerType, ($) => {
        const dict = $.const(new Map([["a", 1n], ["b", 2n], ["c", 3n]]), DictType(StringType, IntegerType));
        const sum = $.let(0n, IntegerType);
        $.for(dict, ($, value) => {
            $.assign(sum, sum.add(value));
        });
        return sum;
    }),
    inputs: [],
    returns: 6n,
});

export const blockForBreak = example({
    keywords: ["block", "for", "break", "loop", "early-exit"],
    description: "Break out of a for loop with $.break",
    fn: East.function([], IntegerType, ($) => {
        const arr = $.const([1n, 2n, 3n, 4n, 5n], ArrayType(IntegerType));
        const sum = $.let(0n, IntegerType);
        $.for(arr, ($, value, _key, label) => {
            $.if(East.equal(value, 3n), $ => {
                $.break(label);
            });
            $.assign(sum, sum.add(value));
        });
        return sum;
    }),
    inputs: [],
    returns: 3n, // 1 + 2
});

export const blockForContinue = example({
    keywords: ["block", "for", "continue", "loop", "skip"],
    description: "Skip an iteration with $.continue in a for loop",
    fn: East.function([], IntegerType, ($) => {
        const arr = $.const([1n, 2n, 3n, 4n, 5n], ArrayType(IntegerType));
        const sum = $.let(0n, IntegerType);
        $.for(arr, ($, value, _key, label) => {
            $.if(East.equal(value, 3n), $ => {
                $.continue(label);
            });
            $.assign(sum, sum.add(value));
        });
        return sum;
    }),
    inputs: [],
    returns: 12n, // 1 + 2 + 4 + 5
});

// ---------------------------------------------------------------------------
// Early Return
// ---------------------------------------------------------------------------

export const blockReturn = example({
    keywords: ["block", "return", "early-return", "function"],
    description: "Return early from a function with $.return",
    fn: East.function([IntegerType], IntegerType, ($, x) => {
        $.if(East.equal(x, 0n), $ => {
            $.return(1n);
        });
        return x.multiply(2n);
    }),
    inputs: [0n],
    returns: 1n,
});

// ---------------------------------------------------------------------------
// Try-Catch-Finally
// ---------------------------------------------------------------------------

export const blockTryCatch = example({
    keywords: ["block", "try", "catch", "error", "exception"],
    description: "Catch a runtime error with $.try().catch()",
    fn: East.function([], IntegerType, ($) => {
        const result = $.let(0n, IntegerType);
        const arr = $.const([1n, 2n, 3n], ArrayType(IntegerType));
        $.try($ => {
            $(arr.get(10n)); // out of bounds
            $.assign(result, 42n);
        }).catch(($, _message, _stack) => {
            $.assign(result, -1n);
        });
        return result;
    }),
    inputs: [],
    returns: -1n,
});

export const blockTryFinally = example({
    keywords: ["block", "try", "finally", "cleanup"],
    description: "Run cleanup code with $.try().finally()",
    fn: East.function([], BooleanType, ($) => {
        const finallyExecuted = $.let(false, BooleanType);
        $.try($ => {
            $.const(42n, IntegerType);
        }).finally($ => {
            $.assign(finallyExecuted, true);
        });
        return finallyExecuted;
    }),
    inputs: [],
    returns: true,
});

export const blockTryCatchFinally = example({
    keywords: ["block", "try", "catch", "finally", "error", "cleanup"],
    description: "Handle errors and run cleanup with $.try().catch().finally()",
    fn: East.function([], IntegerType, ($) => {
        const result = $.let(0n, IntegerType);
        const arr = $.const([1n, 2n, 3n], ArrayType(IntegerType));
        $.try($ => {
            $(arr.get(10n)); // out of bounds
            $.assign(result, 42n);
        }).catch(($, _message, _stack) => {
            $.assign(result, -1n);
        }).finally($ => {
            $.assign(result, result.add(100n));
        });
        return result;
    }),
    inputs: [],
    returns: 99n, // catch sets -1, finally adds 100
});
