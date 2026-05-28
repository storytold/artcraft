import { getPersistedKeybindingsState } from "../persisted-state";

export function v3ToV4({ state }: { state: unknown }): unknown {
  const v3 = getPersistedKeybindingsState({ state });
  if (!v3) return state;

  const renames: Record<string, string> = {
    "paste-selected": "paste-copied",
  };

  const migrated = { ...v3.keybindings };
  for (const [key, action] of Object.entries(migrated)) {
    const renamedAction = action ? renames[action] : undefined;
    if (renamedAction) {
      migrated[key] = renamedAction;
    }
  }

  return { ...v3, keybindings: migrated };
}
