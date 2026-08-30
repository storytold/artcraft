import { useMemo } from "react";
import { useKeybindsStore } from "./keybinds-store";
import { ACTIONS_BY_SURFACE } from "./registry";
import { BASE_BINDINGS, PRESETS } from "./presets";
import { bindingMatchesEvent } from "./matcher";
import { ActionId, Binding, PresetId, Surface } from "./types";

export interface ResolvedKeybinds {
  selectedPreset: PresetId;
  /** Current bindings for an action (override → preset → base). */
  forAction: (id: ActionId) => Binding[];
  /** First action on `surface` whose binding matches the event, or null. */
  matchAction: (e: KeyboardEvent, surface: Surface) => ActionId | null;
  /** Map of every action on `surface` to its resolved bindings. */
  slotBindings: (surface: Surface) => Record<ActionId, Binding[]>;
}

// Subscribes to preset + overrides and returns memoized resolvers. The returned
// object's identity changes whenever bindings change, so engine hooks that list
// it in a dependency array re-attach with the new bindings.
export function useResolvedKeybinds(): ResolvedKeybinds {
  const selectedPreset = useKeybindsStore((s) => s.selectedPreset);
  const overrides = useKeybindsStore((s) => s.overrides);

  return useMemo(() => {
    const forAction = (id: ActionId): Binding[] =>
      overrides[id] ?? PRESETS[selectedPreset].bindings[id] ?? BASE_BINDINGS[id] ?? [];

    const matchAction = (e: KeyboardEvent, surface: Surface): ActionId | null => {
      for (const action of ACTIONS_BY_SURFACE[surface]) {
        if (forAction(action.id).some((bd) => bindingMatchesEvent(bd, e))) {
          return action.id;
        }
      }
      return null;
    };

    const slotBindings = (surface: Surface): Record<ActionId, Binding[]> => {
      const out: Record<ActionId, Binding[]> = {};
      for (const action of ACTIONS_BY_SURFACE[surface]) {
        out[action.id] = forAction(action.id);
      }
      return out;
    };

    return { selectedPreset, forAction, matchAction, slotBindings };
  }, [selectedPreset, overrides]);
}
