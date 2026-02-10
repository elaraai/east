/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import type { AST } from "../ast.js";
import { get_location } from "../location.js";
import { IntegerType, VectorType, MatrixType, NullType, FunctionType, ArrayType, type EastType, type NeverType, isSubtype, printType, isTypeEqual } from "../types.js";
import { valueOrExprToAst, valueOrExprToAstTyped } from "./ast.js";
import type { IntegerExpr } from "./integer.js";
import type { NullExpr } from "./null.js";
import { AstSymbol, Expr, FactorySymbol, TypeSymbol, type ToExpr } from "./expr.js";
import type { SubtypeExprOrValue, ExprType, TypeOf } from "./types.js";
import type { BlockBuilder } from "./block.js";
import type { ArrayExpr } from "./array.js";
import type { MatrixExpr } from "./matrix.js";

/**
 * Expression representing mutable vector (1D typed array) values and operations.
 *
 * VectorExpr provides methods for vector manipulation including element access,
 * mutation, slicing, concatenation, conversion, and higher-order operations.
 * Vectors are backed by contiguous typed arrays (Float64Array, BigInt64Array,
 * or Uint8Array) for efficient numeric computation and zero-copy interop
 * with ML libraries.
 */
export class VectorExpr<T extends any> extends Expr<VectorType<T>> {
  constructor(private element_type: T, ast: AST, createExpr: ToExpr) {
    super(ast.type as VectorType<T>, ast, createExpr);
  }

  /**
   * Returns the number of elements in the vector.
   *
   * @returns An IntegerExpr representing the length
   */
  length(): IntegerExpr {
    return this[FactorySymbol]({
      ast_type: "Builtin",
      type: IntegerType,
      location: get_location(),
      builtin: "VectorLength",
      type_parameters: [this.element_type as EastType],
      arguments: [this[AstSymbol]],
    }) as IntegerExpr;
  }

  /**
   * Gets the element at the specified index.
   *
   * @param index - The zero-based index to access
   * @returns An expression of the element type
   *
   * @throws East runtime error if the index is out of bounds
   */
  get(index: SubtypeExprOrValue<IntegerType>): ExprType<T> {
    const idx = valueOrExprToAstTyped(index, IntegerType);
    return this[FactorySymbol]({
      ast_type: "Builtin",
      type: this.element_type as EastType,
      location: get_location(),
      builtin: "VectorGet",
      type_parameters: [this.element_type as EastType],
      arguments: [this[AstSymbol], idx],
    }) as ExprType<T>;
  }

  /**
   * Sets the element at the specified index (mutates the vector).
   *
   * @param index - The zero-based index to set
   * @param value - The new value to store at that index
   * @returns NullExpr (operation performed for side effect)
   *
   * @throws East runtime error if the index is out of bounds
   */
  set(index: SubtypeExprOrValue<IntegerType>, value: SubtypeExprOrValue<T>): NullExpr {
    const idx = valueOrExprToAstTyped(index, IntegerType);
    const val = valueOrExprToAstTyped(value, this.element_type as EastType);
    return this[FactorySymbol]({
      ast_type: "Builtin",
      type: NullType,
      location: get_location(),
      builtin: "VectorSet",
      type_parameters: [this.element_type as EastType],
      arguments: [this[AstSymbol], idx, val],
    }) as NullExpr;
  }

  /**
   * Returns a new vector containing elements from start (inclusive) to end (exclusive).
   *
   * @param start - The start index (inclusive)
   * @param end - The end index (exclusive)
   * @returns A new VectorExpr containing the sliced elements
   *
   * @throws East runtime error if indices are out of bounds
   */
  slice(start: SubtypeExprOrValue<IntegerType>, end: SubtypeExprOrValue<IntegerType>): VectorExpr<T> {
    const s = valueOrExprToAstTyped(start, IntegerType);
    const e = valueOrExprToAstTyped(end, IntegerType);
    return this[FactorySymbol]({
      ast_type: "Builtin",
      type: VectorType(this.element_type as EastType),
      location: get_location(),
      builtin: "VectorSlice",
      type_parameters: [this.element_type as EastType],
      arguments: [this[AstSymbol], s, e],
    }) as VectorExpr<T>;
  }

  /**
   * Concatenates this vector with another vector of the same element type.
   *
   * @param other - The other vector to concatenate
   * @returns A new VectorExpr containing elements from both vectors
   */
  concat(other: Expr<VectorType<T>>): VectorExpr<T> {
    return this[FactorySymbol]({
      ast_type: "Builtin",
      type: VectorType(this.element_type as EastType),
      location: get_location(),
      builtin: "VectorConcat",
      type_parameters: [this.element_type as EastType],
      arguments: [this[AstSymbol], Expr.ast(other)],
    }) as VectorExpr<T>;
  }

  /**
   * Converts this vector to an Array.
   *
   * @returns An ArrayExpr containing the same elements
   */
  toArray(): ArrayExpr<T> {
    return this[FactorySymbol]({
      ast_type: "Builtin",
      type: ArrayType(this.element_type as EastType),
      location: get_location(),
      builtin: "VectorToArray",
      type_parameters: [this.element_type as EastType],
      arguments: [this[AstSymbol]],
    }) as ArrayExpr<T>;
  }

  /**
   * Reshapes this vector into a matrix with the specified dimensions.
   * Requires rows * cols == length of the vector.
   *
   * @param rows - The number of rows in the resulting matrix
   * @param cols - The number of columns in the resulting matrix
   * @returns A MatrixExpr with the specified shape
   *
   * @throws East runtime error if rows * cols does not equal the vector length
   */
  toMatrix(rows: SubtypeExprOrValue<IntegerType>, cols: SubtypeExprOrValue<IntegerType>): MatrixExpr<T> {
    const r = valueOrExprToAstTyped(rows, IntegerType);
    const c = valueOrExprToAstTyped(cols, IntegerType);
    return this[FactorySymbol]({
      ast_type: "Builtin",
      type: MatrixType(this.element_type as EastType),
      location: get_location(),
      builtin: "VectorToMatrix",
      type_parameters: [this.element_type as EastType],
      arguments: [this[AstSymbol], r, c],
    }) as any;
  }

  /**
   * Maps a function over each element and its index, producing a new vector.
   *
   * @param fn - Function taking (element, index) and returning a new value
   * @returns A new VectorExpr with the mapped values
   */
  map<T2>(fn: Expr<FunctionType<[T, IntegerType], T2>>): VectorExpr<T2>;
  map<F extends (($: BlockBuilder<NeverType>, v: ExprType<T>, k: ExprType<IntegerType>) => any)>(fn: F): VectorExpr<TypeOf<ReturnType<F>>>;
  map(fn: Expr<FunctionType> | (($: BlockBuilder<NeverType>, x: ExprType<T>, y: ExprType<IntegerType>) => any)): Expr<VectorType> {
    if (fn instanceof Expr) {
      if (!(fn[TypeSymbol] && fn[TypeSymbol].type === "Function")) {
        throw new Error("Expected a Function expression");
      }
      const output_type = (fn[TypeSymbol] as FunctionType<any[], any>).output as EastType;
      const n_inputs = (fn[TypeSymbol] as FunctionType<any[], any>).inputs.length;
      if (n_inputs === 2) {
        if (!isSubtype(this.element_type as EastType, (fn[TypeSymbol] as FunctionType<any[], any>).inputs[0] as EastType)) {
          throw new Error(`Expected Function input to be ${printType(this.element_type as EastType)}, got ${printType((fn[TypeSymbol] as FunctionType<any[], any>).inputs[0] as EastType)}`);
        }
        if (!isTypeEqual(IntegerType, (fn[TypeSymbol] as FunctionType<any[], any>).inputs[1] as EastType)) {
          throw new Error(`Expected Function second input to be ${printType(IntegerType)}, got ${printType((fn[TypeSymbol] as FunctionType<any[], any>).inputs[1] as EastType)}`);
        }

        return this[FactorySymbol]({
          ast_type: "Builtin",
          type: VectorType(output_type),
          location: get_location(),
          builtin: "VectorMap",
          type_parameters: [this.element_type as EastType, output_type],
          arguments: [this[AstSymbol], fn[AstSymbol]],
        });
      } else {
        throw new Error(`Expected Function to have 2 inputs, got ${n_inputs} inputs`);
      }
    } else {
      const functionExpr = Expr.function([this.element_type, IntegerType], undefined, fn);
      return this.map(functionExpr);
    }
  }

  /**
   * Reduces the vector to a single value using an accumulator function and initial value.
   *
   * @param combineFn - Function taking (accumulator, element, index) and returning the new accumulator value
   * @param init - Initial value for the reduction (determines output type)
   * @returns The final accumulated value
   */
  reduce<T2>(combineFn: SubtypeExprOrValue<FunctionType<[previous: TypeOf<NoInfer<T2>>, value: T, key: IntegerType], TypeOf<NoInfer<T2>>>>, init: T2): ExprType<TypeOf<T2>> {
    const initAst = valueOrExprToAst(init);
    const returnType = initAst.type;

    const combineAst = valueOrExprToAstTyped(combineFn, FunctionType([returnType, this.element_type, IntegerType], returnType));

    return this[FactorySymbol]({
      ast_type: "Builtin",
      type: returnType as EastType,
      location: get_location(),
      builtin: "VectorFold",
      type_parameters: [this.element_type as EastType, returnType as EastType],
      arguments: [this[AstSymbol], initAst, combineAst],
    }) as ExprType<TypeOf<T2>>;
  }
}
