// Stub for the `astro:content` virtual module so the emitter can import
// src/content.config.ts under a standalone tsx process (no Astro runtime).
//
// Only the surface the config file uses is implemented:
//   - defineCollection: passthrough, returns the config object verbatim.
//   - reference: returns a marker schema the emitter detects as a relation.
import { z } from "zod";

export function defineCollection<T>(config: T): T {
  return config;
}

export function reference(collection: string) {
  // Real astro `reference()` returns a Zod schema; the emitter only needs to
  // recognise it and read the target collection name off the metadata.
  return z.string().meta({ __astroReference: collection });
}
