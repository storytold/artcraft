use strum::EnumCount;
use strum::EnumIter;

#[derive(Clone, Copy, Eq, PartialEq, Debug, Deserialize, Serialize, EnumIter, EnumCount)]
#[derive(sqlx::Type)]
pub enum VocoderType {
  /// NB: Note - this is hifigan for Tacotron2.
  /// Some work will be needed to unify this with other hifigan types.
  #[serde(rename = "hifigan")]
  #[cfg_attr(feature = "database", sqlx(rename = "hifigan"))]
  HifiGan,

  #[serde(rename = "hifigan-superres")]
  #[cfg_attr(feature = "database", sqlx(rename = "hifigan-superres"))]
  HifiGanSuperResolution,

  /// NB: Note - this is hifigan for SoftVC (our internal codename is "rocketvc").
  /// Some work will need to be done to unify this with other hifigan types.
  /// NB(bt, 2025-07-09): It was so silly to try to obscure this. Both FakeYou and Uberduck are irrelevant now.
  #[serde(rename = "hifigan_rocket_vc")]
  #[cfg_attr(feature = "database", sqlx(rename = "hifigan_rocket_vc"))]
  HifiGanRocketVc,

}

/// NB: Legacy API for older code.
impl VocoderType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::HifiGan=> "hifigan",
      Self::HifiGanSuperResolution => "hifigan-superres",
      Self::HifiGanRocketVc => "hifigan_rocket_vc",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "hifigan" => Ok(Self::HifiGan),
      "hifigan-superres" => Ok(Self::HifiGanSuperResolution),
      "hifigan_rocket_vc" => Ok(Self::HifiGanRocketVc),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }
}

#[cfg(test)]
mod tests {
  use super::VocoderType;
  use enums_shared::test_helpers::assert_serialization;

  #[test]
  fn test_serialization() {
    assert_serialization(VocoderType::HifiGan, "hifigan");
    assert_serialization(VocoderType::HifiGanSuperResolution, "hifigan-superres");
    assert_serialization(VocoderType::HifiGanRocketVc, "hifigan_rocket_vc");
  }

  #[test]
  fn to_str() {
    assert_eq!(VocoderType::HifiGan.to_str(), "hifigan");
    assert_eq!(VocoderType::HifiGanSuperResolution.to_str(), "hifigan-superres");
    assert_eq!(VocoderType::HifiGanRocketVc.to_str(), "hifigan_rocket_vc");
  }

  #[test]
  fn from_str() {
    assert_eq!(VocoderType::from_str("hifigan").unwrap(), VocoderType::HifiGan);
    assert_eq!(VocoderType::from_str("hifigan-superres").unwrap(), VocoderType::HifiGanSuperResolution);
    assert_eq!(VocoderType::from_str("hifigan_rocket_vc").unwrap(), VocoderType::HifiGanRocketVc);
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip() {
      use strum::IntoEnumIterator;
      for variant in VocoderType::iter() {
        assert_eq!(variant, VocoderType::from_str(variant.to_str()).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH: usize = 32; // TODO(bt): Confirm database column width, then remove this comment.
      use strum::IntoEnumIterator;
      for variant in VocoderType::iter() {
        let serialized = variant.to_str();
        assert!(!serialized.is_empty(), "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
