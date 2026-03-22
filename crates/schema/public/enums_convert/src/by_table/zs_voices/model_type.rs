use enums_api::by_table::zs_voices::model_type::ZsVoiceModelType as Api;
use enums_db::by_table::zs_voices::model_type::ZsVoiceModelType as Db;

pub fn zs_voice_model_type_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::VallEX => Db::VallEX,
    Api::StyleTTS2 => Db::StyleTTS2,
  }
}

pub fn zs_voice_model_type_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::VallEX => Api::VallEX,
    Db::StyleTTS2 => Api::StyleTTS2,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = zs_voice_model_type_to_db(&api_variant);
      let back = zs_voice_model_type_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for variant in Db::iter() {
      let api = zs_voice_model_type_to_api(&variant);
      let back = zs_voice_model_type_to_db(&api);
      assert_eq!(variant, back);
    }
  }
}
