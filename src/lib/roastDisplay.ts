// Presentation helpers shared by the index ledger and the roast detail page.
// Pure formatting only — no derived metrics (those live in roastStats.ts).

// Roast-level → swatch color. Keyed by the `target_level` enum in
// content.config.ts; values are the CSS custom properties from tokens.css
// (the roast-level scale — the only browns, used strictly as a data key).
export const LEVEL_COLOR_VAR: Record<string, string> = {
  Light: "var(--level-light)",
  "Light-Medium": "var(--level-med-light)",
  Medium: "var(--level-medium)",
  "Medium-Dark": "var(--level-med-dark)",
  Dark: "var(--level-dark)",
};

export const levelColor = (level?: string | null): string =>
  (level && LEVEL_COLOR_VAR[level]) || "var(--dim)";

export interface ParsedTitle {
  /** Leading roast number, e.g. "015" (kept zero-padded). */
  num: string | null;
  /** Title with the number prefix and trailing "(qualifier)" removed. */
  name: string;
  /** Trailing parenthetical, e.g. "Washed", or null. */
  qualifier: string | null;
}

// "015 — Nicaragua El Quetzal Estate Java (Washed)"
//   → { num: "015", name: "Nicaragua El Quetzal Estate Java", qualifier: "Washed" }
export function parseRoastTitle(title: string): ParsedTitle {
  let num: string | null = null;
  let rest = title.trim();

  const prefix = rest.match(/^(\d+)\s*[—–-]\s*(.*)$/);
  if (prefix) {
    num = prefix[1];
    rest = prefix[2].trim();
  }

  let qualifier: string | null = null;
  const paren = rest.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
  if (paren) {
    rest = paren[1].trim();
    qualifier = paren[2].trim();
  }

  return { num, name: rest, qualifier };
}

// Shorten a verbose process string to its parenthetical when present:
// "Wet Process (Washed)" → "Washed"; "Natural" → "Natural".
export const shortProcess = (p?: string | null): string | null => {
  if (!p) return null;
  const m = p.match(/\(([^)]+)\)/);
  return m ? m[1] : p;
};

// MM-DD for the ledger date column (UTC, matching the ISO dates elsewhere).
export const fmtMonthDay = (d: Date): string =>
  `${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
