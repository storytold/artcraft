use crate::core::events::generation_events::common::{GenerationAction, GenerationModel, GenerationServiceProvider};
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;

pub struct TaskEnqueueSuccess {
  pub provider: GenerationProvider,
  pub task_type: TaskType,
  pub provider_job_id: Option<String>,
  // TODO: We may want to change the `model` type - this has weird ownership and semantics
  pub model: Option<GenerationModel>, 
}

impl TaskEnqueueSuccess{
  pub fn to_frontend_event_action(&self) -> GenerationAction {
    match self.task_type {
      TaskType::ImageGeneration => GenerationAction::GenerateImage,
      TaskType::VideoGeneration => GenerationAction::GenerateVideo,
      TaskType::BackgroundRemoval => GenerationAction::RemoveBackground,
      TaskType::ObjectGeneration => GenerationAction::ImageTo3d,
    }
  }
  pub fn to_frontend_event_service(&self) -> GenerationServiceProvider {
    match self.provider {
      GenerationProvider::Artcraft => GenerationServiceProvider::Artcraft,
      GenerationProvider::Fal => GenerationServiceProvider::Fal,
      GenerationProvider::Sora => GenerationServiceProvider::Sora,
    }
  }
  
//  pub fn tauri_event_model(&self) -> GenerationModel {
//    match self.model {
//      ImageModel::Flux1Dev => GenerationModel::Flux1Dev,
//      ImageModel::Flux1Schnell => GenerationModel::Flux1Schnell,
//      ImageModel::FluxPro11 => GenerationModel::FluxPro11,
//      ImageModel::FluxPro11Ultra => GenerationModel::FluxPro11Ultra,
//      ImageModel::GptImage1 => GenerationModel::GptImage1,
//      ImageModel::Recraft3 => GenerationModel::Recraft3,
//    }
//  }
  
}