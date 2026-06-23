# Obsidian + VaultCMS verification

The spike now has VaultCMS's `slate` preset installed and reconfigured for our roast schema. Open this folder in Obsidian and run the checklist below.

## What was wired up

| File | What it does |
| --- | --- |
| `.obsidian/` | Full Obsidian vault config (22 community plugins pre-bundled) |
| `.obsidian/plugins/astro-composer/data.json` | "Roasts" content type → `src/content/roasts/`, with the full frontmatter + H1 body skeleton template |
| `.obsidian/plugins/vault-cms/data.json` | Mirrors the Roasts content type; wires title/date/draft properties |
| `.obsidian/app.json` | Default new-file location set to `src/content/roasts`; markdown-style relative links (Astro-compatible) |
| `_bases/Home.base` | Dashboard view filtered on `src/content/roasts/`, columns: date, target, origin, FC, total, rating, draft |

## How to open

1. Launch Obsidian.
2. **Open folder as vault** → point at `~/Code/roastbook-spike/`.
3. Trust the author when prompted (community plugins).
4. Allow community plugins if Obsidian asks (Settings → Community plugins → Turn on).
5. The Home base should auto-open and show `012-guatemala.md` as a row.

## Field-by-field round-trip test (the gating check)

Click on the row for 012-guatemala to open it. Look at the Properties pane on the right. For each field, do what's described and run `pnpm check` from a terminal in the spike dir. Note any field where the answer is "No".

| Field | What to try | Pass? |
| --- | --- | --- |
| `title` | Edit text in Properties pane, save | |
| `date` | Click the date, see if Obsidian shows a date picker, save | |
| `target_level` | Try typing "medium-dark" (lowercase). Save. Does `astro check` reject it? Now revert to `Medium-Dark`. | |
| `time_to_fc` | Currently unquoted `9:41`. Edit to `10:30`, save. Confirm file still has unquoted scalar after save. | |
| `tags` | Add a new tag via the chip UI | |
| `batch_size_g` | Change `227` to `454`. Does Obsidian keep it as a number? | |
| `roasted_weight_g` | Change `193.6` to `200.5`. Decimals survive? | |
| `draft` | Toggle the boolean | |
| Body editor | Click into the body. Confirm `# Bean notes` / `# Playbook` / `# Interventions` are visible as headings. Edit the playbook text. Save. | |

## "Create new roast" flow (the non-tech path)

1. Look for a ribbon icon (left edge) for **Astro Composer** — should be a small rocket or similar.
2. Click it (or use Command Palette `Cmd+P` → search "Astro Composer: Create new" or similar).
3. Choose "Roasts" content type when prompted.
4. Type a title like "013 — test".
5. The new file should land at `src/content/roasts/013-test.md` with **the full template populated** — frontmatter + `# Bean notes` / `# Playbook` / `# Interventions` / etc. headings already in the body.
6. Run `pnpm check`. The new file should validate (`target_level: Medium` and `draft: true` are in the template).

**If this works**, the non-tech "new roast" path is solved natively, no extra plugins beyond what VaultCMS installs.

## Image attach test

Drag any photo from Finder into the body of an open roast, under a new `# Photo` section.

- Where does Obsidian put the image file? (Expected: `src/content/roasts/attachments/<filename>`)
- What does it write in the markdown — `![[file.jpg]]` or `![](file.jpg)`?  (Expected: relative `![](attachments/file.jpg)` because of `useMarkdownLinks: true`.)
- After saving, does `pnpm check` still pass? (It will, because the photo isn't in the schema — it's just markdown.)
- Does `pnpm build` render the image when you view the page?

If Obsidian writes a wikilink `![[...]]` instead of a markdown link, run the command "Astro Composer: Convert wikilinks to Astro format" from the Command Palette and see if it fixes it.

## Conclusions to capture

- [ ] Property round-trip preserves enough fidelity that `astro check` keeps passing across edits.
- [ ] "Create new roast" flow works via Astro Composer with one click + a title.
- [ ] Image attach produces a markdown path Astro can render at build.
- [ ] Decisions / surprises / friction to document in the README.
