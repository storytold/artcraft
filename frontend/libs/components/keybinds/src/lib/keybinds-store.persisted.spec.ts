import { beforeEach, describe, expect, it } from "vitest";
import { useKeybindsStore } from "./keybinds-store";
import { BASE_BINDINGS } from "./presets";

// Spec for loading the saved keybinds from localStorage. The saved value can be stale or damaged (a preset that no
// longer exists after a downgrade, a hand-edited or half-written entry), and every key press resolves its bindings
// through this store, so a bad saved value must fall back to the defaults instead of throwing.

const KEY = "artcraft-keybinds";

const load = async (state: unknown) => {
  localStorage.setItem(KEY, JSON.stringify({ state, version: 1 }));
  await useKeybindsStore.persist.rehydrate();
};

beforeEach(() => {
  localStorage.clear();
  useKeybindsStore.setState({ selectedPreset: "gamer", overrides: {}, cheatsheetSticky: false });
});

describe("loading saved keybinds", () => {
  it("keeps a valid saved preset and override", async () => {
    await load({ selectedPreset: "blender", overrides: { "pagedraw.tools.select": [{ code: "KeyQ" }] }, cheatsheetSticky: true });
    const store = useKeybindsStore.getState();
    expect(store.selectedPreset).toBe("blender");
    expect(store.resolveBindings("pagedraw.tools.select")).toEqual([{ code: "KeyQ" }]);
    expect(store.cheatsheetSticky).toBe(true);
  });

  it("falls back to the default preset when the saved preset no longer exists", async () => {
    await load({ selectedPreset: "emacs", overrides: {} });
    const store = useKeybindsStore.getState();
    expect(store.selectedPreset).toBe("gamer");
    expect(() => store.resolveBindings("pagescene.camera.forward")).not.toThrow();
    expect(store.resolveBindings("pagescene.camera.forward")).toEqual(BASE_BINDINGS["pagescene.camera.forward"]);
  });

  it("drops overrides that are not a list of bindings, and keeps the good ones", async () => {
    await load({
      selectedPreset: "gamer",
      overrides: {
        "pagedraw.tools.select": "KeyQ",
        "pagedraw.tools.shape": [{ nope: true }],
        "pagedraw.tools.brush": [{ code: "KeyM" }],
      },
    });
    const store = useKeybindsStore.getState();
    expect(() => store.findConflicts("pagedraw.tools.eraser", { code: "KeyZ" })).not.toThrow();
    expect(store.resolveBindings("pagedraw.tools.select")).toEqual(BASE_BINDINGS["pagedraw.tools.select"]);
    expect(store.resolveBindings("pagedraw.tools.shape")).toEqual(BASE_BINDINGS["pagedraw.tools.shape"]);
    expect(store.resolveBindings("pagedraw.tools.brush")).toEqual([{ code: "KeyM" }]);
  });

  it("ignores a saved value that is not an object at all", async () => {
    await load("garbage");
    const store = useKeybindsStore.getState();
    expect(store.selectedPreset).toBe("gamer");
    expect(store.overrides).toEqual({});
  });
});
