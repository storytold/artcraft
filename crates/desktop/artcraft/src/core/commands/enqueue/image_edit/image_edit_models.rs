use enums::common::model_type::ModelType;
use crate::core::commands::enqueue::image_edit::enqueue_edit_image_command::ImageEditModel;

pub fn image_edit_model_to_model_type(model: ImageEditModel) -> ModelType {
  match model {
    ImageEditModel::FluxProKontextMax => ModelType::FluxProKontextMax,
    ImageEditModel::Gemini25Flash => ModelType::NanoBanana,
    ImageEditModel::NanoBanana => ModelType::NanoBanana,
    ImageEditModel::NanoBanana2 => ModelType::NanoBanana2,
    ImageEditModel::NanoBananaPro => ModelType::NanoBananaPro,
    ImageEditModel::GptImage1 => ModelType::GptImage1,
    ImageEditModel::GptImage1p5 => ModelType::GptImage1p5,
    ImageEditModel::Seedream4 => ModelType::Seedream4,
    ImageEditModel::Seedream4p5 => ModelType::Seedream4p5,
    ImageEditModel::Seedream5Lite => ModelType::Seedream5Lite,
    ImageEditModel::QwenEdit2511Angles => ModelType::QwenEdit2511Angles,
    ImageEditModel::Flux2LoraAngles => ModelType::Flux2LoraAngles,
  }
}
