/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import { MatrixType, FloatType, IntegerType, ArrayType, type EastType } from "../../types.js";
import { AstSymbol, Expr, TypeSymbol } from "../expr.js";
import type { SubtypeExprOrValue } from "../types.js";
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

  fill<T extends EastType>(rows: Expr<typeof IntegerType> | bigint, cols: Expr<typeof IntegerType> | bigint, value: SubtypeExprOrValue<T>): MatrixExpr<T> {
    const r = Expr.from(rows, IntegerType);
    const c = Expr.from(cols, IntegerType);
    const val = Expr.from(value as any, undefined as any);
    const elemType = val[TypeSymbol];
    return Expr.fromAst({
      ast_type: "Builtin", type: MatrixType(elemType), builtin: "MatrixFill",
      type_parameters: [elemType as EastType], arguments: [r[AstSymbol], c[AstSymbol], val[AstSymbol]], location: r[AstSymbol].location,
    }) as any;
  },

  fromArray<T extends EastType>(arr: Expr<ArrayType<ArrayType<T>>>): MatrixExpr<T> {
    const arrAst = Expr.ast(arr);
    const innerType = (arrAst.type as ArrayType).value as ArrayType;
    const elemType = innerType.value;
    return Expr.fromAst({
      ast_type: "Builtin", type: MatrixType(elemType), builtin: "MatrixFromArray",
      type_parameters: [elemType as EastType], arguments: [arrAst], location: arrAst.location,
    }) as any;
  },
};
