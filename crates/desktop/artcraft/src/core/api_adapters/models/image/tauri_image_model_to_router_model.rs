use artcraft_router::api::router_image_model::RouterImageModel;

use crate::core::commands::generate::generate_image::tauri_image_model::TauriImageModel;

/// Map TauriImageModel to the artcraft_router's RouterImageModel.
/// Returns None for models not supported by the router (Grok, Midjourney, etc.).
pub fn tauri_image_model_to_router_model(model: TauriImageModel) -> Option<RouterImageModel> {
  match model {
    TauriImageModel::Flux1Dev => Some(RouterImageModel::Flux1Dev), // Text-to-Image
    TauriImageModel::Flux1Schnell => Some(RouterImageModel::Flux1Schnell), // Text-to-Image
    TauriImageModel::FluxPro11 => Some(RouterImageModel::FluxPro11), // Text-to-Image
    TauriImageModel::FluxPro11Ultra => Some(RouterImageModel::FluxPro11Ultra), // Text-to-Image
    TauriImageModel::GptImage1 => Some(RouterImageModel::GptImage1), // Text-to-Image
    TauriImageModel::GptImage1p5 => Some(RouterImageModel::GptImage1p5), // Text-to-Image
    TauriImageModel::GptImage2 => Some(RouterImageModel::GptImage2), // Text-to-Image
    TauriImageModel::GptImage2p5Flare => Some(RouterImageModel::GptImage2p5Flare), // Text-to-Image
    TauriImageModel::GptImage2p5Sunburst => Some(RouterImageModel::GptImage2p5Sunburst), // Text-to-Image
    TauriImageModel::NanoBanana => Some(RouterImageModel::NanoBanana), // Text-to-Image
    TauriImageModel::NanoBanana2 => Some(RouterImageModel::NanoBanana2), // Text-to-Image
    TauriImageModel::NanoBananaPro => Some(RouterImageModel::NanoBananaPro), // Text-to-Image
    TauriImageModel::Gemini25Flash => Some(RouterImageModel::NanoBanana), // Text-to-Image
    TauriImageModel::Seedream4 => Some(RouterImageModel::Seedream4), // Text-to-Image
    TauriImageModel::Seedream4p5 => Some(RouterImageModel::Seedream4p5), // Text-to-Image
    TauriImageModel::Seedream5Lite => Some(RouterImageModel::Seedream5Lite), // Text-to-Image
    TauriImageModel::QwenEdit2511Angles => Some(RouterImageModel::QwenEdit2511Angles),
    TauriImageModel::Flux2LoraAngles => Some(RouterImageModel::Flux2LoraAngles),
    TauriImageModel::Midjourney7 => Some(RouterImageModel::Midjourney7),
    TauriImageModel::Midjourney7Niji => Some(RouterImageModel::Midjourney7Niji),
    TauriImageModel::Midjourney8 => Some(RouterImageModel::Midjourney8),
    // Not accounted for yet
    TauriImageModel::GrokImage => None,
    TauriImageModel::Recraft3 => None,
    TauriImageModel::Midjourney => None, // NB: Generic Midjourney is served by the native Midjourney provider.
    TauriImageModel::FluxProKontextMax => None,
    TauriImageModel::FluxDevJuggernaut => None,
    TauriImageModel::FluxPro1 => None, // NB: Inpainting. Flux Pro 1.1 is text-to-image and would drop the mask.
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn inpainting_models_have_no_router_model() {
    // The router has no inpainting model; a text-to-image stand-in runs (and bills) a different
    // generation that ignores the mask.
    assert_eq!(tauri_image_model_to_router_model(TauriImageModel::FluxPro1), None);
    assert_eq!(tauri_image_model_to_router_model(TauriImageModel::FluxDevJuggernaut), None);
    assert_eq!(tauri_image_model_to_router_model(TauriImageModel::FluxPro11), Some(RouterImageModel::FluxPro11));
  }
}
