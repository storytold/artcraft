use serde::Deserialize;
use serde::Serialize;
#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

/// Used in the SqLite `web_scraping_targets` table in a `TEXT` field named `web_content_type`.
/// Used in the SqLite `news_story_productions` table in a `TEXT` field named `web_content_type`.
/// Used in the SqLite `news_stories` table in a `TEXT` field named `web_content_type`.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize)]
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
impl_enum_display_and_debug_using_to_str!(WebContentType);
impl_sqlite_enum_coders!(WebContentType);

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
  use crate::common::sqlite::web_content_type::WebContentType;
  use crate::test_helpers::assert_serialization;

  mod serde {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(WebContentType::CbsNewsArticle, "cbs_news_article");
      assert_serialization(WebContentType::CnnArticle, "cnn_article");
      assert_serialization(WebContentType::GizmodoArticle, "gizmodo_article");
      assert_serialization(WebContentType::HackerNewsThread, "hacker_news_thread");
      assert_serialization(WebContentType::KotakuArticle, "kotaku_article");
      assert_serialization(WebContentType::RedditThread, "reddit_thread");
      assert_serialization(WebContentType::SlashdotArticle, "slashdot_article");
      assert_serialization(WebContentType::SubstackPost, "substack_post");
      assert_serialization(WebContentType::TechCrunchArticle, "techcrunch_article");
      assert_serialization(WebContentType::TheGuardianArticle, "the_guardian_article");
    }
  }

  mod impl_methods {
    use super::*;

    #[test]
    fn test_to_str() {
      assert_eq!(WebContentType::CbsNewsArticle.to_str(), "cbs_news_article");
      assert_eq!(WebContentType::CnnArticle.to_str(), "cnn_article");
      assert_eq!(WebContentType::GizmodoArticle.to_str(), "gizmodo_article");
      assert_eq!(WebContentType::HackerNewsThread.to_str(), "hacker_news_thread");
      assert_eq!(WebContentType::KotakuArticle.to_str(), "kotaku_article");
      assert_eq!(WebContentType::RedditThread.to_str(), "reddit_thread");
      assert_eq!(WebContentType::SlashdotArticle.to_str(), "slashdot_article");
      assert_eq!(WebContentType::SubstackPost.to_str(), "substack_post");
      assert_eq!(WebContentType::TechCrunchArticle.to_str(), "techcrunch_article");
      assert_eq!(WebContentType::TheGuardianArticle.to_str(), "the_guardian_article");
    }

    #[test]
    fn test_from_str() {
      assert_eq!(WebContentType::from_str("cbs_news_article").unwrap(), WebContentType::CbsNewsArticle);
      assert_eq!(WebContentType::from_str("cnn_article").unwrap(), WebContentType::CnnArticle);
      assert_eq!(WebContentType::from_str("gizmodo_article").unwrap(), WebContentType::GizmodoArticle);
      assert_eq!(WebContentType::from_str("hacker_news_thread").unwrap(), WebContentType::HackerNewsThread);
      assert_eq!(WebContentType::from_str("kotaku_article").unwrap(), WebContentType::KotakuArticle);
      assert_eq!(WebContentType::from_str("reddit_thread").unwrap(), WebContentType::RedditThread);
      assert_eq!(WebContentType::from_str("slashdot_article").unwrap(), WebContentType::SlashdotArticle);
      assert_eq!(WebContentType::from_str("substack_post").unwrap(), WebContentType::SubstackPost);
      assert_eq!(WebContentType::from_str("techcrunch_article").unwrap(), WebContentType::TechCrunchArticle);
      assert_eq!(WebContentType::from_str("the_guardian_article").unwrap(), WebContentType::TheGuardianArticle);
      assert!(WebContentType::from_str("foo").is_err());
    }
  }
}
