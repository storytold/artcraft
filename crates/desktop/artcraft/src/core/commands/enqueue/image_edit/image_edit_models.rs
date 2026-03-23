use enums::common::generation::common_model_type::CommonModelType;
use crate::core::commands::enqueue::image_edit::enqueue_edit_image_command::ImageEditModel;

pub fn image_edit_model_to_model_type(model: ImageEditModel) -> CommonModelType {
  match model {
    ImageEditModel::FluxProKontextMax => CommonModelType::FluxProKontextMax,
    ImageEditModel::Gemini25Flash => CommonModelType::NanoBanana,
    ImageEditModel::NanoBanana => CommonModelType::NanoBanana,
    ImageEditModel::NanoBanana2 => CommonModelType::NanoBanana2,
    ImageEditModel::NanoBananaPro => CommonModelType::NanoBananaPro,
    ImageEditModel::GptImage1 => CommonModelType::GptImage1,
    ImageEditModel::GptImage1p5 => CommonModelType::GptImage1p5,
    ImageEditModel::Seedream4 => CommonModelType::Seedream4,
    ImageEditModel::Seedream4p5 => CommonModelType::Seedream4p5,
    ImageEditModel::Seedream5Lite => CommonModelType::Seedream5Lite,
    ImageEditModel::QwenEdit2511Angles => CommonModelType::QwenEdit2511Angles,
    ImageEditModel::Flux2LoraAngles => CommonModelType::Flux2LoraAngles,
  }
}
