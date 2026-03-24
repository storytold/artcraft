use crate::core::commands::enqueue::text_to_image::enqueue_text_to_image_command::TextToImageModel;
use enums::common::generation::common_model_type::CommonModelType;

pub fn text_to_image_model_to_model_type(model: TextToImageModel) -> CommonModelType {
  match model {
    TextToImageModel::Flux1Dev => CommonModelType::Flux1Dev,
    TextToImageModel::Flux1Schnell => CommonModelType::Flux1Schnell,
    TextToImageModel::FluxPro11 => CommonModelType::FluxPro11,
    TextToImageModel::FluxPro11Ultra => CommonModelType::FluxPro11Ultra,
    TextToImageModel::GrokImage => CommonModelType::GrokImage,
    TextToImageModel::Recraft3 => CommonModelType::Recraft3,
    TextToImageModel::GptImage1 => CommonModelType::GptImage1,
    TextToImageModel::GptImage1p5 => CommonModelType::GptImage1p5,
    TextToImageModel::Gemini25Flash => CommonModelType::NanoBanana,
    TextToImageModel::NanoBanana => CommonModelType::NanoBanana,
    TextToImageModel::NanoBanana2 => CommonModelType::NanoBanana2,
    TextToImageModel::NanoBananaPro => CommonModelType::NanoBananaPro,
    TextToImageModel::Seedream4 => CommonModelType::Seedream4,
    TextToImageModel::Seedream4p5 => CommonModelType::Seedream4p5,
    TextToImageModel::Seedream5Lite => CommonModelType::Seedream5Lite,
    TextToImageModel::Midjourney => CommonModelType::Midjourney,
  }
}
