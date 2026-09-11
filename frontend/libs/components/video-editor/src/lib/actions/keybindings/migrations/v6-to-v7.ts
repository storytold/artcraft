import { getPersistedKeybindingsState } from "../persisted-state";

export function v6ToV7({ state }: { state: unknown }): unknown {
  const v6 = getPersistedKeybindingsState({ state });
  if (!v6) return state;
  const keybindings = { ...v6.keybindings };

  for (const [key, action] of Object.entries(keybindings)) {
    if (action === "split-element") {
      keybindings[key] = "split";
    }
  }

  return { ...v6, keybindings };
}
