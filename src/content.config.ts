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

const roasts = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/roasts",
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),

      origin: z.string().nullish(),
      process: z.string().nullish(),
      product_url: z.url().nullish(),
      vendor: z.string().nullish(),
      target_level: roastLevel,
      tags: z.array(z.string()).default([]),

      batch_size_g: z.number().int().positive().nullish(),
      profile: z.string().nullish(),
      weight_setting: z.string().nullish(),
      green_weight_g: z.number().positive().nullish(),

      ambient_f: z.number().nullish(),
      ambient_rh: z.number().min(0).max(100).nullish(),

      time_to_fc: mmss
        .describe("Elapsed time, not countdown. Example: 09:30")
        .nullish(),
      color_at_fc: z.string().nullish(),
      smell_at_fc: z.string().nullish(),
      total_time: mmss
        .describe("Elapsed time, not countdown. Example: 12:45")
        .nullish(),
      why_dropped: z.string().nullish(),

      roasted_weight_g: z.number().positive().nullish(),
      roasted_photo: image().nullish(),
      rating: z.number().min(0).max(10).nullish(),

      roaster: z.string().default("Behmor 2000 AB Plus"),
      draft: z.boolean().default(false),
    }),
});

export const collections = { roasts };
