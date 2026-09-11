"use client";

import { useMemo } from "react";
import { useKeybindingsStore } from "./keybindings-store";
import { ACTIONS, type TActionWithOptionalArgs } from ".";
import {
  getPlatformAlternateKey,
  getPlatformSpecialKey,
} from "../utils/platform";

export interface KeyboardShortcut {
  id: string;
  keys: string[];
  description: string;
  category: string;
  action: TActionWithOptionalArgs;
  icon?: React.ReactNode;
}

function formatKey({ key }: { key: string }): string {
  return key
    .replace("ctrl", getPlatformSpecialKey())
    .replace("alt", getPlatformAlternateKey())
    .replace("shift", "Shift")
    .replace("left", "←")
    .replace("right", "→")
    .replace("up", "↑")
    .replace("down", "↓")
    .replace("space", "Space")
    .replace("home", "Home")
    .replace("enter", "Enter")
    .replace("end", "End")
    .replace("delete", "Delete")
    .replace("backspace", "Backspace")
    .replace("-", "+");
}

export function useKeyboardShortcutsHelp() {
  const { keybindings } = useKeybindingsStore();

  const shortcuts = useMemo(() => {
    const actionToKeys = new Map<TActionWithOptionalArgs, string[]>();

    for (const [key, action] of keybindings) {
      const existing = actionToKeys.get(action);
      if (existing) {
        existing.push(formatKey({ key }));
      } else {
        actionToKeys.set(action, [formatKey({ key })]);
      }
    }

    const result: KeyboardShortcut[] = [];
    for (const [action, keys] of actionToKeys) {
      const actionDef = ACTIONS[action];
      if (!actionDef) continue;
      result.push({
        id: action,
        keys,
        description: actionDef.description,
        category: actionDef.category,
        action,
      });
    }

    return result.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.description.localeCompare(b.description);
    });
  }, [keybindings]);

  return {
    shortcuts,
  };
}
