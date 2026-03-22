use enums_api::by_table::tts_models::tts_model_type::TtsModelType as Api;
use enums_db::by_table::tts_models::tts_model_type::TtsModelType as Db;

pub fn tts_model_type_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::Tacotron2 => Db::Tacotron2,
    Api::Vits => Db::Vits,
  }
}

pub fn tts_model_type_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::Tacotron2 => Api::Tacotron2,
    Db::Vits => Api::Vits,
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
      let db = tts_model_type_to_db(&api_variant);
      let back = tts_model_type_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = tts_model_type_to_db(&api_variant);
      let back = tts_model_type_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }
}
