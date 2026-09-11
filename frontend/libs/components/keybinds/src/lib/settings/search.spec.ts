import { describe, expect, it } from "vitest";
import { actionMatchesQuery, groupActions } from "./search";
import { ActionDef, Binding } from "../types";

const action = (
  label: string,
  group: ActionDef["group"] = "Transform",
): ActionDef => ({
  id: `pagescene.transform.${label}`,
  label,
  group,
  surface: "pagescene",
});

describe("actionMatchesQuery", () => {
  describe("by name", () => {
    it("matches a case-insensitive label substring", () => {
      expect(actionMatchesQuery(action("Rotate"), [], "rot")).toBe(true);
      expect(actionMatchesQuery(action("Rotate"), [], "ROTA")).toBe(true);
    });

    it("matches the group name", () => {
      expect(actionMatchesQuery(action("Scale", "Transform"), [], "transform")).toBe(
        true,
      );
    });

    it("requires every whitespace-separated term", () => {
      const a = action("Camera up", "Camera");
      expect(actionMatchesQuery(a, [], "camera up")).toBe(true);
      expect(actionMatchesQuery(a, [], "camera down")).toBe(false);
    });

    it("returns true for an empty query", () => {
      expect(actionMatchesQuery(action("Anything"), [], "   ")).toBe(true);
    });
  });

  describe("by key", () => {
    const ctrlZ: Binding = { code: "KeyZ", ctrl: true };
    const shiftD: Binding = { code: "KeyD", shift: true };

    it("matches a bare letter against a binding", () => {
      expect(actionMatchesQuery(action("Scale"), [{ code: "KeyS" }], "s")).toBe(true);
    });

    it("matches a modifier combo written with +", () => {
      expect(actionMatchesQuery(action("Undo"), [ctrlZ], "ctrl+z")).toBe(true);
    });

    it("matches cross-platform modifier synonyms (cmd → ctrl)", () => {
      expect(actionMatchesQuery(action("Undo"), [ctrlZ], "cmd z")).toBe(true);
    });

    it("matches a shifted letter contiguously", () => {
      expect(actionMatchesQuery(action("Duplicate"), [shiftD], "shiftd")).toBe(true);
    });

    it("matches named keys by synonym", () => {
      expect(
        actionMatchesQuery(action("Clear"), [{ code: "Escape" }], "esc"),
      ).toBe(true);
      expect(
        actionMatchesQuery(action("Up"), [{ code: "ArrowUp" }], "arrow"),
      ).toBe(true);
    });

    it("matches numpad and its digit mirror", () => {
      const camFwd = action("Camera forward", "Camera");
      expect(actionMatchesQuery(camFwd, [{ code: "Numpad8" }], "numpad8")).toBe(true);
      expect(actionMatchesQuery(camFwd, [{ code: "Numpad8" }], "num8")).toBe(true);
    });

    it("does not match an unrelated key", () => {
      expect(actionMatchesQuery(action("Scale"), [{ code: "KeyS" }], "q")).toBe(
        false,
      );
    });
  });
});

describe("groupActions", () => {
  it("buckets actions by group preserving first-seen order", () => {
    const actions = [
      action("a", "Camera"),
      action("b", "Transform"),
      action("c", "Camera"),
    ];
    const grouped = groupActions(actions);
    expect(grouped.map((g) => g.group)).toEqual(["Camera", "Transform"]);
    expect(grouped[0].actions.map((a) => a.label)).toEqual(["a", "c"]);
    expect(grouped[1].actions.map((a) => a.label)).toEqual(["b"]);
  });
});
