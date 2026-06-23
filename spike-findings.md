# Spike findings — astro-editor against the roastbook schema

Fill this in as you click through `src/content/roasts/012-guatemala.md` in astro-editor. Screenshots welcome; drop them in `./screenshots/` and link inline.

## How to run the spike

1. `pnpm install` in this directory.
2. Download astro-editor from <https://astroeditor.danny.is/> (macOS .dmg). Open it. File → Open → point at this directory.
3. Open the file: `src/content/roasts/012-guatemala.md`.
4. Walk down the form, answering each question below.
5. Make a tiny edit (e.g. change `rating` to 7), save, and run `pnpm check` from the terminal. Confirm the file still validates.
6. (Fallback path) Open this folder in Obsidian — no plugin install, just point a vault at `./src/content/`. Edit the same file via Obsidian's property editor. Answer the Obsidian section.

## Field-by-field rendering (astro-editor)

For each, fill in: **rendered as / usable? (Y/N) / notes**.

| Field | Zod type | Rendered as | Usable? | Notes |
| --- | --- | --- | --- | --- |
| `title` | `z.string()` required |  |  |  |
| `date` | `z.coerce.date()` |  |  |  |
| `origin` | `z.string()` optional/nullable |  |  |  |
| `product_url` | `z.string().url()` optional |  |  |  |
| `target_level` | `z.enum([5 values])` |  |  | Expect dropdown |
| `tags` | `z.array(z.string())` |  |  | Expect tag chips |
| `batch_size_g` | `z.number().int().positive()` |  |  |  |
| `ambient_rh` | `z.number().min(0).max(100)` |  |  | Does range render as slider or validation? |
| `bean_notes` | multi-line `z.string()` |  |  | **Crucial: multi-line textarea or single-line input?** |
| `playbook` | multi-line `z.string()` |  |  | **Most crucial: contains `## headings` and a markdown table. If single-line, schema redesign required.** |
| `time_to_fc` | `z.string().regex(/^\d{1,2}:\d{2}$/)` |  |  | Does it surface the regex message on invalid input? |
| `interventions` | multi-line `z.string()` |  |  | B-temp log: 30+ lines. Usable? |
| `roasted_photo` | `image()` helper |  |  | Drag-drop file picker? File chooser? Both? |
| `rating` | `z.number().min(0).max(10)` optional |  |  |  |
| `roaster` | `z.string().default(...)` |  |  | Default shown? |
| `draft` | `z.boolean().default(false)` |  |  | Toggle switch? |

## Round-trip — does it write valid frontmatter?

- [ ] Made a small edit and saved. File on disk reflects the change.
- [ ] `pnpm check` still passes after the edit. (If not: what was the validation error?)
- [ ] Did astro-editor preserve YAML formatting (block scalars `|`, quoting, key order)? Or did it rewrite the file in a way that lost information (e.g. flattened `playbook` `|` block into a quoted single-line string)?

## Obsidian fallback path

Open `./src/content/` as an Obsidian vault. Edit the same file.

- [ ] Property editor shows all frontmatter fields.
- [ ] Multi-line `playbook` and `interventions` editable (Obsidian shows them in the body via the source-mode toggle, or hides them?).
- [ ] Markdown body of the file (everything below the `---`) editable normally — confirmed.
- [ ] Round-trip: edit, save, `pnpm check` still passes.

## Decisions

Based on the above, mark one:

- [ ] **Keep `playbook` and `interventions` in frontmatter.** astro-editor rendered them as usable multi-line textareas. Phase 1 schema = this spike's schema.
- [ ] **Move `playbook` and `interventions` to the markdown body** using HTML-comment section markers (e.g. `<!-- playbook -->`). Reason: astro-editor rendered them as single-line / unusable, OR rewrote the YAML block scalar lossily. Phase 1 schema strips these fields.
- [ ] **Hybrid.** Keep short multi-line fields (`bean_notes`, `why_dropped`, `next_time`) in frontmatter as a scalar; move the long structured ones (`playbook`, `interventions`) to the body. Document the convention.

## Other surprises

(Anything else worth recording — perf, weird focus behavior, dark-mode bugs, etc.)
