use strum::EnumIter;
use utoipa::ToSchema;

#[derive(Clone, Copy, Eq, PartialEq, Debug, Deserialize, Serialize, EnumIter, ToSchema)]
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
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in VocoderType::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: VocoderType = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
