use artcraft_router::api::common_image_model::CommonImageModel as RouterCommonImageModel;
use enums::common::generation::common_image_model::CommonImageModel as OmniCommonImageModel;

use crate::core::commands::generate::generate_image::tauri_image_model::TauriImageModel;
use crate::core::events::generation_events::common::GenerationModel;

/// Map TauriImageModel to the omni endpoint's CommonImageModel.
/// Returns None for models not supported by the omni endpoint.
pub fn map_to_omni_image_model(model: TauriImageModel) -> Option<OmniCommonImageModel> {
  match model {
    TauriImageModel::Flux1Dev => Some(OmniCommonImageModel::Flux1Dev),
    TauriImageModel::Flux1Schnell => Some(OmniCommonImageModel::Flux1Schnell),
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
    _ => None,
  }
}

/// Map TauriImageModel to the artcraft_router's CommonImageModel.
/// Returns None for models not supported by the router (Grok, Midjourney).
pub fn map_to_router_image_model(model: TauriImageModel) -> Option<RouterCommonImageModel> {
  match model {
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
