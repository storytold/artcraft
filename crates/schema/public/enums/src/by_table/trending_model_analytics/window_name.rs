use serde::Deserialize;
use serde::Serialize;
#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

/// Used in the `window_name` table in a `VARCHAR` field.
///
/// Contrary to most of this crate and unlike most "enum"-types
/// that are inflexible, new window names can be added/removed
/// without breaking too much.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize)]
pub enum WindowName {
  /// Analytics over the last three hours
  #[serde(rename = "last_3_hours")]
  Last3Hours,

  /// Analytics over the last three hours
  #[serde(rename = "last_3_days")]
  Last3Days,

  /// Analytics over all historical records
  #[serde(rename = "all_time")]
  AllTime,
}

// TODO(bt, 2023-01-17): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(WindowName);
impl_mysql_enum_coders!(WindowName);

/// NB: Legacy API for older code.
impl WindowName {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Last3Hours => "last_3_hours",
      Self::Last3Days => "last_3_days",
      Self::AllTime => "all_time",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "last_3_hours" => Ok(Self::Last3Hours),
      "last_3_days" => Ok(Self::Last3Days),
      "all_time" => Ok(Self::AllTime),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::trending_model_analytics::window_name::WindowName;
  use crate::test_helpers::assert_serialization;

  mod serde {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(WindowName::Last3Hours, "last_3_hours");
      assert_serialization(WindowName::Last3Days, "last_3_days");
      assert_serialization(WindowName::AllTime, "all_time");
    }
  }

  mod impl_methods {
    use super::*;

    #[test]
    fn test_to_str() {
      assert_eq!(WindowName::Last3Hours.to_str(), "last_3_hours");
      assert_eq!(WindowName::Last3Days.to_str(), "last_3_days");
      assert_eq!(WindowName::AllTime.to_str(), "all_time");
    }

    #[test]
    fn test_from_str() {
      assert_eq!(WindowName::from_str("last_3_hours").unwrap(), WindowName::Last3Hours);
      assert_eq!(WindowName::from_str("last_3_days").unwrap(), WindowName::Last3Days);
      assert_eq!(WindowName::from_str("all_time").unwrap(), WindowName::AllTime);
      assert!(WindowName::from_str("foo").is_err());
    }
  }
}
