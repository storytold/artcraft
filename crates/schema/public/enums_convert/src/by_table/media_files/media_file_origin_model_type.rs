use enums_api::by_table::media_files::media_file_origin_model_type::MediaFileOriginModelType as Api;
use enums_db::by_table::media_files::media_file_origin_model_type::MediaFileOriginModelType as Db;

pub fn media_file_origin_model_type_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::FaceMirror => Db::LivePortrait,
    Api::FaceAnimator => Db::SadTalker,
    Api::Lipsync => Db::FaceFusion,
    Api::VoiceDesigner => Db::StyleTTS2,
    Api::StorytellerStudioImageGen => Db::StorytellerStudioImageGen,
    Api::RvcV2 => Db::RvcV2,
    Api::SoVitsSvc => Db::SoVitsSvc,
    Api::SeedVc => Db::SeedVc,
    Api::Tacotron2 => Db::Tacotron2,
    Api::MocapNet => Db::MocapNet,
    Api::StableDiffusion15 => Db::StableDiffusion15,
    Api::GptSovits => Db::GptSovits,
    Api::F5TTS => Db::F5TTS,
    Api::StorytellerStudio => Db::StorytellerStudio,
    Api::VideoStyleTransfer => Db::VideoStyleTransfer,
    Api::ComfyUi => Db::ComfyUi,
    Api::VallEX => Db::VallEX,
    Api::Rerender => Db::Rerender,
  }
}

pub fn media_file_origin_model_type_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::FaceFusion => Api::Lipsync,
    Db::LivePortrait => Api::FaceMirror,
    Db::SadTalker => Api::FaceAnimator,
    Db::StyleTTS2 => Api::VoiceDesigner,
    Db::StorytellerStudioImageGen => Api::StorytellerStudioImageGen,
    Db::RvcV2 => Api::RvcV2,
    Db::SoVitsSvc => Api::SoVitsSvc,
    Db::SeedVc => Api::SeedVc,
    Db::Tacotron2 => Api::Tacotron2,
    Db::MocapNet => Api::MocapNet,
    Db::StableDiffusion15 => Api::StableDiffusion15,
    Db::GptSovits => Api::GptSovits,
    Db::F5TTS => Api::F5TTS,
    Db::StorytellerStudio => Api::StorytellerStudio,
    Db::VideoStyleTransfer => Api::VideoStyleTransfer,
    Db::ComfyUi => Api::ComfyUi,
    Db::VallEX => Api::VallEX,
    Db::Rerender => Api::Rerender,
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for db_variant in Db::iter() {
      let api = media_file_origin_model_type_to_api(&db_variant);
      let db = media_file_origin_model_type_to_db(&api);
      let back = media_file_origin_model_type_to_api(&db);
      assert_eq!(api, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for variant in Db::iter() {
      let api = media_file_origin_model_type_to_api(&variant);
      let back = media_file_origin_model_type_to_db(&api);
      assert_eq!(variant, back);
    }
  }

  #[test]
  fn renamed_variants() {
    assert_eq!(media_file_origin_model_type_to_db(&Api::FaceMirror), Db::LivePortrait);
    assert_eq!(media_file_origin_model_type_to_db(&Api::FaceAnimator), Db::SadTalker);
    assert_eq!(media_file_origin_model_type_to_db(&Api::Lipsync), Db::FaceFusion);
    assert_eq!(media_file_origin_model_type_to_db(&Api::VoiceDesigner), Db::StyleTTS2);
    assert_eq!(media_file_origin_model_type_to_api(&Db::LivePortrait), Api::FaceMirror);
    assert_eq!(media_file_origin_model_type_to_api(&Db::SadTalker), Api::FaceAnimator);
    assert_eq!(media_file_origin_model_type_to_api(&Db::FaceFusion), Api::Lipsync);
    assert_eq!(media_file_origin_model_type_to_api(&Db::StyleTTS2), Api::VoiceDesigner);
  }
}
