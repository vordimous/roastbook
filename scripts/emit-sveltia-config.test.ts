// Snapshot test for the Sveltia emitter. Guards against silent drift when
// Astro or Zod change the internal schema shapes the emitter relies on
// (the image() heuristic and Zod 4 `_zod.def` walking are the main risks).
//
// Run: tsx --import ./scripts/register-astro-stubs.mjs --test scripts/emit-sveltia-config.test.ts
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { test } from "node:test";
import { buildConfigFromContentConfig, configToYaml } from "./emit-sveltia-config.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.join(HERE, "__fixtures__/expected-config.yml");

test("emitted config matches the committed snapshot", async () => {
  const config = await buildConfigFromContentConfig();
  const actual = configToYaml(config);
  const expected = readFileSync(FIXTURE, "utf8");
  assert.equal(
    actual,
    expected,
    "Emitter output drifted from scripts/__fixtures__/expected-config.yml.\n" +
      "If the Zod schema changed intentionally, run `pnpm sveltia:emit` and copy\n" +
      "public/admin/config.yml over the fixture.",
  );
});

test("every field maps to a known Sveltia widget", async () => {
  const config = await buildConfigFromContentConfig();
  const KNOWN = new Set([
    "string",
    "text",
    "number",
    "boolean",
    "datetime",
    "select",
    "list",
    "object",
    "image",
    "relation",
    "markdown",
  ]);
  for (const collection of config.collections) {
    for (const field of collection.fields) {
      assert.ok(
        KNOWN.has(field.widget),
        `field ${collection.name}.${field.name} has unknown widget "${field.widget}"`,
      );
    }
  }
});
