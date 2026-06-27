// ESM resolve hook: redirect Astro's virtual modules to local stubs so
// src/content.config.ts imports cleanly in a standalone tsx process.
// Used via `tsx --import ./scripts/astro-virtual-loader.mjs ...`.
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

const STUBS = {
  "astro:content": pathToFileURL(path.join(here, "__stubs__/astro-content.ts")).href,
  "astro/loaders": pathToFileURL(path.join(here, "__stubs__/astro-loaders.ts")).href,
};

export async function resolve(specifier, context, nextResolve) {
  const stub = STUBS[specifier];
  if (stub) return { url: stub, shortCircuit: true };
  return nextResolve(specifier, context);
}
