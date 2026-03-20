//! This is an important enum.
//!
//! Database version of GenerationProvider. Used in MySQL/SQLite queries.
//!
//! Do not change the values here without cause or care.

use std::collections::BTreeSet;

use enums_shared::error::enums_error::EnumsError;
#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

/// NB: This will be used by a variety of tables (MySQL and sqlite)!
/// Keep the max length to 16 characters.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize)]
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
impl_mysql_enum_coders!(GenerationProvider);
impl_mysql_from_row!(GenerationProvider);
impl_sqlite_enum_coders!(GenerationProvider);

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

  /// Convert from the API type.
  pub fn from_api(api_value: enums_api::common::generation::generation_provider::GenerationProvider) -> Self {
    match api_value {
      enums_api::common::generation::generation_provider::GenerationProvider::Artcraft => Self::Artcraft,
      enums_api::common::generation::generation_provider::GenerationProvider::Fal => Self::Fal,
      enums_api::common::generation::generation_provider::GenerationProvider::Grok => Self::Grok,
      enums_api::common::generation::generation_provider::GenerationProvider::Midjourney => Self::Midjourney,
      enums_api::common::generation::generation_provider::GenerationProvider::Sora => Self::Sora,
      enums_api::common::generation::generation_provider::GenerationProvider::WorldLabs => Self::WorldLabs,
    }
  }

  /// Convert to the API type.
  pub fn to_api(&self) -> enums_api::common::generation::generation_provider::GenerationProvider {
    match self {
      Self::Artcraft => enums_api::common::generation::generation_provider::GenerationProvider::Artcraft,
      Self::Fal => enums_api::common::generation::generation_provider::GenerationProvider::Fal,
      Self::Grok => enums_api::common::generation::generation_provider::GenerationProvider::Grok,
      Self::Midjourney => enums_api::common::generation::generation_provider::GenerationProvider::Midjourney,
      Self::Sora => enums_api::common::generation::generation_provider::GenerationProvider::Sora,
      Self::WorldLabs => enums_api::common::generation::generation_provider::GenerationProvider::WorldLabs,
    }
  }
}
