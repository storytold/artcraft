use enums_api::by_table::generic_synthetic_ids::id_category::IdCategory as Api;
use enums_db::by_table::generic_synthetic_ids::id_category::IdCategory as Db;

pub fn id_category_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::MediaFile => Db::MediaFile,
    Api::LipsyncAnimationResult => Db::LipsyncAnimationResult,
    Api::FaceFusionResult => Db::FaceFusionResult,
    Api::VideoFilterResult => Db::VideoFilterResult,
    Api::LivePortraitResult => Db::LivePortraitResult,
    Api::StudioRender => Db::StudioRender,
    Api::MocapResult => Db::MocapResult,
    Api::WorkflowResult => Db::WorkflowResult,
    Api::TtsResult => Db::TtsResult,
    Api::VoiceConversionResult => Db::VoiceConversionResult,
    Api::ZeroShotTtsResult => Db::ZeroShotTtsResult,
    Api::ZeroShotVoiceDataset => Db::ZeroShotVoiceDataset,
    Api::ZeroShotVoiceEmbedding => Db::ZeroShotVoiceEmbedding,
    Api::ModelWeights => Db::ModelWeights,
    Api::FileUpload => Db::FileUpload,
  }
}

pub fn id_category_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::MediaFile => Api::MediaFile,
    Db::LipsyncAnimationResult => Api::LipsyncAnimationResult,
    Db::FaceFusionResult => Api::FaceFusionResult,
    Db::VideoFilterResult => Api::VideoFilterResult,
    Db::LivePortraitResult => Api::LivePortraitResult,
    Db::StudioRender => Api::StudioRender,
    Db::MocapResult => Api::MocapResult,
    Db::WorkflowResult => Api::WorkflowResult,
    Db::TtsResult => Api::TtsResult,
    Db::VoiceConversionResult => Api::VoiceConversionResult,
    Db::ZeroShotTtsResult => Api::ZeroShotTtsResult,
    Db::ZeroShotVoiceDataset => Api::ZeroShotVoiceDataset,
    Db::ZeroShotVoiceEmbedding => Api::ZeroShotVoiceEmbedding,
    Db::ModelWeights => Api::ModelWeights,
    Db::FileUpload => Api::FileUpload,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = id_category_to_db(&api_variant);
      let back = id_category_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for variant in Db::iter() {
      let api = id_category_to_api(&variant);
      let back = id_category_to_db(&api);
      assert_eq!(variant, back);
    }
  }
}
