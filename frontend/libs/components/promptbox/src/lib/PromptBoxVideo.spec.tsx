// PromptBoxVideo.spec: checks what the video prompt box saves when the user presses Generate.
// Every generation the prompt box starts is saved as a small "enqueue record" (prompt, reference images, model) through
// window.__storeTaskEnqueueMeta. The Task Queue and the video feed later hand each finished/running task ONE such record
// so the card can show its prompt and thumbnails. Some video models let the user ask for several videos at once; the box
// then starts one task per video, so it has to save one record per task. The box's children (deck, pickers, editor,
// modals) and the backend call are replaced with stand-ins; the real model list, prompt store and enqueue logic run.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";

// Shared handles the mock factories below can see (vi.mock is hoisted above normal variables).
const m = vi.hoisted(() => ({
  generateVideo: vi.fn(),
  storeMeta: vi.fn(),
}));

vi.mock("@storyteller/tauri-api", () => ({
  GenerateVideo: m.generateVideo,
  commandErrorMessage: (_error: unknown, fallback: string) => fallback,
}));
vi.mock("@storyteller/google-analytics", () => ({ gtagEvent: vi.fn() }));
vi.mock("@storyteller/ui-toaster", () => ({ toast: { error: vi.fn() } }));
vi.mock("@storyteller/ui-popover", () => ({ PopoverMenu: () => null }));
vi.mock("@storyteller/ui-sliderv2", () => ({ SliderV2: () => null }));
vi.mock("@storyteller/ui-tooltip", () => ({
  Tooltip: ({ children }: { children: unknown }) => children,
}));
vi.mock("@storyteller/icons", () => ({ DynamicIcon: () => null }));
vi.mock("@storyteller/api", () => ({
  CharactersApi: class {
    // No saved characters: only the prompt, model and count matter here.
    ListAllCharacters = async () => ({ success: false });
  },
}));
vi.mock("@storyteller/ui-button", async () => {
  const { createElement } = await import("react");
  return {
    NEUTRAL_BUTTON_HOVER_CLASSES: "",
    ToggleButton: () => null,
    // Only the Generate button matters: pressing it runs the box's enqueue logic.
    GenerateIconButton: ({
      onClick,
      disabled,
    }: {
      onClick: () => void;
      disabled?: boolean;
    }) =>
      createElement("button", {
        "data-testid": "generate",
        onClick,
        disabled,
      }),
  };
});
vi.mock("./deck/ReferenceDeck", () => ({ ReferenceDeck: () => null }));
vi.mock("./deck/KeyframeCards", () => ({ KeyframeCards: () => null }));
vi.mock("./deck/useDeckMedia", () => ({
  // The box reads these fields while rendering; no uploads are in progress.
  useDeckMedia: () => ({
    uploadingImages: [],
    uploadingEnd: false,
    uploadingVideo: null,
    uploadingAudio: null,
    availableImageSlots: 1,
    fileInputs: null,
    galleryModal: null,
    openAnyUpload: vi.fn(),
    openImageUpload: vi.fn(),
    openVideoUpload: vi.fn(),
    openAudioUpload: vi.fn(),
    openEndUpload: vi.fn(),
    openGallery: vi.fn(),
    processImageFiles: vi.fn(),
    processVideoFiles: vi.fn(),
    processAudioFiles: vi.fn(),
  }),
}));
vi.mock("./deck/usePromptBoxDrop", () => ({
  PromptBoxDropOverlay: () => null,
  usePromptBoxDrop: () => ({
    dragState: "idle",
    dropZoneProps: {},
    fullscreenDropZoneProps: {},
  }),
}));
vi.mock("./common/AspectRatioIcon", () => ({ AspectRatioIcon: () => null }));
vi.mock("./common/VideoGenerationCountPicker", () => ({
  VideoGenerationCountPicker: () => null,
}));
vi.mock("./CharactersModal", () => ({ CharactersModal: () => null }));
vi.mock("./MentionTextarea", () => ({ MentionTextarea: () => null }));
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

import { VIDEO_MODELS } from "@storyteller/model-list";
import { PromptBoxVideo } from "./PromptBoxVideo";
import { useEnterToGenerateStore, usePromptVideoStore } from "./promptStore";

// The prompt store as it was when the file loaded, so each test starts clean.
const initialStoreState = usePromptVideoStore.getState();
const initialEnterToGenerateState = useEnterToGenerateStore.getState();

// Seedance 2.0 is the shipped video model that offers a "how many videos" choice (1 to 4).
const seedance = VIDEO_MODELS.find((model) => model.tauriId === "seedance_2p0")!;
// A model that only ever makes one video per press.
const singleOnly = VIDEO_MODELS.find(
  (model) => !model.generationCountOptions?.length && !model.requiresImage,
)!;

// Mount the box with a prompt already typed and the given video count chosen, then press Generate.
const pressGenerate = async (
  model: typeof seedance,
  count: number,
  onEnqueuePressed = vi.fn(),
) => {
  usePromptVideoStore.setState({ prompt: "a cat on a skateboard", generationCount: count });
  const view = render(
    <PromptBoxVideo
      useJobContext={() => ({}) as never}
      selectedModel={model}
      onEnqueuePressed={onEnqueuePressed}
    />,
  );
  await act(async () => {});
  await act(async () => {
    fireEvent.click(view.getByTestId("generate"));
  });
  return { view, onEnqueuePressed };
};

describe("PromptBoxVideo enqueue records", () => {
  beforeEach(() => {
    m.generateVideo.mockReset();
    m.generateVideo.mockResolvedValue(undefined);
    m.storeMeta.mockReset();
    window.__storeTaskEnqueueMeta = m.storeMeta;
    usePromptVideoStore.setState(initialStoreState, true);
    vi.spyOn(console, "debug").mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("sanity: the test models exist and Seedance 2.0 offers several videos", () => {
    expect(seedance.generationCountOptions).toEqual([1, 2, 3, 4]);
    expect(singleOnly).toBeDefined();
  });

  it("saves one record for a single video", async () => {
    await pressGenerate(singleOnly, 1);
    expect(m.generateVideo).toHaveBeenCalledTimes(1);
    expect(m.storeMeta).toHaveBeenCalledTimes(1);
  });

  it("starts one task per requested video", async () => {
    const { onEnqueuePressed } = await pressGenerate(seedance, 3);
    expect(m.generateVideo).toHaveBeenCalledTimes(3);
    expect(onEnqueuePressed).toHaveBeenCalledTimes(1);
    expect(onEnqueuePressed.mock.calls[0][1]).toHaveLength(3);
  });

  it("saves one record per task, so every task card can show its prompt", async () => {
    await pressGenerate(seedance, 3);
    // Three tasks were started; each one claims a record of its own when it shows up in the queue.
    expect(m.storeMeta).toHaveBeenCalledTimes(3);
    for (const [meta] of m.storeMeta.mock.calls) {
      expect(meta.prompt).toBe("a cat on a skateboard");
      expect(meta.modelType).toBe("seedance_2p0");
    }
  });
});

// With the Enter-to-generate setting on, pressing Enter in the prompt field starts the generation. People who type with an
// IME (Japanese, Chinese, Korean) press Enter to CONFIRM the word they picked, and that Enter must not also start a paid
// generation. Chromium (the Windows app) sends it with isComposing = true; Safari's engine (the macOS app) has already
// ended the composition and sends keyCode 229 with isComposing = false. (MentionTextarea has its own spec.)
describe("PromptBoxVideo Enter key with Enter-to-generate on", () => {
  beforeEach(() => {
    m.generateVideo.mockReset();
    m.generateVideo.mockResolvedValue(undefined);
    m.storeMeta.mockReset();
    window.__storeTaskEnqueueMeta = m.storeMeta;
    usePromptVideoStore.setState(initialStoreState, true);
    useEnterToGenerateStore.setState({ enabled: true });
    vi.spyOn(console, "debug").mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    useEnterToGenerateStore.setState(initialEnterToGenerateState, true);
  });

  // Mount the box with a prompt typed, then send one keydown to the prompt field.
  const pressInPromptField = async (init: Record<string, unknown>) => {
    usePromptVideoStore.setState({ prompt: "a cat on a skateboard", generationCount: 1 });
    const view = render(
      <PromptBoxVideo useJobContext={() => ({}) as never} selectedModel={singleOnly} />,
    );
    await act(async () => {});
    await act(async () => {
      fireEvent.keyDown(
        view.getByPlaceholderText("Describe what you want to happen in the video..."),
        init,
      );
    });
  };

  it("does not start a generation when Enter confirms an IME word in Chromium", async () => {
    await pressInPromptField({ key: "Enter", keyCode: 229, isComposing: true });
    expect(m.generateVideo).not.toHaveBeenCalled();
  });

  it("does not start a generation when Enter confirms an IME word in Safari's engine", async () => {
    await pressInPromptField({ key: "Enter", keyCode: 229, isComposing: false });
    expect(m.generateVideo).not.toHaveBeenCalled();
  });

  // Controls: a real Enter keeps working. These pass on the old code and must keep passing.
  it("control: a real Enter starts the generation", async () => {
    await pressInPromptField({ key: "Enter", keyCode: 13 });
    expect(m.generateVideo).toHaveBeenCalledTimes(1);
  });

  it("control: Shift+Enter does not start a generation", async () => {
    await pressInPromptField({ key: "Enter", keyCode: 13, shiftKey: true });
    expect(m.generateVideo).not.toHaveBeenCalled();
  });
});
