import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MentionTextarea } from "./MentionTextarea";

// Keep the real editable and selection handlers; these UI subtrees are unused.
vi.mock("@storyteller/icons", () => ({ DynamicIcon: () => null }));
vi.mock("./MentionChipMenu", () => ({ MentionChipMenu: () => null }));
vi.mock("./deck/DeckCard", () => ({ DeckPreviewModal: () => null }));
vi.mock("./promptStore", () => ({
  useEnterToGenerateStore: (select: (s: { enabled: boolean }) => unknown) =>
    select({ enabled: false }),
}));

const PREFIX = "🙂e\u0301";
const SUFFIX = "👩‍🚀";
const VALUE = `${PREFIX}@Image1${SUFFIX}`;
let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
let editor: HTMLDivElement;
let chip: HTMLElement;
let onChange: ReturnType<typeof vi.fn>;
let onKeyDown: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  onChange = vi.fn();
  onKeyDown = vi.fn();
  act(() => root.render(createElement(MentionTextarea, {
    value: VALUE,
    mentionItems: [{ label: "@Image1", type: "image" }],
    colorMap: {},
    onChange,
    onKeyDown,
  })));
  editor = container.querySelector("[contenteditable=true]")!;
  chip = editor.querySelector("[data-mention]")!;
  editor.focus();
});

afterEach(() => {
  act(() => root.unmount());
  window.getSelection()?.removeAllRanges();
  container.remove();
  vi.unstubAllGlobals();
});

describe("atomic mention arrow navigation", () => {
  it("moves left past a chip instead of being ejected back to its trailing edge", () => {
    setCaret(chip.nextSibling!, 0);
    const html = editor.innerHTML;
    const event = pressArrow("ArrowLeft");

    // jsdom does not implement native arrow movement. Reproduce the browser
    // landing inside contenteditable=false, then run the real caret-ejection
    // listener. The editor must leave ordinary arrow movement to the browser.
    if (!event.defaultPrevented) {
      setCaret(chip.lastChild!.firstChild!, 0);
    }
    act(() => document.dispatchEvent(new Event("selectionchange")));

    expect(selectedTextBeforeCaret()).toBe(PREFIX);
    expect(event.defaultPrevented).toBe(false);
    expect(editor.innerHTML).toBe(html);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("moves right past a chip without entering its non-editable contents", () => {
    setCaret(chip.previousSibling!, PREFIX.length);
    const html = editor.innerHTML;
    const event = pressArrow("ArrowRight");
    setCaret(chip.lastChild!.firstChild!, 0);
    act(() => document.dispatchEvent(new Event("selectionchange")));

    expect(selectedTextBeforeCaret()).toBe(`${PREFIX}@Image1`);
    expect(event.defaultPrevented).toBe(false);
    expect(editor.innerHTML).toBe(html);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("uses the origin edge rather than assuming a left-to-right text direction", () => {
    setCaret(chip.nextSibling!, 0);
    // In a bidi run, ArrowRight can enter a chip from its DOM trailing edge.
    const event = pressArrow("ArrowRight");
    setCaret(chip.lastChild!.firstChild!, 0);
    act(() => document.dispatchEvent(new Event("selectionchange")));

    expect(selectedTextBeforeCaret()).toBe(PREFIX);
    expect(event.defaultPrevented).toBe(false);
  });

  it.each(["selectionchange", "pointerdown", "mousedown", "blur", "keydown"])("clears the arrow origin after %s", (eventType) => {
    setCaret(chip.nextSibling!, 0);
    pressArrow("ArrowLeft");
    if (eventType === "selectionchange") {
      setCaret(chip.previousSibling!, 0);
      act(() => document.dispatchEvent(new Event("selectionchange")));
    } else if (eventType === "blur") {
      act(() => editor.blur());
      editor.focus();
    } else if (eventType === "keydown") {
      pressArrow("a");
    } else {
      act(() => editor.dispatchEvent(new Event(eventType, { bubbles: true })));
    }
    setCaret(chip.lastChild!.firstChild!, 0);
    act(() => document.dispatchEvent(new Event("selectionchange")));

    expect(selectedTextBeforeCaret()).toBe(`${PREFIX}@Image1`);
  });

  it.each(["ArrowLeft", "ArrowRight"])("leaves %s within Unicode text to native grapheme navigation", (key) => {
    setCaret(chip.nextSibling!, SUFFIX.length);
    const before = window.getSelection()!.getRangeAt(0).cloneRange();
    const event = pressArrow(key);

    expect(event.defaultPrevented).toBe(false);
    expect(window.getSelection()!.anchorNode).toBe(before.startContainer);
    expect(window.getSelection()!.anchorOffset).toBe(before.startOffset);
    expect(editor.textContent).toBe(VALUE);
    expect(onKeyDown).toHaveBeenCalledOnce();
    expect(onChange).not.toHaveBeenCalled();
  });

  it.each(["shiftKey", "altKey", "ctrlKey", "metaKey", "isComposing"])("preserves native modified movement (%s)", (flag) => {
    setCaret(chip.nextSibling!, 0);
    const event = pressArrow("ArrowLeft", { [flag]: true });

    expect(event.defaultPrevented).toBe(false);
    expect(window.getSelection()!.anchorNode).toBe(chip.nextSibling);
    expect(window.getSelection()!.anchorOffset).toBe(0);
  });

  it.each(["compositionstart", "keyCode"])("does not track arrows during IME (%s)", (mode) => {
    setCaret(chip.nextSibling!, 0);
    if (mode === "compositionstart") {
      act(() => editor.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true })));
    }
    const event = pressArrow("ArrowLeft", mode === "keyCode" ? { keyCode: 229 } : {});
    setCaret(chip.lastChild!.firstChild!, 0);
    act(() => document.dispatchEvent(new Event("selectionchange")));

    expect(selectedTextBeforeCaret()).toBe(`${PREFIX}@Image1`);
    expect(event.defaultPrevented).toBe(false);
  });

  it("preserves non-collapsed selection for native arrow collapse", () => {
    const range = document.createRange();
    range.selectNode(chip);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    const event = pressArrow("ArrowLeft");

    expect(event.defaultPrevented).toBe(false);
    expect(selection.isCollapsed).toBe(false);
    expect(selection.toString()).toBe("@Image1");
  });

  it("keeps the fallback for an unexpected caret inside a chip", () => {
    setCaret(chip.lastChild!.firstChild!, 0);
    act(() => document.dispatchEvent(new Event("selectionchange")));

    expect(window.getSelection()!.anchorNode).toBe(editor);
    expect(window.getSelection()!.anchorOffset).toBe(2);
    expect(onChange).not.toHaveBeenCalled();
  });
});

function setCaret(node: Node, offset: number) {
  const range = document.createRange();
  range.setStart(node, offset);
  range.collapse(true);
  const selection = window.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);
}

function pressArrow(key: string, flags: KeyboardEventInit = {}) {
  const event = new KeyboardEvent("keydown", {
    key, bubbles: true, cancelable: true, ...flags,
  });
  act(() => editor.dispatchEvent(event));
  return event;
}

function selectedTextBeforeCaret() {
  const selection = window.getSelection()!;
  const range = document.createRange();
  range.setStart(editor, 0);
  range.setEnd(selection.anchorNode!, selection.anchorOffset);
  return range.toString();
}
