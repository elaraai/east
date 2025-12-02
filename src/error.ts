/**
 * Copyright (c) 2025 Elara AI Pty Ltd
 * Dual-licensed under AGPL-3.0 and commercial license. See LICENSE for details.
 */
import type { LocationValue } from "./ir.js";

export class EastError extends Error {
  public location: LocationValue[];

  constructor(message: string, options: { cause?: any, location: LocationValue }) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.location = [options.location];
  }
}
