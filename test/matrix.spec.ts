/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import { East } from "../src/index.js";
import { describeEast as describe, assertEast as assert } from "./platforms.spec.js";

await describe("Matrix", (test) => {
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
});
