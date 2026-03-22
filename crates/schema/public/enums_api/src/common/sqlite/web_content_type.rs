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

// TODO(bt, 2023-01-17): This desperately needs MySQL integration tests!

/// NB: Legacy API for older code.
impl WebContentType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::CbsNewsArticle => "cbs_news_article",
      Self::CnnArticle => "cnn_article",
      Self::GizmodoArticle => "gizmodo_article",
      Self::HackerNewsThread => "hacker_news_thread",
      Self::KotakuArticle => "kotaku_article",
      Self::RedditThread => "reddit_thread",
      Self::SlashdotArticle => "slashdot_article",
      Self::SubstackPost => "substack_post",
      Self::TechCrunchArticle => "techcrunch_article",
      Self::TheGuardianArticle => "the_guardian_article",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "cbs_news_article" => Ok(Self::CbsNewsArticle),
      "cnn_article" => Ok(Self::CnnArticle),
      "gizmodo_article" => Ok(Self::GizmodoArticle),
      "hacker_news_thread" => Ok(Self::HackerNewsThread),
      "kotaku_article" => Ok(Self::KotakuArticle),
      "reddit_thread" => Ok(Self::RedditThread),
      "slashdot_article" => Ok(Self::SlashdotArticle),
      "substack_post" => Ok(Self::SubstackPost),
      "techcrunch_article" => Ok(Self::TechCrunchArticle),
      "the_guardian_article" => Ok(Self::TheGuardianArticle),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }
}

#[cfg(test)]
mod tests {
  use super::WebContentType;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in WebContentType::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: WebContentType = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
