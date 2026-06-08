import { useCallback, useState, type MouseEvent } from "react";
import { useNavigate, type NavigateFunction } from "react-router-dom";
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

// Seeds the video page with an image as the sole reference and navigates there.
// Shares the existing `pendingRecreate` slot on the video store so the create-
// video page's consume-effect handles wiring it into the prompt box.
export function applyMakeVideoFromImage(
  mediaToken: string,
  mediaUrl: string,
  navigate: NavigateFunction,
): void {
  useCreateVideoStore.getState().setPendingRecreate({
    prompt: "",
    referenceImages: [
      {
        id: crypto.randomUUID(),
        url: mediaUrl,
        file: new File([], "make-video-ref"),
        mediaToken,
      },
    ],
    referenceVideos: [],
    referenceAudios: [],
    inputMode: "reference",
  });
  navigate("/create-video");
}

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
    applyRecreateFromPromptData(promptData, fallbackMediaClass, navigate);
  } catch {
    toast.error("Failed to load recreate data");
  }
}

// Recreate variant for items that already know their prompt token but have no
// media file to look up — used for failed generations, where the prompt exists
// but no entity was produced.
export async function applyRecreateFromPromptToken(
  promptToken: string,
  fallbackMediaClass: RecreateMediaClass,
  navigate: NavigateFunction,
): Promise<void> {
  try {
    const promptsApi = new PromptsApi();
    const resp = await promptsApi.GetPromptsByToken({ token: promptToken });
    const promptData = resp.success ? resp.data ?? null : null;
    if (!promptData) {
      toast.error("Recreate data unavailable");
      return;
    }
    applyRecreateFromPromptData(promptData, fallbackMediaClass, navigate);
  } catch {
    toast.error("Failed to load recreate data");
  }
}

// Hook wrapping the prompt-token recreate flow with its own loading state.
// Shared by every card that recreates from a known prompt token (in-progress /
// failed gallery cards and the task-queue rows) so the button behaves
// identically everywhere. `handleRecreate` swallows the click so it doesn't
// bubble to a parent card's onClick.
export function useRecreateFromPromptToken(
  promptToken: string | undefined,
  mediaClass: RecreateMediaClass,
): {
  isRecreating: boolean;
  handleRecreate: (e?: MouseEvent) => void;
} {
  const navigate = useNavigate();
  const [isRecreating, setIsRecreating] = useState(false);

  const handleRecreate = useCallback(
    async (e?: MouseEvent) => {
      e?.stopPropagation();
      if (!promptToken || isRecreating) return;
      setIsRecreating(true);
      try {
        await applyRecreateFromPromptToken(promptToken, mediaClass, navigate);
      } finally {
        setIsRecreating(false);
      }
    },
    [promptToken, mediaClass, navigate, isRecreating],
  );

  return { isRecreating, handleRecreate };
}

function applyRecreateFromPromptData(
  promptData: Prompts,
  fallbackMediaClass: RecreateMediaClass,
  navigate: NavigateFunction,
): void {
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
