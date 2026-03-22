use enums_api::by_table::trending_model_analytics::window_name::WindowName as Api;
use enums_db::by_table::trending_model_analytics::window_name::WindowName as Db;

pub fn window_name_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::Last3Hours => Db::Last3Hours,
    Api::Last3Days => Db::Last3Days,
    Api::AllTime => Db::AllTime,
  }
}

pub fn window_name_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::Last3Hours => Api::Last3Hours,
    Db::Last3Days => Api::Last3Days,
    Db::AllTime => Api::AllTime,
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
      let db = window_name_to_db(&api_variant);
      let back = window_name_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = window_name_to_db(&api_variant);
      let back = window_name_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }
}
