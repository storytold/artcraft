// PromptBoxImage.spec: checks the Enter key in the Text-to-Image prompt field.
// With the Enter-to-generate setting on, pressing Enter starts the generation. People who type with an IME (Japanese,
// Chinese, Korean) press Enter to CONFIRM the word they picked from the candidate list, and that Enter must not also
// start a paid generation. Chromium (the Windows app) sends it with isComposing = true; Safari's engine (the macOS app)
// has already ended the composition and sends keyCode 229 with isComposing = false. The box's children (deck, pickers,
// modals) and the backend call are replaced with stand-ins; the real model list, prompt store and enqueue logic run.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";

// Shared handles the mock factories below can see (vi.mock is hoisted above normal variables).
const m = vi.hoisted(() => ({
  generateImage: vi.fn(),
}));

vi.mock("@storyteller/tauri-api", () => ({
  GenerateImage: m.generateImage,
  commandErrorMessage: (_error: unknown, fallback: string) => fallback,
}));
vi.mock("@storyteller/google-analytics", () => ({ gtagEvent: vi.fn() }));
vi.mock("@storyteller/ui-toaster", () => ({ toast: { error: vi.fn() } }));
vi.mock("@storyteller/ui-popover", () => ({ PopoverMenu: () => null }));
vi.mock("@storyteller/ui-tooltip", () => ({
  Tooltip: ({ children }: { children: unknown }) => children,
}));
vi.mock("@storyteller/icons", () => ({ DynamicIcon: () => null }));
vi.mock("@storyteller/ui-button", () => ({ GenerateIconButton: () => null }));
vi.mock("./deck/ReferenceDeck", () => ({ ReferenceDeck: () => null }));
vi.mock("./deck/useDeckMedia", () => ({
  // The box reads these fields while rendering; no uploads are in progress.
  useDeckMedia: () => ({
    uploadingImages: [],
    availableImageSlots: 1,
    fileInputs: null,
    galleryModal: null,
    openAnyUpload: vi.fn(),
    openImageUpload: vi.fn(),
    openGallery: vi.fn(),
    processImageFiles: vi.fn(),
  }),
}));
vi.mock("./deck/usePromptBoxDrop", () => ({
  PromptBoxDropOverlay: () => null,
  usePromptBoxDrop: () => ({ dragState: "idle", dropZoneProps: {} }),
}));
vi.mock("./common/AspectRatioIcon", () => ({ AspectRatioIcon: () => null }));
vi.mock("./common/AspectRatioPicker", () => ({ AspectRatioPicker: () => null }));
vi.mock("./common/GenerationCountPicker", () => ({ GenerationCountPicker: () => null }));
vi.mock("./common/ResolutionPicker", () => ({ ResolutionPicker: () => null }));
vi.mock("./common/QualityPicker", () => ({ QualityPicker: () => null }));
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

import { IMAGE_MODELS } from "@storyteller/model-list";
import { PromptBoxImage } from "./PromptBoxImage";
import { useEnterToGenerateStore, usePromptImageStore } from "./promptStore";

// The stores as they were when the file loaded, so each test starts clean.
const initialPromptState = usePromptImageStore.getState();
const initialEnterToGenerateState = useEnterToGenerateStore.getState();

// Mount the box with a prompt typed and Enter-to-generate on, then send one keydown to the prompt field.
const pressInPromptField = async (init: Record<string, unknown>) => {
  usePromptImageStore.setState({ prompt: "a red fox in the snow" });
  const view = render(
    <PromptBoxImage useJobContext={() => ({}) as never} selectedModel={IMAGE_MODELS[0]} />,
  );
  await act(async () => {});
  await act(async () => {
    fireEvent.keyDown(view.getByPlaceholderText("Describe what you want in the image..."), init);
  });
};

describe("PromptBoxImage Enter key with Enter-to-generate on", () => {
  beforeEach(() => {
    m.generateImage.mockReset();
    m.generateImage.mockResolvedValue(undefined);
    usePromptImageStore.setState(initialPromptState, true);
    useEnterToGenerateStore.setState({ enabled: true });
    vi.spyOn(console, "debug").mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useEnterToGenerateStore.setState(initialEnterToGenerateState, true);
  });

  it("does not start a generation when Enter confirms an IME word in Chromium", async () => {
    await pressInPromptField({ key: "Enter", keyCode: 229, isComposing: true });
    expect(m.generateImage).not.toHaveBeenCalled();
  });

  it("does not start a generation when Enter confirms an IME word in Safari's engine", async () => {
    await pressInPromptField({ key: "Enter", keyCode: 229, isComposing: false });
    expect(m.generateImage).not.toHaveBeenCalled();
  });

  // Controls: a real Enter keeps working. These pass on the old code and must keep passing.
  it("control: a real Enter starts the generation", async () => {
    await pressInPromptField({ key: "Enter", keyCode: 13 });
    expect(m.generateImage).toHaveBeenCalledTimes(1);
  });

  it("control: Shift+Enter does not start a generation", async () => {
    await pressInPromptField({ key: "Enter", keyCode: 13, shiftKey: true });
    expect(m.generateImage).not.toHaveBeenCalled();
  });
});
