use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

use crate::common::generation::common_model_type::CommonModelType;

/// Used in the `generic_inference_jobs` table in `VARCHAR(32)` field `maybe_model_type`.
///
/// Our "generic inference" pipeline supports a wide variety of ML models and other media.
/// Each inference "model type" identified by the following enum variants, though some pipelines
/// may use multiple models or no model (and may report NULL).
///
/// These types are present in the HTTP API and database columns as serialized here.
///
/// `InferenceModelType` is a **superset** of [`CommonModelType`]: every variant in
/// `CommonModelType` has a 1:1 mapping here (see [`from_common_model_type`]). The legacy
/// variants at the top of the enum (`ComfyUi`, `RvcV2`, …) only exist on this side.
///
/// YOU CAN ADD NEW VALUES, BUT DO NOT CHANGE EXISTING VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize)]
pub enum InferenceModelType {
  // ---------------------------------------------------------------------------
  // Legacy / inference-pipeline-only variants. These predate CommonModelType
  // and have no counterpart there.
  // ---------------------------------------------------------------------------

  // TODO(bt,2024-07-15): This is too generic. We probably need "StorytellerStudio", "LivePortrait", etc.
  #[serde(rename = "comfy_ui")]
  ComfyUi,

  #[serde(rename = "rvc_v2")]
  RvcV2,
  // NB: sad_talker does use user-supplied models, so there is no "model token"
  #[serde(rename = "sad_talker")]
  SadTalker,
  #[serde(rename = "so_vits_svc")]
  SoVitsSvc,
  // TODO: Does this need to be "legacy_tacotron2" ?

  #[serde(rename = "seed_vc")]
  SeedVc,

  /// NB: This is for Sora GPT 4o image gen
  #[serde(rename = "image_gen_api")]
  ImageGenApi,

  #[serde(rename = "tacotron2")]
  Tacotron2,
  #[serde(rename = "vits")]
  Vits,
  #[serde(rename = "vall_e_x")]
  VallEX,
  #[serde(rename = "rerender_a_video")]
  RerenderAVideo,
  #[serde(rename = "stable_diffusion")]
  StableDiffusion,
  #[serde(rename = "mocap_net")]
  MocapNet,
  #[serde(rename = "styletts2")]
  StyleTTS2,
  /// A job that turns "FBX" game engine files into "GLTF" files (Bevy-compatible).
  #[serde(rename = "convert_fbx_gltf")]
  ConvertFbxToGltf,
  #[serde(rename = "bvh_to_workflow")]
  BvhToWorkflow,

  // ---------------------------------------------------------------------------
  // Mirror of `CommonModelType`. Names and serialized strings must stay in
  // lock-step with that enum so `from_common_model_type` is trivially 1:1.
  // When you add a new variant to `CommonModelType`, the match in
  // `from_common_model_type` below will fail to compile until you mirror it
  // here.
  // ---------------------------------------------------------------------------

  // Image models
  #[serde(rename = "flux_1_dev")]
  Flux1Dev,
  #[serde(rename = "flux_1_schnell")]
  Flux1Schnell,
  #[serde(rename = "flux_dev_juggernaut")]
  FluxDevJuggernaut,
  #[serde(rename = "flux_pro_1")]
  FluxPro1,
  #[serde(rename = "flux_pro_1p1")]
  FluxPro11,
  #[serde(rename = "flux_pro_1p1_ultra")]
  FluxPro11Ultra,
  #[serde(rename = "flux_pro_kontext_max")]
  FluxProKontextMax,
  #[serde(rename = "flux_2_lora_angles")]
  Flux2LoraAngles,
  #[serde(rename = "gpt_image_1")]
  GptImage1,
  #[serde(rename = "gpt_image_1p5")]
  GptImage1p5,
  #[serde(rename = "gpt_image_2")]
  GptImage2,
  #[serde(rename = "grok_image")]
  GrokImage,
  #[serde(rename = "grok_imagine_image")]
  GrokImagineImage,
  #[serde(rename = "grok_imagine_image_q")]
  GrokImagineImageQuality,
  #[serde(rename = "recraft_3")]
  Recraft3,
  #[serde(rename = "seededit_3")]
  SeedEdit3,
  #[serde(rename = "qwen")]
  Qwen,
  #[serde(rename = "qwen_edit_2511_angles")]
  QwenEdit2511Angles,
  #[serde(rename = "gemini_25_flash")]
  Gemini25Flash,
  #[serde(rename = "nano_banana")]
  NanoBanana,
  #[serde(rename = "nano_banana_2")]
  NanoBanana2,
  #[serde(rename = "nano_banana_pro")]
  NanoBananaPro,
  #[serde(rename = "seedream_4")]
  Seedream4,
  #[serde(rename = "seedream_4p5")]
  Seedream4p5,
  #[serde(rename = "seedream_5_lite")]
  Seedream5Lite,
  #[serde(rename = "midjourney")]
  Midjourney,
  #[serde(rename = "midjourney_v6")]
  MidjourneyV6,
  #[serde(rename = "midjourney_v6p1")]
  MidjourneyV6p1,
  #[serde(rename = "midjourney_v6p1_raw")]
  MidjourneyV6p1Raw,
  #[serde(rename = "midjourney_v7")]
  MidjourneyV7,
  #[serde(rename = "midjourney_v7_draft")]
  MidjourneyV7Draft,
  #[serde(rename = "midjourney_v7_draft_raw")]
  MidjourneyV7DraftRaw,
  #[serde(rename = "midjourney_v7_raw")]
  MidjourneyV7Raw,

  // Video models
  #[serde(rename = "grok_video")]
  GrokVideo,
  #[serde(rename = "grok_imagine_video")]
  GrokImagineVideo,
  #[serde(rename = "kling_1p6_pro")]
  Kling16Pro,
  #[serde(rename = "kling_2p1_pro")]
  Kling21Pro,
  #[serde(rename = "kling_2p1_master")]
  Kling21Master,
  #[serde(rename = "kling_2p5_turbo_pro")]
  Kling2p5TurboPro,
  #[serde(rename = "kling_2p6_pro")]
  Kling2p6Pro,
  #[serde(rename = "kling_3p0_standard")]
  Kling3p0Standard,
  #[serde(rename = "kling_3p0_pro")]
  Kling3p0Pro,
  #[serde(rename = "happy_horse_1p0")]
  HappyHorse1p0,
  #[serde(rename = "seedance_1p0_lite")]
  Seedance10Lite,
  #[serde(rename = "seedance_1p0_pro")]
  Seedance10Pro,
  #[serde(rename = "seedance_1p5_pro")]
  Seedance1p5Pro,
  #[serde(rename = "seedance_2p0")]
  Seedance2p0,
  #[serde(rename = "seedance_2p0_fast")]
  Seedance2p0Fast,
  #[serde(rename = "seedance_2p0_bp")]
  Seedance2p0BytePlus,
  #[serde(rename = "seedance_2p0_bp_fast")]
  Seedance2p0BytePlusFast,
  #[serde(rename = "seedance_2p0_u")]
  Seedance2p0Ultra,
  #[serde(rename = "seedance_2p0_u_fast")]
  Seedance2p0UltraFast,
  #[serde(rename = "sora_2")]
  Sora2,
  #[serde(rename = "sora_2_pro")]
  Sora2Pro,
  #[serde(rename = "veo_2")]
  Veo2,
  #[serde(rename = "veo_3")]
  Veo3,
  #[serde(rename = "veo_3_fast")]
  Veo3Fast,
  #[serde(rename = "veo_3p1")]
  Veo3p1,
  #[serde(rename = "veo_3p1_fast")]
  Veo3p1Fast,
  #[serde(rename = "preview_model")]
  PreviewModel,
  #[serde(rename = "preview_model_fast")]
  PreviewModelFast,
  #[serde(rename = "switch_x")]
  SwitchX,

  // 3D Object generation models
  #[serde(rename = "hunyuan_3d_2p0")]
  Hunyuan3d2_0,
  #[serde(rename = "hunyuan_3d_2p1")]
  Hunyuan3d2_1,
  #[serde(rename = "hunyuan_3d_3")]
  Hunyuan3d3,

  // Splat generation models (World Labs)
  #[serde(rename = "marble_0p1_mini")]
  Marble0p1Mini,
  #[serde(rename = "marble_0p1_plus")]
  Marble0p1Plus,
}

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(InferenceModelType);
impl_mysql_enum_coders!(InferenceModelType);

/// NB: Legacy API for older code.
impl InferenceModelType {
  pub fn to_str(&self) -> &'static str {
    match self {
      // Legacy variants
      Self::RvcV2 => "rvc_v2",
      Self::SadTalker => "sad_talker",
      Self::SoVitsSvc => "so_vits_svc",
      Self::Tacotron2 => "tacotron2",
      Self::Vits => "vits",
      Self::VallEX => "vall_e_x",
      Self::RerenderAVideo => "rerender_a_video",
      Self::StableDiffusion => "stable_diffusion",
      Self::ImageGenApi => "image_gen_api",
      Self::SeedVc => "seed_vc",
      Self::MocapNet => "mocap_net",
      Self::StyleTTS2 => "styletts2",
      Self::ComfyUi => "comfy_ui",
      Self::ConvertFbxToGltf => "convert_fbx_gltf",
      Self::BvhToWorkflow => "bvh_to_workflow",

      // Image models (mirror of CommonModelType)
      Self::Flux1Dev => "flux_1_dev",
      Self::Flux1Schnell => "flux_1_schnell",
      Self::FluxDevJuggernaut => "flux_dev_juggernaut",
      Self::FluxPro1 => "flux_pro_1",
      Self::FluxPro11 => "flux_pro_1p1",
      Self::FluxPro11Ultra => "flux_pro_1p1_ultra",
      Self::FluxProKontextMax => "flux_pro_kontext_max",
      Self::Flux2LoraAngles => "flux_2_lora_angles",
      Self::GptImage1 => "gpt_image_1",
      Self::GptImage1p5 => "gpt_image_1p5",
      Self::GptImage2 => "gpt_image_2",
      Self::GrokImage => "grok_image",
      Self::GrokImagineImage => "grok_imagine_image",
      Self::GrokImagineImageQuality => "grok_imagine_image_q",
      Self::Recraft3 => "recraft_3",
      Self::SeedEdit3 => "seededit_3",
      Self::Qwen => "qwen",
      Self::QwenEdit2511Angles => "qwen_edit_2511_angles",
      Self::Gemini25Flash => "gemini_25_flash",
      Self::NanoBanana => "nano_banana",
      Self::NanoBanana2 => "nano_banana_2",
      Self::NanoBananaPro => "nano_banana_pro",
      Self::Seedream4 => "seedream_4",
      Self::Seedream4p5 => "seedream_4p5",
      Self::Seedream5Lite => "seedream_5_lite",
      Self::Midjourney => "midjourney",
      Self::MidjourneyV6 => "midjourney_v6",
      Self::MidjourneyV6p1 => "midjourney_v6p1",
      Self::MidjourneyV6p1Raw => "midjourney_v6p1_raw",
      Self::MidjourneyV7 => "midjourney_v7",
      Self::MidjourneyV7Draft => "midjourney_v7_draft",
      Self::MidjourneyV7DraftRaw => "midjourney_v7_draft_raw",
      Self::MidjourneyV7Raw => "midjourney_v7_raw",

      // Video models
      Self::GrokVideo => "grok_video",
      Self::GrokImagineVideo => "grok_imagine_video",
      Self::Kling16Pro => "kling_1p6_pro",
      Self::Kling21Pro => "kling_2p1_pro",
      Self::Kling21Master => "kling_2p1_master",
      Self::Kling2p5TurboPro => "kling_2p5_turbo_pro",
      Self::Kling2p6Pro => "kling_2p6_pro",
      Self::Kling3p0Standard => "kling_3p0_standard",
      Self::Kling3p0Pro => "kling_3p0_pro",
      Self::HappyHorse1p0 => "happy_horse_1p0",
      Self::Seedance10Lite => "seedance_1p0_lite",
      Self::Seedance10Pro => "seedance_1p0_pro",
      Self::Seedance1p5Pro => "seedance_1p5_pro",
      Self::Seedance2p0 => "seedance_2p0",
      Self::Seedance2p0Fast => "seedance_2p0_fast",
      Self::Seedance2p0BytePlus => "seedance_2p0_bp",
      Self::Seedance2p0BytePlusFast => "seedance_2p0_bp_fast",
      Self::Seedance2p0Ultra => "seedance_2p0_u",
      Self::Seedance2p0UltraFast => "seedance_2p0_u_fast",
      Self::Sora2 => "sora_2",
      Self::Sora2Pro => "sora_2_pro",
      Self::Veo2 => "veo_2",
      Self::Veo3 => "veo_3",
      Self::Veo3Fast => "veo_3_fast",
      Self::Veo3p1 => "veo_3p1",
      Self::Veo3p1Fast => "veo_3p1_fast",
      Self::PreviewModel => "preview_model",
      Self::PreviewModelFast => "preview_model_fast",
      Self::SwitchX => "switch_x",

      // 3D Object generation models
      Self::Hunyuan3d2_0 => "hunyuan_3d_2p0",
      Self::Hunyuan3d2_1 => "hunyuan_3d_2p1",
      Self::Hunyuan3d3 => "hunyuan_3d_3",

      // Splat generation models (World Labs)
      Self::Marble0p1Mini => "marble_0p1_mini",
      Self::Marble0p1Plus => "marble_0p1_plus",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      // Legacy variants
      "rvc_v2" => Ok(Self::RvcV2),
      "sad_talker" => Ok(Self::SadTalker),
      "so_vits_svc" => Ok(Self::SoVitsSvc),
      "seed_vc" => Ok(Self::SeedVc),
      "tacotron2" => Ok(Self::Tacotron2),
      "vits" => Ok(Self::Vits),
      "vall_e_x" => Ok(Self::VallEX),
      "rerender_a_video" => Ok(Self::RerenderAVideo),
      "stable_diffusion" => Ok(Self::StableDiffusion),
      "image_gen_api" => Ok(Self::ImageGenApi),
      "mocap_net" => Ok(Self::MocapNet),
      "styletts2" => Ok(Self::StyleTTS2),
      "comfy_ui" => Ok(Self::ComfyUi),
      "convert_fbx_gltf" => Ok(Self::ConvertFbxToGltf),
      "bvh_to_workflow" => Ok(Self::BvhToWorkflow),

      // Image models (mirror of CommonModelType)
      "flux_1_dev" => Ok(Self::Flux1Dev),
      "flux_1_schnell" => Ok(Self::Flux1Schnell),
      "flux_dev_juggernaut" => Ok(Self::FluxDevJuggernaut),
      "flux_pro_1" => Ok(Self::FluxPro1),
      "flux_pro_1p1" => Ok(Self::FluxPro11),
      "flux_pro_1p1_ultra" => Ok(Self::FluxPro11Ultra),
      "flux_pro_kontext_max" => Ok(Self::FluxProKontextMax),
      "flux_2_lora_angles" => Ok(Self::Flux2LoraAngles),
      "gpt_image_1" => Ok(Self::GptImage1),
      "gpt_image_1p5" => Ok(Self::GptImage1p5),
      "gpt_image_2" => Ok(Self::GptImage2),
      "grok_image" => Ok(Self::GrokImage),
      "grok_imagine_image" => Ok(Self::GrokImagineImage),
      "grok_imagine_image_q" => Ok(Self::GrokImagineImageQuality),
      "recraft_3" => Ok(Self::Recraft3),
      "seededit_3" => Ok(Self::SeedEdit3),
      "qwen" => Ok(Self::Qwen),
      "qwen_edit_2511_angles" => Ok(Self::QwenEdit2511Angles),
      "gemini_25_flash" => Ok(Self::Gemini25Flash),
      "nano_banana" => Ok(Self::NanoBanana),
      "nano_banana_2" => Ok(Self::NanoBanana2),
      "nano_banana_pro" => Ok(Self::NanoBananaPro),
      "seedream_4" => Ok(Self::Seedream4),
      "seedream_4p5" => Ok(Self::Seedream4p5),
      "seedream_5_lite" => Ok(Self::Seedream5Lite),
      "midjourney" => Ok(Self::Midjourney),
      "midjourney_v6" => Ok(Self::MidjourneyV6),
      "midjourney_v6p1" => Ok(Self::MidjourneyV6p1),
      "midjourney_v6p1_raw" => Ok(Self::MidjourneyV6p1Raw),
      "midjourney_v7" => Ok(Self::MidjourneyV7),
      "midjourney_v7_draft" => Ok(Self::MidjourneyV7Draft),
      "midjourney_v7_draft_raw" => Ok(Self::MidjourneyV7DraftRaw),
      "midjourney_v7_raw" => Ok(Self::MidjourneyV7Raw),

      // Video models
      "grok_video" => Ok(Self::GrokVideo),
      "grok_imagine_video" => Ok(Self::GrokImagineVideo),
      "kling_1p6_pro" => Ok(Self::Kling16Pro),
      "kling_2p1_pro" => Ok(Self::Kling21Pro),
      "kling_2p1_master" => Ok(Self::Kling21Master),
      "kling_2p5_turbo_pro" => Ok(Self::Kling2p5TurboPro),
      "kling_2p6_pro" => Ok(Self::Kling2p6Pro),
      "kling_3p0_standard" => Ok(Self::Kling3p0Standard),
      "kling_3p0_pro" => Ok(Self::Kling3p0Pro),
      "happy_horse_1p0" => Ok(Self::HappyHorse1p0),
      "seedance_1p0_lite" => Ok(Self::Seedance10Lite),
      "seedance_1p0_pro" => Ok(Self::Seedance10Pro),
      "seedance_1p5_pro" => Ok(Self::Seedance1p5Pro),
      "seedance_2p0" => Ok(Self::Seedance2p0),
      "seedance_2p0_fast" => Ok(Self::Seedance2p0Fast),
      "seedance_2p0_bp" => Ok(Self::Seedance2p0BytePlus),
      "seedance_2p0_bp_fast" => Ok(Self::Seedance2p0BytePlusFast),
      "seedance_2p0_u" => Ok(Self::Seedance2p0Ultra),
      "seedance_2p0_u_fast" => Ok(Self::Seedance2p0UltraFast),
      "sora_2" => Ok(Self::Sora2),
      "sora_2_pro" => Ok(Self::Sora2Pro),
      "veo_2" => Ok(Self::Veo2),
      "veo_3" => Ok(Self::Veo3),
      "veo_3_fast" => Ok(Self::Veo3Fast),
      "veo_3p1" => Ok(Self::Veo3p1),
      "veo_3p1_fast" => Ok(Self::Veo3p1Fast),
      "preview_model" => Ok(Self::PreviewModel),
      "preview_model_fast" => Ok(Self::PreviewModelFast),
      "switch_x" => Ok(Self::SwitchX),

      // 3D Object generation models
      "hunyuan_3d_2p0" => Ok(Self::Hunyuan3d2_0),
      "hunyuan_3d_2p1" => Ok(Self::Hunyuan3d2_1),
      "hunyuan_3d_3" => Ok(Self::Hunyuan3d3),

      // Splat generation models (World Labs)
      "marble_0p1_mini" => Ok(Self::Marble0p1Mini),
      "marble_0p1_plus" => Ok(Self::Marble0p1Plus),

      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      // Legacy variants
      Self::ComfyUi,
      Self::RvcV2,
      Self::SadTalker,
      Self::SoVitsSvc,
      Self::SeedVc,
      Self::Tacotron2,
      Self::Vits,
      Self::VallEX,
      Self::RerenderAVideo,
      Self::StableDiffusion,
      Self::ImageGenApi,
      Self::MocapNet,
      Self::StyleTTS2,
      Self::ConvertFbxToGltf,
      Self::BvhToWorkflow,

      // Image models (mirror of CommonModelType)
      Self::Flux1Dev,
      Self::Flux1Schnell,
      Self::FluxDevJuggernaut,
      Self::FluxPro1,
      Self::FluxPro11,
      Self::FluxPro11Ultra,
      Self::FluxProKontextMax,
      Self::Flux2LoraAngles,
      Self::GptImage1,
      Self::GptImage1p5,
      Self::GptImage2,
      Self::GrokImage,
      Self::GrokImagineImage,
      Self::GrokImagineImageQuality,
      Self::Recraft3,
      Self::SeedEdit3,
      Self::Qwen,
      Self::QwenEdit2511Angles,
      Self::Gemini25Flash,
      Self::NanoBanana,
      Self::NanoBanana2,
      Self::NanoBananaPro,
      Self::Seedream4,
      Self::Seedream4p5,
      Self::Seedream5Lite,
      Self::Midjourney,
      Self::MidjourneyV6,
      Self::MidjourneyV6p1,
      Self::MidjourneyV6p1Raw,
      Self::MidjourneyV7,
      Self::MidjourneyV7Draft,
      Self::MidjourneyV7DraftRaw,
      Self::MidjourneyV7Raw,

      // Video models
      Self::GrokVideo,
      Self::GrokImagineVideo,
      Self::Kling16Pro,
      Self::Kling21Pro,
      Self::Kling21Master,
      Self::Kling2p5TurboPro,
      Self::Kling2p6Pro,
      Self::Kling3p0Standard,
      Self::Kling3p0Pro,
      Self::HappyHorse1p0,
      Self::Seedance10Lite,
      Self::Seedance10Pro,
      Self::Seedance1p5Pro,
      Self::Seedance2p0,
      Self::Seedance2p0Fast,
      Self::Seedance2p0BytePlus,
      Self::Seedance2p0BytePlusFast,
      Self::Seedance2p0Ultra,
      Self::Seedance2p0UltraFast,
      Self::Sora2,
      Self::Sora2Pro,
      Self::Veo2,
      Self::Veo3,
      Self::Veo3Fast,
      Self::Veo3p1,
      Self::Veo3p1Fast,
      Self::PreviewModel,
      Self::PreviewModelFast,
      Self::SwitchX,

      // 3D Object generation models
      Self::Hunyuan3d2_0,
      Self::Hunyuan3d2_1,
      Self::Hunyuan3d3,

      // Splat generation models (World Labs)
      Self::Marble0p1Mini,
      Self::Marble0p1Plus,
    ])
  }

  /// Infallibly map a [`CommonModelType`] to its [`InferenceModelType`]
  /// counterpart. The mapping is exhaustively 1:1 by variant name; when a
  /// new variant is added to `CommonModelType`, this match will fail to
  /// compile until you mirror the variant here too.
  pub fn from_common_model_type(common: CommonModelType) -> Self {
    match common {
      // Image models
      CommonModelType::Flux1Dev => Self::Flux1Dev,
      CommonModelType::Flux1Schnell => Self::Flux1Schnell,
      CommonModelType::FluxDevJuggernaut => Self::FluxDevJuggernaut,
      CommonModelType::FluxPro1 => Self::FluxPro1,
      CommonModelType::FluxPro11 => Self::FluxPro11,
      CommonModelType::FluxPro11Ultra => Self::FluxPro11Ultra,
      CommonModelType::FluxProKontextMax => Self::FluxProKontextMax,
      CommonModelType::Flux2LoraAngles => Self::Flux2LoraAngles,
      CommonModelType::GptImage1 => Self::GptImage1,
      CommonModelType::GptImage1p5 => Self::GptImage1p5,
      CommonModelType::GptImage2 => Self::GptImage2,
      CommonModelType::GrokImage => Self::GrokImage,
      CommonModelType::GrokImagineImage => Self::GrokImagineImage,
      CommonModelType::GrokImagineImageQuality => Self::GrokImagineImageQuality,
      CommonModelType::Recraft3 => Self::Recraft3,
      CommonModelType::SeedEdit3 => Self::SeedEdit3,
      CommonModelType::Qwen => Self::Qwen,
      CommonModelType::QwenEdit2511Angles => Self::QwenEdit2511Angles,
      CommonModelType::Gemini25Flash => Self::Gemini25Flash,
      CommonModelType::NanoBanana => Self::NanoBanana,
      CommonModelType::NanoBanana2 => Self::NanoBanana2,
      CommonModelType::NanoBananaPro => Self::NanoBananaPro,
      CommonModelType::Seedream4 => Self::Seedream4,
      CommonModelType::Seedream4p5 => Self::Seedream4p5,
      CommonModelType::Seedream5Lite => Self::Seedream5Lite,
      CommonModelType::Midjourney => Self::Midjourney,
      CommonModelType::MidjourneyV6 => Self::MidjourneyV6,
      CommonModelType::MidjourneyV6p1 => Self::MidjourneyV6p1,
      CommonModelType::MidjourneyV6p1Raw => Self::MidjourneyV6p1Raw,
      CommonModelType::MidjourneyV7 => Self::MidjourneyV7,
      CommonModelType::MidjourneyV7Draft => Self::MidjourneyV7Draft,
      CommonModelType::MidjourneyV7DraftRaw => Self::MidjourneyV7DraftRaw,
      CommonModelType::MidjourneyV7Raw => Self::MidjourneyV7Raw,

      // Video models
      CommonModelType::GrokVideo => Self::GrokVideo,
      CommonModelType::GrokImagineVideo => Self::GrokImagineVideo,
      CommonModelType::Kling16Pro => Self::Kling16Pro,
      CommonModelType::Kling21Pro => Self::Kling21Pro,
      CommonModelType::Kling21Master => Self::Kling21Master,
      CommonModelType::Kling2p5TurboPro => Self::Kling2p5TurboPro,
      CommonModelType::Kling2p6Pro => Self::Kling2p6Pro,
      CommonModelType::Kling3p0Standard => Self::Kling3p0Standard,
      CommonModelType::Kling3p0Pro => Self::Kling3p0Pro,
      CommonModelType::HappyHorse1p0 => Self::HappyHorse1p0,
      CommonModelType::Seedance10Lite => Self::Seedance10Lite,
      CommonModelType::Seedance10Pro => Self::Seedance10Pro,
      CommonModelType::Seedance1p5Pro => Self::Seedance1p5Pro,
      CommonModelType::Seedance2p0 => Self::Seedance2p0,
      CommonModelType::Seedance2p0Fast => Self::Seedance2p0Fast,
      CommonModelType::Seedance2p0BytePlus => Self::Seedance2p0BytePlus,
      CommonModelType::Seedance2p0BytePlusFast => Self::Seedance2p0BytePlusFast,
      CommonModelType::Seedance2p0Ultra => Self::Seedance2p0Ultra,
      CommonModelType::Seedance2p0UltraFast => Self::Seedance2p0UltraFast,
      CommonModelType::Sora2 => Self::Sora2,
      CommonModelType::Sora2Pro => Self::Sora2Pro,
      CommonModelType::Veo2 => Self::Veo2,
      CommonModelType::Veo3 => Self::Veo3,
      CommonModelType::Veo3Fast => Self::Veo3Fast,
      CommonModelType::Veo3p1 => Self::Veo3p1,
      CommonModelType::Veo3p1Fast => Self::Veo3p1Fast,
      CommonModelType::PreviewModel => Self::PreviewModel,
      CommonModelType::PreviewModelFast => Self::PreviewModelFast,
      CommonModelType::SwitchX => Self::SwitchX,

      // 3D Object generation models
      CommonModelType::Hunyuan3d2_0 => Self::Hunyuan3d2_0,
      CommonModelType::Hunyuan3d2_1 => Self::Hunyuan3d2_1,
      CommonModelType::Hunyuan3d3 => Self::Hunyuan3d3,

      // Splat generation models (World Labs)
      CommonModelType::Marble0p1Mini => Self::Marble0p1Mini,
      CommonModelType::Marble0p1Plus => Self::Marble0p1Plus,
    }
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::generic_inference_jobs::inference_model_type::InferenceModelType;
  use crate::common::generation::common_model_type::CommonModelType;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      // Legacy variants
      assert_serialization(InferenceModelType::RvcV2, "rvc_v2");
      assert_serialization(InferenceModelType::SadTalker, "sad_talker");
      assert_serialization(InferenceModelType::SeedVc, "seed_vc");
      assert_serialization(InferenceModelType::SoVitsSvc, "so_vits_svc");
      assert_serialization(InferenceModelType::Tacotron2, "tacotron2");
      assert_serialization(InferenceModelType::Vits, "vits");
      assert_serialization(InferenceModelType::VallEX, "vall_e_x");
      assert_serialization(InferenceModelType::RerenderAVideo, "rerender_a_video");
      assert_serialization(InferenceModelType::StableDiffusion, "stable_diffusion");
      assert_serialization(InferenceModelType::ImageGenApi, "image_gen_api");
      assert_serialization(InferenceModelType::MocapNet, "mocap_net");
      assert_serialization(InferenceModelType::ComfyUi, "comfy_ui");
      assert_serialization(InferenceModelType::StyleTTS2, "styletts2");
      assert_serialization(InferenceModelType::ConvertFbxToGltf, "convert_fbx_gltf");
      assert_serialization(InferenceModelType::BvhToWorkflow, "bvh_to_workflow");

      // Image models (mirror of CommonModelType)
      assert_serialization(InferenceModelType::Flux1Dev, "flux_1_dev");
      assert_serialization(InferenceModelType::Flux1Schnell, "flux_1_schnell");
      assert_serialization(InferenceModelType::FluxDevJuggernaut, "flux_dev_juggernaut");
      assert_serialization(InferenceModelType::FluxPro1, "flux_pro_1");
      assert_serialization(InferenceModelType::FluxPro11, "flux_pro_1p1");
      assert_serialization(InferenceModelType::FluxPro11Ultra, "flux_pro_1p1_ultra");
      assert_serialization(InferenceModelType::FluxProKontextMax, "flux_pro_kontext_max");
      assert_serialization(InferenceModelType::Flux2LoraAngles, "flux_2_lora_angles");
      assert_serialization(InferenceModelType::GptImage1, "gpt_image_1");
      assert_serialization(InferenceModelType::GptImage1p5, "gpt_image_1p5");
      assert_serialization(InferenceModelType::GptImage2, "gpt_image_2");
      assert_serialization(InferenceModelType::GrokImage, "grok_image");
      assert_serialization(InferenceModelType::GrokImagineImage, "grok_imagine_image");
      assert_serialization(InferenceModelType::GrokImagineImageQuality, "grok_imagine_image_q");
      assert_serialization(InferenceModelType::Recraft3, "recraft_3");
      assert_serialization(InferenceModelType::SeedEdit3, "seededit_3");
      assert_serialization(InferenceModelType::Qwen, "qwen");
      assert_serialization(InferenceModelType::QwenEdit2511Angles, "qwen_edit_2511_angles");
      assert_serialization(InferenceModelType::Gemini25Flash, "gemini_25_flash");
      assert_serialization(InferenceModelType::NanoBanana, "nano_banana");
      assert_serialization(InferenceModelType::NanoBanana2, "nano_banana_2");
      assert_serialization(InferenceModelType::NanoBananaPro, "nano_banana_pro");
      assert_serialization(InferenceModelType::Seedream4, "seedream_4");
      assert_serialization(InferenceModelType::Seedream4p5, "seedream_4p5");
      assert_serialization(InferenceModelType::Seedream5Lite, "seedream_5_lite");
      assert_serialization(InferenceModelType::Midjourney, "midjourney");
      assert_serialization(InferenceModelType::MidjourneyV6, "midjourney_v6");
      assert_serialization(InferenceModelType::MidjourneyV6p1, "midjourney_v6p1");
      assert_serialization(InferenceModelType::MidjourneyV6p1Raw, "midjourney_v6p1_raw");
      assert_serialization(InferenceModelType::MidjourneyV7, "midjourney_v7");
      assert_serialization(InferenceModelType::MidjourneyV7Draft, "midjourney_v7_draft");
      assert_serialization(InferenceModelType::MidjourneyV7DraftRaw, "midjourney_v7_draft_raw");
      assert_serialization(InferenceModelType::MidjourneyV7Raw, "midjourney_v7_raw");

      // Video models
      assert_serialization(InferenceModelType::GrokVideo, "grok_video");
      assert_serialization(InferenceModelType::GrokImagineVideo, "grok_imagine_video");
      assert_serialization(InferenceModelType::Kling16Pro, "kling_1p6_pro");
      assert_serialization(InferenceModelType::Kling21Pro, "kling_2p1_pro");
      assert_serialization(InferenceModelType::Kling21Master, "kling_2p1_master");
      assert_serialization(InferenceModelType::Kling2p5TurboPro, "kling_2p5_turbo_pro");
      assert_serialization(InferenceModelType::Kling2p6Pro, "kling_2p6_pro");
      assert_serialization(InferenceModelType::Kling3p0Standard, "kling_3p0_standard");
      assert_serialization(InferenceModelType::Kling3p0Pro, "kling_3p0_pro");
      assert_serialization(InferenceModelType::HappyHorse1p0, "happy_horse_1p0");
      assert_serialization(InferenceModelType::Seedance10Lite, "seedance_1p0_lite");
      assert_serialization(InferenceModelType::Seedance10Pro, "seedance_1p0_pro");
      assert_serialization(InferenceModelType::Seedance1p5Pro, "seedance_1p5_pro");
      assert_serialization(InferenceModelType::Seedance2p0, "seedance_2p0");
      assert_serialization(InferenceModelType::Seedance2p0Fast, "seedance_2p0_fast");
      assert_serialization(InferenceModelType::Seedance2p0BytePlus, "seedance_2p0_bp");
      assert_serialization(InferenceModelType::Seedance2p0BytePlusFast, "seedance_2p0_bp_fast");
      assert_serialization(InferenceModelType::Seedance2p0Ultra, "seedance_2p0_u");
      assert_serialization(InferenceModelType::Seedance2p0UltraFast, "seedance_2p0_u_fast");
      assert_serialization(InferenceModelType::Sora2, "sora_2");
      assert_serialization(InferenceModelType::Sora2Pro, "sora_2_pro");
      assert_serialization(InferenceModelType::Veo2, "veo_2");
      assert_serialization(InferenceModelType::Veo3, "veo_3");
      assert_serialization(InferenceModelType::Veo3Fast, "veo_3_fast");
      assert_serialization(InferenceModelType::Veo3p1, "veo_3p1");
      assert_serialization(InferenceModelType::Veo3p1Fast, "veo_3p1_fast");
      assert_serialization(InferenceModelType::PreviewModel, "preview_model");
      assert_serialization(InferenceModelType::PreviewModelFast, "preview_model_fast");
      assert_serialization(InferenceModelType::SwitchX, "switch_x");

      // 3D Object generation models
      assert_serialization(InferenceModelType::Hunyuan3d2_0, "hunyuan_3d_2p0");
      assert_serialization(InferenceModelType::Hunyuan3d2_1, "hunyuan_3d_2p1");
      assert_serialization(InferenceModelType::Hunyuan3d3, "hunyuan_3d_3");

      // Splat generation models (World Labs)
      assert_serialization(InferenceModelType::Marble0p1Mini, "marble_0p1_mini");
      assert_serialization(InferenceModelType::Marble0p1Plus, "marble_0p1_plus");
    }

    #[test]
    fn to_str() {
      // Legacy variants
      assert_eq!(InferenceModelType::ComfyUi.to_str(), "comfy_ui");
      assert_eq!(InferenceModelType::RvcV2.to_str(), "rvc_v2");
      assert_eq!(InferenceModelType::SadTalker.to_str(), "sad_talker");
      assert_eq!(InferenceModelType::SoVitsSvc.to_str(), "so_vits_svc");
      assert_eq!(InferenceModelType::SeedVc.to_str(), "seed_vc");
      assert_eq!(InferenceModelType::ImageGenApi.to_str(), "image_gen_api");
      assert_eq!(InferenceModelType::Tacotron2.to_str(), "tacotron2");
      assert_eq!(InferenceModelType::Vits.to_str(), "vits");
      assert_eq!(InferenceModelType::VallEX.to_str(), "vall_e_x");
      assert_eq!(InferenceModelType::RerenderAVideo.to_str(), "rerender_a_video");
      assert_eq!(InferenceModelType::StableDiffusion.to_str(), "stable_diffusion");
      assert_eq!(InferenceModelType::MocapNet.to_str(), "mocap_net");
      assert_eq!(InferenceModelType::StyleTTS2.to_str(), "styletts2");
      assert_eq!(InferenceModelType::ConvertFbxToGltf.to_str(), "convert_fbx_gltf");
      assert_eq!(InferenceModelType::BvhToWorkflow.to_str(), "bvh_to_workflow");

      // Image models (mirror of CommonModelType)
      assert_eq!(InferenceModelType::Flux1Dev.to_str(), "flux_1_dev");
      assert_eq!(InferenceModelType::Flux1Schnell.to_str(), "flux_1_schnell");
      assert_eq!(InferenceModelType::FluxDevJuggernaut.to_str(), "flux_dev_juggernaut");
      assert_eq!(InferenceModelType::FluxPro1.to_str(), "flux_pro_1");
      assert_eq!(InferenceModelType::FluxPro11.to_str(), "flux_pro_1p1");
      assert_eq!(InferenceModelType::FluxPro11Ultra.to_str(), "flux_pro_1p1_ultra");
      assert_eq!(InferenceModelType::FluxProKontextMax.to_str(), "flux_pro_kontext_max");
      assert_eq!(InferenceModelType::Flux2LoraAngles.to_str(), "flux_2_lora_angles");
      assert_eq!(InferenceModelType::GptImage1.to_str(), "gpt_image_1");
      assert_eq!(InferenceModelType::GptImage1p5.to_str(), "gpt_image_1p5");
      assert_eq!(InferenceModelType::GptImage2.to_str(), "gpt_image_2");
      assert_eq!(InferenceModelType::GrokImage.to_str(), "grok_image");
      assert_eq!(InferenceModelType::GrokImagineImage.to_str(), "grok_imagine_image");
      assert_eq!(InferenceModelType::GrokImagineImageQuality.to_str(), "grok_imagine_image_q");
      assert_eq!(InferenceModelType::Recraft3.to_str(), "recraft_3");
      assert_eq!(InferenceModelType::SeedEdit3.to_str(), "seededit_3");
      assert_eq!(InferenceModelType::Qwen.to_str(), "qwen");
      assert_eq!(InferenceModelType::QwenEdit2511Angles.to_str(), "qwen_edit_2511_angles");
      assert_eq!(InferenceModelType::Gemini25Flash.to_str(), "gemini_25_flash");
      assert_eq!(InferenceModelType::NanoBanana.to_str(), "nano_banana");
      assert_eq!(InferenceModelType::NanoBanana2.to_str(), "nano_banana_2");
      assert_eq!(InferenceModelType::NanoBananaPro.to_str(), "nano_banana_pro");
      assert_eq!(InferenceModelType::Seedream4.to_str(), "seedream_4");
      assert_eq!(InferenceModelType::Seedream4p5.to_str(), "seedream_4p5");
      assert_eq!(InferenceModelType::Seedream5Lite.to_str(), "seedream_5_lite");
      assert_eq!(InferenceModelType::Midjourney.to_str(), "midjourney");
      assert_eq!(InferenceModelType::MidjourneyV6.to_str(), "midjourney_v6");
      assert_eq!(InferenceModelType::MidjourneyV6p1.to_str(), "midjourney_v6p1");
      assert_eq!(InferenceModelType::MidjourneyV6p1Raw.to_str(), "midjourney_v6p1_raw");
      assert_eq!(InferenceModelType::MidjourneyV7.to_str(), "midjourney_v7");
      assert_eq!(InferenceModelType::MidjourneyV7Draft.to_str(), "midjourney_v7_draft");
      assert_eq!(InferenceModelType::MidjourneyV7DraftRaw.to_str(), "midjourney_v7_draft_raw");
      assert_eq!(InferenceModelType::MidjourneyV7Raw.to_str(), "midjourney_v7_raw");

      // Video models
      assert_eq!(InferenceModelType::GrokVideo.to_str(), "grok_video");
      assert_eq!(InferenceModelType::GrokImagineVideo.to_str(), "grok_imagine_video");
      assert_eq!(InferenceModelType::Kling16Pro.to_str(), "kling_1p6_pro");
      assert_eq!(InferenceModelType::Kling21Pro.to_str(), "kling_2p1_pro");
      assert_eq!(InferenceModelType::Kling21Master.to_str(), "kling_2p1_master");
      assert_eq!(InferenceModelType::Kling2p5TurboPro.to_str(), "kling_2p5_turbo_pro");
      assert_eq!(InferenceModelType::Kling2p6Pro.to_str(), "kling_2p6_pro");
      assert_eq!(InferenceModelType::Kling3p0Standard.to_str(), "kling_3p0_standard");
      assert_eq!(InferenceModelType::Kling3p0Pro.to_str(), "kling_3p0_pro");
      assert_eq!(InferenceModelType::HappyHorse1p0.to_str(), "happy_horse_1p0");
      assert_eq!(InferenceModelType::Seedance10Lite.to_str(), "seedance_1p0_lite");
      assert_eq!(InferenceModelType::Seedance10Pro.to_str(), "seedance_1p0_pro");
      assert_eq!(InferenceModelType::Seedance1p5Pro.to_str(), "seedance_1p5_pro");
      assert_eq!(InferenceModelType::Seedance2p0.to_str(), "seedance_2p0");
      assert_eq!(InferenceModelType::Seedance2p0Fast.to_str(), "seedance_2p0_fast");
      assert_eq!(InferenceModelType::Seedance2p0BytePlus.to_str(), "seedance_2p0_bp");
      assert_eq!(InferenceModelType::Seedance2p0BytePlusFast.to_str(), "seedance_2p0_bp_fast");
      assert_eq!(InferenceModelType::Seedance2p0Ultra.to_str(), "seedance_2p0_u");
      assert_eq!(InferenceModelType::Seedance2p0UltraFast.to_str(), "seedance_2p0_u_fast");
      assert_eq!(InferenceModelType::Sora2.to_str(), "sora_2");
      assert_eq!(InferenceModelType::Sora2Pro.to_str(), "sora_2_pro");
      assert_eq!(InferenceModelType::Veo2.to_str(), "veo_2");
      assert_eq!(InferenceModelType::Veo3.to_str(), "veo_3");
      assert_eq!(InferenceModelType::Veo3Fast.to_str(), "veo_3_fast");
      assert_eq!(InferenceModelType::Veo3p1.to_str(), "veo_3p1");
      assert_eq!(InferenceModelType::Veo3p1Fast.to_str(), "veo_3p1_fast");
      assert_eq!(InferenceModelType::PreviewModel.to_str(), "preview_model");
      assert_eq!(InferenceModelType::PreviewModelFast.to_str(), "preview_model_fast");
      assert_eq!(InferenceModelType::SwitchX.to_str(), "switch_x");

      // 3D Object generation models
      assert_eq!(InferenceModelType::Hunyuan3d2_0.to_str(), "hunyuan_3d_2p0");
      assert_eq!(InferenceModelType::Hunyuan3d2_1.to_str(), "hunyuan_3d_2p1");
      assert_eq!(InferenceModelType::Hunyuan3d3.to_str(), "hunyuan_3d_3");

      // Splat generation models (World Labs)
      assert_eq!(InferenceModelType::Marble0p1Mini.to_str(), "marble_0p1_mini");
      assert_eq!(InferenceModelType::Marble0p1Plus.to_str(), "marble_0p1_plus");
    }

    #[test]
    fn from_str() {
      // Legacy variants
      assert_eq!(InferenceModelType::from_str("comfy_ui").unwrap(), InferenceModelType::ComfyUi);
      assert_eq!(InferenceModelType::from_str("rvc_v2").unwrap(), InferenceModelType::RvcV2);
      assert_eq!(InferenceModelType::from_str("sad_talker").unwrap(), InferenceModelType::SadTalker);
      assert_eq!(InferenceModelType::from_str("so_vits_svc").unwrap(), InferenceModelType::SoVitsSvc);
      assert_eq!(InferenceModelType::from_str("seed_vc").unwrap(), InferenceModelType::SeedVc);
      assert_eq!(InferenceModelType::from_str("image_gen_api").unwrap(), InferenceModelType::ImageGenApi);
      assert_eq!(InferenceModelType::from_str("tacotron2").unwrap(), InferenceModelType::Tacotron2);
      assert_eq!(InferenceModelType::from_str("vits").unwrap(), InferenceModelType::Vits);
      assert_eq!(InferenceModelType::from_str("vall_e_x").unwrap(), InferenceModelType::VallEX);
      assert_eq!(InferenceModelType::from_str("rerender_a_video").unwrap(), InferenceModelType::RerenderAVideo);
      assert_eq!(InferenceModelType::from_str("stable_diffusion").unwrap(), InferenceModelType::StableDiffusion);
      assert_eq!(InferenceModelType::from_str("mocap_net").unwrap(), InferenceModelType::MocapNet);
      assert_eq!(InferenceModelType::from_str("styletts2").unwrap(), InferenceModelType::StyleTTS2);
      assert_eq!(InferenceModelType::from_str("convert_fbx_gltf").unwrap(), InferenceModelType::ConvertFbxToGltf);
      assert_eq!(InferenceModelType::from_str("bvh_to_workflow").unwrap(), InferenceModelType::BvhToWorkflow);

      // Image models (mirror of CommonModelType)
      assert_eq!(InferenceModelType::from_str("flux_1_dev").unwrap(), InferenceModelType::Flux1Dev);
      assert_eq!(InferenceModelType::from_str("flux_1_schnell").unwrap(), InferenceModelType::Flux1Schnell);
      assert_eq!(InferenceModelType::from_str("flux_dev_juggernaut").unwrap(), InferenceModelType::FluxDevJuggernaut);
      assert_eq!(InferenceModelType::from_str("flux_pro_1").unwrap(), InferenceModelType::FluxPro1);
      assert_eq!(InferenceModelType::from_str("flux_pro_1p1").unwrap(), InferenceModelType::FluxPro11);
      assert_eq!(InferenceModelType::from_str("flux_pro_1p1_ultra").unwrap(), InferenceModelType::FluxPro11Ultra);
      assert_eq!(InferenceModelType::from_str("flux_pro_kontext_max").unwrap(), InferenceModelType::FluxProKontextMax);
      assert_eq!(InferenceModelType::from_str("flux_2_lora_angles").unwrap(), InferenceModelType::Flux2LoraAngles);
      assert_eq!(InferenceModelType::from_str("gpt_image_1").unwrap(), InferenceModelType::GptImage1);
      assert_eq!(InferenceModelType::from_str("gpt_image_1p5").unwrap(), InferenceModelType::GptImage1p5);
      assert_eq!(InferenceModelType::from_str("gpt_image_2").unwrap(), InferenceModelType::GptImage2);
      assert_eq!(InferenceModelType::from_str("grok_image").unwrap(), InferenceModelType::GrokImage);
      assert_eq!(InferenceModelType::from_str("grok_imagine_image").unwrap(), InferenceModelType::GrokImagineImage);
      assert_eq!(InferenceModelType::from_str("grok_imagine_image_q").unwrap(), InferenceModelType::GrokImagineImageQuality);
      assert_eq!(InferenceModelType::from_str("recraft_3").unwrap(), InferenceModelType::Recraft3);
      assert_eq!(InferenceModelType::from_str("seededit_3").unwrap(), InferenceModelType::SeedEdit3);
      assert_eq!(InferenceModelType::from_str("qwen").unwrap(), InferenceModelType::Qwen);
      assert_eq!(InferenceModelType::from_str("qwen_edit_2511_angles").unwrap(), InferenceModelType::QwenEdit2511Angles);
      assert_eq!(InferenceModelType::from_str("gemini_25_flash").unwrap(), InferenceModelType::Gemini25Flash);
      assert_eq!(InferenceModelType::from_str("nano_banana").unwrap(), InferenceModelType::NanoBanana);
      assert_eq!(InferenceModelType::from_str("nano_banana_2").unwrap(), InferenceModelType::NanoBanana2);
      assert_eq!(InferenceModelType::from_str("nano_banana_pro").unwrap(), InferenceModelType::NanoBananaPro);
      assert_eq!(InferenceModelType::from_str("seedream_4").unwrap(), InferenceModelType::Seedream4);
      assert_eq!(InferenceModelType::from_str("seedream_4p5").unwrap(), InferenceModelType::Seedream4p5);
      assert_eq!(InferenceModelType::from_str("seedream_5_lite").unwrap(), InferenceModelType::Seedream5Lite);
      assert_eq!(InferenceModelType::from_str("midjourney").unwrap(), InferenceModelType::Midjourney);
      assert_eq!(InferenceModelType::from_str("midjourney_v6").unwrap(), InferenceModelType::MidjourneyV6);
      assert_eq!(InferenceModelType::from_str("midjourney_v6p1").unwrap(), InferenceModelType::MidjourneyV6p1);
      assert_eq!(InferenceModelType::from_str("midjourney_v6p1_raw").unwrap(), InferenceModelType::MidjourneyV6p1Raw);
      assert_eq!(InferenceModelType::from_str("midjourney_v7").unwrap(), InferenceModelType::MidjourneyV7);
      assert_eq!(InferenceModelType::from_str("midjourney_v7_draft").unwrap(), InferenceModelType::MidjourneyV7Draft);
      assert_eq!(InferenceModelType::from_str("midjourney_v7_draft_raw").unwrap(), InferenceModelType::MidjourneyV7DraftRaw);
      assert_eq!(InferenceModelType::from_str("midjourney_v7_raw").unwrap(), InferenceModelType::MidjourneyV7Raw);

      // Video models
      assert_eq!(InferenceModelType::from_str("grok_video").unwrap(), InferenceModelType::GrokVideo);
      assert_eq!(InferenceModelType::from_str("grok_imagine_video").unwrap(), InferenceModelType::GrokImagineVideo);
      assert_eq!(InferenceModelType::from_str("kling_1p6_pro").unwrap(), InferenceModelType::Kling16Pro);
      assert_eq!(InferenceModelType::from_str("kling_2p1_pro").unwrap(), InferenceModelType::Kling21Pro);
      assert_eq!(InferenceModelType::from_str("kling_2p1_master").unwrap(), InferenceModelType::Kling21Master);
      assert_eq!(InferenceModelType::from_str("kling_2p5_turbo_pro").unwrap(), InferenceModelType::Kling2p5TurboPro);
      assert_eq!(InferenceModelType::from_str("kling_2p6_pro").unwrap(), InferenceModelType::Kling2p6Pro);
      assert_eq!(InferenceModelType::from_str("kling_3p0_standard").unwrap(), InferenceModelType::Kling3p0Standard);
      assert_eq!(InferenceModelType::from_str("kling_3p0_pro").unwrap(), InferenceModelType::Kling3p0Pro);
      assert_eq!(InferenceModelType::from_str("happy_horse_1p0").unwrap(), InferenceModelType::HappyHorse1p0);
      assert_eq!(InferenceModelType::from_str("seedance_1p0_lite").unwrap(), InferenceModelType::Seedance10Lite);
      assert_eq!(InferenceModelType::from_str("seedance_1p0_pro").unwrap(), InferenceModelType::Seedance10Pro);
      assert_eq!(InferenceModelType::from_str("seedance_1p5_pro").unwrap(), InferenceModelType::Seedance1p5Pro);
      assert_eq!(InferenceModelType::from_str("seedance_2p0").unwrap(), InferenceModelType::Seedance2p0);
      assert_eq!(InferenceModelType::from_str("seedance_2p0_fast").unwrap(), InferenceModelType::Seedance2p0Fast);
      assert_eq!(InferenceModelType::from_str("seedance_2p0_bp").unwrap(), InferenceModelType::Seedance2p0BytePlus);
      assert_eq!(InferenceModelType::from_str("seedance_2p0_bp_fast").unwrap(), InferenceModelType::Seedance2p0BytePlusFast);
      assert_eq!(InferenceModelType::from_str("seedance_2p0_u").unwrap(), InferenceModelType::Seedance2p0Ultra);
      assert_eq!(InferenceModelType::from_str("seedance_2p0_u_fast").unwrap(), InferenceModelType::Seedance2p0UltraFast);
      assert_eq!(InferenceModelType::from_str("sora_2").unwrap(), InferenceModelType::Sora2);
      assert_eq!(InferenceModelType::from_str("sora_2_pro").unwrap(), InferenceModelType::Sora2Pro);
      assert_eq!(InferenceModelType::from_str("veo_2").unwrap(), InferenceModelType::Veo2);
      assert_eq!(InferenceModelType::from_str("veo_3").unwrap(), InferenceModelType::Veo3);
      assert_eq!(InferenceModelType::from_str("veo_3_fast").unwrap(), InferenceModelType::Veo3Fast);
      assert_eq!(InferenceModelType::from_str("veo_3p1").unwrap(), InferenceModelType::Veo3p1);
      assert_eq!(InferenceModelType::from_str("veo_3p1_fast").unwrap(), InferenceModelType::Veo3p1Fast);
      assert_eq!(InferenceModelType::from_str("preview_model").unwrap(), InferenceModelType::PreviewModel);
      assert_eq!(InferenceModelType::from_str("preview_model_fast").unwrap(), InferenceModelType::PreviewModelFast);
      assert_eq!(InferenceModelType::from_str("switch_x").unwrap(), InferenceModelType::SwitchX);

      // 3D Object generation models
      assert_eq!(InferenceModelType::from_str("hunyuan_3d_2p0").unwrap(), InferenceModelType::Hunyuan3d2_0);
      assert_eq!(InferenceModelType::from_str("hunyuan_3d_2p1").unwrap(), InferenceModelType::Hunyuan3d2_1);
      assert_eq!(InferenceModelType::from_str("hunyuan_3d_3").unwrap(), InferenceModelType::Hunyuan3d3);

      // Splat generation models (World Labs)
      assert_eq!(InferenceModelType::from_str("marble_0p1_mini").unwrap(), InferenceModelType::Marble0p1Mini);
      assert_eq!(InferenceModelType::from_str("marble_0p1_plus").unwrap(), InferenceModelType::Marble0p1Plus);
    }

    #[test]
    fn from_str_unknown_value_errors() {
      assert!(InferenceModelType::from_str("not_a_real_model").is_err());
    }

    #[test]
    fn all_variants() {
      // 15 legacy variants + every CommonModelType variant we mirror.
      let variants = InferenceModelType::all_variants();
      assert_eq!(variants.len(), 15 + CommonModelType::all_variants().len());

      // BTreeSet sort order is enum Ord = declaration order. The legacy
      // block is declared first, so ComfyUi is always pop_first, and the
      // legacy block is exhausted before the mirrored block begins.
      assert_eq!(variants.iter().next(), Some(&InferenceModelType::ComfyUi));

      // Every variant must be reachable via from_str(to_str(.)) — round-trip
      // is the structural guarantee we actually care about here.
      for variant in &variants {
        assert_eq!(*variant, InferenceModelType::from_str(variant.to_str()).unwrap());
      }
    }
  }

  mod from_common_model_type_tests {
    use super::*;

    #[test]
    fn round_trip_via_serialized_string() {
      // Every CommonModelType maps to an InferenceModelType whose
      // serialization matches exactly. This proves the 1:1 mapping
      // is consistent (no swapped variants).
      for common in CommonModelType::all_variants() {
        let inference = InferenceModelType::from_common_model_type(common);
        assert_eq!(
          common.to_str(),
          inference.to_str(),
          "mismatch: CommonModelType::{:?} -> InferenceModelType::{:?}",
          common, inference,
        );
      }
    }

    #[test]
    fn every_common_variant_is_covered() {
      // If a CommonModelType variant is missing from the match in
      // from_common_model_type, this would fail to compile. The runtime
      // assertion is a belt-and-suspenders sanity check.
      let count = CommonModelType::all_variants().len();
      assert!(count > 0);
      for common in CommonModelType::all_variants() {
        let _ = InferenceModelType::from_common_model_type(common);
      }
    }

    #[test]
    fn spot_check_specific_mappings() {
      assert_eq!(
        InferenceModelType::from_common_model_type(CommonModelType::Flux1Dev),
        InferenceModelType::Flux1Dev,
      );
      assert_eq!(
        InferenceModelType::from_common_model_type(CommonModelType::Sora2Pro),
        InferenceModelType::Sora2Pro,
      );
      assert_eq!(
        InferenceModelType::from_common_model_type(CommonModelType::Marble0p1Plus),
        InferenceModelType::Marble0p1Plus,
      );
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(InferenceModelType::all_variants().len(), InferenceModelType::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in InferenceModelType::all_variants() {
        assert_eq!(variant, InferenceModelType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, InferenceModelType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, InferenceModelType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH : usize = 32;
      for variant in InferenceModelType::all_variants() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long ({} chars)", variant, serialized.len());
      }
    }
  }
}
