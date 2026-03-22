use serde::Deserialize;
use serde::Serialize;
use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the following SqLite tables and columns:
///   `web_scraping_targets` . `maybe_skip_reason`.
#[derive(Clone, Debug, Copy, Eq, PartialEq, Hash, Deserialize, Serialize, EnumIter, ToSchema)]

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

#[cfg(test)]
mod tests {
  use super::SkipReason;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
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

    #[test]
    fn test_deserialization() {
      assert_deserialization("empty_content", SkipReason::EmptyContent);
      assert_deserialization("advertisement", SkipReason::Advertisement);
      assert_deserialization("video_content", SkipReason::VideoContent);
      assert_deserialization("filtered_topic", SkipReason::FilteredTopic);
      assert_deserialization("filtered_topic_politics", SkipReason::FilteredTopicPolitics);
      assert_deserialization("nobody_cares", SkipReason::NobodyCares);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(SkipReason::iter().count(), 6);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in SkipReason::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: SkipReason = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
