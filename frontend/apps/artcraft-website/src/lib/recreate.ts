import type { NavigateFunction } from "react-router-dom";
import {
  MediaFilesApi,
  PromptsApi,
  type Prompts,
} from "@storyteller/api";
import { toast } from "../components/toast/toast";
import type {
  RefAudio,
  RefImage,
  RefVideo,
} from "../components/prompt-box/types";
import { useCreateImageStore } from "../pages/create-image/create-image-store";
import {
  useCreateVideoStore,
  type VideoInputMode,
} from "../pages/create-video/create-video-store";

// ── Types ──────────────────────────────────────────────────────────────────

export type RecreateMediaClass = "image" | "video";

export interface RecreatePayload {
  prompt: string;
  referenceImages: RefImage[];
  aspectRatio?: string;
  resolution?: string;
  modelId?: string;
  // video-only
  endFrameImage?: RefImage;
  referenceVideos?: RefVideo[];
  referenceAudios?: RefAudio[];
  generateWithSound?: boolean;
  durationSeconds?: number;
  inputMode?: VideoInputMode;
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function applyRecreateFromMediaToken(
  mediaToken: string,
  fallbackMediaClass: RecreateMediaClass,
  navigate: NavigateFunction,
): Promise<void> {
  try {
    const promptData = await fetchPromptForMedia(mediaToken);
    if (!promptData) {
      toast.error("Recreate unavailable for this media");
      return;
    }
    const mediaClass = resolveMediaClass(promptData, fallbackMediaClass);
    if (!mediaClass) {
      toast.error("Recreate not supported for this media type");
      return;
    }
    const payload = buildRecreatePayload(promptData, mediaClass);
    if (mediaClass === "video") {
      useCreateVideoStore.getState().setPendingRecreate(payload);
      navigate("/create-video");
    } else {
      useCreateImageStore.getState().setPendingRecreate(payload);
      navigate("/create-image");
    }
  } catch {
    toast.error("Failed to load recreate data");
  }
}

// Prefer the authoritative `maybe_model_class` from the prompt (image/video/
// audio/3d/…) over a URL-based guess. Unsupported classes return null so the
// caller can short-circuit with a clear error.
function resolveMediaClass(
  promptData: Prompts,
  fallback: RecreateMediaClass,
): RecreateMediaClass | null {
  const cls = promptData.maybe_model_class;
  if (cls === "image") return "image";
  if (cls === "video") return "video";
  if (cls && cls !== "") return null;
  return fallback;
}

export function buildRecreatePayload(
  promptData: Prompts,
  mediaClass: RecreateMediaClass,
): RecreatePayload {
  const contextImages = promptData.maybe_context_images || [];
  const { referenceImages, endFrameImage, referenceVideos, referenceAudios } =
    partitionContextImages(contextImages);

  const payload: RecreatePayload = {
    prompt: promptData.maybe_positive_prompt || "",
    referenceImages,
    aspectRatio: promptData.maybe_aspect_ratio || undefined,
    resolution: promptData.maybe_resolution || undefined,
    modelId: promptData.maybe_model_type || undefined,
  };

  if (mediaClass === "video") {
    payload.endFrameImage = endFrameImage;
    payload.referenceVideos = referenceVideos;
    payload.referenceAudios = referenceAudios;
    payload.generateWithSound = promptData.maybe_generate_audio ?? undefined;
    payload.durationSeconds = promptData.maybe_duration_seconds ?? undefined;
    payload.inputMode = inferInputMode(promptData, referenceImages);
  }

  return payload;
}

// ── Internals ──────────────────────────────────────────────────────────────

async function fetchPromptForMedia(
  mediaToken: string,
): Promise<Prompts | null> {
  const mediaApi = new MediaFilesApi();
  const mediaResp = await mediaApi.GetMediaFileByToken({
    mediaFileToken: mediaToken,
  });
  if (!mediaResp.success || !mediaResp.data?.maybe_prompt_token) return null;

  const promptsApi = new PromptsApi();
  const promptResp = await promptsApi.GetPromptsByToken({
    token: mediaResp.data.maybe_prompt_token,
  });
  return promptResp.success ? promptResp.data ?? null : null;
}

interface PartitionedContext {
  referenceImages: RefImage[];
  endFrameImage?: RefImage;
  referenceVideos: RefVideo[];
  referenceAudios: RefAudio[];
}

function partitionContextImages(
  contextImages: { semantic: string; media_token: string; media_links: { cdn_url: string } }[],
): PartitionedContext {
  const referenceImages: RefImage[] = [];
  let endFrameImage: RefImage | undefined;
  const referenceVideos: RefVideo[] = [];
  const referenceAudios: RefAudio[] = [];

  for (const ci of contextImages) {
    const base = {
      id: crypto.randomUUID(),
      url: ci.media_links.cdn_url,
      mediaToken: ci.media_token,
      file: new File([], "recreate-ref"),
    };

    switch (ci.semantic) {
      case "vid_end_frame":
        endFrameImage = base;
        break;
      case "vid_ref":
        referenceVideos.push({ ...base, duration: 0 });
        break;
      case "audioref":
        referenceAudios.push({ ...base, duration: 0 });
        break;
      default:
        // imgref, imgref_character, imgref_style, imgref_bg, imgsrc,
        // vid_start_frame, imgmask → image reference row
        referenceImages.push(base);
        break;
    }
  }

  return { referenceImages, endFrameImage, referenceVideos, referenceAudios };
}

function inferInputMode(
  promptData: Prompts,
  referenceImages: RefImage[],
): VideoInputMode {
  const mode = promptData.maybe_generation_mode;
  if (mode === "keyframe" || mode === "reference") return mode;
  const hasKeyframeSemantics = (promptData.maybe_context_images || []).some(
    (ci) => ci.semantic === "vid_start_frame" || ci.semantic === "vid_end_frame",
  );
  if (hasKeyframeSemantics) return "keyframe";
  return referenceImages.length > 0 ? "reference" : "keyframe";
}
