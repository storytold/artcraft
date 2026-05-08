use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::generate::generate_video::artcraft::get_storyteller_creds_or_error::get_storyteller_creds_or_error;
use crate::core::commands::generate::generate_video::artcraft::handle_artcraft_kling_1p6_pro::handle_artcraft_kling_1p6_pro;
use crate::core::commands::generate::generate_video::artcraft::handle_artcraft_kling_2p1_master::handle_artcraft_kling_2p1_master;
use crate::core::commands::generate::generate_video::artcraft::handle_artcraft_kling_2p1_pro::handle_artcraft_kling_2p1_pro;
use crate::core::commands::generate::generate_video::artcraft::handle_artcraft_kling_2p5_turbo_pro::handle_artcraft_kling_2p5_turbo_pro;
use crate::core::commands::generate::generate_video::artcraft::handle_artcraft_kling_2p6_pro::handle_artcraft_kling_2p6_pro;
use crate::core::commands::generate::generate_video::artcraft::handle_artcraft_seedance_1_lite::handle_artcraft_seedance_1_lite;
use crate::core::commands::generate::generate_video::artcraft::handle_artcraft_sora2::handle_artcraft_sora2;
use crate::core::commands::generate::generate_video::artcraft::handle_artcraft_sora2_pro::handle_artcraft_sora2_pro;
use crate::core::commands::generate::generate_video::artcraft::handle_artcraft_veo2::handle_artcraft_veo2;
use crate::core::commands::generate::generate_video::artcraft::handle_artcraft_veo3::handle_artcraft_veo3;
use crate::core::commands::generate::generate_video::artcraft::handle_artcraft_veo3_fast::handle_artcraft_veo3_fast;
use crate::core::commands::generate::generate_video::artcraft::handle_artcraft_veo3p1::handle_artcraft_veo3p1;
use crate::core::commands::generate::generate_video::artcraft::handle_artcraft_veo3p1_fast::handle_artcraft_veo3p1_fast;
use crate::core::commands::generate::generate_video::artcraft::handle_artcraft_video_via_router::handle_artcraft_video_via_router;
use crate::core::commands::generate::generate_video::request::{TauriGenerateVideoRequest, TauriVideoModel};
use crate::core::events::generation_events::common::GenerationModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use anyhow::anyhow;
use artcraft_router::api::common_video_model::CommonVideoModel;
use tauri::AppHandle;

pub async fn handle_video_artcraft(
  request: &TauriGenerateVideoRequest,
  app: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<TaskEnqueueSuccess, GenerateError> {

  let creds = get_storyteller_creds_or_error(app, storyteller_creds_manager)?;

  match request.model {
    None => {
      Err(GenerateError::no_model_specified())
    },
    // Handled via router
    Some(TauriVideoModel::Kling3p0Pro) => handle_artcraft_video_via_router(request, app_env_configs, &creds, CommonVideoModel::Kling3p0Pro, GenerationModel::Kling3p0Pro).await,
    Some(TauriVideoModel::Kling3p0Standard) => handle_artcraft_video_via_router(request, app_env_configs, &creds, CommonVideoModel::Kling3p0Standard, GenerationModel::Kling3p0Standard).await,
    Some(TauriVideoModel::Seedance1p5Pro) => handle_artcraft_video_via_router(request, app_env_configs, &creds, CommonVideoModel::Seedance1p5Pro, GenerationModel::Seedance1p5Pro).await,
    Some(TauriVideoModel::Seedance2p0) => handle_artcraft_video_via_router(request, app_env_configs, &creds, CommonVideoModel::Seedance2p0, GenerationModel::Seedance2p0).await,
    Some(TauriVideoModel::Seedance2p0Fast) => handle_artcraft_video_via_router(request, app_env_configs, &creds, CommonVideoModel::Seedance2p0Fast, GenerationModel::Seedance2p0Fast).await,
    Some(TauriVideoModel::HappyHorse1p0) => handle_artcraft_video_via_router(request, app_env_configs, &creds, CommonVideoModel::HappyHorse1p0, GenerationModel::HappyHorse1p0).await,
    // Legacy endpoints
    Some(TauriVideoModel::Kling16Pro) => handle_artcraft_kling_1p6_pro(request, app_env_configs, &creds).await,
    Some(TauriVideoModel::Kling21Pro) => handle_artcraft_kling_2p1_pro(request, app_env_configs, &creds).await,
    Some(TauriVideoModel::Kling21Master) => handle_artcraft_kling_2p1_master(request, app_env_configs, &creds).await,
    Some(TauriVideoModel::Kling2p5TurboPro) => handle_artcraft_kling_2p5_turbo_pro(request, app_env_configs, &creds).await,
    Some(TauriVideoModel::Kling2p6Pro) => handle_artcraft_kling_2p6_pro(request, app_env_configs, &creds).await,
    Some(TauriVideoModel::Seedance10Lite) => handle_artcraft_seedance_1_lite(request, app_env_configs, &creds).await,
    Some(TauriVideoModel::Sora2) => handle_artcraft_sora2(request, app_env_configs, &creds).await,
    Some(TauriVideoModel::Sora2Pro) => handle_artcraft_sora2_pro(request, app_env_configs, &creds).await,
    Some(TauriVideoModel::Veo2) => handle_artcraft_veo2(request, app_env_configs, &creds).await,
    Some(TauriVideoModel::Veo3) => handle_artcraft_veo3(request, app_env_configs, &creds).await,
    Some(TauriVideoModel::Veo3Fast) => handle_artcraft_veo3_fast(request, app_env_configs, &creds).await,
    Some(TauriVideoModel::Veo3p1) => handle_artcraft_veo3p1(request, app_env_configs, &creds).await,
    Some(TauriVideoModel::Veo3p1Fast) => handle_artcraft_veo3p1_fast(request, app_env_configs, &creds).await,
    Some(_) => {
      Err(GenerateError::AnyhowError(
        anyhow!("wrong logic: another branch should handle this: {:?}", request.model)))
    },
  }
}
