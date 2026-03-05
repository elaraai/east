/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import { describe, test } from "node:test";
import assert from "node:assert";
import {
    NeverType,
    NullType,
    BooleanType,
    IntegerType,
    FloatType,
    StringType,
    DateTimeType,
    BlobType,
    ArrayType,
    SetType,
    DictType,
    StructType,
    VariantType,
    FunctionType,
    AsyncFunctionType,
    RecursiveType,
    RefType,
    VectorType,
    MatrixType,
    OptionType,
    TypeUnion,
    TypeIntersect,
    TypeEqual,
    TypeMismatchError,
    printTypeSummary,
    TypeWiden,
} from "./types.js";

/** Extract error from assert.throws with proper typing */
function catchError(fn: () => void): TypeMismatchError {
    try { fn(); } catch (e) { return e as TypeMismatchError; }
    throw new Error("Expected function to throw");
}

// ============================================================================
// printTypeSummary
// ============================================================================

describe("printTypeSummary", () => {
    // --- Primitives ---
    test("primitives", () => {
        assert.strictEqual(printTypeSummary(NeverType), ".Never");
        assert.strictEqual(printTypeSummary(NullType), ".Null");
        assert.strictEqual(printTypeSummary(BooleanType), ".Boolean");
        assert.strictEqual(printTypeSummary(IntegerType), ".Integer");
        assert.strictEqual(printTypeSummary(FloatType), ".Float");
        assert.strictEqual(printTypeSummary(StringType), ".String");
        assert.strictEqual(printTypeSummary(DateTimeType), ".DateTime");
        assert.strictEqual(printTypeSummary(BlobType), ".Blob");
    });

    // --- Small compound types (full output at default depth=1) ---
    test("small struct fully printed at depth 1", () => {
        assert.strictEqual(
            printTypeSummary(StructType({ x: IntegerType, y: FloatType })),
            '.Struct [(name="x", type=.Integer), (name="y", type=.Float)]'
        );
    });

    test("small variant fully printed at depth 1", () => {
        assert.strictEqual(
            printTypeSummary(VariantType({ none: NullType, some: IntegerType })),
            '.Variant [(name="none", type=.Null), (name="some", type=.Integer)]'
        );
    });

    // --- Depth 0 summaries ---
    test("struct at depth 0 shows field count", () => {
        assert.strictEqual(printTypeSummary(StructType({ x: IntegerType, y: FloatType }), 0), ".Struct [2 fields]");
    });

    test("variant at depth 0 shows case names", () => {
        assert.strictEqual(printTypeSummary(VariantType({ none: NullType, some: IntegerType }), 0), ".Variant (none | some)");
    });

    test("array at depth 0", () => {
        assert.strictEqual(printTypeSummary(ArrayType(IntegerType), 0), ".Array ...");
    });

    test("dict at depth 0", () => {
        assert.strictEqual(printTypeSummary(DictType(StringType, IntegerType), 0), ".Dict ...");
    });

    test("set at depth 0", () => {
        assert.strictEqual(printTypeSummary(SetType(StringType), 0), ".Set ...");
    });

    test("ref at depth 0", () => {
        assert.strictEqual(printTypeSummary(RefType(IntegerType), 0), ".Ref ...");
    });

    test("function at depth 0", () => {
        assert.strictEqual(printTypeSummary(FunctionType([IntegerType], StringType), 0), ".Function ...");
    });

    test("async function at depth 0", () => {
        assert.strictEqual(printTypeSummary(AsyncFunctionType([IntegerType], StringType), 0), ".AsyncFunction ...");
    });

    // --- Truncation of large structs ---
    test("7-field struct with maxFields=2", () => {
        const t = StructType({ a: IntegerType, b: FloatType, c: StringType, d: BooleanType, e: NullType, f: IntegerType, g: FloatType });
        assert.strictEqual(
            printTypeSummary(t, 1, 2),
            '.Struct [(name="a", type=.Integer), (name="b", type=.Float), ... and 5 more]'
        );
    });

    test("7-field struct with maxFields=3", () => {
        const t = StructType({ a: IntegerType, b: FloatType, c: StringType, d: BooleanType, e: NullType, f: IntegerType, g: FloatType });
        assert.strictEqual(
            printTypeSummary(t, 1, 3),
            '.Struct [(name="a", type=.Integer), (name="b", type=.Float), (name="c", type=.String), ... and 4 more]'
        );
    });

    test("5-case variant with maxFields=2", () => {
        const t = VariantType({ a: NullType, b: NullType, c: NullType, d: NullType, e: NullType });
        assert.strictEqual(
            printTypeSummary(t, 1, 2),
            '.Variant [(name="a", type=.Null), (name="b", type=.Null), ... and 3 more]'
        );
    });

    // --- Depth 1 nesting (inner compounds collapse) ---
    test("nested struct: inner collapses at depth 1", () => {
        const inner = StructType({ a: IntegerType, b: FloatType });
        const outer = StructType({ x: inner, y: StringType });
        assert.strictEqual(
            printTypeSummary(outer, 1),
            '.Struct [(name="x", type=.Struct [2 fields]), (name="y", type=.String)]'
        );
    });

    test("array of struct at depth 1", () => {
        assert.strictEqual(
            printTypeSummary(ArrayType(StructType({ x: IntegerType, y: FloatType })), 1),
            '.Array .Struct [2 fields]'
        );
    });

    test("array of struct at depth 2 expands inner", () => {
        assert.strictEqual(
            printTypeSummary(ArrayType(StructType({ x: IntegerType, y: FloatType })), 2),
            '.Array .Struct [(name="x", type=.Integer), (name="y", type=.Float)]'
        );
    });

    // --- Vector / Matrix (don't consume depth) ---
    test("vector", () => {
        assert.strictEqual(printTypeSummary(VectorType(FloatType)), ".Vector .Float");
    });

    test("matrix", () => {
        assert.strictEqual(printTypeSummary(MatrixType(IntegerType)), ".Matrix .Integer");
    });

    // --- Function types ---
    test("function at depth 1", () => {
        assert.strictEqual(
            printTypeSummary(FunctionType([IntegerType, StringType], FloatType), 1),
            '.Function (inputs=[.Integer, .String], output=.Float)'
        );
    });

    test("async function at depth 1", () => {
        assert.strictEqual(
            printTypeSummary(AsyncFunctionType([BooleanType], NullType), 1),
            '.AsyncFunction (inputs=[.Boolean], output=.Null)'
        );
    });

    test("function with complex args at depth 1 collapses inner", () => {
        const fn = FunctionType([ArrayType(IntegerType), StructType({ x: FloatType })], StructType({ result: FloatType }));
        assert.strictEqual(
            printTypeSummary(fn, 1),
            '.Function (inputs=[.Array ..., .Struct [1 fields]], output=.Struct [1 fields])'
        );
    });

    test("function with complex args at depth 2 expands one level", () => {
        const fn = FunctionType([ArrayType(IntegerType), StructType({ x: FloatType })], StructType({ result: FloatType }));
        assert.strictEqual(
            printTypeSummary(fn, 2),
            '.Function (inputs=[.Array .Integer, .Struct [(name="x", type=.Float)]], output=.Struct [(name="result", type=.Float)])'
        );
    });

    test("async function with struct input at depth 1", () => {
        const fn = AsyncFunctionType([StructType({ x: IntegerType, y: FloatType })], ArrayType(StringType));
        assert.strictEqual(
            printTypeSummary(fn, 1),
            '.AsyncFunction (inputs=[.Struct [2 fields]], output=.Array ...)'
        );
    });

    test("async function with struct input at depth 2", () => {
        const fn = AsyncFunctionType([StructType({ x: IntegerType, y: FloatType })], ArrayType(StringType));
        assert.strictEqual(
            printTypeSummary(fn, 2),
            '.AsyncFunction (inputs=[.Struct [(name="x", type=.Integer), (name="y", type=.Float)]], output=.Array .String)'
        );
    });

    // --- Recursive types ---
    test("recursive linked list at depth 0 (transparent, shows variant summary)", () => {
        const t = RecursiveType(self => VariantType({ nil: NullType, cons: StructType({ head: IntegerType, tail: self }) }));
        assert.strictEqual(printTypeSummary(t, 0), ".Variant (cons | nil)");
    });

    test("recursive linked list at depth 1", () => {
        const t = RecursiveType(self => VariantType({ nil: NullType, cons: StructType({ head: IntegerType, tail: self }) }));
        assert.strictEqual(
            printTypeSummary(t, 1),
            '.Variant [(name="cons", type=.Struct [2 fields]), (name="nil", type=.Null)]'
        );
    });

    test("recursive linked list at depth 2 (shows self-reference)", () => {
        const t = RecursiveType(self => VariantType({ nil: NullType, cons: StructType({ head: IntegerType, tail: self }) }));
        assert.strictEqual(
            printTypeSummary(t, 2),
            '.Variant [(name="cons", type=.Struct [(name="head", type=.Integer), (name="tail", type=.Recursive 2)]), (name="nil", type=.Null)]'
        );
    });

    test("recursive linked list stabilizes at depth 3 (same as depth 2)", () => {
        const t = RecursiveType(self => VariantType({ nil: NullType, cons: StructType({ head: IntegerType, tail: self }) }));
        assert.strictEqual(printTypeSummary(t, 3), printTypeSummary(t, 2));
    });

    test("recursive binary tree at depth 0", () => {
        const t = RecursiveType(self => StructType({ value: IntegerType, left: OptionType(self), right: OptionType(self) }));
        assert.strictEqual(printTypeSummary(t, 0), ".Struct [3 fields]");
    });

    test("recursive binary tree at depth 1 (option collapses)", () => {
        const t = RecursiveType(self => StructType({ value: IntegerType, left: OptionType(self), right: OptionType(self) }));
        assert.strictEqual(
            printTypeSummary(t, 1),
            '.Struct [(name="value", type=.Integer), (name="left", type=.Variant (none | some)), (name="right", type=.Variant (none | some))]'
        );
    });

    test("recursive binary tree at depth 2 (shows self-reference in option)", () => {
        const t = RecursiveType(self => StructType({ value: IntegerType, left: OptionType(self), right: OptionType(self) }));
        assert.strictEqual(
            printTypeSummary(t, 2),
            '.Struct [(name="value", type=.Integer), (name="left", type=.Variant [(name="none", type=.Null), (name="some", type=.Recursive 2)]), (name="right", type=.Variant [(name="none", type=.Null), (name="some", type=.Recursive 2)])]'
        );
    });

    // --- Complex nested type at various depths ---
    test("complex type: Array of 5-field struct with recursive child at depth 1", () => {
        const ListType = RecursiveType(self => VariantType({ nil: NullType, cons: StructType({ head: IntegerType, tail: self }) }));
        const t = ArrayType(StructType({
            name: StringType, data: DictType(StringType, FloatType),
            children: ListType, score: FloatType, tags: SetType(StringType),
        }));
        assert.strictEqual(printTypeSummary(t, 1), ".Array .Struct [5 fields]");
    });

    test("complex type at depth 2 (expands struct, truncates at maxFields=3)", () => {
        const ListType = RecursiveType(self => VariantType({ nil: NullType, cons: StructType({ head: IntegerType, tail: self }) }));
        const t = ArrayType(StructType({
            name: StringType, data: DictType(StringType, FloatType),
            children: ListType, score: FloatType, tags: SetType(StringType),
        }));
        assert.strictEqual(
            printTypeSummary(t, 2),
            '.Array .Struct [(name="name", type=.String), (name="data", type=.Dict ...), (name="children", type=.Variant (cons | nil)), ... and 2 more]'
        );
    });

    test("complex type at depth 3", () => {
        const ListType = RecursiveType(self => VariantType({ nil: NullType, cons: StructType({ head: IntegerType, tail: self }) }));
        const t = ArrayType(StructType({
            name: StringType, data: DictType(StringType, FloatType),
            children: ListType, score: FloatType, tags: SetType(StringType),
        }));
        assert.strictEqual(
            printTypeSummary(t, 3),
            '.Array .Struct [(name="name", type=.String), (name="data", type=.Dict (key=.String, value=.Float)), (name="children", type=.Variant [(name="cons", type=.Struct [2 fields]), (name="nil", type=.Null)]), ... and 2 more]'
        );
    });

    // --- Complex function at various depths ---
    test("complex function at depth 1", () => {
        const ListType = RecursiveType(self => VariantType({ nil: NullType, cons: StructType({ head: IntegerType, tail: self }) }));
        const t = FunctionType(
            [ArrayType(StructType({ name: StringType, data: DictType(StringType, FloatType), children: ListType, score: FloatType, tags: SetType(StringType) })), IntegerType],
            StructType({ result: FloatType, error: OptionType(StringType) })
        );
        assert.strictEqual(
            printTypeSummary(t, 1),
            '.Function (inputs=[.Array ..., .Integer], output=.Struct [2 fields])'
        );
    });

    test("complex function at depth 2", () => {
        const ListType = RecursiveType(self => VariantType({ nil: NullType, cons: StructType({ head: IntegerType, tail: self }) }));
        const t = FunctionType(
            [ArrayType(StructType({ name: StringType, data: DictType(StringType, FloatType), children: ListType, score: FloatType, tags: SetType(StringType) })), IntegerType],
            StructType({ result: FloatType, error: OptionType(StringType) })
        );
        assert.strictEqual(
            printTypeSummary(t, 2),
            '.Function (inputs=[.Array .Struct [5 fields], .Integer], output=.Struct [(name="result", type=.Float), (name="error", type=.Variant (none | some))])'
        );
    });
});

// ============================================================================
// TypeMismatchError path building
// ============================================================================

describe("TypeMismatchError", () => {
    test("reason preserved when no path segments", () => {
        const err = new TypeMismatchError("test reason");
        assert.strictEqual(err.message, "test reason");
        assert.strictEqual(err.reason, "test reason");
        assert.deepStrictEqual(err.path, []);
    });

    test("single path segment", () => {
        const err = new TypeMismatchError("expected .Integer but got .Float: incompatible types");
        err.addPathSegment(".b");
        assert.strictEqual(err.message, "at .b: expected .Integer but got .Float: incompatible types");
        assert.deepStrictEqual(err.path, [".b"]);
    });

    test("multiple path segments build up left-to-right", () => {
        const err = new TypeMismatchError("expected .Integer but got .Float: incompatible types");
        err.addPathSegment(".b");
        err.addPathSegment(".a");
        assert.strictEqual(err.message, "at .a.b: expected .Integer but got .Float: incompatible types");
        assert.deepStrictEqual(err.path, [".a", ".b"]);
    });

    test("mixed segment types", () => {
        const err = new TypeMismatchError("expected .Integer but got .Float: incompatible types");
        err.addPathSegment(".c");
        err.addPathSegment("[element]");
        err.addPathSegment(".a");
        assert.strictEqual(err.message, "at .a[element].c: expected .Integer but got .Float: incompatible types");
    });
});

// ============================================================================
// TypeEqual - error messages
// ============================================================================

describe("TypeEqual error messages", () => {
    // --- Primitive kind mismatches ---
    test("Integer vs Float", () => {
        const err = catchError(() => TypeEqual(IntegerType, FloatType));
        assert.strictEqual(err.message, "expected .Integer but got .Float: incompatible types");
        assert.deepStrictEqual(err.path, []);
    });

    test("Null vs Boolean", () => {
        const err = catchError(() => TypeEqual(NullType, BooleanType));
        assert.strictEqual(err.message, "expected .Null but got .Boolean: incompatible types");
    });

    test("String vs DateTime", () => {
        const err = catchError(() => TypeEqual(StringType, DateTimeType));
        assert.strictEqual(err.message, "expected .String but got .DateTime: incompatible types");
    });

    test("Blob vs Integer", () => {
        const err = catchError(() => TypeEqual(BlobType, IntegerType));
        assert.strictEqual(err.message, "expected .Blob but got .Integer: incompatible types");
    });

    // --- Container kind mismatches ---
    test("Ref vs Integer", () => {
        const err = catchError(() => TypeEqual(RefType(IntegerType), IntegerType));
        assert.strictEqual(err.message, "expected .Ref .Integer but got .Integer: incompatible types");
    });

    test("Array vs Integer", () => {
        const err = catchError(() => TypeEqual(ArrayType(IntegerType), IntegerType));
        assert.strictEqual(err.message, "expected .Array .Integer but got .Integer: incompatible types");
    });

    test("Vector vs Float", () => {
        const err = catchError(() => TypeEqual(VectorType(FloatType), FloatType));
        assert.strictEqual(err.message, "expected .Vector .Float but got .Float: incompatible types");
    });

    test("Matrix vs Float", () => {
        const err = catchError(() => TypeEqual(MatrixType(FloatType), FloatType));
        assert.strictEqual(err.message, "expected .Matrix .Float but got .Float: incompatible types");
    });

    test("Set vs String", () => {
        const err = catchError(() => TypeEqual(SetType(StringType), StringType));
        assert.strictEqual(err.message, "expected .Set .String but got .String: incompatible types");
    });

    test("Dict vs Integer", () => {
        const err = catchError(() => TypeEqual(DictType(StringType, IntegerType), IntegerType));
        assert.strictEqual(err.message, 'expected .Dict (key=.String, value=.Integer) but got .Integer: incompatible types');
    });

    test("Struct vs Integer", () => {
        const err = catchError(() => TypeEqual(StructType({ x: IntegerType }), IntegerType));
        assert.strictEqual(err.message, 'expected .Struct [(name="x", type=.Integer)] but got .Integer: incompatible types');
    });

    test("Variant vs Null", () => {
        const err = catchError(() => TypeEqual(VariantType({ a: NullType }), NullType));
        assert.strictEqual(err.message, 'expected .Variant [(name="a", type=.Null)] but got .Null: incompatible types');
    });

    test("Function vs Integer", () => {
        const err = catchError(() => TypeEqual(FunctionType([IntegerType], NullType), IntegerType));
        assert.strictEqual(err.message, 'expected .Function (inputs=[.Integer], output=.Null) but got .Integer: incompatible types');
    });

    test("AsyncFunction vs Integer", () => {
        const err = catchError(() => TypeEqual(AsyncFunctionType([IntegerType], NullType), IntegerType));
        assert.strictEqual(err.message, 'expected .AsyncFunction (inputs=[.Integer], output=.Null) but got .Integer: incompatible types');
    });

    test("Function vs AsyncFunction", () => {
        const err = catchError(() => TypeEqual(FunctionType([IntegerType], NullType), AsyncFunctionType([IntegerType], NullType)));
        assert.strictEqual(err.message, 'expected .Function (inputs=[.Integer], output=.Null) but got .AsyncFunction (inputs=[.Integer], output=.Null): incompatible types');
    });

    test("RecursiveType vs Integer (recursive wrapper is transparent in summary)", () => {
        const t = RecursiveType(self => VariantType({ nil: NullType, cons: StructType({ head: IntegerType, tail: self }) }));
        const err = catchError(() => TypeEqual(t, IntegerType));
        assert.strictEqual(err.message, 'expected .Variant [(name="cons", type=.Struct [2 fields]), (name="nil", type=.Null)] but got .Integer: incompatible types');
    });

    // --- Inner mismatches with path ---
    test("Ref inner mismatch: [ref]", () => {
        const err = catchError(() => TypeEqual(RefType(IntegerType), RefType(FloatType)));
        assert.strictEqual(err.message, "at [ref]: expected .Integer but got .Float: incompatible types");
    });

    test("Array element mismatch: [element]", () => {
        const err = catchError(() => TypeEqual(ArrayType(IntegerType), ArrayType(FloatType)));
        assert.strictEqual(err.message, "at [element]: expected .Integer but got .Float: incompatible types");
    });

    test("Vector element mismatch: [element]", () => {
        const err = catchError(() => TypeEqual(VectorType(FloatType), VectorType(IntegerType)));
        assert.strictEqual(err.message, "at [element]: expected .Float but got .Integer: incompatible types");
    });

    test("Matrix element mismatch: [element]", () => {
        const err = catchError(() => TypeEqual(MatrixType(FloatType), MatrixType(IntegerType)));
        assert.strictEqual(err.message, "at [element]: expected .Float but got .Integer: incompatible types");
    });

    test("Set key mismatch: [key]", () => {
        const err = catchError(() => TypeEqual(SetType(StringType), SetType(IntegerType)));
        assert.strictEqual(err.message, "at [key]: expected .String but got .Integer: incompatible types");
    });

    test("Dict key mismatch: [key]", () => {
        const err = catchError(() => TypeEqual(DictType(StringType, IntegerType), DictType(IntegerType, IntegerType)));
        assert.strictEqual(err.message, "at [key]: expected .String but got .Integer: incompatible types");
    });

    test("Dict value mismatch: [value]", () => {
        const err = catchError(() => TypeEqual(DictType(StringType, IntegerType), DictType(StringType, FloatType)));
        assert.strictEqual(err.message, "at [value]: expected .Integer but got .Float: incompatible types");
    });

    // --- Struct errors ---
    test("struct field count mismatch", () => {
        const err = catchError(() => TypeEqual(StructType({ x: IntegerType }), StructType({ x: IntegerType, y: FloatType })));
        assert.strictEqual(err.message, "structs contain different number of fields (1 vs 2)");
    });

    test("struct field name mismatch (no path prefix)", () => {
        const err = catchError(() => TypeEqual(StructType({ x: IntegerType }), StructType({ y: IntegerType })));
        assert.strictEqual(err.message, "struct field 0 has mismatched names x and y");
    });

    test("struct field type mismatch: .fieldname path", () => {
        const err = catchError(() => TypeEqual(StructType({ x: IntegerType, y: FloatType }), StructType({ x: IntegerType, y: StringType })));
        assert.strictEqual(err.message, "at .y: expected .Float but got .String: incompatible types");
    });

    test("deep struct: .a.b.c", () => {
        const t1 = StructType({ a: StructType({ b: StructType({ c: IntegerType }) }) });
        const t2 = StructType({ a: StructType({ b: StructType({ c: FloatType }) }) });
        const err = catchError(() => TypeEqual(t1, t2));
        assert.strictEqual(err.message, "at .a.b.c: expected .Integer but got .Float: incompatible types");
    });

    test("5 levels deep: .a[element].b.c.d", () => {
        const t1 = StructType({ a: ArrayType(StructType({ b: StructType({ c: StructType({ d: IntegerType }) }) })) });
        const t2 = StructType({ a: ArrayType(StructType({ b: StructType({ c: StructType({ d: FloatType }) }) })) });
        const err = catchError(() => TypeEqual(t1, t2));
        assert.strictEqual(err.message, "at .a[element].b.c.d: expected .Integer but got .Float: incompatible types");
    });

    test("array element struct field: [element].y", () => {
        const t1 = ArrayType(StructType({ x: IntegerType, y: FloatType }));
        const t2 = ArrayType(StructType({ x: IntegerType, y: StringType }));
        const err = catchError(() => TypeEqual(t1, t2));
        assert.strictEqual(err.message, "at [element].y: expected .Float but got .String: incompatible types");
    });

    test("dict value struct field: [value].x", () => {
        const t1 = DictType(StringType, StructType({ x: IntegerType }));
        const t2 = DictType(StringType, StructType({ x: FloatType }));
        const err = catchError(() => TypeEqual(t1, t2));
        assert.strictEqual(err.message, "at [value].x: expected .Integer but got .Float: incompatible types");
    });

    // --- Variant errors ---
    test("variant case count mismatch with only-in-expected", () => {
        const err = catchError(() => TypeEqual(VariantType({ a: NullType, b: NullType, c: NullType }), VariantType({ a: NullType, c: NullType })));
        assert.strictEqual(err.message, "variants contain different number of cases (3 vs 2); only in expected: b");
    });

    test("variant case count mismatch with only-in-actual", () => {
        const err = catchError(() => TypeEqual(VariantType({ a: NullType }), VariantType({ a: NullType, b: NullType })));
        assert.strictEqual(err.message, "variants contain different number of cases (1 vs 2); only in actual: b");
    });

    test("variant case name mismatch", () => {
        const err = catchError(() => TypeEqual(VariantType({ a: NullType, c: NullType }), VariantType({ a: NullType, b: NullType })));
        assert.strictEqual(err.message, "variant case b is not present in both variants");
    });

    test("variant case type mismatch: .casename path", () => {
        const err = catchError(() => TypeEqual(VariantType({ none: NullType, some: IntegerType }), VariantType({ none: NullType, some: FloatType })));
        assert.strictEqual(err.message, "at .some: expected .Integer but got .Float: incompatible types");
    });

    // --- Function errors ---
    test("function argument count mismatch", () => {
        const err = catchError(() => TypeEqual(FunctionType([IntegerType], NullType), FunctionType([IntegerType, StringType], NullType)));
        assert.strictEqual(err.message, "functions take different number of arguments (1 vs 2)");
    });

    test("function input mismatch: [input N]", () => {
        const err = catchError(() => TypeEqual(FunctionType([IntegerType, StringType], NullType), FunctionType([IntegerType, FloatType], NullType)));
        assert.strictEqual(err.message, "at [input 1]: expected .String but got .Float: incompatible types");
    });

    test("function output mismatch: [output]", () => {
        const err = catchError(() => TypeEqual(FunctionType([IntegerType], StringType), FunctionType([IntegerType], FloatType)));
        assert.strictEqual(err.message, "at [output]: expected .String but got .Float: incompatible types");
    });

    test("async function argument count mismatch", () => {
        const err = catchError(() => TypeEqual(AsyncFunctionType([IntegerType], NullType), AsyncFunctionType([IntegerType, StringType], NullType)));
        assert.strictEqual(err.message, "functions take different number of arguments (1 vs 2)");
    });

    test("async function input mismatch: [input N]", () => {
        const err = catchError(() => TypeEqual(AsyncFunctionType([IntegerType, StringType], NullType), AsyncFunctionType([IntegerType, FloatType], NullType)));
        assert.strictEqual(err.message, "at [input 1]: expected .String but got .Float: incompatible types");
    });

    test("async function output mismatch: [output]", () => {
        const err = catchError(() => TypeEqual(AsyncFunctionType([IntegerType], StringType), AsyncFunctionType([IntegerType], FloatType)));
        assert.strictEqual(err.message, "at [output]: expected .String but got .Float: incompatible types");
    });

    // --- Recursive type mismatches ---
    test("two recursive lists differing in head type: .cons.head", () => {
        const listA = RecursiveType(self => VariantType({ nil: NullType, cons: StructType({ head: IntegerType, tail: self }) }));
        const listB = RecursiveType(self => VariantType({ nil: NullType, cons: StructType({ head: FloatType, tail: self }) }));
        const err = catchError(() => TypeEqual(listA, listB));
        assert.strictEqual(err.message, "at .cons.head: expected .Integer but got .Float: incompatible types");
    });

    test("two recursive trees differing in value type: .value", () => {
        const treeA = RecursiveType(self => StructType({ value: IntegerType, left: OptionType(self), right: OptionType(self) }));
        const treeB = RecursiveType(self => StructType({ value: FloatType, left: OptionType(self), right: OptionType(self) }));
        const err = catchError(() => TypeEqual(treeA, treeB));
        assert.strictEqual(err.message, "at .value: expected .Integer but got .Float: incompatible types");
    });

    test("struct containing recursive tree mismatch: .tree.value", () => {
        const treeA = RecursiveType(self => StructType({ value: IntegerType, left: OptionType(self), right: OptionType(self) }));
        const treeB = RecursiveType(self => StructType({ value: FloatType, left: OptionType(self), right: OptionType(self) }));
        const err = catchError(() => TypeEqual(StructType({ name: StringType, tree: treeA }), StructType({ name: StringType, tree: treeB })));
        assert.strictEqual(err.message, "at .tree.value: expected .Integer but got .Float: incompatible types");
    });
});

// ============================================================================
// TypeUnion - error messages
// ============================================================================

describe("TypeUnion error messages", () => {
    // --- Primitive kind mismatch ---
    test("Integer vs Float", () => {
        const err = catchError(() => TypeUnion(IntegerType, FloatType));
        assert.strictEqual(err.message, "expected .Integer but got .Float: incompatible types");
    });

    // --- Container kind mismatches ---
    test("Array vs Integer", () => {
        const err = catchError(() => TypeUnion(ArrayType(IntegerType), IntegerType));
        assert.strictEqual(err.message, "expected .Array .Integer but got .Integer: incompatible types");
    });

    test("Ref vs Integer", () => {
        const err = catchError(() => TypeUnion(RefType(IntegerType), IntegerType));
        assert.strictEqual(err.message, "expected .Ref .Integer but got .Integer: incompatible types");
    });

    test("Struct vs Integer", () => {
        const err = catchError(() => TypeUnion(StructType({ x: IntegerType }), IntegerType));
        assert.strictEqual(err.message, 'expected .Struct [(name="x", type=.Integer)] but got .Integer: incompatible types');
    });

    test("Variant vs Null", () => {
        const err = catchError(() => TypeUnion(VariantType({ a: NullType }), NullType));
        assert.strictEqual(err.message, 'expected .Variant [(name="a", type=.Null)] but got .Null: incompatible types');
    });

    // --- Inner mismatches with path (delegates to TypeEqual) ---
    test("Array element mismatch: [element]", () => {
        const err = catchError(() => TypeUnion(ArrayType(IntegerType), ArrayType(FloatType)));
        assert.strictEqual(err.message, "at [element]: expected .Integer but got .Float: incompatible types");
    });

    test("Ref inner mismatch: [ref]", () => {
        const err = catchError(() => TypeUnion(RefType(IntegerType), RefType(FloatType)));
        assert.strictEqual(err.message, "at [ref]: expected .Integer but got .Float: incompatible types");
    });

    test("Set key mismatch: [key]", () => {
        const err = catchError(() => TypeUnion(SetType(StringType), SetType(IntegerType)));
        assert.strictEqual(err.message, "at [key]: expected .String but got .Integer: incompatible types");
    });

    test("Dict key mismatch: [key]", () => {
        const err = catchError(() => TypeUnion(DictType(StringType, IntegerType), DictType(IntegerType, IntegerType)));
        assert.strictEqual(err.message, "at [key]: expected .String but got .Integer: incompatible types");
    });

    test("Dict value mismatch: [value]", () => {
        const err = catchError(() => TypeUnion(DictType(StringType, IntegerType), DictType(StringType, FloatType)));
        assert.strictEqual(err.message, "at [value]: expected .Integer but got .Float: incompatible types");
    });

    test("Vector element mismatch: [element]", () => {
        const err = catchError(() => TypeUnion(VectorType(FloatType), VectorType(IntegerType)));
        assert.strictEqual(err.message, "at [element]: expected .Float but got .Integer: incompatible types");
    });

    test("Matrix element mismatch: [element]", () => {
        const err = catchError(() => TypeUnion(MatrixType(FloatType), MatrixType(IntegerType)));
        assert.strictEqual(err.message, "at [element]: expected .Float but got .Integer: incompatible types");
    });

    // --- Struct errors ---
    test("struct field count mismatch", () => {
        const err = catchError(() => TypeUnion(StructType({ x: IntegerType }), StructType({ x: IntegerType, y: FloatType })));
        assert.strictEqual(err.message, "structs contain different number of fields (1 vs 2)");
    });

    test("struct field name mismatch", () => {
        const err = catchError(() => TypeUnion(StructType({ x: IntegerType }), StructType({ y: IntegerType })));
        assert.strictEqual(err.message, "struct field 0 has mismatched names x and y");
    });

    test("struct field type mismatch propagates path: .b", () => {
        const err = catchError(() => TypeUnion(StructType({ a: IntegerType, b: FloatType }), StructType({ a: IntegerType, b: StringType })));
        assert.strictEqual(err.message, "at .b: expected .Float but got .String: incompatible types");
    });

    // --- Variant case mismatch ---
    test("variant case type mismatch: .b", () => {
        const err = catchError(() => TypeUnion(VariantType({ a: IntegerType, b: FloatType }), VariantType({ a: IntegerType, b: StringType })));
        assert.strictEqual(err.message, "at .b: expected .Float but got .String: incompatible types");
    });

    // --- Function errors ---
    test("function argument count mismatch (Fn/Fn)", () => {
        const err = catchError(() => TypeUnion(FunctionType([IntegerType], NullType), FunctionType([IntegerType, StringType], NullType)));
        assert.strictEqual(err.message, "functions take different number of arguments (1 vs 2)");
    });

    test("function argument count mismatch (Fn/AsyncFn)", () => {
        const err = catchError(() => TypeUnion(FunctionType([IntegerType], NullType), AsyncFunctionType([IntegerType, StringType], NullType)));
        assert.strictEqual(err.message, "functions take different number of arguments (1 vs 2)");
    });

    test("function argument count mismatch (AsyncFn/Fn)", () => {
        const err = catchError(() => TypeUnion(AsyncFunctionType([IntegerType], NullType), FunctionType([IntegerType, StringType], NullType)));
        assert.strictEqual(err.message, "functions take different number of arguments (1 vs 2)");
    });

    test("function argument count mismatch (AsyncFn/AsyncFn)", () => {
        const err = catchError(() => TypeUnion(AsyncFunctionType([IntegerType], NullType), AsyncFunctionType([IntegerType, StringType], NullType)));
        assert.strictEqual(err.message, "functions take different number of arguments (1 vs 2)");
    });

    test("function output mismatch: [output]", () => {
        const err = catchError(() => TypeUnion(FunctionType([IntegerType], StringType), FunctionType([IntegerType], FloatType)));
        assert.strictEqual(err.message, "at [output]: expected .String but got .Float: incompatible types");
    });

    // --- Multi-level ---
    test("deep path through struct and array: .a[element]", () => {
        const err = catchError(() => TypeUnion(StructType({ a: ArrayType(IntegerType) }), StructType({ a: ArrayType(FloatType) })));
        assert.strictEqual(err.message, "at .a[element]: expected .Integer but got .Float: incompatible types");
    });
});

// ============================================================================
// TypeIntersect - error messages
// ============================================================================

describe("TypeIntersect error messages", () => {
    // --- Primitive kind mismatch ---
    test("Integer vs Float", () => {
        const err = catchError(() => TypeIntersect(IntegerType, FloatType));
        assert.strictEqual(err.message, "expected .Integer but got .Float: incompatible types");
    });

    // --- Container kind mismatches ---
    test("Array vs Integer", () => {
        const err = catchError(() => TypeIntersect(ArrayType(IntegerType), IntegerType));
        assert.strictEqual(err.message, "expected .Array .Integer but got .Integer: incompatible types");
    });

    test("Struct vs Integer", () => {
        const err = catchError(() => TypeIntersect(StructType({ x: IntegerType }), IntegerType));
        assert.strictEqual(err.message, 'expected .Struct [(name="x", type=.Integer)] but got .Integer: incompatible types');
    });

    // --- Inner mismatches with path ---
    test("Array element mismatch: [element]", () => {
        const err = catchError(() => TypeIntersect(ArrayType(IntegerType), ArrayType(FloatType)));
        assert.strictEqual(err.message, "at [element]: expected .Integer but got .Float: incompatible types");
    });

    test("Ref inner mismatch: [ref]", () => {
        const err = catchError(() => TypeIntersect(RefType(IntegerType), RefType(FloatType)));
        assert.strictEqual(err.message, "at [ref]: expected .Integer but got .Float: incompatible types");
    });

    test("Dict value mismatch: [value]", () => {
        const err = catchError(() => TypeIntersect(DictType(StringType, IntegerType), DictType(StringType, FloatType)));
        assert.strictEqual(err.message, "at [value]: expected .Integer but got .Float: incompatible types");
    });

    // --- Struct errors ---
    test("struct field count mismatch", () => {
        const err = catchError(() => TypeIntersect(StructType({ x: IntegerType }), StructType({ x: IntegerType, y: FloatType })));
        assert.strictEqual(err.message, "structs contain different number of fields (1 vs 2)");
    });

    test("struct field name mismatch", () => {
        const err = catchError(() => TypeIntersect(StructType({ x: IntegerType }), StructType({ y: IntegerType })));
        assert.strictEqual(err.message, "struct field 0 has mismatched names x and y");
    });

    test("struct field type mismatch: .b", () => {
        const err = catchError(() => TypeIntersect(StructType({ a: IntegerType, b: FloatType }), StructType({ a: IntegerType, b: StringType })));
        assert.strictEqual(err.message, "at .b: expected .Float but got .String: incompatible types");
    });

    // --- Variant errors ---
    test("variants no overlapping cases", () => {
        const err = catchError(() => TypeIntersect(VariantType({ a: NullType }), VariantType({ b: NullType })));
        assert.strictEqual(err.message, "variants have no overlapping cases");
    });

    test("variant case type mismatch: .b", () => {
        const err = catchError(() => TypeIntersect(VariantType({ a: IntegerType, b: FloatType }), VariantType({ a: IntegerType, b: StringType })));
        assert.strictEqual(err.message, "at .b: expected .Float but got .String: incompatible types");
    });

    // --- Function errors ---
    test("function argument count mismatch", () => {
        const err = catchError(() => TypeIntersect(FunctionType([IntegerType], NullType), FunctionType([IntegerType, StringType], NullType)));
        assert.strictEqual(err.message, "functions take different number of arguments (1 vs 2)");
    });

    test("function argument count mismatch (Fn/AsyncFn)", () => {
        const err = catchError(() => TypeIntersect(FunctionType([IntegerType], NullType), AsyncFunctionType([IntegerType, StringType], NullType)));
        assert.strictEqual(err.message, "functions take different number of arguments (1 vs 2)");
    });

    test("function argument count mismatch (AsyncFn/Fn)", () => {
        const err = catchError(() => TypeIntersect(AsyncFunctionType([IntegerType], NullType), FunctionType([IntegerType, StringType], NullType)));
        assert.strictEqual(err.message, "functions take different number of arguments (1 vs 2)");
    });

    test("function argument count mismatch (AsyncFn/AsyncFn)", () => {
        const err = catchError(() => TypeIntersect(AsyncFunctionType([IntegerType], NullType), AsyncFunctionType([IntegerType, StringType], NullType)));
        assert.strictEqual(err.message, "functions take different number of arguments (1 vs 2)");
    });

    test("function output mismatch: [output]", () => {
        const err = catchError(() => TypeIntersect(FunctionType([IntegerType], StringType), FunctionType([IntegerType], FloatType)));
        assert.strictEqual(err.message, "at [output]: expected .String but got .Float: incompatible types");
    });

    // --- Multi-level ---
    test("deep path: .a[element]", () => {
        const err = catchError(() => TypeIntersect(StructType({ a: ArrayType(IntegerType) }), StructType({ a: ArrayType(FloatType) })));
        assert.strictEqual(err.message, "at .a[element]: expected .Integer but got .Float: incompatible types");
    });
});

// ============================================================================
// TypeWiden - error messages
// ============================================================================

describe("TypeWiden error messages", () => {
    // --- Primitive kind mismatch ---
    test("Integer vs Float", () => {
        const err = catchError(() => TypeWiden(IntegerType, FloatType));
        assert.strictEqual(err.message, "expected .Integer but got .Float: incompatible types");
    });

    // --- Container kind mismatches ---
    test("Array vs Integer", () => {
        const err = catchError(() => TypeWiden(ArrayType(IntegerType), IntegerType));
        assert.strictEqual(err.message, "expected .Array .Integer but got .Integer: incompatible types");
    });

    test("Struct vs Integer", () => {
        const err = catchError(() => TypeWiden(StructType({ x: IntegerType }), IntegerType));
        assert.strictEqual(err.message, 'expected .Struct [(name="x", type=.Integer)] but got .Integer: incompatible types');
    });

    // --- Inner mismatches with path ---
    test("Array element mismatch: [element]", () => {
        const err = catchError(() => TypeWiden(ArrayType(IntegerType), ArrayType(FloatType)));
        assert.strictEqual(err.message, "at [element]: expected .Integer but got .Float: incompatible types");
    });

    test("Ref inner mismatch: [ref]", () => {
        const err = catchError(() => TypeWiden(RefType(IntegerType), RefType(FloatType)));
        assert.strictEqual(err.message, "at [ref]: expected .Integer but got .Float: incompatible types");
    });

    test("Dict value mismatch: [value]", () => {
        const err = catchError(() => TypeWiden(DictType(StringType, IntegerType), DictType(StringType, FloatType)));
        assert.strictEqual(err.message, "at [value]: expected .Integer but got .Float: incompatible types");
    });

    test("Vector element mismatch: [element]", () => {
        const err = catchError(() => TypeWiden(VectorType(FloatType), VectorType(IntegerType)));
        assert.strictEqual(err.message, "at [element]: expected .Float but got .Integer: incompatible types");
    });

    // --- Struct errors ---
    test("struct field count mismatch", () => {
        const err = catchError(() => TypeWiden(StructType({ x: IntegerType }), StructType({ x: IntegerType, y: FloatType })));
        assert.strictEqual(err.message, "structs contain different number of fields (1 vs 2)");
    });

    test("struct field name mismatch", () => {
        const err = catchError(() => TypeWiden(StructType({ x: IntegerType }), StructType({ y: IntegerType })));
        assert.strictEqual(err.message, "struct field 0 has mismatched names x and y");
    });

    test("struct field type mismatch: .b", () => {
        const err = catchError(() => TypeWiden(StructType({ a: IntegerType, b: FloatType }), StructType({ a: IntegerType, b: StringType })));
        assert.strictEqual(err.message, "at .b: expected .Float but got .String: incompatible types");
    });

    // --- Variant case mismatch ---
    test("variant case type mismatch: .b", () => {
        const err = catchError(() => TypeWiden(VariantType({ a: IntegerType, b: FloatType }), VariantType({ a: IntegerType, b: StringType })));
        assert.strictEqual(err.message, "at .b: expected .Float but got .String: incompatible types");
    });

    // --- Multi-level ---
    test("deep path: .a[element]", () => {
        const err = catchError(() => TypeWiden(StructType({ a: ArrayType(IntegerType) }), StructType({ a: ArrayType(FloatType) })));
        assert.strictEqual(err.message, "at .a[element]: expected .Integer but got .Float: incompatible types");
    });
});
