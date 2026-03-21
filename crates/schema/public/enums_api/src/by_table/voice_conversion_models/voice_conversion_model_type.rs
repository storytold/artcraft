use std::collections::BTreeSet;

use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `voice_conversion_models` table in `VARCHAR(32)` field `model_type`.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema, EnumIter, Debug)]
pub enum VoiceConversionModelType {
  // We're skipping RVC "v1" models as "v2" are much higher quality.
  // Future incompatible upgrades may deserve a different enum variant.
  #[serde(rename = "rvc_v2")]
  RvcV2,

  #[serde(rename = "soft_vc")]
  SoftVc,

  #[serde(rename = "so_vits_svc")]
  SoVitsSvc,
}

/// NB: Legacy API for older code.
impl VoiceConversionModelType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::RvcV2 => "rvc_v2",
      Self::SoftVc => "soft_vc",
      Self::SoVitsSvc => "so_vits_svc",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "rvc_v2" => Ok(Self::RvcV2),
      "soft_vc" => Ok(Self::SoftVc),
      "so_vits_svc" => Ok(Self::SoVitsSvc),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::RvcV2,
      Self::SoftVc,
      Self::SoVitsSvc,
    ])
  }
}

#[cfg(test)]
mod tests {
  use super::VoiceConversionModelType;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in VoiceConversionModelType::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: VoiceConversionModelType = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
