import { useCallback, useEffect, useRef, useState } from "react";

export const SHARE_URL_BASE = "https://getartcraft.com/media/";
export const COPY_FEEDBACK_DURATION = 1500;

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".avi", ".mkv", ".m4v"];
const MODEL_3D_EXTENSIONS = [".glb", ".gltf", ".fbx", ".spz"];

export const isVideoUrl = (url: string): boolean =>
  VIDEO_EXTENSIONS.some((ext) => url.toLowerCase().includes(ext));

export const is3DModelUrl = (url: string): boolean =>
  MODEL_3D_EXTENSIONS.some((ext) => url.toLowerCase().includes(ext));

export interface ContextImage {
  media_links: { cdn_url: string; maybe_thumbnail_template: string | null };
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

// ── Display helpers for prompt metadata ────────────────────────────────────

const ASPECT_RATIO_LABELS: Record<string, string> = {
  auto: "Auto",
  square: "Square",
  square_hd: "Square (HD)",
  wide: "Wide",
  tall: "Tall",
  wide_three_by_two: "3:2",
  wide_four_by_three: "4:3",
  wide_five_by_four: "5:4",
  wide_sixteen_by_nine: "16:9",
  wide_twenty_one_by_nine: "21:9",
  tall_two_by_three: "2:3",
  tall_three_by_four: "3:4",
  tall_four_by_five: "4:5",
  tall_nine_by_sixteen: "9:16",
  tall_nine_by_twenty_one: "9:21",
  auto_2k: "Auto (2K)",
  auto_3k: "Auto (3K)",
  auto_4k: "Auto (4K)",
};

const RESOLUTION_LABELS: Record<string, string> = {
  half_k: "0.5K",
  one_k: "1K",
  two_k: "2K",
  three_k: "3K",
  four_k: "4K",
  four_eighty_p: "480p",
  seven_twenty_p: "720p",
  ten_eighty_p: "1080p",
};

export const formatAspectRatio = (value: string): string =>
  ASPECT_RATIO_LABELS[value] ?? value;

export const formatResolution = (value: string): string =>
  RESOLUTION_LABELS[value] ?? value;

export const formatDuration = (seconds: number): string =>
  `${seconds}s`;

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
