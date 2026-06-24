// Job polling for the PageDraw web adapter.
//
// Mirrors the create-image / create-vfx job loops: enqueue returns an
// inference job token, then we poll `GET /v1/jobs/job/<token>` until the
// job reaches a terminal state. On success we resolve the result media —
// preferring the batch (so multi-image generations all land) and falling
// back to the single media_links payload.
//
// Kept local to the pagedraw page (rather than imported from create-image)
// so the editor owns its own result shape and isn't coupled to that page's
// store types — same separation the artcraft-website pagedraw port used.

import { JobsApi, MediaFilesApi } from "@storyteller/api";

export interface PolledImage {
  media_token: string;
  cdn_url: string;
  maybe_thumbnail_template?: string;
}

export type PollResult =
  | { status: "pending"; images: PolledImage[] }
  | { status: "complete"; images: PolledImage[] }
  | { status: "failed"; images: PolledImage[]; error: string };

export async function pollJobOnce(jobToken: string): Promise<PollResult> {
  const jobsApi = new JobsApi();
  const response = await jobsApi.GetJobByToken({ token: jobToken });

  if (!response.success || !response.data) {
    return { status: "pending", images: [] };
  }

  const state = response.data;
  const statusStr = state.status?.status?.toLowerCase() ?? "";

  if (statusStr === "complete_success" || statusStr === "complete") {
    const result = state.maybe_result as Record<string, unknown> | undefined;
    const mediaLinks = (result as any)?.media_links;
    const entityToken = (result as any)?.entity_token as string | undefined;

    if (entityToken) {
      try {
        const mediaApi = new MediaFilesApi();
        const mediaFile = await mediaApi.GetMediaFileByToken({
          mediaFileToken: entityToken,
        });
        const batchToken = mediaFile.data?.maybe_batch_token;
        if (batchToken) {
          const batchResponse = await mediaApi.GetMediaFilesByBatchToken({
            batchToken,
          });
          if (batchResponse.success && batchResponse.data?.length) {
            const images: PolledImage[] = batchResponse.data
              .map((file: any) => ({
                media_token: file.token,
                cdn_url: file.media_links?.cdn_url,
                maybe_thumbnail_template:
                  file.media_links?.maybe_thumbnail_template,
              }))
              .filter((img: PolledImage) => img.cdn_url);
            if (images.length > 0) return { status: "complete", images };
          }
        }
      } catch {
        // Fall through to single-image extraction.
      }
    }

    if (mediaLinks?.cdn_url) {
      return {
        status: "complete",
        images: [
          {
            media_token: entityToken ?? jobToken,
            cdn_url: mediaLinks.cdn_url,
            maybe_thumbnail_template: mediaLinks.maybe_thumbnail_template,
          },
        ],
      };
    }

    return { status: "complete", images: [] };
  }

  if (
    statusStr.includes("fail") ||
    statusStr.includes("error") ||
    statusStr === "dead"
  ) {
    return {
      status: "failed",
      images: [],
      error:
        state.status?.maybe_failure_message ??
        state.status?.maybe_extra_status_description ??
        "Generation failed",
    };
  }

  return { status: "pending", images: [] };
}

export function startPolling(
  jobToken: string,
  onComplete: (images: PolledImage[]) => void,
  onError: (reason: string) => void,
  intervalMs = 3000,
  maxAttempts = 120,
): () => void {
  let attempts = 0;
  let stopped = false;

  const poll = async () => {
    if (stopped) return;
    attempts++;

    try {
      const result = await pollJobOnce(jobToken);
      if (stopped) return;

      if (result.status === "complete") return onComplete(result.images);
      if (result.status === "failed") return onError(result.error);
      if (attempts >= maxAttempts) return onError("Generation timed out");

      setTimeout(poll, intervalMs);
    } catch {
      if (!stopped && attempts < maxAttempts) {
        setTimeout(poll, intervalMs * 2);
      } else if (!stopped) {
        onError("Network error during polling");
      }
    }
  };

  setTimeout(poll, 2000);

  return () => {
    stopped = true;
  };
}
