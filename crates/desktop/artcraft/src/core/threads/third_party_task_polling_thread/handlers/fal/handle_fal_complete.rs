use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::task_database::TaskDatabase;
use crate::core::threads::third_party_task_polling_thread::handlers::handle_provider_complete::handle_provider_complete;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use enums::tauri::tasks::task_media_file_class::TaskMediaFileClass;
use fal_client::polling::poll_job_response::poll_job_response::PollJobResponse;
use fal_client::polling::poll_job_response::success_case_extractors::PollResponseExtractedContents;
use log::error;
use sqlite_tasks::queries::task::Task;
use tauri::AppHandle;

pub async fn handle_fal_complete(
  app_handle: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  app_data_root: &AppDataRoot,
  task_database: &TaskDatabase,
  storyteller_creds_manager: &StorytellerCredentialManager,
  task: &Task,
  job_response: PollJobResponse,
) {
  let result = async {
    let (urls, media_class) = collect_media_urls(&job_response.extracted_contents)?;
    handle_provider_complete(
      app_handle, app_env_configs, app_data_root, task_database,
      storyteller_creds_manager, task, urls, media_class,
    ).await
  }.await;
  if let Err(error) = result {
    error!("[FalComplete] Failed to handle task {}: {:?}", task.id.as_str(), error);
  }
}

/// Collect downloadable media URLs from the extracted response contents.
fn collect_media_urls(
  extracted: &Option<PollResponseExtractedContents>,
) -> Result<(Vec<String>, TaskMediaFileClass), Box<dyn std::error::Error>> {
  let extracted = match extracted {
    Some(e) => e,
    None => return Ok((vec![], TaskMediaFileClass::Image)),
  };

  // Images (batch)
  if let Some(images) = &extracted.images {
    let urls: Vec<String> = images.iter()
      .filter_map(|img| img.url.clone())
      .collect();
    if !urls.is_empty() {
      return Ok((urls, TaskMediaFileClass::Image));
    }
  }

  // Single image (e.g. background removal)
  if let Some(image) = &extracted.image {
    if let Some(url) = &image.url {
      return Ok((vec![url.clone()], TaskMediaFileClass::Image));
    }
  }

  // Video
  if let Some(video) = &extracted.video {
    if let Some(url) = &video.url {
      return Ok((vec![url.clone()], TaskMediaFileClass::Video));
    }
  }

  // 3D model (GLB)
  if let Some(glb) = &extracted.model_glb {
    if let Some(url) = &glb.url {
      return Ok((vec![url.clone()], TaskMediaFileClass::Dimensional));
    }
  }

  Ok((vec![], TaskMediaFileClass::Image))
}
