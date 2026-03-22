use enums_api::by_table::generic_inference_jobs::inference_input_source_token_type::InferenceInputSourceTokenType as Api;
use enums_db::by_table::generic_inference_jobs::inference_input_source_token_type::InferenceInputSourceTokenType as Db;

pub fn inference_input_source_token_type_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::MediaFile => Db::MediaFile,
    Api::MediaUpload => Db::MediaUpload,
  }
}

pub fn inference_input_source_token_type_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::MediaFile => Api::MediaFile,
    Db::MediaUpload => Api::MediaUpload,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = inference_input_source_token_type_to_db(&api_variant);
      let back = inference_input_source_token_type_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for variant in Db::iter() {
      let api = inference_input_source_token_type_to_api(&variant);
      let back = inference_input_source_token_type_to_db(&api);
      assert_eq!(variant, back);
    }
  }
}
