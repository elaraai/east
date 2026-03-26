/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Licensed under AGPL-3.0. See LICENSE file for details.
 *
 * Runnable versions of the README.md code examples.
 * Ensures README examples stay in sync with the actual API.
 *
 * Usage:
 *   cd /home/crambelsoupy/src/east
 *   npm run build
 *   node dist/contrib/examples/readme.js
 */

import {
    East,
    IntegerType,
    StringType,
    NullType,
    ArrayType,
    DictType,
    FunctionType,
    StructType,
    encodeBeast2For,
    decodeBeast2For,
    Expr,
} from "../../src/index.js";
import { TypeSymbol } from "../../src/internal.js";

// =============================================================================
// Basic Example (README "Quick Start")
// =============================================================================

{
    // Platform function for logging
    const log = East.platform("log", [StringType], NullType);

    const platform = [
        log.implement(console.log),
    ];

    // Define sale data type
    const SaleType = StructType({
        product: StringType,
        quantity: IntegerType,
        price: IntegerType
    });

    // Calculate revenue per product from sales data
    const calculateRevenue = East.function(
        [ArrayType(SaleType)],
        DictType(StringType, IntegerType),
        ($, sales) => {
            // Group sales by product and sum revenue (quantity × price)
            const revenueByProduct = sales.groupSum(
                // Group by product name
                ($, sale) => sale.product,
                // Sum quantity × price
                ($, sale) => sale.quantity.multiply(sale.price)
            );

            // Log revenue for each product
            $(log(East.str`Total Revenue: ${East.Integer.printCurrency(revenueByProduct.sum())}`));

            $.return(revenueByProduct);
        }
    );

    // Compile and execute
    const compiled = East.compile(calculateRevenue, new Map(), platform);

    const sales = [
        { product: "Widget", quantity: 10n, price: 50n },
        { product: "Gadget", quantity: 5n, price: 100n },
        { product: "Widget", quantity: 3n, price: 50n }
    ];

    const result = compiled(sales);
    console.log("Basic Example result:", result);
    // Total Revenue: $1,150
}

// =============================================================================
// Fluent Interface Example
// =============================================================================

{
    const myFunction = East.function([IntegerType], IntegerType, ($, x) => {
        // Arithmetic
        const result = $.const(x.add(10n).multiply(2n));

        // Collections
        const arr = $.const([1n, 2n, 3n]);
        const doubled = $.const(arr.map(($, x, i) => x.multiply(2n)));
        const sum = $.const(doubled.sum());

        // Closures can capture variables from the enclosing scope
        const addResult = $.const(East.function([IntegerType], IntegerType, ($, y) => {
            $.return(y.add(result));
        }));

        $.return(addResult(sum));
    });

    const compiled = East.compile(myFunction, new Map(), []);
    console.log("Fluent Interface result:", compiled(5n));
    // 42n (sum [2,4,6] = 12, result = (5+10)*2 = 30, addResult(12) = 12+30 = 42)
}

// =============================================================================
// Serialization Example
// =============================================================================

{
    const myFunction = East.function([IntegerType], IntegerType, ($, x) => {
        $.return(x.add(1n));
    });

    // the type of the function (IntegerType -> IntegerType)
    const funcType = Expr.type(myFunction);

    // Compile the function (this attaches the IR)
    const compiled = East.compile(myFunction, new Map(), []);

    // Serialize the compiled function to Beast2 (binary format)
    const encode = encodeBeast2For(funcType);
    const bytes = encode(compiled);
    console.log(`Serialized function to ${bytes.length} bytes`);

    // Deserialize and recompile
    const decode = decodeBeast2For(funcType);
    const restored = decode(bytes);

    console.log("Serialization round-trip result:", restored(41n));
    // 42n
}

console.log("\nAll README examples ran successfully!");
