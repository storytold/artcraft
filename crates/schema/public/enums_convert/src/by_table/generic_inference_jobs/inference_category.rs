use enums_api::by_table::generic_inference_jobs::inference_category::InferenceCategory as Api;
use enums_db::by_table::generic_inference_jobs::inference_category::InferenceCategory as Db;

pub fn inference_category_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::DeprecatedField => Db::DeprecatedField,
    Api::LipsyncAnimation => Db::LipsyncAnimation,
    Api::TextToSpeech => Db::TextToSpeech,
    Api::VoiceConversion => Db::VoiceConversion,
    Api::ImageGeneration => Db::ImageGeneration,
    Api::VideoGeneration => Db::VideoGeneration,
    Api::ObjectGeneration => Db::ObjectGeneration,
    Api::SplatGeneration => Db::SplatGeneration,
    Api::BackgroundRemoval => Db::BackgroundRemoval,
    Api::Mocap => Db::Mocap,
    Api::Workflow => Db::Workflow,
    Api::FormatConversion => Db::FormatConversion,
    Api::LivePortrait => Db::LivePortrait,
    Api::SeedVc => Db::SeedVc,
    Api::VideoFilter => Db::VideoFilter,
    Api::ConvertBvhToWorkflow => Db::ConvertBvhToWorkflow,
    Api::F5TTS => Db::F5TTS,
  }
}

pub fn inference_category_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::DeprecatedField => Api::DeprecatedField,
    Db::LipsyncAnimation => Api::LipsyncAnimation,
    Db::TextToSpeech => Api::TextToSpeech,
    Db::VoiceConversion => Api::VoiceConversion,
    Db::ImageGeneration => Api::ImageGeneration,
    Db::VideoGeneration => Api::VideoGeneration,
    Db::ObjectGeneration => Api::ObjectGeneration,
    Db::SplatGeneration => Api::SplatGeneration,
    Db::BackgroundRemoval => Api::BackgroundRemoval,
    Db::Mocap => Api::Mocap,
    Db::Workflow => Api::Workflow,
    Db::FormatConversion => Api::FormatConversion,
    Db::LivePortrait => Api::LivePortrait,
    Db::SeedVc => Api::SeedVc,
    Db::VideoFilter => Api::VideoFilter,
    Db::ConvertBvhToWorkflow => Api::ConvertBvhToWorkflow,
    Db::F5TTS => Api::F5TTS,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = inference_category_to_db(&api_variant);
      let back = inference_category_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for variant in Db::iter() {
      let api = inference_category_to_api(&variant);
      let back = inference_category_to_db(&api);
      assert_eq!(variant, back);
    }
  }
}
