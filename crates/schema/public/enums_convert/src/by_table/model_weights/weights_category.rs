use enums_api::by_table::model_weights::weights_category::WeightsCategory as Api;
use enums_db::by_table::model_weights::weights_category::WeightsCategory as Db;

pub fn weights_category_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::ImageGeneration => Db::ImageGeneration,
    Api::TextToSpeech => Db::TextToSpeech,
    Api::Vocoder => Db::Vocoder,
    Api::VoiceConversion => Db::VoiceConversion,
    Api::WorkflowConfig => Db::WorkflowConfig,
  }
}

pub fn weights_category_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::ImageGeneration => Api::ImageGeneration,
    Db::TextToSpeech => Api::TextToSpeech,
    Db::Vocoder => Api::Vocoder,
    Db::VoiceConversion => Api::VoiceConversion,
    Db::WorkflowConfig => Api::WorkflowConfig,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = weights_category_to_db(&api_variant);
      let back = weights_category_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for variant in Db::iter() {
      let api = weights_category_to_api(&variant);
      let back = weights_category_to_db(&api);
      assert_eq!(variant, back);
    }
  }
}
