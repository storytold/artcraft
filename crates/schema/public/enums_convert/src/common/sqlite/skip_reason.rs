use enums_api::common::sqlite::skip_reason::SkipReason as Api;
use enums_db::common::sqlite::skip_reason::SkipReason as Db;

pub fn skip_reason_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::EmptyContent => Db::EmptyContent,
    Api::Advertisement => Db::Advertisement,
    Api::VideoContent => Db::VideoContent,
    Api::FilteredTopic => Db::FilteredTopic,
    Api::FilteredTopicPolitics => Db::FilteredTopicPolitics,
    Api::NobodyCares => Db::NobodyCares,
  }
}

pub fn skip_reason_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::EmptyContent => Api::EmptyContent,
    Db::Advertisement => Api::Advertisement,
    Db::VideoContent => Api::VideoContent,
    Db::FilteredTopic => Api::FilteredTopic,
    Db::FilteredTopicPolitics => Api::FilteredTopicPolitics,
    Db::NobodyCares => Api::NobodyCares,
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
      let db = skip_reason_to_db(&api_variant);
      let back = skip_reason_to_api(&db);
      assert_eq!(api_variant, back);
    }
}
}
