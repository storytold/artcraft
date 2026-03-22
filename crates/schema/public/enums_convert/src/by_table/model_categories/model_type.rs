use enums_api::by_table::model_categories::model_type::ModelType as Api;
use enums_db::by_table::model_categories::model_type::ModelType as Db;

pub fn model_type_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::Tts => Db::Tts,
    Api::W2l => Db::W2l,
  }
}

pub fn model_type_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::Tts => Api::Tts,
    Db::W2l => Api::W2l,
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
      let db = model_type_to_db(&api_variant);
      let back = model_type_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = model_type_to_db(&api_variant);
      let back = model_type_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }
}
