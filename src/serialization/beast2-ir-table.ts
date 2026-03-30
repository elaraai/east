/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */

/**
 * Type table for IR encoding in beast2.
 *
 * Instead of encoding the full EastTypeValue tree inline at every IR expression node,
 * we collect unique types (by JS identity) into a table and encode varint indices.
 * This exploits the fact that SDK-produced EastTypeValue objects share identity via
 * the toEastTypeValue WeakMap cache.
 *
 * All operations (collect, substitute, restore) use a generic type-directed walker
 * that traverses the IRType definition — no manual field classification needed.
 */

import { EastTypeType } from "../type_of_type.js";
import type { EastTypeValue } from "../type_of_type.js";
import { IRType } from "../ir.js";
import { ArrayType, IntegerType, RecursiveType, StructType, VariantType, type EastType } from "../types.js";
import type { BufferWriter, BufferReader } from "./binary-utils.js";

// =============================================================================
// Derive IRTypeWithTableRefs from IRType (EastTypeType → IntegerType)
// =============================================================================

/** Transform an EastType tree, replacing specific types by identity */
function transformType(type: EastType, replacements: Map<EastType, EastType>): EastType {
  const replacement = replacements.get(type);
  if (replacement !== undefined) return replacement;

  const t = type as any;
  if (t.type === "Struct") {
    const newFields: Record<string, EastType> = {};
    for (const [name, fieldType] of Object.entries(t.fields)) {
      newFields[name] = transformType(fieldType as EastType, replacements);
    }
    return StructType(newFields);
  }
  if (t.type === "Variant") {
    const newCases: Record<string, EastType> = {};
    for (const [name, caseType] of Object.entries(t.cases)) {
      newCases[name] = transformType(caseType as EastType, replacements);
    }
    return VariantType(newCases);
  }
  if (t.type === "Array") {
    return ArrayType(transformType(t.value, replacements));
  }
  return type;
}

/** IRType with EastTypeType replaced by IntegerType (table indices) */
export const IRTypeWithTableRefs = RecursiveType(ir => {
  const replacements = new Map<EastType, EastType>();
  replacements.set(EastTypeType, IntegerType);
  replacements.set(IRType, ir as any);
  return transformType((IRType as any).node, replacements);
});

// =============================================================================
// Generic type-directed value transformer
// =============================================================================

/**
 * Build a value transformer from an EastType definition.
 * Walks the type tree at init time and produces a fast function that transforms
 * values at `targetType` positions, returning null for types that need no work.
 */
function buildValueTransformer(
  type: EastType,
  targetType: EastType,
  selfTypes: Map<EastType, { fn: ((value: any, onTarget: (v: any) => any) => any) | null }>,
  onTarget: (value: any) => any,
): ((value: any, onTarget: (v: any) => any) => any) | null {
  if (type === targetType) return (_value, onTarget) => onTarget(_value);

  // Handle recursive self-references
  const selfEntry = selfTypes.get(type);
  if (selfEntry !== undefined) {
    // Return a trampoline that calls through the mutable ref
    return (value, onTarget) => selfEntry.fn!(value, onTarget);
  }

  const t = type as EastType;

  if (t.type === "Recursive") {
    // Register a placeholder, build inner, then patch
    const entry = { fn: null as ((value: any, onTarget: (v: any) => any) => any) | null };
    selfTypes.set(type, entry);
    const inner = buildValueTransformer(t.node, targetType, selfTypes, onTarget);
    entry.fn = inner;
    return inner;
  }

  if (t.type === "Struct") {
    const fieldTransformers: [string, (value: any, onTarget: (v: any) => any) => any][] = [];
    for (const [name, fieldType] of Object.entries(t.fields)) {
      const ft = buildValueTransformer(fieldType as EastType, targetType, selfTypes, onTarget);
      if (ft) fieldTransformers.push([name, ft]);
    }
    if (fieldTransformers.length === 0) return null;
    return (val, onTarget) => {
      const newVal: any = { ...val };
      for (const [name, ft] of fieldTransformers) {
        newVal[name] = ft(val[name], onTarget);
      }
      return newVal;
    };
  }

  if (t.type === "Variant") {
    const caseTransformers = new Map<string, (value: any, onTarget: (v: any) => any) => any>();
    for (const [name, caseType] of Object.entries(t.cases)) {
      const ct = buildValueTransformer(caseType as EastType, targetType, selfTypes, onTarget);
      if (ct) caseTransformers.set(name, ct);
    }
    if (caseTransformers.size === 0) return null;
    return (val, onTarget) => {
      const ct = caseTransformers.get(val.type);
      if (!ct) return val;
      return { type: val.type, value: ct(val.value, onTarget) };
    };
  }

  if (t.type === "Array") {
    const elemTransformer = buildValueTransformer(t.value, targetType, selfTypes, onTarget);
    if (!elemTransformer) return null;
    return (val, onTarget) => val.map((item: any) => elemTransformer(item, onTarget));
  }

  return null;
}

// Pre-build the IR transformer shape once at module init.
// The actual onTarget function is passed at call time.
const irTransformer = buildValueTransformer(IRType, EastTypeType, new Map(), v => v)!;

/**
 * Similarly, build a collector (void visitor) from the same type structure.
 * This avoids creating new objects when we only need to visit type positions.
 */
function buildValueVisitor(
  type: EastType,
  targetType: EastType,
  selfTypes: Map<EastType, { fn: ((value: any, onTarget: (v: any) => void) => void) | null }>,
): ((value: any, onTarget: (v: any) => void) => void) | null {
  if (type === targetType) return (value, onTarget) => onTarget(value);

  const selfEntry = selfTypes.get(type);
  if (selfEntry !== undefined) {
    return (value, onTarget) => selfEntry.fn!(value, onTarget);
  }

  const t = type as any;

  if (t.type === "Recursive") {
    const entry = { fn: null as ((value: any, onTarget: (v: any) => void) => void) | null };
    selfTypes.set(type, entry);
    const inner = buildValueVisitor(t.node, targetType, selfTypes);
    entry.fn = inner;
    return inner;
  }

  if (t.type === "Struct") {
    const fieldVisitors: [string, (value: any, onTarget: (v: any) => void) => void][] = [];
    for (const [name, fieldType] of Object.entries(t.fields)) {
      const fv = buildValueVisitor(fieldType as EastType, targetType, selfTypes);
      if (fv) fieldVisitors.push([name, fv]);
    }
    if (fieldVisitors.length === 0) return null;
    return (val, onTarget) => {
      for (const [name, fv] of fieldVisitors) fv(val[name], onTarget);
    };
  }

  if (t.type === "Variant") {
    const caseVisitors = new Map<string, (value: any, onTarget: (v: any) => void) => void>();
    for (const [name, caseType] of Object.entries(t.cases)) {
      const cv = buildValueVisitor(caseType as EastType, targetType, selfTypes);
      if (cv) caseVisitors.set(name, cv);
    }
    if (caseVisitors.size === 0) return null;
    return (val, onTarget) => {
      const cv = caseVisitors.get(val.type);
      if (cv) cv(val.value, onTarget);
    };
  }

  if (t.type === "Array") {
    const elemVisitor = buildValueVisitor(t.value, targetType, selfTypes);
    if (!elemVisitor) return null;
    return (val, onTarget) => {
      for (const item of val) elemVisitor(item, onTarget);
    };
  }

  return null;
}

const irVisitor = buildValueVisitor(IRType, EastTypeType, new Map())!;

// =============================================================================
// Public API: collect, substitute, restore
// =============================================================================

/** Collect unique EastTypeValue objects from an IR tree by identity */
export function collectIRTypes(ir: any, types: Map<any, number>): void {
  irVisitor(ir, v => { if (!types.has(v)) types.set(v, types.size); });
}

/** Replace EastTypeValue objects with BigInt table indices */
export function substituteTypeIndices(ir: any, typeMap: Map<any, number>): any {
  return irTransformer(ir, v => BigInt(typeMap.get(v)!));
}

/** Restore EastTypeValue objects from BigInt table indices */
export function restoreTypeFromIndices(ir: any, typeTable: EastTypeValue[]): any {
  return irTransformer(ir, v => typeTable[Number(v)]!);
}

// =============================================================================
// Pre-scan: collect all IR types from an entire value tree
// =============================================================================

/**
 * Walk a value tree (untyped) to find all functions (via EAST_IR_SYMBOL)
 * and collect their IR types into a single global type map.
 */
export function preCollectAllIRTypes(
  value: any,
  typeMap: Map<any, number>,
  irSymbol: symbol,
  capturesSymbol: symbol,
  visited: Set<any> = new Set(),
): void {
  if (value === null || value === undefined) return;
  const t = typeof value;
  if (t !== 'object' && t !== 'function') return;
  if (visited.has(value)) return;
  visited.add(value);

  const ir = value[irSymbol];
  if (ir) {
    collectIRTypes(ir, typeMap);
    const captures = value[capturesSymbol];
    if (captures) {
      for (const entry of Object.values(captures)) {
        preCollectAllIRTypes((entry as any).value, typeMap, irSymbol, capturesSymbol, visited);
      }
    }
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) preCollectAllIRTypes(item, typeMap, irSymbol, capturesSymbol, visited);
  } else if (value instanceof Set) {
    for (const item of value) preCollectAllIRTypes(item, typeMap, irSymbol, capturesSymbol, visited);
  } else if (value instanceof Map) {
    for (const [k, v] of value) {
      preCollectAllIRTypes(k, typeMap, irSymbol, capturesSymbol, visited);
      preCollectAllIRTypes(v, typeMap, irSymbol, capturesSymbol, visited);
    }
  } else if (t === 'object' && value.type !== undefined && value.value !== undefined && Object.keys(value).length === 2) {
    preCollectAllIRTypes(value.value, typeMap, irSymbol, capturesSymbol, visited);
  } else if (t === 'object' && !(value instanceof Uint8Array) && !(value instanceof Float64Array) && !(value instanceof BigInt64Array) && !(value instanceof Uint8ClampedArray)) {
    for (const v of Object.values(value)) {
      preCollectAllIRTypes(v, typeMap, irSymbol, capturesSymbol, visited);
    }
  }
}

// =============================================================================
// Encoder/decoder initialization (avoid circular import from beast2.ts)
// =============================================================================

type ValueEncoder = (value: any, writer: BufferWriter, ctx?: { refs: Map<any, number> }) => void;
type CursorDecoder = (reader: BufferReader, refs: Map<number, any>) => any;

/** Initialize the IR type table encoder/decoder. Called once from beast2.ts to break circular dependency. */
export function initIRTypeTable(
  makeEncoder: (type: EastType) => ValueEncoder,
  makeDecoder: (type: EastType) => CursorDecoder,
): {
  encodeIRWithGlobalTable: (ir: any, writer: BufferWriter, ctx: { refs: Map<any, number> }, globalTypeTable: Map<any, number>) => void;
  decodeIRWithGlobalTable: (reader: BufferReader, refs: Map<number, any>, globalTypeTable: EastTypeValue[]) => any;
  writeGlobalTypeTable: (typeMap: Map<any, number>, writer: BufferWriter) => void;
  readGlobalTypeTable: (reader: BufferReader) => EastTypeValue[];
} {
  const irWithRefsEncoder = makeEncoder(IRTypeWithTableRefs);
  const irWithRefsDecoder = makeDecoder(IRTypeWithTableRefs);
  const eastTypeValueEncoder = makeEncoder(EastTypeType);
  const eastTypeValueDecoder = makeDecoder(EastTypeType);

  function writeGlobalTypeTable(typeMap: Map<any, number>, writer: BufferWriter): void {
    writer.writeVarint(typeMap.size);
    for (const [typeObj] of typeMap) {
      eastTypeValueEncoder(typeObj, writer, { refs: new Map() });
    }
  }

  function readGlobalTypeTable(reader: BufferReader): EastTypeValue[] {
    const tableSize = reader.readVarint();
    const typeTable: EastTypeValue[] = [];
    for (let i = 0; i < tableSize; i++) {
      typeTable.push(eastTypeValueDecoder(reader, new Map()) as EastTypeValue);
    }
    return typeTable;
  }

  function encodeIRWithGlobalTable(ir: any, writer: BufferWriter, ctx: { refs: Map<any, number> }, globalTypeTable: Map<any, number>): void {
    const indexedIR = substituteTypeIndices(ir, globalTypeTable);
    irWithRefsEncoder(indexedIR, writer, ctx);
  }

  function decodeIRWithGlobalTable(reader: BufferReader, refs: Map<number, any>, globalTypeTable: EastTypeValue[]): any {
    const indexedIR = irWithRefsDecoder(reader, refs);
    return restoreTypeFromIndices(indexedIR, globalTypeTable);
  }

  return { encodeIRWithGlobalTable, decodeIRWithGlobalTable, writeGlobalTypeTable, readGlobalTypeTable };
}
