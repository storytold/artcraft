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
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

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
