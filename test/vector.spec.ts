/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import { East, ArrayType, FloatType } from "../src/index.js";
import { describeEast as describe, assertEast as assert } from "./platforms.spec.js";
import * as ex from "./vector.examples.js";

await describe("Vector", (test) => {
    assert.examples(test, {
        vectorZeros: ex.vectorZeros,
        vectorOnes: ex.vectorOnes,
        vectorFill: ex.vectorFill,
        vectorFromArray: ex.vectorFromArray,
    });

    test("Vector creation zeros", $ => {
        const v = $.let(East.Vector.zeros(3n));
        $(assert.equal(v.length(), 3n))
        $(assert.equal(v.get(0n), 0.0))
        $(assert.equal(v.get(1n), 0.0))
        $(assert.equal(v.get(2n), 0.0))
    });

    test("Vector creation ones", $ => {
        const v = $.let(East.Vector.ones(3n));
        $(assert.equal(v.length(), 3n))
        $(assert.equal(v.get(0n), 1.0))
        $(assert.equal(v.get(1n), 1.0))
        $(assert.equal(v.get(2n), 1.0))
    });

    test("Vector creation fill", $ => {
        const v = $.let(East.Vector.fill(4n, 3.14));
        $(assert.equal(v.length(), 4n))
        $(assert.equal(v.get(0n), 3.14))
        $(assert.equal(v.get(3n), 3.14))

        // Integer fill
        const vi = $.let(East.Vector.fill(3n, 42n));
        $(assert.equal(vi.length(), 3n))
        $(assert.equal(vi.get(0n), 42n))

        // Boolean fill
        const vb = $.let(East.Vector.fill(2n, true));
        $(assert.equal(vb.length(), 2n))
        $(assert.equal(vb.get(0n), true))
    });

    test("Vector creation empty", $ => {
        const v = $.let(East.Vector.zeros(0n));
        $(assert.equal(v.length(), 0n))
    });

    test("Vector from array", $ => {
        const arr = $.let([1.0, 2.0, 3.0]);
        const v = $.let(East.Vector.fromArray(arr));
        $(assert.equal(v.length(), 3n))
        $(assert.equal(v.get(0n), 1.0))
        $(assert.equal(v.get(1n), 2.0))
        $(assert.equal(v.get(2n), 3.0))
    });

    test("Vector from integer array", $ => {
        const arr = $.let([10n, 20n, 30n]);
        const v = $.let(East.Vector.fromArray(arr));
        $(assert.equal(v.length(), 3n))
        $(assert.equal(v.get(0n), 10n))
        $(assert.equal(v.get(1n), 20n))
        $(assert.equal(v.get(2n), 30n))
    });

    assert.examples(test, {
        vectorLength: ex.vectorLength,
        vectorGet: ex.vectorGet,
        vectorSet: ex.vectorSet,
    });

    test("Vector get and set", $ => {
        const v = $.let(East.Vector.zeros(3n));
        $(v.set(0n, 10.0))
        $(v.set(1n, 20.0))
        $(v.set(2n, 30.0))
        $(assert.equal(v.get(0n), 10.0))
        $(assert.equal(v.get(1n), 20.0))
        $(assert.equal(v.get(2n), 30.0))
    });

    test("Vector bounds checking", $ => {
        const v = $.let(East.Vector.zeros(3n));
        $(assert.throws(v.get(-1n)))
        $(assert.throws(v.get(3n)))
        $(assert.throws(v.set(-1n, 0.0)))
        $(assert.throws(v.set(3n, 0.0)))
    });

    assert.examples(test, {
        vectorSlice: ex.vectorSlice,
        vectorConcat: ex.vectorConcat,
    });

    test("Vector slice", $ => {
        const v = $.let(East.Vector.fill(5n, 0.0));
        $(v.set(0n, 1.0))
        $(v.set(1n, 2.0))
        $(v.set(2n, 3.0))
        $(v.set(3n, 4.0))
        $(v.set(4n, 5.0))
        const s = $.let(v.slice(1n, 4n));
        $(assert.equal(s.length(), 3n))
        $(assert.equal(s.get(0n), 2.0))
        $(assert.equal(s.get(1n), 3.0))
        $(assert.equal(s.get(2n), 4.0))
    });

    test("Vector concat", $ => {
        const a = $.let(East.Vector.fill(2n, 1.0));
        const b = $.let(East.Vector.fill(3n, 2.0));
        const c = $.let(a.concat(b));
        $(assert.equal(c.length(), 5n))
        $(assert.equal(c.get(0n), 1.0))
        $(assert.equal(c.get(1n), 1.0))
        $(assert.equal(c.get(2n), 2.0))
        $(assert.equal(c.get(4n), 2.0))
    });

    assert.examples(test, {
        vectorToArray: ex.vectorToArray,
        vectorToMatrix: ex.vectorToMatrix,
    });

    test("Vector to array", $ => {
        const arr = $.let([1.0, 2.0, 3.0]);
        const v = $.let(East.Vector.fromArray(arr));
        const result = $.let(v.toArray());
        $(assert.equal(result, [1.0, 2.0, 3.0]))
    });

    test("Vector to array integer", $ => {
        const arr = $.let([10n, 20n, 30n]);
        const v = $.let(East.Vector.fromArray(arr));
        const result = $.let(v.toArray());
        $(assert.equal(result, [10n, 20n, 30n]))
    });

    test("Vector to matrix reshape", $ => {
        const arr = $.let([1.0, 2.0, 3.0, 4.0, 5.0, 6.0]);
        const v = $.let(East.Vector.fromArray(arr));
        const m = $.let(v.toMatrix(2n, 3n));
        $(assert.equal(m.rows(), 2n))
        $(assert.equal(m.cols(), 3n))
        $(assert.equal(m.get(0n, 0n), 1.0))
        $(assert.equal(m.get(0n, 1n), 2.0))
        $(assert.equal(m.get(0n, 2n), 3.0))
        $(assert.equal(m.get(1n, 0n), 4.0))
        $(assert.equal(m.get(1n, 2n), 6.0))
    });

    assert.examples(test, {
        vectorMap: ex.vectorMap,
        vectorReduce: ex.vectorReduce,
    });

    test("Vector map", $ => {
        const arr = $.let([1.0, 2.0, 3.0]);
        const v = $.let(East.Vector.fromArray(arr));
        const doubled = $.let(v.map(($, x) => x.multiply(2.0)));
        $(assert.equal(doubled.get(0n), 2.0))
        $(assert.equal(doubled.get(1n), 4.0))
        $(assert.equal(doubled.get(2n), 6.0))
    });

    test("Vector map with index", $ => {
        const v = $.let(East.Vector.zeros(3n));
        const indexed = $.let(v.map(($, _x, i) => i));
        $(assert.equal(indexed.get(0n), 0n))
        $(assert.equal(indexed.get(1n), 1n))
        $(assert.equal(indexed.get(2n), 2n))
    });

    test("Vector reduce", $ => {
        const arr = $.let([1.0, 2.0, 3.0, 4.0]);
        const v = $.let(East.Vector.fromArray(arr));
        const sum = $.let(v.reduce(($, acc, val) => acc.add(val), 0.0));
        $(assert.equal(sum, 10.0))
    });

    test("Vector integer ops", $ => {
        const v = $.let(East.Vector.fill(3n, 0n));
        $(v.set(0n, 100n))
        $(v.set(1n, 200n))
        $(v.set(2n, 300n))
        $(assert.equal(v.length(), 3n))
        $(assert.equal(v.get(0n), 100n))
        $(assert.equal(v.get(1n), 200n))
        $(assert.equal(v.get(2n), 300n))
    });

    test("Vector boolean ops", $ => {
        const v = $.let(East.Vector.fill(3n, false));
        $(v.set(0n, true))
        $(assert.equal(v.length(), 3n))
        $(assert.equal(v.get(0n), true))
        $(assert.equal(v.get(1n), false))
        $(assert.equal(v.get(2n), false))
    });

    test("Vector literal float", $ => {
        const v = $.let(new Float64Array([1.0, 2.0, 3.0]));
        $(assert.equal(v.length(), 3n))
        $(assert.equal(v.get(0n), 1.0))
        $(assert.equal(v.get(1n), 2.0))
        $(assert.equal(v.get(2n), 3.0))
    });

    test("Vector literal integer", $ => {
        const v = $.let(new BigInt64Array([10n, 20n, 30n]));
        $(assert.equal(v.length(), 3n))
        $(assert.equal(v.get(0n), 10n))
        $(assert.equal(v.get(1n), 20n))
        $(assert.equal(v.get(2n), 30n))
    });

    test("Vector slice empty", $ => {
        const arr = $.let([1.0, 2.0, 3.0]);
        const v = $.let(East.Vector.fromArray(arr));
        const s = $.let(v.slice(1n, 1n));
        $(assert.equal(s.length(), 0n))
    });

    test("Vector concat with empty", $ => {
        const a = $.let(East.Vector.fill(3n, 1.0));
        const b = $.let(East.Vector.zeros(0n));
        const c = $.let(a.concat(b));
        $(assert.equal(c.length(), 3n))
        $(assert.equal(c.get(0n), 1.0))
    });

    test("Vector map add one", $ => {
        const v = $.let(East.Vector.ones(3n));
        const result = $.let(v.map(($, x) => x.add(1.0)));
        $(assert.equal(result.get(0n), 2.0))
        $(assert.equal(result.get(1n), 2.0))
        $(assert.equal(result.get(2n), 2.0))
    });

    test("Vector reduce product", $ => {
        const arr = $.let([1.0, 2.0, 3.0, 4.0]);
        const v = $.let(East.Vector.fromArray(arr));
        // Product: 1 * 2 * 3 * 4 = 24
        const result = $.let(v.reduce(($, acc, val) => acc.multiply(val), 1.0));
        $(assert.equal(result, 24.0))
    });

    test("Vector from boolean array", $ => {
        const arr = $.let([true, false, true]);
        const v = $.let(East.Vector.fromArray(arr));
        $(assert.equal(v.length(), 3n))
        $(assert.equal(v.get(0n), true))
        $(assert.equal(v.get(1n), false))
        $(assert.equal(v.get(2n), true))
    });

    test("Vector to array boolean", $ => {
        const v = $.let(East.Vector.fill(3n, false));
        $(v.set(0n, true))
        $(v.set(2n, true))
        const result = $.let(v.toArray());
        $(assert.equal(result, [true, false, true]))
    });

    test("Vector literal boolean", $ => {
        const v = $.let(new Uint8ClampedArray([1, 0, 1]));
        $(assert.equal(v.length(), 3n))
        $(assert.equal(v.get(0n), true))
        $(assert.equal(v.get(1n), false))
        $(assert.equal(v.get(2n), true))
    });

    test("Vector boolean slice", $ => {
        const v = $.let(East.Vector.fill(4n, false));
        $(v.set(0n, true))
        $(v.set(1n, false))
        $(v.set(2n, true))
        $(v.set(3n, true))
        const s = $.let(v.slice(1n, 3n));
        $(assert.equal(s.length(), 2n))
        $(assert.equal(s.get(0n), false))
        $(assert.equal(s.get(1n), true))
    });

    test("Vector boolean concat", $ => {
        const a = $.let(East.Vector.fill(2n, true));
        const b = $.let(East.Vector.fill(2n, false));
        const c = $.let(a.concat(b));
        $(assert.equal(c.length(), 4n))
        $(assert.equal(c.get(0n), true))
        $(assert.equal(c.get(1n), true))
        $(assert.equal(c.get(2n), false))
        $(assert.equal(c.get(3n), false))
    });

    test("Vector boolean map", $ => {
        const v = $.let(East.Vector.fill(3n, true));
        $(v.set(1n, false))
        const negated = $.let(v.map(($, x) => x.not()));
        $(assert.equal(negated.get(0n), false))
        $(assert.equal(negated.get(1n), true))
        $(assert.equal(negated.get(2n), false))
    });

    test("Vector boolean reduce", $ => {
        const v = $.let(East.Vector.fill(3n, true));
        $(v.set(1n, false))
        // count trues via ifElse: true→1n, false→0n, sum them
        const count = $.let(v.reduce(($, acc, val) => acc.add(val.ifElse(() => 1n, () => 0n)), 0n));
        $(assert.equal(count, 2n))
    });

    test("Vector boolean to matrix", $ => {
        const v = $.let(East.Vector.fill(4n, false));
        $(v.set(0n, true))
        $(v.set(3n, true))
        const m = $.let(v.toMatrix(2n, 2n));
        $(assert.equal(m.rows(), 2n))
        $(assert.equal(m.cols(), 2n))
        $(assert.equal(m.get(0n, 0n), true))
        $(assert.equal(m.get(0n, 1n), false))
        $(assert.equal(m.get(1n, 0n), false))
        $(assert.equal(m.get(1n, 1n), true))
    });

    test("Vector integer slice", $ => {
        const v = $.let(East.Vector.fill(4n, 0n));
        $(v.set(0n, 10n))
        $(v.set(1n, 20n))
        $(v.set(2n, 30n))
        $(v.set(3n, 40n))
        const s = $.let(v.slice(1n, 3n));
        $(assert.equal(s.length(), 2n))
        $(assert.equal(s.get(0n), 20n))
        $(assert.equal(s.get(1n), 30n))
    });

    test("Vector integer concat", $ => {
        const a = $.let(East.Vector.fill(2n, 1n));
        const b = $.let(East.Vector.fill(2n, 2n));
        const c = $.let(a.concat(b));
        $(assert.equal(c.length(), 4n))
        $(assert.equal(c.get(0n), 1n))
        $(assert.equal(c.get(2n), 2n))
    });

    test("Vector integer map", $ => {
        const arr = $.let([1n, 2n, 3n]);
        const v = $.let(East.Vector.fromArray(arr));
        const doubled = $.let(v.map(($, x) => x.multiply(2n)));
        $(assert.equal(doubled.get(0n), 2n))
        $(assert.equal(doubled.get(1n), 4n))
        $(assert.equal(doubled.get(2n), 6n))
    });

    test("Vector integer reduce", $ => {
        const arr = $.let([1n, 2n, 3n, 4n]);
        const v = $.let(East.Vector.fromArray(arr));
        const sum = $.let(v.reduce(($, acc, val) => acc.add(val), 0n));
        $(assert.equal(sum, 10n))
    });

    test("Vector integer to matrix", $ => {
        const arr = $.let([1n, 2n, 3n, 4n]);
        const v = $.let(East.Vector.fromArray(arr));
        const m = $.let(v.toMatrix(2n, 2n));
        $(assert.equal(m.rows(), 2n))
        $(assert.equal(m.cols(), 2n))
        $(assert.equal(m.get(0n, 0n), 1n))
        $(assert.equal(m.get(0n, 1n), 2n))
        $(assert.equal(m.get(1n, 0n), 3n))
        $(assert.equal(m.get(1n, 1n), 4n))
    });

    test("Vector fromArray with empty array", $ => {
        const arr = $.let([], ArrayType(FloatType));
        const v = $.let(East.Vector.fromArray(arr));
        $(assert.equal(v.length(), 0n))
    });
});
