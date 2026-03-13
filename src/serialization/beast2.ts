/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */

import { EastTypeValueType, toEastTypeValue, type EastTypeValue } from "../type_of_type.js";
import type { EastType, ValueTypeOf } from "../types.js";
import { isVariant, variant } from "../containers/variant.js";
import {
  BufferWriter,
  BufferReader,
} from "./binary-utils.js";
import { printFor } from "./east.js";
import { ref } from "../containers/ref.js";
import { matrix } from "../containers/matrix.js";
import { EAST_IR_SYMBOL, EAST_CAPTURES_SYMBOL, ReturnException, compile_internal, type RuntimeContext } from "../compile.js";
import { InternalError } from "../error.js";
import { IRType, type FunctionIR, type AsyncFunctionIR } from "../ir.js";
import type { PlatformFunction } from "../platform.js";
import type { AnalyzedIR } from "../analyze.js";

const printTypeValue = printFor(EastTypeValueType) as (type: EastTypeValue) => string;

function _bytesPerElement(elementType: EastTypeValue): number {
  if (elementType.type === "Float") return 8;
  if (elementType.type === "Integer") return 8;
  if (elementType.type === "Boolean") return 1;
  throw new Error(`Unsupported vector/matrix element type: ${elementType.type}`);
}

// =============================================================================
// Context types for backreference tracking
// =============================================================================

/** Stack of encoders for recursive types */
export type Beast2EncodeTypeContext = ((value: any, writer: BufferWriter, ctx?: Beast2EncodeContext) => void)[];

/**
 * Value-level context for tracking mutable aliases during encoding.
 *
 * - refs: Map from mutable containers (Array/Set/Dict) to their byte offset (where inline content begins, after varint(0))
 */
export type Beast2EncodeContext = {
  refs: Map<any, number>;
};

/** Stack of decoders for recursive types */
export type Beast2DecodeTypeContext = ((buffer: Uint8Array, offset: number, ctx?: Beast2DecodeContext) => [any, number])[];

/**
 * Value-level context for tracking mutable aliases during decoding.
 *
 * - refs: Map from byte offset to deserialized mutable container (Array/Set/Dict)
 */
export type Beast2DecodeContext = {
  refs: Map<number, any>;
};

/** Cursor-based decoder function type (zero-allocation). Reads from BufferReader and mutates offset in place. */
type CursorDecoder = (reader: BufferReader, refs: Map<number, any>) => any;

/** Stack of cursor-based decoders for recursive types */
type CursorTypeContext = CursorDecoder[];

/**
 * Options for decoding, allowing function compilation.
 * When platform is provided, decoded functions will be compiled to callables with IR attached.
 * When not provided, raw FunctionIR/AsyncFunctionIR is returned.
 */
export type Beast2DecodeOptions = {
  platform?: PlatformFunction[];
  /**
   * When true, skip decoding and verifying the type header on each call.
   * The type header is still used to determine the value data offset on the
   * first call, but subsequent calls reuse the cached offset.
   *
   * This can dramatically improve performance for large recursive types
   * (e.g. UIComponentType) where the type header is tens of KB and decoding
   * + comparing it on every call dominates total decode time.
   *
   * Only use this when you trust the data was encoded with the correct type.
   */
  skipTypeCheck?: boolean;
};

// =============================================================================
// Value encoding/decoding factories (closure-compiler pattern)
// =============================================================================

export function encodeBeast2ValueToBufferFor(type: EastTypeValue, typeCtx: Beast2EncodeTypeContext = []): (value: any, writer: BufferWriter, ctx?: Beast2EncodeContext) => void {
  if (type.type === "Never") {
    return (_: unknown, _writer: BufferWriter, _ctx?: Beast2EncodeContext) => { throw new Error(`Attempted to encode value of type .Never`)};
  } else if (type.type === "Null") {
    return (_: null, _writer: BufferWriter, _ctx?: Beast2EncodeContext) => { /* null encodes as nothing */ };
  } else if (type.type === "Boolean") {
    return (x: boolean, writer: BufferWriter, _ctx?: Beast2EncodeContext) => writer.writeUint8(x ? 1 : 0);
  } else if (type.type === "Integer") {
    return (x: bigint, writer: BufferWriter, _ctx?: Beast2EncodeContext) => writer.writeZigzag(x);
  } else if (type.type === "Float") {
    return (x: number, writer: BufferWriter, _ctx?: Beast2EncodeContext) => writer.writeFloat64LE(x);
  } else if (type.type === "String") {
    return (x: string, writer: BufferWriter, _ctx?: Beast2EncodeContext) => writer.writeStringUtf8Varint(x);
  } else if (type.type === "DateTime") {
    return (x: Date, writer: BufferWriter, _ctx?: Beast2EncodeContext) => writer.writeZigzag(BigInt(x.valueOf()));
  } else if (type.type === "Blob") {
    return (x: Uint8Array, writer: BufferWriter, _ctx?: Beast2EncodeContext) => {
      writer.writeVarint(x.length);
      writer.writeBytes(x);
    };
  } else if (type.type === "Ref") {
    let valueEncoder: (value: any, writer: BufferWriter, ctx?: Beast2EncodeContext) => void;
    const ret = (x: ref<any>, writer: BufferWriter, ctx: Beast2EncodeContext = { refs: new Map() }) => {
      // Check for backreference
      if (ctx.refs.has(x)) {
        const offset = ctx.refs.get(x)!;
        writer.writeVarint(writer.currentOffset - offset);
        return;
      }
      // Write inline marker and register
      writer.writeVarint(0);
      ctx.refs.set(x, writer.currentOffset);
      // Encode contents
      valueEncoder(x.value, writer, ctx);
    };
    typeCtx.push(ret);
    valueEncoder = encodeBeast2ValueToBufferFor(type.value, typeCtx);
    typeCtx.pop();
    return ret;
  } else if (type.type === "Array") {
    let valueEncoder: (value: any, writer: BufferWriter, ctx?: Beast2EncodeContext) => void;
    const ret = (x: any[], writer: BufferWriter, ctx: Beast2EncodeContext = { refs: new Map() }) => {
      // Check for backreference
      if (ctx.refs.has(x)) {
        const offset = ctx.refs.get(x)!;
        writer.writeVarint(writer.currentOffset - offset);
        return;
      }
      // Write inline marker and register
      writer.writeVarint(0);
      ctx.refs.set(x, writer.currentOffset);
      // Encode contents
      writer.writeVarint(x.length);
      for (const item of x) {
        valueEncoder(item, writer, ctx);
      }
    };
    typeCtx.push(ret);
    valueEncoder = encodeBeast2ValueToBufferFor(type.value, typeCtx);
    typeCtx.pop();
    return ret;
  } else if (type.type === "Set") {
    const keyEncoder = encodeBeast2ValueToBufferFor(type.value, typeCtx);
    return (x: Set<any>, writer: BufferWriter, ctx: Beast2EncodeContext = { refs: new Map() }) => {
      // Check for backreference
      if (ctx.refs.has(x)) {
        const offset = ctx.refs.get(x)!;
        writer.writeVarint(writer.currentOffset - offset);
        return;
      }
      // Write inline marker and register
      writer.writeVarint(0);
      ctx.refs.set(x, writer.currentOffset);
      // Encode contents
      writer.writeVarint(x.size);
      for (const key of x) {
        keyEncoder(key, writer, ctx);
      }
    };
  } else if (type.type === "Dict") {
    const keyEncoder = encodeBeast2ValueToBufferFor(type.value.key, typeCtx);
    let valueEncoder: (value: any, writer: BufferWriter, ctx?: Beast2EncodeContext) => void;
    const ret = (x: Map<any, any>, writer: BufferWriter, ctx: Beast2EncodeContext = { refs: new Map() }) => {
      // Check for backreference
      if (ctx.refs.has(x)) {
        const offset = ctx.refs.get(x)!;
        writer.writeVarint(writer.currentOffset - offset);
        return;
      }
      // Write inline marker and register
      writer.writeVarint(0);
      ctx.refs.set(x, writer.currentOffset);
      // Encode contents
      writer.writeVarint(x.size);
      for (const [k, v] of x) {
        keyEncoder(k, writer, ctx);
        valueEncoder(v, writer, ctx);
      }
    };
    typeCtx.push(ret);
    valueEncoder = encodeBeast2ValueToBufferFor(type.value.value, typeCtx);
    typeCtx.pop();
    return ret;
  } else if (type.type === "Struct") {
    const fieldEncoders: [string, (value: any, writer: BufferWriter, ctx?: Beast2EncodeContext) => void][] = [];
    const ret = (x: Record<string, any>, writer: BufferWriter, ctx: Beast2EncodeContext = { refs: new Map() }) => {
      // Encode fields
      for (const [k, encoder] of fieldEncoders) {
        encoder(x[k], writer, ctx);
      }
    };
    typeCtx.push(ret);
    for (const { name, type: fieldType } of type.value) {
      fieldEncoders.push([name, encodeBeast2ValueToBufferFor(fieldType, typeCtx)]);
    }
    typeCtx.pop();
    return ret;
  } else if (type.type === "Variant") {
    const caseEncoders: Record<string, (value: any, writer: BufferWriter, ctx?: Beast2EncodeContext) => void> = {};
    const caseTags = Object.fromEntries(type.value.map(({ name }, i) => [name, i]));
    const ret = (x: any, writer: BufferWriter, ctx: Beast2EncodeContext = { refs: new Map() }) => {
      // Encode tag and value
      const tag = x.type as string;
      const tagIndex = caseTags[tag]!; // Assume valid input
      writer.writeVarint(tagIndex);
      caseEncoders[tag]!(x.value, writer, ctx);
    };
    typeCtx.push(ret);
    for (const { name, type: caseType } of type.value) {
      caseEncoders[name] = encodeBeast2ValueToBufferFor(caseType, typeCtx);
    }
    typeCtx.pop();
    return ret;
  } else if (type.type === "Recursive") {
    const ret = typeCtx[typeCtx.length - Number(type.value)];
    if (ret === undefined) {
      throw new Error(`Internal error: Recursive type context not found`);
    }
    return ret;
  } else if (type.type === "Function") {
    return (value: any, writer: BufferWriter, ctx: Beast2EncodeContext = { refs: new Map() }) => {
      // Get IR from function
      const ir = value[EAST_IR_SYMBOL] as FunctionIR | undefined;

      if (!ir) {
        throw new Error(
          `Cannot serialize function: no IR attached. ` +
          `Functions must be compiled from East IR to be serializable.`
        );
      }

      // Serialize the IR
      irEncoder(ir, writer, ctx);

      // Serialize capture values
      const captures = value[EAST_CAPTURES_SYMBOL] as RuntimeContext | undefined;
      const captureCount = ir.value.captures.length;

      // Write number of captures
      writer.writeVarint(captureCount);

      // Serialize each capture value using its type from the IR
      for (const captureVar of ir.value.captures) {
        const name = captureVar.value.name;
        const captureType = captureVar.value.type;

        // Captured variables are stored as variants - extract the value
        if (!captures) {
          throw new InternalError(`Function has captures in IR but no EAST_CAPTURES_SYMBOL`);
        }
        const captureEntry = captures[name];
        if (!captureEntry) {
          throw new InternalError(`Capture '${name}' not found in function's capture context`);
        }
        const captureValue = captureEntry.value;

        // Get encoder for this capture's type and encode the value
        const captureEncoder = encodeBeast2ValueToBufferFor(captureType, typeCtx);
        captureEncoder(captureValue, writer, ctx);
      }
    };
  } else if (type.type === "AsyncFunction") {
    return (value: any, writer: BufferWriter, ctx: Beast2EncodeContext = { refs: new Map() }) => {
      // Get IR from function
      const ir = value[EAST_IR_SYMBOL] as AsyncFunctionIR | undefined;

      if (!ir) {
        throw new Error(
          `Cannot serialize async function: no IR attached. ` +
          `Functions must be compiled from East IR to be serializable.`
        );
      }

      // Serialize the IR
      irEncoder(ir, writer, ctx);

      // Serialize capture values
      const captures = value[EAST_CAPTURES_SYMBOL] as RuntimeContext | undefined;
      const captureCount = ir.value.captures.length;

      // Write number of captures
      writer.writeVarint(captureCount);

      // Serialize each capture value using its type from the IR
      for (const captureVar of ir.value.captures) {
        const name = captureVar.value.name;
        const captureType = captureVar.value.type;

        // Captured variables are stored as variants - extract the value
        if (!captures) {
          throw new InternalError(`AsyncFunction has captures in IR but no EAST_CAPTURES_SYMBOL`);
        }
        const captureEntry = captures[name];
        if (!captureEntry) {
          throw new InternalError(`Capture '${name}' not found in async function's capture context`);
        }
        const captureValue = captureEntry.value;

        // Get encoder for this capture's type and encode the value
        const captureEncoder = encodeBeast2ValueToBufferFor(captureType, typeCtx);
        captureEncoder(captureValue, writer, ctx);
      }
    };
  } else if (type.type === "Vector") {
    return (value: Float64Array | BigInt64Array | Uint8ClampedArray, writer: BufferWriter, _ctx: Beast2EncodeContext = { refs: new Map() }) => {
      writer.writeVarint(value.length);
      writer.writeBytes(new Uint8Array(value.buffer, value.byteOffset, value.byteLength));
    };
  } else if (type.type === "Matrix") {
    return (value: any, writer: BufferWriter, _ctx: Beast2EncodeContext = { refs: new Map() }) => {
      const { data, rows, cols } = value;
      writer.writeVarint(rows);
      writer.writeVarint(cols);
      writer.writeBytes(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
    };
  } else {
    throw new Error(`Unhandled type ${(type satisfies never as EastTypeValue).type}`);
  }
}

export function decodeBeast2ValueFor(type: EastTypeValue | EastType, _typeCtx: Beast2DecodeTypeContext = [], options?: Beast2DecodeOptions): (buffer: Uint8Array, offset: number, ctx?: Beast2DecodeContext) => [any, number] {
  // Delegate to cursor-based decoder and wrap result in tuple for backward compatibility
  const cursorDecoder = _decodeCursorFor(type, [], options);
  return (buffer: Uint8Array, offset: number, ctx?: Beast2DecodeContext): [any, number] => {
    const reader = new BufferReader(buffer, offset);
    const refs = ctx?.refs ?? new Map<number, any>();
    const value = cursorDecoder(reader, refs);
    return [value, reader.offset];
  };
}

// =============================================================================
// Cursor-based decoder factory (zero-allocation hot path)
// =============================================================================

/**
 * Build a cursor-based decoder for the given type. Instead of returning
 * [value, offset] tuples, reads from a mutable BufferReader and returns
 * just the value. This eliminates millions of tuple allocations for large
 * deeply-nested types like UIComponentType.
 */
function _decodeCursorFor(type: EastTypeValue | EastType, typeCtx: CursorTypeContext = [], options?: Beast2DecodeOptions): CursorDecoder {
  if (!isVariant(type)) {
    type = toEastTypeValue(type);
  }

  if (type.type === "Never") {
    return () => { throw new Error(`Attempted to decode value of type .Never`); };
  } else if (type.type === "Null") {
    return () => null;
  } else if (type.type === "Boolean") {
    return (reader: BufferReader) => reader.readBoolean();
  } else if (type.type === "Integer") {
    return (reader: BufferReader) => reader.readZigzag();
  } else if (type.type === "Float") {
    return (reader: BufferReader) => reader.readFloat64LE();
  } else if (type.type === "String") {
    return (reader: BufferReader) => reader.readStringUtf8Varint();
  } else if (type.type === "DateTime") {
    return (reader: BufferReader) => new Date(Number(reader.readZigzag()));
  } else if (type.type === "Blob") {
    return (reader: BufferReader) => {
      const length = reader.readVarint();
      return reader.readBytes(length);
    };
  } else if (type.type === "Ref") {
    let valueDecoder: CursorDecoder;
    const ret: CursorDecoder = (reader: BufferReader, refs: Map<number, any>) => {
      const startOffset = reader.offset;
      const refOrLength = reader.readVarint();
      if (refOrLength > 0) {
        const targetOffset = startOffset - refOrLength;
        if (!refs.has(targetOffset)) {
          throw new Error(`Undefined backreference at offset ${startOffset}, target ${targetOffset}`);
        }
        return refs.get(targetOffset);
      }
      const result: ref<any> = ref(undefined);
      refs.set(reader.offset, result);
      result.value = valueDecoder(reader, refs);
      return result;
    };
    typeCtx.push(ret);
    valueDecoder = _decodeCursorFor(type.value, typeCtx, options);
    typeCtx.pop();
    return ret;
  } else if (type.type === "Array") {
    let valueDecoder: CursorDecoder;
    const ret: CursorDecoder = (reader: BufferReader, refs: Map<number, any>) => {
      const startOffset = reader.offset;
      const refOrLength = reader.readVarint();
      if (refOrLength > 0) {
        const targetOffset = startOffset - refOrLength;
        if (!refs.has(targetOffset)) {
          throw new Error(`Undefined backreference at offset ${startOffset}, target ${targetOffset}`);
        }
        return refs.get(targetOffset);
      }
      const result: any[] = [];
      refs.set(reader.offset, result);
      const length = reader.readVarint();
      for (let i = 0; i < length; i++) {
        result.push(valueDecoder(reader, refs));
      }
      return result;
    };
    typeCtx.push(ret);
    valueDecoder = _decodeCursorFor(type.value, typeCtx, options);
    typeCtx.pop();
    return ret;
  } else if (type.type === "Set") {
    const keyDecoder = _decodeCursorFor(type.value, typeCtx, options);
    return (reader: BufferReader, refs: Map<number, any>) => {
      const startOffset = reader.offset;
      const refOrLength = reader.readVarint();
      if (refOrLength > 0) {
        const targetOffset = startOffset - refOrLength;
        if (!refs.has(targetOffset)) {
          throw new Error(`Undefined backreference at offset ${startOffset}, target ${targetOffset}`);
        }
        return refs.get(targetOffset);
      }
      const result = new Set<any>();
      refs.set(reader.offset, result);
      const length = reader.readVarint();
      for (let i = 0; i < length; i++) {
        result.add(keyDecoder(reader, refs));
      }
      return result;
    };
  } else if (type.type === "Dict") {
    const keyDecoder = _decodeCursorFor(type.value.key, typeCtx, options);
    let valueDecoder: CursorDecoder;
    const ret: CursorDecoder = (reader: BufferReader, refs: Map<number, any>) => {
      const startOffset = reader.offset;
      const refOrLength = reader.readVarint();
      if (refOrLength > 0) {
        const targetOffset = startOffset - refOrLength;
        if (!refs.has(targetOffset)) {
          throw new Error(`Undefined backreference at offset ${startOffset}, target ${targetOffset}`);
        }
        return refs.get(targetOffset);
      }
      const result = new Map<any, any>();
      refs.set(reader.offset, result);
      const length = reader.readVarint();
      for (let i = 0; i < length; i++) {
        const key = keyDecoder(reader, refs);
        const value = valueDecoder(reader, refs);
        result.set(key, value);
      }
      return result;
    };
    typeCtx.push(ret);
    valueDecoder = _decodeCursorFor(type.value.value, typeCtx, options);
    typeCtx.pop();
    return ret;
  } else if (type.type === "Struct") {
    const fieldDecoders: [string, CursorDecoder][] = [];
    const ret: CursorDecoder = (reader: BufferReader, refs: Map<number, any>) => {
      const result: Record<string, any> = {};
      for (const [k, decoder] of fieldDecoders) {
        result[k] = decoder(reader, refs);
      }
      return result;
    };
    typeCtx.push(ret);
    for (const { name, type: fieldType } of type.value) {
      fieldDecoders.push([name, _decodeCursorFor(fieldType, typeCtx, options)]);
    }
    typeCtx.pop();
    return ret;
  } else if (type.type === "Variant") {
    const caseDecoders: [string, CursorDecoder][] = [];
    const ret: CursorDecoder = (reader: BufferReader, refs: Map<number, any>) => {
      const tagIndex = reader.readVarint();
      if (tagIndex >= caseDecoders.length) {
        throw new Error(`Invalid variant tag ${tagIndex} at offset ${reader.offset}`);
      }
      const [caseName, caseDecoder] = caseDecoders[tagIndex]!;
      const v = variant(caseName, undefined as any);
      (v as any).value = caseDecoder(reader, refs);
      return v;
    };
    typeCtx.push(ret);
    for (const { name, type: caseType } of type.value) {
      caseDecoders.push([name, _decodeCursorFor(caseType, typeCtx, options)]);
    }
    typeCtx.pop();
    return ret;
  } else if (type.type === "Recursive") {
    const ret = typeCtx[typeCtx.length - Number(type.value)];
    if (ret === undefined) {
      throw new Error(`Internal error: Recursive type context not found`);
    }
    return ret;
  } else if (type.type === "Function") {
    const platform = options?.platform ?? [];
    const platformFns = Object.fromEntries(platform.map(fn => [fn.name, fn.fn]));
    const asyncPlatformFns = new Set(platform.filter(fn => fn.type === 'async').map(fn => fn.name));
    const irCursorDecoder = _decodeCursorFor(IRTypeValue, [], options);

    return (reader: BufferReader, refs: Map<number, any>) => {
      const ir = irCursorDecoder(reader, refs) as FunctionIR;

      if (ir.type !== "Function") {
        throw new Error(`Expected Function IR, got ${ir.type} at offset ${reader.offset}`);
      }

      const captureCount = reader.readVarint();
      if (captureCount !== ir.value.captures.length) {
        throw new Error(
          `Capture count mismatch: IR has ${ir.value.captures.length} captures, ` +
          `but serialized data has ${captureCount}`
        );
      }

      const captureContext: RuntimeContext = {};
      for (const captureVar of ir.value.captures) {
        const name = captureVar.value.name;
        const captureType = captureVar.value.type;
        const captureDecoder = _decodeCursorFor(captureType, [], options);
        const captureValue = captureDecoder(reader, refs);
        captureContext[name] = captureVar.value.mutable
          ? variant("boxed", captureValue)
          : variant("value", captureValue);
      }

      const typeContext: Record<string, EastTypeValue> = {};
      for (const captureVar of ir.value.captures) {
        typeContext[captureVar.value.name] = captureVar.value.type;
      }

      // Skip analyzeIR — the IR was already analyzed before serialization.
      let rawFn: any;
      try {
        const analyzedIR = { ...ir, value: { ...ir.value, isAsync: false } } as AnalyzedIR;
        const compiled = compile_internal(analyzedIR, typeContext, platformFns, asyncPlatformFns, platform, true, new Set());
        rawFn = compiled(captureContext);
      } catch (e: unknown) {
        throw new Error(`Failed to compile decoded function: ${(e as Error).message}`);
      }

      const fn = (...inputs: any[]) => {
        try {
          return rawFn(...inputs);
        } catch (e: unknown) {
          if (e instanceof ReturnException) {
            return e.value;
          } else {
            throw e;
          }
        }
      };

      Object.defineProperty(fn, EAST_IR_SYMBOL, {
        value: ir,
        writable: false,
        enumerable: false,
        configurable: false
      });

      return fn;
    };
  } else if (type.type === "AsyncFunction") {
    const platform = options?.platform ?? [];
    const platformFns = Object.fromEntries(platform.map(fn => [fn.name, fn.fn]));
    const asyncPlatformFns = new Set(platform.filter(fn => fn.type === 'async').map(fn => fn.name));
    const irCursorDecoder = _decodeCursorFor(IRTypeValue, [], options);

    return (reader: BufferReader, refs: Map<number, any>) => {
      const ir = irCursorDecoder(reader, refs) as AsyncFunctionIR;

      if (ir.type !== "AsyncFunction") {
        throw new Error(`Expected AsyncFunction IR, got ${ir.type} at offset ${reader.offset}`);
      }

      const captureCount = reader.readVarint();
      if (captureCount !== ir.value.captures.length) {
        throw new Error(
          `Capture count mismatch: IR has ${ir.value.captures.length} captures, ` +
          `but serialized data has ${captureCount}`
        );
      }

      const captureContext: RuntimeContext = {};
      for (const captureVar of ir.value.captures) {
        const name = captureVar.value.name;
        const captureType = captureVar.value.type;
        const captureDecoder = _decodeCursorFor(captureType, [], options);
        const captureValue = captureDecoder(reader, refs);
        captureContext[name] = captureVar.value.mutable
          ? variant("boxed", captureValue)
          : variant("value", captureValue);
      }

      const typeContext: Record<string, EastTypeValue> = {};
      for (const captureVar of ir.value.captures) {
        typeContext[captureVar.value.name] = captureVar.value.type;
      }

      // Skip analyzeIR — the IR was already analyzed before serialization.
      let rawFn: any;
      try {
        const analyzedIR = { ...ir, value: { ...ir.value, isAsync: true } } as AnalyzedIR;
        const compiled = compile_internal(analyzedIR, typeContext, platformFns, asyncPlatformFns, platform, true, new Set());
        rawFn = compiled(captureContext);
      } catch (e: unknown) {
        throw new Error(`Failed to compile decoded async function: ${(e as Error).message}`);
      }

      const fn = async (...inputs: any[]) => {
        try {
          return await rawFn(...inputs);
        } catch (e: unknown) {
          if (e instanceof ReturnException) {
            return e.value;
          } else {
            throw e;
          }
        }
      };

      Object.defineProperty(fn, EAST_IR_SYMBOL, {
        value: ir,
        writable: false,
        enumerable: false,
        configurable: false
      });

      return fn;
    };
  } else if (type.type === "Vector") {
    const bytesPerElement = _bytesPerElement(type.value);
    return (reader: BufferReader) => {
      const length = reader.readVarint();
      const byteLen = length * bytesPerElement;
      // Copy bytes to a new aligned buffer
      const rawBytes = new Uint8Array(reader.readBytesView(byteLen));
      if (type.value.type === "Float") {
        return new Float64Array(rawBytes.buffer, 0, length);
      } else if (type.value.type === "Integer") {
        return new BigInt64Array(rawBytes.buffer, 0, length);
      } else {
        return new Uint8ClampedArray(rawBytes.buffer, 0, length);
      }
    };
  } else if (type.type === "Matrix") {
    const bytesPerElement = _bytesPerElement(type.value);
    return (reader: BufferReader) => {
      const rows = reader.readVarint();
      const cols = reader.readVarint();
      const byteLen = rows * cols * bytesPerElement;
      const rawBytes = new Uint8Array(reader.readBytesView(byteLen));
      if (type.value.type === "Float") {
        return matrix(new Float64Array(rawBytes.buffer, 0, rows * cols), rows, cols);
      } else if (type.value.type === "Integer") {
        return matrix(new BigInt64Array(rawBytes.buffer, 0, rows * cols), rows, cols);
      } else {
        return matrix(new Uint8ClampedArray(rawBytes.buffer, 0, rows * cols), rows, cols);
      }
    };
  } else {
    throw new Error(`Unhandled type ${(type satisfies never as EastTypeValue).type}`);
  }
}

// =============================================================================
// High-level API (header-free encoding)
// =============================================================================

export function encodeBeast2ValueFor(type: EastTypeValue): (value: any) => Uint8Array
export function encodeBeast2ValueFor<T extends EastType>(type: T): (value: ValueTypeOf<T>) => Uint8Array
export function encodeBeast2ValueFor(type: EastTypeValue | EastType): (value: any) => Uint8Array {
  // Convert EastType to EastTypeValue if necessary
  if (!isVariant(type)) {
    type = toEastTypeValue(type);
  }

  const encoder = encodeBeast2ValueToBufferFor(type as EastTypeValue);
  return (value: any): Uint8Array => {
    const writer = new BufferWriter();
    const ctx: Beast2EncodeContext = { refs: new Map() };
    encoder(value, writer, ctx);
    return writer.toUint8Array();
  };
}

// =============================================================================
// Beast format (Minimal header with self-describing type)
// =============================================================================

// Magic bytes for Beast format
// 0x89       - Invalid UTF-8 marker (like PNG)
// 0x45 0x61 0x73 0x74 - "East" (human-readable in hex dumps)
// 0x0D 0x0A  - CRLF (detects line-ending corruption)
// 0x01       - Version byte (currently 1)
export const MAGIC_BYTES = new Uint8Array([0x89, 0x45, 0x61, 0x73, 0x74, 0x0D, 0x0A, 0x01]);
const typeEncoder = encodeBeast2ValueToBufferFor(EastTypeValueType);
const typeCursorDecoder = _decodeCursorFor(EastTypeValueType);

// IR encoder/decoder for function serialization
const IRTypeValue = toEastTypeValue(IRType);
const irEncoder = encodeBeast2ValueToBufferFor(IRTypeValue);

export function encodeBeast2For(type: EastTypeValue): (value: any) => Uint8Array
export function encodeBeast2For<T extends EastType>(type: T): (value: ValueTypeOf<T>) => Uint8Array
export function encodeBeast2For(type: EastTypeValue | EastType): (value: any) => Uint8Array {
  // Convert EastType to EastTypeValue if necessary
  if (!isVariant(type)) {
      type = toEastTypeValue(type);
  }

  const valueEncoder = encodeBeast2ValueToBufferFor(type as EastTypeValue);

  return (value: any) => {
    const writer = new BufferWriter();

    // Write magic bytes (8 bytes)
    writer.writeBytes(MAGIC_BYTES);

    // Write type schema
    typeEncoder(type, writer, { refs: new Map() });

    // Write value
    const ctx: Beast2EncodeContext = { refs: new Map() };
    valueEncoder(value, writer, ctx);

    return writer.toUint8Array();
  };
}

export function decodeBeast2(data: Uint8Array): { type: EastTypeValue; value: any } {
  // Verify magic bytes
  if (data.length < MAGIC_BYTES.length) {
    throw new Error(`Data too short for Beast format: ${data.length} bytes`);
  }

  for (let i = 0; i < MAGIC_BYTES.length; i++) {
    if (data[i] !== MAGIC_BYTES[i]) {
      throw new Error(`Invalid Beast magic bytes at offset ${i}: expected 0x${MAGIC_BYTES[i]!.toString(16)}, got 0x${data[i]!.toString(16)}`);
    }
  }

  // Decode type schema and value using cursor-based decoders
  const reader = new BufferReader(data, MAGIC_BYTES.length);
  const refs = new Map<number, any>();
  const type = typeCursorDecoder(reader, refs) as EastTypeValue;

  // Decode value
  const valueDecoder = _decodeCursorFor(type);
  const value = valueDecoder(reader, refs);

  // Verify we consumed all data
  if (reader.offset !== data.length) {
    throw new Error(`Unexpected data after Beast value at offset ${reader.offset} (${data.length - reader.offset} bytes remaining)`);
  }

  return { type, value };
}

export function decodeBeast2For(type: EastTypeValue, options?: Beast2DecodeOptions): (data: Uint8Array) => any
export function decodeBeast2For<T extends EastType>(type: T, options?: Beast2DecodeOptions): (data: Uint8Array) => ValueTypeOf<T>
export function decodeBeast2For(type: EastTypeValue | EastType, options?: Beast2DecodeOptions): (data: Uint8Array) => any {
  // Convert EastType to EastTypeValue if necessary
  if (!isVariant(type)) {
      type = toEastTypeValue(type);
  }

  const cursorDecoder = _decodeCursorFor(type as EastTypeValue, [], options);
  const skipTypeCheck = options?.skipTypeCheck ?? false;

  // Pre-encode the expected type header bytes for fast byte-level comparison.
  // This avoids decoding the type from binary + deep structural equality on every call.
  const expectedTypeWriter = new BufferWriter();
  typeEncoder(type, expectedTypeWriter, { refs: new Map() });
  const expectedTypeBytes = expectedTypeWriter.toUint8Array();
  const expectedTypeLen = expectedTypeBytes.length;
  const valueStartOffset = MAGIC_BYTES.length + expectedTypeLen;

  return (data: Uint8Array) => {
    // Verify magic bytes
    if (data.length < MAGIC_BYTES.length) {
      throw new Error(`Data too short for Beast format: ${data.length} bytes`);
    }

    for (let i = 0; i < MAGIC_BYTES.length; i++) {
      if (data[i] !== MAGIC_BYTES[i]) {
        throw new Error(`Invalid Beast magic bytes at offset ${i}: expected 0x${MAGIC_BYTES[i]!.toString(16)}, got 0x${data[i]!.toString(16)}`);
      }
    }

    if (!skipTypeCheck) {
      // Fast path: compare raw type header bytes instead of decode + structural equality.
      if (data.length < valueStartOffset) {
        throw new Error(`Data too short for type header: expected at least ${valueStartOffset} bytes, got ${data.length}`);
      }
      for (let i = 0; i < expectedTypeLen; i++) {
        if (data[MAGIC_BYTES.length + i] !== expectedTypeBytes[i]) {
          const typeReader = new BufferReader(data, MAGIC_BYTES.length);
          const decodedType = typeCursorDecoder(typeReader, new Map()) as EastTypeValue;
          throw new Error(`Type mismatch: expected ${printTypeValue(type as EastTypeValue)}, got ${printTypeValue(decodedType)}`);
        }
      }
    }

    // Decode value using cursor-based decoder
    const reader = new BufferReader(data, valueStartOffset);
    const refs = new Map<number, any>();
    const value = cursorDecoder(reader, refs);

    // Verify we consumed all data
    if (reader.offset !== data.length) {
      throw new Error(`Unexpected data after Beast value at offset ${reader.offset} (${data.length - reader.offset} bytes remaining)`);
    }

    return value;
  };
}

// =============================================================================
// Function serialization helpers
// =============================================================================

// Re-export for convenience
export { EAST_IR_SYMBOL, EAST_CAPTURES_SYMBOL } from "../compile.js";

import { EastIR, AsyncEastIR } from "../eastir.js";

/**
 * Compile a deserialized FunctionIR to an executable function.
 *
 * @param ir - The FunctionIR returned from BEAST2 deserialization
 * @param platform - Platform functions required for execution
 * @returns Compiled JavaScript function
 *
 * @example
 * ```ts
 * const funcType = FunctionType([IntegerType], IntegerType);
 * const data = encodeBeast2For(funcType)(myCompiledFunc);
 * const ir = decodeBeast2For(funcType)(data);
 * const recompiled = compileFunctionIR(ir, []);
 * const result = recompiled(42n);
 * ```
 */
export function compileFunctionIR<I extends any[], O>(
  ir: FunctionIR,
  platform: PlatformFunction[]
): (...args: I) => O {
  return new EastIR(ir).compile(platform) as (...args: I) => O;
}

/**
 * Compile a deserialized AsyncFunctionIR to an executable async function.
 *
 * @param ir - The AsyncFunctionIR returned from BEAST2 deserialization
 * @param platform - Platform functions required for execution
 * @returns Compiled JavaScript async function
 */
export function compileAsyncFunctionIR<I extends any[], O>(
  ir: AsyncFunctionIR,
  platform: PlatformFunction[]
): (...args: I) => Promise<O> {
  return new AsyncEastIR(ir).compile(platform) as (...args: I) => Promise<O>;
}
