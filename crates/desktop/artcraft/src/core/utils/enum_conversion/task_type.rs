use crate::core::events::generation_events::common::GenerationAction;
use enums::tauri::tasks::task_type::TaskType;

pub fn to_generation_action(task_type: TaskType) -> GenerationAction {
  match task_type {
    TaskType::ImageGeneration => GenerationAction::GenerateImage,
    TaskType::VideoGeneration => GenerationAction::GenerateVideo,
    TaskType::AudioGeneration => GenerationAction::GenerateAudio,
    TaskType::BackgroundRemoval => GenerationAction::RemoveBackground,
    TaskType::ObjectGeneration => GenerationAction::ImageTo3d,
    TaskType::GaussianGeneration => GenerationAction::GenerateGaussian,
    TaskType::ImageInpaintEdit => GenerationAction::ImageInpaintEdit,
  }
}
