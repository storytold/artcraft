use crate::core::events::generation_events::common::{GenerationAction, GenerationModel, GenerationServiceProvider};
use crate::core::state::task_database::TaskDatabase;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_status::TaskStatus;
use enums::tauri::tasks::task_type::TaskType;
use sqlite_tasks::error::SqliteTasksError;
use sqlite_tasks::queries::create_task::{create_task, CreateTaskArgs};
use tokens::tokens::sqlite::tasks::TaskId;

pub struct TaskEnqueueSuccess {
  pub task_type: TaskType,
  pub model: Option<GenerationModel>,
  pub provider: GenerationProvider,
  pub provider_job_id: Option<String>,
  // TODO: We may want to change the `model` type - this has weird ownership and semantics
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
  
  pub async fn insert_into_task_database(&self, task_database: &TaskDatabase) -> Result<TaskId, SqliteTasksError> {
    create_task(CreateTaskArgs {
      db: task_database.get_connection(),
      status: TaskStatus::Pending,
      task_type: self.task_type,
      provider: self.provider,
      provider_job_id: self.provider_job_id.as_deref(),
      frontend_subscriber_id: None,
      frontend_subscriber_payload: None,
    }).await
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