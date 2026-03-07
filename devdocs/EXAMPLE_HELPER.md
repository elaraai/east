# Example Helper Design

## Problem

The east-plugin uses skills to inject API reference into Claude Code conversations. The current reference docs (`api.md`, `examples.md`) are manually maintained and drift from actual behavior. The 400+ test files across East packages demonstrate correct API usage, but their format is unsuitable for direct injection into agent context because:

1. **Imports are relative** — `from "../src/index.js"` instead of `from "@elaraai/east"`
2. **Test harness is confusing** — `describeEast`, `assertEast`, `$()` patterns look like test infrastructure, not user-facing code
3. **No metadata** — tests lack keyword tags for search/retrieval

## Proposal

Add an `example()` helper that defines examples as East function expressions — the same thing users write. Each example is a callable function with typed args, a body, and an expected return value. Tests consume them by calling the function with default args and asserting the result. A script serializes them to JSON for the plugin's search index.

## API

### `example()` function

Mirrors `East.function()` signature with added metadata.

```typescript
interface ExampleDef<Args extends ExprType[], R extends ExprType> {
    /** Searchable keywords: API names, type names, concepts */
    keywords: string[];
    /** Human-readable description of what this example demonstrates */
    description: string;
    /** Argument types — same as East.function's first parameter */
    args: [...Args];
    /** Example body — same signature as East.function's body */
    body: ($: BlockBuilder<R>, ...args: ExprArgs<Args>) => Expr<R>;
    /** Default input values for testing. Defaults to [] (no args). */
    inputs?: InputValues<Args>;
    /** Expected return value when called with inputs. */
    returns?: ValueTypeOf<R>;
}

function example<Args extends ExprType[], R extends ExprType>(
    def: ExampleDef<Args, R>
): ExampleDef<Args, R> {
    return def;
}
```

### Example files

Separate `*.examples.ts` files adjacent to test files. Import from the public package.

```typescript
// east/test/array.examples.ts
import { East, ArrayType, IntegerType } from "@elaraai/east";
import { example } from "./platforms.spec.js";

// No args — body creates its own data
export const pushToArray = example({
    keywords: ["array", "ArrayType", "push", "pushLast", "mutation"],
    description: "Push items to an array using pushLast",
    args: [],
    body: ($) => {
        const a = $.let([], ArrayType(IntegerType));
        $(a.pushLast(1n));
        $(a.pushLast(2n));
        return a;
    },
    returns: [1n, 2n],
});

// With args — demonstrates a function that takes input
export const filterArray = example({
    keywords: ["array", "ArrayType", "filter"],
    description: "Filter array elements greater than a threshold",
    args: [ArrayType(IntegerType), IntegerType],
    body: ($, items, threshold) => {
        return items.filter(($, x) => x.greater(threshold));
    },
    inputs: [[1n, 5n, 3n, 8n, 2n], 3n],
    returns: [5n, 8n],
});

export const sortArray = example({
    keywords: ["array", "ArrayType", "sort", "orderBy"],
    description: "Sort an array in ascending order",
    args: [],
    body: ($) => {
        const a = $.const([3n, 1n, 2n]);
        return a.sort(($, x) => x);
    },
    returns: [1n, 2n, 3n],
});

export const mapArray = example({
    keywords: ["array", "ArrayType", "map", "transform"],
    description: "Transform array elements with map",
    args: [ArrayType(IntegerType)],
    body: ($, items) => {
        return items.map(($, x) => x.multiply(2n));
    },
    inputs: [[1n, 2n, 3n]],
    returns: [2n, 4n, 6n],
});
```

### Consuming examples in tests

Each example IS an East function definition. The test just calls it and asserts the result.

```typescript
// east/test/array.spec.ts
import * as arrayExamples from "./array.examples.js";
import { describeEast as describe, assertEast as assert, testExamples } from "./platforms.spec.js";

await describe("Array", (test) => {
    // Auto-run all examples as tests — calls each with its inputs, asserts returns
    testExamples(test, arrayExamples);

    // Additional bespoke tests
    test("pop from empty array throws", $ => {
        $(assert.throws(East.value([], ArrayType(IntegerType)).popFirst()));
    });
});
```

### `testExamples` implementation

Builds an `East.function` from each example, calls it with the default inputs, and asserts the return value.

```typescript
function testExamples(
    test: (name: string, body: ($: BlockBuilder<NullType>) => void) => void,
    examples: Record<string, ExampleDef<any, any>>
): void {
    for (const [_name, ex] of Object.entries(examples)) {
        // Build the East function from the example — identical to what a user would write
        const fn = East.function(ex.args, /* returnType inferred */, ex.body);

        if (ex.returns !== undefined) {
            // Call the function with default inputs and assert the result
            const inputs = ex.inputs ?? [];
            test(ex.description, $ => {
                const result = $.let(fn.call($, ...inputs));
                $(Assert.equal(result, ex.returns));
            });
        } else {
            // Smoke test — just call the function
            const inputs = ex.inputs ?? [];
            test(ex.description, $ => {
                $(fn.call($, ...inputs));
            });
        }
    }
}
```

**Key insight:** The example body is the exact same thing you'd pass to `East.function()`. There's no separate "example format" — it IS an East function definition, plus metadata.

### Platform-dependent examples

For packages with platform functions (east-node-std, east-node-io, etc.), examples may depend on platform availability. The `returns` field is optional — examples without it run as smoke tests.

```typescript
// east-node-std/src/fetch.examples.ts
import { StringType } from "@elaraai/east";
import { Fetch } from "./fetch.js";
import { example } from "./test.js";

export const fetchGet = example({
    keywords: ["fetch", "get", "http", "request"],
    description: "Fetch data from a URL with Fetch.get",
    args: [StringType],
    body: ($, url) => {
        return Fetch.get(url);
    },
    inputs: ["http://example.com/api"],
    // No `returns` — can't predict network response. Runs as smoke test.
});
```

Test suite provides platform functions via `describeEast` options:

```typescript
await describeEast("Fetch", (test) => {
    testExamples(test, fetchExamples);
}, { platformFns: [NodePlatform] });
```

## Index Generation

### How it works

A script in east-plugin dynamically imports all compiled `*.examples.js` files, iterates exports, and serializes each example to JSON.

- **Source code:** `example.body.toString()` returns the arrow function source at runtime (V8/Node.js). This avoids source file parsing entirely.
- **Imports:** The script reads the `.ts` source file and extracts import lines (everything before the first `export`). Since example files use public package imports (`@elaraai/east`), these are directly usable as reference.

### Output: `build/index.json`

```json
{
  "version": 1,
  "generated": "2026-03-06T...",
  "entries": [
    {
      "id": "east:array.examples.ts:filterArray",
      "skill": "east",
      "package": "east",
      "file": "test/array.examples.ts",
      "keywords": ["array", "ArrayType", "filter"],
      "description": "Filter array elements greater than a threshold",
      "imports": [
        "import { East, ArrayType, IntegerType } from \"@elaraai/east\";"
      ],
      "source": "($, items, threshold) => {\n    return items.filter(($, x) => x.greater(threshold));\n}",
      "args": ["ArrayType(IntegerType)", "IntegerType"],
      "inputs": "[[1n, 5n, 3n, 8n, 2n], 3n]",
      "returns": "[5n, 8n]"
    }
  ]
}
```

### Script invocation

```bash
# In CI — repos cloned into /workspace
node dist/scripts/generate-index.js --base-dir /workspace

# Local dev
node dist/scripts/generate-index.js --base-dir ..
```

The script reads `index.config.json` for source directories and file patterns (`*.examples.ts`).

## Migration Path

1. **Add `example()` and `testExamples()` to `platforms.spec.ts`** (east) and `test.ts` (east-node-std, etc.)
2. **Create example files incrementally** — start with high-value areas (array, struct, function), add more over time
3. **Import examples into existing test files** — add `testExamples(test, examples)` alongside existing tests
4. **Existing tests remain unchanged** — examples are additive. Bespoke tests cover edge cases, error paths, and complex scenarios that don't fit the function body/returns pattern

## Open Questions

1. **Return type inference** — `East.function(ex.args, ???, ex.body)` needs the return type. Options:
   - Add an explicit `returnType` field to `ExampleDef`
   - Infer from the body's return expression (if East.function already does this)
   - Infer from `returns` value

2. **Import aliasing** — Example files should use `@elaraai/east` imports. Options:
   - tsconfig `paths` mapping `@elaraai/east` → `../src/index.js` (needs runtime resolver like `tsx`)
   - Package.json `exports` self-reference (Node.js supports this natively)
   - Keep relative imports in source, rewrite during index generation (simplest)

3. **`body.toString()` from compiled JS** — TypeScript compiles to JS, so `body.toString()` returns the compiled JS source, not the original TS. For East code this is fine since the body uses no TS-specific syntax (no type annotations in the arrow function body). The arg types are in `args`, not in the body signature.

4. **Arg type serialization** — For the index, `args` types need string representation (e.g. `"ArrayType(IntegerType)"`). This could come from a `.toString()` on East types, or a separate serializer.
