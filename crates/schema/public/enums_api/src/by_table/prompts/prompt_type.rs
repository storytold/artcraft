use std::collections::BTreeSet;

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

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::ArtcraftApp,
      Self::StableDiffusion,
      Self::ComfyUi,
    ])
  }
}

#[cfg(test)]
mod tests {
  use super::PromptType;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in PromptType::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: PromptType = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
