use enums_api::common::sqlite::web_content_type::WebContentType as Api;
use enums_db::common::sqlite::web_content_type::WebContentType as Db;

pub fn web_content_type_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::CbsNewsArticle => Db::CbsNewsArticle,
    Api::CnnArticle => Db::CnnArticle,
    Api::GizmodoArticle => Db::GizmodoArticle,
    Api::HackerNewsThread => Db::HackerNewsThread,
    Api::KotakuArticle => Db::KotakuArticle,
    Api::RedditThread => Db::RedditThread,
    Api::SlashdotArticle => Db::SlashdotArticle,
    Api::SubstackPost => Db::SubstackPost,
    Api::TechCrunchArticle => Db::TechCrunchArticle,
    Api::TheGuardianArticle => Db::TheGuardianArticle,
  }
}

pub fn web_content_type_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::CbsNewsArticle => Api::CbsNewsArticle,
    Db::CnnArticle => Api::CnnArticle,
    Db::GizmodoArticle => Api::GizmodoArticle,
    Db::HackerNewsThread => Api::HackerNewsThread,
    Db::KotakuArticle => Api::KotakuArticle,
    Db::RedditThread => Api::RedditThread,
    Db::SlashdotArticle => Api::SlashdotArticle,
    Db::SubstackPost => Api::SubstackPost,
    Db::TechCrunchArticle => Api::TechCrunchArticle,
    Db::TheGuardianArticle => Api::TheGuardianArticle,
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = web_content_type_to_db(&api_variant);
      let back = web_content_type_to_api(&db);
      assert_eq!(api_variant, back);
    }
}
}
