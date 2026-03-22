use enums_api::by_table::generic_inference_jobs::inference_model_type::InferenceModelType as Api;
use enums_db::by_table::generic_inference_jobs::inference_model_type::InferenceModelType as Db;

pub fn inference_model_type_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::ComfyUi => Db::ComfyUi,
    Api::RvcV2 => Db::RvcV2,
    Api::SadTalker => Db::SadTalker,
    Api::SoVitsSvc => Db::SoVitsSvc,
    Api::SeedVc => Db::SeedVc,
    Api::ImageGenApi => Db::ImageGenApi,
    Api::Tacotron2 => Db::Tacotron2,
    Api::Vits => Db::Vits,
    Api::VallEX => Db::VallEX,
    Api::RerenderAVideo => Db::RerenderAVideo,
    Api::StableDiffusion => Db::StableDiffusion,
    Api::MocapNet => Db::MocapNet,
    Api::StyleTTS2 => Db::StyleTTS2,
    Api::ConvertFbxToGltf => Db::ConvertFbxToGltf,
    Api::BvhToWorkflow => Db::BvhToWorkflow,
  }
}

pub fn inference_model_type_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::ComfyUi => Api::ComfyUi,
    Db::RvcV2 => Api::RvcV2,
    Db::SadTalker => Api::SadTalker,
    Db::SoVitsSvc => Api::SoVitsSvc,
    Db::SeedVc => Api::SeedVc,
    Db::ImageGenApi => Api::ImageGenApi,
    Db::Tacotron2 => Api::Tacotron2,
    Db::Vits => Api::Vits,
    Db::VallEX => Api::VallEX,
    Db::RerenderAVideo => Api::RerenderAVideo,
    Db::StableDiffusion => Api::StableDiffusion,
    Db::MocapNet => Api::MocapNet,
    Db::StyleTTS2 => Api::StyleTTS2,
    Db::ConvertFbxToGltf => Api::ConvertFbxToGltf,
    Db::BvhToWorkflow => Api::BvhToWorkflow,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = inference_model_type_to_db(&api_variant);
      let back = inference_model_type_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for variant in Db::iter() {
      let api = inference_model_type_to_api(&variant);
      let back = inference_model_type_to_db(&api);
      assert_eq!(variant, back);
    }
  }
}
