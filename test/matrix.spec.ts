/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import { East, ArrayType, FloatType, VectorType, IntegerType } from "../src/index.js";
import { describeEast as describe, assertEast as assert } from "./platforms.spec.js";
import * as ex from "./matrix.examples.js";

await describe("Matrix", (test) => {
    assert.examples(test, {
        matrixZeros: ex.matrixZeros,
        matrixOnes: ex.matrixOnes,
        matrixFill: ex.matrixFill,
        matrixFromArray: ex.matrixFromArray,
    });

    test("Matrix creation zeros", $ => {
        const m = $.let(East.Matrix.zeros(2n, 3n));
        $(assert.equal(m.rows(), 2n))
        $(assert.equal(m.cols(), 3n))
        $(assert.equal(m.get(0n, 0n), 0.0))
        $(assert.equal(m.get(1n, 2n), 0.0))
    });

    test("Matrix creation ones", $ => {
        const m = $.let(East.Matrix.ones(2n, 2n));
        $(assert.equal(m.rows(), 2n))
        $(assert.equal(m.cols(), 2n))
        $(assert.equal(m.get(0n, 0n), 1.0))
        $(assert.equal(m.get(1n, 1n), 1.0))
    });

    test("Matrix creation fill", $ => {
        const m = $.let(East.Matrix.fill(2n, 3n, 5.0));
        $(assert.equal(m.rows(), 2n))
        $(assert.equal(m.cols(), 3n))
        $(assert.equal(m.get(0n, 0n), 5.0))
        $(assert.equal(m.get(1n, 2n), 5.0))

        // Integer fill
        const mi = $.let(East.Matrix.fill(2n, 2n, 42n));
        $(assert.equal(mi.get(0n, 0n), 42n))
        $(assert.equal(mi.get(1n, 1n), 42n))
    });

    test("Matrix creation empty", $ => {
        const m = $.let(East.Matrix.zeros(0n, 0n));
        $(assert.equal(m.rows(), 0n))
        $(assert.equal(m.cols(), 0n))
    });

    test("Matrix from nested array", $ => {
        const arr = $.let([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]]);
        const m = $.let(East.Matrix.fromArray(arr));
        $(assert.equal(m.rows(), 2n))
        $(assert.equal(m.cols(), 3n))
        $(assert.equal(m.get(0n, 0n), 1.0))
        $(assert.equal(m.get(0n, 1n), 2.0))
        $(assert.equal(m.get(0n, 2n), 3.0))
        $(assert.equal(m.get(1n, 0n), 4.0))
        $(assert.equal(m.get(1n, 1n), 5.0))
        $(assert.equal(m.get(1n, 2n), 6.0))
    });

    assert.examples(test, {
        matrixRows: ex.matrixRows,
        matrixCols: ex.matrixCols,
        matrixGet: ex.matrixGet,
        matrixSet: ex.matrixSet,
    });

    test("Matrix get and set", $ => {
        const m = $.let(East.Matrix.zeros(2n, 2n));
        $(m.set(0n, 0n, 1.0))
        $(m.set(0n, 1n, 2.0))
        $(m.set(1n, 0n, 3.0))
        $(m.set(1n, 1n, 4.0))
        $(assert.equal(m.get(0n, 0n), 1.0))
        $(assert.equal(m.get(0n, 1n), 2.0))
        $(assert.equal(m.get(1n, 0n), 3.0))
        $(assert.equal(m.get(1n, 1n), 4.0))
    });

    test("Matrix bounds checking", $ => {
        const m = $.let(East.Matrix.zeros(2n, 3n));
        $(assert.throws(m.get(-1n, 0n)))
        $(assert.throws(m.get(0n, -1n)))
        $(assert.throws(m.get(2n, 0n)))
        $(assert.throws(m.get(0n, 3n)))
        $(assert.throws(m.set(-1n, 0n, 0.0)))
        $(assert.throws(m.set(0n, 3n, 0.0)))
    });

    assert.examples(test, {
        matrixGetRow: ex.matrixGetRow,
        matrixGetCol: ex.matrixGetCol,
    });

    test("Matrix get row", $ => {
        const arr = $.let([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]]);
        const m = $.let(East.Matrix.fromArray(arr));
        const row0 = $.let(m.getRow(0n));
        $(assert.equal(row0.length(), 3n))
        $(assert.equal(row0.get(0n), 1.0))
        $(assert.equal(row0.get(1n), 2.0))
        $(assert.equal(row0.get(2n), 3.0))

        const row1 = $.let(m.getRow(1n));
        $(assert.equal(row1.get(0n), 4.0))
        $(assert.equal(row1.get(1n), 5.0))
        $(assert.equal(row1.get(2n), 6.0))
    });

    test("Matrix get col", $ => {
        const arr = $.let([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]]);
        const m = $.let(East.Matrix.fromArray(arr));
        const col0 = $.let(m.getCol(0n));
        $(assert.equal(col0.length(), 2n))
        $(assert.equal(col0.get(0n), 1.0))
        $(assert.equal(col0.get(1n), 4.0))

        const col2 = $.let(m.getCol(2n));
        $(assert.equal(col2.get(0n), 3.0))
        $(assert.equal(col2.get(1n), 6.0))
    });

    assert.examples(test, {
        matrixTranspose: ex.matrixTranspose,
        matrixToVector: ex.matrixToVector,
        matrixToArray: ex.matrixToArray,
    });

    test("Matrix transpose", $ => {
        const arr = $.let([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]]);
        const m = $.let(East.Matrix.fromArray(arr));
        const t = $.let(m.transpose());
        $(assert.equal(t.rows(), 3n))
        $(assert.equal(t.cols(), 2n))
        $(assert.equal(t.get(0n, 0n), 1.0))
        $(assert.equal(t.get(0n, 1n), 4.0))
        $(assert.equal(t.get(1n, 0n), 2.0))
        $(assert.equal(t.get(1n, 1n), 5.0))
        $(assert.equal(t.get(2n, 0n), 3.0))
        $(assert.equal(t.get(2n, 1n), 6.0))
    });

    test("Matrix to vector", $ => {
        const arr = $.let([[1.0, 2.0], [3.0, 4.0]]);
        const m = $.let(East.Matrix.fromArray(arr));
        const v = $.let(m.toVector());
        $(assert.equal(v.length(), 4n))
        $(assert.equal(v.get(0n), 1.0))
        $(assert.equal(v.get(1n), 2.0))
        $(assert.equal(v.get(2n), 3.0))
        $(assert.equal(v.get(3n), 4.0))
    });

    test("Matrix to array", $ => {
        const arr = $.let([[1.0, 2.0], [3.0, 4.0]]);
        const m = $.let(East.Matrix.fromArray(arr));
        const result = $.let(m.toArray());
        $(assert.equal(result, [[1.0, 2.0], [3.0, 4.0]]))
    });

    test("Matrix integer type", $ => {
        const m = $.let(East.Matrix.fill(2n, 2n, 10n));
        $(assert.equal(m.rows(), 2n))
        $(assert.equal(m.cols(), 2n))
        $(assert.equal(m.get(0n, 0n), 10n))
        $(m.set(1n, 1n, 99n))
        $(assert.equal(m.get(1n, 1n), 99n))
    });

    test("Matrix boolean type", $ => {
        const m = $.let(East.Matrix.fill(2n, 2n, false));
        $(assert.equal(m.get(0n, 0n), false))
        $(m.set(0n, 1n, true))
        $(assert.equal(m.get(0n, 1n), true))
        $(assert.equal(m.get(1n, 0n), false))
    });

    test("Matrix row col bounds", $ => {
        const m = $.let(East.Matrix.zeros(2n, 3n));
        $(assert.throws(m.getRow(-1n)))
        $(assert.throws(m.getRow(2n)))
        $(assert.throws(m.getCol(-1n)))
        $(assert.throws(m.getCol(3n)))
    });

    test("Matrix transpose square", $ => {
        const m = $.let(East.Matrix.zeros(3n, 3n));
        $(m.set(0n, 1n, 5.0))
        $(m.set(1n, 0n, 7.0))
        const t = $.let(m.transpose());
        $(assert.equal(t.get(1n, 0n), 5.0))
        $(assert.equal(t.get(0n, 1n), 7.0))
    });

    test("Matrix roundtrip vector", $ => {
        const arr = $.let([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]]);
        const m = $.let(East.Matrix.fromArray(arr));
        const v = $.let(m.toVector());
        const m2 = $.let(v.toMatrix(2n, 3n));
        $(assert.equal(m2.rows(), 2n))
        $(assert.equal(m2.cols(), 3n))
        $(assert.equal(m2.get(0n, 0n), 1.0))
        $(assert.equal(m2.get(1n, 2n), 6.0))
    });

    test("Matrix single element", $ => {
        const m = $.let(East.Matrix.fill(1n, 1n, 42.0));
        $(assert.equal(m.rows(), 1n))
        $(assert.equal(m.cols(), 1n))
        $(assert.equal(m.get(0n, 0n), 42.0))
    });

    test("Matrix single row", $ => {
        const arr = $.let([[1.0, 2.0, 3.0]]);
        const m = $.let(East.Matrix.fromArray(arr));
        $(assert.equal(m.rows(), 1n))
        $(assert.equal(m.cols(), 3n))
        $(assert.equal(m.get(0n, 2n), 3.0))
    });

    test("Matrix single column", $ => {
        const arr = $.let([[1.0], [2.0], [3.0]]);
        const m = $.let(East.Matrix.fromArray(arr));
        $(assert.equal(m.rows(), 3n))
        $(assert.equal(m.cols(), 1n))
        $(assert.equal(m.get(2n, 0n), 3.0))
    });

    test("Matrix from integer array", $ => {
        const arr = $.let([[1n, 2n], [3n, 4n]]);
        const m = $.let(East.Matrix.fromArray(arr));
        $(assert.equal(m.rows(), 2n))
        $(assert.equal(m.cols(), 2n))
        $(assert.equal(m.get(0n, 0n), 1n))
        $(assert.equal(m.get(0n, 1n), 2n))
        $(assert.equal(m.get(1n, 0n), 3n))
        $(assert.equal(m.get(1n, 1n), 4n))
    });

    test("Matrix from boolean array", $ => {
        const arr = $.let([[true, false], [false, true]]);
        const m = $.let(East.Matrix.fromArray(arr));
        $(assert.equal(m.rows(), 2n))
        $(assert.equal(m.cols(), 2n))
        $(assert.equal(m.get(0n, 0n), true))
        $(assert.equal(m.get(0n, 1n), false))
        $(assert.equal(m.get(1n, 0n), false))
        $(assert.equal(m.get(1n, 1n), true))
    });

    test("Matrix fill boolean", $ => {
        const m = $.let(East.Matrix.fill(2n, 3n, true));
        $(assert.equal(m.rows(), 2n))
        $(assert.equal(m.cols(), 3n))
        $(assert.equal(m.get(0n, 0n), true))
        $(assert.equal(m.get(1n, 2n), true))
    });

    test("Matrix integer get row", $ => {
        const arr = $.let([[1n, 2n], [3n, 4n]]);
        const m = $.let(East.Matrix.fromArray(arr));
        const row0 = $.let(m.getRow(0n));
        $(assert.equal(row0.length(), 2n))
        $(assert.equal(row0.get(0n), 1n))
        $(assert.equal(row0.get(1n), 2n))
    });

    test("Matrix integer get col", $ => {
        const arr = $.let([[1n, 2n], [3n, 4n]]);
        const m = $.let(East.Matrix.fromArray(arr));
        const col1 = $.let(m.getCol(1n));
        $(assert.equal(col1.length(), 2n))
        $(assert.equal(col1.get(0n), 2n))
        $(assert.equal(col1.get(1n), 4n))
    });

    test("Matrix integer transpose", $ => {
        const arr = $.let([[1n, 2n], [3n, 4n]]);
        const m = $.let(East.Matrix.fromArray(arr));
        const t = $.let(m.transpose());
        $(assert.equal(t.rows(), 2n))
        $(assert.equal(t.cols(), 2n))
        $(assert.equal(t.get(0n, 0n), 1n))
        $(assert.equal(t.get(0n, 1n), 3n))
        $(assert.equal(t.get(1n, 0n), 2n))
        $(assert.equal(t.get(1n, 1n), 4n))
    });

    test("Matrix integer to vector", $ => {
        const arr = $.let([[1n, 2n], [3n, 4n]]);
        const m = $.let(East.Matrix.fromArray(arr));
        const v = $.let(m.toVector());
        $(assert.equal(v.length(), 4n))
        $(assert.equal(v.get(0n), 1n))
        $(assert.equal(v.get(3n), 4n))
    });

    test("Matrix integer to array", $ => {
        const arr = $.let([[1n, 2n], [3n, 4n]]);
        const m = $.let(East.Matrix.fromArray(arr));
        const result = $.let(m.toArray());
        $(assert.equal(result, [[1n, 2n], [3n, 4n]]))
    });

    test("Matrix boolean get row", $ => {
        const arr = $.let([[true, false], [false, true]]);
        const m = $.let(East.Matrix.fromArray(arr));
        const row0 = $.let(m.getRow(0n));
        $(assert.equal(row0.length(), 2n))
        $(assert.equal(row0.get(0n), true))
        $(assert.equal(row0.get(1n), false))
    });

    test("Matrix boolean get col", $ => {
        const arr = $.let([[true, false], [false, true]]);
        const m = $.let(East.Matrix.fromArray(arr));
        const col0 = $.let(m.getCol(0n));
        $(assert.equal(col0.length(), 2n))
        $(assert.equal(col0.get(0n), true))
        $(assert.equal(col0.get(1n), false))
    });

    test("Matrix boolean transpose", $ => {
        const arr = $.let([[true, false], [true, true]]);
        const m = $.let(East.Matrix.fromArray(arr));
        const t = $.let(m.transpose());
        $(assert.equal(t.get(0n, 0n), true))
        $(assert.equal(t.get(0n, 1n), true))
        $(assert.equal(t.get(1n, 0n), false))
        $(assert.equal(t.get(1n, 1n), true))
    });

    test("Matrix boolean to vector", $ => {
        const arr = $.let([[true, false], [false, true]]);
        const m = $.let(East.Matrix.fromArray(arr));
        const v = $.let(m.toVector());
        $(assert.equal(v.length(), 4n))
        $(assert.equal(v.get(0n), true))
        $(assert.equal(v.get(1n), false))
        $(assert.equal(v.get(2n), false))
        $(assert.equal(v.get(3n), true))
    });

    test("Matrix boolean to array", $ => {
        const arr = $.let([[true, false], [false, true]]);
        const m = $.let(East.Matrix.fromArray(arr));
        const result = $.let(m.toArray());
        $(assert.equal(result, [[true, false], [false, true]]))
    });

    test("Matrix fromArray with inline literal", $ => {
        const m = $.let(East.Matrix.fromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]]));
        $(assert.equal(m.rows(), 2n))
        $(assert.equal(m.cols(), 3n))
        $(assert.equal(m.get(0n, 0n), 1.0))
        $(assert.equal(m.get(1n, 2n), 6.0))
    });

    test("Matrix fromArray with empty array", $ => {
        const arr = $.let([], ArrayType(ArrayType(FloatType)));
        const m = $.let(East.Matrix.fromArray(arr));
        $(assert.equal(m.rows(), 0n))
        $(assert.equal(m.cols(), 0n))
    });

    // ================================================================
    // mapRows tests
    // ================================================================

    assert.examples(test, {
        matrixMapRows: ex.matrixMapRows,
    });

    test("Matrix mapRows identity", $ => {
        const m = $.let(East.Matrix.fromArray([[1.0, 2.0], [3.0, 4.0]]));
        const result = $.let(m.mapRows(($, row) => row));
        $(assert.equal(result.rows(), 2n))
        $(assert.equal(result.cols(), 2n))
        $(assert.equal(result.get(0n, 0n), 1.0))
        $(assert.equal(result.get(0n, 1n), 2.0))
        $(assert.equal(result.get(1n, 0n), 3.0))
        $(assert.equal(result.get(1n, 1n), 4.0))
    });

    test("Matrix mapRows element transformation", $ => {
        const m = $.let(East.Matrix.fromArray([[1.0, 2.0], [3.0, 4.0]]));
        const result = $.let(m.mapRows(($, row) => row.map(($, x) => x.multiply(10.0))));
        $(assert.equal(result.get(0n, 0n), 10.0))
        $(assert.equal(result.get(0n, 1n), 20.0))
        $(assert.equal(result.get(1n, 0n), 30.0))
        $(assert.equal(result.get(1n, 1n), 40.0))
    });

    test("Matrix mapRows changing column count", $ => {
        const m = $.let(East.Matrix.fromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]]));
        // Slice each row to first 2 elements
        const result = $.let(m.mapRows(($, row) => row.slice(0n, 2n)));
        $(assert.equal(result.rows(), 2n))
        $(assert.equal(result.cols(), 2n))
        $(assert.equal(result.get(0n, 0n), 1.0))
        $(assert.equal(result.get(0n, 1n), 2.0))
        $(assert.equal(result.get(1n, 0n), 4.0))
        $(assert.equal(result.get(1n, 1n), 5.0))
    });

    test("Matrix mapRows with index", $ => {
        const m = $.let(East.Matrix.fromArray([[10.0, 20.0], [30.0, 40.0]]));
        // Add row index to each element
        const result = $.let(m.mapRows(($, row, idx) => row.map(($, x) => x.add(idx.toFloat()))));
        $(assert.equal(result.get(0n, 0n), 10.0))  // 10 + 0
        $(assert.equal(result.get(0n, 1n), 20.0))  // 20 + 0
        $(assert.equal(result.get(1n, 0n), 31.0))  // 30 + 1
        $(assert.equal(result.get(1n, 1n), 41.0))  // 40 + 1
    });

    test("Matrix mapRows concat extends columns", $ => {
        const m = $.let(East.Matrix.fromArray([[1.0, 2.0], [3.0, 4.0]]));
        const extra = $.let(East.Vector.fill(1n, 99.0));
        const result = $.let(m.mapRows(($, row) => row.concat(extra)));
        $(assert.equal(result.rows(), 2n))
        $(assert.equal(result.cols(), 3n))
        $(assert.equal(result.get(0n, 2n), 99.0))
        $(assert.equal(result.get(1n, 2n), 99.0))
    });

    test("Matrix mapRows integer", $ => {
        const m = $.let(East.Matrix.fromArray([[1n, 2n], [3n, 4n]]));
        const result = $.let(m.mapRows(($, row) => row.map(($, x) => x.multiply(2n))));
        $(assert.equal(result.get(0n, 0n), 2n))
        $(assert.equal(result.get(1n, 1n), 8n))
    });

    // ================================================================
    // toRows tests
    // ================================================================

    assert.examples(test, {
        matrixToRows: ex.matrixToRows,
    });

    test("Matrix toRows float", $ => {
        const m = $.let(East.Matrix.fromArray([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]]));
        const rows = $.let(m.toRows());
        $(assert.equal(rows.length(), 2n))
        const row0 = $.let(rows.get(0n));
        $(assert.equal(row0.length(), 3n))
        $(assert.equal(row0.get(0n), 1.0))
        $(assert.equal(row0.get(1n), 2.0))
        $(assert.equal(row0.get(2n), 3.0))
        const row1 = $.let(rows.get(1n));
        $(assert.equal(row1.get(0n), 4.0))
        $(assert.equal(row1.get(2n), 6.0))
    });

    test("Matrix toRows integer", $ => {
        const m = $.let(East.Matrix.fromArray([[10n, 20n], [30n, 40n]]));
        const rows = $.let(m.toRows());
        $(assert.equal(rows.length(), 2n))
        $(assert.equal(rows.get(0n).get(0n), 10n))
        $(assert.equal(rows.get(1n).get(1n), 40n))
    });

    test("Matrix toRows empty", $ => {
        const m = $.let(East.Matrix.zeros(0n, 0n));
        const rows = $.let(m.toRows());
        $(assert.equal(rows.length(), 0n))
    });

    test("Matrix toRows roundtrip", $ => {
        const m = $.let(East.Matrix.fromArray([[1.0, 2.0], [3.0, 4.0], [5.0, 6.0]]));
        const m2 = $.let(East.Matrix.fromRows(m.toRows()));
        $(assert.equal(m2.rows(), 3n))
        $(assert.equal(m2.cols(), 2n))
        $(assert.equal(m2.get(0n, 0n), 1.0))
        $(assert.equal(m2.get(0n, 1n), 2.0))
        $(assert.equal(m2.get(1n, 0n), 3.0))
        $(assert.equal(m2.get(1n, 1n), 4.0))
        $(assert.equal(m2.get(2n, 0n), 5.0))
        $(assert.equal(m2.get(2n, 1n), 6.0))
    });

    // ================================================================
    // fromRows tests
    // ================================================================

    assert.examples(test, {
        matrixFromRows: ex.matrixFromRows,
    });

    test("Matrix fromRows float", $ => {
        const rows = $.let([], ArrayType(VectorType(FloatType)));
        $(rows.pushLast(East.Vector.fromArray([1.0, 2.0, 3.0])))
        $(rows.pushLast(East.Vector.fromArray([4.0, 5.0, 6.0])))
        const m = $.let(East.Matrix.fromRows(rows));
        $(assert.equal(m.rows(), 2n))
        $(assert.equal(m.cols(), 3n))
        $(assert.equal(m.get(0n, 0n), 1.0))
        $(assert.equal(m.get(0n, 2n), 3.0))
        $(assert.equal(m.get(1n, 0n), 4.0))
        $(assert.equal(m.get(1n, 2n), 6.0))
    });

    test("Matrix fromRows integer", $ => {
        const rows = $.let([], ArrayType(VectorType(IntegerType)));
        $(rows.pushLast(East.Vector.fromArray([1n, 2n])))
        $(rows.pushLast(East.Vector.fromArray([3n, 4n])))
        const m = $.let(East.Matrix.fromRows(rows));
        $(assert.equal(m.rows(), 2n))
        $(assert.equal(m.cols(), 2n))
        $(assert.equal(m.get(0n, 0n), 1n))
        $(assert.equal(m.get(1n, 1n), 4n))
    });

    test("Matrix fromRows empty", $ => {
        const rows = $.let([], ArrayType(VectorType(FloatType)));
        const m = $.let(East.Matrix.fromRows(rows));
        $(assert.equal(m.rows(), 0n))
        $(assert.equal(m.cols(), 0n))
    });

    test("Matrix fromRows single row", $ => {
        const rows = $.let([], ArrayType(VectorType(FloatType)));
        $(rows.pushLast(East.Vector.fromArray([10.0, 20.0, 30.0])))
        const m = $.let(East.Matrix.fromRows(rows));
        $(assert.equal(m.rows(), 1n))
        $(assert.equal(m.cols(), 3n))
        $(assert.equal(m.get(0n, 0n), 10.0))
        $(assert.equal(m.get(0n, 2n), 30.0))
    });

    test("Matrix fromRows roundtrip integer", $ => {
        const m = $.let(East.Matrix.fromArray([[10n, 20n], [30n, 40n]]));
        const m2 = $.let(East.Matrix.fromRows(m.toRows()));
        $(assert.equal(m2.rows(), 2n))
        $(assert.equal(m2.cols(), 2n))
        $(assert.equal(m2.get(0n, 0n), 10n))
        $(assert.equal(m2.get(1n, 1n), 40n))
    });
});
