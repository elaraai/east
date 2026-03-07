/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */

import type { CallableFunctionExpr } from "./expr/function.js";
import type { CallableAsyncFunctionExpr } from "./expr/asyncfunction.js";
import type { SubtypeExprOrValue } from "./expr/types.js";
import { type EastType } from "./types.js";

/**
 * Defines an East example — an East function expression with metadata.
 *
 * The `fn` field is an `East.function()` — the exact same thing users write.
 * Tests call it with `inputs` and assert the result equals `returns`.
 * The index generator serializes `fn.toString()` for agent context.
 *
 * @example
 * ```ts
 * import { East, ArrayType, IntegerType } from "@elaraai/east";
 * import { example } from "@elaraai/east";
 *
 * export const pushToArray = example({
 *     keywords: ["array", "push", "pushLast", "mutation"],
 *     description: "Push items to an array using pushLast",
 *     fn: East.function([], ArrayType(IntegerType), ($) => {
 *         const a = $.let([], ArrayType(IntegerType));
 *         $(a.pushLast(1n));
 *         $(a.pushLast(2n));
 *         return a;
 *     }),
 *     inputs: [],
 *     returns: [1n, 2n],
 * });
 *
 * export const filterArray = example({
 *     keywords: ["array", "filter"],
 *     description: "Filter array elements greater than a threshold",
 *     fn: East.function([ArrayType(IntegerType), IntegerType], ArrayType(IntegerType), ($, items, threshold) => {
 *         return items.filter(($, x) => x.greater(threshold));
 *     }),
 *     inputs: [[1n, 5n, 3n, 8n, 2n], 3n],
 *     returns: [5n, 8n],
 * });
 * ```
 */
export interface ExampleDef<I extends EastType[] = EastType[], O = any> {
    /** Searchable keywords: API names, type names, concepts */
    keywords: string[];
    /** Human-readable description of what this example demonstrates */
    description: string;
    /** The East function expression — an East.function() or East.asyncFunction() call */
    fn: CallableFunctionExpr<I, O> | CallableAsyncFunctionExpr<I, O>;
    /** Default input values for testing */
    inputs: { [K in keyof I]: SubtypeExprOrValue<I[K]> };
    /** Expected return value when called with inputs */
    returns?: SubtypeExprOrValue<O>;
}

/**
 * Creates an example definition. Identity function that provides
 * type checking and marks the export for index generation.
 */
export function example<const I extends any[], O>(
    def: ExampleDef<I, O>
): ExampleDef<I, O> {
    return def;
}