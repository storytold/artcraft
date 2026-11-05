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

  // Models added on the Rust side after the first copy of this enum (generated from task_model_type.rs).
  NanoBanana = "nano_banana",
  NanoBanana2 = "nano_banana_2",
  NanoBananaPro = "nano_banana_pro",
  GptImage1p5 = "gpt_image_1p5",
  GptImage2 = "gpt_image_2",
  GptImage2p5Flare = "gpt_image_2p5_flare",
  GptImage2p5Sunburst = "gpt_image_2p5_sunburst",
  Seedream4 = "seedream_4",
  Seedream4p5 = "seedream_4p5",
  Seedream5Lite = "seedream_5_lite",
  QwenEdit2511Angles = "qwen_edit_2511_angles",
  Flux2LoraAngles = "flux_2_lora_angles",
  GrokImage = "grok_image",
  Midjourney7 = "midjourney_7",
  Midjourney7Niji = "midjourney_7_niji",
  Midjourney8 = "midjourney_8",
  GrokVideo = "grok_video",
  GrokImagineVideo1p5 = "grok_imagine_video_1p5",
  Kling2p5TurboPro = "kling_2p5_turbo_pro",
  Kling2p6Pro = "kling_2p6_pro",
  Kling3p0Standard = "kling_3p0_standard",
  Kling3p0Pro = "kling_3p0_pro",
  HappyHorse1p0 = "happy_horse_1p0",
  Seedance1p5Pro = "seedance_1p5_pro",
  Seedance2p0 = "seedance_2p0",
  Seedance2p0Fast = "seedance_2p0_fast",
  Sora2Pro = "sora_2_pro",
  Veo3p1 = "veo_3p1",
  Veo3p1Fast = "veo_3p1_fast",
  Hunyuan3d3 = "hunyuan_3d_3",
  WorldlabsMarble = "worldlabs_marble",
  WorldlabsMarble0p1Mini = "marble_0p1_mini",
  WorldlabsMarble0p1Plus = "marble_0p1_plus",
}
