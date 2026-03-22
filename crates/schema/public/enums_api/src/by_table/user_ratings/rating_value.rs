use strum::EnumIter;
use utoipa::ToSchema;

/// UserRatingValue
///
/// - Used in the `user_ratings` table as an `ENUM` field named `rating_type`.
/// - Used in the HTTP API.
///
/// To use this in a query, the query must have type annotations.
/// See: https://www.gitmemory.com/issue/launchbadge/sqlx/1241/847154375
/// eg. preferred_tts_result_visibility as `rating_type: enums::by_table::user_ratings::rating_type::UserRatingValue`
///
/// See also: https://docs.rs/sqlx/0.4.0-beta.1/sqlx/trait.Type.html
///
/// *DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY!*
///
#[derive(Clone, Copy, Eq, PartialEq, Deserialize, Serialize, ToSchema, EnumIter, Debug)]
#[serde(rename_all = "lowercase")]

pub enum UserRatingValue {
  /// This is considered a ratings "soft deletion" and does not count towards a total score.
  /// This is the default rating.
  Neutral,
  /// This is a positive vote / upvote / like.
  /// They are available to non-logged-in users as long as they have the URL.
  Positive,
  /// This is a negative vote / downvote / dislike.
  Negative,
}

#[cfg(test)]
mod tests {
  use super::UserRatingValue;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(UserRatingValue::Neutral, "neutral");
      assert_serialization(UserRatingValue::Positive, "positive");
      assert_serialization(UserRatingValue::Negative, "negative");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("neutral", UserRatingValue::Neutral);
      assert_deserialization("positive", UserRatingValue::Positive);
      assert_deserialization("negative", UserRatingValue::Negative);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(UserRatingValue::iter().count(), 3);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in UserRatingValue::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: UserRatingValue = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
