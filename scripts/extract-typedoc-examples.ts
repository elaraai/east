/**
 * Extract and display all TypeDoc @example blocks for validation
 *
 * This script:
 * 1. Extracts all @example blocks from TypeDoc comments in source files
 * 2. Prints them in a format suitable for validation with east-mcp compile tool
 *
 * The output can be used as a todo list for an agent to validate each example.
 *
 * Usage:
 *   npm run extract-examples
 *   OR
 *   make extract-examples
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Example {
    file: string;
    location: string;
    code: string;
    lineNumber: number;
}

/**
 * Extract all @example blocks from a TypeScript source file
 */
function extractExamples(filePath: string): Example[] {
    const content = readFileSync(filePath, 'utf-8');
    const examples: Example[] = [];

    // Match @example blocks in TypeDoc comments
    // Pattern: @example followed by ```ts ... ``` block
    const exampleRegex = /@example\s*\n\s*\*\s*```ts\n([\s\S]*?)\n\s*\*\s*```/g;
    let match;

    while ((match = exampleRegex.exec(content)) !== null) {
        // Find line number of the @example tag
        const beforeExample = content.substring(0, match.index);
        const lineNumber = beforeExample.split('\n').length;

        // Extract and clean the example code
        const exampleCode = match[1]
            // Remove leading "* " from each line (TypeDoc comment formatting)
            ?.split('\n')
            ?.map(line => line.replace(/^\s*\*\s?/, ''))
            ?.join('\n')
            ?.trim();

        examples.push({
            file: filePath,
            location: `line ${lineNumber}`,
            code: exampleCode ?? '',
            lineNumber,
        });
    }

    return examples;
}

/**
 * Recursively find all .ts files in a directory
 */
function findTypeScriptFiles(dir: string, ignore: string[] = ['node_modules', 'dist', 'build', 'scripts']): string[] {
    const files: string[] = [];

    for (const item of readdirSync(dir)) {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
            if (!ignore.includes(item)) {
                files.push(...findTypeScriptFiles(fullPath, ignore));
            }
        } else if (item.endsWith('.ts') && !item.endsWith('.spec.ts') && !item.endsWith('.test.ts')) {
            files.push(fullPath);
        }
    }

    return files;
}

/**
 * Main function
 */
function main() {
    const projectRoot = join(__dirname, '..');
    const srcDir = join(projectRoot, 'src');

    console.log('# TypeDoc Example Extraction Report\n');
    console.log('This report lists all @example blocks found in TypeDoc comments.\n');
    console.log('Each example should be validated to ensure it compiles correctly.\n');
    console.log('═'.repeat(80));
    console.log();

    // Find all TypeScript source files
    const sourceFiles = findTypeScriptFiles(srcDir);

    // Extract all examples
    const allExamples: Example[] = [];
    for (const file of sourceFiles) {
        const examples = extractExamples(file);
        allExamples.push(...examples);
    }

    console.log(`**Total examples found: ${allExamples.length}**\n`);

    if (allExamples.length === 0) {
        console.log('No examples found in TypeDoc comments.');
        return;
    }

    // Print each example
    allExamples.forEach((example, index) => {
        const relPath = relative(projectRoot, example.file);

        console.log(`## Example ${index + 1}`);
        console.log(`**File:** \`${relPath}\``);
        console.log(`**Location:** ${example.location}`);
        console.log();
        console.log('```typescript');
        console.log(example.code);
        console.log('```');
        console.log();
        console.log('─'.repeat(80));
        console.log();
    });

    console.log(`\n**Summary:** Found ${allExamples.length} examples to validate.`);
}

main();
