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

// TODO(bt, 2023-02-08): This desperately needs Sqlite integration tests!

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
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in SkipReason::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: SkipReason = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
