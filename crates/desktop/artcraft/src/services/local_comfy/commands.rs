//! Hooks used by the existing image commands: list the local models, price them at zero, and enqueue a job.

use log::{error, info};
use serde_json::{json, Map, Value};
use tauri::{AppHandle, Manager};
use tokens::tokens::media_files::MediaFileToken;
use uuid_utils::uuid::generate_random_uuid;

use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_resolution::CommonResolution;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;

use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::generate::models::image::response_types::{
  ListImageModelsAspectRatio, ListImageModelsImageModel, ListImageModelsModelDetails, ListImageModelsProvider,
  ListImageModelsProviderDetails, ListImageModelsProviderModelDetails, ListImageModelsResolution, ListImageModelsResponse,
};
use crate::core::commands::generate::omni::dispatch::{
  command_error, insert_enqueued_task, local_error, require_credentials, resolve_image_inputs, send_enqueue_success,
};
use crate::core::commands::generate::omni::{OmniRequest, OmniResponse, OmniResult};
use crate::core::commands::response::failure_response_wrapper::{CommandErrorResponseWrapper, CommandErrorStatus};
use crate::core::events::generation_events::common::GenerationModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::task_database::TaskDatabase;
use crate::services::local_comfy::config::{find_model, is_local_model, load_config, LocalModel};
use crate::services::local_comfy::queue::{enqueue, wait_until_ready, LocalJob};
use crate::services::local_comfy::worker::fail_job;

const MAX_PROMPT_LENGTH: u16 = 4000;
const MASK_FIELDS: [&str; 2] = ["inpainting_mask_image_media_token", "inpainting_mask_image_raw_bytes"];

pub fn is_local_request(request: &OmniRequest) -> bool {
  matches!(request.provider, Some(GenerationProvider::Local)) || request.model().is_some_and(is_local_model)
}

/// Adds the configured local models to the catalog the frontend builds its model picker from.
pub fn append_local_models(mut response: ListImageModelsResponse, root: &AppDataRoot) -> ListImageModelsResponse {
  let config = load_config(root);
  if config.models.is_empty() {
    return response;
  }
  let offered = config.models.iter().map(|m| {
    response.models.push(model_details(m));
    ListImageModelsProviderModelDetails { model: ListImageModelsImageModel::Unknown(m.id.clone()), overrides: None }
  }).collect();
  response.providers.push(ListImageModelsProviderDetails {
    provider: ListImageModelsProvider::Unknown(GenerationProvider::Local.to_str().to_string()),
    models: offered,
  });
  response
}

/// Local generation costs no ArtCraft credits.
pub fn free_estimate() -> OmniResult {
  Ok(OmniResponse(json!({
    "success": true, "cost_in_credits": 0, "cost_in_usd_cents": 0,
    "is_free": true, "is_unlimited": true, "is_rate_limited": false, "has_watermark": false,
  })).into())
}

/// Records the task, then queues the job for the worker (in that order, so the worker always finds the task).
/// Reference images are resolved like an Omni request: raw canvas/scene bytes are uploaded to the library first.
pub async fn generate_local_image(request: OmniRequest, app: &AppHandle) -> OmniResult {
  let model_id = request.model().unwrap_or_default();
  let Some((_, model)) = find_model(&app.state::<AppDataRoot>(), model_id) else {
    return Err(bad_request(format!("Local model '{}' is not in the local models file", model_id)));
  };
  if MASK_FIELDS.iter().any(|key| request.fields.get(*key).is_some_and(|v| !v.is_null())) {
    return Err(bad_request(format!("{} does not support inpainting masks", model.name)));
  }
  wait_until_ready().await.map_err(local_error)?;
  let creds = require_credentials(app).await?;
  let host = &app.state::<AppEnvConfigs>().storyteller_host;

  // Counted without credentials first (presence only), so a refused request uploads nothing.
  // The canvas and scene images fill the first image inputs, so they count against the same total.
  let mut counted = request.fields.clone();
  resolve_image_inputs(&mut counted, None, host).await?;
  let image_count = image_tokens(&counted).len();
  if image_count != model.images.len() {
    return Err(bad_request(format!(
      "{} takes {} image(s) (canvas and scene included), got {}", model.name, model.images.len(), image_count)));
  }
  let mut fields = request.fields.clone();
  resolve_image_inputs(&mut fields, Some(&creds), host).await?;

  let job = LocalJob {
    job_id: generate_random_uuid(),
    model_id: model.id.clone(),
    prompt: str_field(&request, "prompt").unwrap_or_default(),
    maybe_negative_prompt: str_field(&request, "negative_prompt"),
    image_tokens: image_tokens(&fields),
    batch_size: request.fields.get("batch_size").and_then(Value::as_u64).unwrap_or(1).clamp(1, model.max_batch_size() as u64) as u32,
    // Only values the model offers: a value kept from another model's picker could ask for any size.
    maybe_aspect_ratio: str_field(&request, "aspect_ratio").and_then(|name| CommonAspectRatio::from_str(&name).ok())
        .filter(|value| model.aspect_ratio_options().is_some_and(|offered| offered.contains(value))),
    maybe_resolution: str_field(&request, "resolution").and_then(|name| CommonResolution::from_str(&name).ok())
        .filter(|value| model.resolution_options().is_some_and(|offered| offered.contains(value))),
  };

  let success = TaskEnqueueSuccess {
    task_type: TaskType::ImageGeneration,
    model: Some(GenerationModel::Unknown(model.id.clone())),
    provider: GenerationProvider::Local,
    provider_job_id: Some(job.job_id.clone()),
    maybe_queue_status_url: None,
    maybe_queue_response_url: None,
    maybe_prompt_token: None,
  };
  insert_enqueued_task(app, &request, &success).await
      .map_err(|err| local_error(format!("Could not record the local job: {:?}", err)))?;

  // Announced before the hand-off, so a job that fails at once never reports its failure before its start.
  send_enqueue_success(app, success);
  info!("local model {}: queued job {} ({} reference images)", model.id, job.job_id, job.image_tokens.len());
  let job_id = job.job_id.clone();
  if let Err(err) = enqueue(job) {
    error!("local model {}: {}", model.id, err);
    fail_job(app, &app.state::<TaskDatabase>(), &job_id, &err.to_string()).await;
  }
  Ok(OmniResponse(json!({ "success": true })).into())
}

fn model_details(m: &LocalModel) -> ListImageModelsModelDetails {
  ListImageModelsModelDetails {
    model: ListImageModelsImageModel::Unknown(m.id.clone()),
    model_creator: None,
    full_name: Some(m.name.clone()),
    text_prompt_supported: Some(m.maybe_prompt.is_some()),
    text_prompt_max_length: Some(MAX_PROMPT_LENGTH),
    negative_text_prompt_supported: Some(m.maybe_negative_prompt.is_some()),
    negative_text_prompt_max_length: m.maybe_negative_prompt.as_ref().map(|_| MAX_PROMPT_LENGTH),
    image_refs_supported: Some(!m.images.is_empty()),
    image_refs_max: Some(m.images.len() as u16),
    has_fixed_editing_aspect_ratio: None,
    aspect_ratio_options: m.aspect_ratio_options().map(|o| o.into_iter().map(aspect_ratio_item).collect()),
    aspect_ratio_default: m.aspect_ratio_default().map(aspect_ratio_item),
    aspect_ratio_default_when_editing: None,
    resolution_options: m.resolution_options().map(|o| o.into_iter().map(resolution_item).collect()),
    resolution_default: m.resolution_default().map(resolution_item),
    quality_options: None,
    default_quality: None,
    batch_size_min: Some(1),
    batch_size_max: Some(m.max_batch_size()),
    batch_size_options: Some((1..=m.max_batch_size()).collect()),
    batch_size_default: Some(1),
    is_disabled: Some(false),
  }
}

fn image_tokens(fields: &Map<String, Value>) -> Vec<MediaFileToken> {
  fields.get("image_media_tokens").and_then(Value::as_array)
      .map(|items| items.iter().filter_map(Value::as_str).map(MediaFileToken::new_from_str).collect())
      .unwrap_or_default()
}

fn str_field(request: &OmniRequest, key: &str) -> Option<String> {
  request.fields.get(key).and_then(Value::as_str).map(|s| s.trim().to_string()).filter(|s| !s.is_empty())
}

fn bad_request(message: String) -> CommandErrorResponseWrapper<String, ()> {
  command_error(CommandErrorStatus::BadRequest, "local_model", message)
}

// The catalog's option types keep unknown values as strings, which is how the frontend receives them anyway.
fn aspect_ratio_item(aspect_ratio: CommonAspectRatio) -> ListImageModelsAspectRatio {
  ListImageModelsAspectRatio::Unknown(aspect_ratio.to_str().to_string())
}

fn resolution_item(resolution: CommonResolution) -> ListImageModelsResolution {
  ListImageModelsResolution::Unknown(resolution.to_str().to_string())
}
