//! Self-contained, forward-compatible binding for `GET /v1/omni_gen/models/video`.
//!
//! IMPORTANT: This module deliberately does NOT reuse any types from
//! `artcraft_api_defs`. Client builds may be deployed in the wild long after the
//! server's models, enums, and response shapes have changed, so every request /
//! response type is copied here and made permissive:
//!   - Unknown JSON fields are ignored (serde default behavior).
//!   - Missing collection/flag fields default rather than fail (`serde(default)`).
//!   - Every string-valued enum has an `Unknown(String)` catch-all so new server
//!     variants deserialize instead of erroring.

use serde_derive::{Deserialize, Serialize};

use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::basic_json_get_request::basic_json_get_request;

pub const OMNI_GEN_VIDEO_MODELS_PATH: &str = "/v1/omni_gen/models/video";

/// Arguments for [`omni_gen_list_video_models`].
pub struct OmniGenListVideoModelsArgs<'a> {
  pub api_host: &'a ApiHost,
  pub maybe_creds: Option<&'a StorytellerCredentialSet>,
  /// Which provider's models to list. `None` lets the server default (artcraft).
  pub provider: Option<OmniGenVideoModelsProvider>,
}

/// List available video models.
pub async fn omni_gen_list_video_models(
  args: OmniGenListVideoModelsArgs<'_>,
) -> Result<OmniGenVideoModelsResponse, StorytellerError> {
  let path = match args.provider {
    Some(provider) => format!("{}?provider={}", OMNI_GEN_VIDEO_MODELS_PATH, provider.as_query_value()),
    None => OMNI_GEN_VIDEO_MODELS_PATH.to_string(),
  };

  Ok(basic_json_get_request(args.api_host, &path, args.maybe_creds).await?)
}

/// The provider filter for the models endpoint (a client-supplied request value).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum OmniGenVideoModelsProvider {
  /// Only models available through ArtCraft.
  Artcraft,
  /// All known models across all providers.
  All,
}

impl OmniGenVideoModelsProvider {
  pub fn as_query_value(self) -> &'static str {
    match self {
      Self::Artcraft => "artcraft",
      Self::All => "all",
    }
  }
}

impl Default for OmniGenVideoModelsProvider {
  fn default() -> Self {
    Self::Artcraft
  }
}

// ============================ Response types ============================

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct OmniGenVideoModelsResponse {
  #[serde(default)]
  pub success: bool,
  #[serde(default)]
  pub models: Vec<OmniGenVideoModelDetails>,
  #[serde(default)]
  pub providers: Vec<OmniGenVideoModelProviderDetails>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct OmniGenVideoModelProviderDetails {
  pub provider: GenerationProvider,
  #[serde(default)]
  pub models: Vec<OmniGenVideoProviderModelDetails>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct OmniGenVideoProviderModelDetails {
  pub model: CommonVideoModel,
  #[serde(default)]
  pub overrides: Option<OmniGenVideoModelDetails>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct OmniGenVideoModelDetails {
  pub model: CommonVideoModel,
  #[serde(default)]
  pub model_creator: Option<ModelCreator>,
  #[serde(default)]
  pub full_name: Option<String>,
  #[serde(default)]
  pub extra_info: Option<String>,
  #[serde(default)]
  pub extra_info_short: Option<String>,
  #[serde(default)]
  pub text_to_video_supported: Option<bool>,
  #[serde(default)]
  pub text_prompt_supported: Option<bool>,
  #[serde(default)]
  pub text_prompt_max_length: Option<u16>,
  #[serde(default)]
  pub negative_text_prompt_supported: Option<bool>,
  #[serde(default)]
  pub negative_text_prompt_max_length: Option<u16>,
  #[serde(default)]
  pub starting_keyframe_supported: Option<bool>,
  #[serde(default)]
  pub starting_keyframe_required: Option<bool>,
  #[serde(default)]
  pub ending_keyframe_supported: Option<bool>,
  #[serde(default)]
  pub image_references_supported: Option<bool>,
  #[serde(default)]
  pub image_references_max: Option<u16>,
  #[serde(default)]
  pub video_references_supported: Option<bool>,
  #[serde(default)]
  pub video_references_max: Option<u16>,
  #[serde(default)]
  pub video_references_max_total_duration_seconds: Option<u16>,
  #[serde(default)]
  pub audio_references_supported: Option<bool>,
  #[serde(default)]
  pub audio_references_max: Option<u16>,
  #[serde(default)]
  pub audio_references_max_total_duration_seconds: Option<u16>,
  #[serde(default)]
  pub character_references_supported: Option<bool>,
  #[serde(default)]
  pub character_references_max: Option<u16>,
  #[serde(default)]
  pub show_generate_with_sound_toggle: Option<bool>,
  #[serde(default)]
  pub aspect_ratio_options: Option<Vec<CommonAspectRatio>>,
  #[serde(default)]
  pub aspect_ratio_default: Option<CommonAspectRatio>,
  #[serde(default)]
  pub resolution_options: Option<Vec<CommonResolution>>,
  #[serde(default)]
  pub resolution_default: Option<CommonResolution>,
  #[serde(default)]
  pub bitrate_options: Option<Vec<CommonBitrate>>,
  #[serde(default)]
  pub bitrate_default: Option<CommonBitrate>,
  #[serde(default)]
  pub quality_options: Option<Vec<CommonQuality>>,
  #[serde(default)]
  pub default_quality: Option<CommonQuality>,
  #[serde(default)]
  pub duration_seconds_min: Option<u16>,
  #[serde(default)]
  pub duration_seconds_max: Option<u16>,
  #[serde(default)]
  pub duration_seconds_max_with_image_references: Option<u16>,
  #[serde(default)]
  pub duration_seconds_options: Option<Vec<u16>>,
  #[serde(default)]
  pub duration_seconds_default: Option<u16>,
  #[serde(default)]
  pub batch_size_min: Option<u16>,
  #[serde(default)]
  pub batch_size_max: Option<u16>,
  #[serde(default)]
  pub batch_size_options: Option<Vec<u16>>,
  #[serde(default)]
  pub batch_size_default: Option<u16>,
  #[serde(default)]
  pub is_disabled: Option<bool>,
}

// ============================ Enums (forward-compatible copies) ============================

/// Local, forward-compatible copy of `GenerationProvider`.
///
/// Serialized as a string. Any value this client build does not recognize is
/// preserved verbatim in [`Unknown`], so newer server variants never break
/// deserialization.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(from = "String", into = "String")]
pub enum GenerationProvider {
  Artcraft,
  Fal,
  Grok,
  Midjourney,
  Sora,
  WorldLabs,
  /// A value not known to this client build (preserved as-is).
  Unknown(String),
}

impl From<String> for GenerationProvider {
  fn from(value: String) -> Self {
    match value.as_str() {
      "artcraft" => Self::Artcraft,
      "fal" => Self::Fal,
      "grok" => Self::Grok,
      "midjourney" => Self::Midjourney,
      "sora" => Self::Sora,
      "world_labs" => Self::WorldLabs,
      _ => Self::Unknown(value),
    }
  }
}

impl From<GenerationProvider> for String {
  fn from(value: GenerationProvider) -> Self {
    match value {
      GenerationProvider::Artcraft => "artcraft".to_string(),
      GenerationProvider::Fal => "fal".to_string(),
      GenerationProvider::Grok => "grok".to_string(),
      GenerationProvider::Midjourney => "midjourney".to_string(),
      GenerationProvider::Sora => "sora".to_string(),
      GenerationProvider::WorldLabs => "world_labs".to_string(),
      GenerationProvider::Unknown(other) => other,
    }
  }
}

/// Local, forward-compatible copy of `ModelCreator`.
///
/// Serialized as a string. Any value this client build does not recognize is
/// preserved verbatim in [`Unknown`], so newer server variants never break
/// deserialization.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(from = "String", into = "String")]
pub enum ModelCreator {
  Alibaba,
  ArtCraft,
  BlackForestLabs,
  Bytedance,
  Fal,
  Google,
  Grok,
  Hailuo,
  Higgsfield,
  Kling,
  Krea,
  Midjourney,
  OpenAi,
  OpenArt,
  Recraft,
  Replicate,
  Runway,
  Stability,
  Tencent,
  TensorArt,
  Vidu,
  WorldLabs,
  /// A value not known to this client build (preserved as-is).
  Unknown(String),
}

impl From<String> for ModelCreator {
  fn from(value: String) -> Self {
    match value.as_str() {
      "alibaba" => Self::Alibaba,
      "artcraft" => Self::ArtCraft,
      "black_forest_labs" => Self::BlackForestLabs,
      "bytedance" => Self::Bytedance,
      "fal" => Self::Fal,
      "google" => Self::Google,
      "grok" => Self::Grok,
      "hailuo" => Self::Hailuo,
      "higgsfield" => Self::Higgsfield,
      "kling" => Self::Kling,
      "krea" => Self::Krea,
      "midjourney" => Self::Midjourney,
      "open_ai" => Self::OpenAi,
      "open_art" => Self::OpenArt,
      "recraft" => Self::Recraft,
      "replicate" => Self::Replicate,
      "runway" => Self::Runway,
      "stability" => Self::Stability,
      "tencent" => Self::Tencent,
      "tensor_art" => Self::TensorArt,
      "vidu" => Self::Vidu,
      "world_labs" => Self::WorldLabs,
      _ => Self::Unknown(value),
    }
  }
}

impl From<ModelCreator> for String {
  fn from(value: ModelCreator) -> Self {
    match value {
      ModelCreator::Alibaba => "alibaba".to_string(),
      ModelCreator::ArtCraft => "artcraft".to_string(),
      ModelCreator::BlackForestLabs => "black_forest_labs".to_string(),
      ModelCreator::Bytedance => "bytedance".to_string(),
      ModelCreator::Fal => "fal".to_string(),
      ModelCreator::Google => "google".to_string(),
      ModelCreator::Grok => "grok".to_string(),
      ModelCreator::Hailuo => "hailuo".to_string(),
      ModelCreator::Higgsfield => "higgsfield".to_string(),
      ModelCreator::Kling => "kling".to_string(),
      ModelCreator::Krea => "krea".to_string(),
      ModelCreator::Midjourney => "midjourney".to_string(),
      ModelCreator::OpenAi => "open_ai".to_string(),
      ModelCreator::OpenArt => "open_art".to_string(),
      ModelCreator::Recraft => "recraft".to_string(),
      ModelCreator::Replicate => "replicate".to_string(),
      ModelCreator::Runway => "runway".to_string(),
      ModelCreator::Stability => "stability".to_string(),
      ModelCreator::Tencent => "tencent".to_string(),
      ModelCreator::TensorArt => "tensor_art".to_string(),
      ModelCreator::Vidu => "vidu".to_string(),
      ModelCreator::WorldLabs => "world_labs".to_string(),
      ModelCreator::Unknown(other) => other,
    }
  }
}

/// Local, forward-compatible copy of `CommonVideoModel`.
///
/// Serialized as a string. Any value this client build does not recognize is
/// preserved verbatim in [`Unknown`], so newer server variants never break
/// deserialization.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(from = "String", into = "String")]
pub enum CommonVideoModel {
  GrokVideo,
  GrokImagineVideo,
  GrokImagineVideo1p5,
  Kling16Pro,
  Kling21Pro,
  Kling21Master,
  Kling2p5TurboPro,
  Kling2p6Pro,
  Kling3p0Standard,
  Kling3p0Pro,
  HappyHorse1p0,
  Seedance10Lite,
  Seedance1p5Pro,
  Seedance2p0,
  Seedance2p0Fast,
  Seedance2p0BytePlus,
  Seedance2p0BytePlusFast,
  Seedance2p0Ultra,
  Seedance2p0UltraFast,
  Seedance2p0BytePlusUltra,
  Seedance2p0BytePlusUltraFast,
  Seedance2p0Mini,
  Seedance2p0BytePlusMini,
  Seedance2p0BytePlusUltraMini,
  Sora2,
  Sora2Pro,
  Veo2,
  Veo3,
  Veo3Fast,
  Veo3p1,
  Veo3p1Fast,
  PreviewModel,
  PreviewModelFast,
  /// A value not known to this client build (preserved as-is).
  Unknown(String),
}

impl From<String> for CommonVideoModel {
  fn from(value: String) -> Self {
    match value.as_str() {
      "grok_video" => Self::GrokVideo,
      "grok_imagine_video" => Self::GrokImagineVideo,
      "grok_imagine_video_1p5" => Self::GrokImagineVideo1p5,
      "kling_1p6_pro" => Self::Kling16Pro,
      "kling_2p1_pro" => Self::Kling21Pro,
      "kling_2p1_master" => Self::Kling21Master,
      "kling_2p5_turbo_pro" => Self::Kling2p5TurboPro,
      "kling_2p6_pro" => Self::Kling2p6Pro,
      "kling_3p0_standard" => Self::Kling3p0Standard,
      "kling_3p0_pro" => Self::Kling3p0Pro,
      "happy_horse_1p0" => Self::HappyHorse1p0,
      "seedance_1p0_lite" => Self::Seedance10Lite,
      "seedance_1p5_pro" => Self::Seedance1p5Pro,
      "seedance_2p0" => Self::Seedance2p0,
      "seedance_2p0_fast" => Self::Seedance2p0Fast,
      "seedance_2p0_bp" => Self::Seedance2p0BytePlus,
      "seedance_2p0_bp_fast" => Self::Seedance2p0BytePlusFast,
      "seedance_2p0_u" => Self::Seedance2p0Ultra,
      "seedance_2p0_u_fast" => Self::Seedance2p0UltraFast,
      "seedance_2p0_bpu" => Self::Seedance2p0BytePlusUltra,
      "seedance_2p0_bpu_fast" => Self::Seedance2p0BytePlusUltraFast,
      "seedance_2p0_mini" => Self::Seedance2p0Mini,
      "seedance_2p0_bp_mini" => Self::Seedance2p0BytePlusMini,
      "seedance_2p0_bpu_mini" => Self::Seedance2p0BytePlusUltraMini,
      "sora_2" => Self::Sora2,
      "sora_2_pro" => Self::Sora2Pro,
      "veo_2" => Self::Veo2,
      "veo_3" => Self::Veo3,
      "veo_3_fast" => Self::Veo3Fast,
      "veo_3p1" => Self::Veo3p1,
      "veo_3p1_fast" => Self::Veo3p1Fast,
      "preview_model" => Self::PreviewModel,
      "preview_model_fast" => Self::PreviewModelFast,
      _ => Self::Unknown(value),
    }
  }
}

impl From<CommonVideoModel> for String {
  fn from(value: CommonVideoModel) -> Self {
    match value {
      CommonVideoModel::GrokVideo => "grok_video".to_string(),
      CommonVideoModel::GrokImagineVideo => "grok_imagine_video".to_string(),
      CommonVideoModel::GrokImagineVideo1p5 => "grok_imagine_video_1p5".to_string(),
      CommonVideoModel::Kling16Pro => "kling_1p6_pro".to_string(),
      CommonVideoModel::Kling21Pro => "kling_2p1_pro".to_string(),
      CommonVideoModel::Kling21Master => "kling_2p1_master".to_string(),
      CommonVideoModel::Kling2p5TurboPro => "kling_2p5_turbo_pro".to_string(),
      CommonVideoModel::Kling2p6Pro => "kling_2p6_pro".to_string(),
      CommonVideoModel::Kling3p0Standard => "kling_3p0_standard".to_string(),
      CommonVideoModel::Kling3p0Pro => "kling_3p0_pro".to_string(),
      CommonVideoModel::HappyHorse1p0 => "happy_horse_1p0".to_string(),
      CommonVideoModel::Seedance10Lite => "seedance_1p0_lite".to_string(),
      CommonVideoModel::Seedance1p5Pro => "seedance_1p5_pro".to_string(),
      CommonVideoModel::Seedance2p0 => "seedance_2p0".to_string(),
      CommonVideoModel::Seedance2p0Fast => "seedance_2p0_fast".to_string(),
      CommonVideoModel::Seedance2p0BytePlus => "seedance_2p0_bp".to_string(),
      CommonVideoModel::Seedance2p0BytePlusFast => "seedance_2p0_bp_fast".to_string(),
      CommonVideoModel::Seedance2p0Ultra => "seedance_2p0_u".to_string(),
      CommonVideoModel::Seedance2p0UltraFast => "seedance_2p0_u_fast".to_string(),
      CommonVideoModel::Seedance2p0BytePlusUltra => "seedance_2p0_bpu".to_string(),
      CommonVideoModel::Seedance2p0BytePlusUltraFast => "seedance_2p0_bpu_fast".to_string(),
      CommonVideoModel::Seedance2p0Mini => "seedance_2p0_mini".to_string(),
      CommonVideoModel::Seedance2p0BytePlusMini => "seedance_2p0_bp_mini".to_string(),
      CommonVideoModel::Seedance2p0BytePlusUltraMini => "seedance_2p0_bpu_mini".to_string(),
      CommonVideoModel::Sora2 => "sora_2".to_string(),
      CommonVideoModel::Sora2Pro => "sora_2_pro".to_string(),
      CommonVideoModel::Veo2 => "veo_2".to_string(),
      CommonVideoModel::Veo3 => "veo_3".to_string(),
      CommonVideoModel::Veo3Fast => "veo_3_fast".to_string(),
      CommonVideoModel::Veo3p1 => "veo_3p1".to_string(),
      CommonVideoModel::Veo3p1Fast => "veo_3p1_fast".to_string(),
      CommonVideoModel::PreviewModel => "preview_model".to_string(),
      CommonVideoModel::PreviewModelFast => "preview_model_fast".to_string(),
      CommonVideoModel::Unknown(other) => other,
    }
  }
}

/// Local, forward-compatible copy of `CommonAspectRatio`.
///
/// Serialized as a string. Any value this client build does not recognize is
/// preserved verbatim in [`Unknown`], so newer server variants never break
/// deserialization.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(from = "String", into = "String")]
pub enum CommonAspectRatio {
  Auto,
  Square,
  WideThreeByTwo,
  WideFourByThree,
  WideFiveByFour,
  WideSixteenByNine,
  WideTwentyOneByNine,
  TallTwoByThree,
  TallThreeByFour,
  TallFourByFive,
  TallNineBySixteen,
  TallNineByTwentyOne,
  Wide,
  Tall,
  Auto2k,
  Auto3k,
  Auto4k,
  SquareHd,
  /// A value not known to this client build (preserved as-is).
  Unknown(String),
}

impl From<String> for CommonAspectRatio {
  fn from(value: String) -> Self {
    match value.as_str() {
      "auto" => Self::Auto,
      "square" => Self::Square,
      "wide_three_by_two" => Self::WideThreeByTwo,
      "wide_four_by_three" => Self::WideFourByThree,
      "wide_five_by_four" => Self::WideFiveByFour,
      "wide_sixteen_by_nine" => Self::WideSixteenByNine,
      "wide_twenty_one_by_nine" => Self::WideTwentyOneByNine,
      "tall_two_by_three" => Self::TallTwoByThree,
      "tall_three_by_four" => Self::TallThreeByFour,
      "tall_four_by_five" => Self::TallFourByFive,
      "tall_nine_by_sixteen" => Self::TallNineBySixteen,
      "tall_nine_by_twenty_one" => Self::TallNineByTwentyOne,
      "wide" => Self::Wide,
      "tall" => Self::Tall,
      "auto_2k" => Self::Auto2k,
      "auto_3k" => Self::Auto3k,
      "auto_4k" => Self::Auto4k,
      "square_hd" => Self::SquareHd,
      _ => Self::Unknown(value),
    }
  }
}

impl From<CommonAspectRatio> for String {
  fn from(value: CommonAspectRatio) -> Self {
    match value {
      CommonAspectRatio::Auto => "auto".to_string(),
      CommonAspectRatio::Square => "square".to_string(),
      CommonAspectRatio::WideThreeByTwo => "wide_three_by_two".to_string(),
      CommonAspectRatio::WideFourByThree => "wide_four_by_three".to_string(),
      CommonAspectRatio::WideFiveByFour => "wide_five_by_four".to_string(),
      CommonAspectRatio::WideSixteenByNine => "wide_sixteen_by_nine".to_string(),
      CommonAspectRatio::WideTwentyOneByNine => "wide_twenty_one_by_nine".to_string(),
      CommonAspectRatio::TallTwoByThree => "tall_two_by_three".to_string(),
      CommonAspectRatio::TallThreeByFour => "tall_three_by_four".to_string(),
      CommonAspectRatio::TallFourByFive => "tall_four_by_five".to_string(),
      CommonAspectRatio::TallNineBySixteen => "tall_nine_by_sixteen".to_string(),
      CommonAspectRatio::TallNineByTwentyOne => "tall_nine_by_twenty_one".to_string(),
      CommonAspectRatio::Wide => "wide".to_string(),
      CommonAspectRatio::Tall => "tall".to_string(),
      CommonAspectRatio::Auto2k => "auto_2k".to_string(),
      CommonAspectRatio::Auto3k => "auto_3k".to_string(),
      CommonAspectRatio::Auto4k => "auto_4k".to_string(),
      CommonAspectRatio::SquareHd => "square_hd".to_string(),
      CommonAspectRatio::Unknown(other) => other,
    }
  }
}

/// Local, forward-compatible copy of `CommonResolution`.
///
/// Serialized as a string. Any value this client build does not recognize is
/// preserved verbatim in [`Unknown`], so newer server variants never break
/// deserialization.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(from = "String", into = "String")]
pub enum CommonResolution {
  OneK,
  TwoK,
  ThreeK,
  FourK,
  HalfK,
  FourEightyP,
  SevenTwentyP,
  TenEightyP,
  /// A value not known to this client build (preserved as-is).
  Unknown(String),
}

impl From<String> for CommonResolution {
  fn from(value: String) -> Self {
    match value.as_str() {
      "one_k" => Self::OneK,
      "two_k" => Self::TwoK,
      "three_k" => Self::ThreeK,
      "four_k" => Self::FourK,
      "half_k" => Self::HalfK,
      "four_eighty_p" => Self::FourEightyP,
      "seven_twenty_p" => Self::SevenTwentyP,
      "ten_eighty_p" => Self::TenEightyP,
      _ => Self::Unknown(value),
    }
  }
}

impl From<CommonResolution> for String {
  fn from(value: CommonResolution) -> Self {
    match value {
      CommonResolution::OneK => "one_k".to_string(),
      CommonResolution::TwoK => "two_k".to_string(),
      CommonResolution::ThreeK => "three_k".to_string(),
      CommonResolution::FourK => "four_k".to_string(),
      CommonResolution::HalfK => "half_k".to_string(),
      CommonResolution::FourEightyP => "four_eighty_p".to_string(),
      CommonResolution::SevenTwentyP => "seven_twenty_p".to_string(),
      CommonResolution::TenEightyP => "ten_eighty_p".to_string(),
      CommonResolution::Unknown(other) => other,
    }
  }
}

/// Local, forward-compatible copy of `CommonBitrate`.
///
/// Serialized as a string. Any value this client build does not recognize is
/// preserved verbatim in [`Unknown`], so newer server variants never break
/// deserialization.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(from = "String", into = "String")]
pub enum CommonBitrate {
  Normal,
  High,
  /// A value not known to this client build (preserved as-is).
  Unknown(String),
}

impl From<String> for CommonBitrate {
  fn from(value: String) -> Self {
    match value.as_str() {
      "normal" => Self::Normal,
      "high" => Self::High,
      _ => Self::Unknown(value),
    }
  }
}

impl From<CommonBitrate> for String {
  fn from(value: CommonBitrate) -> Self {
    match value {
      CommonBitrate::Normal => "normal".to_string(),
      CommonBitrate::High => "high".to_string(),
      CommonBitrate::Unknown(other) => other,
    }
  }
}

/// Local, forward-compatible copy of `CommonQuality`.
///
/// Serialized as a string. Any value this client build does not recognize is
/// preserved verbatim in [`Unknown`], so newer server variants never break
/// deserialization.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(from = "String", into = "String")]
pub enum CommonQuality {
  High,
  Medium,
  Low,
  /// A value not known to this client build (preserved as-is).
  Unknown(String),
}

impl From<String> for CommonQuality {
  fn from(value: String) -> Self {
    match value.as_str() {
      "high" => Self::High,
      "medium" => Self::Medium,
      "low" => Self::Low,
      _ => Self::Unknown(value),
    }
  }
}

impl From<CommonQuality> for String {
  fn from(value: CommonQuality) -> Self {
    match value {
      CommonQuality::High => "high".to_string(),
      CommonQuality::Medium => "medium".to_string(),
      CommonQuality::Low => "low".to_string(),
      CommonQuality::Unknown(other) => other,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn unknown_enum_value_is_preserved_and_round_trips() {
    let known: CommonVideoModel = serde_json::from_str("\"seedance_2p0\"").unwrap();
    assert_eq!(known, CommonVideoModel::Seedance2p0);
    assert_eq!(serde_json::to_string(&known).unwrap(), "\"seedance_2p0\"");

    // A value this build has never heard of does NOT fail — it is captured verbatim.
    let unknown: CommonVideoModel = serde_json::from_str("\"future_model_9000\"").unwrap();
    assert_eq!(unknown, CommonVideoModel::Unknown("future_model_9000".to_string()));
    // ...and serializes back to exactly what came in.
    assert_eq!(serde_json::to_string(&unknown).unwrap(), "\"future_model_9000\"");
  }

  #[test]
  fn response_tolerates_unknown_fields_and_variants() {
    let json = r#"{
      "success": true,
      "models": [
        {
          "model": "brand_new_model",
          "model_creator": "some_new_studio",
          "aspect_ratio_options": ["wide_sixteen_by_nine", "some_new_ratio"],
          "surprise_new_field": 123
        }
      ],
      "providers": [
        { "provider": "new_provider", "models": [ { "model": "seedance_2p0" } ] }
      ],
      "another_unexpected_top_level_field": "ignored"
    }"#;

    let resp: OmniGenVideoModelsResponse = serde_json::from_str(json).unwrap();
    assert!(resp.success);
    assert_eq!(resp.models.len(), 1);
    assert_eq!(resp.models[0].model, CommonVideoModel::Unknown("brand_new_model".to_string()));
    assert_eq!(resp.models[0].model_creator, Some(ModelCreator::Unknown("some_new_studio".to_string())));
    let ratios = resp.models[0].aspect_ratio_options.as_ref().unwrap();
    assert_eq!(ratios[0], CommonAspectRatio::WideSixteenByNine);
    assert_eq!(ratios[1], CommonAspectRatio::Unknown("some_new_ratio".to_string()));
    assert_eq!(resp.models[0].is_disabled, None); // missing optional -> None
    assert_eq!(resp.providers[0].provider, GenerationProvider::Unknown("new_provider".to_string()));
    assert_eq!(resp.providers[0].models[0].model, CommonVideoModel::Seedance2p0);
  }

  #[test]
  fn empty_object_uses_defaults() {
    let resp: OmniGenVideoModelsResponse = serde_json::from_str("{}").unwrap();
    assert!(!resp.success);
    assert!(resp.models.is_empty());
    assert!(resp.providers.is_empty());
  }
}
