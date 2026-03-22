use strum::EnumIter;
use utoipa::ToSchema;

// TODO: Use macro-derived impls

/// Our "generic downloads" pipeline supports a wide variety of ML models and other media.
/// They are serialized in the database table `generic_download_jobs` as a VARCHAR(32).
///
/// Each type of download is identified by the following enum variants.
/// These types are present in the HTTP API and database columns as serialized here.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Debug, Deserialize, Serialize, ToSchema, EnumIter, Hash, Ord, PartialOrd)]
pub enum GenericDownloadType {
  /// NB: Note - this is hifigan for Tacotron2.
  /// Some work will be needed to unify this with other hifigan types.
  #[serde(rename = "hifigan")]
    HifiGan,

  /// NB: Note - this is hifigan for SoftVC (our internal codename is "rocketvc").
  /// Some work will need to be done to unify this with other hifigan types.
  #[serde(rename = "hifigan_rocket_vc")]
    HifiGanRocketVc,

  /// NB: Note - this is hifigan for SoVitsSvc
  /// Some work will need to be done to unify this with other hifigan types.
  #[serde(rename = "hifigan_so_vits_svc")]
    HifiGanSoVitsSvc,

  //#[serde(rename = "melgan_vocodes")]
  //#[sqlx(rename = "melgan_vocodes")]
  //MelGanVocodes,

  /// NB: Our external-facing name for "softvc" is rocketvc.
  /// I wish we could stop being stupid about this.
  #[serde(rename = "rocket_vc")]
    RocketVc,

  /// RVC (v2) voice conversion models
  #[serde(rename = "rvc_v2")]
    RvcV2,

  /// so-vits-svc voice conversion models
  #[serde(rename = "so_vits_svc")]
    SoVitsSvc,

  /// Tacotron TTS models.
  #[serde(rename = "tacotron2")]
    Tacotron2,

  /// VITS TTS models.
  #[serde(rename = "vits")]
    Vits,
}

#[cfg(test)]
mod tests {
  use super::GenericDownloadType;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(GenericDownloadType::HifiGan, "hifigan");
      assert_serialization(GenericDownloadType::HifiGanRocketVc, "hifigan_rocket_vc");
      assert_serialization(GenericDownloadType::HifiGanSoVitsSvc, "hifigan_so_vits_svc");
      assert_serialization(GenericDownloadType::RocketVc, "rocket_vc");
      assert_serialization(GenericDownloadType::RvcV2, "rvc_v2");
      assert_serialization(GenericDownloadType::SoVitsSvc, "so_vits_svc");
      assert_serialization(GenericDownloadType::Tacotron2, "tacotron2");
      assert_serialization(GenericDownloadType::Vits, "vits");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("hifigan", GenericDownloadType::HifiGan);
      assert_deserialization("hifigan_rocket_vc", GenericDownloadType::HifiGanRocketVc);
      assert_deserialization("hifigan_so_vits_svc", GenericDownloadType::HifiGanSoVitsSvc);
      assert_deserialization("rocket_vc", GenericDownloadType::RocketVc);
      assert_deserialization("rvc_v2", GenericDownloadType::RvcV2);
      assert_deserialization("so_vits_svc", GenericDownloadType::SoVitsSvc);
      assert_deserialization("tacotron2", GenericDownloadType::Tacotron2);
      assert_deserialization("vits", GenericDownloadType::Vits);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(GenericDownloadType::iter().count(), 8);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in GenericDownloadType::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: GenericDownloadType = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
