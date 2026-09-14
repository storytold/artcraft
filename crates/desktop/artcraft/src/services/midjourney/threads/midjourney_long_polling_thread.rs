use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::task_database::TaskDatabase;
use crate::core::utils::task_database_pending_statuses::TASK_DATABASE_PENDING_STATUSES;
use crate::services::midjourney::state::midjourney_credential_manager::{MidjourneyCredentialManager, MidjourneySession};
use crate::services::midjourney::threads::upload_midjourney_batch::upload_midjourney_batch;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use enums::common::generation_provider::GenerationProvider;
use errors::AnyhowResult;
use midjourney_client::client::websocket::midjourney_websocket::MidjourneyWebSocket;
use midjourney_client::client::websocket::midjourney_ws_event::MidjourneyWsEvent;
use midjourney_client::client::websocket::open_midjourney_websocket::{open_midjourney_websocket, OpenMidjourneyWebSocketRequest};
use midjourney_client::endpoints::imagine::{imagine, ImagineArgs, ImagineItem, ImagineRequest};
use midjourney_client::recipes::get_user_info::{get_user_info, GetUserInfoArgs};
use midjourney_client::utils::image_downloader_client::ImageDownloaderClient;
use sqlite_tasks::queries::list_tasks_by_provider_and_status::{list_tasks_by_provider_and_status, ListTasksByProviderAndStatusArgs};
use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tauri::AppHandle;
use tokio::sync::broadcast::{error::TryRecvError, Receiver};
use tokio::time::timeout;

const RESCAN_INTERVAL: Duration = Duration::from_secs(3);
const FEED_INTERVAL: Duration = Duration::from_secs(15);
const SOCKET_RETRY_INTERVAL: Duration = Duration::from_secs(60);
const REQUEST_TIMEOUT: Duration = Duration::from_secs(20);

struct CompletionWorker {
  maybe_socket: Option<SocketSession>,
  completed: HashSet<String>,
  feed: HashMap<String, ImagineItem>,
  next_feed: Instant,
  next_socket_attempt: Instant,
}

struct SocketSession {
  credential_id: String,
  socket: MidjourneyWebSocket,
  events: Receiver<Arc<MidjourneyWsEvent>>,
  subscribed: HashSet<String>,
}

/// One completion owner consumes both websocket notifications and the HTTP
/// feed. HTTP reconciliation runs even while the socket is connected, covering
/// missed frames and jobs enqueued before a restart or before subscription.
pub async fn midjourney_long_polling_thread(app_handle: AppHandle, app_env_configs: AppEnvConfigs, app_data_root: AppDataRoot, task_database: TaskDatabase, credentials: MidjourneyCredentialManager, storyteller: StorytellerCredentialManager) -> ! {
  let mut worker = CompletionWorker { maybe_socket: None, completed: HashSet::new(), feed: HashMap::new(), next_feed: Instant::now(), next_socket_attempt: Instant::now() };
  loop {
    if let Err(err) = worker.tick(Some(&app_handle), &app_env_configs, &app_data_root, &task_database, &credentials, &storyteller).await {
      log::warn!("Midjourney completion polling failed: {}", err);
      tokio::time::sleep(FEED_INTERVAL).await;
    }
    tokio::time::sleep(RESCAN_INTERVAL).await;
  }
}

impl CompletionWorker {
  async fn tick(&mut self, maybe_app: Option<&AppHandle>, config: &AppEnvConfigs, root: &AppDataRoot, database: &TaskDatabase, credentials: &MidjourneyCredentialManager, storyteller: &StorytellerCredentialManager) -> AnyhowResult<()> {
    let tasks = list_tasks_by_provider_and_status(ListTasksByProviderAndStatusArgs { db: database.get_connection(), provider: GenerationProvider::Midjourney, task_statuses: &TASK_DATABASE_PENDING_STATUSES }).await?.tasks;
    if tasks.is_empty() {
      self.close_socket();
      self.feed.clear();
      self.completed.clear();
      self.next_feed = Instant::now();
      return Ok(());
    }
    let Some(session) = credentials.session().await? else {
      self.close_socket();
      return Ok(());
    };
    if self.maybe_socket.as_ref().is_some_and(|socket| socket.credential_id != session.credential_id || !socket.socket.is_connected()) {
      self.close_socket();
    }
    let pending: HashSet<String> = tasks.iter().filter_map(|task| task.provider_job_id.clone()).collect();
    self.completed.retain(|job| pending.contains(job));
    self.feed.retain(|job, _| pending.contains(job));
    self.drain_events(&pending);

    if Instant::now() >= self.next_feed {
      self.next_feed = Instant::now() + FEED_INTERVAL;
      match timeout(REQUEST_TIMEOUT, imagine(ImagineArgs { request: ImagineRequest { user_id: &session.user_id, page_size: None }, cookie_header: &session.cookie_header, hostname: None, browser: Some(session.browser.clone()) })).await {
        Ok(Ok(response)) => {
          for item in response.items {
            if let Some(id) = item.id.clone().filter(|id| pending.contains(id)) {
              self.feed.insert(id, item);
            }
          }
        },
        other => log::warn!("Midjourney HTTP reconciliation failed: {:?}", other),
      }
    }

    if self.maybe_socket.is_none() && Instant::now() >= self.next_socket_attempt {
      self.next_socket_attempt = Instant::now() + SOCKET_RETRY_INTERVAL;
      // Resolve a fresh websocket token independently of the cached JWT user
      // ID. Knowing the ID alone must not skip this index-page request.
      match timeout(REQUEST_TIMEOUT, open_socket(&session)).await {
        Ok(Ok(socket)) => self.maybe_socket = Some(socket),
        _ => log::debug!("Midjourney websocket unavailable; HTTP polling remains active"),
      }
    }
    if let Some(socket) = self.maybe_socket.as_mut() {
      socket.subscribed.retain(|job| pending.contains(job));
      for id in &pending {
        if !socket.subscribed.contains(id) && socket.socket.subscribe_to_job(id).is_ok() {
          socket.subscribed.insert(id.clone());
        }
      }
    }
    let Some(storyteller_credentials) = storyteller.get_credentials()? else {
      return Ok(());
    };
    let downloader = ImageDownloaderClient::create(Some(session.browser))?;
    for task in &tasks {
      let Some(id) = task.provider_job_id.as_deref() else {
        continue;
      };
      if !self.completed.contains(id) && !self.feed.contains_key(id) {
        continue;
      }
      match upload_midjourney_batch(maybe_app, config, root, database, &storyteller_credentials, &downloader, id, task, self.feed.get(id)).await {
        Ok(()) => {
          self.completed.remove(id);
          self.feed.remove(id);
        },
        Err(err) => log::warn!("Midjourney result upload for {} will be retried: {}", id, err),
      }
    }
    Ok(())
  }

  fn drain_events(&mut self, pending: &HashSet<String>) {
    let Some(socket) = self.maybe_socket.as_mut() else {
      return;
    };
    loop {
      match socket.events.try_recv() {
        Ok(event) => {
          if let MidjourneyWsEvent::Completed { job_id, .. } = event.as_ref() {
            if pending.contains(job_id) {
              self.completed.insert(job_id.clone());
            }
          }
        },
        Err(TryRecvError::Lagged(_)) => self.next_feed = Instant::now(),
        Err(TryRecvError::Empty | TryRecvError::Closed) => break,
      }
    }
  }

  fn close_socket(&mut self) {
    if let Some(socket) = self.maybe_socket.take() {
      socket.socket.close();
    }
  }
}

async fn open_socket(session: &MidjourneySession) -> AnyhowResult<SocketSession> {
  let info = get_user_info(GetUserInfoArgs { cookie_header: &session.cookie_header, hostname: None, browser: Some(session.browser.clone()) }).await?;
  let token = info.websocket_token.ok_or_else(|| anyhow::anyhow!("No Midjourney websocket token"))?;
  let socket = open_midjourney_websocket(OpenMidjourneyWebSocketRequest { websocket_token: &token, user_id: session.user_id.clone(), hostname: None, browser: Some(session.browser.clone()) }).await?;
  let events = socket.events();
  Ok(SocketSession { credential_id: session.credential_id.clone(), socket, events, subscribed: HashSet::new() })
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::core::commands::generate::generate_image::providers::midjourney::handle_midjourney::handle_midjourney;
  use crate::core::commands::generate::generate_image::tauri_generate_image_request::TauriGenerateImageRequest;
  use crate::services::midjourney::state::midjourney_credential::MidjourneyCredential;
  use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
  use artcraft_client::endpoints::media_files::list_batch_generated_redux_media_files::list_batch_generated_redux_media_files;
  use artcraft_client::utils::api_host::ApiHost;
  use enums::tauri::tasks::task_status::TaskStatus;
  use sqlite_tasks::queries::list_tasks_for_frontend::list_tasks_for_frontend;

  /// Opt-in live test: submits ONE paid Midjourney job and uploads its four
  /// results. An explicit scratch data root is required and reused on retry,
  /// so rerunning after a polling/upload failure never submits another job.
  #[ignore = "requires explicit authorization, live account cookies, and network access"]
  #[tokio::test]
  async fn midjourney_live_full_flow() -> AnyhowResult<()> {
    let root = AppDataRoot::create_existing(std::env::var("ARTCRAFT_MIDJOURNEY_TEST_ROOT")?)?;
    let target = root.credentials_dir().get_midjourney_credential_path();
    if !target.exists() {
      let source = std::env::var("ARTCRAFT_MIDJOURNEY_TEST_COOKIES")?;
      MidjourneyCredential::load(std::path::Path::new(&source))?.save(&target)?;
    }
    let credentials = MidjourneyCredentialManager::initialize_from_disk_infallible(&root);
    let header = std::fs::read_to_string(std::env::var("ARTCRAFT_TEST_BACKEND_COOKIES")?)?;
    let storyteller_credentials = StorytellerCredentialSet::parse_multi_cookie_header(header.trim())?.ok_or_else(|| anyhow::anyhow!("No ArtCraft backend cookies"))?;
    let storyteller = StorytellerCredentialManager::initialize_empty(&root);
    storyteller.set_credentials(&storyteller_credentials)?;
    let config = AppEnvConfigs { storyteller_host: ApiHost::Storyteller };
    let database = TaskDatabase::connect(&root).await?;
    let session = credentials.session().await?.ok_or_else(|| anyhow::anyhow!("Midjourney login required"))?;
    println!("Midjourney credential loaded and refreshed; source credential unchanged");
    let maybe_socket = match timeout(REQUEST_TIMEOUT, open_socket(&session)).await {
      Ok(Ok(socket)) => {
        println!("Midjourney websocket handshake succeeded");
        Some(socket)
      },
      Ok(Err(err)) => {
        println!("Midjourney websocket unavailable: {}; testing HTTP fallback", err);
        None
      },
      Err(_) => {
        println!("Midjourney websocket connection timed out; testing HTTP fallback");
        None
      },
    };
    let mut maybe_events = maybe_socket.as_ref().map(|socket| socket.socket.events());
    if list_tasks_for_frontend(database.get_connection()).await?.tasks.is_empty() {
      let request: TauriGenerateImageRequest = serde_json::from_value(serde_json::json!({
        "model": "midjourney_8", "provider": "midjourney", "batch_size": 4,
        "prompt": "A small wooden sailboat on a calm blue lake, soft morning light, watercolor illustration",
        "aspect_ratio": "wide_sixteen_by_nine",
        "frontend_caller": "text_to_image", "frontend_subscriber_id": "midjourney-live-test",
      }))?;
      let success = handle_midjourney(&request, &config, &credentials, &storyteller).await.map_err(|err| anyhow::anyhow!("Midjourney enqueue failed: {:?}", err))?;
      let task_id = success.insert_into_task_database_with_frontend_payload(&database, request.frontend_caller, request.frontend_subscriber_id.as_deref(), None).await?;
      println!("Enqueued Midjourney job {} as task {}", success.provider_job_id.as_deref().unwrap_or_default(), task_id.as_str());
    } else {
      println!("Resuming existing live-test task; no new generation submitted");
    }
    let mut worker = CompletionWorker { maybe_socket, completed: HashSet::new(), feed: HashMap::new(), next_feed: Instant::now(), next_socket_attempt: Instant::now() + SOCKET_RETRY_INTERVAL };
    let deadline = Instant::now() + Duration::from_secs(360);
    let mut websocket_completed = false;
    loop {
      worker.tick(None, &config, &root, &database, &credentials, &storyteller).await?;
      if let Some(events) = maybe_events.as_mut() {
        while let Ok(event) = events.try_recv() {
          if matches!(event.as_ref(), MidjourneyWsEvent::Completed { .. }) {
            websocket_completed = true;
          }
        }
      }
      let tasks = list_tasks_for_frontend(database.get_connection()).await?.tasks;
      let task = tasks.first().ok_or_else(|| anyhow::anyhow!("No live-test task"))?;
      if task.status == TaskStatus::CompleteSuccess {
        let batch = task.on_complete_batch_token.as_ref().ok_or_else(|| anyhow::anyhow!("Missing completed batch"))?;
        let files = list_batch_generated_redux_media_files(&config.storyteller_host, Some(&storyteller_credentials), batch).await?;
        assert_eq!(files.media_files.len(), 4, "all four results must be uploaded");
        assert!(task.on_complete_primary_media_file_cdn_url.is_some());
        assert_eq!(task.provider, Some(GenerationProvider::Midjourney));
        let job_id = task.provider_job_id.as_deref().unwrap();
        // Independently exercise the recovery feed even when websocket won.
        let feed = imagine(ImagineArgs { request: ImagineRequest { user_id: &session.user_id, page_size: None }, cookie_header: &session.cookie_header, hostname: None, browser: Some(session.browser.clone()) }).await?;
        assert!(feed.items.iter().any(|item| item.id.as_deref() == Some(job_id)), "HTTP feed must find the completed job");
        println!("Live flow succeeded: websocket_completed={}, HTTP reconciliation verified, batch={}, uploaded_files={}", websocket_completed, batch.as_str(), files.media_files.len());
        for file in files.media_files {
          let prompt = file.maybe_prompt_token.as_ref().ok_or_else(|| anyhow::anyhow!("Uploaded image has no prompt attribution"))?;
          let prompt: serde_json::Value = reqwest::Client::new().get(format!("{}/v1/prompts/{}", config.storyteller_host.to_api_hostname_and_scheme(), prompt.as_str())).header("Cookie", storyteller_credentials.maybe_as_cookie_header().unwrap_or_default()).send().await?.error_for_status()?.json().await?;
          assert_eq!(prompt["prompt"]["maybe_generation_provider"], "midjourney");
          assert_eq!(prompt["prompt"]["maybe_model_type"], "midjourney_8");
          println!("Uploaded result: {} {}; backend prompt provider=midjourney model=midjourney_8", file.token.as_str(), file.media_links.cdn_url);
        }
        worker.close_socket();
        return Ok(());
      }
      if Instant::now() >= deadline {
        anyhow::bail!("Timed out waiting for Midjourney completion; rerun to resume the same task")
      }
      tokio::time::sleep(RESCAN_INTERVAL).await;
    }
  }
}
