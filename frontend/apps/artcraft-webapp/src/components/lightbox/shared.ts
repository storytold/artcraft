import { useCallback, useEffect, useRef, useState } from "react";
import {
  formatAspectRatio,
  formatDuration,
  formatResolution,
} from "@storyteller/common";

export { formatAspectRatio, formatDuration, formatResolution };

export const SHARE_URL_BASE = "https://getartcraft.com/media/";
export const COPY_FEEDBACK_DURATION = 1500;

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".avi", ".mkv", ".m4v"];
const MODEL_3D_EXTENSIONS = [".glb", ".gltf", ".fbx", ".spz"];

export const isVideoUrl = (url: string): boolean =>
  VIDEO_EXTENSIONS.some((ext) => url.toLowerCase().includes(ext));

export const is3DModelUrl = (url: string): boolean =>
  MODEL_3D_EXTENSIONS.some((ext) => url.toLowerCase().includes(ext));

export interface ContextImage {
  media_links: {
    cdn_url: string;
    maybe_thumbnail_template: string | null;
    maybe_video_previews: {
      still: string;
      still_thumbnail_template: string;
    } | null;
  };
  media_token: string;
  semantic: string;
}

export interface PromptData {
  text: string | null;
  loading: boolean;
  hasToken: boolean;
  provider: string | null;
  modelType: string | null;
  modelClass: string | null;
  contextImages: ContextImage[] | null;
  aspectRatio: string | null;
  resolution: string | null;
  durationSeconds: number | null;
  generationMode: string | null;
  generateAudio: boolean | null;
}

export const EMPTY_PROMPT: PromptData = {
  text: null,
  loading: false,
  hasToken: false,
  provider: null,
  modelType: null,
  modelClass: null,
  contextImages: null,
  aspectRatio: null,
  resolution: null,
  durationSeconds: null,
  generationMode: null,
  generateAudio: null,
};

export const createPromptData = (
  data: any,
  hasToken: boolean,
  loading = false,
): PromptData => ({
  text: data?.maybe_positive_prompt || null,
  loading,
  hasToken,
  provider: data?.maybe_generation_provider || null,
  modelType: data?.maybe_model_type || null,
  modelClass: data?.maybe_model_class || null,
  contextImages: data?.maybe_context_images || null,
  aspectRatio: data?.maybe_aspect_ratio || null,
  resolution: data?.maybe_resolution || null,
  durationSeconds: data?.maybe_duration_seconds ?? null,
  generationMode: data?.maybe_generation_mode || null,
  generateAudio: data?.maybe_generate_audio ?? null,
});

export function useCopyFeedback() {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const trigger = useCallback(() => {
    setCopied(true);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      setCopied(false);
      timeoutRef.current = null;
    }, COPY_FEEDBACK_DURATION);
  }, []);

  useEffect(
    () => () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    },
    [],
  );

  return { copied, trigger };
}
