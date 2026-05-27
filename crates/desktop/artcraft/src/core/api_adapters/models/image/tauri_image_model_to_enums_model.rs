use enums::common::generation::common_image_model::CommonImageModel;

use crate::core::commands::generate::generate_image::tauri_image_model::TauriImageModel;

/// Map TauriImageModel to the omni endpoint's CommonImageModel (enums crate).
/// Returns None for models not yet supported by the omni endpoint.
pub fn tauri_image_model_to_enums_model(model: TauriImageModel) -> Option<CommonImageModel> {
  match model {
    TauriImageModel::Flux1Dev => Some(CommonImageModel::Flux1Dev),
    TauriImageModel::Flux1Schnell => Some(CommonImageModel::Flux1Schnell),
    TauriImageModel::FluxPro1 => Some(CommonImageModel::FluxPro11), // TODO: Might be a slight mismatch
    TauriImageModel::FluxPro11 => Some(CommonImageModel::FluxPro11),
    TauriImageModel::FluxPro11Ultra => Some(CommonImageModel::FluxPro11Ultra),
    TauriImageModel::GptImage1 => Some(CommonImageModel::GptImage1),
    TauriImageModel::GptImage1p5 => Some(CommonImageModel::GptImage1p5),
    TauriImageModel::GptImage2 => Some(CommonImageModel::GptImage2),
    TauriImageModel::NanoBanana => Some(CommonImageModel::NanoBanana),
    TauriImageModel::NanoBanana2 => Some(CommonImageModel::NanoBanana2),
    TauriImageModel::NanoBananaPro => Some(CommonImageModel::NanoBananaPro),
    TauriImageModel::Gemini25Flash => Some(CommonImageModel::NanoBanana),
    TauriImageModel::Seedream4 => Some(CommonImageModel::Seedream4),
    TauriImageModel::Seedream4p5 => Some(CommonImageModel::Seedream4p5),
    TauriImageModel::Seedream5Lite => Some(CommonImageModel::Seedream5Lite),
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
