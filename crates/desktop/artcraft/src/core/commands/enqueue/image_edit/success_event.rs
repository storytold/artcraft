use crate::core::events::generation_events::common::{GenerationModel, GenerationServiceProvider};
use crate::core::model::contextual_image_edit_models::ContextualImageEditModel;
use crate::core::model::image_models::ImageModel;

pub struct ContextualEditImageSuccessEvent {
  pub service_provider: GenerationServiceProvider,
  pub model: ContextualImageEditModel,
  pub provider_job_id: Option<String>,
}

impl ContextualEditImageSuccessEvent {
  pub fn tauri_event_model(&self) -> GenerationModel {
    match self.model {
      ContextualImageEditModel::GptImage1 => GenerationModel::GptImage1,
    }
  }
}
