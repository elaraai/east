/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import type { AST } from "../ast.js";
import { get_location } from "../location.js";
import { BooleanType, NeverType, StringType, TypeUnion, VariantType } from "../types.js";
import type { BlockBuilder } from "./block.js";
import { Expr, type ToExpr } from "./expr.js";
import type { ExprType, TypeOf } from "./types.js";

/**
 * Expression representing variant (sum type/tagged union) values.
 *
 * VariantExpr provides methods for working with discriminated unions, allowing type-safe
 * pattern matching and case analysis. Variants consist of a tag (case name) and an associated
 * value. Common patterns include Option types (some/none) and Result types (ok/error).
 *
 * @typeParam Cases - Record type mapping case names to their associated value types
 *
 * @remarks
 * Variants are typically deconstructed using `Expr.match()` for exhaustive pattern matching,
 * or using the helper methods `getTag()`, `hasTag()`, and `unwrap()` for specific operations.
 *
 * @example
 * ```ts
 * // Define an Option type (variant with some/none cases)
 * const OptionType = VariantType({ some: IntegerType, none: NullType });
 *
 * // Pattern matching with Expr.match
 * const getOrDefault = East.function([OptionType, IntegerType], IntegerType, ($, opt, defaultVal) => {
 *   $.return(Expr.match(opt, {
 *     some: ($, value) => value,
 *     none: ($, _) => defaultVal
 *   }));
 * });
 * const compiled = East.compile(getOrDefault.toIR(), []);
 * compiled(Expr.variant("some", 42n), 0n);   // 42n
 * compiled(Expr.variant("none", null), 0n);  // 0n
 * ```
 *
 * @example
 * ```ts
 * // Using helper methods
 * const checkSome = East.function([OptionType], BooleanType, ($, opt) => {
 *   $.return(opt.hasTag("some"));
 * });
 * const compiled = East.compile(checkSome.toIR(), []);
 * compiled(Expr.variant("some", 42n));  // true
 * compiled(Expr.variant("none", null)); // false
 * ```
 */
export class VariantExpr<Cases extends Record<string, any>> extends Expr<VariantType<Cases>> {
  constructor(private cases: Cases, ast: AST, factory: ToExpr) {
    super(ast.type as VariantType<Cases>, ast, factory);
  }

  /**
   * Returns the case tag (discriminant) of the variant as a string.
   *
   * @returns A StringExpr containing the tag name of this variant
   *
   * @example
   * ```ts
   * const ResultType = VariantType({ ok: IntegerType, error: StringType });
   *
   * const getTag = East.function([ResultType], StringType, ($, result) => {
   *   $.return(result.getTag());
   * });
   * const compiled = East.compile(getTag.toIR(), []);
   * compiled(Expr.variant("ok", 42n));        // "ok"
   * compiled(Expr.variant("error", "fail"));  // "error"
   * ```
   */
  getTag(): ExprType<StringType> {
    const handlers = Object.fromEntries(Object.keys(this.cases).map(caseName => [caseName, () => caseName] as const)) as Record<keyof Cases, () => string>;
    return Expr.match(this, handlers);
  }

  /**
   * Checks if the variant has a specific case tag.
   *
   * @param name - The case name to check for
   * @returns A BooleanExpr that is true if the variant has the specified tag
   *
   * @see {@link unwrap} to extract the value associated with a case
   * @see {@link getTag} to get the tag as a string
   *
   * @example
   * ```ts
   * const OptionType = VariantType({ some: IntegerType, none: NullType });
   *
   * const isSome = East.function([OptionType], BooleanType, ($, opt) => {
   *   $.return(opt.hasTag("some"));
   * });
   * const compiled = East.compile(isSome.toIR(), []);
   * compiled(Expr.variant("some", 42n));   // true
   * compiled(Expr.variant("none", null));  // false
   * ```
   */
  hasTag(name: keyof Cases): ExprType<BooleanType> {
    const handlers = Object.fromEntries(Object.keys(this.cases).map(caseName => [caseName, () => name === caseName] as const)) as Record<keyof Cases, () => boolean>;
    return Expr.match(this, handlers);
  }

  /**
   * Unwraps the variant to extract the value associated with a specific case.
   *
   * @typeParam Case - The case name to unwrap
   * @typeParam F - Type of the fallback function for other cases
   * @param name - The case name to unwrap (defaults to "some" for Option types)
   * @param onOther - Optional function to handle when the variant doesn't match the specified case
   * @returns The value associated with the case, or the result of onOther if provided
   *
   * @throws East runtime error if the variant doesn't match and no onOther is provided
   *
   * @remarks
   * This is a convenience method for extracting values from variants without full pattern matching.
   * For exhaustive matching of all cases, use {@link Expr.match} instead.
   *
   * @example
   * ```ts
   * const OptionType = VariantType({ some: IntegerType, none: NullType });
   *
   * // Unwrap with default value
   * const getOrDefault = East.function([OptionType], IntegerType, ($, opt) => {
   *   $.return(opt.unwrap("some", () => -1n));  // Return -1n if none
   * });
   * const compiled = East.compile(getOrDefault.toIR(), []);
   * compiled(Expr.variant("some", 42n));   // 42n
   * compiled(Expr.variant("none", null));  // -1n
   * ```
   *
   * @example
   * ```ts
   * // Unwrap without fallback (throws on wrong case)
   * const unsafeUnwrap = East.function([OptionType], IntegerType, ($, opt) => {
   *   $.return(opt.unwrap("some"));  // Throws error if none
   * });
   * const compiled = East.compile(unsafeUnwrap.toIR(), []);
   * compiled(Expr.variant("some", 42n));  // 42n
   * // compiled(Expr.variant("none", null)) would throw error
   * ```
   */
  unwrap<Case extends keyof Cases, F extends ($: BlockBuilder<NeverType>) => any>(name: Case, onOther: F): ExprType<TypeUnion<Cases[Case], TypeOf<ReturnType<F>>>>
  unwrap<Case extends keyof Cases>(name: Case): ExprType<Cases[Case]>
  unwrap(): "some" extends keyof Cases ? ExprType<Cases["some"]> : ExprType<NeverType>
  unwrap(name: string = "some", onOther: ($: BlockBuilder<NeverType>) => any = ($) => $.error(`Variant does not have case ${String(name)}`, get_location(2))): Expr {
    if (onOther === undefined) {
      onOther = $ => $.error(`Variant does not have case ${String(name)}`, get_location(2)) as any; // expression-based error should use parent call location
    }
    const handlers = Object.fromEntries(Object.keys(this.cases).map(caseName => [caseName, caseName === name ? (_$: BlockBuilder<NeverType>, data: any) => data : ($: BlockBuilder<NeverType>, _data: any) => onOther($)] as const)) as Record<keyof Cases, () => any>;
    return Expr.match(this, handlers) as any;
  }
}