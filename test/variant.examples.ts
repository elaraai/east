/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import { East, Expr, IntegerType, NullType, OptionType, VariantType, BooleanType, StringType, variant, example } from "@elaraai/east";

// ---------------------------------------------------------------------------
// Variant Creation
// ---------------------------------------------------------------------------

export const variantCreate = example({
    keywords: ["variant", "VariantType", "ifElse", "create", "option"],
    description: "Create a variant value via conditional branching",
    fn: East.function([], OptionType(IntegerType), ($) => {
        return East.value(true).ifElse(_$ => variant("some", 42n), _$ => variant("none", null));
    }),
    inputs: [],
    returns: variant("some", 42n),
});

// ---------------------------------------------------------------------------
// Match Statement Forms
// ---------------------------------------------------------------------------

export const variantMatchStatement = example({
    keywords: ["variant", "VariantType", "match", "statement", "pattern"],
    description: "Match on a variant using the $.match statement form",
    fn: East.function([], IntegerType, ($) => {
        const v = $.const(variant("some", 42n), OptionType(IntegerType));
        const ret = $.let(0n);
        $.match(v, {
            some: ($, data) => $.assign(ret, data),
        });
        return ret;
    }),
    inputs: [],
    returns: 42n,
});

export const variantMatchTagStatement = example({
    keywords: ["variant", "VariantType", "matchTag", "statement", "single"],
    description: "Match a single tag using the $.matchTag statement form",
    fn: East.function([], IntegerType, ($) => {
        const v = $.const(variant("some", 42n), OptionType(IntegerType));
        const ret = $.let(0n);
        $.matchTag(v, "some", ($, data) => $.assign(ret, data));
        return ret;
    }),
    inputs: [],
    returns: 42n,
});

// ---------------------------------------------------------------------------
// Match Expression Forms
// ---------------------------------------------------------------------------

export const variantExprMatch = example({
    keywords: ["variant", "VariantType", "Expr.match", "expression", "pattern"],
    description: "Match on a variant using the Expr.match expression form",
    fn: East.function([], IntegerType, ($) => {
        const v = $.const(variant("some", 42n), OptionType(IntegerType));
        return Expr.match(v, { some: ($, data) => data, none: () => 0n });
    }),
    inputs: [],
    returns: 42n,
});

export const variantMatchTagExpr = example({
    keywords: ["variant", "VariantType", "matchTag", "expression", "default"],
    description: "Match a single tag as an expression with a default",
    fn: East.function([], IntegerType, ($) => {
        const v = $.const(variant("some", 42n), OptionType(IntegerType));
        return v.matchTag("some", (_$, val) => val, _$ => 0n);
    }),
    inputs: [],
    returns: 42n,
});

export const variantMatchPartial = example({
    keywords: ["variant", "VariantType", "match", "partial", "default"],
    description: "Partial match on a variant with a default for unhandled tags",
    fn: East.function([], IntegerType, ($) => {
        const v = $.const(variant("none", null), OptionType(IntegerType));
        return v.match({ some: (_$, val) => val }, _$ => 0n);
    }),
    inputs: [],
    returns: 0n,
});

export const variantMatchExhaustive = example({
    keywords: ["variant", "VariantType", "match", "exhaustive", "complete"],
    description: "Exhaustive match handling all variant tags",
    fn: East.function([], IntegerType, ($) => {
        const v = $.const(variant("some", 42n), OptionType(IntegerType));
        return v.match({ some: (_$, val) => val, none: _$ => 0n });
    }),
    inputs: [],
    returns: 42n,
});

// ---------------------------------------------------------------------------
// Tag Inspection
// ---------------------------------------------------------------------------

export const variantGetTag = example({
    keywords: ["variant", "VariantType", "getTag", "tag", "inspect"],
    description: "Get the tag name of a variant value",
    fn: East.function([], StringType, ($) => {
        const v = $.const(variant("some", 42n), OptionType(IntegerType));
        return v.getTag();
    }),
    inputs: [],
    returns: "some",
});

export const variantHasTag = example({
    keywords: ["variant", "VariantType", "hasTag", "tag", "check"],
    description: "Check if a variant has a specific tag",
    fn: East.function([], BooleanType, ($) => {
        const v = $.const(variant("some", 42n), OptionType(IntegerType));
        return v.hasTag("some");
    }),
    inputs: [],
    returns: true,
});

// ---------------------------------------------------------------------------
// Unwrap
// ---------------------------------------------------------------------------

export const variantUnwrapWithDefault = example({
    keywords: ["variant", "VariantType", "unwrap", "default", "extract"],
    description: "Unwrap a variant tag with a default if the tag doesn't match",
    fn: East.function([], IntegerType, ($) => {
        const v = $.const(variant("none", null), OptionType(IntegerType));
        return v.unwrap("some", _$ => 0n);
    }),
    inputs: [],
    returns: 0n,
});

export const variantUnwrap = example({
    keywords: ["variant", "VariantType", "unwrap", "extract", "tag"],
    description: "Unwrap a variant tag (throws if tag doesn't match)",
    fn: East.function([], IntegerType, ($) => {
        const v = $.const(variant("some", 42n), OptionType(IntegerType));
        return v.unwrap("some");
    }),
    inputs: [],
    returns: 42n,
});

export const variantUnwrapAuto = example({
    keywords: ["variant", "VariantType", "unwrap", "auto", "option"],
    description: "Auto-unwrap a variant (works for two-tag variants with a null tag)",
    fn: East.function([], IntegerType, ($) => {
        const v = $.const(variant("some", 42n), OptionType(IntegerType));
        return v.unwrap();
    }),
    inputs: [],
    returns: 42n,
});

// ---------------------------------------------------------------------------
// Comparisons
// ---------------------------------------------------------------------------

export const variantEquals = example({
    keywords: ["variant", "VariantType", "equals", "equality", "comparison"],
    description: "Check variant equality with equals",
    fn: East.function([], BooleanType, ($) => {
        const v = $.const(variant("some", 42n), OptionType(IntegerType));
        return v.equals(variant("some", 42n));
    }),
    inputs: [],
    returns: true,
});

export const variantNotEquals = example({
    keywords: ["variant", "VariantType", "notEquals", "inequality", "comparison"],
    description: "Check variant inequality with notEquals",
    fn: East.function([], BooleanType, ($) => {
        const v = $.const(variant("some", 42n), OptionType(IntegerType));
        return v.notEquals(variant("some", 43n));
    }),
    inputs: [],
    returns: true,
});

