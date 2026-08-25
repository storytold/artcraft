import { z } from "zod";

import { GENERATION_KINDS, type GenerationKind } from "./list-models";
import { READ_ONLY_ANNOTATIONS, type ToolDefinition, unwrapUpstream } from "./types";

/**
 * "What would this generation cost?" — the cost endpoints take the same body as the generate
 * endpoints, so the tool accepts that body (per kind) and passes it through; upstream is the
 * validator. The estimate is anonymous upstream (no session lookup), so it reflects public
 * pricing rather than the caller's plan — the output says so.
 */

const PUBLIC_PRICING_NOTE =
  "Public pricing. Artcraft estimates costs without looking at the caller's plan, so a " +
  "subscription or unlimited plan may make this cheaper or free; check get_credit_balance.";

const inputSchema = {
  kind: z
    .enum(GENERATION_KINDS)
    .describe("What would be generated: image, video, audio, mesh, or splat."),
  model: z.string().min(1).describe("Model id from list_models for this kind, e.g. seedance_2p0."),
  parameters: z
    .record(z.string(), z.unknown())
    .optional()
    .describe(
      "Any other fields the generate endpoint for this kind accepts, named exactly as the API " +
        "does — e.g. prompt, aspect_ratio, resolution, quality, duration_seconds, " +
        "image_batch_count / video_batch_count, generate_audio, reference_*_media_tokens. Valid " +
        "values come from the model's capabilities in list_models. Omit what you do not need.",
    ),
};

const outputSchema = {
  kind: z.enum(GENERATION_KINDS),
  model: z.string(),
  cost_in_credits: z
    .number()
    .int()
    .nonnegative()
    .nullable()
    .describe("Estimated credits, or null if unknown."),
  cost_in_usd_cents: z
    .number()
    .int()
    .nonnegative()
    .nullable()
    .describe("Estimated US cents, or null if unknown."),
  is_free: z.boolean().describe("True when the generation is free under public pricing."),
  is_unlimited: z.boolean(),
  is_rate_limited: z.boolean().describe("True when generations are currently rate limited."),
  has_watermark: z.boolean().describe("True when the output would carry a watermark."),
  failures_are_refunded: z
    .boolean()
    .nullable()
    .describe("True/false when known; null when it varies."),
  pricing_note: z.string(),
};

interface RawEstimate {
  cost_in_credits?: number | null;
  cost_in_usd_cents?: number | null;
  is_free: boolean;
  is_unlimited: boolean;
  is_rate_limited: boolean;
  has_watermark: boolean;
  failures_are_refunded?: boolean | null;
}

export const estimateCost: ToolDefinition<typeof inputSchema, typeof outputSchema> = {
  name: "estimate_cost",
  title: "Estimate cost",
  description:
    "Estimates what a generation would cost in Artcraft credits (and US cents) before anyone " +
    "spends anything. Give the kind, the model id, and the same parameters the generation would " +
    "use (see list_models for valid values). Returns public pricing — the caller's plan is not " +
    "applied — plus whether the output is watermarked and whether failures are refunded. Does not " +
    "generate anything.",
  requiredScope: "read:catalog",
  inputSchema,
  outputSchema,
  annotations: { ...READ_ONLY_ANNOTATIONS, title: "Estimate cost" },

  async handler({ upstream }, { kind, model, parameters }) {
    const body = { ...stripNulls(parameters ?? {}), model };
    const raw = await requestEstimate(upstream, kind, body);
    const structured = {
      kind,
      model,
      cost_in_credits: raw.cost_in_credits ?? null,
      cost_in_usd_cents: raw.cost_in_usd_cents ?? null,
      is_free: raw.is_free,
      is_unlimited: raw.is_unlimited,
      is_rate_limited: raw.is_rate_limited,
      has_watermark: raw.has_watermark,
      failures_are_refunded: raw.failures_are_refunded ?? null,
      pricing_note: PUBLIC_PRICING_NOTE,
    };
    return { structured, text: describe(structured) };
  },
};

/** The cost endpoints are typed per kind; the body is the caller's parameters plus the model. */
async function requestEstimate(
  upstream: Parameters<typeof estimateCost.handler>[0]["upstream"],
  kind: GenerationKind,
  body: Record<string, unknown>,
): Promise<RawEstimate> {
  // Each endpoint's request type is a distinct object of optional fields; the caller's
  // parameters are validated upstream (a 400 surfaces its message). The cast is the
  // pass-through boundary, kept in one place.
  switch (kind) {
    case "image":
      return unwrapUpstream(
        await upstream.POST("/v1/omni_gen/cost/image", { body: body as never }),
      );
    case "video":
      return unwrapUpstream(
        await upstream.POST("/v1/omni_gen/cost/video", { body: body as never }),
      );
    case "audio":
      return unwrapUpstream(
        await upstream.POST("/v1/omni_gen/cost/audio", { body: body as never }),
      );
    case "mesh":
      return unwrapUpstream(await upstream.POST("/v1/omni_gen/cost/mesh", { body: body as never }));
    case "splat":
      return unwrapUpstream(
        await upstream.POST("/v1/omni_gen/cost/splat", { body: body as never }),
      );
  }
}

/** Upstream treats absent and null alike for these bodies; drop nulls so the wire stays clean. */
function stripNulls(parameters: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(parameters).filter(([, value]) => value !== null));
}

function describe(estimate: z.infer<z.ZodObject<typeof outputSchema>>): string {
  const credits =
    estimate.cost_in_credits === null
      ? "an unknown number of credits"
      : `${String(estimate.cost_in_credits)} credits`;
  const cents =
    estimate.cost_in_usd_cents === null
      ? ""
      : ` (about $${(estimate.cost_in_usd_cents / 100).toFixed(2)})`;
  const flags = [
    estimate.is_free ? "free under public pricing" : null,
    estimate.is_rate_limited ? "currently rate limited" : null,
    estimate.has_watermark ? "output is watermarked" : null,
    estimate.failures_are_refunded === true ? "failures are refunded" : null,
    estimate.failures_are_refunded === false ? "failures are not refunded" : null,
  ].filter((flag): flag is string => flag !== null);
  const detail = flags.length > 0 ? ` ${flags.join("; ")}.` : "";
  return `Estimated ${credits}${cents} for a ${estimate.kind} generation with ${estimate.model}.${detail} Public pricing; the user's plan may lower it.`;
}
