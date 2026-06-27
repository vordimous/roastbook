// Build-time loader for the roasting reference data. The YAML files in
// src/data are the single source of truth for the guide tables (and will feed
// the computed roast-stats layer later).
import { readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";

// Resolve from the project root (stable in dev and build) rather than
// import.meta.url, which moves when Astro bundles this module into dist/.
const read = (rel: string): unknown =>
  parse(readFileSync(path.resolve(process.cwd(), rel), "utf8"));

export interface RoastLevel {
  name: string;
  loss_pct: [number, number];
  dtr_pct: [number, number];
  rest_days: [number, number];
  drop_temp_f: [number, number];
  drop: string;
  flavor: string;
}

// Bean-temperature landmark for a phase transition. BEAN temps, not the Behmor's
// chamber A/B reading — see the header comment in roast_guidance.yaml.
export interface PhaseTemp {
  event: string;
  bean_c: [number, number];
  bean_f: [number, number];
  note: string;
}

export interface RoastFormula {
  name: string;
  formula: string;
  purpose: string;
}

export interface PhaseTargets {
  drying: number;
  maillard: number;
  development: number;
  tolerance_pct: number;
}

export const roastGuidance = read("src/data/roast_guidance.yaml") as {
  levels: RoastLevel[];
  formulas: RoastFormula[];
  phase_targets: PhaseTargets;
  phase_temps: PhaseTemp[];
};

export interface AutoProfile {
  id: string;
  bean_type: string;
  origins: string[];
  notes: string;
}

export interface ManualPower {
  id: string;
  power_pct: number;
  use: string;
  warning?: string;
  post_fc_ok: boolean;
}

export interface WeightSetting {
  label: string;
  setting: string;
  program_time: string;
  shutoff_elapsed: string;
  note: string;
}

export const behmor = read("src/data/machines/behmor_2000_ab_plus.yaml") as {
  name: string;
  auto_mode_profiles: AutoProfile[];
  manual_mode_powers: ManualPower[];
  weight_settings: WeightSetting[];
};

export interface Poppo {
  name: string;
  observed_baselines: Record<string, unknown>;
  high_score_targets: {
    origin: string;
    score: number;
    fc: string;
    total: string;
    loss_pct: string;
  }[];
  preferred_cup: { favored: string[]; disfavored: string[] };
  weight_settings: { label: string; setting: string; program_time: string; note: string }[];
  preheat: { instruction: string };
  safety: {
    between_roasts_note: string;
    past_2c_warning: string;
    generic_air_popper_notes: string[];
  };
  cooling: { method: string; note: string };
  provenance: { source: string; caveat: string };
}

export const poppo = read("src/data/machines/poppo.yaml") as Poppo;
