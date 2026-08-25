import { z } from "zod";

import { READ_ONLY_ANNOTATIONS, type ToolDefinition, unwrapUpstream } from "./types";

/**
 * The model catalogue for one kind of generation, as upstream publishes it. Each model's
 * capability fields (supported inputs, aspect/resolution/duration options and defaults, batch
 * sizes…) are passed through under `capabilities` exactly as the API names them — that is
 * what lets a client build a valid estimate_cost request without a second source of truth.
 */

export const GENERATION_KINDS = ["image", "video", "audio", "mesh", "splat"] as const;
export type GenerationKind = (typeof GENERATION_KINDS)[number];

/** GenerationProvider in the spec: who a model is routed through. Filtered client-side. */
export const PROVIDERS = ["artcraft", "fal", "grok", "midjourney", "sora", "world_labs"] as const;

const inputSchema = {
  kind: z
    .enum(GENERATION_KINDS)
    .describe("Which catalogue: image, video, audio, mesh (3D object), or splat (3D world)."),
  provider: z
    .enum(PROVIDERS)
    .optional()
    .describe("Only list models routed through this provider. Omit for every model."),
};

const outputSchema = {
  kind: z.enum(GENERATION_KINDS),
  models: z.array(
    z.object({
      id: z.string().describe("The model id to pass to estimate_cost, e.g. seedance_2p0."),
      name: z.string().describe("Display name."),
      creator: z.string().describe("Who makes the model, e.g. bytedance."),
      disabled: z.boolean().describe("True when the model is temporarily unavailable."),
      capabilities: z
        .record(z.string(), z.unknown())
        .describe(
          "Every other field upstream publishes for the model, verbatim: *_supported flags, " +
            "*_options lists and *_default values (aspect ratio, resolution, quality, duration, " +
            "batch size…), maxima such as text_prompt_max_length, and extra_info notes.",
        ),
    }),
  ),
  providers: z
    .array(z.object({ provider: z.string(), model_ids: z.array(z.string()) }))
    .describe("Which models are routed through which provider."),
};

interface RawModel {
  model: string;
  full_name?: string | null;
  model_creator?: string | null;
  is_disabled?: boolean | null;
  [capability: string]: unknown;
}

interface RawCatalogue {
  models: RawModel[];
  providers: { provider: string; models: { model: string }[] }[];
}

export const listModels: ToolDefinition<typeof inputSchema, typeof outputSchema> = {
  name: "list_models",
  title: "List models",
  description:
    "Lists the generation models Artcraft offers for one kind — image, video, audio, mesh " +
    "(3D object) or splat (3D world) — with each model's capabilities and option lists exactly " +
    "as the API publishes them. Call it before estimate_cost to pick a valid model id and " +
    "arguments, or when the user asks what models exist. Optionally filter by provider.",
  requiredScope: "read:catalog",
  inputSchema,
  outputSchema,
  annotations: { ...READ_ONLY_ANNOTATIONS, title: "List models" },

  async handler({ upstream }, { kind, provider }) {
    const raw = await fetchCatalogue(upstream, kind);
    const allowed = provider
      ? new Set(
          raw.providers
            .filter((p) => p.provider === provider)
            .flatMap((p) => p.models.map((m) => m.model)),
        )
      : undefined;
    const models = raw.models
      .filter((m) => !allowed || allowed.has(m.model))
      .map(({ model, full_name, model_creator, is_disabled, ...capabilities }) => ({
        id: model,
        name: full_name ?? model,
        creator: model_creator ?? "unknown",
        disabled: is_disabled ?? false,
        capabilities,
      }));
    const providers = raw.providers
      .filter((p) => !provider || p.provider === provider)
      .map((p) => ({ provider: p.provider, model_ids: p.models.map((m) => m.model) }));

    const structured = { kind, models, providers };
    return { structured, text: describe(structured) };
  },
};

/**
 * The image and video endpoints take their own `provider` filter — `"artcraft"` (the
 * default: only models Artcraft routes itself) or `"all"`. We always ask for `all` so the
 * catalogue is complete, and apply the caller's GenerationProvider filter ourselves.
 */
async function fetchCatalogue(
  upstream: Parameters<typeof listModels.handler>[0]["upstream"],
  kind: GenerationKind,
): Promise<RawCatalogue> {
  const everything = { params: { query: { provider: "all" as const } } };
  switch (kind) {
    case "image":
      return unwrapUpstream(await upstream.GET("/v1/omni_gen/models/image", everything));
    case "video":
      return unwrapUpstream(await upstream.GET("/v1/omni_gen/models/video", everything));
    case "audio":
      return unwrapUpstream(await upstream.GET("/v1/omni_gen/models/audio"));
    case "mesh":
      return unwrapUpstream(await upstream.GET("/v1/omni_gen/models/mesh"));
    case "splat":
      return unwrapUpstream(await upstream.GET("/v1/omni_gen/models/splat"));
  }
}

function describe(catalogue: z.infer<z.ZodObject<typeof outputSchema>>): string {
  const available = catalogue.models.filter((m) => !m.disabled);
  const names = available.map((m) => `${m.name} (${m.id})`).join(", ");
  const providers = catalogue.providers.map((p) => p.provider).join(", ");
  return `${String(available.length)} ${catalogue.kind} models available: ${names}. Providers: ${providers}.`;
}
