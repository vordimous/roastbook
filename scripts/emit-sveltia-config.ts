// Emit a Sveltia CMS config from the Zod schema in src/content.config.ts.
//
// Zod is the single source of truth. This walks the Zod 4 schema tree
// (`schema._zod.def`) and maps each field to a Sveltia widget per the table in
// sveltia-emitter-plan.md. Outputs public/admin/config.yml (human-readable
// artifact for PR diffs) and public/admin/config.js (the module Sveltia loads).
//
// Run: tsx --import ./scripts/astro-virtual-loader.mjs scripts/emit-sveltia-config.ts
// (the loader redirects astro:content / astro/loaders to local stubs).
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { stringify as yamlStringify } from "yaml";
import { z } from "zod";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SveltiaField = {
  name: string;
  label?: string;
  widget: string;
  required?: boolean;
  hint?: string;
  default?: unknown;
  [key: string]: unknown;
};

type AnySchema = { _zod?: { def: any }; meta?: () => Record<string, any> | undefined };

// ---------------------------------------------------------------------------
// Schema walking
// ---------------------------------------------------------------------------

// Strip the optional/nullable/default wrapper chain, returning the inner "core"
// type plus the required-ness signals collected along the way.
function unwrap(schema: AnySchema) {
  let core: any = schema;
  let optional = false;
  let nullable = false;
  let hasDefault = false;
  let defaultValue: unknown;

  while (core?._zod?.def) {
    const t = core._zod.def.type;
    if (t === "optional") {
      optional = true;
      core = core._zod.def.innerType;
    } else if (t === "nullable") {
      nullable = true;
      core = core._zod.def.innerType;
    } else if (t === "default" || t === "prefault") {
      hasDefault = true;
      const dv = core._zod.def.defaultValue;
      defaultValue = typeof dv === "function" ? dv() : dv;
      core = core._zod.def.innerType;
    } else {
      break;
    }
  }

  return { core, optional, nullable, hasDefault, defaultValue };
}

// .meta() does not propagate across .nullish()/.default()/.array() (each returns
// a fresh instance), so walk the wrapper chain collecting meta at every level.
// Innermost wins for `description`; sveltia hints deep-merge with inner winning.
function readMeta(schema: AnySchema) {
  let description: string | undefined;
  let sveltia: Record<string, unknown> = {};

  let s: any = schema;
  while (s?._zod?.def) {
    const meta = s.meta?.();
    if (meta) {
      if (meta.description) description = meta.description;
      if (meta.sveltia) sveltia = { ...sveltia, ...meta.sveltia };
    }
    const t = s._zod.def.type;
    if (t === "optional" || t === "nullable" || t === "default" || t === "prefault") {
      s = s._zod.def.innerType;
    } else {
      break;
    }
  }

  return { description, sveltia };
}

// Astro's image() is mocked by the emitter as an object carrying a __astroImage
// meta flag; fall back to structural detection on the object shape.
function isAstroImage(core: any): boolean {
  if (core?._zod?.def?.type !== "object") return false;
  if (core.meta?.()?.__astroImage) return true;
  const shape = core._zod.def.shape ?? {};
  return ["src", "width", "height", "format"].every((k) => k in shape);
}

// Astro's reference() is stubbed to carry the target collection in meta.
function astroReferenceCollection(schema: AnySchema): string | undefined {
  let s: any = schema;
  while (s?._zod?.def) {
    const col = s.meta?.()?.__astroReference;
    if (typeof col === "string") return col;
    const t = s._zod.def.type;
    if (t === "optional" || t === "nullable" || t === "default" || t === "prefault") {
      s = s._zod.def.innerType;
    } else {
      break;
    }
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Widget mapping (the canonical table in the plan)
// ---------------------------------------------------------------------------

function stringWidget(core: any): Partial<SveltiaField> {
  const def = core._zod.def;
  if (def.format === "url") {
    return { widget: "string", pattern: ["^https?://.+", "must be a URL"] };
  }
  for (const c of def.checks ?? []) {
    const d = c?._zod?.def;
    if (d?.check === "string_format" && d.format === "regex" && d.pattern) {
      const msg = typeof d.error === "function" ? d.error() : (d.error ?? "");
      return { widget: "string", pattern: [d.pattern.source, msg] };
    }
  }
  return { widget: "string" };
}

function numberWidget(core: any): Partial<SveltiaField> {
  const field: Partial<SveltiaField> = { widget: "number", value_type: "float" };
  for (const c of core._zod.def.checks ?? []) {
    const d = c?._zod?.def;
    if (!d) continue;
    if (d.check === "number_format" && (d.format === "safeint" || d.format === "int32" || d.format === "int64")) {
      field.value_type = "int";
    } else if (d.check === "greater_than") {
      field.min = d.value;
    } else if (d.check === "less_than") {
      field.max = d.value;
    }
  }
  return field;
}

// Map a core (unwrapped) Zod type to its Sveltia widget shape.
function widgetForCore(name: string, core: any): Partial<SveltiaField> {
  const type = core?._zod?.def?.type;
  switch (type) {
    case "string":
      return stringWidget(core);
    case "date":
      return { widget: "datetime" };
    case "boolean":
      return { widget: "boolean" };
    case "number":
      return numberWidget(core);
    case "enum":
      return { widget: "select", options: Object.values(core._zod.def.entries) };
    case "array": {
      const innerCore = unwrap(core._zod.def.element).core;
      if (innerCore?._zod?.def?.type === "object") {
        return { widget: "list", fields: fieldsFromObject(name, innerCore) };
      }
      return { widget: "list" };
    }
    case "object":
      if (isAstroImage(core)) return { widget: "image" };
      return { widget: "object", fields: fieldsFromObject(name, core) };
    default:
      console.warn(`[emit] unmapped Zod type "${type}" for "${name}" — defaulting to string`);
      return { widget: "string" };
  }
}

function fieldsFromObject(prefix: string, objCore: any): SveltiaField[] {
  const shape = objCore._zod.def.shape ?? {};
  return Object.entries(shape).map(([key, schema]) =>
    fieldFromZod(`${prefix}.${key}`, key, schema as AnySchema),
  );
}

// Build one Sveltia field object from a Zod schema. `path` is the dotted name
// used for the override table; `name` is the leaf key written into the config.
function fieldFromZod(pathKey: string, name: string, schema: AnySchema): SveltiaField {
  const { core, optional, nullable, hasDefault, defaultValue } = unwrap(schema);
  const { description, sveltia } = readMeta(schema);

  let field: SveltiaField;

  const refCollection = astroReferenceCollection(schema);
  if (refCollection) {
    field = {
      name,
      widget: "relation",
      collection: refCollection,
      value_field: "{{slug}}",
      search_fields: ["title"],
    };
  } else {
    field = { name, ...widgetForCore(pathKey, core) } as SveltiaField;
  }

  field.label = labelize(name);

  if (description) field.hint = description;
  if (optional || nullable || hasDefault) field.required = false;
  if (hasDefault && defaultValue !== undefined) field.default = defaultValue;

  // sveltia meta hints win over inferred widget props.
  Object.assign(field, sveltia);

  // name-based overrides win last.
  if (OVERRIDES[pathKey]) Object.assign(field, OVERRIDES[pathKey]);

  // Sveltia enforces `pattern` even on optional fields left blank, so an empty
  // optional field would wrongly fail validation (Zod treats it as absent).
  // Allow the empty string for non-required patterned fields.
  if (field.required === false && Array.isArray(field.pattern)) {
    const [source, message] = field.pattern as [string, string];
    if (!source.startsWith("^$|")) {
      field.pattern = [`^$|${source}`, message];
    }
  }

  return orderKeys(field);
}

// ---------------------------------------------------------------------------
// Field-level overrides (name-based, applied last)
// ---------------------------------------------------------------------------

// Escape hatch for UI hints that can't be expressed on the schema. Prefer
// .meta({ sveltia: {...} }) / .describe() in src/content.config.ts; this table
// is for cases where the schema is shared or the hint can't live on the type.
const OVERRIDES: Record<string, Partial<SveltiaField>> = {};

// ---------------------------------------------------------------------------
// Collection assembly
// ---------------------------------------------------------------------------

const mockImage = () =>
  z
    .object({
      src: z.string(),
      width: z.number(),
      height: z.number(),
      format: z.string(),
    })
    .meta({ __astroImage: true });

function resolveFolder(collection: any, name: string): string {
  const base: string | undefined = collection?.loader?.base;
  if (base) return base.replace(/^\.\//, "").replace(/\/+$/, "");
  return `src/content/${name}`;
}

function collectionFromAstro(name: string, collection: any) {
  const schemaFn = collection.schema;
  let zobj: any = typeof schemaFn === "function" ? schemaFn({ image: mockImage }) : schemaFn;
  // The schema may be wrapped in a preprocess (e.g. empty-string coercion),
  // which Zod represents as a pipe — unwrap to the inner object.
  if (zobj?._zod?.def?.type === "pipe") zobj = zobj._zod.def.out;
  const shape = zobj._zod.def.shape ?? {};

  const fields: SveltiaField[] = Object.entries(shape).map(([key, schema]) =>
    fieldFromZod(`${name}.${key}`, key, schema as AnySchema),
  );
  // NOTE: no synthetic `body` field — roasts keep all content in typed
  // frontmatter fields, and an empty markdown body widget is just noise in the
  // editor. The detail page still renders a markdown body if one ever exists.

  // NOTE: co-locating CMS uploads next to the entry (so Astro's image() resolves
  // them) needs a per-collection media_folder, but the exact value Sveltia
  // accepts must be verified in the browser. Left off for now — the Astro build
  // pipeline already optimizes co-located images regardless of this setting.
  return {
    name,
    label: labelize(name),
    folder: resolveFolder(collection, name),
    create: true,
    extension: "md",
    format: "frontmatter",
    fields,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function labelize(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Stable key order for deterministic YAML snapshots.
const KEY_ORDER = [
  "name",
  "label",
  "widget",
  "collection",
  "value_field",
  "search_fields",
  "options",
  "value_type",
  "min",
  "max",
  "pattern",
  "fields",
  "required",
  "default",
  "hint",
];

function orderKeys(field: SveltiaField): SveltiaField {
  const out: Record<string, unknown> = {};
  for (const k of KEY_ORDER) if (k in field) out[k] = field[k];
  for (const k of Object.keys(field)) if (!(k in out)) out[k] = field[k];
  return out as SveltiaField;
}

// ---------------------------------------------------------------------------
// Top-level config scaffold (backend is a Phase 2 decision — placeholder here)
// ---------------------------------------------------------------------------

export function buildConfig(collections: Record<string, any>) {
  return {
    // Git backend. Editing works three ways against this block (see DEPLOY.md):
    //   Tier 0 (local): Chromium "Work with Local Repository" reads the working
    //     tree directly — repo/branch are ignored.
    //   Tier 1a (hosted, PAT): the /admin "Sign In with Token" option needs only
    //     name + repo + branch — no OAuth app, no Worker, no secret in the repo.
    //     The editor pastes a GitHub personal access token, stored in their browser.
    //   Tier 1b (hosted, OAuth): add `base_url: "https://<oauth-worker>"` for the
    //     one-click "Sign in with GitHub" button (Cloudflare Worker relay).
    // Forks: change `repo`/`branch` to your own and re-run `pnpm sveltia:emit`.
    backend: { name: "github", repo: "vordimous/roastbook", branch: "master" },
    // Global fallback for the asset library; collections with image fields
    // override this with co-located media (see collectionFromAstro).
    media_folder: "public/media",
    public_folder: "/media",
    collections: Object.entries(collections).map(([name, c]) => collectionFromAstro(name, c)),
  };
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

export function configToYaml(config: unknown): string {
  return (
    "# AUTO-GENERATED by scripts/emit-sveltia-config.ts. Do not edit.\n" +
    "# Source of truth: src/content.config.ts\n" +
    yamlStringify(config)
  );
}

// Build the config straight from the Astro collections (no file writes).
export async function buildConfigFromContentConfig() {
  const { collections } = await import("../src/content.config.ts");
  return buildConfig(collections);
}

export async function main() {
  // Sveltia's documented mount auto-loads config.yml (the docs warn against the
  // type="module" + manual init path), so config.yml is the consumed config.
  const config = await buildConfigFromContentConfig();
  writeFileSync(path.join(ROOT, "public/admin/config.yml"), configToYaml(config));
  return config;
}

// Run when invoked directly (not when imported by the test).
const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  main().then((config) => {
    const count = config.collections.reduce((n, c) => n + c.fields.length, 0);
    console.log(
      `[emit] wrote public/admin/config.yml — ${config.collections.length} collection(s), ${count} fields`,
    );
  });
}
