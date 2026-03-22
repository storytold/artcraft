use serde::Deserialize;
use serde::Serialize;
use strum::EnumCount;
use strum::EnumIter;

/// Used in the following SqLite tables and columns:
///   `web_scraping_targets` . `maybe_skip_reason`.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize, EnumIter, EnumCount)]
pub enum SkipReason {
  #[serde(rename = "empty_content")]
  EmptyContent,

  #[serde(rename = "advertisement")]
  Advertisement,

  #[serde(rename = "video_content")]
  VideoContent,

  #[serde(rename = "filtered_topic")]
  FilteredTopic,

  #[serde(rename = "filtered_topic_politics")]
  FilteredTopicPolitics,

  #[serde(rename = "nobody_cares")]
  NobodyCares,
}

// TODO(bt, 2023-02-08): This desperately needs Sqlite integration tests!
impl_enum_display_and_debug_using_to_str!(SkipReason);
impl_sqlite_enum_coders!(SkipReason);

/// NB: Legacy API for older code.
impl SkipReason {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::EmptyContent => "empty_content",
      Self::Advertisement => "advertisement",
      Self::VideoContent => "video_content",
      Self::FilteredTopic => "filtered_topic",
      Self::FilteredTopicPolitics => "filtered_topic_politics",
      Self::NobodyCares => "nobody_cares",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "empty_content" => Ok(Self::EmptyContent),
      "advertisement" => Ok(Self::Advertisement),
      "video_content" => Ok(Self::VideoContent),
      "filtered_topic" => Ok(Self::FilteredTopic),
      "filtered_topic_politics" => Ok(Self::FilteredTopicPolitics),
      "nobody_cares" => Ok(Self::NobodyCares),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }
}

#[cfg(test)]
mod tests {
  use super::SkipReason;
  use enums_shared::test_helpers::assert_serialization;

  mod serde {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(SkipReason::EmptyContent, "empty_content");
      assert_serialization(SkipReason::Advertisement, "advertisement");
      assert_serialization(SkipReason::VideoContent, "video_content");
      assert_serialization(SkipReason::FilteredTopic, "filtered_topic");
      assert_serialization(SkipReason::FilteredTopicPolitics, "filtered_topic_politics");
      assert_serialization(SkipReason::NobodyCares, "nobody_cares");
    }
  }

  mod impl_methods {
    use super::*;

    #[test]
    fn test_to_str() {
      assert_eq!(SkipReason::EmptyContent.to_str(), "empty_content");
      assert_eq!(SkipReason::Advertisement.to_str(), "advertisement");
      assert_eq!(SkipReason::VideoContent.to_str(), "video_content");
      assert_eq!(SkipReason::FilteredTopic.to_str(), "filtered_topic");
      assert_eq!(SkipReason::FilteredTopicPolitics.to_str(), "filtered_topic_politics");
      assert_eq!(SkipReason::NobodyCares.to_str(), "nobody_cares");
    }

    #[test]
    fn test_from_str() {
      assert_eq!(SkipReason::from_str("empty_content").unwrap(), SkipReason::EmptyContent);
      assert_eq!(SkipReason::from_str("advertisement").unwrap(), SkipReason::Advertisement);
      assert_eq!(SkipReason::from_str("video_content").unwrap(), SkipReason::VideoContent);
      assert_eq!(SkipReason::from_str("filtered_topic").unwrap(), SkipReason::FilteredTopic);
      assert_eq!(SkipReason::from_str("filtered_topic_politics").unwrap(), SkipReason::FilteredTopicPolitics);
      assert_eq!(SkipReason::from_str("nobody_cares").unwrap(), SkipReason::NobodyCares);
      assert!(SkipReason::from_str("foo").is_err());
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip() {
      use strum::IntoEnumIterator;
      for variant in SkipReason::iter() {
        assert_eq!(variant, SkipReason::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, SkipReason::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, SkipReason::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH: usize = 32; // TODO(bt): Confirm database column width, then remove this comment.
      use strum::IntoEnumIterator;
      for variant in SkipReason::iter() {
        let serialized = variant.to_str();
        assert!(!serialized.is_empty(), "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
