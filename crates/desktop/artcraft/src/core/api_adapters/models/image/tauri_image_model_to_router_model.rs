use artcraft_router::api::common_image_model::CommonImageModel;

use crate::core::commands::generate::generate_image::tauri_image_model::TauriImageModel;

/// Map TauriImageModel to the artcraft_router's CommonImageModel.
/// Returns None for models not supported by the router (Grok, Midjourney, etc.).
pub fn tauri_image_model_to_router_model(model: TauriImageModel) -> Option<CommonImageModel> {
  match model {
    TauriImageModel::Flux1Dev => Some(CommonImageModel::Flux1Dev), // Text-to-Image
    TauriImageModel::Flux1Schnell => Some(CommonImageModel::Flux1Schnell), // Text-to-Image
    TauriImageModel::FluxPro1 => Some(CommonImageModel::FluxPro11), // TODO: Might be a slight mismatch
    TauriImageModel::FluxPro11 => Some(CommonImageModel::FluxPro11), // Text-to-Image
    TauriImageModel::FluxPro11Ultra => Some(CommonImageModel::FluxPro11Ultra), // Text-to-Image
    TauriImageModel::GptImage1 => Some(CommonImageModel::GptImage1), // Text-to-Image
    TauriImageModel::GptImage1p5 => Some(CommonImageModel::GptImage1p5), // Text-to-Image
    TauriImageModel::GptImage2 => Some(CommonImageModel::GptImage2), // Text-to-Image
    TauriImageModel::NanoBanana => Some(CommonImageModel::NanoBanana), // Text-to-Image
    TauriImageModel::NanoBanana2 => Some(CommonImageModel::NanoBanana2), // Text-to-Image
    TauriImageModel::NanoBananaPro => Some(CommonImageModel::NanoBananaPro), // Text-to-Image
    TauriImageModel::Gemini25Flash => Some(CommonImageModel::NanoBanana), // Text-to-Image
    TauriImageModel::Seedream4 => Some(CommonImageModel::Seedream4), // Text-to-Image
    TauriImageModel::Seedream4p5 => Some(CommonImageModel::Seedream4p5), // Text-to-Image
    TauriImageModel::Seedream5Lite => Some(CommonImageModel::Seedream5Lite), // Text-to-Image
    TauriImageModel::QwenEdit2511Angles => Some(CommonImageModel::QwenEdit2511Angles),
    TauriImageModel::Flux2LoraAngles => Some(CommonImageModel::Flux2LoraAngles),
    // Not accounted for yet
    TauriImageModel::GrokImage => None,
    TauriImageModel::Recraft3 => None,
    TauriImageModel::Midjourney => None,
    TauriImageModel::FluxProKontextMax => None,
    TauriImageModel::FluxDevJuggernaut => None,
  }
}
