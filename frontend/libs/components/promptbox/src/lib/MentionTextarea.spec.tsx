import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MentionTextarea, type MentionItem } from "./MentionTextarea";

const MULTILINE_PROMPT = "Opening beat\n\nSecond beat\nThird beat";

function PromptHarness({
  initialValue = "",
  mentionItems = [],
}: {
  initialValue?: string;
  mentionItems?: MentionItem[];
}) {
  const [value, setValue] = useState(initialValue);

  return (
    <>
      <output data-testid="prompt-value">{value}</output>
      <MentionTextarea
        value={value}
        onChange={setValue}
        mentionItems={mentionItems}
        colorMap={{}}
      />
    </>
  );
}

function getEditor(): HTMLDivElement {
  const editor = document.querySelector<HTMLDivElement>(
    '[contenteditable="true"]',
  );
  if (!editor) throw new Error("MentionTextarea editor was not rendered");
  return editor;
}

function selectEditorContents(editor: HTMLDivElement): void {
  editor.focus();
  const range = document.createRange();
  range.selectNodeContents(editor);
  const selection = window.getSelection();
  if (!selection) throw new Error("Selection API is unavailable");
  selection.removeAllRanges();
  selection.addRange(range);
}

function pastePlainText(editor: HTMLDivElement, text: string): void {
  fireEvent.paste(editor, {
    clipboardData: {
      getData: (type: string) => (type === "text/plain" ? text : ""),
    },
  });
}

describe("MentionTextarea paste and focus-mode layout", () => {
  it("preserves blank lines after the editor has already been edited and cleared", () => {
    render(<PromptHarness initialValue="Earlier prompt" />);
    const editor = getEditor();

    selectEditorContents(editor);
    pastePlainText(editor, "Temporary prompt");
    expect(screen.getByTestId("prompt-value").textContent).toBe(
      "Temporary prompt",
    );

    editor.innerHTML = "";
    fireEvent.input(editor);
    expect(screen.getByTestId("prompt-value").textContent).toBe("");

    selectEditorContents(editor);
    pastePlainText(editor, MULTILINE_PROMPT);

    expect(screen.getByTestId("prompt-value").textContent).toBe(
      MULTILINE_PROMPT,
    );
    expect(editor.querySelectorAll("br")).toHaveLength(3);
  });

  it("replaces a selection containing an atomic mention without losing newlines", () => {
    const character: MentionItem = {
      label: "@Hero",
      type: "character",
      token: "character-token",
    };
    render(
      <PromptHarness
        initialValue="@Hero old prompt"
        mentionItems={[character]}
      />,
    );
    const editor = getEditor();

    selectEditorContents(editor);
    pastePlainText(editor, MULTILINE_PROMPT);

    expect(screen.getByTestId("prompt-value").textContent).toBe(
      MULTILINE_PROMPT,
    );
    expect(editor.querySelector("[data-mention]")).toBeNull();
    expect(editor.querySelectorAll("br")).toHaveLength(3);
  });

  it("allows its fullscreen flex wrapper to shrink so the editor can scroll", () => {
    render(<PromptHarness />);

    expect(getEditor().parentElement?.classList.contains("min-h-0")).toBe(true);
  });
});
