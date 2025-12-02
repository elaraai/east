/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import { type ValueTypeOf } from "./types.js";
import type { FunctionIR } from "./ir.js";
import { compile_internal, ReturnException } from "./compile.js";
import type { PlatformFunction } from "./platform.js";
import { analyzeIR } from "./analyze.js";

/** A helper class wrapping East's "intermediate representation" (IR) for a free function.
 * The IR can be serialized and saved, or compiled so that the function can be executed.
 */
export class EastIR<Inputs extends any[], Output extends any> {
  constructor(public ir: FunctionIR) {
    if (ir.type !== "Function") {
      throw new Error(`Expected function expressions, got a ${ir.type}`)
    }
    if (ir.value.captures.length !== 0) {
      throw new Error(`Expected free function, without captured variables`)
    }
  }

  /** Compile the function for execution in JavaScript using a closure-compiler technique.
   * Platform functions must be provided for the function to evaluate.
   *
   * This method is for synchronous platforms only. Use compileAsync() if any platform function is async.
   * @throws {Error} if any platform function is async
   */
  compile(platform: PlatformFunction[]): (...inputs: { [K in keyof Inputs]: ValueTypeOf<Inputs[K]> }) => ValueTypeOf<Output> {
    // Check that no platform functions are async
    if (platform.some(fn => fn.type === 'async')) {
      throw new Error(
        `Cannot use compile() with async platform functions: ${platform.map(f => f.name).join(', ')}. ` +
        `Use compileAsync() instead.`
      );
    }

    // Analyse the IR
    const analyzed_ir = analyzeIR(this.ir, platform, {});

    // compile the function (with no variables in environment)
    const platformFns = Object.fromEntries(platform.map(fn => [fn.name, fn.fn]));
    const asyncPlatformFns = new Set<string>();

    const compiled_expr = compile_internal(analyzed_ir, {}, platformFns, asyncPlatformFns);

    // instantiate the function (with no environment)
    const instantiated_function = compiled_expr({});

    // Return sync wrapper
    return (...inputs: any[]) => {
      try {
        return instantiated_function(...inputs)
      } catch (e: unknown) {
        if (e instanceof ReturnException) {
          return e.value;
        } else {
          throw e;
        }
      }
    };
  }

  /** Compile the function for execution in JavaScript using a closure-compiler technique.
   * Platform functions must be provided for the function to evaluate.
   *
   * This method is for platforms with async functions. Use compile() if all platform functions are sync.
   * @throws {Error} if no platform functions are async
   */
  compileAsync(platform: PlatformFunction[]): (...inputs: { [K in keyof Inputs]: ValueTypeOf<Inputs[K]> }) => Promise<ValueTypeOf<Output>> {
    // Check that at least one platform function is async
    if (!platform.some(fn => fn.type === 'async')) {
      throw new Error(
        `No async platform functions found. Use compile() instead of compileAsync() for better performance.`
      );
    }

    // Analyse the IR
    const analyzed_ir = analyzeIR(this.ir, platform, {});

    // compile the function (with no variables in environment)
    const platformFns = Object.fromEntries(platform.map(fn => [fn.name, fn.fn]));
    const asyncPlatformFns = new Set(
      platform.filter(fn => fn.type === 'async').map(fn => fn.name)
    );

    const compiled_expr = compile_internal(analyzed_ir, {}, platformFns, asyncPlatformFns);

    // instantiate the function (with no environment)
    const instantiated_function = compiled_expr({});

    // Return async wrapper
    return async (...inputs: any[]) => {
      try {
        return await instantiated_function(...inputs)
      } catch (e: unknown) {
        if (e instanceof ReturnException) {
          return e.value;
        } else {
          throw e;
        }
      }
    };
  }
}
