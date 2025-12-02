/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 *
 * @remarks
 */
export type Location = {
  /** The source file path */
  filename: string,
  /** The 1-based line number */
  line: number,
  /** The 1-based column number */
  column: number,
}

/**
 * Formats a location as a human-readable string.
 *
 * @param location - The source location to format
 * @returns A string in the format `"<filename> <line>:<column>"`
 *
 * @example
 * ```ts
 * const loc = { filename: "main.ts", line: 42, column: 15 };
 * printLocation(loc); // "main.ts 42:15"
 * ```
 */
export function printLocation(location: Location): string {
  return `${location.filename} ${location.line}:${location.column}`;
}

/**
 * Captures the source location of the calling code using stack trace inspection.
 *
 * @param skip - Number of stack frames to skip (default = 1 returns the caller's location)
 * @returns A {@link Location} object representing the source position
 *
 * @remarks
 * This function uses JavaScript's Error stack traces to determine the caller's
 * source location. Returns `{ filename: "<unknown>", line: 0, column: 0 }` if
 * the stack trace cannot be parsed.
 *
 * @example
 * ```ts
 * function myFunction() {
 *   const loc = get_location(); // Gets location of this call
 *   console.log(printLocation(loc));
 * }
 * ```
 */
export function get_location(skip: number = 1): Location {
  // Create an Error object to capture the stack trace
  const err = new Error();
  
  // Parse the stack trace
  const stack = err.stack;
  if (!stack) {
    return { filename: "<unknown>", line: 0, column: 0 };
  }
  
  // Split into lines and remove the 'Error' line and this function's line
  const lines = stack.split('\n').slice(skip + 1);
  
  // Find the first meaningful stack frame
  for (const line of lines) {
    // First match the whole path with line and column
    const match = line.match(/at\s[<>a-zA-Z0-9_$]*\s+(?:(?:\w+\.)*\w+\s+)?\(?(.*?):(\d+):(\d+)\)?$/);
    if (match) {
      const [, fullPath, line, column] = match;
      
      // Skip if it's an anonymous internal file
      if (fullPath == undefined || fullPath === '') {
        continue;
      }
      
      // TODO should we extract a subset of the fullPath?
      
      // Return filename with line and column
      return { filename: fullPath, line: Number(line), column: Number(column) };
    }
  }
  
  return { filename: "<unknown>", line: 0, column: 0 };
}
