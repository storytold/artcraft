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

#[cfg(test)]
mod tests {
  use super::EmailCategory;
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn variants_count_check() {
      assert_eq!(EmailCategory::iter().count(), 2);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in EmailCategory::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: EmailCategory = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
