//! Command-specific response types for `list_video_models_command`.
//!
//! These are duplicated (never `artcraft_client` types), and every enum has an
//! `Unknown(String)` catch-all so newer server variants are preserved instead of
//! breaking an older desktop build. `From` impls map the API-client response over.

use serde_derive::Serialize;

use artcraft_client::datatypes::common_enums::generation::api_client_generation_provider::ApiClientGenerationProvider;
use artcraft_client::datatypes::common_enums::generation::api_client_model_creator::ApiClientModelCreator;
use artcraft_client::datatypes::common_enums::generation::api_client_video_model::ApiClientVideoModel;
use artcraft_client::datatypes::common_enums::generation::api_client_aspect_ratio::ApiClientAspectRatio;
use artcraft_client::datatypes::common_enums::generation::api_client_resolution::ApiClientResolution;
use artcraft_client::datatypes::common_enums::generation::api_client_bitrate::ApiClientBitrate;
use artcraft_client::datatypes::common_enums::generation::api_client_quality::ApiClientQuality;
use artcraft_client::endpoints::omni_gen::models::video::omni_gen_list_video_models::{
  OmniGenVideoModelDetails, OmniGenVideoModelProviderDetails, OmniGenVideoProviderModelDetails, OmniGenVideoModelsResponse,
};

use crate::core::commands::response::success_response_wrapper::SerializeMarker;

impl SerializeMarker for ListVideoModelsResponse {}

// ============================ Enums ============================

/// Command-specific copy of `ApiClientGenerationProvider` with an `Unknown` catch-all so newer
/// server variants are preserved rather than dropped.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(into = "String")]
pub enum ListVideoModelsProvider {
  Artcraft,
  Fal,
  Grok,
  Midjourney,
  Sora,
  WorldLabs,
  Higgsfield,
  Krea,
  Leonardo,
  Magnific,
  Openart,
  Picsart,
  Pixverse,
  Runway,
  Unknown(String),
}

impl From<ApiClientGenerationProvider> for ListVideoModelsProvider {
  fn from(value: ApiClientGenerationProvider) -> Self {
    match value {
      ApiClientGenerationProvider::Artcraft => Self::Artcraft,
      ApiClientGenerationProvider::Fal => Self::Fal,
      ApiClientGenerationProvider::Grok => Self::Grok,
      ApiClientGenerationProvider::Midjourney => Self::Midjourney,
      ApiClientGenerationProvider::Sora => Self::Sora,
      ApiClientGenerationProvider::WorldLabs => Self::WorldLabs,
      ApiClientGenerationProvider::Higgsfield => Self::Higgsfield,
      ApiClientGenerationProvider::Krea => Self::Krea,
      ApiClientGenerationProvider::Leonardo => Self::Leonardo,
      ApiClientGenerationProvider::Magnific => Self::Magnific,
      ApiClientGenerationProvider::Openart => Self::Openart,
      ApiClientGenerationProvider::Picsart => Self::Picsart,
      ApiClientGenerationProvider::Pixverse => Self::Pixverse,
      ApiClientGenerationProvider::Runway => Self::Runway,
      ApiClientGenerationProvider::Unknown(other) => Self::Unknown(other),
    }
  }
}

impl From<ListVideoModelsProvider> for String {
  fn from(value: ListVideoModelsProvider) -> Self {
    match value {
      ListVideoModelsProvider::Artcraft => "artcraft".to_string(),
      ListVideoModelsProvider::Fal => "fal".to_string(),
      ListVideoModelsProvider::Grok => "grok".to_string(),
      ListVideoModelsProvider::Midjourney => "midjourney".to_string(),
      ListVideoModelsProvider::Sora => "sora".to_string(),
      ListVideoModelsProvider::WorldLabs => "world_labs".to_string(),
      ListVideoModelsProvider::Higgsfield => "higgsfield".to_string(),
      ListVideoModelsProvider::Krea => "krea".to_string(),
      ListVideoModelsProvider::Leonardo => "leonardo".to_string(),
      ListVideoModelsProvider::Magnific => "magnific".to_string(),
      ListVideoModelsProvider::Openart => "openart".to_string(),
      ListVideoModelsProvider::Picsart => "picsart".to_string(),
      ListVideoModelsProvider::Pixverse => "pixverse".to_string(),
      ListVideoModelsProvider::Runway => "runway".to_string(),
      ListVideoModelsProvider::Unknown(other) => other,
    }
  }
}

/// Command-specific copy of `ApiClientModelCreator` with an `Unknown` catch-all so newer
/// server variants are preserved rather than dropped.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(into = "String")]
pub enum ListVideoModelsModelCreator {
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

impl From<ApiClientModelCreator> for ListVideoModelsModelCreator {
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

impl From<ListVideoModelsModelCreator> for String {
  fn from(value: ListVideoModelsModelCreator) -> Self {
    match value {
      ListVideoModelsModelCreator::Alibaba => "alibaba".to_string(),
      ListVideoModelsModelCreator::ArtCraft => "artcraft".to_string(),
      ListVideoModelsModelCreator::BlackForestLabs => "black_forest_labs".to_string(),
      ListVideoModelsModelCreator::Bytedance => "bytedance".to_string(),
      ListVideoModelsModelCreator::Fal => "fal".to_string(),
      ListVideoModelsModelCreator::Google => "google".to_string(),
      ListVideoModelsModelCreator::Grok => "grok".to_string(),
      ListVideoModelsModelCreator::Hailuo => "hailuo".to_string(),
      ListVideoModelsModelCreator::Higgsfield => "higgsfield".to_string(),
      ListVideoModelsModelCreator::Kling => "kling".to_string(),
      ListVideoModelsModelCreator::Krea => "krea".to_string(),
      ListVideoModelsModelCreator::Midjourney => "midjourney".to_string(),
      ListVideoModelsModelCreator::OpenAi => "open_ai".to_string(),
      ListVideoModelsModelCreator::OpenArt => "open_art".to_string(),
      ListVideoModelsModelCreator::Recraft => "recraft".to_string(),
      ListVideoModelsModelCreator::Replicate => "replicate".to_string(),
      ListVideoModelsModelCreator::Runway => "runway".to_string(),
      ListVideoModelsModelCreator::Stability => "stability".to_string(),
      ListVideoModelsModelCreator::Tencent => "tencent".to_string(),
      ListVideoModelsModelCreator::TensorArt => "tensor_art".to_string(),
      ListVideoModelsModelCreator::Vidu => "vidu".to_string(),
      ListVideoModelsModelCreator::WorldLabs => "world_labs".to_string(),
      ListVideoModelsModelCreator::Unknown(other) => other,
    }
  }
}

/// Command-specific copy of `ApiClientVideoModel` with an `Unknown` catch-all so newer
/// server variants are preserved rather than dropped.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(into = "String")]
pub enum ListVideoModelsVideoModel {
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
  Unknown(String),
}

impl From<ApiClientVideoModel> for ListVideoModelsVideoModel {
  fn from(value: ApiClientVideoModel) -> Self {
    match value {
      ApiClientVideoModel::GrokVideo => Self::GrokVideo,
      ApiClientVideoModel::GrokImagineVideo => Self::GrokImagineVideo,
      ApiClientVideoModel::GrokImagineVideo1p5 => Self::GrokImagineVideo1p5,
      ApiClientVideoModel::Kling16Pro => Self::Kling16Pro,
      ApiClientVideoModel::Kling21Pro => Self::Kling21Pro,
      ApiClientVideoModel::Kling21Master => Self::Kling21Master,
      ApiClientVideoModel::Kling2p5TurboPro => Self::Kling2p5TurboPro,
      ApiClientVideoModel::Kling2p6Pro => Self::Kling2p6Pro,
      ApiClientVideoModel::Kling3p0Standard => Self::Kling3p0Standard,
      ApiClientVideoModel::Kling3p0Pro => Self::Kling3p0Pro,
      ApiClientVideoModel::HappyHorse1p0 => Self::HappyHorse1p0,
      ApiClientVideoModel::Seedance10Lite => Self::Seedance10Lite,
      ApiClientVideoModel::Seedance1p5Pro => Self::Seedance1p5Pro,
      ApiClientVideoModel::Seedance2p0 => Self::Seedance2p0,
      ApiClientVideoModel::Seedance2p0Fast => Self::Seedance2p0Fast,
      ApiClientVideoModel::Seedance2p0BytePlus => Self::Seedance2p0BytePlus,
      ApiClientVideoModel::Seedance2p0BytePlusFast => Self::Seedance2p0BytePlusFast,
      ApiClientVideoModel::Seedance2p0BytePlusUltra => Self::Seedance2p0BytePlusUltra,
      ApiClientVideoModel::Seedance2p0BytePlusUltraFast => Self::Seedance2p0BytePlusUltraFast,
      ApiClientVideoModel::Seedance2p0Mini => Self::Seedance2p0Mini,
      ApiClientVideoModel::Seedance2p0BytePlusMini => Self::Seedance2p0BytePlusMini,
      ApiClientVideoModel::Seedance2p0BytePlusUltraMini => Self::Seedance2p0BytePlusUltraMini,
      ApiClientVideoModel::Sora2 => Self::Sora2,
      ApiClientVideoModel::Sora2Pro => Self::Sora2Pro,
      ApiClientVideoModel::Veo2 => Self::Veo2,
      ApiClientVideoModel::Veo3 => Self::Veo3,
      ApiClientVideoModel::Veo3Fast => Self::Veo3Fast,
      ApiClientVideoModel::Veo3p1 => Self::Veo3p1,
      ApiClientVideoModel::Veo3p1Fast => Self::Veo3p1Fast,
      ApiClientVideoModel::PreviewModel => Self::PreviewModel,
      ApiClientVideoModel::PreviewModelFast => Self::PreviewModelFast,
      ApiClientVideoModel::Unknown(other) => Self::Unknown(other),
    }
  }
}

impl From<ListVideoModelsVideoModel> for String {
  fn from(value: ListVideoModelsVideoModel) -> Self {
    match value {
      ListVideoModelsVideoModel::GrokVideo => "grok_video".to_string(),
      ListVideoModelsVideoModel::GrokImagineVideo => "grok_imagine_video".to_string(),
      ListVideoModelsVideoModel::GrokImagineVideo1p5 => "grok_imagine_video_1p5".to_string(),
      ListVideoModelsVideoModel::Kling16Pro => "kling_1p6_pro".to_string(),
      ListVideoModelsVideoModel::Kling21Pro => "kling_2p1_pro".to_string(),
      ListVideoModelsVideoModel::Kling21Master => "kling_2p1_master".to_string(),
      ListVideoModelsVideoModel::Kling2p5TurboPro => "kling_2p5_turbo_pro".to_string(),
      ListVideoModelsVideoModel::Kling2p6Pro => "kling_2p6_pro".to_string(),
      ListVideoModelsVideoModel::Kling3p0Standard => "kling_3p0_standard".to_string(),
      ListVideoModelsVideoModel::Kling3p0Pro => "kling_3p0_pro".to_string(),
      ListVideoModelsVideoModel::HappyHorse1p0 => "happy_horse_1p0".to_string(),
      ListVideoModelsVideoModel::Seedance10Lite => "seedance_1p0_lite".to_string(),
      ListVideoModelsVideoModel::Seedance1p5Pro => "seedance_1p5_pro".to_string(),
      ListVideoModelsVideoModel::Seedance2p0 => "seedance_2p0".to_string(),
      ListVideoModelsVideoModel::Seedance2p0Fast => "seedance_2p0_fast".to_string(),
      ListVideoModelsVideoModel::Seedance2p0BytePlus => "seedance_2p0_bp".to_string(),
      ListVideoModelsVideoModel::Seedance2p0BytePlusFast => "seedance_2p0_bp_fast".to_string(),
      ListVideoModelsVideoModel::Seedance2p0BytePlusUltra => "seedance_2p0_bpu".to_string(),
      ListVideoModelsVideoModel::Seedance2p0BytePlusUltraFast => "seedance_2p0_bpu_fast".to_string(),
      ListVideoModelsVideoModel::Seedance2p0Mini => "seedance_2p0_mini".to_string(),
      ListVideoModelsVideoModel::Seedance2p0BytePlusMini => "seedance_2p0_bp_mini".to_string(),
      ListVideoModelsVideoModel::Seedance2p0BytePlusUltraMini => "seedance_2p0_bpu_mini".to_string(),
      ListVideoModelsVideoModel::Sora2 => "sora_2".to_string(),
      ListVideoModelsVideoModel::Sora2Pro => "sora_2_pro".to_string(),
      ListVideoModelsVideoModel::Veo2 => "veo_2".to_string(),
      ListVideoModelsVideoModel::Veo3 => "veo_3".to_string(),
      ListVideoModelsVideoModel::Veo3Fast => "veo_3_fast".to_string(),
      ListVideoModelsVideoModel::Veo3p1 => "veo_3p1".to_string(),
      ListVideoModelsVideoModel::Veo3p1Fast => "veo_3p1_fast".to_string(),
      ListVideoModelsVideoModel::PreviewModel => "preview_model".to_string(),
      ListVideoModelsVideoModel::PreviewModelFast => "preview_model_fast".to_string(),
      ListVideoModelsVideoModel::Unknown(other) => other,
    }
  }
}

/// Command-specific copy of `ApiClientAspectRatio` with an `Unknown` catch-all so newer
/// server variants are preserved rather than dropped.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(into = "String")]
pub enum ListVideoModelsAspectRatio {
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

impl From<ApiClientAspectRatio> for ListVideoModelsAspectRatio {
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

impl From<ListVideoModelsAspectRatio> for String {
  fn from(value: ListVideoModelsAspectRatio) -> Self {
    match value {
      ListVideoModelsAspectRatio::Auto => "auto".to_string(),
      ListVideoModelsAspectRatio::Square => "square".to_string(),
      ListVideoModelsAspectRatio::WideThreeByTwo => "wide_three_by_two".to_string(),
      ListVideoModelsAspectRatio::WideFourByThree => "wide_four_by_three".to_string(),
      ListVideoModelsAspectRatio::WideFiveByFour => "wide_five_by_four".to_string(),
      ListVideoModelsAspectRatio::WideSixteenByNine => "wide_sixteen_by_nine".to_string(),
      ListVideoModelsAspectRatio::WideTwentyOneByNine => "wide_twenty_one_by_nine".to_string(),
      ListVideoModelsAspectRatio::TallTwoByThree => "tall_two_by_three".to_string(),
      ListVideoModelsAspectRatio::TallThreeByFour => "tall_three_by_four".to_string(),
      ListVideoModelsAspectRatio::TallFourByFive => "tall_four_by_five".to_string(),
      ListVideoModelsAspectRatio::TallNineBySixteen => "tall_nine_by_sixteen".to_string(),
      ListVideoModelsAspectRatio::TallNineByTwentyOne => "tall_nine_by_twenty_one".to_string(),
      ListVideoModelsAspectRatio::Wide => "wide".to_string(),
      ListVideoModelsAspectRatio::Tall => "tall".to_string(),
      ListVideoModelsAspectRatio::Auto2k => "auto_2k".to_string(),
      ListVideoModelsAspectRatio::Auto3k => "auto_3k".to_string(),
      ListVideoModelsAspectRatio::Auto4k => "auto_4k".to_string(),
      ListVideoModelsAspectRatio::SquareHd => "square_hd".to_string(),
      ListVideoModelsAspectRatio::Unknown(other) => other,
    }
  }
}

/// Command-specific copy of `ApiClientResolution` with an `Unknown` catch-all so newer
/// server variants are preserved rather than dropped.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(into = "String")]
pub enum ListVideoModelsResolution {
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

impl From<ApiClientResolution> for ListVideoModelsResolution {
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

impl From<ListVideoModelsResolution> for String {
  fn from(value: ListVideoModelsResolution) -> Self {
    match value {
      ListVideoModelsResolution::OneK => "one_k".to_string(),
      ListVideoModelsResolution::TwoK => "two_k".to_string(),
      ListVideoModelsResolution::ThreeK => "three_k".to_string(),
      ListVideoModelsResolution::FourK => "four_k".to_string(),
      ListVideoModelsResolution::HalfK => "half_k".to_string(),
      ListVideoModelsResolution::FourEightyP => "four_eighty_p".to_string(),
      ListVideoModelsResolution::SevenTwentyP => "seven_twenty_p".to_string(),
      ListVideoModelsResolution::TenEightyP => "ten_eighty_p".to_string(),
      ListVideoModelsResolution::Unknown(other) => other,
    }
  }
}

/// Command-specific copy of `ApiClientBitrate` with an `Unknown` catch-all so newer
/// server variants are preserved rather than dropped.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(into = "String")]
pub enum ListVideoModelsBitrate {
  Normal,
  High,
  Unknown(String),
}

impl From<ApiClientBitrate> for ListVideoModelsBitrate {
  fn from(value: ApiClientBitrate) -> Self {
    match value {
      ApiClientBitrate::Normal => Self::Normal,
      ApiClientBitrate::High => Self::High,
      ApiClientBitrate::Unknown(other) => Self::Unknown(other),
    }
  }
}

impl From<ListVideoModelsBitrate> for String {
  fn from(value: ListVideoModelsBitrate) -> Self {
    match value {
      ListVideoModelsBitrate::Normal => "normal".to_string(),
      ListVideoModelsBitrate::High => "high".to_string(),
      ListVideoModelsBitrate::Unknown(other) => other,
    }
  }
}

/// Command-specific copy of `ApiClientQuality` with an `Unknown` catch-all so newer
/// server variants are preserved rather than dropped.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(into = "String")]
pub enum ListVideoModelsQuality {
  High,
  Medium,
  Low,
  Unknown(String),
}

impl From<ApiClientQuality> for ListVideoModelsQuality {
  fn from(value: ApiClientQuality) -> Self {
    match value {
      ApiClientQuality::High => Self::High,
      ApiClientQuality::Medium => Self::Medium,
      ApiClientQuality::Low => Self::Low,
      ApiClientQuality::Unknown(other) => Self::Unknown(other),
    }
  }
}

impl From<ListVideoModelsQuality> for String {
  fn from(value: ListVideoModelsQuality) -> Self {
    match value {
      ListVideoModelsQuality::High => "high".to_string(),
      ListVideoModelsQuality::Medium => "medium".to_string(),
      ListVideoModelsQuality::Low => "low".to_string(),
      ListVideoModelsQuality::Unknown(other) => other,
    }
  }
}

// ============================ Structs ============================

#[derive(Clone, Debug, Serialize)]
pub struct ListVideoModelsResponse {
  pub success: bool,
  pub models: Vec<ListVideoModelsModelDetails>,
  pub providers: Vec<ListVideoModelsProviderDetails>,
}

impl From<OmniGenVideoModelsResponse> for ListVideoModelsResponse {
  fn from(v: OmniGenVideoModelsResponse) -> Self {
    Self {
      success: v.success,
      models: v.models.into_iter().map(Into::into).collect(),
      providers: v.providers.into_iter().map(Into::into).collect(),
    }
  }
}

#[derive(Clone, Debug, Serialize)]
pub struct ListVideoModelsProviderDetails {
  pub provider: ListVideoModelsProvider,
  pub models: Vec<ListVideoModelsProviderModelDetails>,
}

impl From<OmniGenVideoModelProviderDetails> for ListVideoModelsProviderDetails {
  fn from(v: OmniGenVideoModelProviderDetails) -> Self {
    Self {
      provider: v.provider.into(),
      models: v.models.into_iter().map(Into::into).collect(),
    }
  }
}

#[derive(Clone, Debug, Serialize)]
pub struct ListVideoModelsProviderModelDetails {
  pub model: ListVideoModelsVideoModel,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub overrides: Option<ListVideoModelsModelDetails>,
}

impl From<OmniGenVideoProviderModelDetails> for ListVideoModelsProviderModelDetails {
  fn from(v: OmniGenVideoProviderModelDetails) -> Self {
    Self {
      model: v.model.into(),
      overrides: v.overrides.map(Into::into),
    }
  }
}

#[derive(Clone, Debug, Serialize)]
pub struct ListVideoModelsModelDetails {
  pub model: ListVideoModelsVideoModel,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub model_creator: Option<ListVideoModelsModelCreator>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub full_name: Option<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub extra_info: Option<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub extra_info_short: Option<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub text_to_video_supported: Option<bool>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub text_prompt_supported: Option<bool>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub text_prompt_max_length: Option<u16>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub negative_text_prompt_supported: Option<bool>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub negative_text_prompt_max_length: Option<u16>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub starting_keyframe_supported: Option<bool>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub starting_keyframe_required: Option<bool>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub ending_keyframe_supported: Option<bool>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub image_references_supported: Option<bool>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub image_references_max: Option<u16>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub video_references_supported: Option<bool>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub video_references_max: Option<u16>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub video_references_max_total_duration_seconds: Option<u16>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub audio_references_supported: Option<bool>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub audio_references_max: Option<u16>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub audio_references_max_total_duration_seconds: Option<u16>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub character_references_supported: Option<bool>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub character_references_max: Option<u16>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub show_generate_with_sound_toggle: Option<bool>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio_options: Option<Vec<ListVideoModelsAspectRatio>>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub aspect_ratio_default: Option<ListVideoModelsAspectRatio>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution_options: Option<Vec<ListVideoModelsResolution>>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution_default: Option<ListVideoModelsResolution>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub bitrate_options: Option<Vec<ListVideoModelsBitrate>>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub bitrate_default: Option<ListVideoModelsBitrate>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub quality_options: Option<Vec<ListVideoModelsQuality>>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub default_quality: Option<ListVideoModelsQuality>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration_seconds_min: Option<u16>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration_seconds_max: Option<u16>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration_seconds_max_with_image_references: Option<u16>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration_seconds_options: Option<Vec<u16>>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration_seconds_default: Option<u16>,
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

impl From<OmniGenVideoModelDetails> for ListVideoModelsModelDetails {
  fn from(v: OmniGenVideoModelDetails) -> Self {
    Self {
      model: v.model.into(),
      model_creator: v.model_creator.map(Into::into),
      full_name: v.full_name,
      extra_info: v.extra_info,
      extra_info_short: v.extra_info_short,
      text_to_video_supported: v.text_to_video_supported,
      text_prompt_supported: v.text_prompt_supported,
      text_prompt_max_length: v.text_prompt_max_length,
      negative_text_prompt_supported: v.negative_text_prompt_supported,
      negative_text_prompt_max_length: v.negative_text_prompt_max_length,
      starting_keyframe_supported: v.starting_keyframe_supported,
      starting_keyframe_required: v.starting_keyframe_required,
      ending_keyframe_supported: v.ending_keyframe_supported,
      image_references_supported: v.image_references_supported,
      image_references_max: v.image_references_max,
      video_references_supported: v.video_references_supported,
      video_references_max: v.video_references_max,
      video_references_max_total_duration_seconds: v.video_references_max_total_duration_seconds,
      audio_references_supported: v.audio_references_supported,
      audio_references_max: v.audio_references_max,
      audio_references_max_total_duration_seconds: v.audio_references_max_total_duration_seconds,
      character_references_supported: v.character_references_supported,
      character_references_max: v.character_references_max,
      show_generate_with_sound_toggle: v.show_generate_with_sound_toggle,
      aspect_ratio_options: v.aspect_ratio_options.map(|items| items.into_iter().map(Into::into).collect()),
      aspect_ratio_default: v.aspect_ratio_default.map(Into::into),
      resolution_options: v.resolution_options.map(|items| items.into_iter().map(Into::into).collect()),
      resolution_default: v.resolution_default.map(Into::into),
      bitrate_options: v.bitrate_options.map(|items| items.into_iter().map(Into::into).collect()),
      bitrate_default: v.bitrate_default.map(Into::into),
      quality_options: v.quality_options.map(|items| items.into_iter().map(Into::into).collect()),
      default_quality: v.default_quality.map(Into::into),
      duration_seconds_min: v.duration_seconds_min,
      duration_seconds_max: v.duration_seconds_max,
      duration_seconds_max_with_image_references: v.duration_seconds_max_with_image_references,
      duration_seconds_options: v.duration_seconds_options,
      duration_seconds_default: v.duration_seconds_default,
      batch_size_min: v.batch_size_min,
      batch_size_max: v.batch_size_max,
      batch_size_options: v.batch_size_options,
      batch_size_default: v.batch_size_default,
      is_disabled: v.is_disabled,
    }
  }
}
