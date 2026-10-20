// MentionTextarea.spec: checks what the Video prompt box's text field does with the Enter key.
// People who type Japanese, Chinese or Korean use an IME: they type sounds, then press Enter to CONFIRM the word they
// picked from the candidate list. That Enter belongs to the IME, not to the app. The two browser engines report it
// differently: Chromium (Windows) sends the keydown with isComposing = true, Safari's engine (the macOS app) has
// already ended the composition and sends keyCode 229 with isComposing = false. Either way it must not be treated as a
// real Enter, which in this field means "insert a line break" (the default) or "submit the prompt" (the opt-in
// Enter-to-generate setting). jsdom has no document.execCommand, so a stand-in records the line-break requests.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";

vi.mock("@storyteller/icons", () => ({ DynamicIcon: () => null }));
vi.mock("./MentionChipMenu", () => ({ MentionChipMenu: () => null }));
vi.mock("./deck/DeckCard", () => ({ DeckPreviewModal: () => null }));

import { MentionTextarea } from "./MentionTextarea";

const onChange = vi.fn();
const onKeyDown = vi.fn();
const execCommand = vi.fn((_command: string) => true);

// Mount the field and hand back the editable element.
const mount = (enterToGenerate: boolean) => {
  const view = render(
    <MentionTextarea
      value=""
      onChange={onChange}
      mentionItems={[]}
      colorMap={{}}
      enterToGenerate={enterToGenerate}
      onKeyDown={onKeyDown}
    />,
  );
  return view.container.querySelector("[contenteditable]") as HTMLDivElement;
};

const lineBreakRequests = () =>
  execCommand.mock.calls.filter(([command]) => command === "insertLineBreak").length;

// The Enter that confirms an IME candidate, in the shape each engine really sends it.
const chromiumConfirmEnter = { key: "Enter", keyCode: 229, isComposing: true };
const safariConfirmEnter = { key: "Enter", keyCode: 229, isComposing: false };

beforeEach(() => {
  onChange.mockReset();
  onKeyDown.mockReset();
  execCommand.mockClear();
  (document as unknown as { execCommand: unknown }).execCommand = execCommand;
});
afterEach(() => {
  cleanup();
  delete (document as unknown as { execCommand?: unknown }).execCommand;
});

describe("Enter that confirms an IME candidate (Enter-to-generate off, the default)", () => {
  it("does not insert a line break in Chromium", () => {
    const editor = mount(false);
    fireEvent.keyDown(editor, chromiumConfirmEnter);
    expect(lineBreakRequests()).toBe(0);
  });

  it("does not insert a line break in Safari's engine", () => {
    const editor = mount(false);
    fireEvent.keyDown(editor, safariConfirmEnter);
    expect(lineBreakRequests()).toBe(0);
  });
});

describe("Enter that confirms an IME candidate (Enter-to-generate on)", () => {
  it("does not submit the prompt in Chromium", () => {
    const editor = mount(true);
    fireEvent.keyDown(editor, chromiumConfirmEnter);
    expect(onKeyDown).not.toHaveBeenCalled();
  });

  it("does not submit the prompt in Safari's engine", () => {
    const editor = mount(true);
    fireEvent.keyDown(editor, safariConfirmEnter);
    expect(onKeyDown).not.toHaveBeenCalled();
  });
});

// Controls: a real Enter keeps doing what it always did. These pass on the old code and must keep passing.
describe("a real Enter key", () => {
  it("control: inserts a line break when Enter-to-generate is off", () => {
    const editor = mount(false);
    fireEvent.keyDown(editor, { key: "Enter", keyCode: 13 });
    expect(lineBreakRequests()).toBe(1);
    expect(onKeyDown).not.toHaveBeenCalled();
  });

  it("control: is passed to the host (to submit) when Enter-to-generate is on", () => {
    const editor = mount(true);
    fireEvent.keyDown(editor, { key: "Enter", keyCode: 13 });
    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(lineBreakRequests()).toBe(0);
  });

  it("control: Shift+Enter still inserts a line break when Enter-to-generate is on", () => {
    const editor = mount(true);
    fireEvent.keyDown(editor, { key: "Enter", keyCode: 13, shiftKey: true });
    expect(lineBreakRequests()).toBe(1);
    expect(onKeyDown).not.toHaveBeenCalled();
  });
});
