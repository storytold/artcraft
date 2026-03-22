use enums_api::by_table::generic_inference_jobs::inference_result_type::InferenceResultType as Api;
use enums_db::by_table::generic_inference_jobs::inference_result_type::InferenceResultType as Db;

pub fn inference_result_type_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::MediaFile => Db::MediaFile,
    Api::TextToSpeech => Db::TextToSpeech,
    Api::VoiceConversion => Db::VoiceConversion,
    Api::ZeroShotVoiceEmbedding => Db::ZeroShotVoiceEmbedding,
    Api::UploadModel => Db::UploadModel,
  }
}

pub fn inference_result_type_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::MediaFile => Api::MediaFile,
    Db::TextToSpeech => Api::TextToSpeech,
    Db::VoiceConversion => Api::VoiceConversion,
    Db::ZeroShotVoiceEmbedding => Api::ZeroShotVoiceEmbedding,
    Db::UploadModel => Api::UploadModel,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = inference_result_type_to_db(&api_variant);
      let back = inference_result_type_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for variant in Db::iter() {
      let api = inference_result_type_to_api(&variant);
      let back = inference_result_type_to_db(&api);
      assert_eq!(variant, back);
    }
  }
}
