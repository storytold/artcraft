use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

use crate::error::enum_error::EnumError;

/// Maximum serialized string length for database storage.
pub const MAX_LENGTH: usize = 16;

/// Used in the `debug_logs` table in a `VARCHAR(16)` field (`maybe_log_level`).
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Hash, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum DebugLogLevel {
  Info,
  Warn,
  Error,
  Debug,
  Trace,
}

impl_enum_display_and_debug_using_to_str!(DebugLogLevel);
impl_mysql_enum_coders!(DebugLogLevel);
impl_mysql_from_row!(DebugLogLevel);

impl DebugLogLevel {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Info => "info",
      Self::Warn => "warn",
      Self::Error => "error",
      Self::Debug => "debug",
      Self::Trace => "trace",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, EnumError> {
    match value {
      "info" => Ok(Self::Info),
      "warn" => Ok(Self::Warn),
      "error" => Ok(Self::Error),
      "debug" => Ok(Self::Debug),
      "trace" => Ok(Self::Trace),
      _ => Err(EnumError::CouldNotConvertFromString(value.to_string())),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    BTreeSet::from([
      Self::Info,
      Self::Warn,
      Self::Error,
      Self::Debug,
      Self::Trace,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::debug_logs::debug_log_level::DebugLogLevel;
  use crate::by_table::debug_logs::debug_log_level::MAX_LENGTH;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;
    use crate::error::enum_error::EnumError;

    #[test]
    fn test_serialization() {
      assert_serialization(DebugLogLevel::Info, "info");
      assert_serialization(DebugLogLevel::Warn, "warn");
      assert_serialization(DebugLogLevel::Error, "error");
      assert_serialization(DebugLogLevel::Debug, "debug");
      assert_serialization(DebugLogLevel::Trace, "trace");
    }

    #[test]
    fn to_str() {
      assert_eq!(DebugLogLevel::Info.to_str(), "info");
      assert_eq!(DebugLogLevel::Warn.to_str(), "warn");
      assert_eq!(DebugLogLevel::Error.to_str(), "error");
      assert_eq!(DebugLogLevel::Debug.to_str(), "debug");
      assert_eq!(DebugLogLevel::Trace.to_str(), "trace");
    }

    #[test]
    fn from_str() {
      assert_eq!(DebugLogLevel::from_str("info").unwrap(), DebugLogLevel::Info);
      assert_eq!(DebugLogLevel::from_str("warn").unwrap(), DebugLogLevel::Warn);
      assert_eq!(DebugLogLevel::from_str("error").unwrap(), DebugLogLevel::Error);
      assert_eq!(DebugLogLevel::from_str("debug").unwrap(), DebugLogLevel::Debug);
      assert_eq!(DebugLogLevel::from_str("trace").unwrap(), DebugLogLevel::Trace);
    }

    #[test]
    fn from_str_err() {
      let result = DebugLogLevel::from_str("invalid");
      assert!(result.is_err());
      if let Err(EnumError::CouldNotConvertFromString(value)) = result {
        assert_eq!(value, "invalid");
      } else {
        panic!("Expected EnumError::CouldNotConvertFromString");
      }
    }

    #[test]
    fn all_variants() {
      let mut variants = DebugLogLevel::all_variants();
      assert_eq!(variants.len(), 5);
      assert_eq!(variants.pop_first(), Some(DebugLogLevel::Info));
      assert_eq!(variants.pop_first(), Some(DebugLogLevel::Warn));
      assert_eq!(variants.pop_first(), Some(DebugLogLevel::Error));
      assert_eq!(variants.pop_first(), Some(DebugLogLevel::Debug));
      assert_eq!(variants.pop_first(), Some(DebugLogLevel::Trace));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(DebugLogLevel::all_variants().len(), DebugLogLevel::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in DebugLogLevel::all_variants() {
        assert_eq!(variant, DebugLogLevel::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, DebugLogLevel::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, DebugLogLevel::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn max_length() {
      for variant in DebugLogLevel::all_variants() {
        assert!(variant.to_str().len() <= MAX_LENGTH);
      }
    }
  }
}
