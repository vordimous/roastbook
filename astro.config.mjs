import { defineConfig } from "astro/config";

import mdx from "@astrojs/mdx";

export default defineConfig({
  vite: {
    server: {
      watch: {
        ignored: [
          "**/.obsidian/**",
          "**/_bases/**",
          "**/_GUIDE.md",
        ],
      },
    },
  },

  integrations: [mdx()],
});