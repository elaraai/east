/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import { VectorType, FloatType, IntegerType, type EastType, ArrayType } from "../../types.js";
import { AstSymbol, Expr, TypeSymbol } from "../expr.js";
import type { SubtypeExprOrValue } from "../types.js";
import type { VectorExpr } from "../vector.js";

export default {
  zeros(length: Expr<typeof IntegerType> | bigint): VectorExpr<typeof FloatType> {
    const len = Expr.from(length, IntegerType);
    return Expr.fromAst({
      ast_type: "Builtin", type: VectorType(FloatType), builtin: "VectorZeros",
      type_parameters: [FloatType], arguments: [len[AstSymbol]], location: len[AstSymbol].location,
    }) as any;
  },

  ones(length: Expr<typeof IntegerType> | bigint): VectorExpr<typeof FloatType> {
    const len = Expr.from(length, IntegerType);
    return Expr.fromAst({
      ast_type: "Builtin", type: VectorType(FloatType), builtin: "VectorOnes",
      type_parameters: [FloatType], arguments: [len[AstSymbol]], location: len[AstSymbol].location,
    }) as any;
  },

  fill<T extends EastType>(length: Expr<typeof IntegerType> | bigint, value: SubtypeExprOrValue<T>): VectorExpr<T> {
    const len = Expr.from(length, IntegerType);
    const val = Expr.from(value as any, undefined as any);
    const elemType = val[TypeSymbol];
    return Expr.fromAst({
      ast_type: "Builtin", type: VectorType(elemType), builtin: "VectorFill",
      type_parameters: [elemType as EastType], arguments: [len[AstSymbol], val[AstSymbol]], location: len[AstSymbol].location,
    }) as any;
  },

  fromArray<T extends EastType>(arr: Expr<ArrayType<T>>): VectorExpr<T> {
    const arrAst = Expr.ast(arr);
    const elemType = (arrAst.type as ArrayType).value;
    return Expr.fromAst({
      ast_type: "Builtin", type: VectorType(elemType), builtin: "VectorFromArray",
      type_parameters: [elemType as EastType], arguments: [arrAst], location: arrAst.location,
    }) as any;
  },
};
