# Schema-gated editing UX evaluation

## What we're measuring

**The constant:** Astro Content Collections + Zod schema in [src/content.config.ts](src/content.config.ts) is the single source of truth. `astro check` / `astro build` fails on any violation. This is the safety net every editing surface inherits.

**The variable:** how each actor experiences that schema gate. We don't measure "is the editor pretty"; we measure "what does the actor see when they violate the schema, when does the error appear, can they fix it without a developer."

**The decision this evaluation drives:** which editing surfaces we ship as supported, which we document as not-recommended, and what docs each supported surface needs.

## Setup state for tests

- Spike: `~/Code/roastbook-spike/`
- Dev server: running at <http://localhost:4321> (background, PID 19315)
- Schema: `src/content.config.ts` — 25 fields, `target_level` is the canonical enum test, `time_to_fc`/`total_time` are the regex test, `roasted_weight_g` is the numeric-bound test
- Sample valid roast: `src/content/roasts/012-guatemala.md`
- Glob excludes `_*.md` so test drafts can sit alongside without polluting the build

## Actors

| # | Actor | Surface | Audience |
| --- | --- | --- | --- |
| 1 | Plain text + git | VSCode / vim / TextEdit + terminal | Power user, OSS contributor, the floor we measure against |
| 2 | Obsidian | Properties pane + markdown body, with Astro Composer / bases-cms / image-manager / obsidian-git plugins | Mobile capture, cross-platform, schema-agnostic at edit time |
| 3 | astro-editor | Tauri desktop form, schema-derived | Desktop primary, macOS-supported / Win+Linux experimental |
| 4 | Claude Code / Agent SDK | Filesystem + tool calls | AI agent (you, when iterating on roasts; future contributors' agents) |

## Test matrix

Run the same eight tests on each actor. Each row captures: **what the actor sees**, **when the error appears** (edit time / save time / build time / deploy time), **error readability** (1–3), **friction** (1–3).

| ID | Test | Schema field exercised | Expected violation behavior |
| --- | --- | --- | --- |
| T1 | Happy path: edit one valid scalar (`rating: 7`) and save | n/a | No error, dev server reflects |
| T2 | Enum violation: set `target_level: medium-dark` (lowercase) | `z.enum([...])` | astro check fails — capture exact error text |
| T3 | Missing required: delete `target_level` line entirely | enum without `.nullish()` | astro check fails on required |
| T4 | Regex violation: set `time_to_fc: not-a-time` | `z.string().regex(/^\d{1,2}:\d{2}$/)` | astro check fails with regex message |
| T5 | Numeric bound: set `roasted_weight_g: -50` | `z.number().positive()` | astro check fails on bound |
| T6 | Body malformed markdown: break the table in `# Playbook` | (not schema-gated) | Build succeeds, rendered page shows broken table. Confirm this is out-of-scope for Zod. |
| T7 | Create a brand-new roast file from scratch | full schema | What's the actor's "new roast" path? How many steps? |
| T8 | Add an image field: extend the schema with `roasted_photo: image()`, attach a photo | `image()` helper | Does the surface produce a path Astro accepts? |

## Scoring rubric

For each (actor, test) cell capture three measurements:

**Error timing** — when does the actor learn they made a mistake?

- **edit** — surface flags it while typing (e.g., red field outline). Best.
- **save** — surface flags it on save (e.g., form refuses to save).
- **build** — surface doesn't flag it; `astro check`/`build`/dev-server hot reload shows the error. Acceptable.
- **deploy** — only CI catches it. Bad — means a published-looking file is broken.

**Error readability** (1 = bad, 3 = best):

- **1** — stack trace, mentions internals, no field-level guidance
- **2** — names the field and the violation
- **3** — names the field, violation, and tells the actor the fix ("expected one of: Light, Light-Medium, ...")

**Friction** (1 = bad, 3 = best):

- **1** — actor needs developer help to interpret or fix
- **2** — actor can fix with docs / a glance at the schema
- **3** — actor can fix without leaving the editor

## How we'll run this

For each actor (1–4), produce a section below with:

1. **How to reach the surface** — exact steps from a fresh state
2. **The matrix filled in** — one row per test T1–T8 with timing / readability / friction / observation
3. **What surprised us** — anything outside the matrix worth recording
4. **Audience verdict** — supported / supported-with-docs / not recommended

We work through actors in order. Plain text + git first (it's the floor — every other actor's behavior is measured against this baseline).

---

## Actor 1: plain text editor + git

**Reach:** Open `src/content/roasts/012-guatemala.md` in any text editor. Run `pnpm check` in a terminal after each edit.

### Matrix

| Test | Timing | Readability | Friction | Observation |
| --- | --- | --- | --- | --- |
| T1 | | | | |
| T2 | | | | |
| T3 | | | | |
| T4 | | | | |
| T5 | | | | |
| T6 | | | | |
| T7 | | | | |
| T8 | | | | |

### Surprises

(empty until run)

### Verdict

(empty until run)

---

## Actor 2: Obsidian + Astro Composer

**Reach:**

1. Launch Obsidian.
2. "Open folder as vault" → `~/Code/roastbook-spike/`.
3. Trust the vault. Allow community plugins.
4. Home base loads; click the row for `012-guatemala`.
5. Edits happen in the Properties pane (right sidebar) and the markdown editor (center).
6. For "new roast": click Astro Composer's ribbon icon or run "Astro Composer: Create new note" from the command palette (Cmd+P).

### Matrix

| Test | Timing | Readability | Friction | Observation |
| --- | --- | --- | --- | --- |
| T1 | | | | |
| T2 | | | | |
| T3 | | | | |
| T4 | | | | |
| T5 | | | | |
| T6 | | | | |
| T7 | | | | |
| T8 | | | | |

### Surprises

(empty until run)

### Verdict

(empty until run)

---

## Actor 3: astro-editor

**Reach:**

1. Download astro-editor from <https://astroeditor.danny.is/> (macOS .dmg, Win/Linux experimental).
2. File → Open → point at `~/Code/roastbook-spike/`.
3. Open `012-guatemala.md` from the left sidebar.
4. Edits happen in the right-side schema-derived form.
5. For "new roast": Cmd+N or the "New File" button. Schema-derived blank form. (Note: no body templating — the H1 skeleton must be typed manually.)

### Matrix

| Test | Timing | Readability | Friction | Observation |
| --- | --- | --- | --- | --- |
| T1 | | | | |
| T2 | | | | |
| T3 | | | | |
| T4 | | | | |
| T5 | | | | |
| T6 | | | | |
| T7 | | | | |
| T8 | | | | |

### Surprises

(empty until run)

### Verdict

(empty until run)

---

## Actor 4: Claude Code (AI agent on filesystem)

**Reach:** Run Claude Code in the spike directory. Prompt: "Add a new roast for an Ethiopian Yirgacheffe, target Light-Medium, capture FC at 8:30, total 12:00."

For each test, run a simulated prompt that *should* cause the violation, and observe whether the agent (a) catches it before writing, (b) writes it and reports the schema error from `astro check`, or (c) writes it without checking.

### Matrix

| Test | Timing | Readability | Friction | Observation |
| --- | --- | --- | --- | --- |
| T1 | | | | |
| T2 | | | | |
| T3 | | | | |
| T4 | | | | |
| T5 | | | | |
| T6 | | | | |
| T7 | | | | |
| T8 | | | | |

### Surprises

(empty until run)

### Verdict

(empty until run)

---

## Cross-actor summary

To fill in after all four matrices are populated.

### Schema gate quality

Where does Zod give us load-bearing safety? Where is the error message a wall the actor can't get over? Which actors need supplementary docs to interpret errors?

### Recommended surfaces per audience

| Audience | Recommended surface | Required docs / setup |
| --- | --- | --- |
| OSS contributor | | |
| Roaster on desktop (you) | | |
| Roaster on phone (you, at the machine) | | |
| AI agent | | |
| Non-tech (no-install browser) | | (Not addressed — Zod-only constraint rules out all browser CMSes for now) |

### Documentation we owe

Per supported surface, what does the README / AGENTS.md / per-folder guide need to say so the actor can recover from a violation without a developer?
