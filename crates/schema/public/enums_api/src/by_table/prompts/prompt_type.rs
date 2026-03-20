use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `prompts` table in a `VARCHAR(16)` field.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Deserialize, Serialize, ToSchema, EnumIter, Debug)]
#[serde(rename_all = "snake_case")]

pub enum PromptType {
  /// Artcraft (App)
  ArtcraftApp,

  /// Stable diffusion
  #[deprecated]
  StableDiffusion,

  /// Comfy UI
  #[deprecated]
  ComfyUi,
}

#[cfg(test)]
mod tests {
  use super::PromptType;
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn variants_count_check() {
      assert_eq!(PromptType::iter().count(), 3);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in PromptType::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: PromptType = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
