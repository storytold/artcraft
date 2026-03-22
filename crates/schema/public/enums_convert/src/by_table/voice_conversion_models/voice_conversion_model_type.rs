use enums_api::by_table::voice_conversion_models::voice_conversion_model_type::VoiceConversionModelType as Api;
use enums_db::by_table::voice_conversion_models::voice_conversion_model_type::VoiceConversionModelType as Db;

pub fn voice_conversion_model_type_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::RvcV2 => Db::RvcV2,
    Api::SoftVc => Db::SoftVc,
    Api::SoVitsSvc => Db::SoVitsSvc,
  }
}

pub fn voice_conversion_model_type_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::RvcV2 => Api::RvcV2,
    Db::SoftVc => Api::SoftVc,
    Db::SoVitsSvc => Api::SoVitsSvc,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = voice_conversion_model_type_to_db(&api_variant);
      let back = voice_conversion_model_type_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for variant in Db::iter() {
      let api = voice_conversion_model_type_to_api(&variant);
      let back = voice_conversion_model_type_to_db(&api);
      assert_eq!(variant, back);
    }
  }
}
