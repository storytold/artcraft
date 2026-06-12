import toast from "react-hot-toast";
import {
  FilterMediaClasses,
  PromptsApi,
  downloadUrlToPath,
  promptDownloadLocationIfNeeded,
} from "@storyteller/api";
import type { Prompts } from "@storyteller/api";
import { DownloadUrl } from "@storyteller/tauri-api";
import {
  RefImage,
  RefVideo,
  RefAudio,
  usePromptImageStore,
  usePromptVideoStore,
} from "@storyteller/ui-promptbox";
import {
  useClassyModelSelectorStore,
  ModelPage,
} from "@storyteller/ui-model-selector";
import {
  IMAGE_MODELS_BY_ID,
  VIDEO_MODELS_BY_ID,
  CommonAspectRatio,
  CommonResolution,
} from "@storyteller/model-list";
import {
  galleryModalLightboxVisible,
  galleryModalVisibleDuringDrag,
  galleryModalVisibleViewMode,
} from "@storyteller/ui-gallery-modal";
import { getCachedPrompt } from "@storyteller/ui-generation-list";
import { useTabStore } from "~/pages/Stores/TabState";

// Media item actions shared by the TopBar gallery modal / lightbox wiring and
// the create pages' generation feed (rows + cards). All of them operate on
// global stores via getState(), so they're safe to call from anywhere.

export const SHARE_URL_BASE = "https://getartcraft.com/media/";

/** Download a media file, prompting for a location when configured to. */
export async function downloadMediaFileToDisk(url: string, mediaClass?: string) {
  try {
    const chosenPath = await promptDownloadLocationIfNeeded(url);
    if (chosenPath === null) {
      // User dismissed the picker.
      return;
    }
    if (typeof chosenPath === "string") {
      await downloadUrlToPath(url, chosenPath);
    } else {
      await DownloadUrl(url);
    }
    if (mediaClass === FilterMediaClasses.DIMENSIONAL) {
      toast.success(`Downloaded 3D model`);
    } else {
      toast.success(`Downloaded ${mediaClass}`);
    }
  } catch (error) {
    console.error(">>> Failed to download file:", error);
    // NB: Rust/Tauri should now flash a toast instead.
    //toast.error("Failed to download file");
  }
}

/** Seed the video page with `url` as the starting image and switch to it. */
export async function applyMakeVideoFromImage(url: string, mediaToken?: string) {
  try {
    const referenceImage: RefImage = {
      id: Math.random().toString(36).substring(7),
      url,
      file: new File([], "library-image"),
      mediaToken: mediaToken || "",
    };
    // Update zustand store for Video directly
    usePromptVideoStore.getState().setReferenceImages([referenceImage]);
    useTabStore.getState().setActiveTab("VIDEO");
    galleryModalVisibleViewMode.value = false;
    galleryModalVisibleDuringDrag.value = false;
    galleryModalLightboxVisible.value = false;
  } catch (e) {
    // no-op
  }
}

/** Copy a public share link for the media token. Returns success. */
export async function copyShareLink(mediaToken: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(`${SHARE_URL_BASE}${mediaToken}`);
    toast.success("Share link copied");
    return true;
  } catch {
    toast.error("Unable to copy link");
    return false;
  }
}

/**
 * Re-seed the image or video create page from a generation's prompt record
 * (prompt text, reference media, settings, model) and switch to that page.
 */
export function applyRecreateFromPromptData(data: {
  promptData: Prompts;
  mediaClass: string | undefined;
}) {
  try {
    const { promptData, mediaClass: recreateMediaClass } = data;
    const contextImages = promptData.maybe_context_images || [];

    // Partition context images by semantic type
    const imgRefs: RefImage[] = [];
    let endFrameImage: RefImage | undefined;
    const vidRefs: RefVideo[] = [];
    const audioRefs: RefAudio[] = [];

    for (const ci of contextImages) {
      const base = {
        id: Math.random().toString(36).substring(7),
        url: ci.media_links.cdn_url,
        mediaToken: ci.media_token,
      };

      switch (ci.semantic) {
        case "vid_end_frame":
          endFrameImage = { ...base, file: new File([], "recreate-ref") };
          break;
        case "vid_ref":
          vidRefs.push({
            ...base,
            file: new File([], "recreate-ref"),
            duration: 0,
          });
          break;
        case "audioref":
          audioRefs.push({
            ...base,
            file: new File([], "recreate-ref"),
            duration: 0,
          });
          break;
        default:
          // imgref, imgref_character, imgref_style, imgref_bg, imgsrc, vid_start_frame, imgmask
          imgRefs.push({ ...base, file: new File([], "recreate-ref") });
          break;
      }
    }

    // Determine input mode from generation_mode or context image semantics
    const hasKeyframeSemantics = contextImages.some(
      (ci) =>
        ci.semantic === "vid_start_frame" || ci.semantic === "vid_end_frame",
    );
    const inputMode: "keyframe" | "reference" =
      promptData.maybe_generation_mode === "keyframe" || hasKeyframeSemantics
        ? "keyframe"
        : promptData.maybe_generation_mode === "reference"
          ? "reference"
          : imgRefs.length > 0
            ? "reference"
            : "keyframe";

    const modelStore = useClassyModelSelectorStore.getState();

    if (recreateMediaClass === "video") {
      const videoStore = usePromptVideoStore.getState();

      // Set model first so the UI syncs sizeOptions / durationOptions
      const videoModel = promptData.maybe_model_type
        ? VIDEO_MODELS_BY_ID.get(promptData.maybe_model_type)
        : undefined;
      if (videoModel) {
        modelStore.setSelectedModel(ModelPage.ImageToVideo, videoModel);
      }

      if (promptData.maybe_positive_prompt) {
        videoStore.setPrompt(promptData.maybe_positive_prompt);
      }
      if (imgRefs.length > 0) videoStore.setReferenceImages(imgRefs);
      if (endFrameImage) videoStore.setEndFrameImage(endFrameImage);
      if (vidRefs.length > 0) videoStore.setReferenceVideos(vidRefs);
      if (audioRefs.length > 0) videoStore.setReferenceAudios(audioRefs);
      if (promptData.maybe_generate_audio !== null) {
        videoStore.setGenerateWithSound(promptData.maybe_generate_audio);
      }
      if (promptData.maybe_duration_seconds !== null) {
        videoStore.setDuration(promptData.maybe_duration_seconds);
      }

      // Map API aspect ratio (tauriValue like "wide_sixteen_by_nine") → textLabel (like "16:9")
      if (promptData.maybe_aspect_ratio && videoModel?.sizeOptions) {
        const match = videoModel.sizeOptions.find(
          (opt) => opt.tauriValue === promptData.maybe_aspect_ratio,
        );
        if (match) {
          videoStore.setAspectRatio(match.textLabel);
        }
      }

      // Map API resolution (like "one_k") → video store format (like "1080p")
      if (promptData.maybe_resolution && videoModel?.resolutionOptions) {
        const resolutionMap: Record<string, string> = {
          one_k: "1080p",
          two_k: "2k",
          three_k: "3k",
          four_k: "4k",
        };
        const mapped = resolutionMap[promptData.maybe_resolution];
        if (mapped && videoModel.resolutionOptions.includes(mapped)) {
          videoStore.setResolution(mapped);
        }
      }

      videoStore.setInputMode(inputMode);
      useTabStore.getState().setActiveTab("VIDEO");
    } else {
      // Default to image
      const imageStore = usePromptImageStore.getState();

      if (promptData.maybe_positive_prompt) {
        imageStore.setPrompt(promptData.maybe_positive_prompt);
      }
      if (imgRefs.length > 0) imageStore.setReferenceImages(imgRefs);
      if (promptData.maybe_aspect_ratio) {
        imageStore.setCommonAspectRatio(
          promptData.maybe_aspect_ratio as CommonAspectRatio,
        );
      }
      if (promptData.maybe_resolution) {
        imageStore.setCommonResolution(
          promptData.maybe_resolution as CommonResolution,
        );
      }

      if (promptData.maybe_model_type) {
        const model = IMAGE_MODELS_BY_ID.get(promptData.maybe_model_type);
        if (model) modelStore.setSelectedModel(ModelPage.TextToImage, model);
      }
      useTabStore.getState().setActiveTab("IMAGE");
    }

    galleryModalVisibleViewMode.value = false;
    galleryModalVisibleDuringDrag.value = false;
    galleryModalLightboxVisible.value = false;
  } catch (e) {
    // no-op
  }
}

/**
 * Recreate from a prompt token: resolve the prompt record (shared cache
 * first, then the API), then seed the create page from it.
 */
export async function applyRecreateFromPromptToken(
  promptToken: string,
  mediaClass: "image" | "video",
) {
  let promptData: Prompts | undefined = getCachedPrompt(promptToken);
  if (!promptData) {
    try {
      const res = await new PromptsApi().BatchGetPrompts({
        tokens: [promptToken],
      });
      promptData = res.success && res.data?.[0] ? res.data[0] : undefined;
    } catch {
      // handled below
    }
  }
  if (!promptData) {
    toast.error("Could not load the original prompt.");
    return;
  }
  applyRecreateFromPromptData({ promptData, mediaClass });
}
