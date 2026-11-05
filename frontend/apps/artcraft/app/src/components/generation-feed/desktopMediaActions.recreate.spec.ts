// desktopMediaActions.recreate.spec: checks that "Recreate" loads exactly what the original request had.
// Recreate seeds the create page from a saved prompt record. If a slot the original did not use (reference
// images, end frame, reference videos/audio, prompt text) is simply skipped, whatever the user had typed or
// attached before stays in the box and is sent along with the "recreated" request.
// Everything the module imports is replaced with small stand-ins, so only the seeding logic is exercised.
import { beforeEach, describe, expect, it, vi } from "vitest";

// Shared handles the mock factories below can see (vi.mock calls are hoisted above normal variables).
const m = vi.hoisted(() => ({
  video: {
    setPrompt: vi.fn(),
    setReferenceImages: vi.fn(),
    setEndFrameImage: vi.fn(),
    setReferenceVideos: vi.fn(),
    setReferenceAudios: vi.fn(),
    setGenerateWithSound: vi.fn(),
    setDuration: vi.fn(),
    setAspectRatio: vi.fn(),
    setResolution: vi.fn(),
    setInputMode: vi.fn(),
  },
  image: {
    setPrompt: vi.fn(),
    setReferenceImages: vi.fn(),
    setCommonAspectRatio: vi.fn(),
    setCommonResolution: vi.fn(),
  },
}));

vi.mock("react-hot-toast", () => ({ default: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn(), loading: vi.fn() }) }));
vi.mock("@storyteller/api", () => ({ FilterMediaClasses: {}, PromptsApi: class {} }));
vi.mock("@storyteller/tauri-api", () => ({
  DownloadUrl: vi.fn(),
  downloadUrlToPath: vi.fn(),
  promptDownloadLocationIfNeeded: vi.fn(),
  pickDownloadDirectory: vi.fn(),
  useModelsStore: { getState: () => ({ videoModels: [], imageModels: [] }) },
}));
vi.mock("@storyteller/ui-promptbox", () => ({
  usePromptImageStore: { getState: () => m.image },
  usePromptVideoStore: { getState: () => m.video },
}));
vi.mock("@storyteller/ui-model-selector", () => ({
  useClassyModelSelectorStore: { getState: () => ({ setSelectedModel: vi.fn() }) },
  ModelPage: {},
}));
vi.mock("@storyteller/model-list", () => ({
  IMAGE_MODELS_BY_ID: new Map(),
  VIDEO_MODELS_BY_ID: new Map(),
  CommonAspectRatio: {},
  CommonResolution: {},
  videoResolutionValue: () => undefined,
}));
vi.mock("@storyteller/ui-gallery-modal", () => ({
  galleryModalLightboxVisible: { value: false },
  galleryModalVisibleDuringDrag: { value: false },
  galleryModalVisibleViewMode: { value: false },
}));
vi.mock("@storyteller/ui-generation-list", () => ({ getCachedPrompt: vi.fn() }));
vi.mock("~/pages/Stores/TabState", () => ({
  useTabStore: { getState: () => ({ setActiveTab: vi.fn() }) },
}));

import { applyRecreateFromPromptData } from "./desktopMediaActions";

// A saved prompt record with only the fields Recreate reads; the original used NO reference media and NO prompt text.
const bareRecord = () =>
  ({
    maybe_positive_prompt: null,
    maybe_context_images: [],
    maybe_model_type: null,
    maybe_generation_mode: null,
    maybe_generate_audio: null,
    maybe_duration_seconds: null,
    maybe_aspect_ratio: null,
    maybe_resolution: null,
  }) as never;

describe("applyRecreateFromPromptData clears slots the original did not use", () => {
  beforeEach(() => {
    Object.values(m.video).forEach((fn) => fn.mockReset());
    Object.values(m.image).forEach((fn) => fn.mockReset());
  });

  it("empties the video prompt box's reference media and prompt text", () => {
    applyRecreateFromPromptData({ promptData: bareRecord(), mediaClass: "video" });
    expect(m.video.setPrompt).toHaveBeenCalledWith("");
    expect(m.video.setReferenceImages).toHaveBeenCalledWith([]);
    expect(m.video.setEndFrameImage).toHaveBeenCalledWith(undefined);
    expect(m.video.setReferenceVideos).toHaveBeenCalledWith([]);
    expect(m.video.setReferenceAudios).toHaveBeenCalledWith([]);
  });

  it("empties the image prompt box's reference images and prompt text", () => {
    applyRecreateFromPromptData({ promptData: bareRecord(), mediaClass: "image" });
    expect(m.image.setPrompt).toHaveBeenCalledWith("");
    expect(m.image.setReferenceImages).toHaveBeenCalledWith([]);
  });

  it("still loads the original prompt text and references when there are some", () => {
    const record = {
      ...(bareRecord() as object),
      maybe_positive_prompt: "a red fox",
      maybe_context_images: [
        { semantic: "imgref", media_token: "mf_1", media_links: { cdn_url: "https://cdn.example/1.png" } },
      ],
    } as never;
    applyRecreateFromPromptData({ promptData: record, mediaClass: "image" });
    expect(m.image.setPrompt).toHaveBeenCalledWith("a red fox");
    expect(m.image.setReferenceImages.mock.calls[0][0]).toHaveLength(1);
  });
});
