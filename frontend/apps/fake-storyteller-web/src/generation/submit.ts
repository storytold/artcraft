/**
 * Cost estimation and job submission, shared by all five `omni_gen` media types.
 *
 * Costs are deterministic functions of the request rather than a price table,
 * so a test can predict the credit balance after a generation without knowing
 * anything about real pricing.
 */

import { config } from "../config.ts";
import { nowIso } from "../state/clock.ts";
import type { InferenceCategory, JobRecord, PromptRecord, UserRecord } from "../state/entities.ts";
import { store } from "../state/store.ts";
import { makeToken, TOKEN_PREFIX } from "../state/tokens.ts";
import { readPromptTriggers } from "./prompt_flags.ts";

export type GenerationKind = "image" | "video" | "audio" | "mesh" | "splat";

/** Base price per media type, before batch and duration multipliers. */
const BASE_COST_CREDITS: Record<GenerationKind, number> = {
  image: 34,
  video: 210,
  audio: 60,
  mesh: 104,
  splat: 150,
};

const INFERENCE_CATEGORY: Record<GenerationKind, InferenceCategory> = {
  image: "image_generation",
  video: "video_generation",
  audio: "audio_generation",
  mesh: "object_generation",
  splat: "splat_generation",
};

const UUID_PATTERN = /^[0-9a-f]{32}$|^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface GenerateRequestBody {
  idempotency_token?: string;
  model?: string;
  prompt?: string;
  negative_prompt?: string;
  style_prompt?: string;
  resolution?: string;
  aspect_ratio?: string;
  quality?: string;
  bitrate?: string;
  duration_seconds?: number;
  image_batch_count?: number;
  video_batch_count?: number;
  generate_audio?: boolean;
  image_media_tokens?: string[];
  reference_image_media_tokens?: string[];
}

export interface CostBreakdown {
  cost_in_credits: number;
  cost_in_usd_cents: number;
  is_free: boolean;
  is_unlimited: boolean;
  is_rate_limited: boolean;
  has_watermark: boolean;
  failures_are_refunded: boolean;
}

export function estimateCost(kind: GenerationKind, body: GenerateRequestBody): CostBreakdown {
  const credits = BASE_COST_CREDITS[kind] * batchCount(kind, body) * durationMultiplier(kind, body);

  return {
    cost_in_credits: credits,
    cost_in_usd_cents: Math.ceil(credits / 3),
    is_free: false,
    is_unlimited: false,
    is_rate_limited: false,
    has_watermark: false,
    failures_are_refunded: true,
  };
}

export function batchCount(kind: GenerationKind, body: GenerateRequestBody): number {
  const requested = kind === "video" ? body.video_batch_count : body.image_batch_count;
  return Math.min(Math.max(requested ?? 1, 1), 4);
}

/** Whether this idempotency token has already been spent. */
export function isReplayedIdempotencyToken(token: string | undefined): boolean {
  return token !== undefined && store.usedIdempotencyTokens.has(token);
}

export function isValidIdempotencyToken(token: string | undefined): boolean {
  return token !== undefined && UUID_PATTERN.test(token);
}

export interface SubmittedGeneration {
  promptToken: string;
  jobTokens: string[];
}

/**
 * Record the prompt, spend the credits, and queue one job per batch item. The
 * resolver thread finishes them later; nothing here contacts a provider.
 */
export function submitGeneration(
  kind: GenerationKind,
  body: GenerateRequestBody,
  user: UserRecord,
): SubmittedGeneration {
  const cost = estimateCost(kind, body);
  spendCredits(user, cost.cost_in_credits);

  if (body.idempotency_token !== undefined) {
    store.usedIdempotencyTokens.add(body.idempotency_token);
  }

  const prompt = recordPrompt(kind, body);
  const triggers = readPromptTriggers(body.prompt);

  const resolveSeconds = triggers.resolveImmediately
    ? 0
    : triggers.overrideResolveSeconds ?? config.resolveSeconds;
  const resolveAtMillis = Date.now() + resolveSeconds * 1000;

  const count = batchCount(kind, body);
  const maybeBatchToken = count > 1 ? makeToken(TOKEN_PREFIX.batchGeneration) : undefined;
  const jobTokens: string[] = [];

  for (let index = 0; index < count; index += 1) {
    const timestamp = nowIso();
    const job: JobRecord = {
      jobToken: makeToken(TOKEN_PREFIX.inferenceJob),
      inferenceCategory: INFERENCE_CATEGORY[kind],
      status: "pending",
      progressPercentage: 0,
      maybePromptToken: prompt.token,
      maybeModelType: body.model,
      maybeModelTitle: body.model,
      maybeRawInferenceText: body.prompt,
      maybeCreatorUserToken: user.userToken,
      maybeBatchToken,
      maybeResultMediaFileToken: undefined,
      maybeFailureCategory: undefined,
      maybeFailureMessage: undefined,
      maybeSuccessfullyCompletedAt: undefined,
      resolveAtMillis,
      isDismissed: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    store.jobsByToken.set(job.jobToken, job);
    jobTokens.push(job.jobToken);
  }

  return { promptToken: prompt.token, jobTokens };
}

export function hasEnoughCredits(user: UserRecord, cost: number): boolean {
  return user.monthlyCredits + user.bankedCredits >= cost;
}

/** Spend monthly credits first, then banked, mirroring the real wallet order. */
function spendCredits(user: UserRecord, cost: number): void {
  const fromMonthly = Math.min(user.monthlyCredits, cost);
  user.monthlyCredits -= fromMonthly;
  user.bankedCredits = Math.max(0, user.bankedCredits - (cost - fromMonthly));
}

function recordPrompt(kind: GenerationKind, body: GenerateRequestBody): PromptRecord {
  const prompt: PromptRecord = {
    token: makeToken(TOKEN_PREFIX.prompt),
    promptType: `${kind}_generation`,
    maybePositivePrompt: body.prompt,
    maybeNegativePrompt: body.negative_prompt,
    maybeModelType: body.model,
    maybeModelClass: kind,
    maybeGenerationProvider: "artcraft",
    maybeAspectRatio: body.aspect_ratio,
    maybeResolution: body.resolution,
    maybeBatchCount: batchCount(kind, body),
    maybeDurationSeconds: body.duration_seconds,
    maybeStyleName: undefined,
    maybeGenerateAudio: body.generate_audio,
    contextImageMediaTokens: [
      ...(body.image_media_tokens ?? []),
      ...(body.reference_image_media_tokens ?? []),
    ],
    createdAt: nowIso(),
  };

  store.promptsByToken.set(prompt.token, prompt);
  return prompt;
}

function durationMultiplier(kind: GenerationKind, body: GenerateRequestBody): number {
  if (kind !== "video") {
    return 1;
  }
  return Math.max(1, Math.round((body.duration_seconds ?? 6) / 6));
}
