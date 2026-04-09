/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import type { AST } from "../ast.js";
import { ast_to_ir } from "../ast_to_ir.js";
import { AsyncEastIR } from "../eastir.js";
import type { AsyncFunctionIR, IR } from "../ir.js";
import { get_location } from "../location.js";
import { AsyncFunctionType, NeverType, type EastType } from "../types.js";
import { valueOrExprToAstTyped } from "./ast.js";
import { Module } from "./block.js";
import { AstSymbol, Expr, FactorySymbol, type ToExpr } from "./expr.js";
import type { ExprType, SubtypeExprOrValue } from "./types.js";

/**
* Expression representing the AsyncFunction type.
* Used for async function calls, composition, etc.
*/
export class AsyncFunctionExpr<I extends any[], O extends any> extends Expr<AsyncFunctionType<I, O>> {
  constructor(private input_types: I, private output_type: O, ast: AST, createExpr: ToExpr) {
    super(ast.type as AsyncFunctionType<I, O>, ast, createExpr);
  }
  
  /** Call the async function with the given arguments (awaiting the result eagerly).
   * 
   * Note that {@link CallableAsyncFunctionExpr} provides a more ergonomic way to call async functions.
   * 
   * @internal */
  call(...args: { [K in keyof I]: SubtypeExprOrValue<I[K]> }): ExprType<O> {
    if (args.length !== this.input_types.length) {
      throw new Error(`Expected ${this.input_types.length} arguments, got ${args.length}`);
    }

    const inputs = this.input_types.map((input_type: EastType, i) => valueOrExprToAstTyped(args[i], input_type));
    
    return this[FactorySymbol]({
      ast_type: "CallAsync",
      type: this.output_type as EastType,
      location: get_location(),
      function: this[AstSymbol],
      arguments: inputs,
    }) as ExprType<O>;
  }
  
  /** Convert the function to East's "intermediate representation" (IR). This can then be serialized or compiled.
  * 
  * Note that the function must be a "free" function, with no captures.
  */
  toIR(symbols?: Map<string, IR>): AsyncEastIR<I, O> {
    const imports = new Set<Module>();
    const ir = ast_to_ir(this[AstSymbol], {
      local_ctx: new Map(),
      parent_ctx: new Map(),
      captures: new Set(),
      loop_ctx: new Map(),
      exports: new Map(),
      imports,
      n_vars: 0,
      n_loops: 0,
      inputs: [],
      output: NeverType,
      async: false,
    }) as AsyncFunctionIR;

    if (symbols) {
      // Currently we don't support tree shaking
      // We just include all the symbols of all the modules that are transitively imported by this function
      for (const module of imports) {
        for (const [symbol_name, symbol_ir] of Object.entries(Module.symbols(module))) {
          if (symbols.has(symbol_name)) {
            throw new Error(`Duplicate symbol name ${symbol_name} in module ${module.name}`);
          }
          symbols.set(symbol_name, symbol_ir);
        }
      }
    }

    return new AsyncEastIR(ir);
  }
}

/** 
 * Expression representing the AsyncFunction type.
 * Used for async function calls, composition, etc.
 * 
 * Supports direct calling of functions using `f(x, y)` syntax instead using a method, like `f.call(x, y)`.
 * Awaiting the result is handled automatically.
 */
export type CallableAsyncFunctionExpr<I extends any[], O> = AsyncFunctionExpr<I, O> & ((...args: { [K in keyof I]: SubtypeExprOrValue<I[K]> }) => ExprType<O>);

/**
 * Factory producing a callable AsyncFunctionExpr so users can invoke it directly.
 * Prototype chain preserved for instanceof checks.
 * 
 * @internal
 */
export function createAsyncFunctionExpr<I extends any[], O extends any>(
  input_types: I,
  output_type: O,
  ast: AST,
  createExpr: ToExpr
): CallableAsyncFunctionExpr<I, O> {
  const inst = new AsyncFunctionExpr<I, O>(input_types, output_type, ast, createExpr);
  const callable = function (...args: { [K in keyof I]: SubtypeExprOrValue<I[K]> }): ExprType<O> {
    return inst.call(...(args as any));
  } as unknown as CallableAsyncFunctionExpr<I, O>;
  Object.setPrototypeOf(callable, inst);
  return callable;
}
