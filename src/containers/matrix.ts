/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
export const matrix_symbol = Symbol("matrix");
export type matrix_symbol = typeof matrix_symbol;

export type matrix<T = Float64Array | BigInt64Array | Uint8Array> = {
    data: T;
    rows: number;
    cols: number;
    [matrix_symbol]: null;
};

export function matrix<T extends Float64Array | BigInt64Array | Uint8Array>(
    data: T, rows: number, cols: number
): matrix<T> {
    if (data.length !== rows * cols) {
        throw new Error(`Matrix data length ${data.length} does not match shape ${rows}×${cols}`);
    }
    return { data, rows, cols, [matrix_symbol]: null };
}

export function isMatrix(v: any): v is matrix {
    return typeof v === "object" && v !== null && v[matrix_symbol] === null;
}
