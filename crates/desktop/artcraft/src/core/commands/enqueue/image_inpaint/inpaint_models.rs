use crate::core::commands::enqueue::image_inpaint::enqueue_image_inpaint_command::ImageInpaintModel;
use enums::common::generation::common_model_type::CommonModelType;

pub fn image_inpaint_model_to_model_type(model: ImageInpaintModel) -> CommonModelType {
  match model {
    ImageInpaintModel::FluxDevJuggernaut => CommonModelType::FluxDevJuggernaut,
    ImageInpaintModel::FluxPro1 => CommonModelType::FluxPro1,
    ImageInpaintModel::FluxProKontextMax => CommonModelType::FluxProKontextMax,
    ImageInpaintModel::Gemini25Flash => CommonModelType::NanoBanana,
  }
}
