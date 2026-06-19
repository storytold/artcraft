use std::collections::BTreeSet;

use serde::Deserialize;
use serde::Serialize;
#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `uploaded_video_notes` table in a `VARCHAR(32)` field.
///
/// The model the note's submitter claims the video is. The variant set mirrors
/// [`crate::common::generation::common_video_model::CommonVideoModel`].
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema)]
pub enum UploadedVideoNoteReportedModelType {
  #[serde(rename = "grok_video")]
  GrokVideo,
  #[serde(rename = "grok_imagine_video")]
  GrokImagineVideo,
  #[serde(rename = "grok_imagine_video_1p5")]
  GrokImagineVideo1p5,
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
  #[serde(rename = "seedance_1p5_pro")]
  Seedance1p5Pro,
  // `preview_model` is a retired alias that collapses onto Seedance 2.0.
  #[serde(rename = "seedance_2p0", alias = "preview_model")]
  Seedance2p0,
  // `preview_model_fast` is a retired alias that collapses onto Seedance 2.0 Fast.
  #[serde(rename = "seedance_2p0_fast", alias = "preview_model_fast")]
  Seedance2p0Fast,
  #[serde(rename = "seedance_2p0_bp")]
  Seedance2p0BytePlus,
  #[serde(rename = "seedance_2p0_bp_fast")]
  Seedance2p0BytePlusFast,
  #[serde(rename = "seedance_2p0_u")]
  Seedance2p0Ultra,
  #[serde(rename = "seedance_2p0_u_fast")]
  Seedance2p0UltraFast,
  #[serde(rename = "seedance_2p0_bpu")]
  Seedance2p0BytePlusUltra,
  #[serde(rename = "seedance_2p0_bpu_fast")]
  Seedance2p0BytePlusUltraFast,
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

impl_enum_display_and_debug_using_to_str!(UploadedVideoNoteReportedModelType);
impl_mysql_enum_coders!(UploadedVideoNoteReportedModelType);
impl_mysql_from_row!(UploadedVideoNoteReportedModelType);

impl UploadedVideoNoteReportedModelType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::GrokVideo => "grok_video",
      Self::GrokImagineVideo => "grok_imagine_video",
      Self::GrokImagineVideo1p5 => "grok_imagine_video_1p5",
      Self::Kling16Pro => "kling_1p6_pro",
      Self::Kling21Pro => "kling_2p1_pro",
      Self::Kling21Master => "kling_2p1_master",
      Self::Kling2p5TurboPro => "kling_2p5_turbo_pro",
      Self::Kling2p6Pro => "kling_2p6_pro",
      Self::Kling3p0Standard => "kling_3p0_standard",
      Self::Kling3p0Pro => "kling_3p0_pro",
      Self::HappyHorse1p0 => "happy_horse_1p0",
      Self::Seedance10Lite => "seedance_1p0_lite",
      Self::Seedance1p5Pro => "seedance_1p5_pro",
      Self::Seedance2p0 => "seedance_2p0",
      Self::Seedance2p0Fast => "seedance_2p0_fast",
      Self::Seedance2p0BytePlus => "seedance_2p0_bp",
      Self::Seedance2p0BytePlusFast => "seedance_2p0_bp_fast",
      Self::Seedance2p0Ultra => "seedance_2p0_u",
      Self::Seedance2p0UltraFast => "seedance_2p0_u_fast",
      Self::Seedance2p0BytePlusUltra => "seedance_2p0_bpu",
      Self::Seedance2p0BytePlusUltraFast => "seedance_2p0_bpu_fast",
      Self::Sora2 => "sora_2",
      Self::Sora2Pro => "sora_2_pro",
      Self::Veo2 => "veo_2",
      Self::Veo3 => "veo_3",
      Self::Veo3Fast => "veo_3_fast",
      Self::Veo3p1 => "veo_3p1",
      Self::Veo3p1Fast => "veo_3p1_fast",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "grok_video" => Ok(Self::GrokVideo),
      "grok_imagine_video" => Ok(Self::GrokImagineVideo),
      "grok_imagine_video_1p5" => Ok(Self::GrokImagineVideo1p5),
      "kling_1p6_pro" => Ok(Self::Kling16Pro),
      "kling_2p1_pro" => Ok(Self::Kling21Pro),
      "kling_2p1_master" => Ok(Self::Kling21Master),
      "kling_2p5_turbo_pro" => Ok(Self::Kling2p5TurboPro),
      "kling_2p6_pro" => Ok(Self::Kling2p6Pro),
      "kling_3p0_standard" => Ok(Self::Kling3p0Standard),
      "kling_3p0_pro" => Ok(Self::Kling3p0Pro),
      "happy_horse_1p0" => Ok(Self::HappyHorse1p0),
      "seedance_1p0_lite" => Ok(Self::Seedance10Lite),
      "seedance_1p5_pro" => Ok(Self::Seedance1p5Pro),
      "seedance_2p0" => Ok(Self::Seedance2p0),
      "seedance_2p0_fast" => Ok(Self::Seedance2p0Fast),
      "seedance_2p0_bp" => Ok(Self::Seedance2p0BytePlus),
      "seedance_2p0_bp_fast" => Ok(Self::Seedance2p0BytePlusFast),
      "seedance_2p0_u" => Ok(Self::Seedance2p0Ultra),
      "seedance_2p0_u_fast" => Ok(Self::Seedance2p0UltraFast),
      "seedance_2p0_bpu" => Ok(Self::Seedance2p0BytePlusUltra),
      "seedance_2p0_bpu_fast" => Ok(Self::Seedance2p0BytePlusUltraFast),
      "sora_2" => Ok(Self::Sora2),
      "sora_2_pro" => Ok(Self::Sora2Pro),
      "veo_2" => Ok(Self::Veo2),
      "veo_3" => Ok(Self::Veo3),
      "veo_3_fast" => Ok(Self::Veo3Fast),
      "veo_3p1" => Ok(Self::Veo3p1),
      "veo_3p1_fast" => Ok(Self::Veo3p1Fast),
      // Retired values: collapse onto the Seedance 2.0 equivalents.
      "preview_model" => Ok(Self::Seedance2p0),
      "preview_model_fast" => Ok(Self::Seedance2p0Fast),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    BTreeSet::from([
      Self::GrokVideo,
      Self::GrokImagineVideo,
      Self::GrokImagineVideo1p5,
      Self::Kling16Pro,
      Self::Kling21Pro,
      Self::Kling21Master,
      Self::Kling2p5TurboPro,
      Self::Kling2p6Pro,
      Self::Kling3p0Standard,
      Self::Kling3p0Pro,
      Self::HappyHorse1p0,
      Self::Seedance10Lite,
      Self::Seedance1p5Pro,
      Self::Seedance2p0,
      Self::Seedance2p0Fast,
      Self::Seedance2p0BytePlus,
      Self::Seedance2p0BytePlusFast,
      Self::Seedance2p0Ultra,
      Self::Seedance2p0UltraFast,
      Self::Seedance2p0BytePlusUltra,
      Self::Seedance2p0BytePlusUltraFast,
      Self::Sora2,
      Self::Sora2Pro,
      Self::Veo2,
      Self::Veo3,
      Self::Veo3Fast,
      Self::Veo3p1,
      Self::Veo3p1Fast,
    ])
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn round_trip() {
    for variant in UploadedVideoNoteReportedModelType::all_variants() {
      assert_eq!(variant, UploadedVideoNoteReportedModelType::from_str(variant.to_str()).unwrap());
      assert_eq!(variant, UploadedVideoNoteReportedModelType::from_str(&format!("{}", variant)).unwrap());
      assert_eq!(variant, UploadedVideoNoteReportedModelType::from_str(&format!("{:?}", variant)).unwrap());
    }
    assert!(UploadedVideoNoteReportedModelType::from_str("foo").is_err());
  }

  #[test]
  fn serde_round_trip() {
    for variant in UploadedVideoNoteReportedModelType::all_variants() {
      let json = serde_json::to_string(&variant).unwrap();
      let deserialized: UploadedVideoNoteReportedModelType = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, deserialized);
    }
  }

  /// The MySQL string (to_str) and the JSON string (serde) must stay aligned.
  #[test]
  fn to_str_matches_serde() {
    for variant in UploadedVideoNoteReportedModelType::all_variants() {
      let json = serde_json::to_string(&variant).unwrap();
      assert_eq!(json, format!("\"{}\"", variant.to_str()));
    }
  }

  #[test]
  fn variant_count() {
    use strum::IntoEnumIterator;
    assert_eq!(UploadedVideoNoteReportedModelType::all_variants().len(), UploadedVideoNoteReportedModelType::iter().len());
    assert_eq!(UploadedVideoNoteReportedModelType::COUNT, 28);
  }

  /// Retired `preview_model*` values must still decode, collapsing onto Seedance 2.0.
  #[test]
  fn legacy_preview_values_map_to_seedance() {
    assert_eq!(
      UploadedVideoNoteReportedModelType::from_str("preview_model").unwrap(),
      UploadedVideoNoteReportedModelType::Seedance2p0
    );
    assert_eq!(
      UploadedVideoNoteReportedModelType::from_str("preview_model_fast").unwrap(),
      UploadedVideoNoteReportedModelType::Seedance2p0Fast
    );
    let decoded: UploadedVideoNoteReportedModelType =
      serde_json::from_str("\"preview_model\"").unwrap();
    assert_eq!(decoded, UploadedVideoNoteReportedModelType::Seedance2p0);
  }

  #[test]
  fn serialized_length_ok_for_database() {
    const MAX_LENGTH: usize = 32;
    for variant in UploadedVideoNoteReportedModelType::all_variants() {
      let serialized = variant.to_str();
      assert!(!serialized.is_empty(), "variant {:?} is too short", variant);
      assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
    }
  }
}
