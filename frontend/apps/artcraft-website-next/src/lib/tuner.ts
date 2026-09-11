// Live dev tuner (see TUNER.md).
//
// Any module can register a group of numeric tunables with `defineTunables`;
// the TunerPanel renders every registered group with sliders + number inputs,
// and consumers read live values per frame (or subscribe for rebuilds).
// Values persist to localStorage so a refresh keeps the current tuning.
//
// POLICY: every new tweakable constant in this app gets registered here by
// default — adding a slider is free, a missing one costs an iteration.

import { create } from "zustand";

export type TunableDef = {
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
  /** One-liner shown behind the row's ⓘ hover — what the knob actually does. */
  info?: string;
};

export type TunableGroup = {
  id: string;
  title: string;
  order: number;
  defs: Record<string, TunableDef>;
};

type TunerState = {
  groups: Record<string, TunableGroup>;
  /** Sparse overrides, keyed "group.key". Defaults live in the defs. */
  values: Record<string, number>;
  /** Bumped on every change — cheap signal for rebuild subscribers. */
  version: number;
  registerGroup: (
    id: string,
    title: string,
    defs: Record<string, TunableDef>,
  ) => void;
  setValue: (groupId: string, key: string, value: number) => void;
  resetAll: () => void;
  /** Clears overrides for one group only, leaving the rest tuned. */
  resetGroup: (groupId: string) => void;
};

const STORAGE_KEY = "artcraft-tuner";

function loadStored(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function save(values: Record<string, number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  } catch {
    // Storage may be unavailable (private mode); tuning just won't persist.
  }
}

export const useTunerStore = create<TunerState>((set) => ({
  groups: {},
  values: loadStored(),
  version: 0,
  registerGroup: (id, title, defs) =>
    set((s) =>
      s.groups[id]
        ? s
        : {
            groups: {
              ...s.groups,
              [id]: { id, title, order: Object.keys(s.groups).length, defs },
            },
          },
    ),
  setValue: (groupId, key, value) =>
    set((s) => {
      const values = { ...s.values, [`${groupId}.${key}`]: value };
      save(values);
      return { values, version: s.version + 1 };
    }),
  resetAll: () =>
    set((s) => {
      save({});
      return { values: {}, version: s.version + 1 };
    }),
  resetGroup: (groupId) =>
    set((s) => {
      const values: Record<string, number> = {};
      for (const [k, v] of Object.entries(s.values)) {
        if (!k.startsWith(groupId + ".")) values[k] = v;
      }
      save(values);
      return { values, version: s.version + 1 };
    }),
}));

export type TunableReader<T extends Record<string, TunableDef>> = {
  id: string;
  defs: T;
  /** Current values (defaults merged with overrides). Cheap; call per frame. */
  read: () => { [K in keyof T]: number };
};

// Registers a tunable group (once) and returns a typed live reader.
// Call at module scope in the file that owns the constants.
export function defineTunables<T extends Record<string, TunableDef>>(
  id: string,
  title: string,
  defs: T,
): TunableReader<T> {
  useTunerStore.getState().registerGroup(id, title, defs);
  return {
    id,
    defs,
    read: () => {
      const { values } = useTunerStore.getState();
      const out = {} as { [K in keyof T]: number };
      for (const key in defs) {
        const override = values[`${id}.${String(key)}`];
        out[key] = override ?? defs[key].default;
      }
      return out;
    },
  };
}

// One-shot action buttons rendered in the TunerPanel header (e.g. "Replay
// intro" — things that are otherwise hard to debug because they run once).
// Idempotent by label so hot reload doesn't stack duplicates.
export type TunerAction = { label: string; run: () => void };

const actions: TunerAction[] = [];

export function registerTunerAction(label: string, run: () => void): void {
  const existing = actions.find((a) => a.label === label);
  if (existing) existing.run = run;
  else actions.push({ label, run });
}

export function getTunerActions(): TunerAction[] {
  return actions;
}

// Merged snapshot of every registered group — used by the panel's copy
// button so tuned values can be pasted back into code as new defaults.
export function tunerSnapshot(): Record<string, Record<string, number>> {
  const { groups, values } = useTunerStore.getState();
  const out: Record<string, Record<string, number>> = {};
  for (const g of Object.values(groups)) {
    out[g.id] = {};
    for (const key in g.defs) {
      out[g.id][key] = values[`${g.id}.${key}`] ?? g.defs[key].default;
    }
  }
  return out;
}
