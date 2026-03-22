use strum::EnumCount;
use strum::EnumIter;

/// Used in the `window_name` table in a `VARCHAR` field.
///
/// Contrary to most of this crate and unlike most "enum"-types
/// that are inflexible, new window names can be added/removed
/// without breaking too much.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize, EnumIter, EnumCount)]
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
impl_mysql_from_row!(WindowName);

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
  use super::super::window_name::WindowName;
  use enums_shared::test_helpers::assert_serialization;

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

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip() {
      use strum::IntoEnumIterator;
      for variant in WindowName::iter() {
        assert_eq!(variant, WindowName::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, WindowName::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, WindowName::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH: usize = 32; // TODO(bt): Confirm database column width, then remove this comment.
      use strum::IntoEnumIterator;
      for variant in WindowName::iter() {
        let serialized = variant.to_str();
        assert!(!serialized.is_empty(), "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
