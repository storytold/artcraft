use std::collections::BTreeSet;

use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `email_sender_jobs` table in `VARCHAR(32)` field `id_category`.
///
/// This denotes the type of email being sent.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema, EnumIter, Debug)]
pub enum EmailCategory {
  /// User is recently registered
  #[serde(rename = "welcome")]
  Welcome,

  /// User is resetting their password
  #[serde(rename = "password_reset")]
  PasswordReset,
}

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
  use super::EmailCategory;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in EmailCategory::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: EmailCategory = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
