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


// /** A named symbol provided to the compiler for linking.
//  * Each symbol has a name, expected type, and IR that constructs its value.
//  */
// export type SymbolDefinition = {
//     /** The name of the imported symbol */
//     name: string,
//     /** Type of the symbol (as EastTypeValue for analysis) */
//     type: EastTypeValue,
//     /** IR that constructs the symbol's value */
//     ir: IR,
// }

// /** East type for a serialized module (authoring-time, full form).
//  *
//  * - `name`: fully-qualified module name (e.g. "myapp.math")
//  * - `ir`: IR that constructs the module's export value (root node's `type` field gives the export type)
//  * - `imports`: symbol name → expected type (manifest for the linker)
//  *
//  * No separate `type` field — the export type is already in `ir.value.type` (every IR node carries its type).
//  */
// export const ModuleType = StructType({
//     name: StringType,
//     ir: IRType,
//     imports: DictType(StringType, EastTypeType),
// });

// /** East type for a stored module (flattened, for the object store).
//  *
//  * Like the full ModuleType but imports are flattened to just a set of names.
//  * The bundled/external distinction is dropped because all modules have been
//  * extracted to separate objects by storage time.
//  */
// export const StoredModuleType = StructType({
//     name: StringType,
//     ir: IRType,
//     imports: SetType(StringType),
// });

// /** East type for a symbol definition (for serialization in test suites and module manifests). */
// export const SymbolDefinitionType = StructType({
//     name: StringType,
//     type: EastTypeType,
//     ir: IRType,
// });

// /** East type for the compliance test suite export format (IR + optional symbol table). */
// export const TestSuiteType = StructType({
//     ir: IRType,
//     symbols: ArrayType(SymbolDefinitionType),
// });

// /** Import specification for a module dependency. */
// export type ImportSpec =
//     | { kind: 'bundled', module: ModuleDef }
//     | { kind: 'external', name: string, type: EastType };

// /**
//  * A module definition produced by `East.module()`.
//  *
//  * Contains the module's IR, type information, and import metadata.
//  * This is a TypeScript-side builder — not an East Expr or AST node.
//  */
// export class ModuleDef<T extends EastType = EastType> {
//     private static registry = new Map<string, ModuleDef>();

//     constructor(
//         /** Fully-qualified module name (e.g. "myapp.math") */
//         public readonly name: string,
//         /** The East type of the module's export value */
//         public readonly type: T,
//         /** The module's compiled IR */
//         public readonly ir: IR,
//         /** Map from import name → import specification */
//         public readonly imports: Map<string, ImportSpec>,
//     ) {
//         ModuleDef.registry.set(this.name, this);
//     }

//     /** Look up a module by name in the global registry. */
//     static lookup(name: string): ModuleDef | undefined {
//         return ModuleDef.registry.get(name);
//     }

//     /**
//      * Get SymbolDefinitions for all imports (for use with East.compile / EastIR.compile).
//      * Flattens bundled modules recursively — each bundled module's IR becomes a symbol,
//      * and its own imports are included transitively.
//      */
//     get symbols(): SymbolDefinition[] {
//         const result: SymbolDefinition[] = [];
//         const seen = new Set<string>();
//         this._collectSymbols(result, seen);
//         // Include this module's own per-export symbols
//         this._addOwnSymbols(result, seen);
//         return result;
//     }

//     private _addOwnSymbols(result: SymbolDefinition[], seen: Set<string>): void {
//         // The module's IR is a StructIR. Each field is an export.
//         // We need individual symbol entries: "module.exportName" → export IR
//         if (this.ir.type === "Struct") {
//             for (const field of (this.ir as any).value.fields) {
//                 const fullName = `${this.name}.${field.name}`;
//                 if (!seen.has(fullName)) {
//                     seen.add(fullName);
//                     result.push({
//                         name: fullName,
//                         type: field.value.value.type,
//                         ir: field.value,
//                     });
//                 }
//             }
//         }
//     }

//     private _collectSymbols(result: SymbolDefinition[], seen: Set<string>): void {
//         for (const [_localName, spec] of this.imports) {
//             if (spec.kind === 'bundled') {
//                 const mod = spec.module;
//                 if (!seen.has(mod.name)) {
//                     seen.add(mod.name);
//                     // Recursively collect the bundled module's own imports first
//                     mod._collectSymbols(result, seen);
//                     // Then add the module's per-export symbols
//                     mod._addOwnSymbols(result, seen);
//                 }
//             }
//             // External imports are not included — they must be provided by the runtime
//         }
//     }

//     /**
//      * Produce the serialized module value (matching ModuleType).
//      * The imports map records symbol name → expected EastType for the linker.
//      */
//     toModuleValue(): { name: string, ir: IR, imports: Map<string, EastTypeValue> } {
//         const imports = new Map<string, EastTypeValue>();
//         for (const [_localName, spec] of this.imports) {
//             if (spec.kind === 'bundled') {
//                 imports.set(spec.module.name, toEastTypeValue(spec.module.type));
//             } else {
//                 imports.set(spec.name, toEastTypeValue(spec.type));
//             }
//         }
//         return { name: this.name, ir: this.ir, imports };
//     }

//     /**
//      * Produce the stored (flattened) module value (matching StoredModuleType).
//      * Imports are just a set of names.
//      */
//     toStoredModuleValue(): { name: string, ir: IR, imports: Set<string> } {
//         const imports = new Set<string>();
//         for (const [_localName, spec] of this.imports) {
//             if (spec.kind === 'bundled') {
//                 imports.add(spec.module.name);
//             } else {
//                 imports.add(spec.name);
//             }
//         }
//         return { name: this.name, ir: this.ir, imports };
//     }
// }
