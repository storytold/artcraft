use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

/// Used in the `email_sender_jobs` table in `VARCHAR(32)` field `id_category`.
///
/// This denotes the type of email being sent.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize)]
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

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::Welcome,
      Self::PasswordReset,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::email_sender_jobs::email_category::EmailCategory;
  use crate::test_helpers::assert_serialization;

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

    #[test]
    fn all_variants() {
      // Static check
      let mut variants = EmailCategory::all_variants();
      assert_eq!(variants.len(), 2);
      assert_eq!(variants.pop_first(), Some(EmailCategory::Welcome));
      assert_eq!(variants.pop_first(), Some(EmailCategory::PasswordReset));
      assert_eq!(variants.pop_first(), None);

      // Generated check
      use strum::IntoEnumIterator;
      assert_eq!(EmailCategory::all_variants().len(), EmailCategory::iter().len());
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(EmailCategory::all_variants().len(), EmailCategory::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in EmailCategory::all_variants() {
        assert_eq!(variant, EmailCategory::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, EmailCategory::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, EmailCategory::from_str(&format!("{:?}", variant)).unwrap());
      }
    }
  }
}
