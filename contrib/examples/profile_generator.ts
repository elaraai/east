/**
 * Generate a large beast2 file similar to a real UI component tree.
 *
 * Creates a deeply recursive variant type (like UIComponentType) with many cases,
 * builds a tree of values with embedded functions that reference the recursive type
 * in their signatures (producing large IR with shared type annotations).
 *
 * The key: SDK-produced EastTypeValue objects share JS identity via toEastTypeValue()
 * caching, so the compact encoder should find backrefs for repeated type annotations.
 *
 * Usage: npx tsx contrib/examples/profile_generator.ts
 */
import { writeFileSync } from "fs";
import {
    East,
    RecursiveType,
    VariantType,
    ArrayType,
    OptionType,
    StructType,
    StringType,
    IntegerType,
    FloatType,
    BooleanType,
    FunctionType,
    NullType,
    DictType,
    IRType,
} from "../../src/index.js";
import { encodeBeast2For } from "../../src/serialization/beast2.js";
import { variant } from "../../src/containers/variant.js";

// ---------------------------------------------------------------------------
// 1. Define a UIComponent-like recursive type with many variant cases
// ---------------------------------------------------------------------------

// Style types (mimic real UI style structs)
const StyleType = StructType({
    color: OptionType(StringType),
    size: OptionType(StringType),
    variant: OptionType(VariantType({ outline: NullType, solid: NullType, subtle: NullType })),
    padding: OptionType(StringType),
    margin: OptionType(StringType),
    width: OptionType(StringType),
    height: OptionType(StringType),
    display: OptionType(StringType),
});

const ChartStyleType = StructType({
    color: OptionType(StringType),
    strokeWidth: OptionType(FloatType),
    showGrid: OptionType(BooleanType),
    showLegend: OptionType(BooleanType),
    animationDuration: OptionType(IntegerType),
});

// Build the recursive component type (~50 variant cases, like real UIComponentType)
const ComponentType = RecursiveType(node => VariantType({
    // Typography (leaf components)
    Text: StructType({ content: StringType, style: OptionType(StyleType) }),
    Heading: StructType({ level: IntegerType, content: StringType, style: OptionType(StyleType) }),
    Code: StructType({ content: StringType, language: OptionType(StringType) }),
    CodeBlock: StructType({ content: StringType, language: OptionType(StringType), showLineNumbers: OptionType(BooleanType) }),
    Link: StructType({ href: StringType, label: StringType, external: OptionType(BooleanType) }),
    Highlight: StructType({ content: StringType, query: StringType }),
    Mark: StructType({ content: StringType }),
    List: StructType({ items: ArrayType(StringType), ordered: OptionType(BooleanType) }),
    Paragraph: StructType({ content: StringType }),

    // Layout containers (reference node recursively)
    Box: StructType({ children: ArrayType(node), style: OptionType(StyleType) }),
    Stack: StructType({ children: ArrayType(node), direction: OptionType(StringType), style: OptionType(StyleType) }),
    Flex: StructType({ children: ArrayType(node), style: OptionType(StyleType) }),
    Grid: StructType({
        items: ArrayType(StructType({
            content: node,
            colSpan: OptionType(StringType),
            rowSpan: OptionType(StringType),
        })),
        columns: OptionType(IntegerType),
        style: OptionType(StyleType),
    }),
    Splitter: StructType({
        panels: ArrayType(StructType({
            id: StringType,
            content: node,
            minSize: OptionType(FloatType),
            maxSize: OptionType(FloatType),
        })),
        style: OptionType(StyleType),
    }),

    // Buttons
    Button: StructType({ label: StringType, disabled: OptionType(BooleanType), style: OptionType(StyleType) }),
    IconButton: StructType({ icon: StringType, label: StringType, style: OptionType(StyleType) }),

    // Forms
    StringInput: StructType({ value: OptionType(StringType), placeholder: OptionType(StringType), label: OptionType(StringType) }),
    IntegerInput: StructType({ value: OptionType(IntegerType), min: OptionType(IntegerType), max: OptionType(IntegerType) }),
    FloatInput: StructType({ value: OptionType(FloatType), min: OptionType(FloatType), max: OptionType(FloatType), step: OptionType(FloatType) }),
    Checkbox: StructType({ checked: OptionType(BooleanType), label: StringType }),
    Switch: StructType({ checked: OptionType(BooleanType), label: StringType }),
    Select: StructType({ items: ArrayType(StructType({ label: StringType, value: StringType })), value: OptionType(StringType) }),
    Slider: StructType({ value: OptionType(FloatType), min: FloatType, max: FloatType, step: OptionType(FloatType) }),
    Textarea: StructType({ value: OptionType(StringType), placeholder: OptionType(StringType), rows: OptionType(IntegerType) }),
    Field: StructType({ label: StringType, helperText: OptionType(StringType), control: node }),

    // Feedback
    Progress: StructType({ value: FloatType, max: OptionType(FloatType), style: OptionType(StyleType) }),
    Alert: StructType({
        status: VariantType({ error: NullType, info: NullType, success: NullType, warning: NullType }),
        title: OptionType(StringType),
        description: OptionType(StringType),
    }),

    // Display
    Badge: StructType({ content: StringType, style: OptionType(StyleType) }),
    Tag: StructType({ content: StringType, closable: OptionType(BooleanType) }),
    Avatar: StructType({ name: StringType, src: OptionType(StringType), size: OptionType(StringType) }),
    Icon: StructType({ name: StringType, size: OptionType(StringType) }),
    Stat: StructType({ label: StringType, value: node, helpText: OptionType(StringType) }),

    // Collections
    Card: StructType({ header: OptionType(node), body: ArrayType(node), footer: OptionType(node), style: OptionType(StyleType) }),
    DataList: StructType({
        items: ArrayType(StructType({ label: StringType, value: node })),
        orientation: OptionType(StringType),
    }),

    // Charts
    AreaChart: StructType({ data: ArrayType(DictType(StringType, FloatType)), style: OptionType(ChartStyleType) }),
    BarChart: StructType({ data: ArrayType(DictType(StringType, FloatType)), style: OptionType(ChartStyleType) }),
    LineChart: StructType({ data: ArrayType(DictType(StringType, FloatType)), style: OptionType(ChartStyleType) }),
    ScatterChart: StructType({ data: ArrayType(DictType(StringType, FloatType)), style: OptionType(ChartStyleType) }),
    PieChart: StructType({ data: ArrayType(DictType(StringType, FloatType)), style: OptionType(ChartStyleType) }),

    // Disclosure
    Accordion: StructType({
        items: ArrayType(StructType({ trigger: StringType, content: ArrayType(node), disabled: OptionType(BooleanType) })),
        style: OptionType(StyleType),
    }),
    Tabs: StructType({
        items: ArrayType(StructType({ trigger: StringType, content: ArrayType(node), disabled: OptionType(BooleanType) })),
        value: OptionType(StringType),
    }),
    Carousel: StructType({ items: ArrayType(node), loop: OptionType(BooleanType) }),

    // Overlays
    Tooltip: StructType({ trigger: node, content: StringType }),
    Dialog: StructType({ trigger: node, body: ArrayType(node), title: OptionType(StringType) }),
    Drawer: StructType({ trigger: node, body: ArrayType(node), title: OptionType(StringType) }),
    Popover: StructType({ trigger: node, body: ArrayType(node), title: OptionType(StringType) }),
    Menu: StructType({
        trigger: node,
        items: ArrayType(VariantType({ Action: StructType({ label: StringType, value: StringType }), Separator: NullType })),
    }),

    // Reactive (this is the big one — contains a render function)
    ReactiveComponent: StructType({
        render: FunctionType([], node),
    }),

    // Separator
    Separator: StructType({ orientation: OptionType(StringType) }),
    Spacer: NullType,
}));

// ---------------------------------------------------------------------------
// 2. Build helper functions to create component values
// ---------------------------------------------------------------------------

const none = variant("none", null);
const some = <T>(v: T) => variant("some", v);

function text(content: string): any {
    return variant("Text", { content, style: none });
}

function heading(level: bigint, content: string): any {
    return variant("Heading", { level, content, style: none });
}

function button(label: string): any {
    return variant("Button", { label, disabled: none, style: none });
}

function box(children: any[]): any {
    return variant("Box", { children, style: none });
}

function stack(children: any[]): any {
    return variant("Stack", { children, direction: none, style: none });
}

function card(body: any[]): any {
    return variant("Card", { header: none, body, footer: none, style: none });
}

function badge(content: string): any {
    return variant("Badge", { content, style: none });
}

function stat(label: string, value: any): any {
    return variant("Stat", { label, value, helpText: none });
}

function accordion(items: { trigger: string; content: any[] }[]): any {
    return variant("Accordion", {
        items: items.map(i => ({ trigger: i.trigger, content: i.content, disabled: none })),
        style: none,
    });
}

function tabs(items: { trigger: string; content: any[] }[]): any {
    return variant("Tabs", {
        items: items.map(i => ({ trigger: i.trigger, content: i.content, disabled: none })),
        value: none,
    });
}

function dataList(items: { label: string; value: any }[]): any {
    return variant("DataList", { items, orientation: none });
}

function dialog(trigger: any, body: any[]): any {
    return variant("Dialog", { trigger, body, title: none });
}

function field(label: string, control: any): any {
    return variant("Field", { label, helperText: none, control });
}

// Create a ReactiveComponent with a render function
function reactive(bodyFn: ($: any) => any): any {
    const fn = East.compile(East.function([], ComponentType, bodyFn), []);
    return variant("ReactiveComponent", { render: fn });
}

// ---------------------------------------------------------------------------
// 3. Build a large tree with many ReactiveComponents (each has function IR
//    referencing ComponentType — the shared type annotations create backrefs)
// ---------------------------------------------------------------------------

console.log("Building component tree...");

// Generate a dashboard-like page with many nested components and reactive sections
function generateDashboard(id: number): any {
    return card([
        heading(2n, `Dashboard ${id}`),
        stack([
            // Stats row with reactive components
            ...Array.from({ length: 4 }, (_, i) =>
                reactive($ => {
                    const val = $.const(42n + BigInt(i), IntegerType);
                    return stat(`Metric ${i}`, text(val.toString()));
                })
            ),
        ]),
        // Data section with nested tabs
        tabs([
            {
                trigger: "Overview",
                content: [
                    stack([
                        ...Array.from({ length: 3 }, (_, i) =>
                            reactive($ => {
                                const label = $.const(`Item ${i}`, StringType);
                                return dataList([
                                    { label: "Name", value: text(label) },
                                    { label: "Status", value: badge("Active") },
                                    { label: "Score", value: text("98.5") },
                                ]);
                            })
                        ),
                    ]),
                ],
            },
            {
                trigger: "Details",
                content: [
                    accordion([
                        {
                            trigger: "Section A",
                            content: Array.from({ length: 5 }, (_, i) =>
                                reactive($ => {
                                    const idx = $.const(BigInt(i), IntegerType);
                                    return box([
                                        text(idx.toString()),
                                        button("Action"),
                                        field("Input", variant("StringInput", {
                                            value: none,
                                            placeholder: some("Enter value..."),
                                            label: some("Field"),
                                        })),
                                    ]);
                                })
                            ),
                        },
                        {
                            trigger: "Section B",
                            content: Array.from({ length: 5 }, (_, i) =>
                                reactive($ => {
                                    const flag = $.const(i % 2 === 0, BooleanType);
                                    return stack([
                                        text(flag.ifElse(() => East.value("Even"), () => East.value("Odd"))),
                                        variant("Progress", { value: (i + 1) * 20.0, max: some(100.0), style: none }),
                                    ]);
                                })
                            ),
                        },
                    ]),
                ],
            },
            {
                trigger: "Settings",
                content: Array.from({ length: 4 }, (_, i) =>
                    reactive($ => {
                        return card([
                            heading(3n, `Setting Group ${i}`),
                            ...Array.from({ length: 3 }, (_, j) =>
                                field(`Option ${j}`, variant("Switch", {
                                    checked: some(j % 2 === 0),
                                    label: `Toggle ${j}`,
                                }))
                            ),
                        ]);
                    })
                ),
            },
        ]),
        // Dialog with nested content
        dialog(button("Open Details"), [
            stack(Array.from({ length: 6 }, (_, i) =>
                reactive($ => {
                    const n = $.const(BigInt(i * 10), IntegerType);
                    return box([
                        text(n.toString()),
                        badge(`Tag ${i}`),
                    ]);
                })
            )),
        ]),
    ]);
}

// Build the full page — multiple dashboards in a layout
const NUM_DASHBOARDS = 25; // ~25 dashboards × ~30 reactive components each ≈ 750 functions
const page = box(
    Array.from({ length: NUM_DASHBOARDS }, (_, i) => generateDashboard(i))
);

// ---------------------------------------------------------------------------
// 4. Wrap in an East.function that returns the component tree, export as IR
// ---------------------------------------------------------------------------

console.log(`Generated tree with ${NUM_DASHBOARDS} dashboards`);

// Build a function that returns the page value
const irFn = East.function([], ComponentType, ($) => {
    return $.const(page, ComponentType);
});

// Serialize IR as beast2 (type = IRType)
const ir = irFn.toIR();

console.log("\nEncoding IR as beast2...");
const t0 = performance.now();
const encoder = encodeBeast2For(IRType);
const encodedBytes = encoder(ir.ir);
const t1 = performance.now();
console.log(`Encode: ${(t1 - t0).toFixed(1)}ms`);
console.log(`Size: ${(encodedBytes.length / 1024 / 1024).toFixed(2)} MB`);

const outputPath = "/tmp/ui-gen-ir.beast2";
writeFileSync(outputPath, encodedBytes);
console.log(`Wrote: ${outputPath}`);
