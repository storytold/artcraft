// Manual fallbacks so we can show a tagline (and a longer info blurb) even when
// the API doesn't return one yet for a given model. The API value always wins.
const MODEL_DESCRIPTIONS: Record<string, string> = {
  // ── Image models ──
  flux_1_dev: "Open-weight model with rich detail",
  flux_1_schnell: "Fastest FLUX for quick drafts",
  flux_pro_1p1: "Pro-grade quality and prompt accuracy",
  flux_pro_1p1_ultra: "Ultra high-resolution FLUX output",
  gpt_image_1: "OpenAI's original image model",
  gpt_image_1p5: "OpenAI imagery with reliable text",
  gpt_image_2: "4K images with crisp text rendering",
  midjourney_7: "Signature artistic, stylized imagery",
  midjourney_7_niji: "Anime and illustration styles",
  midjourney_8: "Midjourney's latest flagship model",
  nano_banana: "Fast, versatile editing and generation",
  nano_banana_2: "Pro quality at Flash speed",
  nano_banana_pro: "Google's flagship image model",
  seedream_4: "High-fidelity photorealistic generation",
  seedream_4p5: "ByteDance's next-gen 4K model",
  seedream_5_lite: "Lightweight, fast visual reasoning",
  seedream_5p0_pro: "Seedream's flagship image quality",
  seedream_5p0_pro_u: "Highest-fidelity Seedream tier",
  // ── Video models ── (seedance_2p0 intentionally omitted)
  flux_3: "Video generation by Black Forest Labs",
  grok_video: "Stylized video generation by xAI",
  grok_imagine_video: "Versatile video styles by xAI",
  grok_imagine_video_1p5: "Image-to-video styles by xAI",
  kling_1p6_pro: "Smooth, coherent motion",
  kling_2p1_pro: "Sharper realism and detail",
  kling_2p1_master: "Top-fidelity cinematic motion",
  kling_2p5_turbo_pro: "Fast, high-quality generation",
  kling_2p6_pro: "Refined motion and prompt control",
  kling_3p0_standard: "Next-gen temporal consistency",
  kling_3p0_pro: "Kling's flagship cinematic video",
  minimax_h3: "2K video with multi-media refs",
  seedance_1p0_lite: "Fast, lightweight video clips",
  seedance_1p5_pro: "Keyframes with synced audio",
  happy_horse_1p0: "Expressive motion from a frame",
  sora_2: "Realistic video with synced audio",
  sora_2_pro: "Sora's highest-fidelity tier",
  veo_2: "Coherent, high-quality motion",
  veo_3: "Realistic video with native audio",
  veo_3_fast: "Faster Veo 3 with audio",
  veo_3p1: "Latest Veo with finer control",
  veo_3p1_fast: "Speed-tuned Veo 3.1",
  veo_3p1_lite: "Light, low-cost Veo 3.1",
  vidu_q3: "Reference-driven video generation",
  vidu_q3_turbo: "Speed-optimized Vidu Q3",
  // ── Edit / VFX ──
  switch_x: "Swap or relight backgrounds",
  // ── 3D mesh models ──
  hunyuan_3d_2p0: "Reliable image-to-3D meshes",
  hunyuan_3d_2p1: "Improved detail and topology",
  hunyuan_3d_3: "High-detail 3D generation",
  hunyuan_3d_3_sketch: "3D meshes from sketches",
  hunyuan_3d_3p1_pro: "Hunyuan's flagship 3D quality",
  tripo3d_h3p1: "Fast, clean 3D meshes",
  meshy_v6: "Production-ready 3D assets",
  // ── World / splat models ──
  marble_1p0: "Explorable 3D worlds",
  marble_1p0_draft: "Quick draft world generation",
  marble_1p1: "Sharper, more coherent worlds",
  marble_1p1_plus: "Marble's highest-quality worlds",
  // ── Audio models ──
  suno_music: "Full songs from a text prompt",
  suno_remix: "Remix an existing track",
  suno_sounds: "Sound effects with beat control",
  suno_sample: "Build a song from a sample",
  seed_audio_1p0: "Sound generation with fine tuning",
};

const MODEL_INFOS: Record<string, string> = {
  // Longer blurbs surfaced behind the (i) info icon. Optional per model.
  // nano_banana_pro:
  //   "Google's flagship image model. Generates up to 4K, supports image references for editing, and batches up to 4 images at once.",
  // gpt_image_2:
  //   "OpenAI's image model with industry-leading text rendering. Emulated resolutions up to 4K and quality presets (High / Medium / Low).",
};

/** Short tagline shown under the model name.
 *
 *  Precedence: the API value always wins; the manual map is only a fallback for
 *  when the API hasn't returned a value (field absent / null / empty). Exactly
 *  one source is ever used, never both. Because this is derived from the model
 *  object (which only exists after the single atomic models fetch resolves), a
 *  row never renders with the manual value and then swaps to the API one, so
 *  there's no flicker, including before the API has returned. */
export function getModelDescription(
  modelId: string,
  apiDescription?: string | null,
): string {
  if (apiDescription) return apiDescription;
  return MODEL_DESCRIPTIONS[modelId] ?? "";
}

/** Longer info blurb for the (i) icon. Same precedence/no-flicker contract as
 *  getModelDescription: API value wins, manual map is the fallback, only one is
 *  ever used. Empty string means "no info icon for this model". */
export function getModelInfo(modelId: string, apiInfo?: string | null): string {
  if (apiInfo) return apiInfo;
  return MODEL_INFOS[modelId] ?? "";
}
