use crate::core::commands::enqueue::image_inpaint::enqueue_image_inpaint_command::ImageInpaintModel;
use enums_db::common::model_type::ModelType;

pub fn image_inpaint_model_to_model_type(model: ImageInpaintModel) -> ModelType {
  match model {
    ImageInpaintModel::FluxDevJuggernaut => ModelType::FluxDevJuggernaut,
    ImageInpaintModel::FluxPro1 => ModelType::FluxPro1,
    ImageInpaintModel::FluxProKontextMax => ModelType::FluxProKontextMax,
    ImageInpaintModel::Gemini25Flash => ModelType::NanoBanana,
  }
}
