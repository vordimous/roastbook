# Sveltia emitter + Astro site buildout plan

Cold-start plan for the next session. Start by reading this top-to-bottom; everything you need is here.

## Goal

Promote this spike into a real Astro site where **Zod is the single source of truth** and the Sveltia CMS browser editor is auto-configured from it. This unblocks the "non-tech browser" row in [schema-ux-evaluation.md](schema-ux-evaluation.md) that currently reads *"Not addressed — Zod-only constraint rules out all browser CMSes for now."*

Two deliverables, in order:

1. **The emitter** — a script that walks `src/content.config.ts` and writes `public/admin/config.yml` for Sveltia.
2. **The Sveltia install** — a mount page at `/admin` and the runtime that consumes the emitted config.

Optional follow-ups: layouts cleanup, image pipeline, CI hook, evaluation matrix row.

## Why this approach (decisions already made)

| Decision | Rationale |
|---|---|
| **Zod stays the gate** | `astro check` failing on bad frontmatter is load-bearing. Sveltia's UI validation is a *secondary* layer that mirrors Zod's rules but never replaces them. If the two diverge, Zod wins at build time. |
| **Custom emitter, not a third-party converter** | No off-the-shelf `zod → sveltia` package exists. `zod-to-json-schema` / `z.toJSONSchema()` produces JSON Schema Draft 2020-12 which Sveltia cannot ingest — Sveltia's config grammar is widget-based, not JSON Schema. Sveltia's own `sveltia-cms.json` describes its `config.yml` shape, not your content. |
| **Walk Zod schemas directly** | Zod 4 exposes `._zod.def` with `type` strings and a discriminated wrapper chain (`optional` / `nullable` / `default` / `nullish`). Walking is straightforward and the emitter is ~150 lines. |
| **Sveltia widget hints live in `.meta()`** | Zod 4's `.meta()` is the canonical place to attach side-channel info. It does *not* propagate through `.nullish()` / `.default()` / `.array()` (see "Metadata gotcha" below), so the convention is to put `.meta({ sveltia: {...} })` on the **innermost type** for hints that describe the value, and use the emitter's name-based override table for field-level UI choices. |
| **Custom JS config passed to `CMS.init({ config })`** | Skip the YAML serialization step entirely. Sveltia accepts a JS object that overrides `config.yml`. This keeps everything typed in TS through to runtime — no YAML stringify/parse round-trip. (We can still emit a `config.yml` artifact for inspection, but it's not the consumed config.) |
| **No registerWidget / custom widgets** | Sveltia's `registerWidget` is a no-op stub in 2026 (warns "Custom field types (widgets) are not yet supported"). We use only the 20 built-in widgets. |

## Current state of this repo

- `src/content.config.ts` — 25-field `roasts` collection. Zod 4. Uses `image()`, `z.enum()`, `z.coerce.date()`, `z.string().regex(...)`, `z.number().min().max()`, `z.array(z.string())`. **Don't rewrite — emit from it.**
- `src/pages/index.astro`, `src/pages/roasts/[...slug].astro` — working list + detail pages. Frontmatter renders inline. Good enough as a baseline; don't refactor until the emitter ships.
- `src/content/roasts/*.md` — fixture roasts. `012-guatemala.md` is the canonical test file (contains the worst-case multi-line `playbook`).
- `astro.config.mjs` — watches ignore `.obsidian`, `_bases`, `_GUIDE.md`. No integrations installed yet.
- `package.json` — `astro ^7.0.2`, `zod 4`. **Node ≥22.12** (see `.nvmrc`).
- `schema-ux-evaluation.md` — the matrix this work plugs a new row into.

What's missing: `public/admin/`, Sveltia integration, the emitter, any tests, any CI.

## Phase 1 — the emitter

### 1.1 Add deps

```bash
pnpm add -D yaml tsx
```

`yaml` for the optional `config.yml` artifact. `tsx` to run the emitter without a build step.

### 1.2 Create `scripts/emit-sveltia-config.ts`

Module structure:

```
scripts/emit-sveltia-config.ts
├── unwrap(schema)         → { core, optional, nullable, defaultValue }
├── readMeta(schema)       → walks the chain inward, collecting .meta() / .describe()
├── isAstroImage(core)     → structural detection (object shape with src/width/height/format)
├── isAstroReference(core) → reads collection name off the def
├── fieldFromZod(name, schema) → returns one Sveltia field object
├── collectionFromAstro(name, c) → resolves schema function (passes mock `image`), maps fields
└── main()                 → imports `collections` from src/content.config.ts, emits config.yml + config.js
```

### 1.3 Field-type mapping (canonical table)

Implement these in `fieldFromZod`. For your current schema, all 25 fields fall into rows 1–11.

| Zod construct | Detection | Sveltia output |
|---|---|---|
| `z.string()` | `def.type === 'string'` | `{ widget: 'string' }` |
| `z.string().regex(rx, msg)` | `string` with `regex` check | `{ widget: 'string', pattern: [rx.source, msg] }` |
| `z.url()` / `z.string().url()` | `string` with `format: 'url'` or `url` check | `{ widget: 'string', pattern: ['^https?://.+', 'must be a URL'] }` |
| `z.coerce.date()` / `z.date()` | `def.type === 'date'` | `{ widget: 'datetime' }` |
| `z.boolean()` | `def.type === 'boolean'` | `{ widget: 'boolean' }` |
| `z.number()` | `def.type === 'number'` | `{ widget: 'number', value_type: 'float' }` |
| `z.number().int()` | `number` with `int` check | `value_type: 'int'` |
| `.min(n)` / `.max(n)` / `.positive()` / `.nonnegative()` | number checks | `min: n` / `max: n` (`.positive()` → `min: 0` — see "Limits" below) |
| `z.enum([...])` | `def.type === 'enum'` | `{ widget: 'select', options: [...] }` |
| `z.array(T)` where T is scalar | `def.type === 'array'`, inner is scalar | `{ widget: 'list' }` (simple list) |
| `z.array(z.object({...}))` | `array` of `object` | `{ widget: 'list', fields: [...] }` |
| `z.object({...})` | `def.type === 'object'` | `{ widget: 'object', fields: [...] }` |
| `image()` from `astro:content` | structural — see 1.4 | `{ widget: 'image' }` |
| `reference('foo')` | def has `collection` property | `{ widget: 'relation', collection: 'foo', value_field: '{{slug}}', search_fields: ['title'] }` |
| `z.discriminatedUnion(key, [...])` | `def.type === 'union'` with discriminator | **Defer** — emit `widget: object` with TODO comment. Implement when first needed. |

### 1.4 The Astro `image()` detection gotcha

`image()` is only available inside the `schema: ({image}) => z.object({...})` function form. To walk the schema, the emitter must *call* the function with a mock `image`. Two strategies:

**A. Mock image with a sentinel.** Pass `({ image: () => z.object({ src: z.string(), width: z.number(), height: z.number(), format: z.string() }).meta({ __astroImage: true }) })`. Detect by reading the meta flag. Reliable.

**B. Import the real helper from astro:content/runtime.** Works inside Astro's runtime but the emitter runs as a standalone `tsx` script — runtime isn't available without bootstrapping Astro. Don't go down this path.

Use strategy A.

### 1.5 The Zod 4 metadata gotcha

From [zod.dev/metadata](https://zod.dev/metadata): `.meta()` is keyed by schema instance, and `.nullish()` / `.default()` / `.array()` return *new* instances that lose the metadata.

So this loses the hint:

```ts
mmss.describe("Elapsed time…").nullish()   // .nullish() returns a new instance; describe is on inner
```

Solution: `readMeta()` walks *into* the chain and collects meta/description from every level, innermost-wins for `description`, deep-merge for `sveltia`. The current schema's pattern works fine with this approach.

For *field-level* hints (label, override widget), prefer attaching `.meta()` to the innermost type, OR add an explicit override table at the bottom of the emitter:

```ts
const overrides: Record<string, Partial<SveltiaField>> = {
  'roasts.why_dropped': { widget: 'text' },     // single → multi-line
  'roasts.profile':     { hint: 'Behmor profile letter (P1, P2, etc.)' },
};
```

Apply overrides last so they win.

### 1.6 Required-ness rules

Sveltia's `required` defaults to `true`. Zod's default is also required. So:

- `z.string()` → `required: true` (don't emit the key; it's the default)
- `z.string().nullish()` / `.optional()` / `.nullable()` → `required: false`
- `z.string().default("x")` → `required: false` (default makes it effectively optional from the UI's perspective, even though Zod sees a value)

Implement: walk wrappers, set `required: false` if any of `optional | nullable | default | nullish` are seen.

### 1.7 Acceptance test for the emitter

Add `scripts/emit-sveltia-config.test.ts` — a snapshot-style test that:

1. Imports `collections` from `src/content.config.ts`.
2. Runs the emitter.
3. Compares the output against `scripts/__fixtures__/expected-config.yml`.

This catches regressions when Astro or Zod changes internal shapes (the `image()` heuristic is the main risk).

Wire it into `pnpm check`:

```json
// package.json
"scripts": {
  "check": "astro check && pnpm sveltia:emit && git diff --exit-code public/admin/config.yml",
  "sveltia:emit": "tsx scripts/emit-sveltia-config.ts"
}
```

The `git diff --exit-code` makes drift fatal in CI — if someone edits the Zod schema without regenerating, CI catches it.

## Phase 2 — Sveltia install

### 2.1 Decide the backend

Sveltia supports GitHub / GitLab / Gitea/Forgejo (Git-based) and a local proxy mode for dev. The roastbook-spike isn't on a remote yet. Two options:

- **Local mode for spike testing:** Sveltia's `local` backend reads/writes the working tree via a small dev proxy. Good for the matrix-row evaluation. Activate with `backend: { name: 'git-gateway' }` + a local proxy command, OR `backend: { name: 'github', repo: 'local' }` style fallback per Sveltia docs.
- **GitHub backend for real:** requires this repo on GitHub with an OAuth app. Defer until cutover from spike.

For the evaluation row, start with local mode.

### 2.2 Add the admin page

Create `public/admin/index.html` (Sveltia's expected mount path — it's a public static file because the SPA mounts itself, not an Astro route):

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Roastbook · Admin</title>
  <meta name="robots" content="noindex" />
</head>
<body>
  <script type="module">
    import { init } from 'https://unpkg.com/@sveltia/cms@latest/dist/sveltia-cms.js';
    import config from './config.js';
    init({ config });
  </script>
</body>
</html>
```

### 2.3 Make the emitter produce `public/admin/config.js`

In addition to (or instead of) `config.yml`, emit a JS module:

```js
// public/admin/config.js — AUTO-GENERATED. Do not edit. Source: src/content.config.ts.
export default {
  backend: { name: 'github', repo: 'YOUR/repo', branch: 'main' },
  media_folder: 'src/content/roasts',
  public_folder: '/',
  collections: [ /* ... */ ],
};
```

The JS form is what `index.html` imports. The YAML form stays as a human-readable artifact for diffing in PRs.

### 2.4 Verify Sveltia loads

```bash
pnpm dev
# open http://localhost:4321/admin/
```

Confirm:
- Login screen (or local-mode bypass)
- `roasts` collection appears in the sidebar
- Clicking an existing entry shows all 25 fields
- The `target_level` field is a dropdown with the 5 enum values
- `roasted_photo` is an image picker with drag-drop
- `time_to_fc` shows the regex hint on invalid input

## Phase 3 — wire into the evaluation matrix

Add **Actor 5: Sveltia CMS** to [schema-ux-evaluation.md](schema-ux-evaluation.md):

- **Reach:** `pnpm dev`, browse to `http://localhost:4321/admin/`. Open `012-guatemala`.
- **Matrix:** Run T1–T8 same as the others.
- **Particular interest:** does the Sveltia editor refuse to save on T2/T4/T5 (schema violations), or does it silently write bad frontmatter that `astro check` then catches at build time? This is the key data point — if Sveltia catches violations at *save* time, it earns a higher friction score than astro-editor for browser-only editors.

## Phase 4 — optional (only if Phase 1–3 went well)

- **Layouts cleanup:** extract `src/layouts/Base.astro` from the duplicated `<html>` chrome in `index.astro` and `roasts/[...slug].astro`.
- **Image pipeline:** confirm `image()` round-trips correctly when a Sveltia editor uploads a new photo. The path Sveltia writes needs to match what Astro's image optimizer expects.
- **CI hook:** GitHub Action that runs `pnpm check` (which now includes the emitter drift check).
- **Deploy:** decide if the spike gets deployed standalone (Cloudflare Pages / Netlify) or if work moves to the live `wellageddev` repo for prod.

## Limits and known gotchas

| Limit | Impact | Mitigation |
|---|---|---|
| `z.number().positive()` is exclusive (`> 0`); Sveltia `min` is inclusive | Sveltia UI allows `0` for `green_weight_g` etc. | `astro check` catches it at build. Acceptable. |
| Reused Zod subtypes (`mmss`, `roastLevel`) emit twice | Slight YAML duplication | Fine. Sveltia has no "named type" concept anyway. |
| `image()` detection is structural | Astro 6 could change the shape | Snapshot test in 1.7 catches breakage |
| `z.discriminatedUnion` not implemented | Future schema additions blocked until handled | Defer; current schema doesn't use it |
| Sveltia config drift if emitter not run | Editor sees stale schema | `pnpm check` runs emitter + `git diff --exit-code` |

## Progress log

- **Phase 1 — DONE.** Emitter at `scripts/emit-sveltia-config.ts`, snapshot test + fixture, `pnpm check` wires emit + test + drift guard. All 25 fields map per the table; `image()` survives `.nullish()` and the `mm:ss` regex keeps both `pattern` and `.describe()` hint.
- **Phase 2 — DONE (infra).** Mount at `/admin/`, `config.yml` served and auto-loaded by Sveltia. Interactive checks in §2.4 still need a human in Chromium.
- **Deviations from the original plan (all verified):**
  1. *Mount is an Astro route* (`src/pages/admin/index.astro`), not a static `public/admin/index.html`. Astro's dev/preview servers don't serve directory indexes, so a static file 404s at `/admin/`. The route serves `/admin/` uniformly in dev, preview, and prod.
  2. *No `config.js` / `init({config})`.* Sveltia's docs warn against `type="module"` + manual init and steer to plain `<script src>` + auto-loaded `config.yml`. The emitter now writes only `config.yml`.
  3. *Importing `src/content.config.ts` under tsx* needs an ESM resolve hook (`scripts/register-astro-stubs.mjs` → `scripts/astro-virtual-loader.mjs` → `scripts/__stubs__/`) to redirect the `astro:content` / `astro/loaders` virtual modules. `--import` alone doesn't register hooks; a `module.register` preload does.
  4. Added `@types/node` (dev) — `astro check` type-checks `scripts/`.

## Open questions for the user (resolve before/during Phase 2)

1. **Sveltia backend choice for the spike:** _Resolved — local mode._ Chromium "Work with Local Repository" (File System Access API, no proxy). The `backend: github / OWNER/REPO` block is a placeholder; local mode reads the working tree directly and doesn't need the repo to exist.
2. **Repo destination:** _Resolved — new dedicated repo._ The roastbook gets its own repo; `wellageddev` drops roasts entirely once this works. Swap `backend.repo` to the real repo at cutover.
3. **Multi-line fields:** `why_dropped` reads as a single short string today but might want multi-line. Add `.meta({ sveltia: { widget: 'text' } })` or leave as `string`? (No-op until you decide.)
4. **`profile` as enum?** If Behmor profiles are a fixed set (P1–P5), make it `z.enum(...)` and Sveltia gets a dropdown for free. Otherwise leave as `string`.

## File map (what the next session will create)

```
roastbook-spike/
├── scripts/
│   ├── emit-sveltia-config.ts          ← new (Phase 1.2)
│   ├── emit-sveltia-config.test.ts     ← new (Phase 1.7)
│   └── __fixtures__/
│       └── expected-config.yml         ← new (snapshot baseline)
├── public/
│   └── admin/
│       ├── index.html                  ← new (Phase 2.2)
│       └── config.js                   ← AUTO-GENERATED (Phase 2.3)
│       └── config.yml                  ← AUTO-GENERATED (Phase 1)
├── package.json                        ← edit: add scripts (Phase 1.7)
└── schema-ux-evaluation.md             ← edit: add Actor 5 row (Phase 3)
```

Nothing in `src/` should change in Phase 1–3. The Zod schema is the input, not a thing to refactor.

## Starting prompt for the next session

> Read `sveltia-emitter-plan.md`. Implement Phase 1 (the emitter) end-to-end, then stop and ask before Phase 2. Use `src/content.config.ts` as the input. Confirm with `pnpm check` and inspect `public/admin/config.yml` against the canonical mapping table in the plan.
