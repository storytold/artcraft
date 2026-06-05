use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::generate::generate_video::artcraft::get_storyteller_creds_or_error::get_storyteller_creds_or_error;
use crate::core::commands::generate::generate_video::artcraft::handle_artcraft_video_via_router::handle_artcraft_video_via_router;
use crate::core::commands::generate::generate_video::request::{TauriGenerateVideoRequest, TauriVideoModel};
use crate::core::events::generation_events::common::GenerationModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use anyhow::anyhow;
use artcraft_router::api::router_video_model::RouterVideoModel;
use tauri::AppHandle;

pub async fn handle_video_artcraft(
  request: &TauriGenerateVideoRequest,
  app: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<TaskEnqueueSuccess, GenerateError> {

  let creds = get_storyteller_creds_or_error(app, storyteller_creds_manager)?;

  let (router_model, generation_model) = match request.model {
    None => return Err(GenerateError::no_model_specified()),
    Some(TauriVideoModel::HappyHorse1p0) => (RouterVideoModel::HappyHorse1p0, GenerationModel::HappyHorse1p0),
    Some(TauriVideoModel::Kling16Pro) => (RouterVideoModel::Kling16Pro, GenerationModel::Kling1_6),
    Some(TauriVideoModel::Kling21Master) => (RouterVideoModel::Kling21Master, GenerationModel::Kling21Master),
    Some(TauriVideoModel::Kling21Pro) => (RouterVideoModel::Kling21Pro, GenerationModel::Kling21Pro),
    Some(TauriVideoModel::Kling2p5TurboPro) => (RouterVideoModel::Kling2p5TurboPro, GenerationModel::Kling2p5TurboPro),
    Some(TauriVideoModel::Kling2p6Pro) => (RouterVideoModel::Kling2p6Pro, GenerationModel::Kling2p6Pro),
    Some(TauriVideoModel::Kling3p0Pro) => (RouterVideoModel::Kling3p0Pro, GenerationModel::Kling3p0Pro),
    Some(TauriVideoModel::Kling3p0Standard) => (RouterVideoModel::Kling3p0Standard, GenerationModel::Kling3p0Standard),
    Some(TauriVideoModel::Seedance10Lite) => (RouterVideoModel::Seedance10Lite, GenerationModel::Seedance10Lite),
    Some(TauriVideoModel::Seedance1p5Pro) => (RouterVideoModel::Seedance1p5Pro, GenerationModel::Seedance1p5Pro),
    Some(TauriVideoModel::Seedance2p0) => (RouterVideoModel::Seedance2p0, GenerationModel::Seedance2p0),
    Some(TauriVideoModel::Seedance2p0Fast) => (RouterVideoModel::Seedance2p0Fast, GenerationModel::Seedance2p0Fast),
    Some(TauriVideoModel::Sora2) => (RouterVideoModel::Sora2, GenerationModel::Sora2),
    Some(TauriVideoModel::Sora2Pro) => (RouterVideoModel::Sora2Pro, GenerationModel::Sora2Pro),
    Some(TauriVideoModel::Veo2) => (RouterVideoModel::Veo2, GenerationModel::Veo2),
    Some(TauriVideoModel::Veo3) => (RouterVideoModel::Veo3, GenerationModel::Veo3),
    Some(TauriVideoModel::Veo3Fast) => (RouterVideoModel::Veo3Fast, GenerationModel::Veo3Fast),
    Some(TauriVideoModel::Veo3p1) => (RouterVideoModel::Veo3p1, GenerationModel::Veo3p1),
    Some(TauriVideoModel::Veo3p1Fast) => (RouterVideoModel::Veo3p1Fast, GenerationModel::Veo3p1Fast),
    Some(other) => return Err(GenerateError::AnyhowError(
      anyhow!("wrong logic: another branch should handle this: {:?}", other))),
  };

  handle_artcraft_video_via_router(request, app_env_configs, &creds, router_model, generation_model).await
}
