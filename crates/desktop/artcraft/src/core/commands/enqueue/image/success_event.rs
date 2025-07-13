use crate::core::events::generation_events::common::{GenerationModel, GenerationServiceProvider};
use crate::core::model::image_models::ImageModel;

pub struct SuccessEvent {
  pub service_provider: GenerationServiceProvider,
  pub model: ImageModel,
  pub provider_job_id: Option<String>,
}

impl SuccessEvent {
  pub fn tauri_event_model(&self) -> GenerationModel {
    match self.model {
      ImageModel::Flux1Dev => GenerationModel::Flux1Dev,
      ImageModel::Flux1Schnell => GenerationModel::Flux1Schnell,
      ImageModel::FluxPro11 => GenerationModel::FluxPro11,
      ImageModel::FluxPro11Ultra => GenerationModel::FluxPro11Ultra,
      ImageModel::GptImage1 => GenerationModel::GptImage1,
      ImageModel::Recraft3 => GenerationModel::Recraft3,
    }
  }
}