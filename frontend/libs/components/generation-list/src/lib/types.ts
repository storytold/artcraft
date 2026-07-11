// Canonical data shapes for the merged generation feed (in-progress / failed /
// completed). Hosts (webapp, desktop) map their own job sources into these.

export type GenerationMediaClass =
  | "image"
  | "video"
  | "audio"
  | "dimensional";

// The backend used to file all 3D media under the (now deprecated) coarse
// "dimensional" class; new records are written as "mesh" (3D models) or
// "splat" (gaussian splats). Treat all three as 3D.
export function is3DMediaClass(mediaClass: string | undefined | null): boolean {
  return (
    mediaClass === "dimensional" ||
    mediaClass === "mesh" ||
    mediaClass === "splat"
  );
}

/** Plural noun for batch captions, e.g. "Generating 4 images". */
export function batchNoun(mediaClass: GenerationMediaClass): string {
  switch (mediaClass) {
    case "video":
      return "videos";
    case "audio":
      return "audio clips";
    case "dimensional":
      return "3D models";
    default:
      return "images";
  }
}

export interface GalleryItem {
  id: string;
  label: string;
  thumbnail: string | null;
  fullImage: string | null;
  createdAt: string;
  mediaClass: string;
  modelId?: string;
  batchImageToken?: string;
  // Token for the generation's prompt record. The list view resolves it
  // (via the shared prompts cache) to show the real prompt + model.
  promptToken?: string;
  // Playback length for audio (and video) items, when the API knows it.
  durationMillis?: number;
}

export interface InProgressJob {
  id: string;
  prompt: string;
  modelId: string;
  modelLabel: string;
  progress: number;
  estimatedTimeLeftMs?: number;
  createdAt: string;
  batchCount?: number;
  // Prompt token + media class enable the "Recreate" action while the job is
  // still running, mirroring the failed/completed cards.
  promptToken?: string;
  mediaClass: GenerationMediaClass;
}

export interface FailedJob {
  id: string;
  prompt: string;
  modelId: string;
  modelLabel: string;
  failureReason?: string;
  failureMessage?: string;
  status: string;
  createdAt: string;
  promptToken?: string;
  refImageUrl?: string;
  mediaClass: GenerationMediaClass;
}
