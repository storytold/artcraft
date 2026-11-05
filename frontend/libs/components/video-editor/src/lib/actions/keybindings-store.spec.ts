import { describe, expect, it } from "vitest";
import { getDefaultShortcuts } from ".";
import { useKeybindingsStore } from "./keybindings-store";

describe("keybindings store merge", () => {
  it("uses the current defaults when the saved map was never customized", () => {
    const merge = useKeybindingsStore.persist.getOptions().merge;
    const defaults = getDefaultShortcuts();
    const [firstKey] = [...defaults.keys()];
    const stale = Object.fromEntries(defaults);
    // An older release saved its defaults without this shortcut.
    delete stale[firstKey];

    const merged = merge?.(
      { keybindings: stale, isCustomized: false },
      useKeybindingsStore.getState(),
    ) as { keybindings: Map<string, string> };

    expect(merged.keybindings.get(firstKey)).toBe(defaults.get(firstKey));
  });

  it("keeps the saved map when the user customized it", () => {
    const merge = useKeybindingsStore.persist.getOptions().merge;
    const merged = merge?.(
      { keybindings: { x: "split" }, isCustomized: true },
      useKeybindingsStore.getState(),
    ) as { keybindings: Map<string, string> };

    expect(merged.keybindings.get("x")).toBe("split");
    expect(merged.keybindings.size).toBe(1);
  });
});
