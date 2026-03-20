//! This is an important enum.
//!
//! It's used in storyteller-web inference generation, the cost estimate handler,
//! the ArtCraft Tauri app, and more.
//!
//! Do not change the values here without cause or care.

use std::collections::BTreeSet;

use enums_shared::error::enums_error::EnumsError;
#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// NB: Keep the max length to 16 characters.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum GenerationProvider {
  Artcraft,
  Fal,
  Grok,
  Midjourney,
  Sora,
  WorldLabs,
}

impl_enum_display_and_debug_using_to_str!(GenerationProvider);

impl GenerationProvider {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Artcraft => "artcraft",
      Self::Fal => "fal",
      Self::Grok => "grok",
      Self::Midjourney => "midjourney",
      Self::Sora => "sora",
      Self::WorldLabs => "world_labs",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, EnumsError> {
    match value {
      "artcraft" => Ok(Self::Artcraft),
      "fal" => Ok(Self::Fal),
      "grok" => Ok(Self::Grok),
      "midjourney" => Ok(Self::Midjourney),
      "sora" => Ok(Self::Sora),
      "world_labs" => Ok(Self::WorldLabs),
      _ => Err(EnumsError::CouldNotConvertFromString(value.to_string())),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    BTreeSet::from([
      Self::Artcraft,
      Self::Fal,
      Self::Grok,
      Self::Midjourney,
      Self::Sora,
      Self::WorldLabs,
    ])
  }
}
