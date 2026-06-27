// Derived roast metrics — ported from the Hugo single.html computations.
// Loss %, development time, DTR %, the loss-derived "effective" level, the
// rest / ready-to-drink window, and in-range/under/over badges. All driven by
// the level table in src/data/roast_guidance.yaml (the single source of truth).
import { roastGuidance, type RoastLevel } from "./roastData";

const DAY_MS = 86_400_000;

function parseMmss(s?: string | null): number | null {
  if (!s) return null;
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

function fmtMmss(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

const levelByName = (name: string): RoastLevel | undefined =>
  roastGuidance.levels.find((l) => l.name === name.toLowerCase());

// Effective level derived from measured loss %, so the rest window reflects what
// the bean actually became, not what was aimed for. Boundaries are the midpoints
// between adjacent levels' loss midpoints (13.5 / 14.5 / 16 / 18).
function effectiveLevelName(loss: number): string {
  if (loss >= 18) return "dark";
  if (loss >= 16) return "medium-dark";
  if (loss >= 14.5) return "medium";
  if (loss >= 13.5) return "light-medium";
  return "light";
}

function rangeBadge(val: number, lo: number, hi: number): RangeBadge {
  if (val < lo) return "under";
  if (val > hi) return "over";
  return "ok";
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDate = (d: Date, withYear: boolean) =>
  `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}${withYear ? `, ${d.getUTCFullYear()}` : ""}`;

export type RangeBadge = "ok" | "under" | "over";
export type ReadyStatus = "resting" | "ready" | "past-peak";

export interface Phase {
  name: "Drying" | "Maillard" | "Development";
  mmss: string;
  pct: number;
  target: number;
  badge: RangeBadge;
}

export interface RoastStats {
  hasMeasurements: boolean;
  fc: string | null;
  total: string | null;
  dev: string | null;
  dtrPct: number | null;
  lossPct: number | null;
  targetLevel?: RoastLevel;
  lossBadge?: RangeBadge;
  dtrBadge?: RangeBadge;
  ready?: { text: string; status: ReadyStatus; detail: string };
  /** Drying / Maillard / Development split — present only when dry-end is logged. */
  phases?: Phase[];
}

export interface RoastInput {
  green_weight_g?: number | null;
  roasted_weight_g?: number | null;
  time_to_dry_end?: string | null;
  time_to_fc?: string | null;
  total_time?: string | null;
  target_level?: string | null;
  rating?: number | null;
  date: Date;
}

export function computeRoastStats(d: RoastInput, now: Date = new Date()): RoastStats {
  const green = d.green_weight_g ?? null;
  const roasted = d.roasted_weight_g ?? null;
  const lossPct =
    green && roasted && green > 0 ? round1(((green - roasted) / green) * 100) : null;

  const fcSec = parseMmss(d.time_to_fc);
  const totalSec = parseMmss(d.total_time);
  let dev: string | null = null;
  let dtrPct: number | null = null;
  if (fcSec != null && totalSec != null && totalSec > 0 && totalSec > fcSec) {
    const devSec = totalSec - fcSec;
    dev = fmtMmss(devSec);
    dtrPct = round1((devSec / totalSec) * 100);
  }

  const targetLevel = d.target_level ? levelByName(d.target_level) : undefined;
  const lossBadge =
    lossPct != null && targetLevel
      ? rangeBadge(lossPct, targetLevel.loss_pct[0], targetLevel.loss_pct[1])
      : undefined;
  const dtrBadge =
    dtrPct != null && targetLevel
      ? rangeBadge(dtrPct, targetLevel.dtr_pct[0], targetLevel.dtr_pct[1])
      : undefined;

  const hasMeasurements = lossPct != null || dtrPct != null || d.rating != null;

  let ready: RoastStats["ready"];
  const effLevel = lossPct != null ? levelByName(effectiveLevelName(lossPct)) : targetLevel;
  if (hasMeasurements && effLevel?.rest_days) {
    const [minDays, maxDays] = effLevel.rest_days;
    const from = new Date(d.date.getTime() + minDays * DAY_MS);
    const to = new Date(d.date.getTime() + maxDays * DAY_MS);
    const withYear = from.getUTCFullYear() !== to.getUTCFullYear();
    const text = `${fmtDate(from, withYear)} – ${fmtDate(to, withYear)}`;

    let status: ReadyStatus;
    let detail: string;
    if (now < from) {
      status = "resting";
      const days = Math.floor((from.getTime() - now.getTime()) / DAY_MS);
      detail = `ready in ~${days} day${days === 1 ? "" : "s"}`;
    } else if (now <= to) {
      status = "ready";
      detail = "in peak window";
    } else {
      status = "past-peak";
      const days = Math.floor((now.getTime() - to.getTime()) / DAY_MS);
      detail = `past peak by ~${days} day${days === 1 ? "" : "s"}`;
    }
    ready = { text, status, detail };
  }

  // Phase split (drying / Maillard / development) — needs a logged dry-end and a
  // valid 0 < dryEnd < fc < total ordering.
  let phases: Phase[] | undefined;
  const dryEndSec = parseMmss(d.time_to_dry_end);
  if (
    dryEndSec != null &&
    fcSec != null &&
    totalSec != null &&
    dryEndSec > 0 &&
    dryEndSec < fcSec &&
    fcSec < totalSec
  ) {
    const t = roastGuidance.phase_targets;
    const tol = t.tolerance_pct;
    const mk = (name: Phase["name"], sec: number, target: number): Phase => {
      const pct = round1((sec / totalSec) * 100);
      return { name, mmss: fmtMmss(sec), pct, target, badge: rangeBadge(pct, target - tol, target + tol) };
    };
    phases = [
      mk("Drying", dryEndSec, t.drying),
      mk("Maillard", fcSec - dryEndSec, t.maillard),
      mk("Development", totalSec - fcSec, t.development),
    ];
  }

  return {
    hasMeasurements,
    fc: d.time_to_fc ?? null,
    total: d.total_time ?? null,
    dev,
    dtrPct,
    lossPct,
    targetLevel,
    lossBadge,
    dtrBadge,
    ready,
    phases,
  };
}
