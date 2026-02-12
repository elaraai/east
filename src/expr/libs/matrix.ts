/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import { MatrixType, FloatType, IntegerType, ArrayType, type EastType } from "../../types.js";
import { AstSymbol, Expr, TypeSymbol } from "../expr.js";
import type { SubtypeExprOrValue, TypeOf } from "../types.js";
import type { MatrixExpr } from "../matrix.js";

export default {
  zeros(rows: Expr<typeof IntegerType> | bigint, cols: Expr<typeof IntegerType> | bigint): MatrixExpr<typeof FloatType> {
    const r = Expr.from(rows, IntegerType);
    const c = Expr.from(cols, IntegerType);
    return Expr.fromAst({
      ast_type: "Builtin", type: MatrixType(FloatType), builtin: "MatrixZeros",
      type_parameters: [FloatType], arguments: [r[AstSymbol], c[AstSymbol]], location: r[AstSymbol].location,
    }) as any;
  },

  ones(rows: Expr<typeof IntegerType> | bigint, cols: Expr<typeof IntegerType> | bigint): MatrixExpr<typeof FloatType> {
    const r = Expr.from(rows, IntegerType);
    const c = Expr.from(cols, IntegerType);
    return Expr.fromAst({
      ast_type: "Builtin", type: MatrixType(FloatType), builtin: "MatrixOnes",
      type_parameters: [FloatType], arguments: [r[AstSymbol], c[AstSymbol]], location: r[AstSymbol].location,
    }) as any;
  },

  fill<V extends SubtypeExprOrValue<EastType>>(rows: Expr<typeof IntegerType> | bigint, cols: Expr<typeof IntegerType> | bigint, value: V): MatrixExpr<TypeOf<V>> {
    const r = Expr.from(rows, IntegerType);
    const c = Expr.from(cols, IntegerType);
    const val = Expr.from(value as any);
    const elemType = val[TypeSymbol];
    return Expr.fromAst({
      ast_type: "Builtin", type: MatrixType(elemType), builtin: "MatrixFill",
      type_parameters: [elemType as EastType], arguments: [r[AstSymbol], c[AstSymbol], val[AstSymbol]], location: r[AstSymbol].location,
    }) as any;
  },

  fromArray<V extends readonly unknown[] | Expr<ArrayType<EastType>>>(arr: V): MatrixExpr<TypeOf<V> extends ArrayType<ArrayType<infer U>> ? U : EastType> {
    const arrExpr = Expr.from(arr as any);
    const arrAst = Expr.ast(arrExpr as any);
    const innerType = (arrAst.type as ArrayType).value as ArrayType;
    const elemType = innerType.value;
    if (elemType.type !== "Float" && elemType.type !== "Integer" && elemType.type !== "Boolean") {
      throw new Error(`Matrix.fromArray requires Float, Integer, or Boolean element type, got ${elemType.type}`);
    }
    return Expr.fromAst({
      ast_type: "Builtin", type: MatrixType(elemType), builtin: "MatrixFromArray",
      type_parameters: [elemType as EastType], arguments: [arrAst], location: arrAst.location,
    }) as any;
  },
};
