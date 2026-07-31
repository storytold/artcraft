/**
 * The background resolver.
 *
 * Submitted jobs sit `pending`, tick their progress upward, then land in
 * `complete_success` or `complete_failure`. This is what makes the fake usable
 * for the flow the team actually needs to exercise: submit, watch a spinner for
 * a few seconds, then get a result or a specific failure.
 */

import { nowIso } from "../state/clock.ts";
import type { JobRecord, MediaFileRecord } from "../state/entities.ts";
import { createMediaFile, createMediaFileFromFixture } from "../state/media_factory.ts";
import { store } from "../state/store.ts";
import { makeGlbBytes, makePlyBytes, makeWavBytes } from "../state/synthetic_assets.ts";
import { readPromptTriggers } from "./prompt_flags.ts";

const TICK_INTERVAL_MILLIS = 500;

/** Progress stops here until the job actually completes, so 100% always means done. */
const MAX_PENDING_PROGRESS = 95;

export function startGenerationResolver(): void {
  const timer = setInterval(tick, TICK_INTERVAL_MILLIS);
  timer.unref();
}

function tick(): void {
  const now = Date.now();

  for (const job of store.jobsByToken.values()) {
    if (job.status !== "pending" && job.status !== "started") {
      continue;
    }

    if (now >= job.resolveAtMillis) {
      finishJob(job);
      continue;
    }

    advanceProgress(job, now);
  }
}

function advanceProgress(job: JobRecord, now: number): void {
  const startedAtMillis = Date.parse(job.createdAt);
  const totalMillis = Math.max(1, job.resolveAtMillis - startedAtMillis);
  const fraction = Math.min(1, Math.max(0, (now - startedAtMillis) / totalMillis));

  job.status = "started";
  job.progressPercentage = Math.floor(fraction * MAX_PENDING_PROGRESS);
  job.updatedAt = nowIso();
}

function finishJob(job: JobRecord): void {
  const triggers = readPromptTriggers(promptTextFor(job));

  if (triggers.failWithCategory !== undefined) {
    job.status = "complete_failure";
    job.progressPercentage = 0;
    job.maybeFailureCategory = triggers.failWithCategory;
    job.maybeFailureMessage = `fake-storyteller-web: forced failure (${triggers.failWithCategory}).`;
    job.updatedAt = nowIso();
    console.log(`[fake-api] job ${job.jobToken} failed on purpose (${triggers.failWithCategory})`);
    return;
  }

  const result = createResultMediaFile(job);

  job.status = "complete_success";
  job.progressPercentage = 100;
  job.maybeResultMediaFileToken = result.token;
  job.maybeSuccessfullyCompletedAt = nowIso();
  job.updatedAt = job.maybeSuccessfullyCompletedAt;
  console.log(`[fake-api] job ${job.jobToken} completed -> ${result.token}`);
}

function createResultMediaFile(job: JobRecord): MediaFileRecord {
  const shared = {
    maybeCreatorUserToken: job.maybeCreatorUserToken,
    maybePromptToken: job.maybePromptToken,
    maybeBatchToken: job.maybeBatchToken,
    maybeOriginModelType: job.maybeModelType,
    maybeTitle: job.maybeRawInferenceText?.slice(0, 80),
    originCategory: "inference" as const,
    isUserUpload: false,
  };

  switch (job.inferenceCategory) {
    case "video_generation":
      return createMediaFileFromFixture("video", {
        ...shared,
        mediaClass: "video",
        mediaType: "mp4",
        bucketPrefix: "video_",
        extension: ".mp4",
        originProductCategory: "video_gen",
        maybeDurationMillis: 5_000,
      });

    case "audio_generation":
      return createMediaFile({
        ...shared,
        bytes: makeWavBytes(),
        mediaClass: "audio",
        mediaType: "wav",
        bucketPrefix: "audio_",
        extension: ".wav",
        originProductCategory: "unknown",
        maybeDurationMillis: 2_000,
      });

    case "object_generation":
      return createMediaFile({
        ...shared,
        bytes: makeGlbBytes(),
        mediaClass: "mesh",
        mediaType: "glb",
        bucketPrefix: "engine_",
        extension: ".glb",
        originProductCategory: "world_gen",
      });

    case "splat_generation":
      return createMediaFile({
        ...shared,
        bytes: makePlyBytes(),
        mediaClass: "splat",
        mediaType: "ply",
        bucketPrefix: "splat_",
        extension: ".ply",
        originProductCategory: "world_gen",
      });

    default:
      return createMediaFileFromFixture("image", {
        ...shared,
        mediaClass: "image",
        mediaType: "jpg",
        bucketPrefix: "image_",
        extension: ".jpg",
        originProductCategory: "image_gen",
      });
  }
}

function promptTextFor(job: JobRecord): string | undefined {
  if (job.maybeRawInferenceText !== undefined) {
    return job.maybeRawInferenceText;
  }
  if (job.maybePromptToken === undefined) {
    return undefined;
  }
  return store.promptsByToken.get(job.maybePromptToken)?.maybePositivePrompt;
}
