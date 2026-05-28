export type PersistedKeybindingConfig = Record<string, string | undefined>;

export interface PersistedKeybindingsState {
  keybindings: PersistedKeybindingConfig;
  isCustomized: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getPersistedKeybindingsState({
  state,
}: {
  state: unknown;
}): PersistedKeybindingsState | null {
  if (!isRecord(state)) return null;

  const { keybindings, isCustomized } = state;
  if (!isRecord(keybindings) || typeof isCustomized !== "boolean") {
    return null;
  }

  const normalizedKeybindings: PersistedKeybindingConfig = {};
  for (const [key, action] of Object.entries(keybindings)) {
    if (action !== undefined && typeof action !== "string") {
      return null;
    }

    normalizedKeybindings[key] = action as string | undefined;
  }

  return {
    keybindings: normalizedKeybindings,
    isCustomized,
  };
}
