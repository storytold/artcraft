use enums_api::by_table::web_scraping_targets::scraping_status::ScrapingStatus as Api;
use enums_db::by_table::web_scraping_targets::scraping_status::ScrapingStatus as Db;

pub fn scraping_status_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::New => Db::New,
    Api::Skipped => Db::Skipped,
    Api::Failed => Db::Failed,
    Api::PermanentlyFailed => Db::PermanentlyFailed,
    Api::Success => Db::Success,
  }
}

pub fn scraping_status_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::New => Api::New,
    Db::Skipped => Api::Skipped,
    Db::Failed => Api::Failed,
    Db::PermanentlyFailed => Api::PermanentlyFailed,
    Db::Success => Api::Success,
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = scraping_status_to_db(&api_variant);
      let back = scraping_status_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = scraping_status_to_db(&api_variant);
      let back = scraping_status_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }
}
