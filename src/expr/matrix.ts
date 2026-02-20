/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import type { AST } from "../ast.js";
import { get_location } from "../location.js";
import { IntegerType, VectorType, MatrixType, NullType, FunctionType, ArrayType, type EastType, type NeverType, isSubtype, printType, isTypeEqual } from "../types.js";
import { valueOrExprToAstTyped } from "./ast.js";
import type { IntegerExpr } from "./integer.js";
import type { NullExpr } from "./null.js";
import { AstSymbol, Expr, FactorySymbol, TypeSymbol, type ToExpr } from "./expr.js";
import type { SubtypeExprOrValue, ExprType } from "./types.js";
import type { VectorExpr } from "./vector.js";
import type { ArrayExpr } from "./array.js";
import type { BlockBuilder } from "./block.js";

/**
 * Expression representing mutable matrix (2D typed array) values and operations.
 *
 * MatrixExpr provides methods for matrix manipulation including element access,
 * mutation, row/column access, transpose, and conversion. Matrices are backed by
 * contiguous typed arrays in row-major order for efficient numeric computation
 * and zero-copy interop with ML libraries.
 */
export class MatrixExpr<T extends any> extends Expr<MatrixType<T>> {
  constructor(private element_type: T, ast: AST, createExpr: ToExpr) {
    super(ast.type as MatrixType<T>, ast, createExpr);
  }

  /**
   * Returns the number of rows in the matrix.
   *
   * @returns An IntegerExpr representing the number of rows
   */
  rows(): IntegerExpr {
    return this[FactorySymbol]({
      ast_type: "Builtin",
      type: IntegerType,
      location: get_location(),
      builtin: "MatrixRows",
      type_parameters: [this.element_type as EastType],
      arguments: [this[AstSymbol]],
    }) as IntegerExpr;
  }

  /**
   * Returns the number of columns in the matrix.
   *
   * @returns An IntegerExpr representing the number of columns
   */
  cols(): IntegerExpr {
    return this[FactorySymbol]({
      ast_type: "Builtin",
      type: IntegerType,
      location: get_location(),
      builtin: "MatrixCols",
      type_parameters: [this.element_type as EastType],
      arguments: [this[AstSymbol]],
    }) as IntegerExpr;
  }

  /**
   * Gets the element at the specified row and column.
   *
   * @param row - The zero-based row index
   * @param col - The zero-based column index
   * @returns An expression of the element type
   *
   * @throws East runtime error if the indices are out of bounds
   */
  get(row: SubtypeExprOrValue<IntegerType>, col: SubtypeExprOrValue<IntegerType>): ExprType<T> {
    const r = valueOrExprToAstTyped(row, IntegerType);
    const c = valueOrExprToAstTyped(col, IntegerType);
    return this[FactorySymbol]({
      ast_type: "Builtin",
      type: this.element_type as EastType,
      location: get_location(),
      builtin: "MatrixGet",
      type_parameters: [this.element_type as EastType],
      arguments: [this[AstSymbol], r, c],
    }) as ExprType<T>;
  }

  /**
   * Sets the element at the specified row and column (mutates the matrix).
   *
   * @param row - The zero-based row index
   * @param col - The zero-based column index
   * @param value - The value to set
   * @returns NullExpr (operation performed for side effect)
   *
   * @throws East runtime error if the indices are out of bounds
   */
  set(row: SubtypeExprOrValue<IntegerType>, col: SubtypeExprOrValue<IntegerType>, value: SubtypeExprOrValue<T>): NullExpr {
    const r = valueOrExprToAstTyped(row, IntegerType);
    const c = valueOrExprToAstTyped(col, IntegerType);
    const v = valueOrExprToAstTyped(value, this.element_type as EastType);
    return this[FactorySymbol]({
      ast_type: "Builtin",
      type: NullType,
      location: get_location(),
      builtin: "MatrixSet",
      type_parameters: [this.element_type as EastType],
      arguments: [this[AstSymbol], r, c, v],
    }) as NullExpr;
  }

  /**
   * Gets a row as a vector (returns a copy).
   *
   * @param row - The zero-based row index
   * @returns A VectorExpr containing the row elements
   *
   * @throws East runtime error if the row index is out of bounds
   */
  getRow(row: SubtypeExprOrValue<IntegerType>): VectorExpr<T> {
    const r = valueOrExprToAstTyped(row, IntegerType);
    return this[FactorySymbol]({
      ast_type: "Builtin",
      type: VectorType(this.element_type as EastType),
      location: get_location(),
      builtin: "MatrixGetRow",
      type_parameters: [this.element_type as EastType],
      arguments: [this[AstSymbol], r],
    }) as any;
  }

  /**
   * Gets a column as a vector (returns a copy).
   *
   * @param col - The zero-based column index
   * @returns A VectorExpr containing the column elements
   *
   * @throws East runtime error if the column index is out of bounds
   */
  getCol(col: SubtypeExprOrValue<IntegerType>): VectorExpr<T> {
    const c = valueOrExprToAstTyped(col, IntegerType);
    return this[FactorySymbol]({
      ast_type: "Builtin",
      type: VectorType(this.element_type as EastType),
      location: get_location(),
      builtin: "MatrixGetCol",
      type_parameters: [this.element_type as EastType],
      arguments: [this[AstSymbol], c],
    }) as any;
  }

  /**
   * Returns the transpose of this matrix.
   *
   * @returns A new MatrixExpr with rows and columns swapped
   */
  transpose(): MatrixExpr<T> {
    return this[FactorySymbol]({
      ast_type: "Builtin",
      type: MatrixType(this.element_type as EastType),
      location: get_location(),
      builtin: "MatrixTranspose",
      type_parameters: [this.element_type as EastType],
      arguments: [this[AstSymbol]],
    }) as MatrixExpr<T>;
  }

  /**
   * Flattens this matrix into a vector (row-major order).
   *
   * @returns A VectorExpr containing all matrix elements in row-major order
   */
  toVector(): VectorExpr<T> {
    return this[FactorySymbol]({
      ast_type: "Builtin",
      type: VectorType(this.element_type as EastType),
      location: get_location(),
      builtin: "MatrixToVector",
      type_parameters: [this.element_type as EastType],
      arguments: [this[AstSymbol]],
    }) as any;
  }

  /**
   * Converts this matrix to a nested Array of Arrays.
   *
   * @returns An ArrayExpr of ArrayExprs containing the matrix elements
   */
  toArray(): ArrayExpr<ArrayType<T>> {
    return this[FactorySymbol]({
      ast_type: "Builtin",
      type: ArrayType(ArrayType(this.element_type as EastType)),
      location: get_location(),
      builtin: "MatrixToArray",
      type_parameters: [this.element_type as EastType],
      arguments: [this[AstSymbol]],
    }) as any;
  }

  /**
   * Converts this matrix to an Array of row Vectors.
   *
   * @returns An ArrayExpr of VectorExprs, one per row
   */
  toRows(): ArrayExpr<VectorType<T>> {
    return this[FactorySymbol]({
      ast_type: "Builtin",
      type: ArrayType(VectorType(this.element_type as EastType)),
      location: get_location(),
      builtin: "MatrixToRows",
      type_parameters: [this.element_type as EastType],
      arguments: [this[AstSymbol]],
    }) as any;
  }

  /**
   * Maps a function over each row vector and its index, producing a new matrix.
   *
   * @param fn - Function taking (row_vector, row_index) and returning a new row vector
   * @returns A new MatrixExpr with the mapped row vectors
   */
  mapRows<T2>(fn: Expr<FunctionType<[VectorType<T>, IntegerType], VectorType<T2>>>): MatrixExpr<T2>;
  mapRows<F extends (($: BlockBuilder<NeverType>, row: VectorExpr<T>, idx: ExprType<IntegerType>) => VectorExpr<any>)>(fn: F): MatrixExpr<ReturnType<F> extends VectorExpr<infer U> ? U : never>;
  mapRows(fn: Expr<FunctionType> | (($: BlockBuilder<NeverType>, row: VectorExpr<T>, idx: ExprType<IntegerType>) => any)): Expr<MatrixType> {
    if (fn instanceof Expr) {
      if (!(fn[TypeSymbol] && fn[TypeSymbol].type === "Function")) {
        throw new Error("Expected a Function expression");
      }
      const fnType = fn[TypeSymbol] as FunctionType<any[], any>;
      const output_type = fnType.output as EastType;
      if (fnType.inputs.length !== 2) {
        throw new Error(`Expected Function to have 2 inputs, got ${fnType.inputs.length} inputs`);
      }
      if (!isSubtype(VectorType(this.element_type as EastType), fnType.inputs[0] as EastType)) {
        throw new Error(`Expected Function first input to be ${printType(VectorType(this.element_type as EastType))}, got ${printType(fnType.inputs[0] as EastType)}`);
      }
      if (!isTypeEqual(IntegerType, fnType.inputs[1] as EastType)) {
        throw new Error(`Expected Function second input to be ${printType(IntegerType)}, got ${printType(fnType.inputs[1] as EastType)}`);
      }
      // output_type is VectorType<T2>, extract T2 for the result MatrixType
      const result_elem_type = (output_type as VectorType).element;
      return this[FactorySymbol]({
        ast_type: "Builtin",
        type: MatrixType(result_elem_type),
        location: get_location(),
        builtin: "MatrixMapRows",
        type_parameters: [this.element_type as EastType, result_elem_type],
        arguments: [this[AstSymbol], fn[AstSymbol]],
      });
    } else {
      const functionExpr = Expr.function([VectorType(this.element_type as EastType), IntegerType], undefined, fn as any);
      return this.mapRows(functionExpr as unknown as Expr<FunctionType<[VectorType<T>, IntegerType], VectorType<any>>>);
    }
  }
}
