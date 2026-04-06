use utoipa::ToSchema;

/// Video models available for generation.
/// Mirrors artcraft_router::api::common_video_model::CommonVideoModel.
#[derive(Copy, Clone, Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum CommonVideoModel {
  #[serde(rename = "grok_video")]
  GrokVideo,

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

  #[serde(rename = "seedance_1p0_lite")]
  Seedance10Lite,

  #[serde(rename = "seedance_1p5_pro")]
  Seedance1p5Pro,

  #[serde(rename = "seedance_2p0")]
  Seedance2p0,

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
}

impl CommonVideoModel {
  pub fn to_common_model_type(&self) -> crate::common::generation::common_model_type::CommonModelType {
    use crate::common::generation::common_model_type::CommonModelType;
    match self {
      Self::GrokVideo => CommonModelType::GrokVideo,
      Self::Kling16Pro => CommonModelType::Kling16Pro,
      Self::Kling21Pro => CommonModelType::Kling21Pro,
      Self::Kling21Master => CommonModelType::Kling21Master,
      Self::Kling2p5TurboPro => CommonModelType::Kling2p5TurboPro,
      Self::Kling2p6Pro => CommonModelType::Kling2p6Pro,
      Self::Kling3p0Standard => CommonModelType::Kling3p0Standard,
      Self::Kling3p0Pro => CommonModelType::Kling3p0Pro,
      Self::Seedance10Lite => CommonModelType::Seedance10Lite,
      Self::Seedance1p5Pro => CommonModelType::Seedance1p5Pro,
      Self::Seedance2p0 => CommonModelType::Seedance2p0,
      Self::Sora2 => CommonModelType::Sora2,
      Self::Sora2Pro => CommonModelType::Sora2Pro,
      Self::Veo2 => CommonModelType::Veo2,
      Self::Veo3 => CommonModelType::Veo3,
      Self::Veo3Fast => CommonModelType::Veo3Fast,
      Self::Veo3p1 => CommonModelType::Veo3p1,
      Self::Veo3p1Fast => CommonModelType::Veo3p1Fast,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::common::generation::common_model_type::CommonModelType;

  #[test]
  fn all_video_models_convert_to_common_model_type() {
    let models = [
      (CommonVideoModel::GrokVideo, CommonModelType::GrokVideo),
      (CommonVideoModel::Kling16Pro, CommonModelType::Kling16Pro),
      (CommonVideoModel::Kling21Pro, CommonModelType::Kling21Pro),
      (CommonVideoModel::Kling21Master, CommonModelType::Kling21Master),
      (CommonVideoModel::Kling2p5TurboPro, CommonModelType::Kling2p5TurboPro),
      (CommonVideoModel::Kling2p6Pro, CommonModelType::Kling2p6Pro),
      (CommonVideoModel::Kling3p0Standard, CommonModelType::Kling3p0Standard),
      (CommonVideoModel::Kling3p0Pro, CommonModelType::Kling3p0Pro),
      (CommonVideoModel::Seedance10Lite, CommonModelType::Seedance10Lite),
      (CommonVideoModel::Seedance1p5Pro, CommonModelType::Seedance1p5Pro),
      (CommonVideoModel::Seedance2p0, CommonModelType::Seedance2p0),
      (CommonVideoModel::Sora2, CommonModelType::Sora2),
      (CommonVideoModel::Sora2Pro, CommonModelType::Sora2Pro),
      (CommonVideoModel::Veo2, CommonModelType::Veo2),
      (CommonVideoModel::Veo3, CommonModelType::Veo3),
      (CommonVideoModel::Veo3Fast, CommonModelType::Veo3Fast),
      (CommonVideoModel::Veo3p1, CommonModelType::Veo3p1),
      (CommonVideoModel::Veo3p1Fast, CommonModelType::Veo3p1Fast),
    ];
    for (video_model, expected) in models {
      assert_eq!(video_model.to_common_model_type(), expected);
    }
  }
}
