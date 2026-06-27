---
layout: ../../layouts/Base.astro
title: "Behmor video notes — Virtual Coffee Lab"
---

[← roastbook](/)

# Behmor video notes — Virtual Coffee Lab

Research notes pulled from a YouTube walkthrough of a Behmor roast. Not authoritative; not from the manual. The roaster in the video is a **Behmor 1600 Plus**, not the 2000 AB Plus this site logs against — most concepts transfer, but heat-management button behavior and safety shutoff thresholds differ between models.

## Source

- **Title:** Behmor Coffee Roasting Recipe
- **Channel:** Virtual Coffee Lab — Home Coffee Roaster ("Mike")
- **URL:** https://www.youtube.com/watch?v=li_XZd1hrtI
- **Uploaded:** 2021-09-19
- **Length:** 27:16
- **Stats at pull:** 25,044 views · 745 likes · 290 comments
- **Bean roasted in video:** El Salvador natural, 8 oz / 225 g
- **Captions:** auto-generated; transcript summarized below, not pasted verbatim

Raw artifacts (not committed): `/tmp/yt-roast/transcript.txt` (58 timestamped blocks, ~9 KB) and `comments_li_XZd1hrtI.info.json` (289 comments).

## Chapter map (from the video)

| Time | Section |
| --- | --- |
| 0:00 | Intro |
| 0:42 | Picking a charge temperature |
| 3:08 | Logging times, temps, events every 30s |
| 4:16 | Building a repeatable recipe |
| 7:48 | Roaster poll |
| 8:34 | Charging the Behmor |
| 10:49 | Dry phase |
| 15:26 | Browning phase |
| 18:00 | Browning phase tips |
| 19:34 | First crack |
| 19:50 | Development phase |
| 20:18 | Drop |
| 22:03 | Phase-percent math |
| 24:55 | What he'd change |
| 25:25 | Closing |

## The recipe, as executed in the video

| Setting | Value |
| --- | --- |
| Machine | Behmor 1600 Plus |
| Bean | El Salvador natural |
| Charge | 8 oz / 225 g |
| Preheat ("charge temp") | 210 °F (chamber/B-temp) |
| Kickoff | P1 + START, then **immediately P5** to switch to Manual mode |
| Logging | Time + temperature every 30 seconds, hand-written |

### Mid-roast interventions (timestamps are elapsed roast time, not video timecode)

| Time | Action | Temp | Why |
| --- | --- | --- | --- |
| 0:00 | Load drum, P1+START, P5 (manual) | 190 °F | Begin |
| 1:00 | — | 207 °F | logging cadence |
| 2:00 | — | 237 °F | ROR ≈ 30 °F/min |
| 4:00 | — | 295 °F | approaching 320 °F shutoff |
| 4:15 | **P4** (drop to 75%) | — | back off heat to avoid 320 °F safety cutoff on his older 1600+ |
| 4:30 | — | 307 °F | hold |
| 4:45 | **D** (drum high) | — | introduce convection |
| 5:00 | — | 313 °F | — |
| 5:30 | **P5** (back to 100%) | dropping | temp started falling |
| 6:00 | — | 289 °F | — |
| 6:30 | **mark Dry End** | 293 °F | beans green → yellow |
| 7:00–8:30 | hold | 297–304 °F | drifting up |
| 10:30 | **First crack**; **P3** (drop to 50%) | ~305 °F | enter development |
| 11:30 | — | 295 °F | slowing |
| 12:00 | — | 291 °F | — |
| ~end | **C button** (unnarrated) | — | observed in the video near the end of the roast but not called out in the voiceover; consistent with using C to extend the clock during development when remaining time was running short |
| 12:15 | **Cool**, open door | — | drop; expects ~15 s of carryover |

### Result vs his targets

| Phase | Time | % of roast | His target |
| --- | --- | --- | --- |
| Dry | 6:30 | 53% | ≤ 50% |
| Browning | 4:00 | 32% | ~30% |
| Development | 1:45 | 14% | ~20% (he runs naturals on the low end) |
| **Total** | **12:15 / 735 s** | | |

Reported cup: raisin, nuttiness/almond, light caramel, mild creaminess; less ash than his prior attempts on the same bean. He'd shave dry-phase time on a re-roast by bumping preheat to 220–225 °F.

## Principles he emphasizes

- **50/30/20 dry/browning/development** as a starting framework, not a rule. Stretching browning made his prior batch of this bean bitter (41% browning vs 32%). He treats 20% DTR as a guideline, runs naturals shorter.
- **"Forward-think" the roast by 15 seconds** because the Behmor's cool cycle has real lag. (Aligns with the manual cited in `/roasts/behmor-2000ab/`.)
- **Charge temperature matters a lot.** He ran the same bean at two different charge temps; the hotter one gave a different (worse) cup.
- **Log every 30 s.** Without a logged sequence of button presses + temps, there is no recipe — only a memory of a roast. (Matches the project's `interventions` field philosophy.)
- **Watch the bean color**, not just temperature numbers. Dry-end is when green turns yellow; difficult under the Behmor's yellow-tinted light.
- **Reads B (chamber) temperatures, not A (exhaust).** Multiple commenters push back on this — see below.

## How this differs from the project's existing technique guidance

The 2000 AB Plus cheat-sheet (`/roasts/behmor-2000ab/`) documents two techniques sourced from the official manual + Sweet Maria's / forum consensus:

1. **Professional Sample Roasting** — P1+START → P3 at FC+10–15s → D
2. **C-button + Auto P1 hold** — P1+START → C at 75% shutoff → stay on Auto P1 through FC → drop on level

Virtual Coffee Lab does **neither** of those. He runs **pure Manual mode** the entire roast: kicks off Auto, immediately presses P5 to make P-buttons act as power levels, then rides them by chamber temperature. This is closer in spirit to the manual's Pro Sample Roasting (also Manual-mode), but he steps P5→P4→P5→P3 across the whole roast, not just at FC.

Notable differences worth flagging if integrating:

- The 320 °F shutoff he describes is the **1600+** (his "older one"); the 2000 AB Plus uses the 75% Err 7 shutoff documented in the manual. His 4:15 P4 drop is specifically about staying under 320 °F — it doesn't apply identically.
- He **does press C near the end of the roast** but never narrates it. The press is consistent with using C to extend the clock during development when time was running short (matches the project's corrected `c_button_technique` rule). His voiceover treats the recipe as a pure power-stepping technique (P5 → P4 → P5 → P3); the C press is an unspoken late adjustment.
- His drop is **before** 2C — Medium / Full City territory. The video has nothing to say about Medium-dark / Full City+ targeting, which is the deepest level the manual considers safe on the 2000 AB Plus.

## Comment thread highlights

289 comments, 93 top-level. The interesting ones for technique:

- **@andreavon3551** (12 ♥): tried it on a Yirgacheffe natural — first batch 225 g at 240 °F charge gave 56/29/15; bumped to 277 °F charge + 200 g and hit 50/34/15/4 with a sweet-fruity-raspberry cup. Confirms the recipe transfers across origins with a charge-temp/batch tweak. Aligns with Mike's "raise charge temp to shorten dry."
- **@The_Coffee_Rabbit_Hole** (7 ♥): independent confirmation that stretching dry + browning improved cup; also mentions the B-button reading as a discovery from this video.
- **@luigicollins3954** (3 ♥): pushes back on using B temp during a roast — argues A (exhaust) ROR curve tracks bean ROR better once the afterburner fan engages, while B "drops drastically when the afterburner vent fan turns on, totally ruining any ROR." His own profile: Dry P5 + slow drum → Brown P4 + fast drum → Dev P3, dump into external cooler. Says cool-mode carryover is "much longer than 15 seconds" by his estimation.
- **@dg10890** (3 ♥): upgraded-1600 user reports yellow by 4–5 min (not Mike's 6:30) and FC by 7–9 min on similar 225 g batches; asks whether his own heat is too aggressive. Useful as a sanity-check data point: 6:30 to yellow is on the long side.
- **@franktaccetta784** (2 ♥): uses A (afterburner) temp specifically to watch for the auto-shutoff — "if I go higher than 415 my roast will shut off." Different shutoff number than Mike's 320 °F. Likely different model / different sensor.
- **@normhardy** (2 ♥): asks how to reduce ash flavor — same flavor problem Mike mentions in the video as his nemesis with this bean. No answer in the thread.
- **@theupsideofdownsizing** (2 ♥): the only meaningful editorial pushback — 8 minutes of preamble before the roast starts.

The remainder is mostly thank-yous and "I have a 2000 AB" / "I have a 2020 SR" / "I just bought one" — useful as a signal that this is one of the more-watched community recipes for the Behmor family, but no additional technical content.

## Possible follow-ups

- Decide whether the **50/30/20 phase framework** earns a mention in `methods.md` or `behmor-2000ab.md`. The project already uses % targets implicitly via `src/data/roast_guidance.yaml` levels; adding the phase split as community guidance with a citation would be in-scope.
- The **A-temp-during-roast** disagreement (Mike vs the commenters) is worth resolving against the manual before any guidance lands in the cheat-sheet — the manual's "These temps ARE NOT bean temps and for information / correlation purposes only" line already covers it conservatively.
- **Pure Manual mode for drinking coffee** is a third technique the cheat-sheet doesn't currently describe. Added as a community technique on the cheat-sheet in this pass; revisit after running a roast against it.
