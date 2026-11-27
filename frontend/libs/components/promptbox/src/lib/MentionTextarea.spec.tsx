import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { MentionTextarea } from "./MentionTextarea";

// These subtrees are not opened by the tests; keep the real editable and
// native React composition/keyboard event processing under test.
vi.mock("./MentionChipMenu", () => ({ MentionChipMenu: () => null }));
vi.mock("./deck/DeckCard", () => ({ DeckPreviewModal: () => null }));
vi.mock("./promptStore", () => ({
  useEnterToGenerateStore: (select: (s: { enabled: boolean }) => unknown) => select({ enabled: false }),
}));

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
let execCommand: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => setTimeout(() => cb(0), 0));
  // jsdom has no layout scrolling; the dropdown itself stays real.
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { value: vi.fn(), configurable: true });
  execCommand = vi.fn(() => true);
  Object.defineProperty(document, "execCommand", { value: execCommand, configurable: true });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
  vi.unstubAllGlobals();
});

it.each([false, true])("does not edit or submit while composing (enterToGenerate=%s)", (enterToGenerate) => {
  const onKeyDown = vi.fn();
  const onChange = vi.fn();
  act(() => root.render(createElement(MentionTextarea, {
    value: "", mentionItems: [], colorMap: {}, onChange, onKeyDown, enterToGenerate,
  })));
  const editor = container.querySelector("[contenteditable]")!;
  act(() => editor.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true, data: "候補" })));
  const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
  act(() => editor.dispatchEvent(event));
  expect(event.defaultPrevented).toBe(false);
  expect(execCommand).not.toHaveBeenCalled();
  expect(onKeyDown).not.toHaveBeenCalled();
  expect(onChange).not.toHaveBeenCalled();
});

it.each([{ isComposing: true }, { keyCode: 229 }])("recognizes native IME keyboard flags %j", (flags) => {
  const onKeyDown = vi.fn();
  act(() => root.render(createElement(MentionTextarea, {
    value: "", mentionItems: [], colorMap: {}, onChange: vi.fn(), onKeyDown, enterToGenerate: true,
  })));
  const editor = container.querySelector("[contenteditable]")!;
  const event = new KeyboardEvent("keydown", { key: "Enter", ...flags, bubbles: true, cancelable: true });
  act(() => editor.dispatchEvent(event));
  expect(event.defaultPrevented).toBe(false);
  expect(onKeyDown).not.toHaveBeenCalled();
});

it("still submits ordinary Enter after composition ends", () => {
  const onKeyDown = vi.fn();
  act(() => root.render(createElement(MentionTextarea, {
    value: "", mentionItems: [], colorMap: {}, onChange: vi.fn(), onKeyDown, enterToGenerate: true,
  })));
  const editor = container.querySelector("[contenteditable]")!;
  act(() => editor.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true })));
  act(() => editor.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true })));
  act(() => editor.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
  expect(onKeyDown).toHaveBeenCalledOnce();
});

it("still inserts a newline for ordinary Enter when generation is disabled", () => {
  act(() => root.render(createElement(MentionTextarea, {
    value: "", mentionItems: [], colorMap: {}, onChange: vi.fn(), enterToGenerate: false,
  })));
  const editor = container.querySelector("[contenteditable]")!;
  act(() => editor.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true })));
  expect(execCommand).toHaveBeenCalledWith("insertLineBreak");
});

it.each(["Enter", "Tab"])("does not select an open mention during IME confirmation with %s", (key) => {
  const onMentionSelect = vi.fn();
  act(() => root.render(createElement(MentionTextarea, {
    value: "", mentionItems: [{ label: "@Image1", type: "image" }], colorMap: {}, onChange: vi.fn(), onMentionSelect,
  })));
  const editor = container.querySelector("[contenteditable]")!;
  act(() => {
    editor.textContent = "@";
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    editor.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: "@" }));
  });
  expect(document.querySelector("[data-mention-dropdown]")).not.toBeNull();
  act(() => editor.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true })));
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
  act(() => editor.dispatchEvent(event));
  expect(event.defaultPrevented).toBe(false);
  expect(execCommand).not.toHaveBeenCalled();
  expect(onMentionSelect).not.toHaveBeenCalled();
  expect(document.querySelector("[data-mention-dropdown]")).not.toBeNull();
});
