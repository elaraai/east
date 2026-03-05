/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Licensed under AGPL-3.0. See LICENSE file for details.
 *
 * Profile Generator - Creates complex IR for profiling east-py compilation and execution.
 *
 * Usage:
 *   cd /home/crambelsoupy/src/east
 *   npm run build
 *   node dist/contrib/examples/profile_generator.js [--size small|medium|large]
 */

import { writeFileSync, mkdirSync } from "fs";
import {
    East,
    IntegerType,
    FloatType,
    StringType,
    BooleanType,
    NullType,
    ArrayType,
    SetType,
    DictType,
    StructType,
    VariantType,
    IRType,
    variant,
    BlobType,
    OptionType,
} from "../../src/index.js";
import { toJSONFor } from "../../src/serialization/json.js";
import { encodeBeast2For } from "../../src/serialization/beast2.js";
import type { IR } from "../../src/ir.js";

// =============================================================================
// Configuration
// =============================================================================

interface ProfileConfig {
    size: "small" | "medium" | "large" | "xlarge" | "stress" | "massive";
    outputDir: string;
}

const SIZE_CONFIGS = {
    small: { collectionSize: 10, loopIterations: 50, nestingDepth: 3 },
    medium: { collectionSize: 100, loopIterations: 500, nestingDepth: 5 },
    large: { collectionSize: 500, loopIterations: 2000, nestingDepth: 7 },
    xlarge: { collectionSize: 2000, loopIterations: 10000, nestingDepth: 10 },
    stress: { collectionSize: 5000, loopIterations: 50000, nestingDepth: 12 },
    massive: { collectionSize: 100000, loopIterations: 100000, nestingDepth: 12 },
};

// =============================================================================
// Test Generators
// =============================================================================

/** Array operations: generate, map, filter, reduce, sort */
function createArrayOperationsTest(size: number) {
    return East.function([], IntegerType, $ => {
        const arr = $.let(East.Array.generate(BigInt(size), IntegerType, ($, i) => i));
        const squared = $.let(arr.map(($, x) => x.multiply(x)));
        const evens = $.let(squared.filter(($, x) => x.remainder(2n).equals(0n)));
        const sum = $.let(evens.reduce(($, acc, x) => acc.add(x), 0n));
        const sorted = $.let(evens.sort(($, a) => a));
        return sum.add(sorted.length());
    });
}

/** Dict operations with struct keys */
function createDictWithStructKeysTest(size: number) {
    const KeyType = StructType({ x: IntegerType, y: IntegerType });
    const ValueType = StructType({ name: StringType, score: FloatType });
    const DType = DictType(KeyType, ValueType);

    return East.function([], IntegerType, $ => {
        const dict = $.let(new Map(), DType);
        $.for(East.Array.generate(BigInt(size), IntegerType, ($, i) => i), ($, i) => {
            const key = $.let({ x: i, y: i.multiply(2n) }, KeyType);
            const value = $.let({
                name: East.str`item_${i}`,
                score: i.toFloat().multiply(1.5),
            }, ValueType);
            dict.insert(key, value);
        });
        const len = $.let(dict.size());
        const total = $.let(0n);
        $.for(dict, ($, v) => {
            $.assign(total, total.add(East.Float.roundHalf(v.score)));
        });
        return len.add(total);
    });
}

/** Nested for loops */
function createNestedLoopsTest(iterations: number) {
    const sqrtIter = Math.floor(Math.sqrt(iterations));
    return East.function([], IntegerType, $ => {
        const result = $.let(0n);
        $.for(East.Array.generate(BigInt(sqrtIter), IntegerType, ($, i) => i), ($, i) => {
            $.for(East.Array.generate(BigInt(sqrtIter), IntegerType, ($, j) => j), ($, j) => {
                $.if(i.add(j).remainder(2n).equals(0n), $ => {
                    $.assign(result, result.add(i.multiply(j)));
                }).else($ => {
                    $.assign(result, result.subtract(1n));
                });
            });
        });
        return result;
    });
}

/** While loop operations */
function createWhileLoopTest(maxIter: number) {
    return East.function([], IntegerType, $ => {
        const counter = $.let(0n);
        const sum = $.let(0n);
        $.while(counter.lessThan(BigInt(maxIter)), $ => {
            $.assign(sum, sum.add(counter));
            $.assign(counter, counter.add(1n));
        });
        return sum;
    });
}

/** Variant pattern matching */
function createVariantMatchingTest(size: number) {
    const ResultType = VariantType({
        success: IntegerType,
        error: StringType,
        pending: NullType,
    });

    return East.function([], IntegerType, $ => {
        // Create array of variants using JS values
        const items: any[] = [];
        for (let i = 0; i < size; i++) {
            if (i % 3 === 0) {
                items.push(variant("success", BigInt(i)));
            } else if (i % 3 === 1) {
                items.push(variant("error", "err"));
            } else {
                items.push(variant("pending", null));
            }
        }
        const arr = $.let(items, ArrayType(ResultType));

        const total = $.let(0n);
        $.for(arr, ($, item) => {
            $.match(item, {
                success: ($, val) => {
                    $.assign(total, total.add(val));
                },
                error: ($, _msg) => {
                    $.assign(total, total.subtract(1n));
                },
                pending: $ => {
                    // Nothing
                },
            });
        });
        return total;
    });
}

/** Set operations */
function createSetOperationsTest(size: number) {
    const SType = SetType(StringType);
    return East.function([], IntegerType, $ => {
        const set1 = $.let(new Set<string>(), SType);
        const set2 = $.let(new Set<string>(), SType);
        $.for(East.Array.generate(BigInt(size), IntegerType, ($, i) => i), ($, i) => {
            set1.insert(East.str`item_${i}`);
            $.if(i.remainder(2n).equals(0n), $ => {
                set2.insert(East.str`item_${i}`);
            });
        });
        const len1 = $.let(set1.size());
        const len2 = $.let(set2.size());
        const intersection = $.let(set1.intersection(set2));
        const lenIntersection = $.let(intersection.size());
        return len1.add(len2).add(lenIntersection);
    });
}

/** Deeply nested struct operations */
function createDeepStructTest(depth: number) {
    // Build type: { value: Integer, nested?: ..., extra?: String }
    let currentType = StructType({ value: IntegerType });
    for (let i = 1; i < depth; i++) {
        currentType = StructType({
            value: IntegerType,
            nested: currentType,
            extra: StringType,
        });
    }
    const DeepType = currentType;

    return East.function([], IntegerType, $ => {
        let currentValue: any = { value: 42n };
        for (let i = 1; i < depth; i++) {
            currentValue = {
                value: BigInt(i),
                nested: currentValue,
                extra: `level_${i}`,
            };
        }
        const deep = $.const(currentValue, DeepType);
        return deep.value;
    });
}

/** String operations */
function createStringOperationsTest(size: number) {
    return East.function([], IntegerType, $ => {
        const strings = $.let(East.Array.generate(BigInt(size), StringType, ($, i) =>
            East.str`string_number_${i}_with_padding`
        ));
        const upper = $.let(strings.map(($, s) => s.upperCase()));
        const filtered = $.let(upper.filter(($, s) => s.contains("5")));
        const joined = $.let(filtered.stringJoin(","));
        return joined.length();
    });
}

/** Mixed operations */
function createMixedOperationsTest(size: number) {
    const RecordType = StructType({
        id: IntegerType,
        name: StringType,
        scores: ArrayType(FloatType),
        active: BooleanType,
    });

    return East.function([], FloatType, $ => {
        // Build records as JS values
        const recordsData: any[] = [];
        for (let i = 0; i < size; i++) {
            recordsData.push({
                id: BigInt(i),
                name: `record_${i}`,
                scores: [Number(i), Number(i) * 1.5, Number(i) * 2.0],
                active: i % 2 === 0,
            });
        }
        const records = $.let(recordsData, ArrayType(RecordType));
        const activeRecords = $.let(records.filter(($, r) => r.active));
        const avgScores = $.let(activeRecords.map(($, r) => r.scores.mean()));
        const total = $.let(avgScores.reduce(($, acc, x) => acc.add(x), 0.0));
        return total;
    });
}

/** Arithmetic operations */
function createArithmeticTest(size: number) {
    return East.function([], FloatType, $ => {
        const floats = $.let(East.Array.generate(BigInt(size), FloatType, ($, i) =>
            i.toFloat().add(0.5)
        ));
        const processed = $.let(floats.map(($, x) =>
            x.sqrt().add(x.sin()).multiply(x.cos().abs())
        ));
        return processed.sum();
    });
}

/** Sorting with complex struct comparators - embeds large array */
function createComplexSortTest(size: number) {
    const RecordType = StructType({
        id: IntegerType,
        name: StringType,
        priority: IntegerType,
        score: FloatType,
    });

    // Build records as JS values (embedded in IR, not generated at runtime)
    const records: any[] = [];
    for (let i = 0; i < size; i++) {
        records.push({
            id: BigInt(size - i),  // Reverse order to ensure sorting work
            name: `record_${String(i).padStart(5, "0")}`,
            priority: BigInt(i % 10),
            score: Math.sin(i) * 100,
        });
    }

    return East.function([], IntegerType, $ => {
        const arr = $.let(records, ArrayType(RecordType));
        // Sort by multiple fields: priority desc, then score desc, then id asc
        const sorted = $.let(arr.sort(($, r) =>
            r.priority.negate().multiply(1000000n)
                .add(East.Float.roundHalf(r.score.negate().multiply(1000.0)))
                .add(r.id)
        ));
        // Access many elements to stress the sorted result
        const total = $.let(0n);
        $.for(sorted, ($, r) => {
            $.assign(total, total.add(r.id).add(r.priority));
        });
        return total;
    });
}

/** Heavy dict lookups with struct keys - embeds large dict */
function createDictLookupStressTest(size: number) {
    const KeyType = StructType({ x: IntegerType, y: IntegerType, z: IntegerType });
    const ValueType = StructType({ data: StringType, count: IntegerType });

    // Build dict entries (embedded in IR)
    const entries: [any, any][] = [];
    for (let i = 0; i < size; i++) {
        const key = { x: BigInt(i % 100), y: BigInt(Math.floor(i / 100)), z: BigInt(i) };
        const value = { data: `value_${i}`, count: BigInt(i * 2) };
        entries.push([key, value]);
    }

    return East.function([], IntegerType, $ => {
        const dict = $.let(new Map(entries), DictType(KeyType, ValueType));
        const result = $.let(0n);
        // Iterate and do lookups
        $.for(dict, ($, v, k) => {
            // Look up a related key
            const lookupKey = $.let({ x: k.x, y: k.y, z: k.z.add(1n) }, KeyType);
            $.if(dict.has(lookupKey), $ => {
                const found = $.let(dict.get(lookupKey));
                $.assign(result, result.add(found.count));
            });
        });
        return result;
    });
}

/** Deeply nested variant matching - embeds deep variant tree */
function createDeepVariantTest(depth: number) {
    // Create a recursive tree type
    const LeafType = StructType({ value: IntegerType });
    const NodeType = VariantType({
        leaf: LeafType,
        branch: StructType({
            left: IntegerType,  // Placeholder - we'll use a simpler nested approach
            right: IntegerType,
        }),
    });

    // Build a chain of nested variants
    const variants: any[] = [];
    for (let i = 0; i < depth * 10; i++) {
        if (i % 3 === 0) {
            variants.push(variant("leaf", { value: BigInt(i) }));
        } else {
            variants.push(variant("branch", { left: BigInt(i), right: BigInt(i * 2) }));
        }
    }

    return East.function([], IntegerType, $ => {
        const arr = $.let(variants, ArrayType(NodeType));
        const sum = $.let(0n);
        $.for(arr, ($, item) => {
            $.match(item, {
                leaf: ($, leaf) => {
                    $.assign(sum, sum.add(leaf.value));
                },
                branch: ($, branch) => {
                    $.assign(sum, sum.add(branch.left).add(branch.right));
                },
            });
        });
        return sum;
    });
}

/** String-heavy operations with embedded strings */
function createStringStressTest(size: number) {
    // Generate many strings to embed
    const strings: string[] = [];
    for (let i = 0; i < size; i++) {
        strings.push(`string_${i}_with_some_padding_text_here_${i % 100}`);
    }

    return East.function([], IntegerType, $ => {
        const arr = $.let(strings, ArrayType(StringType));
        // Many string operations
        const upper = $.let(arr.map(($, s) => s.upperCase()));
        const filtered = $.let(upper.filter(($, s) => s.contains("5")));
        const lengths = $.let(filtered.map(($, s) => s.length()));
        return lengths.sum();
    });
}

/** CSV decode: parse a large CSV blob into an array of structs */
function createCsvDecodeTest(size: number) {
    const RowType = StructType({
        id: IntegerType,
        name: StringType,
        score: FloatType,
        active: BooleanType,
        notes: OptionType(StringType),
    });

    // Build CSV string with header + size rows
    const lines: string[] = ["id,name,score,active,notes"];
    for (let i = 0; i < size; i++) {
        const active = i % 2 === 0 ? "true" : "false";
        const notes = i % 3 === 0 ? "" : `note_${i}`;
        lines.push(`${i},person_${i},${(i * 1.5).toFixed(2)},${active},${notes}`);
    }
    const csvBytes = new TextEncoder().encode(lines.join("\n"));

    return East.function([], IntegerType, $ => {
        const blob = $.let(East.value(csvBytes, BlobType));
        const rows = $.let(blob.decodeCsv(RowType, { nullStrings: [""] }));
        const count = $.let(rows.size());
        return count;
    });
}

/** CSV encode: build an array of structs and encode to CSV blob */
function createCsvEncodeTest(size: number) {
    const RowType = StructType({
        id: IntegerType,
        name: StringType,
        value: FloatType,
        flag: BooleanType,
    });

    // Build records as JS values (embedded in IR)
    const records: any[] = [];
    for (let i = 0; i < size; i++) {
        records.push({
            id: BigInt(i),
            name: `item_${i}`,
            value: i * 2.5,
            flag: i % 2 === 0,
        });
    }

    return East.function([], IntegerType, $ => {
        const arr = $.let(records, ArrayType(RowType));
        const blob = $.let(arr.encodeCsv());
        return blob.size();
    });
}

/** Large output: build and return a large Array<Struct> (exercises beast2 output encoding) */
function createLargeOutputTest(size: number) {
    const RecordType = StructType({
        id: IntegerType,
        name: StringType,
        values: ArrayType(FloatType),
        active: BooleanType,
    });

    return East.function([], ArrayType(RecordType), $ => {
        return East.Array.generate(BigInt(size), RecordType, ($, i) =>
            $.let({
                id: i,
                name: East.str`record_${i}`,
                values: [i.toFloat(), i.toFloat().multiply(1.5), i.toFloat().multiply(2.0)],
                active: i.remainder(2n).equals(0n),
            }, RecordType)
        );
    });
}

// =============================================================================
// Main
// =============================================================================

function generateProfileIR(config: ProfileConfig): IR[] {
    const sizeConfig = SIZE_CONFIGS[config.size];
    console.log(`Generating profile IR:`, { size: config.size, ...sizeConfig });

    const tests = [
        { name: "array_operations", fn: createArrayOperationsTest(sizeConfig.collectionSize) },
        { name: "dict_struct_keys", fn: createDictWithStructKeysTest(sizeConfig.collectionSize) },
        { name: "nested_loops", fn: createNestedLoopsTest(sizeConfig.loopIterations) },
        { name: "while_loop", fn: createWhileLoopTest(sizeConfig.loopIterations) },
        { name: "variant_matching", fn: createVariantMatchingTest(sizeConfig.collectionSize) },
        { name: "set_operations", fn: createSetOperationsTest(sizeConfig.collectionSize) },
        { name: "deep_struct", fn: createDeepStructTest(sizeConfig.nestingDepth) },
        { name: "string_operations", fn: createStringOperationsTest(sizeConfig.collectionSize) },
        { name: "mixed_operations", fn: createMixedOperationsTest(sizeConfig.collectionSize) },
        { name: "arithmetic_operations", fn: createArithmeticTest(sizeConfig.collectionSize) },
        { name: "complex_sort", fn: createComplexSortTest(sizeConfig.collectionSize) },
        { name: "dict_lookup_stress", fn: createDictLookupStressTest(sizeConfig.collectionSize) },
        { name: "deep_variant", fn: createDeepVariantTest(sizeConfig.nestingDepth) },
        { name: "string_stress", fn: createStringStressTest(sizeConfig.collectionSize) },
        { name: "csv_decode", fn: createCsvDecodeTest(sizeConfig.collectionSize) },
        { name: "csv_encode", fn: createCsvEncodeTest(sizeConfig.collectionSize) },
        { name: "large_output", fn: createLargeOutputTest(sizeConfig.collectionSize) },
    ];

    return tests.map(t => {
        console.log(`  Generating ${t.name}...`);
        return t.fn.toIR().ir;
    });
}

function parseArgs(): ProfileConfig {
    const args = process.argv.slice(2);
    const config: ProfileConfig = { size: "medium", outputDir: "/tmp/east-profile-ir" };
    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--size" && args[i + 1]) {
            const size = args[i + 1] as "small" | "medium" | "large" | "xlarge" | "stress" | "massive";
            if (size in SIZE_CONFIGS) config.size = size;
            i++;
        } else if (args[i] === "--output" && args[i + 1]) {
            config.outputDir = args[i + 1]!;
            i++;
        }
    }
    return config;
}

async function main() {
    const config = parseArgs();
    console.log("=".repeat(60));
    console.log(" East Profile IR Generator");
    console.log("=".repeat(60));

    mkdirSync(config.outputDir, { recursive: true });
    const irList = generateProfileIR(config);

    const toJSON = toJSONFor(IRType);
    const encodeBeast2 = encodeBeast2For(IRType);

    let totalJsonSize = 0, totalBeast2Size = 0;
    const beast2Only = config.size === "massive";
    const testNames = [
        "array_operations", "dict_struct_keys", "nested_loops", "while_loop",
        "variant_matching", "set_operations", "deep_struct", "string_operations",
        "mixed_operations", "arithmetic_operations", "complex_sort", "dict_lookup_stress",
        "deep_variant", "string_stress", "csv_decode", "csv_encode", "large_output"
    ];

    for (let i = 0; i < irList.length; i++) {
        const ir = irList[i]!;
        const name = testNames[i]!;

        let jsonSizeKB = "skipped";
        if (!beast2Only) {
            const jsonData = toJSON(ir);
            const jsonStr = JSON.stringify(jsonData);
            writeFileSync(`${config.outputDir}/${name}_${config.size}.json`, jsonStr);
            totalJsonSize += jsonStr.length;
            jsonSizeKB = `${(jsonStr.length / 1024).toFixed(1)}KB`;
        }

        const beast2Data = encodeBeast2(ir);
        writeFileSync(`${config.outputDir}/${name}_${config.size}.beast2`, beast2Data);
        totalBeast2Size += beast2Data.length;

        console.log(`  ${name}: JSON=${jsonSizeKB}, BEAST2=${(beast2Data.length / 1024).toFixed(1)}KB`);
    }

    console.log("\n" + "=".repeat(60));
    if (!beast2Only) {
        console.log(` Total JSON: ${(totalJsonSize / 1024).toFixed(1)} KB`);
        console.log(` Compression: ${(totalJsonSize / totalBeast2Size).toFixed(2)}x`);
    }
    console.log(` Total BEAST2: ${(totalBeast2Size / 1024).toFixed(1)} KB`);
    console.log(` Output: ${config.outputDir}`);
    console.log("=".repeat(60));
    console.log(`\nRun profiler:`);
    console.log(`  uv run --package east-py python packages/east-py/scripts/east_profiler.py ${config.outputDir}/*.beast2`);
}

main().catch(console.error);
