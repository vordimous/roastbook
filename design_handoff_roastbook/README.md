# Handoff: Roastbook — warm-dark lab-notebook redesign

## Overview
A visual redesign of **Roastbook**, a home coffee-roasting log built from static Markdown.
The goal: keep it simple and easy to scan, but give it a polished, cohesive "lab notebook"
identity that runs across every page. Dark theme is primary; a light theme uses the same
tokens flipped, so a theme switcher drops straight in.

Two page types are covered:
- **Index** — the roast log: intro, reference links, and a scannable ledger of roasts.
- **Roast detail** — full plan, targets vs. measured, phase split, a bean-temp curve, timing, and live notes.

## About the Design Files
The file in this bundle (`Roastbook.dc.html`) is a **design reference created in HTML** — a
prototype showing the intended look, layout, and data treatment. It is **not production code to
copy directly**, and it is laid out as side-by-side frames on a design canvas (system key, index,
detail, light variant) purely for review.

Your task is to **recreate these designs in the real Roastbook codebase** — i.e. as templates +
a stylesheet in the static-site generator it already uses (Hugo / Jekyll / 11ty), driven by the
existing Markdown front-matter and content. Do **not** ship the HTML prototype as-is. Reuse the
project's existing layout/partial conventions; only the markup structure, tokens, and CSS below
should be transplanted.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and the data visualizations are final. Recreate
the UI to match, using real content from the Markdown files. Where the prototype hardcodes one
roast's numbers (roast 015), wire those to the equivalent front-matter / computed fields.

---

## Design Tokens

### Color — dark theme (primary)
| Token | Hex | Use |
|---|---|---|
| `--ink`        | `#15130F` | page background (warm near-black) |
| `--surface`    | `#1E1B16` | raised surface |
| `--surface-2`  | `#1A1712` | row hover, readout cells, ready strip |
| `--line`       | `#322C22` | outer borders |
| `--line-soft`  | `#262219` | section dividers |
| `--hair`       | `#1d1a15` | table row hairlines |
| `--text`       | `#ECE6DA` | primary text (warm paper) |
| `--muted`      | `#A39A88` | secondary text |
| `--dim`        | `#6E665A` | labels, captions, mono micro-text |
| `--accent`     | `#DD6B33` | **burnt-orange** signal accent |

### Color — light theme (same structure, flipped)
| Token | Hex |
|---|---|
| `--ink` (bg)   | `#ECE7DC` |
| `--surface`    | `#F4F0E6` |
| `--line`       | `#D8D1C2` |
| `--line-soft`  | `#DDD6C7` |
| `--hair`       | `#E2DBCC` |
| `--text`       | `#2A2620` |
| `--muted`      | `#6E665A` |
| `--dim`        | `#9A917F` |
| `--accent`     | `#B5511F` (darkened burnt orange for contrast on paper) |

### Roast-level scale — the ONLY browns, used strictly as a data key
Never use these as UI chrome; they only encode roast level (swatches, phase bars).
| Level | Hex |
|---|---|
| Light          | `#C9A36B` |
| Medium-Light   | `#B07D43` |
| Medium         | `#8A5A2B` |
| Medium-Dark    | `#5E3A1E` |
| Dark           | `#3A2415` |

### Typography — IBM Plex trio (Google Fonts)
Load: `IBM Plex Serif` (500,600), `IBM Plex Sans` (400,500,600,700), `IBM Plex Mono` (400,500,600).
- **Serif** — headings / page titles / wordmark. e.g. page title 30px/600, detail title 27px/600, card title 20px/600.
- **Sans** — body, prose, labels, names. Body 13–14px/1.5.
- **Mono** — **every measurement, code-like value, and micro-label.** This is the rule that makes
  the numbers stand out. Section labels are mono 10.5px, `letter-spacing:0.12em`, uppercase, color `--dim`.
  Big readout values are mono 22px/500.

### Spacing / shape
- Card radius `8px`; inner control radius `5–6px`; swatch radius `2px`.
- Card padding: 24–30px. Border: `1px solid --line`.
- Card shadow (dark): `0 1px 3px rgba(0,0,0,.2)`; (light): `0 1px 3px rgba(0,0,0,.12)`.
- Row vertical padding `13px`, hairline divider between rows.

---

## Screens / Views

### 1. Index — Roast Log
**Purpose:** scan all roasts, jump to references, open a roast.

**Layout (top → bottom):**
1. **Top bar** (flex, space-between, padded 18×26, bottom border `--line-soft`):
   - Left: serif wordmark `Roastbook` with accent-colored `.` (`<span style="color:--accent">.</span>`).
   - Right: theme switch — label `THEME` (mono 10px `--dim`) + a pill (`border-radius:999px`, `1px` border)
     with two segments `dark` / `light`; active segment filled with `--accent`, text `--ink`; inactive text `--dim`.
2. **Hero** (padding 24×26): serif `Roast Log` 30px/600; below it intro paragraph, sans 13.5px/1.5,
   `--muted`, `max-width:560px`.
3. **Reference links** — 2-column grid, `gap:10px`. Each is a bordered card (`1px --line-soft`, radius 6,
   padding 11×14): title row = accent `→` + sans 13/600 text; subtitle = mono 10.5px `--dim`, indented to
   align under the title. Hover: border → `#4a4234`. Four links: *Methods & reference*, *Behmor 2000 AB Plus*,
   *Poppo (air popper)*, *Behmor video notes* (each with its existing sub-caption + href).
4. **Ledger header row**: left mono label `ROAST LOG`, right mono `N entries` (`--dim`).
5. **Column labels** (mono 9.5px `--dim`, bottom border `--line-soft`): `# / ORIGIN / STATUS / DATE / LEVEL / LOSS / DTR`.
6. **Roast rows** — one `<a>` per roast, CSS grid, columns:
   `34px 1fr 84px 56px 96px 64px 60px`, `gap:10px`, `align-items:center`, padding `13px 4px`,
   bottom hairline `--hair`. Hover background `--surface-2`.
   - **#** — mono 13/500, color `--accent`.
   - **Origin** — sans 13.5/500 `--text` name; mono 10px `--dim` sub-line (process / producer).
   - **Status** — quiet dot + mono 11px label `--muted` (see Status dots below). No color.
   - **Date** — mono 11px `--muted`.
   - **Level** — `12×12` rounded-2 swatch (roast-level scale color) + mono 10.5px label.
   - **Loss** / **DTR** — mono 13px, right-aligned, `--text` (these read as the key metrics).

### 2. Roast detail
**Purpose:** the full record for one roast.

**Layout (top → bottom), single column, card padding 26×30:**
1. **Back link** — mono 11px `--accent`: `← all roasts`.
2. **Title** — serif 27px/600; trailing qualifier like `(Washed)` in `--muted`/500.
3. **Meta line** — mono 12px `--muted`, dot-separated: date · `[11×11 level swatch] Medium` · roaster.
   Separators `·` in `#4a4234`.
4. **Instrument readout** — 5-column grid, `gap:1px` over a `--line-soft` background so cells show as
   hairline-separated tiles (each cell bg `--surface-2`, padding 16×14, radius on the group only).
   Each cell: mono 9.5px `--dim` label (`FC / TOTAL / DEV / DTR / LOSS`) + mono 22px/500 `--text` value.
5. **Ready strip** — bordered row (`1px --line-soft`, radius 8, padding 13×16), space-between:
   left = status dot + sans 13px `--muted` (`Resting — ready to drink`); right = mono 13px `--accent`
   ready window (`Jun 28 – Jul 7`).
6. **Two columns** (`1fr 1fr`, `gap:26`):
   - **Roast plan** — mono section label; key/value rows (label `--dim`, value `--text`), hairline dividers.
     Keys: Origin, Process, Target, Roaster, Profile, Batch, Green weight, Conditions.
   - **Targets — Medium** then **Measured** — same row pattern; measured values are mono, with a small
     mono `--accent` delta chip after them (`under 0.7%`, `over 0.5%`).
7. **Phase split vs 50 / 30 / 20** — label row, then a `30px` stacked bar (radius 5, bg `--surface-2`):
   segments width = phase % (Drying `51.2%` → `#C9A36B`, Maillard `26.3%` → `#8A5A2B`,
   Development `22.5%` → `--accent`). Two **target ticks** overlaid as `1.5px` vertical lines at
   `left:50%` and `left:80%`, color `--text` at `opacity:.55`, extending `3px` above/below the bar.
   Below: 3-column legend, each = small swatch + name, mono `time · pct%`, and mono `±x pt vs target` (`--dim`).
8. **Bean-temp curve** — bordered card. Inline SVG, `viewBox="0 0 340 96"`, `preserveAspectRatio="none"`,
   `overflow:visible`. Three elements:
   - area `<polyline>` fill `--accent` @ `fill-opacity:0.08`;
   - line `<polyline>` stroke `--accent`, `stroke-width:1.6`, round joins/caps;
   - FC marker `<circle r=3>` fill `--ink`, stroke `--accent` 1.6, at the peak point.
   Caption row below (mono 9.5px `--dim`): `charge 183°F` · `● FC ~294°F @ 10:51` · `drop 276°F`.
   **Curve math** (replicate in template/JS): given the temp samples array, with
   `W=340,H=96,pad=8,mn=178,mx=298`: `x(i)=pad + i/(n-1)*(W-2pad)`,
   `y(v)=pad + (1-(v-mn)/(mx-mn))*(H-2pad)`. Points = `x,y` pairs joined by spaces. Area polyline =
   `pad,(H-pad)` + points + `(W-pad),(H-pad)`. FC marker at the max sample.
9. **Timing + notes** — two columns (`1.1fr 1fr`). Expected timing rows (False crack / Real FC / Real 2C,
   mono values) and live notes rows (Color at FC / Smell at FC / Why dropped).

### Status dots (subtle, no color — both themes)
`6×6` circle, `inline`, in a flex with `gap:7px` before the mono label.
- **ready** — solid fill (`--text` dark / `#5A5247` light).
- **resting** — hollow, `inset 0 0 0 1px` ring (`#8A8073` dark / `#9A917F` light).
- **past-peak** — hollow, fainter ring (`#5A5247` dark / `#C2BAA8` light), label color `--dim`.

---

## Interactions & Behavior
- **Theme switch** — toggles dark/light token sets. Persist to `localStorage`; respect
  `prefers-color-scheme` on first load. Implement as a `data-theme` attribute on `<html>` driving CSS
  custom properties; the switch pill reflects current state. (The user explicitly wants at minimum a
  dark theme, ideally a working dark/light switch.)
- **Reference cards / roast rows** — whole element is a link; hover = border lighten (cards) or
  background `--surface-2` (rows), `~120–150ms` transition. No other motion needed; keep it calm.
- **Responsive** — at narrow widths, collapse the roast-row grid (e.g. drop DATE/LEVEL into the origin
  cell, keep #, name, LOSS, DTR), and stack the detail two-column sections to single column. The temp
  SVG already scales (`width:100%`).

## State Management
Minimal — this is content-driven. The only client state is **theme** (`localStorage` + `data-theme`).
Everything else is rendered from Markdown front-matter / computed fields at build time:
- Per-roast: number, name, sub (process/producer), status, date, level, loss%, DTR%, plus the full
  detail set (plan rows, targets, measured + deltas, phase splits, temp-sample array, timing, notes,
  ready window).
- Index needs the roast collection sorted as today (newest/grouped as the current site does).

## Roast photos (bean closeup, one per roast)
The author keeps one closeup photo of the bean pile per roast. It doubles as the **real roast-color
reference** alongside the target-level swatch, so it earns its place. Two placements (both shown in
the prototype as striped placeholders labeled `bean closeup`):
- **Detail page — "specimen" plate:** a `148×148`, radius-6 framed square at the **top-right of the
  header**, sitting beside the title/meta block (header becomes a flex: title column `flex:1` + photo
  `flex:0 0 auto`). Caption under it: mono 9px `--dim`, `SPECIMEN · <roast number>`. `object-fit:cover`.
- **Index — row thumbnail:** a `26×26`, radius-4 thumbnail as the **first column** of each roast row
  (grid gains a leading `30px` track; header gets a matching empty label cell). `object-fit:cover`,
  `1px solid --line` frame. Keep it small so the ledger stays scannable.

**Where the files go / how to wire it (tell Claude this):**
- Store images alongside content, e.g. `content/roasts/015-nicaragua/beans.jpg` (co-located with the
  roast's Markdown) **or** a flat `static/roasts/015.jpg` — match whatever the generator already does
  for page assets.
- Add an optional front-matter field, e.g. `photo: beans.jpg` (or `bean_photo:`). Resolve it relative
  to the roast page. If absent, render the **striped placeholder**, not a broken image.
- Same image source feeds both the detail specimen and the index thumbnail (CSS `object-fit:cover`
  handles the two crops). Provide `alt` like `"015 — roasted beans closeup"`.
- Nice-to-have: lazy-load (`loading="lazy"`) the index thumbnails.

## Assets
- **Fonts:** IBM Plex Serif / Sans / Mono via Google Fonts (or self-host).
- **Roast photos:** author-supplied bean-closeup JPGs, one per roast (see section above). The prototype
  shows placeholders; swap in `<img object-fit:cover>` driven by front-matter.
- **Icons:** none — the only glyphs are text arrows (`→`, `←`) and CSS dots/swatches. Do not add an icon library.
- **Charts:** hand-built inline SVG (formula above); no charting dependency required.

## Files
- `Roastbook.dc.html` — the design reference (canvas with all frames: system key, index dark, detail dark, index light).
- `tokens.css` — ready-to-use CSS custom properties for both themes (drop into the project's stylesheet).
