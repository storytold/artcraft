use enums_api::by_table::generic_inference_jobs::inference_job_type::InferenceJobType as Api;
use enums_db::by_table::generic_inference_jobs::inference_job_type::InferenceJobType as Db;

pub fn inference_job_type_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::ActingFace => Db::LivePortrait,
    Api::Lipsync => Db::FaceFusion,
    Api::FalQueue => Db::FalQueue,
    Api::VideoRender => Db::VideoRender,
    Api::GptSovits => Db::GptSovits,
    Api::F5TTS => Db::F5TTS,
    Api::ComfyUi => Db::ComfyUi,
    Api::StudioGen2 => Db::StudioGen2,
    Api::ConvertFbxToGltf => Db::ConvertFbxToGltf,
    Api::MocapNet => Db::MocapNet,
    Api::RvcV2 => Db::RvcV2,
    Api::SadTalker => Db::SadTalker,
    Api::SeedVc => Db::SeedVc,
    Api::SoVitsSvc => Db::SoVitsSvc,
    Api::StableDiffusion => Db::StableDiffusion,
    Api::ImageGenApi => Db::ImageGenApi,
    Api::Seedance2ProQueue => Db::Seedance2ProQueue,
    Api::WorldlabsQueue => Db::WorldlabsQueue,
    Api::StyleTTS2 => Db::StyleTTS2,
    Api::Tacotron2 => Db::Tacotron2,
    Api::Unknown => Db::Unknown,
    Api::BevyToWorkflow => Db::BevyToWorkflow,
    Api::RerenderAVideo => Db::RerenderAVideo,
  }
}

pub fn inference_job_type_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::LivePortrait => Api::ActingFace,
    Db::FaceFusion => Api::Lipsync,
    Db::FalQueue => Api::FalQueue,
    Db::VideoRender => Api::VideoRender,
    Db::GptSovits => Api::GptSovits,
    Db::F5TTS => Api::F5TTS,
    Db::ComfyUi => Api::ComfyUi,
    Db::StudioGen2 => Api::StudioGen2,
    Db::ConvertFbxToGltf => Api::ConvertFbxToGltf,
    Db::MocapNet => Api::MocapNet,
    Db::RvcV2 => Api::RvcV2,
    Db::SadTalker => Api::SadTalker,
    Db::SeedVc => Api::SeedVc,
    Db::SoVitsSvc => Api::SoVitsSvc,
    Db::StableDiffusion => Api::StableDiffusion,
    Db::StyleTTS2 => Api::StyleTTS2,
    Db::Tacotron2 => Api::Tacotron2,
    Db::Unknown => Api::Unknown,
    Db::BevyToWorkflow => Api::BevyToWorkflow,
    Db::RerenderAVideo => Api::RerenderAVideo,
    Db::ImageGenApi => Api::ImageGenApi,
    Db::Seedance2ProQueue => Api::Seedance2ProQueue,
    Db::WorldlabsQueue => Api::WorldlabsQueue,
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
      let api = inference_job_type_to_api(&db_variant);
      let db = inference_job_type_to_db(&api);
      let back = inference_job_type_to_api(&db);
      assert_eq!(api, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for variant in Db::iter() {
      let api = inference_job_type_to_api(&variant);
      let back = inference_job_type_to_db(&api);
      assert_eq!(variant, back);
    }
  }

  #[test]
  fn renamed_variants() {
    assert_eq!(inference_job_type_to_db(&Api::ActingFace), Db::LivePortrait);
    assert_eq!(inference_job_type_to_db(&Api::Lipsync), Db::FaceFusion);
    assert_eq!(inference_job_type_to_api(&Db::LivePortrait), Api::ActingFace);
    assert_eq!(inference_job_type_to_api(&Db::FaceFusion), Api::Lipsync);
  }
}
