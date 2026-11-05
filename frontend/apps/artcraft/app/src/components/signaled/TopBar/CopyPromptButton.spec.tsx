// CopyPromptButton.spec: the prompt-copy button on the task queue cards. It should say "Copied!" only when the browser
// really accepted the text; if the clipboard write is refused (no permission, window not focused) it must not claim success.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

// The tooltip text is the visible "state" of the button, so the stand-in tooltip just exposes it as an attribute.
vi.mock("@storyteller/ui-tooltip", async () => {
  const { createElement } = await import("react");
  return {
    Tooltip: ({ content, children }: { content: string; children: unknown }) =>
      createElement("div", { "data-testid": "tip", "data-content": content }, children as never),
  };
});
vi.mock("@storyteller/icons", () => ({ DynamicIcon: () => null }));

import { CopyPromptButton } from "./CopyPromptButton";

const tip = () => screen.getByTestId("tip").getAttribute("data-content");

function stubClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("CopyPromptButton", () => {
  it("writes the prompt to the clipboard and then says Copied!", async () => {
    const writeText = vi.fn(async () => undefined);
    stubClipboard(writeText);
    render(<CopyPromptButton prompt="a red fox" />);
    expect(tip()).toBe("Copy prompt");

    await act(async () => {
      fireEvent.click(screen.getByLabelText("Copy prompt"));
    });

    expect(writeText).toHaveBeenCalledWith("a red fox");
    expect(tip()).toBe("Copied!");
  });

  it("goes back to Copy prompt after three seconds", async () => {
    stubClipboard(async () => undefined);
    render(<CopyPromptButton prompt="a red fox" />);
    await act(async () => {
      fireEvent.click(screen.getByLabelText("Copy prompt"));
    });
    expect(tip()).toBe("Copied!");

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(tip()).toBe("Copy prompt");
  });

  it("does not say Copied! when the clipboard refuses the text", async () => {
    stubClipboard(async () => {
      throw new DOMException("Document is not focused", "NotAllowedError");
    });
    render(<CopyPromptButton prompt="a red fox" />);

    await act(async () => {
      fireEvent.click(screen.getByLabelText("Copy prompt"));
    });

    expect(tip()).toBe("Copy prompt");
  });
});
