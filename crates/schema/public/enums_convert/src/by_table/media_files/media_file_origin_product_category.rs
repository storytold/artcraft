use enums_api::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory as Api;
use enums_db::by_table::media_files::media_file_origin_product_category::MediaFileOriginProductCategory as Db;

pub fn media_file_origin_product_category_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::Unknown => Db::Unknown,
    Api::FaceAnimator => Db::FaceAnimator,
    Api::FaceFusion => Db::FaceFusion,
    Api::FaceMirror => Db::FaceMirror,
    Api::VideoStyleTransfer => Db::VideoStyleTransfer,
    Api::ImageStudio => Db::ImageStudio,
    Api::StorytellerStudio => Db::StorytellerStudio,
    Api::TextToSpeech => Db::TextToSpeech,
    Api::VoiceConversion => Db::VoiceConversion,
    Api::ZeroShotVoice => Db::ZeroShotVoice,
    Api::Mocap => Db::Mocap,
    Api::ImageGeneration => Db::ImageGeneration,
    Api::VideoGeneration => Db::VideoGeneration,
    Api::WorldGeneration => Db::WorldGeneration,
    Api::VideoFilter => Db::VideoFilter,
    Api::Workflow => Db::Workflow,
  }
}

pub fn media_file_origin_product_category_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::Unknown => Api::Unknown,
    Db::FaceAnimator => Api::FaceAnimator,
    Db::FaceFusion => Api::FaceFusion,
    Db::FaceMirror => Api::FaceMirror,
    Db::VideoStyleTransfer => Api::VideoStyleTransfer,
    Db::ImageStudio => Api::ImageStudio,
    Db::StorytellerStudio => Api::StorytellerStudio,
    Db::TextToSpeech => Api::TextToSpeech,
    Db::VoiceConversion => Api::VoiceConversion,
    Db::ZeroShotVoice => Api::ZeroShotVoice,
    Db::Mocap => Api::Mocap,
    Db::ImageGeneration => Api::ImageGeneration,
    Db::VideoGeneration => Api::VideoGeneration,
    Db::WorldGeneration => Api::WorldGeneration,
    Db::VideoFilter => Api::VideoFilter,
    Db::Workflow => Api::Workflow,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = media_file_origin_product_category_to_db(&api_variant);
      let back = media_file_origin_product_category_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for variant in Db::iter() {
      let api = media_file_origin_product_category_to_api(&variant);
      let back = media_file_origin_product_category_to_db(&api);
      assert_eq!(variant, back);
    }
  }
}
