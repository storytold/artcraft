// PromptBoxVFX.spec: checks the Enter key in the VFX tab's optional prompt field.
// Pressing Enter in that field starts the generation (when a source video and a reference image are attached). People
// who type with an IME (Japanese, Chinese, Korean) press Enter to CONFIRM the word they picked from the candidate list,
// and that Enter must not also start a paid generation. Chromium (the Windows app) sends it with isComposing = true;
// Safari's engine (the macOS app) has already ended the composition and sends keyCode 229 with isComposing = false.
// The box's children (buttons, pickers, gallery) are replaced with stand-ins; the real VFX store runs.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";

vi.mock("@storyteller/common", () => ({
  UploaderStates: { success: "success", assetError: "assetError", imageCreateError: "imageCreateError" },
}));
vi.mock("@storyteller/icons", () => ({ DynamicIcon: () => null }));
vi.mock("@storyteller/ui-button", () => ({
  Button: () => null,
  GenerateButton: () => null,
}));
vi.mock("@storyteller/ui-popover", () => ({ PopoverMenu: () => null }));
vi.mock("@storyteller/ui-tooltip", () => ({
  Tooltip: ({ children }: { children: unknown }) => children,
}));
vi.mock("@storyteller/ui-gallery-modal", () => ({ GalleryModal: () => null }));
vi.mock("@storyteller/ui-promptbox", async () => {
  // The real key check from the prompt-box package, so the test exercises the code the app ships rather than a copy
  // of it. The whole package can't be loaded here: it pulls in button exports that this spec replaces with stand-ins
  // (loading it failed on a missing NEUTRAL_BUTTON_HOVER_CLASSES), so only this one file is imported.
  const { isImeKeyDown } = await import("../../../promptbox/src/lib/common/imeKey");
  return { isImeKeyDown, PromptClearAllButton: () => null };
});

import { PromptBoxVFX } from "./PromptBoxVFX";
import { useVFXStore } from "./store";

// The store as it was when the file loaded, so each test starts clean.
const initialState = useVFXStore.getState();

// Mount the box with a source video and reference image attached (so Generate is allowed), open the prompt field, then
// send one keydown to it. Returns the stand-in for the host's submit callback so a test can see whether it was called.
const pressInPromptField = async (init: Record<string, unknown>) => {
  const onSubmit = vi.fn();
  useVFXStore.setState({
    source: { id: "s", url: "blob:source", mediaToken: "m_source" },
    reference: { id: "r", url: "blob:reference", mediaToken: "m_reference" },
    prompt: "golden hour, light rain",
  });
  const view = render(
    <PromptBoxVFX
      onSubmit={onSubmit}
      isSubmitting={false}
      uploadVideo={vi.fn()}
      uploadImage={vi.fn()}
      onError={vi.fn()}
    />,
  );
  await act(async () => {});
  // The prompt field lives in a popover that the "Prompt" toggle opens.
  await act(async () => {
    fireEvent.click(view.getByText("Prompt", { selector: "span.hidden" }));
  });
  await act(async () => {
    fireEvent.keyDown(view.getByPlaceholderText("Describe the new scene, lighting, or change..."), init);
  });
  return onSubmit;
};

describe("PromptBoxVFX Enter key in the prompt field", () => {
  beforeEach(() => {
    useVFXStore.setState(initialState, true);
  });

  afterEach(() => {
    cleanup();
    useVFXStore.setState(initialState, true);
  });

  it("does not start a generation when Enter confirms an IME word in Chromium", async () => {
    const onSubmit = await pressInPromptField({ key: "Enter", keyCode: 229, isComposing: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("does not start a generation when Enter confirms an IME word in Safari's engine", async () => {
    const onSubmit = await pressInPromptField({ key: "Enter", keyCode: 229, isComposing: false });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // Controls: a real Enter keeps working. These pass on the old code and must keep passing.
  it("control: a real Enter starts the generation", async () => {
    const onSubmit = await pressInPromptField({ key: "Enter", keyCode: 13 });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("control: Shift+Enter does not start a generation", async () => {
    const onSubmit = await pressInPromptField({ key: "Enter", keyCode: 13, shiftKey: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
