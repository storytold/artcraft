<<<<<<< HEAD
use artcraft_router::api::common_aspect_ratio::CommonAspectRatio as RouterCommonAspectRatio;
use artcraft_router::api::common_image_model::CommonImageModel as RouterCommonImageModel;
use artcraft_router::api::common_resolution::CommonResolution as RouterCommonResolution;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio as OmniCommonAspectRatio;
use enums::common::generation::common_image_model::CommonImageModel as OmniCommonImageModel;
use enums::common::generation::common_resolution::CommonResolution as OmniCommonResolution;
=======
use artcraft_router::api::common_image_model::CommonImageModel as RouterCommonImageModel;
use enums::common::generation::common_image_model::CommonImageModel as OmniCommonImageModel;
>>>>>>> 13896d9306 (cleanup)

use crate::core::commands::generate::generate_image::tauri_image_model::TauriImageModel;
use crate::core::events::generation_events::common::GenerationModel;

/// Map TauriImageModel to the omni endpoint's CommonImageModel.
/// Returns None for models not supported by the omni endpoint.
pub fn map_to_omni_image_model(model: TauriImageModel) -> Option<OmniCommonImageModel> {
  match model {
    TauriImageModel::Flux1Dev => Some(OmniCommonImageModel::Flux1Dev),
    TauriImageModel::Flux1Schnell => Some(OmniCommonImageModel::Flux1Schnell),
<<<<<<< HEAD
    TauriImageModel::FluxPro1 => Some(OmniCommonImageModel::FluxPro11), // TODO: Might be a slight mismatch
=======
>>>>>>> 13896d9306 (cleanup)
    TauriImageModel::FluxPro11 => Some(OmniCommonImageModel::FluxPro11),
    TauriImageModel::FluxPro11Ultra => Some(OmniCommonImageModel::FluxPro11Ultra),
    TauriImageModel::GptImage1 => Some(OmniCommonImageModel::GptImage1),
    TauriImageModel::GptImage1p5 => Some(OmniCommonImageModel::GptImage1p5),
    TauriImageModel::GptImage2 => Some(OmniCommonImageModel::GptImage2),
    TauriImageModel::NanoBanana => Some(OmniCommonImageModel::NanoBanana),
    TauriImageModel::NanoBanana2 => Some(OmniCommonImageModel::NanoBanana2),
    TauriImageModel::NanoBananaPro => Some(OmniCommonImageModel::NanoBananaPro),
    TauriImageModel::Gemini25Flash => Some(OmniCommonImageModel::NanoBanana),
    TauriImageModel::Seedream4 => Some(OmniCommonImageModel::Seedream4),
    TauriImageModel::Seedream4p5 => Some(OmniCommonImageModel::Seedream4p5),
    TauriImageModel::Seedream5Lite => Some(OmniCommonImageModel::Seedream5Lite),
<<<<<<< HEAD
    // Not accounted for yet
    TauriImageModel::GrokImage => None,
    TauriImageModel::Recraft3 => None,
    TauriImageModel::Midjourney => None,
    TauriImageModel::FluxProKontextMax => None,
    TauriImageModel::QwenEdit2511Angles => None,
    TauriImageModel::Flux2LoraAngles => None,
    TauriImageModel::FluxDevJuggernaut => None,
=======
    _ => None,
>>>>>>> 13896d9306 (cleanup)
  }
}

/// Map TauriImageModel to the artcraft_router's CommonImageModel.
/// Returns None for models not supported by the router (Grok, Midjourney).
pub fn map_to_router_image_model(model: TauriImageModel) -> Option<RouterCommonImageModel> {
  match model {
<<<<<<< HEAD
    TauriImageModel::Flux1Dev => Some(RouterCommonImageModel::Flux1Dev), // Text-to-Image
    TauriImageModel::Flux1Schnell => Some(RouterCommonImageModel::Flux1Schnell), // Text-to-Image
    TauriImageModel::FluxPro1 => Some(RouterCommonImageModel::FluxPro11), // TODO: Might be a slight mismatch
    TauriImageModel::FluxPro11 => Some(RouterCommonImageModel::FluxPro11), // Text-to-Image
    TauriImageModel::FluxPro11Ultra => Some(RouterCommonImageModel::FluxPro11Ultra), // Text-to-Image
    TauriImageModel::GptImage1 => Some(RouterCommonImageModel::GptImage1), // Text-to-Image
    TauriImageModel::GptImage1p5 => Some(RouterCommonImageModel::GptImage1p5), // Text-to-Image
    TauriImageModel::GptImage2 => Some(RouterCommonImageModel::GptImage2), // Text-to-Image
    TauriImageModel::NanoBanana => Some(RouterCommonImageModel::NanoBanana), // Text-to-Image
    TauriImageModel::NanoBanana2 => Some(RouterCommonImageModel::NanoBanana2), // Text-to-Image
    TauriImageModel::NanoBananaPro => Some(RouterCommonImageModel::NanoBananaPro), // Text-to-Image
    TauriImageModel::Gemini25Flash => Some(RouterCommonImageModel::NanoBanana), // Text-to-Image
    TauriImageModel::Seedream4 => Some(RouterCommonImageModel::Seedream4), // Text-to-Image
    TauriImageModel::Seedream4p5 => Some(RouterCommonImageModel::Seedream4p5), // Text-to-Image
    TauriImageModel::Seedream5Lite => Some(RouterCommonImageModel::Seedream5Lite), // Text-to-Image
    TauriImageModel::QwenEdit2511Angles => Some(RouterCommonImageModel::QwenEdit2511Angles),
    TauriImageModel::Flux2LoraAngles => Some(RouterCommonImageModel::Flux2LoraAngles),
    // Not accounted for yet
    TauriImageModel::GrokImage => None,
    TauriImageModel::Recraft3 => None,
    TauriImageModel::Midjourney => None,
    TauriImageModel::FluxProKontextMax => None,
    TauriImageModel::FluxDevJuggernaut => None,
  }
}

/// Map from the router's CommonAspectRatio to the omni endpoint's CommonAspectRatio.
pub fn map_to_omni_aspect_ratio(ratio: RouterCommonAspectRatio) -> OmniCommonAspectRatio {
  match ratio {
    RouterCommonAspectRatio::Auto => OmniCommonAspectRatio::Auto,
    RouterCommonAspectRatio::Square => OmniCommonAspectRatio::Square,
    RouterCommonAspectRatio::WideThreeByTwo => OmniCommonAspectRatio::WideThreeByTwo,
    RouterCommonAspectRatio::WideFourByThree => OmniCommonAspectRatio::WideFourByThree,
    RouterCommonAspectRatio::WideFiveByFour => OmniCommonAspectRatio::WideFiveByFour,
    RouterCommonAspectRatio::WideSixteenByNine => OmniCommonAspectRatio::WideSixteenByNine,
    RouterCommonAspectRatio::WideTwentyOneByNine => OmniCommonAspectRatio::WideTwentyOneByNine,
    RouterCommonAspectRatio::TallTwoByThree => OmniCommonAspectRatio::TallTwoByThree,
    RouterCommonAspectRatio::TallThreeByFour => OmniCommonAspectRatio::TallThreeByFour,
    RouterCommonAspectRatio::TallFourByFive => OmniCommonAspectRatio::TallFourByFive,
    RouterCommonAspectRatio::TallNineBySixteen => OmniCommonAspectRatio::TallNineBySixteen,
    RouterCommonAspectRatio::TallNineByTwentyOne => OmniCommonAspectRatio::TallNineByTwentyOne,
    RouterCommonAspectRatio::Wide => OmniCommonAspectRatio::Wide,
    RouterCommonAspectRatio::Tall => OmniCommonAspectRatio::Tall,
    RouterCommonAspectRatio::Auto2k => OmniCommonAspectRatio::Auto2k,
    RouterCommonAspectRatio::Auto3k => OmniCommonAspectRatio::Auto3k,
    RouterCommonAspectRatio::Auto4k => OmniCommonAspectRatio::Auto4k,
    RouterCommonAspectRatio::SquareHd => OmniCommonAspectRatio::SquareHd,
  }
}

/// Map from the router's CommonResolution to the omni endpoint's CommonResolution.
pub fn map_to_omni_resolution(res: RouterCommonResolution) -> OmniCommonResolution {
  match res {
    RouterCommonResolution::OneK => OmniCommonResolution::OneK,
    RouterCommonResolution::TwoK => OmniCommonResolution::TwoK,
    RouterCommonResolution::ThreeK => OmniCommonResolution::ThreeK,
    RouterCommonResolution::FourK => OmniCommonResolution::FourK,
    RouterCommonResolution::HalfK => OmniCommonResolution::HalfK,
    RouterCommonResolution::FourEightyP => OmniCommonResolution::FourEightyP,
    RouterCommonResolution::SevenTwentyP => OmniCommonResolution::SevenTwentyP,
    RouterCommonResolution::TenEightyP => OmniCommonResolution::TenEightyP,
=======
    TauriImageModel::Flux1Dev => Some(RouterCommonImageModel::Flux1Dev),
    TauriImageModel::Flux1Schnell => Some(RouterCommonImageModel::Flux1Schnell),
    TauriImageModel::FluxPro11 => Some(RouterCommonImageModel::FluxPro11),
    TauriImageModel::FluxPro11Ultra => Some(RouterCommonImageModel::FluxPro11Ultra),
    TauriImageModel::GptImage1 => Some(RouterCommonImageModel::GptImage1),
    TauriImageModel::GptImage1p5 => Some(RouterCommonImageModel::GptImage1p5),
    TauriImageModel::GptImage2 => Some(RouterCommonImageModel::GptImage2),
    TauriImageModel::NanoBanana => Some(RouterCommonImageModel::NanoBanana),
    TauriImageModel::NanoBanana2 => Some(RouterCommonImageModel::NanoBanana2),
    TauriImageModel::NanoBananaPro => Some(RouterCommonImageModel::NanoBananaPro),
    TauriImageModel::Gemini25Flash => Some(RouterCommonImageModel::NanoBanana),
    TauriImageModel::Seedream4 => Some(RouterCommonImageModel::Seedream4),
    TauriImageModel::Seedream4p5 => Some(RouterCommonImageModel::Seedream4p5),
    TauriImageModel::Seedream5Lite => Some(RouterCommonImageModel::Seedream5Lite),
    TauriImageModel::QwenEdit2511Angles => Some(RouterCommonImageModel::QwenEdit2511Angles),
    TauriImageModel::Flux2LoraAngles => Some(RouterCommonImageModel::Flux2LoraAngles),
    _ => None,
>>>>>>> 13896d9306 (cleanup)
  }
}

/// Map TauriImageModel to GenerationModel for frontend events.
pub fn map_to_generation_model(model: TauriImageModel) -> GenerationModel {
  match model {
    TauriImageModel::Flux1Dev => GenerationModel::Flux1Dev,
    TauriImageModel::Flux1Schnell => GenerationModel::Flux1Schnell,
    TauriImageModel::FluxPro11 => GenerationModel::FluxPro11,
    TauriImageModel::FluxPro11Ultra => GenerationModel::FluxPro11Ultra,
    TauriImageModel::GrokImage => GenerationModel::GrokImage,
    TauriImageModel::Recraft3 => GenerationModel::Flux1Dev, // Fallback
    TauriImageModel::GptImage1 => GenerationModel::GptImage1,
    TauriImageModel::GptImage1p5 => GenerationModel::GptImage1p5,
    TauriImageModel::GptImage2 => GenerationModel::GptImage2,
    TauriImageModel::Gemini25Flash => GenerationModel::NanoBanana,
    TauriImageModel::NanoBanana => GenerationModel::NanoBanana,
    TauriImageModel::NanoBanana2 => GenerationModel::NanoBanana2,
    TauriImageModel::NanoBananaPro => GenerationModel::NanoBananaPro,
    TauriImageModel::Seedream4 => GenerationModel::Seedream4,
    TauriImageModel::Seedream4p5 => GenerationModel::Seedream4p5,
    TauriImageModel::Seedream5Lite => GenerationModel::Seedream5Lite,
    TauriImageModel::Midjourney => GenerationModel::Flux1Dev, // Fallback
    TauriImageModel::FluxProKontextMax => GenerationModel::FluxProKontextMax,
    TauriImageModel::QwenEdit2511Angles => GenerationModel::QwenEdit2511Angles,
    TauriImageModel::Flux2LoraAngles => GenerationModel::Flux2LoraAngles,
    TauriImageModel::FluxDevJuggernaut => GenerationModel::FluxDevJuggernaut,
    TauriImageModel::FluxPro1 => GenerationModel::FluxPro1,
  }
}
