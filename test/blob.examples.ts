/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import { East, BlobType, StringType, IntegerType, StructType, ArrayType, example } from "@elaraai/east";

// ---------------------------------------------------------------------------
// Construction & Access
// ---------------------------------------------------------------------------

export const blobSize = example({
    keywords: ["blob", "BlobType", "size", "length", "bytes"],
    description: "Get the size of a blob in bytes",
    fn: East.function([], IntegerType, ($) => {
        const b = $.const(Uint8Array.from([1, 2, 3]), BlobType);
        return b.size();
    }),
    inputs: [],
    returns: 3n,
});

export const blobGetUint8 = example({
    keywords: ["blob", "BlobType", "getUint8", "byte", "index", "access"],
    description: "Get a byte value from a blob by index",
    fn: East.function([], IntegerType, ($) => {
        const b = $.const(Uint8Array.from([10, 20, 30]), BlobType);
        return b.getUint8(1n);
    }),
    inputs: [],
    returns: 20n,
});

// ---------------------------------------------------------------------------
// UTF-8 Encoding/Decoding
// ---------------------------------------------------------------------------

export const blobEncodeUtf8 = example({
    keywords: ["blob", "BlobType", "encodeUtf8", "string", "utf8", "encoding"],
    description: "Encode a string to a UTF-8 blob",
    fn: East.function([], BlobType, ($) => {
        const s = $.const("Hello", StringType);
        return s.encodeUtf8();
    }),
    inputs: [],
    returns: Uint8Array.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]),
});

export const blobDecodeUtf8 = example({
    keywords: ["blob", "BlobType", "decodeUtf8", "string", "utf8", "decoding"],
    description: "Decode a UTF-8 blob to a string",
    fn: East.function([], StringType, ($) => {
        const b = $.const(Uint8Array.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]), BlobType);
        return b.decodeUtf8();
    }),
    inputs: [],
    returns: "Hello",
});

// ---------------------------------------------------------------------------
// UTF-16 Encoding/Decoding
// ---------------------------------------------------------------------------

export const blobEncodeUtf16 = example({
    keywords: ["blob", "BlobType", "encodeUtf16", "string", "utf16", "encoding"],
    description: "Encode a string to a UTF-16 blob with BOM",
    fn: East.function([], BlobType, ($) => {
        const s = $.const("Hello", StringType);
        return s.encodeUtf16();
    }),
    inputs: [],
    returns: Uint8Array.from([
        0xFF, 0xFE,
        0x48, 0x00,
        0x65, 0x00,
        0x6C, 0x00,
        0x6C, 0x00,
        0x6F, 0x00,
    ]),
});

export const blobDecodeUtf16 = example({
    keywords: ["blob", "BlobType", "decodeUtf16", "string", "utf16", "decoding"],
    description: "Decode a UTF-16 blob to a string",
    fn: East.function([], StringType, ($) => {
        const b = $.const(Uint8Array.from([
            0xFF, 0xFE,
            0x48, 0x00,
            0x65, 0x00,
            0x6C, 0x00,
            0x6C, 0x00,
            0x6F, 0x00,
        ]), BlobType);
        return b.decodeUtf16();
    }),
    inputs: [],
    returns: "Hello",
});

// ---------------------------------------------------------------------------
// Beast v1 Encoding/Decoding
// ---------------------------------------------------------------------------

export const blobEncodeBeastV1 = example({
    keywords: ["blob", "BlobType", "encodeBeast", "beast", "v1", "binary", "serialization"],
    description: "Encode a value to Beast v1 binary format",
    fn: East.function([], BlobType, ($) => {
        const value = $.const(42n, IntegerType);
        return East.Blob.encodeBeast(value, 'v1');
    }),
    inputs: [],
    returns: new Uint8Array([
        69, 97, 115, 116, 0, 234, 87, 255,
        6,
        128, 0, 0, 0, 0, 0, 0, 42,
    ]),
});

export const blobDecodeBeastV1 = example({
    keywords: ["blob", "BlobType", "decodeBeast", "beast", "v1", "binary", "deserialization"],
    description: "Decode a Beast v1 blob back to a typed value",
    fn: East.function([], IntegerType, ($) => {
        const value = $.const(42n, IntegerType);
        const encoded = $.let(East.Blob.encodeBeast(value, 'v1'));
        return encoded.decodeBeast(IntegerType, 'v1');
    }),
    inputs: [],
    returns: 42n,
});

// ---------------------------------------------------------------------------
// Beast v2 Encoding/Decoding
// ---------------------------------------------------------------------------

export const blobEncodeBeastV2 = example({
    keywords: ["blob", "BlobType", "encodeBeast", "beast", "v2", "binary", "serialization"],
    description: "Encode a value to Beast v2 binary format",
    fn: East.function([], BlobType, ($) => {
        const value = $.const(42n, IntegerType);
        return East.Blob.encodeBeast(value, 'v2');
    }),
    inputs: [],
    returns: new Uint8Array([
        137, 69, 97, 115, 116, 13, 10, 1,
        8,
        0,
        84,
    ]),
});

export const blobDecodeBeastV2 = example({
    keywords: ["blob", "BlobType", "decodeBeast", "beast", "v2", "binary", "deserialization"],
    description: "Decode a Beast v2 blob back to a typed value",
    fn: East.function([], IntegerType, ($) => {
        const value = $.const(42n, IntegerType);
        const encoded = $.let(East.Blob.encodeBeast(value, 'v2'));
        return encoded.decodeBeast(IntegerType, 'v2');
    }),
    inputs: [],
    returns: 42n,
});

// ---------------------------------------------------------------------------
// CSV Decoding
// ---------------------------------------------------------------------------

export const blobDecodeCsv = example({
    keywords: ["blob", "BlobType", "decodeCsv", "csv", "parsing", "tabular"],
    description: "Decode a CSV blob into an array of structs",
    fn: East.function([], ArrayType(StructType({ name: StringType, age: IntegerType })), ($) => {
        const csv = $.const(new TextEncoder().encode("name,age\nAlice,30\nBob,25"), BlobType);
        return csv.decodeCsv(StructType({ name: StringType, age: IntegerType }));
    }),
    inputs: [],
    returns: [{ name: "Alice", age: 30n }, { name: "Bob", age: 25n }],
});

