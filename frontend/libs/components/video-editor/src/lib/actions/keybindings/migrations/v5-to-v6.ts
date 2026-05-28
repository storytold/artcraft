import { getPersistedKeybindingsState } from "../persisted-state";

export function v5ToV6({ state }: { state: unknown }): unknown {
  const v5 = getPersistedKeybindingsState({ state });
  if (!v5) return state;
  const keybindings = { ...v5.keybindings };

  if (keybindings.escape === "deselect-all") {
    keybindings.escape = "cancel-interaction";
  }

  return { ...v5, keybindings };
}
