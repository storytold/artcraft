// Single source of truth for moodboard keyboard shortcuts. Consumed by
// `ShortcutCheatsheet.tsx` (rendering) and indirectly by
// `useKeyboardShortcuts.ts` (wiring). The `keys` array is the label shown
// to the user; the actual matching logic lives in the hook because some
// shortcuts are modifier-sensitive and platform-specific.

export interface ShortcutRow {
  label: string;
  keys: string[];
  section: "Tools" | "Selection" | "Editing" | "Viewport" | "History";
}

const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iPod|iPhone|iPad/.test(navigator.platform);

export const MOD = isMac ? "⌘" : "Ctrl";

// Renders a key combo as a compact tooltip label. Mac uses adjacent symbols
// (⌘⇧Z); other platforms use "+" separators (Ctrl+Shift+Z). Pass keys in
// order, e.g. [MOD, "Shift", "Z"].
export const fmtShortcut = (keys: string[]): string =>
  isMac
    ? keys.map((k) => (k === "Shift" ? "⇧" : k)).join("")
    : keys.join("+");

export const SHORTCUTS: ShortcutRow[] = [
  // Tools
  { section: "Tools", label: "Select tool", keys: ["V"] },
  { section: "Tools", label: "Lasso tool", keys: ["L"] },
  { section: "Tools", label: "Text tool", keys: ["T"] },

  // Selection
  { section: "Selection", label: "Select all", keys: [MOD, "A"] },
  { section: "Selection", label: "Clear selection", keys: ["Esc"] },
  { section: "Selection", label: "Add / remove from selection", keys: ["Shift", "Click"] },

  // Editing
  { section: "Editing", label: "Delete selection", keys: ["Delete"] },
  { section: "Editing", label: "Group selection", keys: [MOD, "G"] },
  { section: "Editing", label: "Ungroup selection", keys: [MOD, "Shift", "G"] },
  { section: "Editing", label: "Paste image", keys: [MOD, "V"] },

  // Viewport
  { section: "Viewport", label: "Pan", keys: ["Middle-click", "drag"] },
  { section: "Viewport", label: "Pan (alt)", keys: ["Space", "drag"] },
  { section: "Viewport", label: "Zoom", keys: ["Scroll"] },
  { section: "Viewport", label: "Reset zoom", keys: [MOD, "0"] },
  { section: "Viewport", label: "Zoom to fit", keys: ["Shift", "1"] },

  // History
  { section: "History", label: "Undo", keys: [MOD, "Z"] },
  { section: "History", label: "Redo", keys: [MOD, "Shift", "Z"] },
];
