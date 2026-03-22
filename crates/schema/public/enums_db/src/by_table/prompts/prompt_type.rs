use strum::EnumCount;
use strum::EnumIter;

/// Used in the `prompts` table in a `VARCHAR(16)` field.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Deserialize, Serialize, EnumIter, EnumCount)]
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

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(PromptType);
impl_mysql_enum_coders!(PromptType);
impl_mysql_from_row!(PromptType);

/// NB: Legacy API for older code.
impl PromptType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::ArtcraftApp => "artcraft_app",
      Self::StableDiffusion => "stable_diffusion",
      Self::ComfyUi => "comfy_ui",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "artcraft_app" => Ok(Self::ArtcraftApp),
      "stable_diffusion" => Ok(Self::StableDiffusion),
      "comfy_ui" => Ok(Self::ComfyUi),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

}

#[cfg(test)]
mod tests {
  use super::super::prompt_type::PromptType;
  use enums_shared::test_helpers::assert_serialization;

  mod serde {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(PromptType::ArtcraftApp, "artcraft_app");
      assert_serialization(PromptType::StableDiffusion, "stable_diffusion");
      assert_serialization(PromptType::ComfyUi, "comfy_ui");
    }
  }

  mod impl_methods {
    use super::*;

    #[test]
    fn to_str() {
      assert_eq!(PromptType::ArtcraftApp.to_str(), "artcraft_app");
      assert_eq!(PromptType::StableDiffusion.to_str(), "stable_diffusion");
      assert_eq!(PromptType::ComfyUi.to_str(), "comfy_ui");
    }

    #[test]
    fn from_str() {
      assert_eq!(PromptType::from_str("artcraft_app").unwrap(), PromptType::ArtcraftApp);
      assert_eq!(PromptType::from_str("stable_diffusion").unwrap(), PromptType::StableDiffusion);
      assert_eq!(PromptType::from_str("comfy_ui").unwrap(), PromptType::ComfyUi);
      assert!(PromptType::from_str("foo").is_err());
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip() {
      use strum::IntoEnumIterator;
      for variant in PromptType::iter() {
        assert_eq!(variant, PromptType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, PromptType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, PromptType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      use strum::IntoEnumIterator;
      const MAX_LENGTH : usize = 16;
      for variant in PromptType::iter() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
