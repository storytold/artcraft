import { beforeEach, describe, expect, it } from "vitest";
import { useKeybindsStore } from "./keybinds-store";
import {
  bindingFromEvent,
  bindingMatchesEvent,
  bindingsEqual,
} from "./matcher";
import { BASE_BINDINGS } from "./presets";

const reset = () =>
  useKeybindsStore.setState({ selectedPreset: "gamer", overrides: {} });

const store = () => useKeybindsStore.getState();

describe("keybinds-store", () => {
  beforeEach(reset);

  describe("resolution", () => {
    it("gamer preset reproduces BASE bindings", () => {
      expect(store().resolveBindings("pagescene.transform.translate")).toEqual(
        BASE_BINDINGS["pagescene.transform.translate"],
      );
      expect(store().resolveBindings("pagescene.camera.forward")).toEqual([
        { code: "KeyW" },
      ]);
    });

    it("blender preset overrides 3D transform keys but leaves base untouched", () => {
      store().setPreset("blender");
      expect(store().resolveBindings("pagescene.transform.translate")).toEqual([
        { code: "KeyG" },
      ]);
      expect(store().resolveBindings("pagescene.transform.scale")).toEqual([
        { code: "KeyS" },
      ]);
      // Not in the preset delta → falls through to BASE.
      expect(store().resolveBindings("pagescene.camera.forward")).toEqual([
        { code: "KeyW" },
      ]);
    });

    it("user override takes precedence over the preset", () => {
      store().setPreset("blender");
      store().setBinding("pagescene.transform.translate", [{ code: "KeyM" }]);
      expect(store().resolveBindings("pagescene.transform.translate")).toEqual([
        { code: "KeyM" },
      ]);
    });
  });

  describe("reset", () => {
    it("resetAction drops the override back to the preset value", () => {
      store().setBinding("pagescene.transform.translate", [{ code: "KeyM" }]);
      store().resetAction("pagescene.transform.translate");
      expect(store().resolveBindings("pagescene.transform.translate")).toEqual([
        { code: "KeyT" },
      ]);
    });

    it("resetAll clears overrides but keeps the preset", () => {
      store().setPreset("blender");
      store().setBinding("pagescene.transform.rotate", [{ code: "KeyM" }]);
      store().resetAll();
      expect(store().selectedPreset).toBe("blender");
      expect(store().overrides).toEqual({});
    });

    it("resetToPresetDefault clears overrides and returns to gamer", () => {
      store().setPreset("blender");
      store().setBinding("pagescene.transform.rotate", [{ code: "KeyM" }]);
      store().resetToPresetDefault();
      expect(store().selectedPreset).toBe("gamer");
      expect(store().overrides).toEqual({});
    });
  });

  describe("conflicts", () => {
    it("detects a same-surface binding already in use", () => {
      // KeyR is rotate in the gamer preset; binding it elsewhere conflicts.
      const conflicts = store().findConflicts("pagescene.transform.scale", {
        code: "KeyR",
      });
      expect(conflicts).toContain("pagescene.transform.rotate");
    });

    it("does not report a conflict for an unused key", () => {
      expect(
        store().findConflicts("pagescene.transform.scale", { code: "KeyM" }),
      ).toEqual([]);
    });
  });
});

describe("matcher", () => {
  it("treats ctrl and meta interchangeably", () => {
    const binding = { code: "KeyZ", ctrl: true };
    const ctrlEvent = new KeyboardEvent("keydown", { code: "KeyZ", ctrlKey: true });
    const metaEvent = new KeyboardEvent("keydown", { code: "KeyZ", metaKey: true });
    expect(bindingMatchesEvent(binding, ctrlEvent)).toBe(true);
    expect(bindingMatchesEvent(binding, metaEvent)).toBe(true);
  });

  it("requires exact modifier match", () => {
    const binding = { code: "KeyZ", ctrl: true };
    const shiftedEvent = new KeyboardEvent("keydown", {
      code: "KeyZ",
      ctrlKey: true,
      shiftKey: true,
    });
    expect(bindingMatchesEvent(binding, shiftedEvent)).toBe(false);
  });

  it("matches by physical code, not produced character", () => {
    const binding = { code: "KeyW" };
    const event = new KeyboardEvent("keydown", { code: "KeyW", key: "z" });
    expect(bindingMatchesEvent(binding, event)).toBe(true);
  });

  it("bindingFromEvent ignores bare modifier presses", () => {
    expect(
      bindingFromEvent(new KeyboardEvent("keydown", { code: "ShiftLeft" })),
    ).toBeNull();
  });

  it("bindingFromEvent captures modifiers + code", () => {
    const b = bindingFromEvent(
      new KeyboardEvent("keydown", { code: "KeyD", ctrlKey: true }),
    );
    expect(b && bindingsEqual(b, { code: "KeyD", ctrl: true })).toBe(true);
  });
});
