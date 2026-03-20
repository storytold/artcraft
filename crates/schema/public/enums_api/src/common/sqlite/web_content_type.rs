use serde::Deserialize;
use serde::Serialize;
use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the SqLite `web_scraping_targets` table in a `TEXT` field named `web_content_type`.
/// Used in the SqLite `news_story_productions` table in a `TEXT` field named `web_content_type`.
/// Used in the SqLite `news_stories` table in a `TEXT` field named `web_content_type`.
#[derive(Clone, Debug, Copy, Eq, PartialEq, Hash, Deserialize, Serialize, EnumIter, ToSchema)]

pub enum WebContentType {
  #[serde(rename = "cbs_news_article")]
  CbsNewsArticle,

  #[serde(rename = "cnn_article")]
  CnnArticle,

  #[serde(rename = "gizmodo_article")]
  GizmodoArticle,

  #[serde(rename = "hacker_news_thread")]
  HackerNewsThread,

  #[serde(rename = "kotaku_article")]
  KotakuArticle,

  #[serde(rename = "reddit_thread")]
  RedditThread,

  #[serde(rename = "slashdot_article")]
  SlashdotArticle,
  
  #[serde(rename = "substack_post")]
  SubstackPost,

  #[serde(rename = "techcrunch_article")]
  TechCrunchArticle,

  #[serde(rename = "the_guardian_article")]
  TheGuardianArticle,
}

#[cfg(test)]
mod tests {
  use super::WebContentType;
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn variants_count_check() {
      assert_eq!(WebContentType::iter().count(), 10);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in WebContentType::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: WebContentType = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
