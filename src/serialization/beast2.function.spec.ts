/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { encodeBeast2For, decodeBeast2For, decodeBeast2, decodeBeast2WithHandles, encodeBeast2ValueToBufferFor, MAGIC_BYTES } from "./beast2.js";
import type { FunctionHandleResolver } from "./beast2.js";
import type { EastTypeValue } from "../type_of_type.js";
import {
  IntegerType,
  StringType,
  FunctionType,
  ArrayType,
  StructType,
  VariantType,
  RecursiveType,
} from "../types.js";
import { East, variant } from "../index.js";
import { toEastTypeValue, EastTypeValueType } from "../type_of_type.js";
import { BufferWriter } from "./binary-utils.js";

// =============================================================================
// Basic Function Serialization (no captures)
// =============================================================================

describe("Beast2 Function Serialization - Basic", () => {
  test("free function (no captures) round-trips correctly", () => {
    const FnType = FunctionType([IntegerType], IntegerType);

    // Create a simple function that doubles its input
    const double = East.function([IntegerType], IntegerType, ($, x) => {
      return x.multiply(2n);
    });

    // Compile and get a callable function
    const compiled = East.compile(double, []);

    // Encode and decode
    const encode = encodeBeast2For(FnType);
    const decode = decodeBeast2For(FnType);

    const encoded = encode(compiled);
    const decoded = decode(encoded);

    // Verify it works
    assert.equal(decoded(21n), 42n);
  });

  test("free function with multiple parameters round-trips", () => {
    const FnType = FunctionType([IntegerType, IntegerType], IntegerType);

    const add = East.function([IntegerType, IntegerType], IntegerType, ($, a, b) => {
      return a.add(b);
    });

    const compiled = East.compile(add, []);
    const encode = encodeBeast2For(FnType);
    const decode = decodeBeast2For(FnType);

    const encoded = encode(compiled);
    const decoded = decode(encoded);

    assert.equal(decoded(20n, 22n), 42n);
  });
});

// =============================================================================
// Function with Simple Captures
// =============================================================================

describe("Beast2 Function Serialization - Simple Captures", () => {
  test("function with single integer capture round-trips", () => {
    const FnType = FunctionType([], IntegerType);

    // Create outer function that returns a closure
    const makeGetter = East.function([IntegerType], FnType, ($, value) => {
      return East.function([], IntegerType, (_$) => {
        return value; // captures 'value'
      });
    });

    const compiled = East.compile(makeGetter, []);
    const getter = compiled(42n); // Returns a closure that captured 42

    // Encode and decode the closure
    const encode = encodeBeast2For(FnType);
    const decode = decodeBeast2For(FnType);

    const encoded = encode(getter);
    const decoded = decode(encoded);

    assert.equal(decoded(), 42n);
  });

  test("function with multiple captures round-trips", () => {
    const FnType = FunctionType([], IntegerType);

    const makeAdder = East.function([IntegerType, IntegerType], FnType, ($, a, b) => {
      return East.function([], IntegerType, (_$) => {
        return a.add(b); // captures both 'a' and 'b'
      });
    });

    const compiled = East.compile(makeAdder, []);
    const adder = compiled(20n, 22n);

    const encode = encodeBeast2For(FnType);
    const decode = decodeBeast2For(FnType);

    const encoded = encode(adder);
    const decoded = decode(encoded);

    assert.equal(decoded(), 42n);
  });
});

// =============================================================================
// Function with Nested Functions (the bug case)
// =============================================================================

describe("Beast2 Function Serialization - Nested Functions with Captures", () => {

  test("function with capture used in nested map callback", () => {
    // This is the pattern that fails in the UI:
    // - Outer function captures a value
    // - Inner code uses .map() which creates a nested function
    // - The nested function references the captured value

    const FnType = FunctionType([], ArrayType(IntegerType));

    const makeMapper = East.function([IntegerType], FnType, ($, multiplier) => {
      // Return a function that maps an array, multiplying each element
      return East.function([], ArrayType(IntegerType), ($) => {
        const arr = $.let([1n, 2n, 3n], ArrayType(IntegerType));
        // .map creates a nested function that captures 'multiplier'
        return arr.map(($, elem) => elem.multiply(multiplier));
      });
    });

    const compiled = East.compile(makeMapper, []);
    const mapper = compiled(10n); // multiplier = 10

    // Encode and decode
    const encode = encodeBeast2For(FnType);
    const decode = decodeBeast2For(FnType);

    const encoded = encode(mapper);
    const decoded = decode(encoded);

    // Should return [10, 20, 30]
    const result = decoded();
    assert.deepEqual(result, [10n, 20n, 30n]);
  });

  test("function with capture and nested function that also captures", () => {
    // Even more explicit: outer captures X, inner function captures X too
    const InnerFnType = FunctionType([], IntegerType);
    const OuterFnType = FunctionType([], InnerFnType);

    const makeNested = East.function([IntegerType], OuterFnType, ($, value) => {
      // Outer closure captures 'value'
      return East.function([], InnerFnType, (_$) => {
        // Inner closure also captures 'value' (from outer closure's scope)
        return East.function([], IntegerType, (_$) => {
          return value;
        });
      });
    });

    const compiled = East.compile(makeNested, []);
    const outer = compiled(42n);

    // Encode and decode the outer closure
    const encode = encodeBeast2For(OuterFnType);
    const decode = decodeBeast2For(OuterFnType);

    const encoded = encode(outer);
    const decoded = decode(encoded);

    // Call through: decoded() -> inner, inner() -> 42
    assert.equal(decoded()(), 42n);
  });

  test("struct containing function with capture that uses nested function", () => {
    // This simulates the ReactiveComponent case:
    // - A struct (like ReactiveComponent variant) contains a function
    // - The function has captures
    // - The function body contains nested functions

    const RenderFnType = FunctionType([], StringType);
    const ComponentType = StructType({
      render: RenderFnType,
    });

    const makeComponent = East.function([StringType], ComponentType, ($, title) => {
      return {
        render: East.function([], StringType, ($) => {
          // Use the captured 'title' inside a nested operation
          const items = $.let(["a", "b"], ArrayType(StringType));
          // .map creates nested function, but we just use title directly here
          const prefixed = $.let(items.map(($, item) => East.str`${title}: ${item}`));
          return prefixed.get(0n);
        }),
      };
    });

    const compiled = East.compile(makeComponent, []);
    const component = compiled("Hello");

    // Encode and decode
    const encode = encodeBeast2For(ComponentType);
    const decode = decodeBeast2For(ComponentType);

    const encoded = encode(component);
    const decoded = decode(encoded);

    assert.equal(decoded.render(), "Hello: a");
  });
});

// =============================================================================
// Variant containing Function with Captures (simulates UIComponentType)
// =============================================================================

describe("Beast2 Function Serialization - Variant with Function Captures", () => {

  test("variant containing function with capture", () => {
    const RenderFnType = FunctionType([], IntegerType);
    const UIType = VariantType({
      Static: IntegerType,
      Reactive: StructType({ render: RenderFnType }),
    });

    const makeReactive = East.function([IntegerType], UIType, ($, value) => {
      return variant("Reactive", {
        render: East.function([], IntegerType, (_$) => {
          return value; // captures 'value'
        }),
      });
    });

    const compiled = East.compile(makeReactive, []);
    const reactive = compiled(42n);

    // Encode and decode
    const encode = encodeBeast2For(UIType);
    const decode = decodeBeast2For(UIType);

    const encoded = encode(reactive);
    const decoded = decode(encoded);

    // Extract and call the render function
    assert.equal(decoded.type, "Reactive");
    assert.equal(decoded.value.render(), 42n);
  });

  test("variant containing function with capture and nested map", () => {
    // This is closest to the actual bug case
    const RenderFnType = FunctionType([], ArrayType(IntegerType));
    const UIType = VariantType({
      Static: IntegerType,
      Reactive: StructType({ render: RenderFnType }),
    });

    const makeReactive = East.function([ArrayType(IntegerType)], UIType, ($, data) => {
      return variant("Reactive", {
        render: East.function([], ArrayType(IntegerType), (_$) => {
          // Use captured 'data' in a map operation
          return data.map(($, x) => x.multiply(2n));
        }),
      });
    });

    const compiled = East.compile(makeReactive, []);
    const reactive = compiled([1n, 2n, 3n]);

    // Encode and decode
    const encode = encodeBeast2For(UIType);
    const decode = decodeBeast2For(UIType);

    const encoded = encode(reactive);
    const decoded = decode(encoded);

    // Extract and call the render function
    assert.equal(decoded.type, "Reactive");
    assert.deepEqual(decoded.value.render(), [2n, 4n, 6n]);
  });
});

// =============================================================================
// Using untyped decodeBeast2 (like the webview does)
// =============================================================================

describe("Beast2 Function Serialization - Untyped Decode", () => {

  test("untyped decode of function with simple capture", () => {
    const FnType = FunctionType([], IntegerType);

    const makeGetter = East.function([IntegerType], FnType, ($, value) => {
      return East.function([], IntegerType, (_$) => {
        return value;
      });
    });

    const compiled = East.compile(makeGetter, []);
    const getter = compiled(42n);

    // Encode with typed encoder
    const encode = encodeBeast2For(FnType);
    const encoded = encode(getter);

    // Decode with UNTYPED decoder (like webview does)
    const { type, value: decoded } = decodeBeast2(encoded);

    assert.deepEqual(type, toEastTypeValue(FnType));
    assert.equal(decoded(), 42n);
  });

  test("untyped decode of variant with function capture and nested map", () => {
    // This is the exact pattern from the user's bug
    const RenderFnType = FunctionType([], ArrayType(IntegerType));
    const UIType = VariantType({
      Static: IntegerType,
      Reactive: StructType({ render: RenderFnType }),
    });

    const makeReactive = East.function([ArrayType(IntegerType)], UIType, ($, data) => {
      return variant("Reactive", {
        render: East.function([], ArrayType(IntegerType), (_$) => {
          return data.map(($, x) => x.multiply(2n));
        }),
      });
    });

    const compiled = East.compile(makeReactive, []);
    const reactive = compiled([1n, 2n, 3n]);

    // Encode with typed encoder
    const encode = encodeBeast2For(UIType);
    const encoded = encode(reactive);

    // Decode with UNTYPED decoder
    const { value: decoded } = decodeBeast2(encoded);

    assert.equal(decoded.type, "Reactive");
    assert.deepEqual(decoded.value.render(), [2n, 4n, 6n]);
  });
});

// =============================================================================
// Recursive type with function captures (like UIComponentType)
// =============================================================================

describe("Beast2 Function Serialization - Recursive Types", () => {

  test("recursive type with embedded function that has captures", () => {
    // Simulates UIComponentType: recursive variant with ReactiveComponent
    const UIType = RecursiveType(node => VariantType({
      Text: StringType,
      Box: StructType({ children: ArrayType(node) }),
      Reactive: StructType({ render: FunctionType([], node) }),
    }));

    const makeReactive = East.function([StringType], UIType, ($, text) => {
      return variant("Reactive", {
        render: East.function([], UIType, (_$) => {
          // Return a Text node using captured 'text'
          return variant("Text", text);
        }),
      });
    });

    const compiled = East.compile(makeReactive, []);
    const reactive = compiled("Hello");

    // Encode and decode
    const encode = encodeBeast2For(UIType);
    const decode = decodeBeast2For(UIType);

    const encoded = encode(reactive);
    const decoded = decode(encoded);

    assert.equal(decoded.type, "Reactive");
    const rendered = decoded.value.render();
    assert.equal(rendered.type, "Text");
    assert.equal(rendered.value, "Hello");
  });
});

// =============================================================================
// decodeBeast2WithHandles — handle-aware function decoding
// =============================================================================

// Helper: build beast2-full bytes with handle IDs at function positions.
// Writes magic + type schema + value bytes. The caller provides a writeValue
// callback that writes the value portion (with varint handle IDs for functions).
const typeSchemaEncoder = encodeBeast2ValueToBufferFor(EastTypeValueType);

function buildHandleModeBytes(type: any, writeValue: (writer: BufferWriter) => void): Uint8Array {
  const writer = new BufferWriter();
  writer.writeBytes(MAGIC_BYTES);
  typeSchemaEncoder(toEastTypeValue(type), writer, { refs: new Map() });
  writer.writeVarint(0); // empty global type table
  writeValue(writer);
  return writer.toUint8Array();
}

// Helper: encode a non-function value into a BufferWriter using the standard encoder
function writeEncodedValue(writer: BufferWriter, type: any, value: any): void {
  const encoder = encodeBeast2ValueToBufferFor(toEastTypeValue(type));
  encoder(value, writer, { refs: new Map() });
}

describe("Beast2 decodeBeast2WithHandles", () => {

  test("value with no functions decodes identically", () => {
    const type = StructType({ x: IntegerType, y: StringType });
    const value = { x: 42n, y: "hello" };
    const bytes = encodeBeast2For(type)(value);

    const resolver: FunctionHandleResolver = () => {
      throw new Error("should not be called");
    };

    const result = decodeBeast2WithHandles(bytes, resolver);
    assert.equal(result.value.x, 42n);
    assert.equal(result.value.y, "hello");
    assert.equal(result.handles.length, 0);
    assert.deepEqual(result.type, toEastTypeValue(type));
  });

  test("correctly extracts type from beast2-full header", () => {
    const type = ArrayType(IntegerType);
    const value = [1n, 2n, 3n];
    const bytes = encodeBeast2For(type)(value);

    const result = decodeBeast2WithHandles(bytes, () => {
      throw new Error("should not be called");
    });

    assert.deepEqual(result.type, toEastTypeValue(type));
    assert.deepEqual(result.value, [1n, 2n, 3n]);
  });

  test("struct with function field: resolver called with handle ID", () => {
    const fnType = FunctionType([IntegerType], IntegerType);
    const structType = StructType({ name: StringType, transform: fnType });

    // Build handle-mode bytes: struct { name: "test", transform: handle(42) }
    const bytes = buildHandleModeBytes(structType, (writer) => {
      writeEncodedValue(writer, StringType, "test");
      writer.writeVarint(42); // handle ID at function position
    });

    const calledWith: { handleId: number; fnType: EastTypeValue }[] = [];
    const resolver: FunctionHandleResolver = (handleId, fnType) => {
      calledWith.push({ handleId, fnType });
      return (x: bigint) => x * 2n;
    };

    const result = decodeBeast2WithHandles(bytes, resolver);
    assert.equal(result.value.name, "test");
    assert.equal(result.handles.length, 1);
    assert.equal(result.handles[0], 42);
    assert.equal(calledWith.length, 1);
    assert.equal(calledWith[0]!.handleId, 42);

    // The returned wrapper should be callable
    assert.equal(result.value.transform(21n), 42n);
  });

  test("multiple functions in array each get separate handles", () => {
    const fnType = FunctionType([IntegerType], IntegerType);
    const arrType = ArrayType(fnType);

    // Build handle-mode bytes: [handle(10), handle(20), handle(30)]
    const bytes = buildHandleModeBytes(arrType, (writer) => {
      writer.writeVarint(0); // inline marker (mutable container)
      writer.writeVarint(3); // array length
      writer.writeVarint(10);
      writer.writeVarint(20);
      writer.writeVarint(30);
    });

    const handles: number[] = [];
    const resolver: FunctionHandleResolver = (handleId) => {
      handles.push(handleId);
      return (x: bigint) => x + BigInt(handleId);
    };

    const result = decodeBeast2WithHandles(bytes, resolver);
    assert.equal(result.handles.length, 3);
    assert.deepEqual(result.handles, [10, 20, 30]);
    assert.equal(result.value.length, 3);

    // Each wrapper should use its handle ID
    assert.equal(result.value[0](0n), 10n);
    assert.equal(result.value[1](0n), 20n);
    assert.equal(result.value[2](0n), 30n);
  });

  test("variant with function handle decodes correctly", () => {
    const fnType = FunctionType([], IntegerType);
    const uiType = VariantType({
      Static: IntegerType,
      Reactive: StructType({ render: fnType }),
    });

    // Build handle-mode bytes: .Reactive { render: handle(99) }
    // Variant cases sorted alphabetically: Reactive=0, Static=1
    const bytes = buildHandleModeBytes(uiType, (writer) => {
      writer.writeVarint(0); // case index for "Reactive"
      writer.writeVarint(99); // handle ID for render function
    });

    const resolver: FunctionHandleResolver = (handleId) => {
      return () => BigInt(handleId);
    };

    const result = decodeBeast2WithHandles(bytes, resolver);
    assert.equal(result.value.type, "Reactive");
    assert.equal(result.handles.length, 1);
    assert.equal(result.handles[0], 99);
    assert.equal(result.value.value.render(), 99n);
  });

  test("struct with mixed function and non-function fields", () => {
    const fnType = FunctionType([StringType], StringType);
    const type = StructType({
      count: IntegerType,
      label: StringType,
      formatter: fnType,
    });

    // Build handle-mode bytes: { count: 7, label: "hi", formatter: handle(5) }
    // Struct fields are ordered: count, label, formatter (insertion order)
    const bytes = buildHandleModeBytes(type, (writer) => {
      writeEncodedValue(writer, IntegerType, 7n);     // count
      writeEncodedValue(writer, StringType, "hi");     // label
      writer.writeVarint(5);                            // formatter handle
    });

    const resolver: FunctionHandleResolver = (handleId) => {
      return (s: string) => `[${handleId}] ${s}`;
    };

    const result = decodeBeast2WithHandles(bytes, resolver);
    assert.equal(result.value.count, 7n);
    assert.equal(result.value.label, "hi");
    assert.equal(result.handles.length, 1);
    assert.equal(result.handles[0], 5);
    assert.equal(result.value.formatter("world"), "[5] world");
  });

  test("resolver receives correct function type info", () => {
    const fnType1 = FunctionType([IntegerType], StringType);
    const fnType2 = FunctionType([StringType, IntegerType], IntegerType);
    const type = StructType({ a: fnType1, b: fnType2 });

    const bytes = buildHandleModeBytes(type, (writer) => {
      writer.writeVarint(1); // handle for a
      writer.writeVarint(2); // handle for b
    });

    const receivedTypes: EastTypeValue[] = [];
    const resolver: FunctionHandleResolver = (handleId, fnType) => {
      receivedTypes.push(fnType);
      return () => null;
    };

    const result = decodeBeast2WithHandles(bytes, resolver);
    assert.equal(receivedTypes.length, 2);
    // First function: (Integer) -> String
    assert.equal(receivedTypes[0]!.type, "Function");
    // Second function: (String, Integer) -> Integer
    assert.equal(receivedTypes[1]!.type, "Function");
    assert.equal(result.handles.length, 2);
    assert.deepEqual(result.handles, [1, 2]);
  });
});
