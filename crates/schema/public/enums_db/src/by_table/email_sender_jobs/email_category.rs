use strum::EnumCount;
use strum::EnumIter;

/// Used in the `email_sender_jobs` table in `VARCHAR(32)` field `id_category`.
///
/// This denotes the type of email being sent.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, EnumIter, EnumCount)]
pub enum EmailCategory {
  /// User is recently registered
  #[serde(rename = "welcome")]
  Welcome,

  /// User is resetting their password
  #[serde(rename = "password_reset")]
  PasswordReset,
}

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(EmailCategory);
impl_mysql_enum_coders!(EmailCategory);
impl_mysql_from_row!(EmailCategory);

/// NB: Legacy API for older code.
impl EmailCategory {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Welcome => "welcome",
      Self::PasswordReset => "password_reset",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "welcome" => Ok(Self::Welcome),
      "password_reset" => Ok(Self::PasswordReset),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

}

#[cfg(test)]
mod tests {
  use super::super::email_category::EmailCategory;
  use enums_shared::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(EmailCategory::Welcome, "welcome");
      assert_serialization(EmailCategory::PasswordReset, "password_reset");
    }

    #[test]
    fn to_str() {
      assert_eq!(EmailCategory::Welcome.to_str(), "welcome");
      assert_eq!(EmailCategory::PasswordReset.to_str(), "password_reset");
    }

    #[test]
    fn from_str() {
      assert_eq!(EmailCategory::from_str("welcome").unwrap(), EmailCategory::Welcome);
      assert_eq!(EmailCategory::from_str("password_reset").unwrap(), EmailCategory::PasswordReset);
    }

  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip() {
      use strum::IntoEnumIterator;
      for variant in EmailCategory::iter() {
        assert_eq!(variant, EmailCategory::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, EmailCategory::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, EmailCategory::from_str(&format!("{:?}", variant)).unwrap());
      }
    }
  
    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH: usize = 32; // TODO(bt): Confirm database column width, then remove this comment.
      use strum::IntoEnumIterator;
      for variant in EmailCategory::iter() {
        let serialized = variant.to_str();
        assert!(!serialized.is_empty(), "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
