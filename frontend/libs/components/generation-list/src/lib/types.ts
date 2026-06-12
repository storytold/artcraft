// Canonical data shapes for the merged generation feed (in-progress / failed /
// completed). Hosts (webapp, desktop) map their own job sources into these.

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
  mediaClass: "image" | "video";
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
  mediaClass: "image" | "video";
}
