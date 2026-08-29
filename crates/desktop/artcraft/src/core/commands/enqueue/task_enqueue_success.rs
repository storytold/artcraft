use crate::core::events::generation_events::common::{GenerationAction, GenerationModel, GenerationServiceProvider};
use crate::core::state::task_database::TaskDatabase;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_model_type::TaskModelType;
use enums::tauri::tasks::task_status::TaskStatus;
use enums::tauri::tasks::task_type::TaskType;
use enums::tauri::ux::tauri_command_caller::TauriCommandCaller;
use sqlite_tasks::error::SqliteTasksError;
use sqlite_tasks::queries::create_task::{create_task, CreateTaskArgs};
use tokens::tokens::prompts::PromptToken;
use tokens::tokens::sqlite::tasks::TaskId;

pub struct TaskEnqueueSuccess {
  pub task_type: TaskType,
  pub model: Option<GenerationModel>,
  pub provider: GenerationProvider,
  pub provider_job_id: Option<String>,
  pub maybe_queue_status_url: Option<String>,
  pub maybe_queue_response_url: Option<String>,
  pub maybe_prompt_token: Option<PromptToken>,
}

fn generation_model_to_task_model_type(model: GenerationModel) -> Option<TaskModelType> {
  match model {
    GenerationModel::Flux1Dev => Some(TaskModelType::Flux1Dev),
    GenerationModel::FluxDevJuggernaut => Some(TaskModelType::FluxDevJuggernaut),
    GenerationModel::Flux1Schnell => Some(TaskModelType::Flux1Schnell),
    GenerationModel::FluxPro1 => Some(TaskModelType::FluxPro1), // NB: This is for inpainting.
    GenerationModel::FluxPro11 => Some(TaskModelType::FluxPro11),
    GenerationModel::FluxPro11Ultra => Some(TaskModelType::FluxPro11Ultra),
    GenerationModel::FluxProKontextMax => Some(TaskModelType::FluxProKontextMax),
    GenerationModel::Gemini25Flash => Some(TaskModelType::Gemini25Flash),
    GenerationModel::NanoBanana => Some(TaskModelType::NanoBanana),
    GenerationModel::NanoBanana2 => Some(TaskModelType::NanoBanana2),
    GenerationModel::NanoBananaPro => Some(TaskModelType::NanoBananaPro),
    GenerationModel::GptImage1 => Some(TaskModelType::GptImage1),
    GenerationModel::GptImage1p5 => Some(TaskModelType::GptImage1p5),
    GenerationModel::GptImage2 => Some(TaskModelType::GptImage2),
    GenerationModel::Seedream4 => Some(TaskModelType::Seedream4),
    GenerationModel::Seedream4p5 => Some(TaskModelType::Seedream4p5),
    GenerationModel::Seedream5Lite => Some(TaskModelType::Seedream5Lite),
    GenerationModel::QwenEdit2511Angles => Some(TaskModelType::QwenEdit2511Angles),
    GenerationModel::Flux2LoraAngles => Some(TaskModelType::Flux2LoraAngles),
    GenerationModel::GrokImage => Some(TaskModelType::GrokImage),
    GenerationModel::Recraft3 => Some(TaskModelType::Recraft3),
    GenerationModel::GrokVideo => Some(TaskModelType::GrokVideo),
    GenerationModel::GrokImagineVideo1p5 => Some(TaskModelType::GrokImagineVideo1p5),
    GenerationModel::Kling21Pro => Some(TaskModelType::Kling21Pro),
    GenerationModel::Kling21Master => Some(TaskModelType::Kling21Master),
    GenerationModel::Kling2p5TurboPro => Some(TaskModelType::Kling2p5TurboPro),
    GenerationModel::Kling2p6Pro => Some(TaskModelType::Kling2p6Pro),
    GenerationModel::Kling3p0Standard => Some(TaskModelType::Kling3p0Standard),
    GenerationModel::Kling3p0Pro => Some(TaskModelType::Kling3p0Pro),
    GenerationModel::HappyHorse1p0 => Some(TaskModelType::HappyHorse1p0),
    GenerationModel::Seedance10Lite => Some(TaskModelType::Seedance10Lite),
    GenerationModel::Seedance1p5Pro => Some(TaskModelType::Seedance1p5Pro),
    GenerationModel::Seedance2p0 => Some(TaskModelType::Seedance2p0),
    GenerationModel::Seedance2p0Fast => Some(TaskModelType::Seedance2p0Fast),
    GenerationModel::Seedance2p5Preview => Some(TaskModelType::Seedance2p5Preview),
    GenerationModel::Seedance2p5 => Some(TaskModelType::Seedance2p5),
    GenerationModel::Seedance2p5Ultra => Some(TaskModelType::Seedance2p5Ultra),
    GenerationModel::Sora2 => Some(TaskModelType::Sora2),
    GenerationModel::Sora2Pro => Some(TaskModelType::Sora2Pro),
    GenerationModel::Veo2 => Some(TaskModelType::Veo2),
    GenerationModel::Veo3 => Some(TaskModelType::Veo3),
    GenerationModel::Veo3p1 => Some(TaskModelType::Veo3p1),
    GenerationModel::Veo3p1Fast => Some(TaskModelType::Veo3p1Fast),
    GenerationModel::Veo3Fast => Some(TaskModelType::Veo3Fast),
    GenerationModel::Hunyuan3d2_0 => Some(TaskModelType::Hunyuan3d2_0),
    GenerationModel::Hunyuan3d2_1 => Some(TaskModelType::Hunyuan3d2_1),
    GenerationModel::Hunyuan3d3 => Some(TaskModelType::Hunyuan3d3),
    GenerationModel::WorldlabsMarble => Some(TaskModelType::WorldlabsMarble),
    GenerationModel::WorldlabsMarble0p1Mini => Some(TaskModelType::WorldlabsMarble0p1Mini),
    GenerationModel::WorldlabsMarble0p1Plus => Some(TaskModelType::WorldlabsMarble0p1Plus),
    GenerationModel::Midjourney => Some(TaskModelType::Midjourney), // NB: This is a generic Midjourney model, version unknown.
    GenerationModel::Midjourney7 => Some(TaskModelType::Midjourney7),
    GenerationModel::Midjourney7Niji => Some(TaskModelType::Midjourney7Niji),
    GenerationModel::Midjourney8 => Some(TaskModelType::Midjourney8),

    // TODO: These seem wrong -
    GenerationModel::Kling1_6 => Some(TaskModelType::Kling16Pro), // NB: `VideoModel::Kling16Pro`.
    GenerationModel::Kling2_0 => None, // TODO: unused elsewhere?
    GenerationModel::Sora => None, // TODO: unused elsewhere?
  }
}

impl TaskEnqueueSuccess{
  pub fn to_frontend_event_action(&self) -> GenerationAction {
    match self.task_type {
      TaskType::ImageGeneration => GenerationAction::GenerateImage,
      TaskType::GaussianGeneration => GenerationAction::GenerateGaussian,
      TaskType::VideoGeneration => GenerationAction::GenerateVideo,
      TaskType::BackgroundRemoval => GenerationAction::RemoveBackground,
      TaskType::ObjectGeneration => GenerationAction::ImageTo3d,
      TaskType::ImageInpaintEdit => GenerationAction::ImageInpaintEdit,
    }
  }
  
  pub fn to_frontend_event_service(&self) -> GenerationServiceProvider {
    match self.provider {
      GenerationProvider::Artcraft => GenerationServiceProvider::Artcraft,
      GenerationProvider::Fal => GenerationServiceProvider::Fal,
      GenerationProvider::Grok => GenerationServiceProvider::Grok,
      GenerationProvider::Midjourney => GenerationServiceProvider::Midjourney,
      GenerationProvider::Sora => GenerationServiceProvider::Sora,
      GenerationProvider::WorldLabs => GenerationServiceProvider::WorldLabs,
    }
  }
  
  pub async fn insert_into_task_database(&self, task_database: &TaskDatabase) -> Result<TaskId, SqliteTasksError> {
    self.insert_into_task_database_with_frontend_payload(
      task_database,
      None,
      None,
      None,
    ).await
  }

  // TODO: This belongs somewhere else, not as a method of an event struct.
  pub async fn insert_into_task_database_with_frontend_payload(
    &self,
    task_database: &TaskDatabase,
    frontend_caller: Option<TauriCommandCaller>,
    frontend_subscriber_id: Option<&str>,
    frontend_subscriber_payload: Option<&str>,
  ) -> Result<TaskId, SqliteTasksError> {
    let model_type = self.model.and_then(generation_model_to_task_model_type);

    create_task(CreateTaskArgs {
      db: task_database.get_connection(),
      status: TaskStatus::Pending,
      task_type: self.task_type,
      model_type,
      provider: self.provider,
      provider_job_id: self.provider_job_id.as_deref(),
      queue_status_url: self.maybe_queue_status_url.as_deref(),
      queue_response_url: self.maybe_queue_response_url.as_deref(),
      prompt_token: self.maybe_prompt_token.as_ref(),
      frontend_caller,
      frontend_subscriber_id,
      frontend_subscriber_payload,
    }).await
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn seedance_2p5_generation_models_map_to_persisted_task_models() {
    for (generation_model, expected) in [
      (GenerationModel::Seedance2p5Preview, "seedance_2p5_preview"),
      (GenerationModel::Seedance2p5, "seedance_2p5"),
      (GenerationModel::Seedance2p5Ultra, "seedance_2p5_u"),
    ] {
      let task_model = generation_model_to_task_model_type(generation_model).unwrap();
      assert_eq!(task_model.to_str(), expected);
    }
  }

  #[test]
  fn extracted_mapping_preserves_legacy_special_cases() {
    assert_eq!(generation_model_to_task_model_type(GenerationModel::Kling1_6).unwrap().to_str(), "kling_1.6_pro");
    assert!(generation_model_to_task_model_type(GenerationModel::Kling2_0).is_none());
    assert!(generation_model_to_task_model_type(GenerationModel::Sora).is_none());
  }
}
