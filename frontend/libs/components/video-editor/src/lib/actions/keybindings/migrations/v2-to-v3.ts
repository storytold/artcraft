import { getPersistedKeybindingsState } from "../persisted-state";

export function v2ToV3({ state }: { state: unknown }): unknown {
  const v2 = getPersistedKeybindingsState({ state });
  if (!v2) return state;

  const renames: Record<string, string> = {
    "split-selected": "split",
    "split-selected-left": "split-left",
    "split-selected-right": "split-right",
  };

  const migrated = { ...v2.keybindings };
  for (const [key, action] of Object.entries(migrated)) {
    const renamedAction = action ? renames[action] : undefined;
    if (renamedAction) {
      migrated[key] = renamedAction;
    }
  }

  return { ...v2, keybindings: migrated };
}
