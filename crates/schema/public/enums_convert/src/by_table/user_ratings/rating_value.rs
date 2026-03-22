use enums_api::by_table::user_ratings::rating_value::UserRatingValue as Api;
use enums_db::by_table::user_ratings::rating_value::UserRatingValue as Db;

pub fn user_rating_value_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::Neutral => Db::Neutral,
    Api::Positive => Db::Positive,
    Api::Negative => Db::Negative,
  }
}

pub fn user_rating_value_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::Neutral => Api::Neutral,
    Db::Positive => Api::Positive,
    Db::Negative => Api::Negative,
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
      let db = user_rating_value_to_db(&api_variant);
      let back = user_rating_value_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = user_rating_value_to_db(&api_variant);
      let back = user_rating_value_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }
}
