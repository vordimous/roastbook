# roastbook-spike

Phase-0 throwaway. Validates astro-editor's auto-rendering against the schema we intend to ship in [roastbook](../roastbook).

## What this exists to answer

1. Does astro-editor render multi-line frontmatter strings (`playbook`, `bean_notes`, `interventions`) as a usable multi-line textarea, or as a single-line input?
2. Does it pick up the `image()` field as a drag-drop file picker?
3. Does the `target_level` enum render as a dropdown?
4. Does `z.string().regex(/^\d{1,2}:\d{2}$/)` (mm:ss) render usefully, or as a plain text field?
5. Does it write valid frontmatter back to disk that `astro check` still accepts?
6. (Fallback path) Does Obsidian opened on `src/content/roasts/` give a workable property-editor for the same file?

Findings go in `spike-findings.md`. The answers gate Phase 1's final schema design — specifically whether `playbook` and `interventions` stay in frontmatter or move into the Markdown body.

## How to run

Requires Node >=22.12 (see `.nvmrc` — `nvm use` if you have nvm).

```bash
pnpm install
pnpm check          # confirms the example roast validates against the Zod schema
pnpm build          # confirms end-to-end build succeeds
pnpm dev            # browse the (trivial) index page at http://localhost:4321
```

Then open astro-editor (download from <https://astroeditor.danny.is/>) and point it at this directory. Try editing `src/content/roasts/012-guatemala.md` and observe how each field renders. Fill out `spike-findings.md` as you go.

`012-guatemala.md` was chosen as the test case because it exercises the worst-case markdown-in-frontmatter: the `playbook` field contains markdown headings (`## SETUP`) AND a markdown table. If astro-editor renders that field as a single-line input, the spike has its answer immediately.

This repo is intentionally minimal — no layouts, no pages, no styling. The validation surface is the Zod schema + astro-editor's reading of it.
