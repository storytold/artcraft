import { getPersistedKeybindingsState } from "../persisted-state";

export function v4ToV5({ state }: { state: unknown }): unknown {
  const v4 = getPersistedKeybindingsState({ state });
  if (!v4) return state;
  const keybindings = { ...v4.keybindings };

  if (!keybindings.escape) {
    keybindings.escape = "deselect-all";
  }

  return { ...v4, keybindings };
}
