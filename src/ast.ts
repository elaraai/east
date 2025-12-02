/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import { Builtins, type BuiltinName } from "./builtins.js";
import type { EastType, FunctionType, NeverType, NullType } from "./types.js";
import type { Location } from "./location.js";

// This is the TypeScript-native, typed AST (abstract syntax tree) for East.
// At this stage variable resolution has not been completed and nodes may need to be compared by object identity to understand the code.
// The AST must be checked and transformed to IR before it can be serialized or compiled.

// TODO: all fields that are `AST` should be `any` to remove circular typing (type-erased to make TypeScript fast)

/** @internal */
export type ErrorAST = {
  ast_type: "Error",
  type: NeverType,
  location: Location,
  message: AST,
}

/** @internal */
export type TryCatchAST = {
  ast_type: "TryCatch",
  type: EastType,
  location: Location,
  try_body: AST,
  catch_body: AST,
  message: VariableAST,
  stack: VariableAST,
  finally_body?: AST,
}

/** @internal */
export type ValueAST = {
  ast_type: "Value",
  type: EastType,
  location: Location,
  value: null | boolean | bigint | number | string | Date | Uint8Array,
};

/** @internal */
export type AsAST = {
  ast_type: "As",
  type: EastType,
  location: Location,
  value: AST,
};

/** @internal */
export type VariableAST = {
  ast_type: "Variable",
  type: EastType,
  location: Location,
  mutable: boolean,
};

/** @internal */
export type LetAST = {
  ast_type: "Let",
  type: EastType,
  location: Location,
  variable: VariableAST,
  value: AST,
};

/** @internal */
export type AssignAST = {
  ast_type: "Assign",
  type: EastType,
  location: Location,
  variable: VariableAST,
  value: AST,
};

/** @internal */
export type FunctionAST = {
  ast_type: "Function",
  type: EastType,
  location: Location,
  parameters: VariableAST[],
  body: AST,
};

/** @internal */
export type CallAST = {
  ast_type: "Call",
  type: EastType,
  location: Location,
  function: AST,
  arguments: AST[],
};

/** @internal */
export type NewRefAST = {
  ast_type: "NewRef",
  type: EastType,
  location: Location,
  value: AST,
};

/** @internal */
export type NewArrayAST = {
  ast_type: "NewArray",
  type: EastType,
  location: Location,
  values: AST[],
};

/** @internal */
export type NewSetAST = {
  ast_type: "NewSet",
  type: EastType,
  location: Location,
  values: AST[],
};

/** @internal */
export type NewDictAST = {
  ast_type: "NewDict",
  type: EastType,
  location: Location,
  values: [AST, AST][],
};

/** @internal */
export type StructAST = {
  ast_type: "Struct",
  type: EastType,
  location: Location,
  fields: Record<string, AST>,
};

/** @internal */
export type GetFieldAST = {
  ast_type: "GetField",
  type: EastType,
  location: Location,
  field: string,
  struct: AST,
};

/** @internal */
export type VariantAST = {
  ast_type: "Variant",
  type: EastType,
  location: Location,
  case: string,
  value: AST,
};

/** @internal */
export type BlockAST = {
  ast_type: "Block",
  type: EastType,
  location: Location,
  statements: AST[],
}

/** @internal */
export type IfElseAST = {
  ast_type: "IfElse",
  type: EastType,
  location: Location,
  ifs: {
    predicate: AST,
    body: AST,
  }[],
  else_body: AST,
};

/** @internal */
export type MatchAST = {
  ast_type: "Match",
  type: EastType,
  location: Location,
  variant: AST,
  cases: Record<string, { variable: VariableAST, body: AST }>,
};

export type UnwrapRecursiveAST = {
  ast_type: "UnwrapRecursive",
  type: EastType,
  location: Location,
  value: AST,
};

/** @internal */
export type WrapRecursiveAST = {
  ast_type: "WrapRecursive",
  type: EastType,
  location: Location,
  value: AST,
};

/** @internal */
export type Label = {
  location: Location,
}

/** @internal */
export type WhileAST = {
  ast_type: "While",
  type: NullType,
  location: Location,
  predicate: AST,
  label: Label,
  body: AST,
};

/** @internal */
export type ForArrayAST = {
  ast_type: "ForArray",
  type: NullType,
  location: Location,
  array: AST,
  label: Label,
  key: VariableAST,
  value: VariableAST,
  body: AST,
};

/** @internal */
export type ForSetAST = {
  ast_type: "ForSet",
  type: NullType,
  location: Location,
  set: AST,
  label: Label,
  key: VariableAST,
  body: AST,
};

/** @internal */
export type ForDictAST = {
  ast_type: "ForDict",
  type: NullType,
  location: Location,
  dict: AST,
  label: Label,
  key: VariableAST,
  value: VariableAST,
  body: AST,
};

/** @internal */
export type ReturnAST = {
  ast_type: "Return",
  type: NeverType,
  location: Location,
  value: AST,
};

/** @internal */
export type ContinueAST = {
  ast_type: "Continue",
  type: NeverType,
  location: Location,
  label: Label,
};

/** @internal */
export type BreakAST = {
  ast_type: "Break",
  type: NeverType,
  location: Location,
  label: Label,
};

/**@internal */
export type BuiltinAST = {
  ast_type: "Builtin",
  type: EastType,
  location: Location,
  builtin: BuiltinName,
  type_parameters: EastType[],
  arguments: AST[],
};

/** @internal */
export type PlatformAST = {
  ast_type: "Platform",
  type: EastType,
  location: Location,
  name: string,
  arguments: AST[],
};

/** @internal */
export type AST = ErrorAST | TryCatchAST | ValueAST | AsAST | VariableAST | LetAST | AssignAST | FunctionAST | CallAST | NewRefAST | NewArrayAST | NewSetAST | NewDictAST | StructAST | GetFieldAST | VariantAST | BlockAST | IfElseAST | MatchAST | UnwrapRecursiveAST | WrapRecursiveAST | WhileAST | ForArrayAST | ForSetAST | ForDictAST | ReturnAST | ContinueAST | BreakAST | BuiltinAST | PlatformAST;

/** Get the platform functions used inside an AST node. Useful to obtrain the potential effects performed by a function.
 * 
 * @internal */
export function getPlatforms(ast: AST): string[] {
  const platforms = new Set<string>();
  _getPlatforms(ast, platforms);
  return [...platforms].sort();
}

/** @internal */
export function _getPlatforms(ast: AST, platforms: Set<string>) {
  if (ast.ast_type === "Platform") {
    // The trivial case
    platforms.add(ast.name);
  } else if (ast.ast_type === "Call") {
    // We need to obtain the callee, which may require platforms to evaluate
    _getPlatforms(ast.function, platforms);

    // We need to obtain the arguments
    for (const arg of ast.arguments) {
      _getPlatforms(arg, platforms);
    }
    
    // Finally, we need to add any platforms the function uses
    const callee_platforms = (ast.function.type as FunctionType).platforms;
    if (callee_platforms === null) {
      throw new Error(`Called function has not populated the 'platforms' field`);
    } else {
      for (const p of callee_platforms) {
        platforms.add(p);
      }
    }
  } else if (ast.ast_type === "Builtin") {
    const builtin_def = Builtins[ast.builtin];
    if (!builtin_def) {
      throw new Error(`Unknown builtin ${ast.builtin}`);
    }

    if (builtin_def.inputs.length !== ast.arguments.length) {
      throw new Error(`Builtin ${ast.builtin} expected ${builtin_def.inputs.length} arguments, got ${ast.arguments.length}`);
    }

    for (const [i, arg] of ast.arguments.entries()) {
      // Find the platform functions required to evaluate the argument
      _getPlatforms(arg, platforms);

      // Some platform functions are higher-order functions
      //  - No existing builtin returns a function
      //  - Any functions they call are direct arguments
      //  - Such arguments have "Function" type in their Builtin definition
      
      const expected_type = builtin_def.inputs[i]!;
      if (typeof expected_type === "object" && expected_type.type === "Function") {
        if (arg.type.type !== "Function") {
          throw new Error(`Builtin ${ast.builtin} expected argument ${i} to be a function`);
        }

        const func_platforms = arg.type.platforms;
        if (func_platforms === null) {
          throw new Error(`Builtin ${ast.builtin} argument ${i} function has not populated the 'platforms' field`);
        } else {
          for (const p of func_platforms) {
            platforms.add(p);
          }
        }
      }
    }
  } else if (ast.ast_type === "Value" || ast.ast_type === "Variable" || ast.ast_type === "Function" || ast.ast_type === "Continue" || ast.ast_type === "Break") {
    // effect free (Function only collects captured variables here)
  } else if (ast.ast_type === "As" || ast.ast_type === "UnwrapRecursive" || ast.ast_type === "WrapRecursive" || ast.ast_type === "Let" || ast.ast_type === "Assign" || ast.ast_type === "Return" || ast.ast_type === "NewRef") {
    _getPlatforms(ast.value, platforms);
  } else if (ast.ast_type === "Error") {
    _getPlatforms(ast.message, platforms);
  } else if (ast.ast_type === "TryCatch") {
    _getPlatforms(ast.try_body, platforms);
    _getPlatforms(ast.catch_body, platforms);
    if (ast.finally_body) {
      _getPlatforms(ast.finally_body, platforms);
    }
  } else if (ast.ast_type === "NewArray") {
    for (const v of ast.values) {
      _getPlatforms(v, platforms);
    }
  } else if (ast.ast_type === "NewSet") {
    for (const v of ast.values) {
      _getPlatforms(v, platforms);
    }
  } else if (ast.ast_type === "NewDict") {
    for (const [k, v] of ast.values) {
      _getPlatforms(k, platforms);
      _getPlatforms(v, platforms);
    }
  } else if (ast.ast_type === "Struct") {
    for (const f of Object.values(ast.fields)) {
      _getPlatforms(f, platforms);
    }
  } else if (ast.ast_type === "GetField") {
    _getPlatforms(ast.struct, platforms);
  } else if (ast.ast_type === "Variant") {
    _getPlatforms(ast.value, platforms);
  } else if (ast.ast_type === "Match") {
    _getPlatforms(ast.variant, platforms);
    for (const case_body of Object.values(ast.cases)) {
      _getPlatforms(case_body.body, platforms);
    }
  } else if (ast.ast_type === "Block") {
    for (const s of ast.statements) {
      _getPlatforms(s, platforms);
    }
  } else if (ast.ast_type === "IfElse") {
    for (const if_case of ast.ifs) {
      _getPlatforms(if_case.predicate, platforms);
      _getPlatforms(if_case.body, platforms);
    }
    _getPlatforms(ast.else_body, platforms);
  } else if (ast.ast_type === "While") {
    _getPlatforms(ast.predicate, platforms);
    _getPlatforms(ast.body, platforms);
  } else if (ast.ast_type === "ForArray") {
    _getPlatforms(ast.array, platforms);
    _getPlatforms(ast.body, platforms);
  } else if (ast.ast_type === "ForSet") {
    _getPlatforms(ast.set, platforms);
    _getPlatforms(ast.body, platforms);
  } else if (ast.ast_type === "ForDict") {
    _getPlatforms(ast.dict, platforms);
    _getPlatforms(ast.body, platforms);
  } else {
    throw new Error(`Unhandled AST node type in getPlatforms: ${(ast satisfies never as AST).ast_type}`);
  }
}
