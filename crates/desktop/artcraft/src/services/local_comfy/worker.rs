//! Runs queued local jobs on ComfyUI, then hands the results to ArtCraft like any third-party provider:
//! upload to the user's library, mark the task done, notify the frontend (same steps as the Grok image thread).

use std::io::Write;
use std::sync::Arc;
use std::time::{Duration, Instant};

use anyhow::anyhow;
use log::{error, info, warn};
use rand::random_range;
use reqwest::multipart::{Form, Part};
use reqwest::{Client, RequestBuilder, Response};
use serde_json::{json, Value};
use tauri::AppHandle;

use artcraft_api_defs::prompts::create_prompt::CreatePromptRequest;
use artcraft_api_defs::utils::media_links_to_thumbnail_template::media_links_to_thumbnail_template;
use artcraft_client::endpoints::media_files::get_media_file::get_media_file;
use artcraft_client::endpoints::media_files::upload_image_media_file_from_file::{upload_image_media_file_from_file, UploadImageFromFileArgs};
use artcraft_client::endpoints::prompts::create_prompt::create_prompt;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_media_file_class::TaskMediaFileClass;
use enums::tauri::tasks::task_status::TaskStatus;
use errors::AnyhowResult;
use sqlite_tasks::queries::get_task_by_provider_and_provider_job_id::{get_task_by_provider_and_provider_job_id, GetTaskByProviderAndProviderJobIdArgs};
use sqlite_tasks::queries::list_tasks_by_provider_and_status::{list_tasks_by_provider_and_status, ListTasksByProviderAndStatusArgs};
use sqlite_tasks::queries::task::Task;
use sqlite_tasks::queries::update_successful_task_status_with_metadata::{update_successful_task_status_with_metadata, UpdateSuccessfulTaskArgs};
use sqlite_tasks::queries::update_task_status_with_rich_failure::{update_task_status_with_rich_failure, UpdateTaskWithRichFailureArgs};
use tokens::tokens::batch_generations::BatchGenerationToken;
use uuid_utils::uuid::generate_random_uuid;

use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::functional_events::text_to_image_generation_complete_event::{GeneratedImage, TextToImageGenerationCompleteEvent};
use crate::core::events::generation_events::generation_complete_event::GenerationCompleteEvent;
use crate::core::events::generation_events::generation_failed_event::GenerationFailedEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::task_database::TaskDatabase;
use crate::core::utils::auto_download::{auto_download_task_bytes, clear_auto_download_checkpoint};
use crate::core::utils::enum_conversion::generation_provider::to_generation_service_provider;
use crate::core::utils::enum_conversion::task_model_type::to_generation_model;
use crate::core::utils::enum_conversion::task_type::to_generation_action;
use crate::core::utils::task_database_pending_statuses::TASK_DATABASE_PENDING_STATUSES;
use crate::services::local_comfy::config::{aspect_ratio_value, comfy_client_id, find_model, load_config, resolution_pixels, size_for, LocalModel};
use crate::services::local_comfy::queue::{mark_ready, take_receiver, LocalJob};
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;

/// Longest a single ComfyUI run may take (model loading included).
const RUN_TIMEOUT: Duration = Duration::from_secs(30 * 60);
const RUN_POLL_INTERVAL: Duration = Duration::from_millis(1_500);
/// The queue listing carries every queued workflow, so it is only checked every few polls.
const POLLS_PER_QUEUE_CHECK: u32 = 10;
/// Consecutive failed status checks after which a run counts as lost.
const MAX_FAILED_POLLS: u32 = 3;
const CONNECT_TIMEOUT: Duration = Duration::from_secs(10);
/// Per HTTP call (ComfyUI or CDN); a stalled call cannot block the worker forever.
const REQUEST_TIMEOUT: Duration = Duration::from_secs(120);
/// ComfyUI's "megapixels" inputs (e.g. ImageScaleToTotalPixels) count in units of 1024 x 1024 pixels.
const COMFY_MEGAPIXEL: f64 = 1024.0 * 1024.0;
/// Seeds stay below 2^48 so they survive JSON number handling everywhere.
const MAX_SEED: u64 = 1 << 48;
const INTERRUPTED_REASON: &str = "ArtCraft was closed before this local job finished";

/// Context shared by every job.
struct Worker {
  app: AppHandle,
  app_env_configs: AppEnvConfigs,
  app_data_root: AppDataRoot,
  task_database: TaskDatabase,
  storyteller_creds_manager: StorytellerCredentialManager,
  http: Client,
  /// Tags this install's runs in ComfyUI's queue.
  comfy_client_id: String,
}

enum Poll {
  Finished(Value),
  Waiting,
  Dropped,
}

#[derive(PartialEq, Eq)]
enum QueueState {
  Running,
  Pending,
  Absent,
}

/// One image produced by ComfyUI.
struct OutputImage {
  bytes: Vec<u8>,
  /// File extension ComfyUI used ("png", "webp", ...).
  extension: String,
}

pub async fn local_comfy_thread(
  app: AppHandle,
  app_env_configs: AppEnvConfigs,
  app_data_root: AppDataRoot,
  task_database: TaskDatabase,
  storyteller_creds_manager: StorytellerCredentialManager,
) {
  let Some(mut receiver) = take_receiver() else {
    error!("local model worker: already running");
    return;
  };
  let http = match Client::builder().connect_timeout(CONNECT_TIMEOUT).timeout(REQUEST_TIMEOUT).build() {
    Ok(http) => http,
    Err(err) => {
      error!("local model worker: cannot build the HTTP client: {}", err);
      return;
    }
  };
  let comfy_client_id = comfy_client_id(&app_data_root);
  let worker = Arc::new(Worker { app, app_env_configs, app_data_root, task_database, storyteller_creds_manager, http, comfy_client_id });
  worker.fail_interrupted_jobs().await;
  mark_ready();
  // Before the first job is taken, so a new run never queues behind one the last session left.
  worker.cancel_orphaned_runs().await;

  while let Some(job) = receiver.recv().await {
    // Each job runs in its own task, so a panic fails that job instead of stopping the worker.
    let runner = Arc::clone(&worker);
    let job_id = job.job_id.clone();
    let reason = match tokio::spawn(async move { runner.run_job(&job).await }).await {
      Ok(Ok(())) => continue,
      Ok(Err(err)) => err.to_string(),
      Err(join_error) => format!("internal error in the local model worker: {}", join_error),
    };
    error!("local model job {} failed: {}", job_id, reason);
    fail_job(&worker.app, &worker.task_database, &job_id, &reason).await;
  }
}

/// Marks the job's task failed (with the reason) and tells the frontend.
pub async fn fail_job(app: &AppHandle, task_database: &TaskDatabase, job_id: &str, reason: &str) {
  match find_task(task_database, job_id).await {
    Ok(Some(task)) => {
      record_failure(task_database, &task, reason).await;
      send_failed_event(app, &task, reason);
    }
    Ok(None) => error!("local model: no task for failed job {}", job_id),
    Err(err) => error!("local model: cannot look up the task for job {}: {:?}", job_id, err),
  }
}

impl Worker {
  /// Jobs only live in memory: tasks still pending from a previous run can never finish.
  async fn fail_interrupted_jobs(&self) {
    let pending = list_tasks_by_provider_and_status(ListTasksByProviderAndStatusArgs {
      db: self.task_database.get_connection(),
      provider: GenerationProvider::Local,
      task_statuses: &TASK_DATABASE_PENDING_STATUSES,
    }).await;
    let tasks = match pending {
      Ok(list) => list.tasks,
      Err(err) => {
        error!("local model worker: cannot list interrupted jobs: {:?}", err);
        return;
      }
    };
    for task in &tasks {
      record_failure(&self.task_database, task, INTERRUPTED_REASON).await;
      send_failed_event(&self.app, task, INTERRUPTED_REASON);
    }
  }

  /// Cancels the runs this app left in ComfyUI before it closed (recognised by their client id). Best effort.
  async fn cancel_orphaned_runs(&self) {
    let comfy = load_config(&self.app_data_root).comfy_url.trim_end_matches('/').to_string();
    let queue: Value = match self.comfy_send(&comfy, self.http.get(format!("{}/queue", comfy))).await {
      Ok(response) => response.json().await.unwrap_or_default(),
      Err(err) => {
        info!("local model worker: cannot check ComfyUI for runs left by the last session: {}", err);
        return;
      }
    };
    // Queue items are arrays: [number, prompt_id, prompt, extra_data, outputs].
    for (key, state) in [("queue_running", QueueState::Running), ("queue_pending", QueueState::Pending)] {
      let items = queue.get(key).and_then(Value::as_array).cloned().unwrap_or_default();
      let ours = items.iter()
          .filter(|item| item.pointer("/3/client_id").and_then(Value::as_str) == Some(self.comfy_client_id.as_str()))
          .filter_map(|item| item.get(1).and_then(Value::as_str));
      for prompt_id in ours {
        info!("local model worker: cancelling ComfyUI run {} left by the last session", prompt_id);
        self.comfy_cancel_in_state(&comfy, prompt_id, &state).await;
      }
    }
  }

  async fn run_job(&self, job: &LocalJob) -> AnyhowResult<()> {
    let (config, model) = find_model(&self.app_data_root, &job.model_id).ok_or_else(|| anyhow!("model {} is no longer configured", job.model_id))?;
    let comfy = config.comfy_url.trim_end_matches('/').to_string();
    let workflow = load_workflow(&model)?;

    let mut uploaded = Vec::new();
    for (i, token) in job.image_tokens.iter().enumerate() {
      let file = get_media_file(&self.app_env_configs.storyteller_host, token).await?;
      let bytes = self.http.get(file.media_file.media_links.cdn_url.as_str()).send().await?.error_for_status()?.bytes().await?;
      // One file per image input, overwritten by every job, so ComfyUI's input folder does not fill up.
      uploaded.push(self.comfy_upload(&comfy, &format!("artcraft_reference_{}.png", i + 1), bytes.to_vec()).await?);
    }

    // One ComfyUI run per requested image, each with its own seed. If a later run fails, the images already
    // generated are still published (like a failed upload, it is logged).
    let mut outputs = Vec::new();
    for run_index in 0..job.batch_size {
      let run = fill_workflow(workflow.clone(), &model, job, &uploaded)?;
      match self.comfy_run(&comfy, run, model.maybe_output_node.as_deref()).await {
        Ok(images) => outputs.extend(images),
        Err(err) if !outputs.is_empty() => {
          warn!("local model {}: run {} of {} failed, keeping {} image(s): {}", model.id, run_index + 1, job.batch_size, outputs.len(), err);
          break;
        }
        Err(err) => return Err(err),
      }
    }
    info!("local model {}: {} image(s) generated for job {}", model.id, outputs.len(), job.job_id);
    self.publish(job, outputs).await
  }

  async fn comfy_upload(&self, comfy: &str, name: &str, bytes: Vec<u8>) -> AnyhowResult<String> {
    let part = Part::bytes(bytes).file_name(name.to_string()).mime_str("image/png")?;
    let form = Form::new().part("image", part).text("overwrite", "true");
    let reply: Value = self.comfy_send(comfy, self.http.post(format!("{}/upload/image", comfy)).multipart(form)).await?.error_for_status()?.json().await?;
    let file = reply.get("name").and_then(Value::as_str).ok_or_else(|| anyhow!("ComfyUI upload: no name in {}", reply))?;
    Ok(match reply.get("subfolder").and_then(Value::as_str) {
      Some(sub) if !sub.is_empty() => format!("{}/{}", sub, file),
      _ => file.to_string(),
    })
  }

  /// Runs the workflow and returns its images. A run ComfyUI drops (deleted from its queue, or a restart) fails fast;
  /// whenever waiting fails (timeout, lost connection, ...), the run is cancelled so it cannot hold up the next job.
  async fn comfy_run(&self, comfy: &str, workflow: Value, maybe_output_node: Option<&str>) -> AnyhowResult<Vec<OutputImage>> {
    let prompt_id = self.comfy_submit(comfy, workflow).await?;
    let result = self.comfy_collect(comfy, &prompt_id, maybe_output_node).await;
    if result.is_err() {
      self.comfy_cancel(comfy, &prompt_id).await;
    }
    result
  }

  /// Queues the workflow; returns its prompt id. ComfyUI answers a refused workflow with JSON details, and an
  /// internal error with plain text: both become a short reason.
  async fn comfy_submit(&self, comfy: &str, workflow: Value) -> AnyhowResult<String> {
    let submit = self.http.post(format!("{}/prompt", comfy)).json(&json!({ "prompt": workflow, "client_id": self.comfy_client_id }));
    let response = self.comfy_send(comfy, submit).await?;
    let status = response.status();
    let body = response.text().await?;
    let Ok(reply) = serde_json::from_str::<Value>(&body) else {
      return Err(anyhow!("ComfyUI error {}: {}", status, body.lines().next().unwrap_or_default().trim()));
    };
    let prompt_id = reply.get("prompt_id").and_then(Value::as_str)
        .ok_or_else(|| anyhow!("ComfyUI refused the workflow: {}", refusal_summary(&reply)))?;
    // ComfyUI still queues a workflow when only some of its outputs are invalid; a partly broken workflow is refused.
    if reply.get("node_errors").and_then(Value::as_object).is_some_and(|errors| !errors.is_empty()) {
      self.comfy_cancel(comfy, prompt_id).await;
      return Err(anyhow!("ComfyUI refused part of the workflow: {}", refusal_summary(&reply)));
    }
    Ok(prompt_id.to_string())
  }

  async fn comfy_collect(&self, comfy: &str, prompt_id: &str, maybe_output_node: Option<&str>) -> AnyhowResult<Vec<OutputImage>> {
    let started = Instant::now();
    let mut polls = 0;
    let mut failed_polls = 0;
    let entry = loop {
      if started.elapsed() > RUN_TIMEOUT {
        return Err(anyhow!("ComfyUI run timed out after {} minutes", RUN_TIMEOUT.as_secs() / 60));
      }
      tokio::time::sleep(RUN_POLL_INTERVAL).await;
      polls += 1;
      match self.comfy_poll(comfy, prompt_id, polls).await {
        Ok(Poll::Finished(entry)) => break entry,
        Ok(Poll::Waiting) => failed_polls = 0,
        Ok(Poll::Dropped) => return Err(anyhow!("ComfyUI dropped the run (was it cancelled, or ComfyUI restarted?)")),
        // A slow or dropped status request is not a failed run: only several in a row are.
        Err(err) if failed_polls + 1 < MAX_FAILED_POLLS => {
          failed_polls += 1;
          warn!("local model: ComfyUI status check {} of {} failed: {}", failed_polls, MAX_FAILED_POLLS, err);
        }
        Err(err) => return Err(err),
      }
    };
    if entry.pointer("/status/status_str").and_then(Value::as_str) == Some("error") {
      return Err(anyhow!("ComfyUI run failed: {}", execution_error_summary(&entry)));
    }

    let mut images = Vec::new();
    let outputs = entry.get("outputs").and_then(Value::as_object).cloned().unwrap_or_default();
    for (node, out) in outputs {
      if maybe_output_node.is_some_and(|wanted| wanted != node) {
        continue;
      }
      for img in out.get("images").and_then(Value::as_array).cloned().unwrap_or_default() {
        let kind = img.get("type").and_then(Value::as_str).unwrap_or_default();
        // Without a named output node, previews ("temp") are not results.
        if maybe_output_node.is_none() && kind != "output" {
          continue;
        }
        let filename = img.get("filename").and_then(Value::as_str).unwrap_or_default();
        let subfolder = img.get("subfolder").and_then(Value::as_str).unwrap_or_default();
        let view = self.http.get(format!("{}/view", comfy)).query(&[("filename", filename), ("subfolder", subfolder), ("type", kind)]);
        let bytes = self.comfy_send(comfy, view).await?.error_for_status()?.bytes().await?;
        let extension = filename.rsplit_once('.').map_or("png", |(_, ext)| ext).to_ascii_lowercase();
        images.push(OutputImage { bytes: bytes.to_vec(), extension });
      }
    }
    if images.is_empty() {
      return Err(anyhow!("ComfyUI returned no image (check the model's output_node)"));
    }
    Ok(images)
  }

  /// One status check: the history entry once the run is over; every few polls, whether ComfyUI still has the run.
  async fn comfy_poll(&self, comfy: &str, prompt_id: &str, poll: u32) -> AnyhowResult<Poll> {
    if let Some(entry) = self.comfy_history(comfy, prompt_id).await? {
      return Ok(Poll::Finished(entry));
    }
    if poll % POLLS_PER_QUEUE_CHECK != 0 || self.comfy_queue_state(comfy, prompt_id).await? != QueueState::Absent {
      return Ok(Poll::Waiting);
    }
    // ComfyUI writes the history before it leaves the queue, so look at the history once more before giving up.
    Ok(match self.comfy_history(comfy, prompt_id).await? {
      Some(entry) => Poll::Finished(entry),
      None => Poll::Dropped,
    })
  }

  /// The finished (or failed) run's history entry; None while it is still queued or running.
  async fn comfy_history(&self, comfy: &str, prompt_id: &str) -> AnyhowResult<Option<Value>> {
    let history: Value = self.comfy_send(comfy, self.http.get(format!("{}/history/{}", comfy, prompt_id))).await?.json().await?;
    let Some(entry) = history.get(prompt_id) else { return Ok(None) };
    let finished = entry.pointer("/status/completed").and_then(Value::as_bool) == Some(true)
        || entry.pointer("/status/status_str").and_then(Value::as_str) == Some("error");
    Ok(finished.then(|| entry.clone()))
  }

  async fn comfy_queue_state(&self, comfy: &str, prompt_id: &str) -> AnyhowResult<QueueState> {
    let queue: Value = self.comfy_send(comfy, self.http.get(format!("{}/queue", comfy))).await?.json().await?;
    // Queue items are arrays: [number, prompt_id, prompt, extra_data, outputs].
    let listed = |key: &str| queue.get(key).and_then(Value::as_array)
        .is_some_and(|items| items.iter().any(|item| item.get(1).and_then(Value::as_str) == Some(prompt_id)));
    Ok(if listed("queue_running") {
      QueueState::Running
    } else if listed("queue_pending") {
      QueueState::Pending
    } else {
      QueueState::Absent
    })
  }

  /// Takes the run out of ComfyUI: deleted while pending, interrupted while running (an interrupt is never sent
  /// otherwise, since older ComfyUI versions interrupt whatever is running). Best effort.
  async fn comfy_cancel(&self, comfy: &str, prompt_id: &str) {
    match self.comfy_queue_state(comfy, prompt_id).await {
      Ok(state) => self.comfy_cancel_in_state(comfy, prompt_id, &state).await,
      Err(err) => warn!("local model: could not cancel ComfyUI run {}: {}", prompt_id, err),
    }
  }

  async fn comfy_cancel_in_state(&self, comfy: &str, prompt_id: &str, state: &QueueState) {
    let request = match state {
      QueueState::Pending => self.http.post(format!("{}/queue", comfy)).json(&json!({ "delete": [prompt_id] })),
      QueueState::Running => self.http.post(format!("{}/interrupt", comfy)).json(&json!({ "prompt_id": prompt_id })),
      QueueState::Absent => return,
    };
    if let Err(err) = self.comfy_send(comfy, request).await {
      warn!("local model: could not cancel ComfyUI run {}: {}", prompt_id, err);
    }
  }

  /// Sends a ComfyUI request; an unreachable or stalled server becomes an error the user can act on.
  async fn comfy_send(&self, comfy: &str, request: RequestBuilder) -> AnyhowResult<Response> {
    request.send().await.map_err(|err| {
      if err.is_connect() || err.is_timeout() {
        anyhow!("Cannot reach ComfyUI at {}. Is it running?", comfy)
      } else {
        err.into()
      }
    })
  }

  /// Uploads the results to the user's library, completes the task, saves the results if the user turned on
  /// automatic downloads, and notifies the frontend. Once the task is complete, later steps only log their errors.
  async fn publish(&self, job: &LocalJob, images: Vec<OutputImage>) -> AnyhowResult<()> {
    let host = &self.app_env_configs.storyteller_host;
    // Looked up first, so a missing task fails the job before anything is added to the library.
    let task = find_task(&self.task_database, &job.job_id).await?.ok_or_else(|| anyhow!("no task for local job {}", job.job_id))?;
    let creds = self.storyteller_creds_manager.get_credentials()?
        .ok_or_else(|| anyhow!("not logged in to ArtCraft: local results cannot be added to the library"))?;

    // No provider / model type is sent to the API: "local" exists only in this app.
    let prompt = create_prompt(host, Some(&creds), CreatePromptRequest {
      uuid_idempotency_token: generate_random_uuid(),
      positive_prompt: Some(job.prompt.clone()),
      negative_prompt: job.maybe_negative_prompt.clone(),
      model_type: None,
      generation_provider: None,
      maybe_generation_mode: None,
      maybe_aspect_ratio: None,
      maybe_resolution: None,
      maybe_batch_count: None,
      maybe_generate_audio: None,
      maybe_duration_seconds: None,
    }).await?;

    let batch_token = BatchGenerationToken::generate();
    let mut generated = Vec::new();
    let mut saved = Vec::new();
    for (i, image) in images.iter().enumerate() {
      let mut file = self.app_data_root.temp_dir().new_named_temp_file_with_extension(&image.extension)?;
      file.write_all(&image.bytes)?;
      file.flush()?;
      let uploaded = upload_image_media_file_from_file(UploadImageFromFileArgs {
        api_host: host,
        maybe_creds: Some(&creds),
        path: file.path(),
        is_intermediate_system_file: false,
        maybe_prompt_token: Some(&prompt.prompt_token),
        maybe_batch_token: Some(&batch_token),
        maybe_generation_provider: None,
      }).await;
      let token = match uploaded {
        Ok(ok) => ok.media_file_token,
        Err(err) => {
          warn!("local model: upload {} of {} failed: {}", i + 1, images.len(), err);
          continue;
        }
      };
      match get_media_file(host, &token).await {
        Ok(file) => {
          saved.push((file.media_file.media_links.cdn_url.clone(), image.bytes.as_slice()));
          generated.push(GeneratedImage {
            media_token: token,
            maybe_thumbnail_template: media_links_to_thumbnail_template(&file.media_file.media_links).map(str::to_string),
            cdn_url: file.media_file.media_links.cdn_url,
          });
        }
        Err(err) => warn!("local model: uploaded {} but cannot read it back: {}", token.as_str(), err),
      }
    }
    let primary = generated.first().ok_or_else(|| anyhow!("no local result could be added to the library"))?;

    let updated = update_successful_task_status_with_metadata(UpdateSuccessfulTaskArgs {
      db: self.task_database.get_connection(),
      task_id: &task.id,
      maybe_batch_token: Some(&batch_token),
      maybe_primary_media_file_token: Some(&primary.media_token),
      maybe_primary_media_file_class: Some(TaskMediaFileClass::Image),
      maybe_primary_media_file_thumbnail_url_template: primary.maybe_thumbnail_template.as_deref(),
      maybe_primary_media_file_cdn_url: Some(primary.cdn_url.as_str()),
    }).await?;
    if !updated {
      return Ok(());
    }

    if let Err(err) = auto_download_task_bytes(&self.app, &task, &saved).await {
      warn!("local model: results of task {} were not downloaded: {}", task.id.as_str(), err);
    }
    clear_auto_download_checkpoint(&self.app, &task);
    GenerationCompleteEvent {
      action: Some(to_generation_action(task.task_type)),
      service: to_generation_service_provider(task.provider),
      model: task.model_type.clone().and_then(to_generation_model),
    }.send_infallible(&self.app);
    TextToImageGenerationCompleteEvent {
      generated_images: generated,
      maybe_frontend_subscriber_id: task.frontend_subscriber_id.clone(),
      maybe_frontend_subscriber_payload: task.frontend_subscriber_payload.clone(),
    }.send_infallible(&self.app);
    Ok(())
  }
}

fn load_workflow(model: &LocalModel) -> AnyhowResult<Value> {
  let text = std::fs::read_to_string(&model.workflow).map_err(|e| anyhow!("cannot read workflow {:?}: {}", model.workflow, e))?;
  Ok(serde_json::from_str(&text)?)
}

/// The workflow with this job's prompt, a fresh seed, the reference images, and the picker size written in.
fn fill_workflow(mut workflow: Value, model: &LocalModel, job: &LocalJob, uploaded: &[String]) -> AnyhowResult<Value> {
  if uploaded.len() != model.images.len() {
    return Err(anyhow!("{} takes {} image(s), got {}", model.name, model.images.len(), uploaded.len()));
  }
  if let Some(b) = &model.maybe_prompt {
    set_input(&mut workflow, b, json!(job.prompt))?;
  }
  // Without a negative prompt in the request (the image pages have none), the workflow's own text stays.
  if let (Some(b), Some(negative)) = (&model.maybe_negative_prompt, &job.maybe_negative_prompt) {
    set_input(&mut workflow, b, json!(negative))?;
  }
  if let Some(b) = &model.maybe_seed {
    set_input(&mut workflow, b, json!(random_range(0..MAX_SEED)))?;
  }
  for (b, name) in model.images.iter().zip(uploaded) {
    set_input(&mut workflow, b, json!(name))?;
  }
  apply_size(&mut workflow, model, job)?;
  Ok(workflow)
}

/// Picker aspect ratio + resolution -> the workflow's size inputs. Unset or "auto" keeps the workflow's own value.
fn apply_size(workflow: &mut Value, model: &LocalModel, job: &LocalJob) -> AnyhowResult<()> {
  let maybe_pixels = job.maybe_resolution.map(resolution_pixels);
  if let (Some(pixels), Some(b)) = (maybe_pixels, &model.maybe_megapixels) {
    set_input(workflow, b, json!(pixels / COMFY_MEGAPIXEL))?;
  }
  let (Some(wb), Some(hb)) = (&model.maybe_width, &model.maybe_height) else { return Ok(()) };
  let maybe_ratio = job.maybe_aspect_ratio.and_then(aspect_ratio_value);
  if maybe_ratio.is_none() && maybe_pixels.is_none() {
    return Ok(());
  }
  let current = |b: &(String, String)| workflow.pointer(&format!("/{}/inputs/{}", b.0, b.1)).and_then(Value::as_f64);
  let (w0, h0) = (current(wb).unwrap_or(1024.0), current(hb).unwrap_or(1024.0));
  let (w, h) = size_for(maybe_ratio.unwrap_or(w0 / h0), maybe_pixels.unwrap_or(w0 * h0));
  set_input(workflow, wb, json!(w))?;
  set_input(workflow, hb, json!(h))
}

fn set_input(workflow: &mut Value, binding: &(String, String), value: Value) -> AnyhowResult<()> {
  let node = workflow.get_mut(&binding.0).ok_or_else(|| anyhow!("workflow has no node {}", binding.0))?;
  let inputs = node.get_mut("inputs").and_then(Value::as_object_mut).ok_or_else(|| anyhow!("node {} has no inputs", binding.0))?;
  inputs.insert(binding.1.clone(), value);
  Ok(())
}

async fn find_task(task_database: &TaskDatabase, job_id: &str) -> AnyhowResult<Option<Task>> {
  Ok(get_task_by_provider_and_provider_job_id(GetTaskByProviderAndProviderJobIdArgs {
    db: task_database.get_connection(),
    provider: GenerationProvider::Local,
    provider_job_id: job_id,
  }).await?)
}

async fn record_failure(task_database: &TaskDatabase, task: &Task, reason: &str) {
  info!("local model: task {} failed: {}", task.id.as_str(), reason);
  let result = update_task_status_with_rich_failure(UpdateTaskWithRichFailureArgs {
    db: task_database.get_connection(),
    task_id: &task.id,
    status: TaskStatus::CompleteFailure,
    maybe_failure_type: None,
    maybe_failure_message: Some(reason),
  }).await;
  if let Err(err) = result {
    error!("local model: cannot mark task {} failed: {:?}", task.id.as_str(), err);
  }
}

fn send_failed_event(app: &AppHandle, task: &Task, reason: &str) {
  GenerationFailedEvent {
    action: to_generation_action(task.task_type),
    service: to_generation_service_provider(task.provider),
    model: task.model_type.clone().and_then(to_generation_model),
    reason: Some(reason.to_string()),
  }.send_infallible(app);
}

/// ComfyUI's reason for refusing a workflow, short enough for a toast: the error and the first node error.
fn refusal_summary(reply: &Value) -> String {
  let message = reply.pointer("/error/message").and_then(Value::as_str).unwrap_or("no reason given");
  let node_error = reply.get("node_errors").and_then(Value::as_object).and_then(|nodes| nodes.iter().next())
      .and_then(|(node, details)| {
        let error = details.pointer("/errors/0")?;
        let text = error.get("details").and_then(Value::as_str).filter(|d| !d.is_empty())
            .or_else(|| error.get("message").and_then(Value::as_str))?;
        Some(format!(" (node {}: {})", node, text))
      });
  format!("{}{}", message, node_error.unwrap_or_default())
}

/// Why a run failed, from its history entry's status messages ([event, data] pairs).
fn execution_error_summary(entry: &Value) -> String {
  let messages = entry.pointer("/status/messages").and_then(Value::as_array).cloned().unwrap_or_default();
  let event = |name: &str| messages.iter().find(|m| m.get(0).and_then(Value::as_str) == Some(name)).and_then(|m| m.get(1)).cloned();
  if let Some(data) = event("execution_error") {
    let text = data.get("exception_message").and_then(Value::as_str).unwrap_or_default().trim();
    let node = data.get("node_type").and_then(Value::as_str).unwrap_or("a node");
    return format!("{} failed: {}", node, text);
  }
  if event("execution_interrupted").is_some() {
    return "the run was interrupted in ComfyUI".to_string();
  }
  "see the ComfyUI console".to_string()
}

#[cfg(test)]
mod tests {
  use super::*;
  use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
  use enums::common::generation::common_resolution::CommonResolution;

  mod fill_workflow_tests {
    use super::*;

    #[test]
    fn writes_size_seed_and_images() {
      let filled = fill_workflow(workflow(), &model(), &job(Some(CommonAspectRatio::WideSixteenByNine), Some(CommonResolution::OneK)), &refs()).unwrap();
      assert_eq!(filled["2"]["inputs"]["width"], 1360);
      assert_eq!(filled["2"]["inputs"]["height"], 768);
      assert_eq!(filled["3"]["inputs"]["image"], "ref.png");
      assert_eq!(filled["4"]["inputs"]["megapixels"], 1.0);
      assert!(filled["1"]["inputs"]["seed"].as_u64().unwrap() < MAX_SEED);
    }

    #[test]
    fn keeps_the_workflow_size_for_auto() {
      let kept = fill_workflow(workflow(), &model(), &job(Some(CommonAspectRatio::Auto), None), &refs()).unwrap();
      assert_eq!(kept["2"]["inputs"]["width"], 1024);
      assert_eq!(kept["4"]["inputs"]["megapixels"], 2.5);
    }

    #[test]
    fn refuses_missing_reference_images() {
      assert!(fill_workflow(workflow(), &model(), &job(None, None), &[]).is_err());
    }

    #[test]
    fn keeps_the_workflow_negative_prompt_unless_one_is_sent() {
      let mut model = model();
      model.maybe_negative_prompt = Some(("5".into(), "text".into()));
      let mut workflow = workflow();
      workflow["5"] = json!({ "inputs": { "text": "blurry" } });

      let kept = fill_workflow(workflow.clone(), &model, &job(None, None), &refs()).unwrap();
      assert_eq!(kept["5"]["inputs"]["text"], "blurry");

      let mut with_negative = job(None, None);
      with_negative.maybe_negative_prompt = Some("text, watermark".into());
      let replaced = fill_workflow(workflow, &model, &with_negative, &refs()).unwrap();
      assert_eq!(replaced["5"]["inputs"]["text"], "text, watermark");
    }
  }

  mod error_summary_tests {
    use super::*;

    #[test]
    fn refusal_names_the_first_node_error() {
      let reply = json!({
        "error": { "message": "Prompt outputs failed validation" },
        "node_errors": { "1": { "errors": [{ "message": "Value not in list", "details": "unet_name: 'x' not in []" }] } },
      });
      assert_eq!(refusal_summary(&reply), "Prompt outputs failed validation (node 1: unet_name: 'x' not in [])");
    }

    #[test]
    fn run_failures_name_the_cause() {
      let failed = json!({ "status": { "messages": [
        ["execution_start", {}],
        ["execution_error", { "node_type": "KSampler", "exception_message": " out of memory\n" }],
      ] } });
      assert_eq!(execution_error_summary(&failed), "KSampler failed: out of memory");

      let interrupted = json!({ "status": { "messages": [["execution_interrupted", {}]] } });
      assert_eq!(execution_error_summary(&interrupted), "the run was interrupted in ComfyUI");
    }
  }

  fn model() -> LocalModel {
    serde_json::from_value(json!({
      "id": "local_t", "name": "T", "workflow": "w.json", "seed": ["1", "seed"], "images": [["3", "image"]],
      "width": ["2", "width"], "height": ["2", "height"], "megapixels": ["4", "megapixels"],
    })).unwrap()
  }

  fn workflow() -> Value {
    json!({
      "1": { "inputs": {} }, "2": { "inputs": { "width": 1024, "height": 1024 } }, "3": { "inputs": {} },
      "4": { "inputs": { "megapixels": 2.5 } },
    })
  }

  fn job(maybe_aspect_ratio: Option<CommonAspectRatio>, maybe_resolution: Option<CommonResolution>) -> LocalJob {
    LocalJob {
      job_id: "j".into(), model_id: "local_t".into(), prompt: "p".into(), maybe_negative_prompt: None,
      image_tokens: vec![], batch_size: 1,
      maybe_aspect_ratio, maybe_resolution,
    }
  }

  fn refs() -> Vec<String> {
    vec!["ref.png".to_string()]
  }
}
