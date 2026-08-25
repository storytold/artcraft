import { type GenerationKind, isKnownModel } from "./catalogue";

/**
 * Cost estimates — ported from `infra/fake-storyteller-web` (generation/submit.ts). One base
 * price per kind, times the batch count, times the video duration in 6-second units. Real
 * prices are per model and plan; these only need to be plausible and deterministic.
 */

const BASE_COST_CREDITS: Record<GenerationKind, number> = {
  image: 34,
  video: 210,
  audio: 60,
  mesh: 104,
  splat: 150,
};

export interface CostRequest {
  model?: string | null;
  image_batch_count?: number | null;
  video_batch_count?: number | null;
  duration_seconds?: number | null;
  [field: string]: unknown;
}

export interface CostFailure {
  readonly message: string;
}

export function validateCostRequest(
  kind: GenerationKind,
  body: CostRequest,
): CostFailure | undefined {
  if (typeof body.model !== "string" || body.model.length === 0) {
    return { message: "no model supplied" };
  }
  if (!isKnownModel(kind, body.model)) {
    return { message: `unknown model: ${body.model}` };
  }
  return undefined;
}

export function estimateCost(kind: GenerationKind, body: CostRequest): Record<string, unknown> {
  const credits = BASE_COST_CREDITS[kind] * batchCount(kind, body) * durationMultiplier(kind, body);
  return {
    success: true,
    cost_in_credits: credits,
    cost_in_usd_cents: Math.ceil(credits / 3),
    is_free: false,
    is_unlimited: false,
    is_rate_limited: false,
    has_watermark: false,
    failures_are_refunded: true,
  };
}

function batchCount(kind: GenerationKind, body: CostRequest): number {
  const requested =
    kind === "image" ? body.image_batch_count : kind === "video" ? body.video_batch_count : 1;
  return Math.max(1, requested ?? 1);
}

function durationMultiplier(kind: GenerationKind, body: CostRequest): number {
  if (kind !== "video") return 1;
  return Math.max(1, Math.round((body.duration_seconds ?? 6) / 6));
}
