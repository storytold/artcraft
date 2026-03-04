use crate::core::commands::enqueue::text_to_image::enqueue_text_to_image_command::TextToImageModel;
use enums::common::model_type::ModelType;

pub fn text_to_image_model_to_model_type(model: TextToImageModel) -> ModelType {
  match model {
    TextToImageModel::Flux1Dev => ModelType::Flux1Dev,
    TextToImageModel::Flux1Schnell => ModelType::Flux1Schnell,
    TextToImageModel::FluxPro11 => ModelType::FluxPro11,
    TextToImageModel::FluxPro11Ultra => ModelType::FluxPro11Ultra,
    TextToImageModel::GrokImage => ModelType::GrokImage,
    TextToImageModel::Recraft3 => ModelType::Recraft3,
    TextToImageModel::GptImage1 => ModelType::GptImage1,
    TextToImageModel::GptImage1p5 => ModelType::GptImage1p5,
    TextToImageModel::Gemini25Flash => ModelType::NanoBanana,
    TextToImageModel::NanoBanana => ModelType::NanoBanana,
    TextToImageModel::NanoBanana2 => ModelType::NanoBanana2,
    TextToImageModel::NanoBananaPro => ModelType::NanoBananaPro,
    TextToImageModel::Seedream4 => ModelType::Seedream4,
    TextToImageModel::Seedream4p5 => ModelType::Seedream4p5,
    TextToImageModel::Seedream5Lite => ModelType::Seedream5Lite,
    TextToImageModel::Midjourney => ModelType::Midjourney,
  }
}
