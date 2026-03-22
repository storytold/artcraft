use enums_api::by_table::generic_inference_jobs::inference_job_product_category::InferenceJobProductCategory as Api;
use enums_db::by_table::generic_inference_jobs::inference_job_product_category::InferenceJobProductCategory as Db;

pub fn inference_job_product_category_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::DownloadGptSoVits => Db::DownloadGptSoVits,
    Api::FalImage => Db::FalImage,
    Api::FalVideo => Db::FalVideo,
    Api::FalObject => Db::FalObject,
    Api::FalBgRemoval => Db::FalBgRemoval,
    Api::Seedance2ProVideo => Db::Seedance2ProVideo,
    Api::WorldlabsSplat => Db::WorldlabsSplat,
    Api::TtsGptSoVits => Db::TtsGptSoVits,
    Api::TtsF5 => Db::TtsF5,
    Api::TtsStyleTts2 => Db::TtsStyleTts2,
    Api::TtsTacotron2 => Db::TtsTacotron2,
    Api::VcRvc2 => Db::VcRvc2,
    Api::VcSvc => Db::VcSvc,
    Api::VcSeedVc => Db::VcSeedVc,
    Api::VidLipsyncFaceFusion => Db::VidLipsyncFaceFusion,
    Api::VidLipsyncSadTalker => Db::VidLipsyncSadTalker,
    Api::VidLivePortrait => Db::VidLivePortrait,
    Api::VidLivePortraitWebcam => Db::VidLivePortraitWebcam,
    Api::VidStudio => Db::VidStudio,
    Api::VidStudioGen2 => Db::VidStudioGen2,
    Api::VidStyleTransfer => Db::VidStyleTransfer,
    Api::LipsyncFaceFusion => Db::LipsyncFaceFusion,
    Api::LipsyncSadTalker => Db::LipsyncSadTalker,
    Api::LivePortrait => Db::LivePortrait,
    Api::LivePortraitWebcam => Db::LivePortraitWebcam,
    Api::StableDiffusion => Db::StableDiffusion,
    Api::Studio => Db::Studio,
    Api::VidFaceFusion => Db::VidFaceFusion,
    Api::Vst => Db::Vst,
  }
}

pub fn inference_job_product_category_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::DownloadGptSoVits => Api::DownloadGptSoVits,
    Db::FalImage => Api::FalImage,
    Db::FalVideo => Api::FalVideo,
    Db::FalObject => Api::FalObject,
    Db::FalBgRemoval => Api::FalBgRemoval,
    Db::Seedance2ProVideo => Api::Seedance2ProVideo,
    Db::WorldlabsSplat => Api::WorldlabsSplat,
    Db::TtsGptSoVits => Api::TtsGptSoVits,
    Db::TtsF5 => Api::TtsF5,
    Db::TtsStyleTts2 => Api::TtsStyleTts2,
    Db::TtsTacotron2 => Api::TtsTacotron2,
    Db::VcRvc2 => Api::VcRvc2,
    Db::VcSvc => Api::VcSvc,
    Db::VcSeedVc => Api::VcSeedVc,
    Db::VidLipsyncFaceFusion => Api::VidLipsyncFaceFusion,
    Db::VidLipsyncSadTalker => Api::VidLipsyncSadTalker,
    Db::VidLivePortrait => Api::VidLivePortrait,
    Db::VidLivePortraitWebcam => Api::VidLivePortraitWebcam,
    Db::VidStudio => Api::VidStudio,
    Db::VidStudioGen2 => Api::VidStudioGen2,
    Db::VidStyleTransfer => Api::VidStyleTransfer,
    Db::LipsyncFaceFusion => Api::LipsyncFaceFusion,
    Db::LipsyncSadTalker => Api::LipsyncSadTalker,
    Db::LivePortrait => Api::LivePortrait,
    Db::LivePortraitWebcam => Api::LivePortraitWebcam,
    Db::StableDiffusion => Api::StableDiffusion,
    Db::Studio => Api::Studio,
    Db::VidFaceFusion => Api::VidFaceFusion,
    Db::Vst => Api::Vst,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = inference_job_product_category_to_db(&api_variant);
      let back = inference_job_product_category_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for variant in Db::iter() {
      let api = inference_job_product_category_to_api(&variant);
      let back = inference_job_product_category_to_db(&api);
      assert_eq!(variant, back);
    }
  }
}
