import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "zod";

const mmss = z
  .string()
  .regex(/^\d{1,2}:\d{2}$/, "must be elapsed mm:ss (e.g. 09:30), not countdown");

const roastLevel = z.enum([
  "Light",
  "Light-Medium",
  "Medium",
  "Medium-Dark",
  "Dark",
]);

// Long-form prose kept as a multi-line string. The `text` widget keeps the
// markdown literal in the CMS (no serializer round-trip / reformatting), while
// Astro still renders it as markdown at build time.
const longText = (hint?: string) =>
  z.string().meta({ sveltia: hint ? { widget: "text", hint } : { widget: "text" } });

// Coerce blank / whitespace-only string values to undefined before validation.
// Entries created from a template or the CMS write "" for empty fields, which
// would otherwise fail the typed fields (url / enum / mm:ss regex). Treating "" as
// "not provided" lets optional fields stay blank; genuinely required fields
// (e.g. target_level) still error, but with a clear "required" message.
const stripBlanks = (data: unknown) => {
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      out[k] = typeof v === "string" && v.trim() === "" ? undefined : v;
    }
    return out;
  }
  return data;
};

const roasts = defineCollection({
  loader: glob({
    // Two-tier draft model:
    //   - `_`-prefixed files are work-in-progress scratch (Obsidian's new-note
    //     convention) — excluded from loading entirely, so half-filled entries
    //     with blank required fields don't fail schema validation.
    //   - The `draft` frontmatter field (filtered at query time in the pages)
    //     hides complete-but-unpublished entries from production builds.
    // CLAUDE.md (section docs) is co-located but not a roast, so it's excluded.
    pattern: ["**/*.md", "!_*.md", "!CLAUDE.md"],
    base: "./src/content/roasts",
  }),
  schema: ({ image }) =>
    z.preprocess(stripBlanks, z.object({
      // Identity
      title: z.string(),
      date: z.coerce.date(),
      draft: z.boolean().default(false),

      // Sourcing
      origin: z.string().nullish(),
      process: z.string().nullish(),
      product_url: z.url().nullish(),
      vendor: z.string().nullish(),

      // Plan
      target_level: roastLevel,
      tags: z.array(z.string()).default([]),
      roaster: z.string().default("Behmor 2000 AB Plus"),
      profile: z
        .enum(["P1", "P2", "P3", "P4", "P5"])
        .meta({ sveltia: { hint: "Behmor profile letter (P1, P2, etc.)" } })
        .nullish(),
      batch_size_g: z.number().int().positive().nullish(),
      weight_setting: z.string().nullish(),
      green_weight_g: z.number().positive().nullish(),
      ambient_f: z.number().nullish(),
      ambient_rh: z.number().min(0).max(100).nullish(),

      // Long-form plan notes
      bean_notes: longText().nullish(),
      playbook: longText().nullish(),

      // Live observations
      time_to_dry_end: mmss
        .describe("Elapsed time beans turn yellow — drying→Maillard boundary, bean ~150°C/300°F (NOT Behmor B-temp). Example: 04:30")
        .nullish(),
      time_to_fc: mmss
        .describe("Elapsed time to first crack — bean ~196–205°C/385–401°F (NOT Behmor B-temp), not countdown. Example: 09:30")
        .nullish(),
      color_at_fc: z.string().nullish(),
      smell_at_fc: z.string().nullish(),
      interventions: longText("Button/temp log — one reading per line").nullish(),
      total_time: mmss
        .describe("Elapsed time to drop, not countdown. Medium-dark drops at first 2C snaps (bean ~220°C/428°F). Example: 12:45")
        .nullish(),
      why_dropped: longText().nullish(),
      anything_weird: longText().nullish(),

      // Results
      roasted_weight_g: z.number().positive().nullish(),
      roasted_photo: image().nullish(),
      rating: z.number().min(0).max(10).nullish(),

      // Reflection
      tasting_notes: longText().nullish(),
      next_time: longText().nullish(),
    })),
});

export const collections = { roasts };
