// Base-path helpers so the site works at any deploy root — `/` for a user/org
// site or custom domain, `/<repo>/` for a GitHub Pages project site — without
// hardcoding the path. `import.meta.env.BASE_URL` is Astro's configured `base`
// (always has a trailing slash; `/` when unset).

const BASE = import.meta.env.BASE_URL.replace(/\/$/, ""); // "" or "/roastbook"

// Prefix an absolute, site-rooted path ("/roasts/methods/") with the base.
// Pass-through for external URLs, anchors, and already-prefixed paths.
export function withBase(path: string): string {
  if (/^(https?:)?\/\/|^(mailto:|tel:|#)/.test(path)) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  if (BASE && (p === BASE || p.startsWith(`${BASE}/`))) return p; // idempotent
  return `${BASE}${p}`;
}

// Rewrite root-relative href/src links inside rendered markdown (roast notes,
// playbooks) so links authored as "/roasts/..." resolve under the base. Skips
// protocol-relative ("//cdn") and absolute URLs. No-op when base is "/".
export function withBaseHtml(html: string): string {
  if (!BASE) return html;
  return html.replace(
    /\b(href|src)="\/(?!\/)/g,
    (_m, attr) => `${attr}="${BASE}/`,
  );
}
