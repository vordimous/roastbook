import { defineConfig } from "astro/config";

import mdx from "@astrojs/mdx";

// Deploy config is env-driven so a fork needs zero edits here. The GitHub Pages
// workflow (.github/workflows/deploy.yml) derives both from the repo at build
// time, so `you/your-roastbook` serves correctly at /your-roastbook/ with no
// hardcoded paths. Locally (and for user/org sites or custom domains) both fall
// back to root.
//   BASE_PATH — sub-path the site is served under, e.g. "/roastbook" (default "/")
//   SITE_URL  — absolute origin, e.g. "https://you.github.io" (canonical/sitemap)
const base = process.env.BASE_PATH || "/";
const site = process.env.SITE_URL || undefined;

// Prefix root-relative links ("/roasts/...") in Markdown/MDX pages with the
// deploy base so cross-links and back-links survive a project-site sub-path.
// Astro rewrites its own asset URLs for `base`, but not authored link hrefs.
// .astro components use withBase() from src/lib/url.ts instead.
const basePrefix = base === "/" ? "" : base.replace(/\/$/, "");
function rehypeBasePath() {
  return (tree) => {
    const visit = (node) => {
      if (node.type === "element" && node.properties) {
        for (const attr of ["href", "src"]) {
          const v = node.properties[attr];
          if (typeof v === "string" && v.startsWith("/") && !v.startsWith("//")) {
            node.properties[attr] = basePrefix + v;
          }
        }
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}

export default defineConfig({
  site,
  base,

  markdown: {
    // mdx() inherits the base Markdown config by default, so this covers both
    // .md and .mdx pages.
    rehypePlugins: basePrefix ? [rehypeBasePath] : [],
  },

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
