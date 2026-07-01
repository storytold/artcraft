//! Command-specific response types for `list_image_models_command`.
//!
//! These are duplicated (never `artcraft_client` types), and every enum has an
//! `Unknown(String)` catch-all so newer server variants are preserved instead of
//! breaking an older desktop build. `From` impls map the API-client response over.

use serde_derive::Serialize;

use artcraft_client::datatypes::common_enums::generation::api_client_generation_provider::ApiClientGenerationProvider;
use artcraft_client::datatypes::common_enums::generation::api_client_model_creator::ApiClientModelCreator;
use artcraft_client::datatypes::common_enums::generation::api_client_image_model::ApiClientImageModel;
use artcraft_client::datatypes::common_enums::generation::api_client_aspect_ratio::ApiClientAspectRatio;
use artcraft_client::datatypes::common_enums::generation::api_client_resolution::ApiClientResolution;
use artcraft_client::datatypes::common_enums::generation::api_client_quality::ApiClientQuality;
use artcraft_client::endpoints::omni_gen::models::image::omni_gen_list_image_models::{
  OmniGenImageModelDetails, OmniGenImageModelProviderDetails, OmniGenImageProviderModelDetails, OmniGenImageModelsResponse,
};

use crate::core::commands::response::success_response_wrapper::SerializeMarker;

impl SerializeMarker for ListImageModelsResponse {}

// ============================ Enums ============================

/// Command-specific copy of `ApiClientGenerationProvider` with an `Unknown` catch-all so newer
/// server variants are preserved rather than dropped.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(into = "String")]
pub enum ListImageModelsProvider {
  Artcraft,
  Fal,
  Grok,
  Midjourney,
  Sora,
  WorldLabs,
  Unknown(String),
}

impl From<ApiClientGenerationProvider> for ListImageModelsProvider {
  fn from(value: ApiClientGenerationProvider) -> Self {
    match value {
      ApiClientGenerationProvider::Artcraft => Self::Artcraft,
      ApiClientGenerationProvider::Fal => Self::Fal,
      ApiClientGenerationProvider::Grok => Self::Grok,
      ApiClientGenerationProvider::Midjourney => Self::Midjourney,
      ApiClientGenerationProvider::Sora => Self::Sora,
      ApiClientGenerationProvider::WorldLabs => Self::WorldLabs,
      ApiClientGenerationProvider::Unknown(other) => Self::Unknown(other),
    }
  }
}

impl From<ListImageModelsProvider> for String {
  fn from(value: ListImageModelsProvider) -> Self {
    match value {
      ListImageModelsProvider::Artcraft => "artcraft".to_string(),
      ListImageModelsProvider::Fal => "fal".to_string(),
      ListImageModelsProvider::Grok => "grok".to_string(),
      ListImageModelsProvider::Midjourney => "midjourney".to_string(),
      ListImageModelsProvider::Sora => "sora".to_string(),
      ListImageModelsProvider::WorldLabs => "world_labs".to_string(),
      ListImageModelsProvider::Unknown(other) => other,
    }
  }
}

/// Command-specific copy of `ApiClientModelCreator` with an `Unknown` catch-all so newer
/// server variants are preserved rather than dropped.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(into = "String")]
pub enum ListImageModelsModelCreator {
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
  Unknown(String),
}

impl From<ApiClientModelCreator> for ListImageModelsModelCreator {
  fn from(value: ApiClientModelCreator) -> Self {
    match value {
      ApiClientModelCreator::Alibaba => Self::Alibaba,
      ApiClientModelCreator::ArtCraft => Self::ArtCraft,
      ApiClientModelCreator::BlackForestLabs => Self::BlackForestLabs,
      ApiClientModelCreator::Bytedance => Self::Bytedance,
      ApiClientModelCreator::Fal => Self::Fal,
      ApiClientModelCreator::Google => Self::Google,
      ApiClientModelCreator::Grok => Self::Grok,
      ApiClientModelCreator::Hailuo => Self::Hailuo,
      ApiClientModelCreator::Higgsfield => Self::Higgsfield,
      ApiClientModelCreator::Kling => Self::Kling,
      ApiClientModelCreator::Krea => Self::Krea,
      ApiClientModelCreator::Midjourney => Self::Midjourney,
      ApiClientModelCreator::OpenAi => Self::OpenAi,
      ApiClientModelCreator::OpenArt => Self::OpenArt,
      ApiClientModelCreator::Recraft => Self::Recraft,
      ApiClientModelCreator::Replicate => Self::Replicate,
      ApiClientModelCreator::Runway => Self::Runway,
      ApiClientModelCreator::Stability => Self::Stability,
      ApiClientModelCreator::Tencent => Self::Tencent,
      ApiClientModelCreator::TensorArt => Self::TensorArt,
      ApiClientModelCreator::Vidu => Self::Vidu,
      ApiClientModelCreator::WorldLabs => Self::WorldLabs,
      ApiClientModelCreator::Unknown(other) => Self::Unknown(other),
    }
  }
}

impl From<ListImageModelsModelCreator> for String {
  fn from(value: ListImageModelsModelCreator) -> Self {
    match value {
      ListImageModelsModelCreator::Alibaba => "alibaba".to_string(),
      ListImageModelsModelCreator::ArtCraft => "artcraft".to_string(),
      ListImageModelsModelCreator::BlackForestLabs => "black_forest_labs".to_string(),
      ListImageModelsModelCreator::Bytedance => "bytedance".to_string(),
      ListImageModelsModelCreator::Fal => "fal".to_string(),
      ListImageModelsModelCreator::Google => "google".to_string(),
      ListImageModelsModelCreator::Grok => "grok".to_string(),
      ListImageModelsModelCreator::Hailuo => "hailuo".to_string(),
      ListImageModelsModelCreator::Higgsfield => "higgsfield".to_string(),
      ListImageModelsModelCreator::Kling => "kling".to_string(),
      ListImageModelsModelCreator::Krea => "krea".to_string(),
      ListImageModelsModelCreator::Midjourney => "midjourney".to_string(),
      ListImageModelsModelCreator::OpenAi => "open_ai".to_string(),
      ListImageModelsModelCreator::OpenArt => "open_art".to_string(),
      ListImageModelsModelCreator::Recraft => "recraft".to_string(),
      ListImageModelsModelCreator::Replicate => "replicate".to_string(),
      ListImageModelsModelCreator::Runway => "runway".to_string(),
      ListImageModelsModelCreator::Stability => "stability".to_string(),
      ListImageModelsModelCreator::Tencent => "tencent".to_string(),
      ListImageModelsModelCreator::TensorArt => "tensor_art".to_string(),
      ListImageModelsModelCreator::Vidu => "vidu".to_string(),
      ListImageModelsModelCreator::WorldLabs => "world_labs".to_string(),
      ListImageModelsModelCreator::Unknown(other) => other,
    }
  }
}

/// Command-specific copy of `ApiClientImageModel` with an `Unknown` catch-all so newer
/// server variants are preserved rather than dropped.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(into = "String")]
pub enum ListImageModelsImageModel {
  Flux1Dev,
  Flux1Schnell,
  FluxPro11,
  FluxPro11Ultra,
  GptImage1,
  GptImage1p5,
  GptImage2,
  GrokImagineImage,
  GrokImagineImageQuality,
  Midjourney7,
  Midjourney7Niji,
  Midjourney8,
  NanoBanana,
  NanoBanana2,
  NanoBananaPro,
  Seedream4,
  Seedream4p5,
  Seedream5Lite,
  QwenEdit2511Angles,
  Flux2LoraAngles,
  Unknown(String),
}

impl From<ApiClientImageModel> for ListImageModelsImageModel {
  fn from(value: ApiClientImageModel) -> Self {
    match value {
      ApiClientImageModel::Flux1Dev => Self::Flux1Dev,
      ApiClientImageModel::Flux1Schnell => Self::Flux1Schnell,
      ApiClientImageModel::FluxPro11 => Self::FluxPro11,
      ApiClientImageModel::FluxPro11Ultra => Self::FluxPro11Ultra,
      ApiClientImageModel::GptImage1 => Self::GptImage1,
      ApiClientImageModel::GptImage1p5 => Self::GptImage1p5,
      ApiClientImageModel::GptImage2 => Self::GptImage2,
      ApiClientImageModel::GrokImagineImage => Self::GrokImagineImage,
      ApiClientImageModel::GrokImagineImageQuality => Self::GrokImagineImageQuality,
      ApiClientImageModel::Midjourney7 => Self::Midjourney7,
      ApiClientImageModel::Midjourney7Niji => Self::Midjourney7Niji,
      ApiClientImageModel::Midjourney8 => Self::Midjourney8,
      ApiClientImageModel::NanoBanana => Self::NanoBanana,
      ApiClientImageModel::NanoBanana2 => Self::NanoBanana2,
      ApiClientImageModel::NanoBananaPro => Self::NanoBananaPro,
      ApiClientImageModel::Seedream4 => Self::Seedream4,
      ApiClientImageModel::Seedream4p5 => Self::Seedream4p5,
      ApiClientImageModel::Seedream5Lite => Self::Seedream5Lite,
      ApiClientImageModel::QwenEdit2511Angles => Self::QwenEdit2511Angles,
      ApiClientImageModel::Flux2LoraAngles => Self::Flux2LoraAngles,
      ApiClientImageModel::Unknown(other) => Self::Unknown(other),
    }
  }
}

impl From<ListImageModelsImageModel> for String {
  fn from(value: ListImageModelsImageModel) -> Self {
    match value {
      ListImageModelsImageModel::Flux1Dev => "flux_1_dev".to_string(),
      ListImageModelsImageModel::Flux1Schnell => "flux_1_schnell".to_string(),
      ListImageModelsImageModel::FluxPro11 => "flux_pro_1p1".to_string(),
      ListImageModelsImageModel::FluxPro11Ultra => "flux_pro_1p1_ultra".to_string(),
      ListImageModelsImageModel::GptImage1 => "gpt_image_1".to_string(),
      ListImageModelsImageModel::GptImage1p5 => "gpt_image_1p5".to_string(),
      ListImageModelsImageModel::GptImage2 => "gpt_image_2".to_string(),
      ListImageModelsImageModel::GrokImagineImage => "grok_imagine_image".to_string(),
      ListImageModelsImageModel::GrokImagineImageQuality => "grok_imagine_image_q".to_string(),
      ListImageModelsImageModel::Midjourney7 => "midjourney_7".to_string(),
      ListImageModelsImageModel::Midjourney7Niji => "midjourney_7_niji".to_string(),
      ListImageModelsImageModel::Midjourney8 => "midjourney_8".to_string(),
      ListImageModelsImageModel::NanoBanana => "nano_banana".to_string(),
      ListImageModelsImageModel::NanoBanana2 => "nano_banana_2".to_string(),
      ListImageModelsImageModel::NanoBananaPro => "nano_banana_pro".to_string(),
      ListImageModelsImageModel::Seedream4 => "seedream_4".to_string(),
      ListImageModelsImageModel::Seedream4p5 => "seedream_4p5".to_string(),
      ListImageModelsImageModel::Seedream5Lite => "seedream_5_lite".to_string(),
      ListImageModelsImageModel::QwenEdit2511Angles => "qwen_edit_2511_angles".to_string(),
      ListImageModelsImageModel::Flux2LoraAngles => "flux_2_lora_angles".to_string(),
      ListImageModelsImageModel::Unknown(other) => other,
    }
  }
}

/// Command-specific copy of `ApiClientAspectRatio` with an `Unknown` catch-all so newer
/// server variants are preserved rather than dropped.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(into = "String")]
pub enum ListImageModelsAspectRatio {
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
  Unknown(String),
}

impl From<ApiClientAspectRatio> for ListImageModelsAspectRatio {
  fn from(value: ApiClientAspectRatio) -> Self {
    match value {
      ApiClientAspectRatio::Auto => Self::Auto,
      ApiClientAspectRatio::Square => Self::Square,
      ApiClientAspectRatio::WideThreeByTwo => Self::WideThreeByTwo,
      ApiClientAspectRatio::WideFourByThree => Self::WideFourByThree,
      ApiClientAspectRatio::WideFiveByFour => Self::WideFiveByFour,
      ApiClientAspectRatio::WideSixteenByNine => Self::WideSixteenByNine,
      ApiClientAspectRatio::WideTwentyOneByNine => Self::WideTwentyOneByNine,
      ApiClientAspectRatio::TallTwoByThree => Self::TallTwoByThree,
      ApiClientAspectRatio::TallThreeByFour => Self::TallThreeByFour,
      ApiClientAspectRatio::TallFourByFive => Self::TallFourByFive,
      ApiClientAspectRatio::TallNineBySixteen => Self::TallNineBySixteen,
      ApiClientAspectRatio::TallNineByTwentyOne => Self::TallNineByTwentyOne,
      ApiClientAspectRatio::Wide => Self::Wide,
      ApiClientAspectRatio::Tall => Self::Tall,
      ApiClientAspectRatio::Auto2k => Self::Auto2k,
      ApiClientAspectRatio::Auto3k => Self::Auto3k,
      ApiClientAspectRatio::Auto4k => Self::Auto4k,
      ApiClientAspectRatio::SquareHd => Self::SquareHd,
      ApiClientAspectRatio::Unknown(other) => Self::Unknown(other),
    }
  }
}

impl From<ListImageModelsAspectRatio> for String {
  fn from(value: ListImageModelsAspectRatio) -> Self {
    match value {
      ListImageModelsAspectRatio::Auto => "auto".to_string(),
      ListImageModelsAspectRatio::Square => "square".to_string(),
      ListImageModelsAspectRatio::WideThreeByTwo => "wide_three_by_two".to_string(),
      ListImageModelsAspectRatio::WideFourByThree => "wide_four_by_three".to_string(),
      ListImageModelsAspectRatio::WideFiveByFour => "wide_five_by_four".to_string(),
      ListImageModelsAspectRatio::WideSixteenByNine => "wide_sixteen_by_nine".to_string(),
      ListImageModelsAspectRatio::WideTwentyOneByNine => "wide_twenty_one_by_nine".to_string(),
      ListImageModelsAspectRatio::TallTwoByThree => "tall_two_by_three".to_string(),
      ListImageModelsAspectRatio::TallThreeByFour => "tall_three_by_four".to_string(),
      ListImageModelsAspectRatio::TallFourByFive => "tall_four_by_five".to_string(),
      ListImageModelsAspectRatio::TallNineBySixteen => "tall_nine_by_sixteen".to_string(),
      ListImageModelsAspectRatio::TallNineByTwentyOne => "tall_nine_by_twenty_one".to_string(),
      ListImageModelsAspectRatio::Wide => "wide".to_string(),
      ListImageModelsAspectRatio::Tall => "tall".to_string(),
      ListImageModelsAspectRatio::Auto2k => "auto_2k".to_string(),
      ListImageModelsAspectRatio::Auto3k => "auto_3k".to_string(),
      ListImageModelsAspectRatio::Auto4k => "auto_4k".to_string(),
      ListImageModelsAspectRatio::SquareHd => "square_hd".to_string(),
      ListImageModelsAspectRatio::Unknown(other) => other,
    }
  }
}

/// Command-specific copy of `ApiClientResolution` with an `Unknown` catch-all so newer
/// server variants are preserved rather than dropped.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(into = "String")]
pub enum ListImageModelsResolution {
  OneK,
  TwoK,
  ThreeK,
  FourK,
  HalfK,
  FourEightyP,
  SevenTwentyP,
  TenEightyP,
  Unknown(String),
}

impl From<ApiClientResolution> for ListImageModelsResolution {
  fn from(value: ApiClientResolution) -> Self {
    match value {
      ApiClientResolution::OneK => Self::OneK,
      ApiClientResolution::TwoK => Self::TwoK,
      ApiClientResolution::ThreeK => Self::ThreeK,
      ApiClientResolution::FourK => Self::FourK,
      ApiClientResolution::HalfK => Self::HalfK,
      ApiClientResolution::FourEightyP => Self::FourEightyP,
      ApiClientResolution::SevenTwentyP => Self::SevenTwentyP,
      ApiClientResolution::TenEightyP => Self::TenEightyP,
      ApiClientResolution::Unknown(other) => Self::Unknown(other),
    }
  }
}

impl From<ListImageModelsResolution> for String {
  fn from(value: ListImageModelsResolution) -> Self {
    match value {
      ListImageModelsResolution::OneK => "one_k".to_string(),
      ListImageModelsResolution::TwoK => "two_k".to_string(),
      ListImageModelsResolution::ThreeK => "three_k".to_string(),
      ListImageModelsResolution::FourK => "four_k".to_string(),
      ListImageModelsResolution::HalfK => "half_k".to_string(),
      ListImageModelsResolution::FourEightyP => "four_eighty_p".to_string(),
      ListImageModelsResolution::SevenTwentyP => "seven_twenty_p".to_string(),
      ListImageModelsResolution::TenEightyP => "ten_eighty_p".to_string(),
      ListImageModelsResolution::Unknown(other) => other,
    }
  }
}

/// Command-specific copy of `ApiClientQuality` with an `Unknown` catch-all so newer
/// server variants are preserved rather than dropped.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(into = "String")]
pub enum ListImageModelsQuality {
  High,
  Medium,
  Low,
  Unknown(String),
}

impl From<ApiClientQuality> for ListImageModelsQuality {
  fn from(value: ApiClientQuality) -> Self {
    match value {
      ApiClientQuality::High => Self::High,
      ApiClientQuality::Medium => Self::Medium,
      ApiClientQuality::Low => Self::Low,
      ApiClientQuality::Unknown(other) => Self::Unknown(other),
    }
  }
}

impl From<ListImageModelsQuality> for String {
  fn from(value: ListImageModelsQuality) -> Self {
    match value {
      ListImageModelsQuality::High => "high".to_string(),
      ListImageModelsQuality::Medium => "medium".to_string(),
      ListImageModelsQuality::Low => "low".to_string(),
      ListImageModelsQuality::Unknown(other) => other,
    }
  }
}

// ============================ Structs ============================

#[derive(Clone, Debug, Serialize)]
pub struct ListImageModelsResponse {
  pub success: bool,
  pub models: Vec<ListImageModelsModelDetails>,
  pub providers: Vec<ListImageModelsProviderDetails>,
}

impl From<OmniGenImageModelsResponse> for ListImageModelsResponse {
  fn from(v: OmniGenImageModelsResponse) -> Self {
    Self {
      success: v.success,
      models: v.models.into_iter().map(Into::into).collect(),
      providers: v.providers.into_iter().map(Into::into).collect(),
    }
  }
}

#[derive(Clone, Debug, Serialize)]
pub struct ListImageModelsProviderDetails {
  pub provider: ListImageModelsProvider,
  pub models: Vec<ListImageModelsProviderModelDetails>,
}

impl From<OmniGenImageModelProviderDetails> for ListImageModelsProviderDetails {
  fn from(v: OmniGenImageModelProviderDetails) -> Self {
    Self {
      provider: v.provider.into(),
      models: v.models.into_iter().map(Into::into).collect(),
    }
  }
}

#[derive(Clone, Debug, Serialize)]
pub struct ListImageModelsProviderModelDetails {
  pub model: ListImageModelsImageModel,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub overrides: Option<ListImageModelsModelDetails>,
}

impl From<OmniGenImageProviderModelDetails> for ListImageModelsProviderModelDetails {
  fn from(v: OmniGenImageProviderModelDetails) -> Self {
    Self {
      model: v.model.into(),
      overrides: v.overrides.map(Into::into),
    }
  }
}

#[derive(Clone, Debug, Serialize)]
pub struct ListImageModelsModelDetails {
  pub model: ListImageModelsImageModel,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub model_creator: Option<ListImageModelsModelCreator>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub full_name: Option<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub text_prompt_supported: Option<bool>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub text_prompt_max_length: Option<u16>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub negative_text_prompt_supported: Option<bool>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub negative_text_prompt_max_length: Option<u16>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub image_refs_supported: Option<bool>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub image_refs_max: Option<u16>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub has_fixed_editing_aspect_ratio: Option<bool>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio_options: Option<Vec<ListImageModelsAspectRatio>>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio_default: Option<ListImageModelsAspectRatio>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio_default_when_editing: Option<ListImageModelsAspectRatio>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution_options: Option<Vec<ListImageModelsResolution>>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution_default: Option<ListImageModelsResolution>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub quality_options: Option<Vec<ListImageModelsQuality>>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub default_quality: Option<ListImageModelsQuality>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub batch_size_min: Option<u16>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub batch_size_max: Option<u16>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub batch_size_options: Option<Vec<u16>>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub batch_size_default: Option<u16>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub is_disabled: Option<bool>,
}

impl From<OmniGenImageModelDetails> for ListImageModelsModelDetails {
  fn from(v: OmniGenImageModelDetails) -> Self {
    Self {
      model: v.model.into(),
      model_creator: v.model_creator.map(Into::into),
      full_name: v.full_name,
      text_prompt_supported: v.text_prompt_supported,
      text_prompt_max_length: v.text_prompt_max_length,
      negative_text_prompt_supported: v.negative_text_prompt_supported,
      negative_text_prompt_max_length: v.negative_text_prompt_max_length,
      image_refs_supported: v.image_refs_supported,
      image_refs_max: v.image_refs_max,
      has_fixed_editing_aspect_ratio: v.has_fixed_editing_aspect_ratio,
      aspect_ratio_options: v.aspect_ratio_options.map(|items| items.into_iter().map(Into::into).collect()),
      aspect_ratio_default: v.aspect_ratio_default.map(Into::into),
      aspect_ratio_default_when_editing: v.aspect_ratio_default_when_editing.map(Into::into),
      resolution_options: v.resolution_options.map(|items| items.into_iter().map(Into::into).collect()),
      resolution_default: v.resolution_default.map(Into::into),
      quality_options: v.quality_options.map(|items| items.into_iter().map(Into::into).collect()),
      default_quality: v.default_quality.map(Into::into),
      batch_size_min: v.batch_size_min,
      batch_size_max: v.batch_size_max,
      batch_size_options: v.batch_size_options,
      batch_size_default: v.batch_size_default,
      is_disabled: v.is_disabled,
    }
  }
}
