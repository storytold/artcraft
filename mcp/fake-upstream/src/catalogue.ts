/**
 * The model catalogues served by `/v1/omni_gen/models/*` — ported from
 * `infra/fake-storyteller-web` (generation/catalogue.ts).
 *
 * The real catalogues are hand-tuned per model in Rust. Reproducing every capability flag
 * verbatim would rot immediately, so the fake keeps the real model ids, creators and display
 * names — what a client shows and branches on — and applies one representative capability
 * profile per media type. Optional fields are omitted rather than sent as null, as upstream does.
 */

export type GenerationKind = "image" | "video" | "audio" | "mesh" | "splat";

export const GENERATION_KINDS: readonly GenerationKind[] = [
  "image",
  "video",
  "audio",
  "mesh",
  "splat",
];

const IMAGE_ASPECT_RATIOS = [
  "square_hd",
  "square",
  "tall_three_by_four",
  "tall_nine_by_sixteen",
  "wide_four_by_three",
  "wide_sixteen_by_nine",
];
const VIDEO_ASPECT_RATIOS = ["square", "tall_nine_by_sixteen", "wide_sixteen_by_nine"];
const RESOLUTIONS = ["one_k", "two_k", "four_k"];
const QUALITIES = ["low", "medium", "high"];

type ModelSeed = readonly [model: string, creator: string, fullName: string];

const IMAGE_MODELS: readonly ModelSeed[] = [
  ["flux_1_dev", "black_forest_labs", "FLUX.1 [dev]"],
  ["flux_1_schnell", "black_forest_labs", "FLUX.1 [schnell]"],
  ["flux_pro_1p1", "black_forest_labs", "FLUX1.1 [pro]"],
  ["flux_pro_1p1_ultra", "black_forest_labs", "FLUX1.1 [pro] ultra"],
  ["flux_2_lora_angles", "black_forest_labs", "FLUX.2 Angles"],
  ["gpt_image_1", "open_ai", "GPT Image 1"],
  ["gpt_image_1p5", "open_ai", "GPT Image 1.5"],
  ["gpt_image_2", "open_ai", "GPT Image 2"],
  ["grok_imagine_image", "grok", "Grok Imagine"],
  ["grok_imagine_image_q", "grok", "Grok Imagine Quick"],
  ["midjourney_7", "midjourney", "Midjourney v7"],
  ["midjourney_7_niji", "midjourney", "Midjourney Niji v7"],
  ["midjourney_8", "midjourney", "Midjourney v8"],
  ["nano_banana", "google", "Nano Banana"],
  ["nano_banana_2", "google", "Nano Banana 2"],
  ["nano_banana_pro", "google", "Nano Banana Pro"],
  ["qwen_edit_2511_angles", "alibaba", "Qwen Edit Angles"],
  ["seedream_4", "bytedance", "Seedream 4"],
  ["seedream_4p5", "bytedance", "Seedream 4.5"],
  ["seedream_5_lite", "bytedance", "Seedream 5 Lite"],
  ["seedream_5p0_pro", "bytedance", "Seedream 5 Pro"],
  ["seedream_5p0_pro_u", "bytedance", "Seedream 5 Pro Ultra"],
];

const VIDEO_MODELS: readonly ModelSeed[] = [
  ["grok_video", "grok", "Grok Video"],
  ["grok_imagine_video", "grok", "Grok Imagine Video"],
  ["grok_imagine_video_1p5", "grok", "Grok Imagine Video 1.5"],
  ["kling_1p6_pro", "kling", "Kling 1.6 Pro"],
  ["kling_2p1_pro", "kling", "Kling 2.1 Pro"],
  ["kling_2p1_master", "kling", "Kling 2.1 Master"],
  ["kling_2p5_turbo_pro", "kling", "Kling 2.5 Turbo Pro"],
  ["kling_2p6_pro", "kling", "Kling 2.6 Pro"],
  ["kling_3p0_standard", "kling", "Kling 3.0 Standard"],
  ["kling_3p0_pro", "kling", "Kling 3.0 Pro"],
  ["happy_horse_1p0", "artcraft", "Happy Horse 1.0"],
  ["seedance_1p0_lite", "bytedance", "Seedance 1.0 Lite"],
  ["seedance_1p5_pro", "bytedance", "Seedance 1.5 Pro"],
  ["seedance_2p0", "bytedance", "Seedance 2.0"],
  ["seedance_2p0_fast", "bytedance", "Seedance 2.0 Fast"],
  ["seedance_2p0_mini", "bytedance", "Seedance 2.0 Mini"],
  ["sora_2", "open_ai", "Sora 2"],
  ["sora_2_pro", "open_ai", "Sora 2 Pro"],
  ["veo_2", "google", "Veo 2"],
  ["veo_3", "google", "Veo 3"],
  ["veo_3_fast", "google", "Veo 3 Fast"],
  ["veo_3p1", "google", "Veo 3.1"],
  ["veo_3p1_fast", "google", "Veo 3.1 Fast"],
  ["veo_3p1_lite", "google", "Veo 3.1 Lite"],
  ["vidu_q3", "vidu", "Vidu Q3"],
  ["vidu_q3_turbo", "vidu", "Vidu Q3 Turbo"],
];

const AUDIO_MODELS: readonly ModelSeed[] = [
  ["suno_music", "suno", "Suno Music"],
  ["suno_remix", "suno", "Suno Remix"],
  ["suno_sounds", "suno", "Suno Sounds"],
  ["suno_sample", "suno", "Suno Sample"],
  ["seed_audio_1p0", "bytedance", "Seed Audio 1.0"],
];

const MESH_MODELS: readonly ModelSeed[] = [
  ["hunyuan_3d_2p0", "tencent", "Hunyuan3D 2.0"],
  ["hunyuan_3d_2p1", "tencent", "Hunyuan3D 2.1"],
  ["hunyuan_3d_3", "tencent", "Hunyuan3D 3"],
  ["hunyuan_3d_3_sketch", "tencent", "Hunyuan3D 3 Sketch"],
  ["hunyuan_3d_3p1_pro", "tencent", "Hunyuan3D 3.1 Pro"],
  ["hunyuan_3d_3p1_rapid", "tencent", "Hunyuan3D 3.1 Rapid"],
  ["tripo3d_h3p1", "tripo", "Tripo3D H3.1"],
  ["meshy_v6", "meshy", "Meshy v6"],
  ["rodin_2p5_fast", "deemos", "Rodin 2.5 Fast"],
];

const SPLAT_MODELS: readonly ModelSeed[] = [
  ["marble_0p1_mini", "world_labs", "Marble 0.1 Mini"],
  ["marble_0p1_plus", "world_labs", "Marble 0.1 Plus"],
  ["marble_1p0", "world_labs", "Marble 1.0"],
  ["marble_1p0_draft", "world_labs", "Marble 1.0 Draft"],
  ["marble_1p1", "world_labs", "Marble 1.1"],
  ["marble_1p1_plus", "world_labs", "Marble 1.1 Plus"],
  ["triposplat", "tripo", "TripoSplat"],
];

const SEEDS: Record<GenerationKind, readonly ModelSeed[]> = {
  image: IMAGE_MODELS,
  video: VIDEO_MODELS,
  audio: AUDIO_MODELS,
  mesh: MESH_MODELS,
  splat: SPLAT_MODELS,
};

/** Which provider each model is routed through, for the `providers` block. */
const PROVIDER_BY_CREATOR: Record<string, string> = {
  artcraft: "artcraft",
  grok: "grok",
  midjourney: "midjourney",
  open_ai: "sora",
  world_labs: "world_labs",
};

const EXTRA_INFO = "Served by artcraft-api-fake. Capabilities are representative, not exact.";

const PROFILES: Record<GenerationKind, (seed: ModelSeed) => Record<string, unknown>> = {
  image: (seed) => ({
    ...baseModel(seed),
    text_prompt_supported: true,
    text_prompt_max_length: 2000,
    image_refs_supported: true,
    image_refs_max: 4,
    has_fixed_editing_aspect_ratio: false,
    aspect_ratio_options: IMAGE_ASPECT_RATIOS,
    aspect_ratio_default: "square",
    resolution_options: RESOLUTIONS,
    resolution_default: "one_k",
    quality_options: QUALITIES,
    default_quality: "high",
    batch_size_min: 1,
    batch_size_max: 4,
    batch_size_options: [1, 2, 3, 4],
    batch_size_default: 1,
    is_disabled: false,
  }),
  video: (seed) => ({
    ...baseModel(seed),
    extra_info: EXTRA_INFO,
    extra_info_short: "Fake backend",
    text_to_video_supported: true,
    text_prompt_supported: true,
    text_prompt_max_length: 2000,
    starting_keyframe_supported: true,
    starting_keyframe_required: false,
    ending_keyframe_supported: true,
    image_references_supported: true,
    image_references_max: 4,
    character_references_supported: true,
    character_references_max: 2,
    show_generate_with_sound_toggle: true,
    aspect_ratio_options: VIDEO_ASPECT_RATIOS,
    aspect_ratio_default: "wide_sixteen_by_nine",
    resolution_options: ["seven_twenty_p", "ten_eighty_p"],
    resolution_default: "seven_twenty_p",
    bitrate_options: ["normal", "high"],
    bitrate_default: "normal",
    quality_options: QUALITIES,
    default_quality: "high",
    duration_seconds_min: 4,
    duration_seconds_max: 10,
    duration_seconds_options: [4, 6, 8, 10],
    duration_seconds_default: 6,
    batch_size_min: 1,
    batch_size_max: 2,
    batch_size_options: [1, 2],
    batch_size_default: 1,
    is_disabled: false,
  }),
  audio: (seed) => ({
    ...baseModel(seed),
    extra_info: EXTRA_INFO,
    extra_info_short: "Fake backend",
    text_prompt_supported: true,
    style_prompt_supported: true,
    audio_references_supported: true,
    audio_references_max: 2,
    image_references_supported: false,
    keep_lyrics_supported: true,
    instrumental_toggle_supported: true,
    loopable_toggle_supported: true,
    bpm_supported: true,
    musical_key_supported: true,
    sample_rate_hz_options: [44_100, 48_000],
    sample_rate_hz_default: 44_100,
    speed_supported: true,
    volume_supported: true,
    pitch_supported: true,
    is_disabled: false,
  }),
  mesh: (seed) => ({
    ...baseModel(seed),
    extra_info: EXTRA_INFO,
    extra_info_short: "Fake backend",
    text_prompt_supported: true,
    image_input_supported: true,
    sketch_input_supported: false,
    multi_view_supported: true,
    mesh_input_supported: false,
    mesh_output_types: ["normal", "low_poly", "geometry"],
    polygon_types: ["triangle", "quad"],
    face_count_supported: true,
    pbr_supported: true,
    texture_toggle_supported: true,
    texture_quality_supported: true,
    geometry_quality_supported: true,
    is_disabled: false,
  }),
  splat: (seed) => ({
    ...baseModel(seed),
    extra_info: EXTRA_INFO,
    extra_info_short: "Fake backend",
    text_prompt_supported: true,
    image_references_supported: true,
    image_references_max: 1,
    video_reference_supported: true,
    panorama_supported: true,
    disable_recaption_supported: true,
    is_disabled: false,
  }),
};

/** The endpoint's own `provider` filter (image and video only): OmniGen*ModelsProvider. */
export type ModelsFilter = "artcraft" | "all";

/** Only the image and video endpoints declare the filter; the others list everything. */
export function hasProviderFilter(kind: GenerationKind): boolean {
  return kind === "image" || kind === "video";
}

/**
 * The `/v1/omni_gen/models/{kind}` response. For image and video, upstream's filter is
 * `artcraft` (only models Artcraft routes itself — the default) or `all`; audio, mesh and
 * splat have no filter and always list every model.
 */
export function modelsResponse(
  kind: GenerationKind,
  filter?: ModelsFilter,
): Record<string, unknown> {
  const effective = hasProviderFilter(kind) ? (filter ?? "artcraft") : "all";
  const seeds = SEEDS[kind].filter(
    (seed) => effective === "all" || providerFor(seed) === "artcraft",
  );
  return {
    success: true,
    models: seeds.map((seed) => PROFILES[kind](seed)),
    providers: providerBlock(seeds),
  };
}

/** Whether a model id exists in any catalogue — the real API rejects unknown models. */
export function isKnownModel(kind: GenerationKind, model: string): boolean {
  return SEEDS[kind].some(([id]) => id === model);
}

function baseModel([model, creator, fullName]: ModelSeed): Record<string, unknown> {
  return { model, model_creator: creator, full_name: fullName };
}

function providerFor([, creator]: ModelSeed): string {
  return PROVIDER_BY_CREATOR[creator] ?? "fal";
}

function providerBlock(seeds: readonly ModelSeed[]): Record<string, unknown>[] {
  const byProvider = new Map<string, { model: string }[]>();
  for (const seed of seeds) {
    const provider = providerFor(seed);
    const models = byProvider.get(provider) ?? [];
    models.push({ model: seed[0] });
    byProvider.set(provider, models);
  }
  return [...byProvider].map(([provider, models]) => ({ provider, models }));
}
