use crate::core::commands::generate::generate_image::tauri_image_model::TauriImageModel;
use crate::core::events::generation_events::common::GenerationModel;

/// Map TauriImageModel to GenerationModel for frontend events.
pub fn tauri_image_model_to_generation_model(model: TauriImageModel) -> GenerationModel {
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
