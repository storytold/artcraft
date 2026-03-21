use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `voice_conversion_results` table in a `VARCHAR` field.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Deserialize, Serialize, ToSchema, EnumIter, Debug)]
#[serde(rename_all = "snake_case")]
pub enum VoiceConversionMediaTokenType {
  /// Media token refers to record in `media_uploads` table.
  MediaUpload,
}

/// NB: Legacy API for older code.
impl VoiceConversionMediaTokenType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::MediaUpload => "media_upload",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "media_upload" => Ok(Self::MediaUpload),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }
}

#[cfg(test)]
mod tests {
  use super::VoiceConversionMediaTokenType;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in VoiceConversionMediaTokenType::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: VoiceConversionMediaTokenType = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
