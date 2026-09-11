#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
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
#[derive(Clone, Copy, Eq, PartialEq, Deserialize, Serialize, ToSchema)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(rename_all = "lowercase"))]
#[cfg_attr(test, derive(EnumIter, EnumCount))]
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


impl_enum_display_and_debug_using_to_str!(UserRatingValue);

impl Default for UserRatingValue {
  fn default() -> Self { Self::Neutral }
}

/// NB: Legacy API for older code.
impl UserRatingValue {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Neutral => "neutral",
      Self::Positive => "positive",
      Self::Negative => "negative",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "neutral" => Ok(Self::Neutral),
      "positive" => Ok(Self::Positive),
      "negative" => Ok(Self::Negative),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::user_ratings::rating_value::UserRatingValue;
  use crate::test_helpers::assert_serialization;

  #[test]
  fn test_serialization() {
    assert_serialization(UserRatingValue::Neutral, "neutral");
    assert_serialization(UserRatingValue::Positive, "positive");
    assert_serialization(UserRatingValue::Negative, "negative");
  }

  mod impl_methods {
    use super::*;

    #[test]
    fn to_str() {
      assert_eq!(UserRatingValue::Neutral.to_str(), "neutral");
      assert_eq!(UserRatingValue::Positive.to_str(), "positive");
      assert_eq!(UserRatingValue::Negative.to_str(), "negative");
    }

    #[test]
    fn from_str() {
      assert_eq!(UserRatingValue::from_str("neutral").unwrap(), UserRatingValue::Neutral);
      assert_eq!(UserRatingValue::from_str("positive").unwrap(), UserRatingValue::Positive);
      assert_eq!(UserRatingValue::from_str("negative").unwrap(), UserRatingValue::Negative);
      assert!(UserRatingValue::from_str("foo").is_err());
    }
  }

  mod traits {
    use super::*;

    #[test]
    fn default() {
      assert_eq!(UserRatingValue::default(), UserRatingValue::Neutral);
    }

    #[test]
    fn display() {
      let visibility = UserRatingValue::Positive;
      assert_eq!(format!("{}", visibility), "positive".to_string());
    }

    #[test]
    fn debug() {
      let visibility = UserRatingValue::Negative;
      assert_eq!(format!("{:?}", visibility), "negative".to_string());
    }
  }

  #[derive(Serialize, Deserialize, PartialEq, Debug)]
  struct CompositeType {
    visibility: UserRatingValue,
    string: String,
  }

  mod serde_serialization {
    use super::*;

    #[test]
    fn serialize() {
      let expected = "\"positive\"".to_string(); // NB: Quoted

      assert_eq!(expected, serde_json::to_string(&UserRatingValue::Positive).unwrap());

      // Just to show this serializes the same as a string
      assert_eq!(expected, serde_json::to_string("positive").unwrap());
    }

    #[test]
    fn nested_serialize() {
      let value = CompositeType { visibility: UserRatingValue::Negative, string: "bar".to_string() };
      let expected = r#"{"visibility":"negative","string":"bar"}"#.to_string();
      assert_eq!(expected, serde_json::to_string(&value).unwrap());
    }
  }

  mod serde_deserialization {
    use super::*;

    #[test]
    fn deserialize() {
      let payload = "\"positive\""; // NB: Quoted
      let value: UserRatingValue = serde_json::from_str(payload).unwrap();
      assert_eq!(value, UserRatingValue::Positive);
    }

    #[test]
    fn nested_deserialize() {
      let payload = r#"{"visibility":"neutral","string":"bar"}"#.to_string();
      let expected = CompositeType {
        visibility: UserRatingValue::Neutral,
        string: "bar".to_string(),
      };

      assert_eq!(expected, serde_json::from_str::<CompositeType>(&payload).unwrap());
    }
  }
}
