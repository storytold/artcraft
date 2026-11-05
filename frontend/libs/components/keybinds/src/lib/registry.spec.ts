import { describe, expect, it } from "vitest";
import {
  bindingHasModifier,
  bindingKey,
  isEventFromEditableElement,
} from "./matcher";
import { BASE_BINDINGS, PRESETS } from "./presets";
import {
  ACTIONS,
  ACTIONS_BY_SURFACE,
  actionAvailable,
  actionsCoAvailable,
  getAction,
} from "./registry";
import { KeybindContext, Surface } from "./types";

// Spec for the action registry, the preset tables that bind to it, and the small matcher helpers that
// keybinds-store.spec.ts does not cover. The two tables are plain objects keyed by action id, so a typo in either one
// compiles fine and only shows up as a shortcut that silently does nothing; these tests catch that.

const BUILD: KeybindContext = { sceneMode: "build", encoding: false };
const RECORD: KeybindContext = { sceneMode: "record", encoding: false };
const ENCODING: KeybindContext = { sceneMode: "build", encoding: true };

const SURFACES: Surface[] = ["global", "pagescene", "pagedraw", "moodboard", "moodboard-grid"];

describe("registry and bindings agree", () => {
  it("every action is bound by the defaults or by at least one preset", () => {
    // Grab is deliberately unbound in the default scheme (G is scale there) and bound only by the Blender preset.
    const bound = (id: string) =>
      !!BASE_BINDINGS[id]?.length || Object.values(PRESETS).some((preset) => !!preset.bindings[id]?.length);
    expect(Object.keys(ACTIONS).filter((id) => !bound(id))).toEqual([]);
  });

  it("every default binding belongs to a registered action", () => {
    const unknown = Object.keys(BASE_BINDINGS).filter((id) => !ACTIONS[id]);
    expect(unknown).toEqual([]);
  });

  it.each(Object.keys(PRESETS))("the %s preset only overrides registered actions", (presetId) => {
    const unknown = Object.keys(PRESETS[presetId as keyof typeof PRESETS].bindings).filter((id) => !ACTIONS[id]);
    expect(unknown).toEqual([]);
  });

  it("action ids are unique and getAction finds each one", () => {
    const total = SURFACES.reduce((sum, surface) => sum + ACTIONS_BY_SURFACE[surface].length, 0);
    expect(total).toBe(Object.keys(ACTIONS).length);
    for (const id of Object.keys(ACTIONS)) expect(getAction(id)?.id).toBe(id);
    expect(getAction("no.such.action")).toBeUndefined();
  });

  it("each action's surface matches the prefix of its id", () => {
    for (const def of Object.values(ACTIONS)) {
      const prefix = def.id.split(".")[0];
      const expected = ["global", "pagedraw", "moodboard", "moodboard-grid"].includes(prefix) ? prefix : "pagescene";
      expect(def.surface).toBe(expected);
    }
  });

  it("held camera actions have no modifier on any default binding", () => {
    for (const def of Object.values(ACTIONS).filter((d) => d.continuous)) {
      for (const binding of BASE_BINDINGS[def.id] ?? []) expect(bindingHasModifier(binding)).toBe(false);
    }
  });
});

describe("availability", () => {
  it("an action with no gate is available unless an encode is running", () => {
    const def = ACTIONS["pagedraw.tools.select"];
    expect(def.when).toBeUndefined();
    expect(actionAvailable(def, BUILD)).toBe(true);
    expect(actionAvailable(def, ENCODING)).toBe(false);
  });

  it("camera movement is live in build mode and dead in record mode and during an encode", () => {
    const def = ACTIONS["pagescene.camera.forward"];
    expect(actionAvailable(def, BUILD)).toBe(true);
    expect(actionAvailable(def, RECORD)).toBe(false);
    expect(actionAvailable(def, ENCODING)).toBe(false);
  });

  it("the look arrows yield to the timeline while it is expanded", () => {
    const def = ACTIONS["pagescene.camera.pitchUp"];
    expect(actionAvailable(def, BUILD)).toBe(true);
    expect(actionAvailable(def, { ...BUILD, timelineExpanded: true })).toBe(false);
    expect(actionAvailable(ACTIONS["pagescene.camera.forward"], { ...BUILD, timelineExpanded: true })).toBe(true);
  });

  it("the timeline transport is live in the expanded editor and in record mode, but never during an encode", () => {
    const def = ACTIONS["pagescene.timeline.playPause"];
    expect(actionAvailable(def, BUILD)).toBe(false);
    expect(actionAvailable(def, { ...BUILD, timelineExpanded: true })).toBe(true);
    expect(actionAvailable(def, RECORD)).toBe(true);
    expect(actionAvailable(def, { ...RECORD, encoding: true })).toBe(false);
  });
});

describe("co-availability", () => {
  it("a camera key and a timeline key that share a binding are never live together", () => {
    // Space, ArrowLeft and ArrowRight are shared between the camera/viewport and the timeline on purpose.
    expect(actionsCoAvailable(ACTIONS["pagescene.camera.yawLeft"], ACTIONS["pagescene.timeline.stepBack"])).toBe(false);
  });

  it("two ungated actions on different surfaces are live together", () => {
    expect(actionsCoAvailable(ACTIONS["pagedraw.tools.select"], ACTIONS["moodboard.tools.select"])).toBe(true);
  });
});

describe("bindingKey", () => {
  it("lists modifiers in a fixed order before the key", () => {
    expect(bindingKey({ code: "KeyZ", ctrl: true, shift: true })).toBe("ctrl+shift+KeyZ");
    expect(bindingKey({ code: "KeyA", ctrl: true, alt: true })).toBe("ctrl+alt+KeyA");
    expect(bindingKey({ code: "Space" })).toBe("Space");
  });

  it("gives different keys to bindings that differ only by a modifier", () => {
    expect(bindingKey({ code: "KeyD" })).not.toBe(bindingKey({ code: "KeyD", shift: true }));
  });
});

describe("isEventFromEditableElement", () => {
  const eventFrom = (target: unknown) => ({ target }) as unknown as KeyboardEvent;
  const element = (tagName: string, extra: Record<string, unknown> = {}) => ({
    tagName,
    isContentEditable: false,
    getAttribute: () => null,
    ...extra,
  });

  it.each(["INPUT", "TEXTAREA", "SELECT"])("is true for a %s", (tag) => {
    expect(isEventFromEditableElement(eventFrom(element(tag)))).toBe(true);
  });

  it("is true for contenteditable and role=textbox elements", () => {
    expect(isEventFromEditableElement(eventFrom(element("DIV", { isContentEditable: true })))).toBe(true);
    expect(isEventFromEditableElement(eventFrom(element("DIV", { getAttribute: () => "textbox" })))).toBe(true);
  });

  it("is false for a button, for a plain div and when there is no target", () => {
    expect(isEventFromEditableElement(eventFrom(element("BUTTON")))).toBe(false);
    expect(isEventFromEditableElement(eventFrom(element("DIV")))).toBe(false);
    expect(isEventFromEditableElement(eventFrom(null))).toBe(false);
  });
});
