# Roasting section instructions

This section logs home coffee roasts. The architecture separates **universal
roast science** from **machine-specific guidance** so future machines can be
added without schema changes. (Originally a Hugo + TinaCMS site; migrated to
Astro + Zod + Sveltia — this doc describes the Astro stack.)

## File layout

- `src/content/roasts/NNN-<origin>.md` — one file per roast. Structured
  frontmatter holds plan + raw inputs + observations; long-form notes live in
  `text`-widget fields (kept literal), not in a markdown body.
- `src/content.config.ts` — the Zod schema. **Single source of truth.** Field
  types, enums (`target_level`, `profile`), the `mm:ss` regex, and the
  empty-string→undefined coercion all live here.
- `src/content/roasts/_TEMPLATE.md` — scaffold for new roasts. Excluded from the
  loader (`!_*.md`) and the build; kept under version control via a `.gitignore`
  exception. `_`-prefixed files are work-in-progress scratch (not loaded).
- `src/content/roasts/CLAUDE.md` — this file. Excluded from the loader
  (`!CLAUDE.md`).
- `src/pages/roasts/methods.mdx` — universal-only reference doc. Formulas,
  target-level ranges, raw-input definitions. **No machine names here.**
- `src/pages/roasts/<machine>.mdx|.astro` — per-machine cheat sheets
  (`behmor-2000ab.mdx`, `poppo.astro`). Tables render from YAML via components in
  `src/components/` — **do not hand-edit the tables; edit the data file.**
- `src/pages/roasts/behmor-video-notes.md` — community technique breakdown.
- `src/data/roast_guidance.yaml` — universal: `levels`
  (loss%/DTR%/rest_days/drop/flavor per roast level) and `formulas`.
  **No machine references.**
- `src/data/machines/<model_key>.yaml` — everything machine-specific. Has a
  `reference_url` pointing to its cheat-sheet page.
- `src/lib/roastData.ts` — build-time loader for the YAML data.
- `src/lib/roastStats.ts` — derived metrics (loss %, dev time, DTR, effective
  level, ready-to-drink window, in-range badges).

## The CMS config is generated, not hand-written

`public/admin/config.yml` (the Sveltia CMS editor config) is **emitted from the
Zod schema** by `scripts/emit-sveltia-config.ts`. Do not hand-edit it — change
the Zod schema and run `pnpm sveltia:emit`. `pnpm check` regenerates it and
fails on drift (`git diff --exit-code`). UI hints attach to the schema via
`.meta({ sveltia: { … } })` / `.describe()`.

## Machine data is keyed by model

Each `src/data/machines/<model_key>.yaml` is keyed by a slug derived from the
`roaster` frontmatter value (`"Behmor 2000 AB Plus"` → `behmor_2000_ab_plus`)
and carries a `reference_url` to its cheat-sheet page. Roasts carry the machine
name in `roaster`. The earliest roasts intentionally keep the wrong-model
`roaster: Behmor 1600 Plus` value as their honest record.

> Not yet ported from the Hugo site: a per-roast machine panel that derived
> weight-setting recommendations / shutoff timing from `roaster` at render time.
> `roastStats.ts` currently computes only from the universal `roast_guidance`
> levels. The machine YAML is structured to support re-adding that panel.

## Adding a new machine

1. Create `src/data/machines/<model_key>.yaml` (top-level `name`,
   `reference_url`, plus whatever that machine needs — the Behmor and Poppo
   files have different shapes, and that's fine).
2. Add a typed export in `src/lib/roastData.ts` and a cheat-sheet page under
   `src/pages/roasts/` that renders it (component-driven, like
   `behmor-2000ab.mdx`, or a single `.astro` page like `poppo.astro`).
3. Link it from the guides block in `src/pages/index.astro`.
4. Future roasts use the new model name in `roaster`. No schema changes needed.

## Calibrating ranges from logged data

After ~10–15 logged roasts, the universal targets in
`src/data/roast_guidance.yaml` may need tightening to match real cup outcomes.
**Edit the YAML — do not embed ranges in pages or components.** Every page (list
cards, detail, methods) picks up changes on rebuild.

## Ready-to-drink window

Detail pages and list cards compute a rest window from the **roast date** + the
level's `rest_days` range, then show a status pill (`resting` / `ready` /
`past-peak`) by comparing against `now`. The math lives in
`src/lib/roastStats.ts`. The window uses the **loss-derived effective level**,
not the aimed-for `target_level`, so an under-developed roast rests like what it
actually became. To tune, edit the `rest_days` arrays in the YAML.

**Rest-time assumptions:** the ranges are tuned for **drum roaster + filter
brewing**. Scott Rao: drum roasts don't need more than 1–2 days unless
underdeveloped; air roasters need 1–4 weeks. Filter vents CO₂ freely (vendor
"12–24hr" minimums are real); espresso needs ~5–7 more days because gas can't
escape under 9 bar. Don't widen these toward espresso/air-roaster numbers
without changing the brew-method assumption documented in `methods.mdx` and the
YAML header.

## Roasted beans photo

`roasted_photo` is Astro's `image()` field. The photo is **co-located next to
the entry** in `src/content/roasts/` and referenced by a relative path
(`roasted_photo: PXL_….jpg`); `image()` resolves it relative to the markdown
file. The detail page renders it via `<Image>` (astro:assets), which optimizes
to responsive WebP via `sharp` — multi-resolution `srcset` is on. In Sveltia,
uploads should co-locate; confirm the written path is relative (not `/imgs/…`).

## Bean source

`product_url` (vendor product-page link) and optional `vendor` (human name). The
detail page renders a "Source" row — uses `vendor` if set, otherwise the URL's
host. Links open in a new tab with `rel="noopener"`.

## Building a roast playbook — REQUIRED PROCESS

A roast playbook directly drives a physical action on a $400 machine using $20+
of green coffee. Wrong guidance burns beans and risks fire (the Behmor manual is
explicit about ignition past 10 seconds into 2C). Treat every playbook like
instructions someone will follow with their hands on hot equipment.

### Before writing any playbook step

1. **Read the machine reference page first** — `src/pages/roasts/behmor-2000ab.mdx`
   is the source of truth for everything machine-specific. The official manual is
   linked there.
2. **Look up the origin's recommended Auto Mode profile** from the machine YAML
   (`auto_mode_profiles`). The mapping is non-obvious:
   - **Centrals, Peruvian, Colombian** → P1 or P2 (Hard Bean, highest heat)
   - **Brazilian, African, SE Asian, Malabar, JBM, Yauco** → P3 (Soft Bean)
   - **Kona, low-grown island** → P4 or P5 (lowest heat)

   Picking P5 for a Brazilian or Central American bean is wrong — P5 in Auto mode
   is the *lowest* heat profile, for island coffees. "P5 = aggressive" is only
   correct in Manual mode (which fires AFTER Start).

3. **Default to the C-button + Auto P1 hold technique** for drinking-coffee
   batches at ½ lb or 1 lb: start on Auto P1 (or per-origin Auto profile), stay
   on Auto P1 through FC, drop to P3 only as a brake if 2C threatens. See
   `c_button_technique` in `src/data/machines/behmor_2000_ab_plus.yaml`.

   **CRITICAL — the C button RESETS the clock, it does NOT add time.** It sets
   the clock to the Rosetta Stone 1C→2C duration (~1:30 for ¼ lb, ~2:09 for
   ½ lb, ~3:00+ for 1 lb). If the current clock has MORE time, C SHORTENS the
   roast. This bit roast 008: FC at 7:30 with 4:30 remaining; pressing C cut the
   clock to 2:09 → 8.85% loss vs 16–18% target. Rule: press C at FC ONLY if
   remaining clock < ~2:30. Otherwise let Auto P1's program run; use `+` for
   small extensions, or press C near the end of the clock to extend.

   **Do NOT default to the manual's Pro Sample Roasting technique** (P3+D at
   FC+15s) for drinking-coffee batches — it cuts power to 50% for the whole
   development phase and stalls heat. Roasts 006 and 007 used it and came in
   under-developed (8–9.4% loss vs 13–16% target, DTR 38%+). Pro Sample Roasting
   is for small evaluation batches; see `pro_sample_roasting.appropriate_use`.

4. **Confirm constraints from the manual:**
   - Batch ≤ 336 g if pushing past City+ (darker control)
   - 1:30 maximum preheat (longer locks out the roast)
   - 1 HOUR between back-to-back roasts (NOT minutes)
   - Never past 10 sec into 2C
   - 75% Err 7 safety shutoff fires at 75% of program time (need START or C)

### Structure every playbook with

- **A plan-rationale block at the top** — bean type → Auto profile, target
  level, charge size, expected FC behavior.
- **A numbered sequence**: preheat, drum insert, profile + weight + START, when
  to listen for FC, exact 75% shutoff time, C-button at FC, drop trigger for the
  target level, cool cycle, weigh, between-roast wait.
- **A "what to watch" block** flagging the bean's idiosyncrasies plus universal
  fire-risk warnings.
- **Cite the manual** for non-obvious advice (e.g. "manual Part 5, page 12-13").

### What NOT to do when building a playbook

- Don't pick a profile from intuition — look it up in `auto_mode_profiles`.
- Don't assume "more aggressive = higher P number" — that's Manual-mode logic.
- Don't write a back-to-back cool-down in minutes if the manual says 1 hour.
- Don't reuse a prior playbook's structure without checking it against the
  manual — early playbooks (001–004) predate the manual extraction and contain
  known errors.
- Don't copy generic drum-roaster advice into a Behmor playbook unless verified
  for a probeless fixed-program machine.
- Don't write unsourced sensory recipes. If a step isn't traceable to the manual
  or a cited forum/library, drop it or mark it explicitly as community technique.
- Don't test multiple variables in a single roast. Validate a new technique at a
  previously-attempted target before pushing deeper/lighter. If a multi-variable
  run is requested anyway, flag it in `bean_notes`.

### Every playbook runs in isolation

Each `NNN-*.md` playbook is written as if no other roast preceded it:

1. **Always include the 1:30 preheat step.** The cool cycle blows forced air to
   cool the drum/elements; the next roast still needs the standard preheat. No
   conditional "skip if back-to-back" framing.
2. **No cross-references to other roasts in the playbook body.** The
   1-hour-between-roasts rule is a standalone step at the end, not a framing for
   skipping steps. Bean notes may compare prior *tasting* outcomes; the playbook
   cannot.

The "no preheat, drum hot" pattern in roasts 003–004 is a documented pre-manual
error — don't propagate it.

## Repeatability — capture every button press

The `interventions` field is the single most important repeatability tool.
Starting settings aren't enough to reproduce a roast — what *makes* it is the
sequence of mid-roast button presses with elapsed times. Capture them all: the
Manual-mode P switch, the D button, every `C` press, every `+` press (with
seconds; `+` has a ~+2:00 per-roast cap), and the Cool press. Format is one per
line, `MM:SS — what you pressed`. The detail page renders it as a monospace
block in Live notes.

## Capturing machine details honestly

When pulling info from a manual into the YAML:

- **Quote the manual directly** in a `manual_quote`-style field when wording
  matters.
- **Flag contradictions** rather than silently picking one (the manual gives two
  drum-speed RPM ranges; the YAML says so and treats them as approximate).
- **Don't invent precision.** Capture "high"/"standard" if that's all the manual
  gives; don't backfill numbers from forums or other machines.

The Poppo machine file is entirely *observed* values (no manual exists) — it
says so explicitly. Keep that honesty: empirical data is labeled as such.

## Time fields

`time_to_fc` and `total_time` are **elapsed time** in `mm:ss` (enforced by the
schema regex). The Behmor displays *countdown* time — recording countdown values
produces a DTR > 40%, the immediate signal that elapsed vs countdown got
confused. The first batch of roasts hit this.

## What NOT to do

- Don't embed roast-level ranges (loss %, DTR %) in pages — they belong in
  `src/data/roast_guidance.yaml`.
- Don't hand-roll tables in `methods.mdx` / `behmor-2000ab.mdx` for data that
  lives in YAML — use the `src/components/` table components.
- Don't add `weight_loss_pct`, `dev_time`, or `dtr_pct` to frontmatter — they're
  computed in `src/lib/roastStats.ts` from the four raw inputs.
- Don't mix machine-specific guidance into `methods.mdx` — it's universal.
- Don't modify completed roasts' measured data (`green_weight_g`,
  `roasted_weight_g`, `time_to_fc`, `total_time`, observations). The
  wrong-machine note in `bean_notes` is the documented record.
