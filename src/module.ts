/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import { EastTypeType } from "./type_of_type.js";
import { IRType } from "./ir.js";
import { StringType, DictType, StructType } from "./types.js";
import type { ValueTypeOf } from "./types.js";

// Low-level representation of a module as a flat symbol table and explicit listing of direct dependencies.
// Something akin to C's .o files or Java's .class files, but in IR form and with explicit type information for linking.

/**
 * The serialized form of an East module, containing the IR for the module's exported symbols, and metadata about the symbols it depends on.
 */
export const EastModuleType = StructType({
    symbols: DictType(StringType, IRType),
    imports: DictType(StringType, EastTypeType),
});

/**
 * The serialized form of an East module, containing the IR for the module's exported symbols, and metadata about the symbols it depends on.
 */
export type EastModuleType = typeof EastModuleType;

/**
 * The serialized form of an East module, containing the IR for the module's exported symbols, and metadata about the symbols it depends on.
 */
export type EastModule = ValueTypeOf<EastModuleType>;

/** The type of a linked program */
export const EastProgramType = StructType({
    main: IRType,
    symbols: DictType(StringType, IRType),
    imports: DictType(StringType, EastTypeType),
})
