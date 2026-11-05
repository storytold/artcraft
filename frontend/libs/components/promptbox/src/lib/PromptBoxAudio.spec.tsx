// PromptBoxAudio.spec: checks the Enter key in the Audio tab's prompt field.
// With the Enter-to-generate setting on, pressing Enter starts the generation. People who type with an IME (Japanese,
// Chinese, Korean) press Enter to CONFIRM the word they picked from the candidate list, and that Enter must not also
// start a paid generation. Chromium (the Windows app) sends it with isComposing = true; Safari's engine (the macOS app)
// has already ended the composition and sends keyCode 229 with isComposing = false. The box's children (reference row,
// pickers, modals) and the backend call are replaced with stand-ins; the real prompt store and enqueue logic run.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";

// Shared handles the mock factories below can see (vi.mock is hoisted above normal variables).
const m = vi.hoisted(() => ({
  enqueueAudioGeneration: vi.fn(),
}));

vi.mock("@storyteller/omni-gen", () => ({
  enqueueAudioGeneration: m.enqueueAudioGeneration,
  AUDIO_MODELS_REQUIRING_AUDIO_REF: new Set<string>(),
  OMNI_GENERATE_OUTAGE_MESSAGE: "outage",
}));
vi.mock("@storyteller/model-list", () => ({
  getCreatorIconPathForModelId: () => "",
  getModelDescription: () => "",
  getModelInfo: () => "",
}));
vi.mock("@storyteller/google-analytics", () => ({ gtagEvent: vi.fn() }));
vi.mock("@storyteller/ui-toaster", () => ({ toast: { error: vi.fn() } }));
vi.mock("@storyteller/ui-gallery-modal", () => ({ GalleryModal: () => null }));
vi.mock("@storyteller/ui-popover", () => ({ PopoverMenu: () => null }));
vi.mock("@storyteller/ui-tooltip", () => ({
  Tooltip: ({ children }: { children: unknown }) => children,
}));
vi.mock("@storyteller/icons", () => ({ DynamicIcon: () => null }));
vi.mock("@storyteller/ui-button", () => ({
  GenerateIconButton: () => null,
  ToggleButton: () => null,
}));
vi.mock("./common/AudioReferenceRow", async () => {
  const { forwardRef } = await import("react");
  // The box holds a ref to the row, so the stand-in has to accept one.
  return { AudioReferenceRow: forwardRef(() => null) };
});
vi.mock("./common/AudioTuningPopover", () => ({ AudioTuningPopover: () => null }));
vi.mock("./common/SoundsSettingsPopover", () => ({ SoundsSettingsPopover: () => null }));
vi.mock("./common/StylePromptRow", () => ({ StylePromptRow: () => null }));
vi.mock("./deck/usePromptBoxDrop", () => ({
  PromptBoxDropOverlay: () => null,
  usePromptBoxDrop: () => ({ dragState: "idle", dropZoneProps: {} }),
}));
vi.mock("./useAutoGrowEditorHeight", () => ({
  useAutoGrowEditorHeight: () => ({ isExpanded: false, toggleExpand: vi.fn() }),
}));
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

import { PromptBoxAudio } from "./PromptBoxAudio";
import { useEnterToGenerateStore, usePromptAudioStore } from "./promptStore";

// The stores as they were when the file loaded, so each test starts clean.
const initialPromptState = usePromptAudioStore.getState();
const initialEnterToGenerateState = useEnterToGenerateStore.getState();

// One audio model that needs nothing but a prompt.
const models = [{ model: "suno_music", full_name: "Suno" }] as never;

// Mount the box with a prompt typed and Enter-to-generate on, then send one keydown to the prompt field.
const pressInPromptField = async (init: Record<string, unknown>) => {
  usePromptAudioStore.setState({ prompt: "calm piano over rain" });
  const view = render(<PromptBoxAudio models={models} />);
  await act(async () => {});
  await act(async () => {
    fireEvent.keyDown(view.getByPlaceholderText("Describe the music or sound you want..."), init);
  });
};

describe("PromptBoxAudio Enter key with Enter-to-generate on", () => {
  beforeEach(() => {
    m.enqueueAudioGeneration.mockReset();
    m.enqueueAudioGeneration.mockResolvedValue({ success: true, jobTokens: ["job-1"] });
    usePromptAudioStore.setState(initialPromptState, true);
    useEnterToGenerateStore.setState({ enabled: true });
  });

  afterEach(() => {
    cleanup();
    useEnterToGenerateStore.setState(initialEnterToGenerateState, true);
  });

  it("does not start a generation when Enter confirms an IME word in Chromium", async () => {
    await pressInPromptField({ key: "Enter", keyCode: 229, isComposing: true });
    expect(m.enqueueAudioGeneration).not.toHaveBeenCalled();
  });

  it("does not start a generation when Enter confirms an IME word in Safari's engine", async () => {
    await pressInPromptField({ key: "Enter", keyCode: 229, isComposing: false });
    expect(m.enqueueAudioGeneration).not.toHaveBeenCalled();
  });

  // Controls: a real Enter keeps working. These pass on the old code and must keep passing.
  it("control: a real Enter starts the generation", async () => {
    await pressInPromptField({ key: "Enter", keyCode: 13 });
    expect(m.enqueueAudioGeneration).toHaveBeenCalledTimes(1);
  });

  it("control: Shift+Enter does not start a generation", async () => {
    await pressInPromptField({ key: "Enter", keyCode: 13, shiftKey: true });
    expect(m.enqueueAudioGeneration).not.toHaveBeenCalled();
  });
});
