/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import type { LocationValue } from "./ir.js";

export class EastError extends Error {
  public location: LocationValue[];
  public eastMessage: string;

  constructor(message: string, options: { cause?: any, location: LocationValue }) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.eastMessage = message;
    this.location = [options.location];
  }

  override toString(): string {
    const loc = this.location[0]!;
    const header = `${loc.filename}:${loc.line}:${loc.column}: ${this.eastMessage}`;

    if (this.location.length <= 1) {
      return header;
    }

    // Build stack trace (skip first since it's in the header)
    const lines = [header, "Stack trace:"];
    for (let i = this.location.length - 1; i >= 1; i--) {
      const frame = this.location[i]!;
      lines.push(`  at ${frame.filename}:${frame.line}:${frame.column}`);
    }

    return lines.join("\n");
  }

  /** Format for use with Error.message */
  get formattedMessage(): string {
    return this.toString();
  }
}
