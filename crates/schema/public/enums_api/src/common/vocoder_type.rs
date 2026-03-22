use strum::EnumIter;
use utoipa::ToSchema;

#[derive(Clone, Copy, Eq, PartialEq, Debug, Deserialize, Serialize, EnumIter, ToSchema)]

pub enum VocoderType {
  /// NB: Note - this is hifigan for Tacotron2.
  /// Some work will be needed to unify this with other hifigan types.
  #[serde(rename = "hifigan")]
    HifiGan,

  #[serde(rename = "hifigan-superres")]
    HifiGanSuperResolution,

  /// NB: Note - this is hifigan for SoftVC (our internal codename is "rocketvc").
  /// Some work will need to be done to unify this with other hifigan types.
  /// NB(bt, 2025-07-09): It was so silly to try to obscure this. Both FakeYou and Uberduck are irrelevant now.
  #[serde(rename = "hifigan_rocket_vc")]
    HifiGanRocketVc,

}

#[cfg(test)]
mod tests {
  use super::VocoderType;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(VocoderType::HifiGan, "hifigan");
      assert_serialization(VocoderType::HifiGanSuperResolution, "hifigan-superres");
      assert_serialization(VocoderType::HifiGanRocketVc, "hifigan_rocket_vc");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("hifigan", VocoderType::HifiGan);
      assert_deserialization("hifigan-superres", VocoderType::HifiGanSuperResolution);
      assert_deserialization("hifigan_rocket_vc", VocoderType::HifiGanRocketVc);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(VocoderType::iter().count(), 3);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in VocoderType::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: VocoderType = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
