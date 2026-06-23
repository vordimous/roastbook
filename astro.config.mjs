import { defineConfig } from "astro/config";

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
});
