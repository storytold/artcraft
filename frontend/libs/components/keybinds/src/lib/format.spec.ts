import { describe, expect, it } from "vitest";
import { formatBinding, formatBindings, formatBindingTokens } from "./format";

// jsdom reports an empty navigator.platform, so these cases cover the non-Mac rendering
// (word modifiers joined with "+"). The Mac glyph path is a one-line ternary on the same data.
describe("keybind formatting", () => {
  it("strips the Key / Digit prefixes", () => {
    expect(formatBinding({ code: "KeyW" })).toBe("W");
    expect(formatBinding({ code: "Digit5" })).toBe("5");
  });

  it("uses friendly labels for special keys", () => {
    expect(formatBinding({ code: "Escape" })).toBe("Esc");
    expect(formatBinding({ code: "ArrowLeft" })).toBe("←");
    expect(formatBinding({ code: "Backquote" })).toBe("`");
  });

  it("passes unknown codes through unchanged", () => {
    expect(formatBinding({ code: "F12" })).toBe("F12");
  });

  it("orders modifiers Ctrl, Shift, Alt, then the key", () => {
    expect(formatBindingTokens({ code: "KeyZ", alt: true, ctrl: true, shift: true })).toEqual([
      "Ctrl",
      "Shift",
      "Alt",
      "Z",
    ]);
    expect(formatBinding({ code: "KeyZ", ctrl: true, shift: true })).toBe("Ctrl+Shift+Z");
  });

  it("joins several bindings with ' / ' and reports an empty list as Unbound", () => {
    expect(formatBindings([{ code: "KeyW" }, { code: "ArrowUp" }])).toBe("W / ↑");
    expect(formatBindings([])).toBe("Unbound");
  });
});
