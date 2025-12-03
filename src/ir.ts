/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import type { BuiltinName } from "./builtins.js";
import type { variant } from "./containers/variant.js";
import type { EastTypeValue, LiteralValue } from "./type_of_type.js";
import { ArrayType, BooleanType, IntegerType, RecursiveType, StringType, StructType, VariantType } from "./types.js";
import { EastTypeType, LiteralValueType } from "./type_of_type.js";

// This is the intermediate representation (IR) for East.
// IR has been processed from IR and checked for type safety and variable resolution.
// The code is ready to be serialized and evaluated or compiled.
// It is written in a form such that it is a valid East value, and can be serialized with our standard value serialization.

////////////////////////////////////////////////////////////////////////////////////////////
// Location type

export type LocationValue = {
  filename: string,
  line: bigint,
  column: bigint,
};

export function printLocationValue(location: LocationValue): string {
  return `${location.filename} ${location.line}:${location.column}`;
}

////////////////////////////////////////////////////////////////////////////////////////////
// IR node types

// Note: all fields that are "any" are other IR nodes (type-erased to make TypeScript fast)

export type ErrorIR = variant<"Error", {
  type: variant<"Never", null>,
  location: LocationValue,
  message: any, // IR
}>;

export type TryCatchIR = variant<"TryCatch", {
  type: EastTypeValue,
  location: LocationValue,
  try_body: any, // IR
  catch_body: any, // IR
  message: VariableIR,
  stack: VariableIR,
  finally_body: any, // IR
}>;

export type ValueIR = variant<"Value", {
  type: EastTypeValue,
  location: LocationValue,
  value: LiteralValue,
}>;

export type VariableIR = variant<"Variable", {
  type: EastTypeValue,
  name: string,
  location: LocationValue,
  mutable: boolean,
  captured: boolean,
}>;

export type LetIR = variant<"Let", {
  type: EastTypeValue,
  location: LocationValue,
  variable: VariableIR,
  value: any, // IR
}>;

export type AssignIR = variant<"Assign", {
  type: EastTypeValue,
  location: LocationValue,
  variable: VariableIR,
  value: any, // IR
}>;

export type AsIR = variant<"As", {
  type: EastTypeValue,
  value: any, // IR
  location: LocationValue,
}>

export type FunctionIR = variant<"Function", {
  type: EastTypeValue,
  location: LocationValue,
  captures: VariableIR[],
  parameters: VariableIR[],
  body: any, // IR
}>;

export type AsyncFunctionIR = variant<"AsyncFunction", {
  type: EastTypeValue,
  location: LocationValue,
  captures: VariableIR[],
  parameters: VariableIR[],
  body: any, // IR
}>;

export type CallIR = variant<"Call", {
  type: EastTypeValue,
  location: LocationValue,
  function: any, // IR
  arguments: any[], // IR[]
}>;

export type CallAsyncIR = variant<"CallAsync", {
  type: EastTypeValue,
  location: LocationValue,
  function: any, // IR
  arguments: any[], // IR[]
}>;


export type NewRefIR = variant<"NewRef", {
  type: EastTypeValue,
  location: LocationValue,
  value: any, // IR
}>;

export type NewArrayIR = variant<"NewArray", {
  type: EastTypeValue,
  location: LocationValue,
  values: any[], // IR[]
}>;

export type NewSetIR = variant<"NewSet", {
  type: EastTypeValue,
  location: LocationValue,
  values: any[], // IR[]
}>;

export type NewDictIR = variant<"NewDict", {
  type: EastTypeValue,
  location: LocationValue,
  values: { key: any, value: any }[], // { key: IR , value: IR }[]
}>;

export type StructIR = variant<"Struct", {
  type: EastTypeValue,
  location: LocationValue,
  fields: { name: string, value: any }[], // { name: string, value: IR }[]
}>;

export type GetFieldIR = variant<"GetField", {
  type: EastTypeValue,
  location: LocationValue,
  field: string,
  struct: any, // IR
}>;

export type VariantIR = variant<"Variant", {
  type: EastTypeValue,
  location: LocationValue,
  case: string,
  value: any, // IR
}>;

export type BlockIR = variant<"Block", {
  type: EastTypeValue,
  location: LocationValue,
  statements: any[], // IR[]
}>;

export type IfElseIR = variant<"IfElse", {
  type: EastTypeValue,
  location: LocationValue,
  ifs: {
    predicate: any, // IR
    body: any, // IR
  }[],
  else_body: any, // IR

}>;

export type MatchIR = variant<"Match", {
  type: EastTypeValue,
  location: LocationValue,
  variant: any, // IR
  cases: { case: string, variable: VariableIR, body: any }[], // { case: string, variable: VariableIR, body: IR }[]
}>;

export type UnwrapRecursiveIR = variant<"UnwrapRecursive", {
  type: EastTypeValue,
  location: LocationValue,
  value: any, // IR
}>;

export type WrapRecursiveIR = variant<"WrapRecursive", {
  type: EastTypeValue,
  location: LocationValue,
  value: any, // IR
}>;

export type IRLabel = {
  name: string,
  location: LocationValue,
};

export type WhileIR = variant<"While", {
  type: variant<"Null", null>,
  location: LocationValue,
  predicate: any, // IR
  label: IRLabel,
  body: any, // IR
}>;

export type ForArrayIR = variant<"ForArray", {
  type: variant<"Null", null>,
  location: LocationValue,
  array: any, // IR
  label: IRLabel,
  key: VariableIR,
  value: VariableIR,
  body: any, // IR
}>;

export type ForSetIR = variant<"ForSet", {
  type: variant<"Null", null>,
  location: LocationValue,
  set: any, // IR
  label: IRLabel,
  key: VariableIR,
  body: any, // IR
}>;

export type ForDictIR = variant<"ForDict", {
  type: variant<"Null", null>,
  location: LocationValue,
  dict: any, // IR
  label: IRLabel,
  key: VariableIR,
  value: VariableIR,
  body: any, // IR
}>;

export type ReturnIR = variant<"Return", {
  type: variant<"Never", null>,
  location: LocationValue,
  value: any, // IR
}>;

export type ContinueIR = variant<"Continue", {
  type: variant<"Never", null>,
  location: LocationValue,
  label: IRLabel,
}>;

export type BreakIR = variant<"Break", {
  type: variant<"Never", null>,
  location: LocationValue,
  label: IRLabel,
}>;

/**@internal */
export type BuiltinIR = variant<"Builtin", {
  type: EastTypeValue,
  location: LocationValue,
  builtin: BuiltinName,
  type_parameters: EastTypeValue[],
  arguments: any[], // IR[]
}>;

export type PlatformIR = variant<"Platform", {
  type: EastTypeValue,
  location: LocationValue,
  name: string,
  arguments: any[], // IR[]
  async: boolean,
}>;

/** The common intermediate representation (IR) for East code.
 *
 * East IR is an expression-based tree of nodes.
 * It has been processed from AST and checked for type safety and variable resolution.
 * The code is ready to be serialized, evaluated or compiled.
 */
export type IR = ErrorIR | TryCatchIR |ValueIR | VariableIR | LetIR | AssignIR | AsIR | FunctionIR | AsyncFunctionIR | CallIR | CallAsyncIR | NewRefIR | NewArrayIR | NewSetIR | NewDictIR | StructIR | GetFieldIR | VariantIR | BlockIR | IfElseIR | MatchIR | UnwrapRecursiveIR | WrapRecursiveIR | WhileIR | ForArrayIR | ForSetIR | ForDictIR | ReturnIR | ContinueIR | BreakIR | BuiltinIR | PlatformIR;

////////////////////////////////////////////////////////////////////////////////////////////
// Homoiconic IR EastTypes

export const LocationType = StructType({
  filename: StringType,
  line: IntegerType,
  column: IntegerType,
});

export const IRLabelType = StructType({
  name: StringType,
  location: LocationType,
});

export const VariableType = StructType({
  type: EastTypeType,
  location: LocationType,
  name: StringType,
  mutable: BooleanType,
  captured: BooleanType,
});

export const IRType = RecursiveType(ir => VariantType({
  Error: StructType({ type: EastTypeType, location: LocationType, message: ir }),
  TryCatch: StructType({ type: EastTypeType, location: LocationType, try_body: ir, catch_body: ir, message: ir, stack: ir, finally_body: ir }),
  Value: StructType({ type: EastTypeType, location: LocationType, value: LiteralValueType }),
  Variable: VariableType,
  Let: StructType({ type: EastTypeType, location: LocationType, variable: ir, value: ir }),
  Assign: StructType({ type: EastTypeType, location: LocationType, variable: ir, value: ir }),
  As: StructType({ type: EastTypeType, location: LocationType, value: ir }),
  Function: StructType({ type: EastTypeType, location: LocationType, captures: ArrayType(ir), parameters: ArrayType(ir), body: ir }),
  AsyncFunction: StructType({ type: EastTypeType, location: LocationType, captures: ArrayType(ir), parameters: ArrayType(ir), body: ir }),
  Call: StructType({ type: EastTypeType, location: LocationType, function: ir, arguments: ArrayType(ir) }),
  CallAsync: StructType({ type: EastTypeType, location: LocationType, function: ir, arguments: ArrayType(ir) }),
  NewRef: StructType({ type: EastTypeType, location: LocationType, value: ir }),
  NewArray: StructType({ type: EastTypeType, location: LocationType, values: ArrayType(ir) }),
  NewSet: StructType({ type: EastTypeType, location: LocationType, values: ArrayType(ir) }),
  NewDict: StructType({ type: EastTypeType, location: LocationType, values: ArrayType(StructType({ key: ir, value: ir })) }),
  Struct: StructType({ type: EastTypeType, location: LocationType, fields: ArrayType(StructType({ name: StringType, value: ir })) }),
  GetField: StructType({ type: EastTypeType, location: LocationType, field: StringType, struct: ir }),
  Variant: StructType({ type: EastTypeType, location: LocationType, case: StringType, value: ir }),
  Block: StructType({ type: EastTypeType, location: LocationType, statements: ArrayType(ir) }),
  IfElse: StructType({ type: EastTypeType, location: LocationType, ifs: ArrayType(StructType({ predicate: ir, body: ir })), else_body: ir }),
  Match: StructType({ type: EastTypeType, location: LocationType, variant: ir, cases: ArrayType(StructType({ case: StringType, variable: ir, body: ir })) }),
  UnwrapRecursive: StructType({ type: EastTypeType, location: LocationType, value: ir }),
  WrapRecursive: StructType({ type: EastTypeType, location: LocationType, value: ir }),
  While: StructType({ type: EastTypeType, location: LocationType, predicate: ir, label: IRLabelType, body: ir }),
  ForArray: StructType({ type: EastTypeType, location: LocationType, array: ir, label: IRLabelType, key: ir, value: ir, body: ir }),
  ForSet: StructType({ type: EastTypeType, location: LocationType, set: ir, label: IRLabelType, key: ir, body: ir }),
  ForDict: StructType({ type: EastTypeType, location: LocationType, dict: ir, label: IRLabelType, key: ir, value: ir, body: ir }),
  Return: StructType({ type: EastTypeType, location: LocationType, value: ir }),
  Continue: StructType({ type: EastTypeType, location: LocationType, label: IRLabelType }),
  Break: StructType({ type: EastTypeType, location: LocationType, label: IRLabelType }),
  Builtin: StructType({ type: EastTypeType, location: LocationType, builtin: StringType, type_parameters: ArrayType(EastTypeType), arguments: ArrayType(ir) }),
  Platform: StructType({ type: EastTypeType, location: LocationType, name: StringType, arguments: ArrayType(ir), async: BooleanType }),
}));