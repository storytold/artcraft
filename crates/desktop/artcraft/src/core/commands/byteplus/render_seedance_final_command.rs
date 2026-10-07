use byteplus_ark_client::requests::videos::create_video_task::create_video_task;
use byteplus_ark_client::requests::videos::video_task_types::{CreateVideoTaskRequest, DraftTaskRef, VideoContentItem};
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use log::{error, info, warn};
use serde_derive::{Deserialize, Serialize};
use tauri::{AppHandle, State};
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;

use crate::core::api_adapters::models::video::tauri_video_model_to_generation_model::tauri_video_model_to_generation_model;
use crate::core::commands::byteplus::seedance_draft::find_seedance_draft;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::generate::byteplus::byteplus_common::read_byteplus_api_key;
use crate::core::commands::generate::byteplus::byteplus_video_models::{byteplus_video_model_id, FINAL_RESOLUTION};
use crate::core::commands::generate::generate_video::request::TauriVideoModel;
use crate::core::commands::response::shorthand::ResponseOrErrorMessage;
use crate::core::commands::response::success_response_wrapper::SerializeMarker;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::functional_events::show_provider_login_modal_event::ShowProviderLoginModalEvent;
use crate::core::events::generation_events::generation_enqueue_success_event::GenerationEnqueueSuccessEvent;
use crate::core::providers::credentials::provider_credential_loading_cache::ProviderCredentialLoadingCache;
use crate::core::state::task_database::TaskDatabase;

#[derive(Deserialize)]
pub struct RenderSeedanceFinalRequest {
  /// A video made in Seedance 2.5 draft mode.
  pub media_file_token: MediaFileToken,
}

#[derive(Serialize)]
pub struct RenderSeedanceFinalResponse {}

impl SerializeMarker for RenderSeedanceFinalResponse {}

/// Renders the 1080p video from a Seedance 2.5 draft. ModelArk reuses the draft's prompt, inputs
/// and settings; resending any of them is an error, so only the draft task id goes.
#[tauri::command]
pub async fn render_seedance_final_command(
  request: RenderSeedanceFinalRequest,
  app: AppHandle,
  task_database: State<'_, TaskDatabase>,
  credential_cache: State<'_, ProviderCredentialLoadingCache>,
) -> ResponseOrErrorMessage<RenderSeedanceFinalResponse> {
  info!("render_seedance_final_command called for {}", request.media_file_token.as_str());

  let draft = find_seedance_draft(&task_database, &request.media_file_token).await?
    .ok_or("This video isn't a Seedance 2.5 draft made on this computer.")?;

  if draft.is_expired(chrono::Utc::now().timestamp()) {
    return Err("This draft is more than 7 days old. Generate a new draft to render it.".into());
  }

  let api_key = match read_byteplus_api_key(&credential_cache) {
    Ok(Some(api_key)) => api_key,
    _ => {
      ShowProviderLoginModalEvent::send_for_provider(GenerationProvider::Byteplus, &app);
      return Err("Add your BytePlus API key in Settings → Accounts.".into());
    }
  };

  let model = TauriVideoModel::Seedance2p5;
  let ark_model_id = byteplus_video_model_id(model)
    .ok_or("Seedance 2.5 isn't available through BytePlus.")?;

  let task_request = CreateVideoTaskRequest {
    model: ark_model_id.to_string(),
    content: vec![VideoContentItem::DraftTask { draft_task: DraftTaskRef { id: draft.draft_task_id.clone() } }],
    resolution: Some(FINAL_RESOLUTION.to_string()),
    ratio: None,
    duration: None,
    generate_audio: None,
    seed: None,
    camera_fixed: None,
    draft: None,
    watermark: false,
  };

  let task = create_video_task(&api_key, &task_request).await.map_err(|err| {
    warn!("Seedance final render was not created: {:?}", err);
    err.user_message()
  })?;

  info!("Seedance final render {} started from draft {}", task.id, draft.draft_task_id);

  let enqueue = TaskEnqueueSuccess {
    task_type: TaskType::VideoGeneration,
    model: Some(tauri_video_model_to_generation_model(model)),
    provider: GenerationProvider::Byteplus,
    provider_job_id: Some(task.id),
    maybe_queue_status_url: None,
    maybe_queue_response_url: None,
    maybe_prompt_token: draft.maybe_prompt_token.as_deref().map(PromptToken::new_from_str),
  };

  if let Err(err) = enqueue.insert_into_task_database(&task_database).await {
    error!("Failed to record the Seedance final render: {:?}", err);
    return Err("The final render started, but ArtCraft couldn't track it.".into());
  }

  GenerationEnqueueSuccessEvent {
    action: enqueue.to_frontend_event_action(),
    service: enqueue.to_frontend_event_service(),
    model: enqueue.model.clone(),
  }.send_infallible(&app);

  Ok(RenderSeedanceFinalResponse {}.into())
}
