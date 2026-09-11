"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TActionWithOptionalArgs } from ".";
import { getDefaultShortcuts } from ".";
import { isTypableDOMElement } from "../utils/browser";
import { isAppleDevice } from "../utils/platform";
import type {
  Key,
  KeybindingConfig,
  ModifierKeys,
  ShortcutKey,
} from "./keybinding";
import { isKey } from "./keybinding";
import { runMigrations, CURRENT_VERSION } from "./keybindings/migrations";

export interface KeybindingConflict {
  key: ShortcutKey;
  existingAction: TActionWithOptionalArgs;
  newAction: TActionWithOptionalArgs;
}

interface KeybindingsState {
  keybindings: Map<ShortcutKey, TActionWithOptionalArgs>;
  isCustomized: boolean;
  overlayDepth: number;
  openOverlayIds: string[];
  isLoadingProject: boolean;
  isRecording: boolean;

  updateKeybinding: (params: {
    key: ShortcutKey;
    action: TActionWithOptionalArgs;
  }) => void;
  removeKeybinding: (key: ShortcutKey) => void;
  resetToDefaults: () => void;
  importKeybindings: (config: KeybindingConfig) => void;
  exportKeybindings: () => Record<string, TActionWithOptionalArgs>;
  openOverlay: (overlayId: string) => void;
  closeOverlay: (overlayId: string) => void;
  setLoadingProject: (loading: boolean) => void;
  setIsRecording: (isRecording: boolean) => void;
  validateKeybinding: (params: {
    key: ShortcutKey;
    action: TActionWithOptionalArgs;
  }) => KeybindingConflict | null;
  getKeybindingsForAction: (action: TActionWithOptionalArgs) => ShortcutKey[];
  getKeybindingString: (ev: KeyboardEvent) => ShortcutKey | null;
}

type PersistedState = {
  keybindings: Record<string, TActionWithOptionalArgs>;
  isCustomized: boolean;
};

function isDOMElement(element: EventTarget | null): element is HTMLElement {
  return element instanceof HTMLElement;
}

function isPersistedState(value: unknown): value is PersistedState {
  if (!value || typeof value !== "object") return false;
  if (!("keybindings" in value) || !("isCustomized" in value)) return false;
  const { keybindings, isCustomized } = value;
  return (
    typeof keybindings === "object" &&
    keybindings !== null &&
    typeof isCustomized === "boolean"
  );
}

export const useKeybindingsStore = create<KeybindingsState>()(
  persist(
    (set, get) => ({
      keybindings: getDefaultShortcuts(),
      isCustomized: false,
      overlayDepth: 0,
      openOverlayIds: [],
      isLoadingProject: false,
      isRecording: false,

      openOverlay: (overlayId) =>
        set((s) => {
          const openOverlayIds = s.openOverlayIds.includes(overlayId)
            ? s.openOverlayIds
            : [...s.openOverlayIds, overlayId];
          return {
            openOverlayIds,
            overlayDepth: openOverlayIds.length,
          };
        }),
      closeOverlay: (overlayId) =>
        set((s) => {
          const openOverlayIds = s.openOverlayIds.filter(
            (id) => id !== overlayId,
          );
          return {
            openOverlayIds,
            overlayDepth: openOverlayIds.length,
          };
        }),
      setLoadingProject: (loading) => {
        set({ isLoadingProject: loading });
      },

      updateKeybinding: ({ key, action }) => {
        set((state) => {
          const next = new Map(state.keybindings);
          next.set(key, action);
          return {
            keybindings: next,
            isCustomized: true,
          };
        });
      },

      removeKeybinding: (key) => {
        set((state) => {
          const next = new Map(state.keybindings);
          next.delete(key);
          return {
            keybindings: next,
            isCustomized: true,
          };
        });
      },

      resetToDefaults: () => {
        set({
          keybindings: getDefaultShortcuts(),
          isCustomized: false,
        });
      },

      importKeybindings: (config) => {
        const next = new Map<ShortcutKey, TActionWithOptionalArgs>();
        for (const [key, action] of Object.entries(config)) {
          if (typeof key !== "string" || key.length === 0) {
            throw new Error(`Invalid key format: ${key}`);
          }
          if (action !== undefined) {
            // Public type's keys are `ShortcutKey`; trust the caller's typing.
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            next.set(key as ShortcutKey, action);
          }
        }
        set({
          keybindings: next,
          isCustomized: true,
        });
      },

      exportKeybindings: () => {
        return Object.fromEntries(get().keybindings);
      },

      validateKeybinding: ({ key, action }) => {
        const existingAction = get().keybindings.get(key);
        if (existingAction && existingAction !== action) {
          return {
            key,
            existingAction,
            newAction: action,
          };
        }
        return null;
      },
      setIsRecording: (isRecording) => {
        set({ isRecording });
      },

      getKeybindingsForAction: (action) => {
        const result: ShortcutKey[] = [];
        for (const [key, mapped] of get().keybindings) {
          if (mapped === action) result.push(key);
        }
        return result;
      },

      getKeybindingString: (ev) => generateKeybindingString(ev),
    }),
    {
      name: "opencut-keybindings",
      version: CURRENT_VERSION,
      partialize: (state): PersistedState => ({
        keybindings: Object.fromEntries(state.keybindings),
        isCustomized: state.isCustomized,
      }),
      migrate: (persisted, version) =>
        runMigrations({ state: persisted, fromVersion: version }),
      merge: (persisted, current) => {
        if (!isPersistedState(persisted)) return current;
        const entries = Object.entries(persisted.keybindings);
        // Persistence boundary: keys are normalized by the migration chain.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const typedEntries = entries as Array<
          [ShortcutKey, TActionWithOptionalArgs]
        >;
        return {
          ...current,
          keybindings: new Map(typedEntries),
          isCustomized: persisted.isCustomized,
        };
      },
    },
  ),
);

function generateKeybindingString(ev: KeyboardEvent): ShortcutKey | null {
  const target = ev.target;
  const modifierKey = getActiveModifier(ev);
  const key = getPressedKey(ev);
  if (!key) return null;

  if (modifierKey) {
    if (
      modifierKey === "shift" &&
      isDOMElement(target) &&
      isTypableDOMElement({ element: target })
    ) {
      return null;
    }

    return `${modifierKey}+${key}`;
  }

  if (isDOMElement(target) && isTypableDOMElement({ element: target })) {
    return null;
  }

  return key;
}

function getPressedKey(ev: KeyboardEvent): Key | null {
  const raw = (ev.key ?? "").toLowerCase();
  const code = ev.code ?? "";

  if (code === "Space" || raw === " " || raw === "spacebar" || raw === "space")
    return "space";

  if (raw === "arrowup") return "up";
  if (raw === "arrowdown") return "down";
  if (raw === "arrowleft") return "left";
  if (raw === "arrowright") return "right";

  if (code.startsWith("Key")) {
    const letter = code.slice(3).toLowerCase();
    if (isKey(letter)) return letter;
  }

  // Use physical key position for AZERTY and other non-QWERTY layouts.
  if (code.startsWith("Digit")) {
    const digit = code.slice(5);
    if (isKey(digit)) return digit;
  }

  if (isKey(raw)) return raw;
  return null;
}

function getActiveModifier(ev: KeyboardEvent): ModifierKeys | null {
  const ctrl = isAppleDevice() ? ev.metaKey : ev.ctrlKey;
  const alt = ev.altKey;
  const shift = ev.shiftKey;

  if (ctrl && alt && shift) return "ctrl+alt+shift";
  if (ctrl && alt) return "ctrl+alt";
  if (ctrl && shift) return "ctrl+shift";
  if (alt && shift) return "alt+shift";
  if (ctrl) return "ctrl";
  if (alt) return "alt";
  if (shift) return "shift";
  return null;
}
