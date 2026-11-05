// PromptBox2D.spec: checks the Enter key in the 2D canvas tab's prompt field.
// With the Enter-to-generate setting on, pressing Enter starts the generation. People who type with an IME (Japanese,
// Chinese, Korean) press Enter to CONFIRM the word they picked from the candidate list, and that Enter must not also
// start a paid generation. Chromium (the Windows app) sends it with isComposing = true; Safari's engine (the macOS app)
// has already ended the composition and sends keyCode 229 with isComposing = false. The box's children (pickers,
// modals, image row) are replaced with stand-ins; the real prompt store and generate logic run.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";

vi.mock("@storyteller/ui-toaster", () => ({ toast: { error: vi.fn() } }));
vi.mock("@storyteller/ui-popover", () => ({ PopoverMenu: () => null }));
vi.mock("@storyteller/ui-tooltip", () => ({
  Tooltip: ({ children }: { children: unknown }) => children,
}));
vi.mock("@storyteller/ui-modal", () => ({ Modal: () => null }));
vi.mock("@storyteller/icons", () => ({ DynamicIcon: () => null }));
vi.mock("@storyteller/ui-button", () => ({
  Button: () => null,
  GenerateButton: () => null,
}));
vi.mock("./ImagePromptRow", () => ({ ImagePromptRow: () => null }));
vi.mock("./common/GenerationCountPicker", () => ({ GenerationCountPicker: () => null }));
vi.mock("./PromptFullscreenButton", () => ({ PromptFullscreenButton: () => null }));
vi.mock("./PromptClearAllButton", () => ({ PromptClearAllButton: () => null }));
vi.mock("./PromptFullscreenModal", () => ({
  PromptFullscreenModal: () => null,
  useFullscreenPrompt: () => ({
    isFullscreen: false,
    openFullscreen: vi.fn(),
    closeFullscreen: vi.fn(),
  }),
}));

import { IMAGE_MODELS } from "@storyteller/model-list";
import { PromptBox2D } from "./PromptBox2D";
import { useEnterToGenerateStore, usePrompt2DStore } from "./promptStore";

// The stores as they were when the file loaded, so each test starts clean.
const initialPromptState = usePrompt2DStore.getState();
const initialEnterToGenerateState = useEnterToGenerateStore.getState();

// Mount the box with a prompt typed and Enter-to-generate on, then send one keydown to the prompt field.
// Returns the stand-in for the host's "generate" callback so a test can see whether it was called.
const pressInPromptField = async (init: Record<string, unknown>) => {
  const onGenerateClick = vi.fn();
  usePrompt2DStore.setState({ prompt: "a lighthouse at dusk" });
  const view = render(
    <PromptBox2D
      selectedImageModel={IMAGE_MODELS[0]}
      EncodeImageBitmapToBase64={async () => ""}
      onGenerateClick={onGenerateClick}
      onGenerationCountChange={vi.fn()}
      usePrompt2DStore={usePrompt2DStore}
    />,
  );
  await act(async () => {});
  await act(async () => {
    fireEvent.keyDown(view.getByPlaceholderText("Describe your image..."), init);
  });
  return onGenerateClick;
};

describe("PromptBox2D Enter key with Enter-to-generate on", () => {
  beforeEach(() => {
    usePrompt2DStore.setState(initialPromptState, true);
    useEnterToGenerateStore.setState({ enabled: true });
  });

  afterEach(() => {
    cleanup();
    useEnterToGenerateStore.setState(initialEnterToGenerateState, true);
  });

  it("does not start a generation when Enter confirms an IME word in Chromium", async () => {
    const onGenerateClick = await pressInPromptField({ key: "Enter", keyCode: 229, isComposing: true });
    expect(onGenerateClick).not.toHaveBeenCalled();
  });

  it("does not start a generation when Enter confirms an IME word in Safari's engine", async () => {
    const onGenerateClick = await pressInPromptField({ key: "Enter", keyCode: 229, isComposing: false });
    expect(onGenerateClick).not.toHaveBeenCalled();
  });

  // Controls: a real Enter keeps working. These pass on the old code and must keep passing.
  it("control: a real Enter starts the generation", async () => {
    const onGenerateClick = await pressInPromptField({ key: "Enter", keyCode: 13 });
    expect(onGenerateClick).toHaveBeenCalledTimes(1);
  });

  it("control: Shift+Enter does not start a generation", async () => {
    const onGenerateClick = await pressInPromptField({ key: "Enter", keyCode: 13, shiftKey: true });
    expect(onGenerateClick).not.toHaveBeenCalled();
  });
});
