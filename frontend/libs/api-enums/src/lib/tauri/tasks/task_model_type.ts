// NOTE: These are defined in Rust (as the source of truth) and duplicated in the frontend.
// In the future, we should use code gen (protobufs or similar) to keep the two sides in sync.

export enum TaskModelType {
  // Image models
  Flux1Dev = "flux_1_dev",
  Flux1Schnell = "flux_1_schnell",
  FluxDevJuggernaut = "flux_dev_juggernaut",
  FluxPro1 = "flux_pro_1",
  FluxPro11 = "flux_pro_1.1",
  FluxPro11Ultra = "flux_pro_1.1_ultra",
  FluxProKontextMax = "flux_pro_kontext_max",
  Gemini25Flash = "gemini_25_flash",
  GptImage1 = "gpt_image_1",
  Recraft3 = "recraft_3",

  // Generic Midjourney model, version unknown.
  Midjourney = "midjourney",

  // Video models
  Kling16Pro = "kling_1.6_pro",
  Kling21Pro = "kling_2.1_pro",
  Kling21Master = "kling_2.1_master",
  Seedance10Lite = "seedance_1.0_lite",
  Sora2 = "sora_2",
  Veo2 = "veo_2",
  Veo3 = "veo_3",
  Veo3Fast = "veo_3_fast",

  // 3D Object generation models
  Hunyuan3d2_0 = "hunyuan_3d_2.0",
  Hunyuan3d2_1 = "hunyuan_3d_2.1",
}
