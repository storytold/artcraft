use artcraft_router::api::router_image_model::RouterImageModel;

use crate::core::commands::generate::generate_image::tauri_image_model::TauriImageModel;

/// Map TauriImageModel to the artcraft_router's RouterImageModel.
/// Returns None for models not supported by the router (Grok, Midjourney, etc.).
pub fn tauri_image_model_to_router_model(model: TauriImageModel) -> Option<RouterImageModel> {
  match model {
    TauriImageModel::Flux1Dev => Some(RouterImageModel::Flux1Dev), // Text-to-Image
    TauriImageModel::Flux1Schnell => Some(RouterImageModel::Flux1Schnell), // Text-to-Image
    TauriImageModel::FluxPro1 => Some(RouterImageModel::FluxPro11), // TODO: Might be a slight mismatch
    TauriImageModel::FluxPro11 => Some(RouterImageModel::FluxPro11), // Text-to-Image
    TauriImageModel::FluxPro11Ultra => Some(RouterImageModel::FluxPro11Ultra), // Text-to-Image
    TauriImageModel::GptImage1 => Some(RouterImageModel::GptImage1), // Text-to-Image
    TauriImageModel::GptImage1p5 => Some(RouterImageModel::GptImage1p5), // Text-to-Image
    TauriImageModel::GptImage2 => Some(RouterImageModel::GptImage2), // Text-to-Image
    TauriImageModel::NanoBanana => Some(RouterImageModel::NanoBanana), // Text-to-Image
    TauriImageModel::NanoBanana2 => Some(RouterImageModel::NanoBanana2), // Text-to-Image
    TauriImageModel::NanoBananaPro => Some(RouterImageModel::NanoBananaPro), // Text-to-Image
    TauriImageModel::Gemini25Flash => Some(RouterImageModel::NanoBanana), // Text-to-Image
    TauriImageModel::Seedream4 => Some(RouterImageModel::Seedream4), // Text-to-Image
    TauriImageModel::Seedream4p5 => Some(RouterImageModel::Seedream4p5), // Text-to-Image
    TauriImageModel::Seedream5Lite => Some(RouterImageModel::Seedream5Lite), // Text-to-Image
    TauriImageModel::QwenEdit2511Angles => Some(RouterImageModel::QwenEdit2511Angles),
    TauriImageModel::Flux2LoraAngles => Some(RouterImageModel::Flux2LoraAngles),
    // Not accounted for yet
    TauriImageModel::GrokImage => None,
    TauriImageModel::Recraft3 => None,
    TauriImageModel::Midjourney => None,
    TauriImageModel::FluxProKontextMax => None,
    TauriImageModel::FluxDevJuggernaut => None,
  }
}
