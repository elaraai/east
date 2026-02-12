/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import { VectorType, FloatType, IntegerType, type EastType, ArrayType } from "../../types.js";
import { AstSymbol, Expr, TypeSymbol } from "../expr.js";
import type { SubtypeExprOrValue, TypeOf } from "../types.js";
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

  fill<V extends SubtypeExprOrValue<EastType>>(length: Expr<typeof IntegerType> | bigint, value: V): VectorExpr<TypeOf<V>> {
    const len = Expr.from(length, IntegerType);
    const val = Expr.from(value as any);
    const elemType = val[TypeSymbol];
    return Expr.fromAst({
      ast_type: "Builtin", type: VectorType(elemType), builtin: "VectorFill",
      type_parameters: [elemType as EastType], arguments: [len[AstSymbol], val[AstSymbol]], location: len[AstSymbol].location,
    }) as any;
  },

  fromArray<V extends readonly unknown[] | Expr<ArrayType<EastType>>>(arr: V): VectorExpr<TypeOf<V> extends ArrayType<infer U> ? U : EastType> {
    const arrExpr = Expr.from(arr as any);
    const arrAst = Expr.ast(arrExpr as any);
    const elemType = (arrAst.type as ArrayType).value;
    if (elemType.type !== "Float" && elemType.type !== "Integer" && elemType.type !== "Boolean") {
      throw new Error(`Vector.fromArray requires Float, Integer, or Boolean element type, got ${elemType.type}`);
    }
    return Expr.fromAst({
      ast_type: "Builtin", type: VectorType(elemType), builtin: "VectorFromArray",
      type_parameters: [elemType as EastType], arguments: [arrAst], location: arrAst.location,
    }) as any;
  },
};
