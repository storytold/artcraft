use crate::core::events::generation_events::common::{GenerationModel, GenerationServiceProvider};
use crate::core::model::contextual_image_edit_models::ContextualImageEditModel;
use crate::core::model::image_models::ImageModel;

pub struct EnqueueImageBgRemovalSuccessEvent {
  pub service_provider: GenerationServiceProvider,
  //pub model: ContextualImageEditModel,
}

impl EnqueueImageBgRemovalSuccessEvent {
  //pub fn tauri_event_model(&self) -> GenerationModel {
  //  match self.model {
  //    ContextualImageEditModel::GptImage1 => GenerationModel::GptImage1,
  //  }
  //}
}
