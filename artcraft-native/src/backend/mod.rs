//! Everything that talks to the ArtCraft API. Calls run on a tokio runtime and report back as
//! [`Event`]s, which the UI drains once per frame; nothing here blocks the UI thread.

pub mod audio;
pub mod media_cache;
pub mod session;
pub mod video;
pub mod wire;

use std::future::Future;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc::{Receiver, Sender, channel};
use std::sync::{Arc, RwLock};
use std::time::Duration;

use artcraft_api_defs::users::login_challenges::LoginChallengeState;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::endpoints::credits::get_session_credits::get_session_credits;
use artcraft_client::endpoints::media_files::delete_media_file::delete_media_file;
use artcraft_client::endpoints::media_files::upload_image_media_file_from_bytes::{ImageType, UploadImageBytesArgs, upload_image_media_file_from_bytes};
use artcraft_client::endpoints::media_files::upload_image_media_file_from_file::{UploadImageFromFileArgs, upload_image_media_file_from_file};
use artcraft_client::endpoints::media_files::upload_video_media_file_from_file::{UploadVideoFromFileArgs, upload_video_media_file_from_file};
use artcraft_client::endpoints::omni_gen::models::image::omni_gen_list_image_models::{OmniGenListImageModelsArgs, omni_gen_list_image_models};
use artcraft_client::endpoints::omni_gen::models::video::omni_gen_list_video_models::{OmniGenListVideoModelsArgs, omni_gen_list_video_models};
use artcraft_client::endpoints::users::password_login::PasswordLoginRequest;
use artcraft_client::error::api_error::ApiError;
use artcraft_client::error::storyteller_error::StorytellerError;
use artcraft_client::utils::api_host::ApiHost;
use artcraft_client::utils::basic_json_post_request::basic_json_post_request;
use artcraft_client::utils::login_challenge_client::{LoginChallengeClient, LoginChallengeClientError};
use enums::common::payments_namespace::PaymentsNamespace;
use log::{error, warn};
use serde::de::DeserializeOwned;
use serde_json::{Map, Value};
use tokens::tokens::media_files::MediaFileToken;

use crate::feed::types::MediaKind;
use crate::models::{self, ModelInfo};
use session::Credentials;
use wire::{BatchMedia, CharactersPage, MediaFile, PromptResponse, SessionInfo, SessionJobs, SessionUser, UploadResponse, UserMediaList};

/// Items per library page (`useGalleryData`'s `PAGE_SIZE`).
pub const LIBRARY_PAGE_SIZE: u32 = 40;
/// Model listings are retried a few times before giving up (`list_*_models_command`).
const MODEL_LIST_ATTEMPTS: u32 = 3;
const MODEL_LIST_BACKOFF: Duration = Duration::from_millis(250);
/// The share link base (`SHARE_URL_BASE`).
pub const SHARE_URL_BASE: &str = "https://getartcraft.com/media/";
/// Characters are made for this model (the Tauri app's `CharactersModal`).
const CHARACTER_MODEL: &str = "seedance_2p0";
/// Sent on every request (`artcraft_client_identity::ARTCRAFT_DESKTOP_USER_AGENT`).
const USER_AGENT: &str = "storyteller-client/1.0";

/// Which media an operation is for (OmniGen's modality in the URL).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum Modality {
  Image,
  Video,
}

impl Modality {
  fn path(self) -> &'static str {
    match self {
      Modality::Image => "image",
      Modality::Video => "video",
    }
  }
}

impl From<MediaKind> for Modality {
  fn from(kind: MediaKind) -> Self {
    match kind {
      MediaKind::Image => Modality::Image,
      MediaKind::Video => Modality::Video,
    }
  }
}

/// A result coming back from the backend.
pub enum Event {
  /// The session check finished: `Some` when signed in.
  Session(Option<SessionUser>),
  LoginFailed(String),
  /// A browser sign-in started: show the code while we wait.
  DeviceLogin {
    url: String,
    code: String,
  },
  Credits(u64),
  Models(Modality, Result<Vec<ModelInfo>, String>),
  /// A cost estimate for the request identified by `key`.
  Cost {
    key: String,
    credits: Option<u64>,
  },
  Enqueued {
    modality: Modality,
    job_tokens: Vec<String>,
    meta: EnqueueMeta,
  },
  EnqueueFailed {
    modality: Modality,
    message: String,
  },
  Uploaded {
    ref_id: u64,
    result: Result<UploadedMedia, String>,
  },
  Jobs(Vec<wire::Job>),
  LibraryPage {
    key: String,
    page: u32,
    items: Vec<MediaFile>,
    total_pages: u32,
  },
  LibraryFailed {
    key: String,
    message: String,
  },
  Batch {
    job_token: String,
    items: Vec<MediaFile>,
  },
  Prompt(wire::Prompt),
  /// The user's characters, newest first.
  Characters(Vec<wire::Character>),
  /// A character is being made by job `job_token`.
  CharacterCreating {
    job_token: String,
    name: String,
  },
  CharacterChanged,
  Deleted(String),
  Saved(PathBuf),
  Toast {
    error: bool,
    message: String,
  },
}

/// What the UI remembers about a request it just sent, to label the pending card.
#[derive(Clone, Debug)]
pub struct EnqueueMeta {
  pub prompt: String,
  pub model_id: String,
  pub batch_count: u32,
  pub ref_image: Option<String>,
}

/// A finished upload: the media token, plus what the server knows about the file.
#[derive(Clone, Debug)]
pub struct UploadedMedia {
  pub token: String,
  pub duration_secs: f32,
  pub thumbnail: Option<String>,
  pub full_url: Option<String>,
}

pub struct Backend {
  rt: tokio::runtime::Runtime,
  ctx: egui::Context,
  tx: Sender<Event>,
  rx: Receiver<Event>,
  host: ApiHost,
  root: PathBuf,
  creds: Arc<RwLock<Option<Credentials>>>,
  http: reqwest::Client,
  device_login_cancel: Arc<AtomicBool>,
}

impl Backend {
  pub fn new(ctx: egui::Context) -> Self {
    let rt = tokio::runtime::Builder::new_multi_thread().worker_threads(4).thread_name("artcraft-io").enable_all().build().expect("tokio runtime");
    let (tx, rx) = channel();
    let root = session::data_root();
    let host = session::api_host(&root);
    let creds = session::load(&root);
    let http = reqwest::Client::builder().user_agent(USER_AGENT).gzip(true).timeout(Duration::from_secs(60)).build().unwrap_or_default();
    Self { rt, ctx, tx, rx, host, root, creds: Arc::new(RwLock::new(creds)), http, device_login_cancel: Arc::new(AtomicBool::new(false)) }
  }

  pub fn runtime(&self) -> tokio::runtime::Handle {
    self.rt.handle().clone()
  }

  /// A plain HTTP client for CDN downloads (thumbnails, files).
  pub fn http(&self) -> reqwest::Client {
    self.http.clone()
  }

  pub fn data_root(&self) -> &Path {
    &self.root
  }

  /// Events that arrived since the last call.
  pub fn drain(&self) -> Vec<Event> {
    self.rx.try_iter().collect()
  }

  // --- Session -----------------------------------------------------------------------------

  /// Checks who's signed in (`GET /v1/session`), then fetches their credits.
  pub fn refresh_session(&self) {
    let api = self.api();
    self.spawn(move |tx| async move {
      if api.creds.is_none() {
        let _ = tx.send(Event::Session(None));
        return;
      }
      match api.get_json::<SessionInfo>("/v1/session").await {
        Ok(info) if info.logged_in => {
          let _ = tx.send(Event::Session(info.user));
          api.send_credits(&tx).await;
        },
        Ok(_) => {
          let _ = tx.send(Event::Session(None));
        },
        Err(err) => {
          warn!("Session check failed: {err}");
          let _ = tx.send(Event::Session(None));
          let _ = tx.send(Event::Toast { error: true, message: format!("Couldn't reach ArtCraft: {err}") });
        },
      }
    });
  }

  pub fn refresh_credits(&self) {
    let api = self.api();
    self.spawn(move |tx| async move { api.send_credits(&tx).await });
  }

  /// Signs in with a username (or email) and password (`POST /v1/login`).
  pub fn login_with_password(&self, username_or_email: String, password: String) {
    let (host, root, creds, ctx) = (self.host.clone(), self.root.clone(), self.creds.clone(), self.ctx.clone());
    let this = self.handle();
    self.spawn(move |tx| async move {
      let result = async {
        let client = LoginChallengeClient::new(&host).map_err(login_error)?;
        let (response, set_cookie) = client.password_login(&PasswordLoginRequest { username_or_email, password }).await.map_err(login_error)?;
        response.signed_session.filter(|s| !s.is_empty()).or_else(|| set_cookie.as_deref().and_then(session_from_set_cookie)).ok_or_else(|| "The server didn't return a session.".to_owned())
      }
      .await;
      match result {
        Ok(session) => {
          store_session(&root, &creds, session);
          this.refresh_session();
        },
        Err(message) => {
          let _ = tx.send(Event::LoginFailed(message));
        },
      }
      ctx.request_repaint();
    });
  }

  /// Signs in through the browser: shows a code, opens the approval page, and waits.
  pub fn login_with_browser(&self) {
    self.device_login_cancel.store(false, Ordering::Relaxed);
    let (host, root, creds, cancel) = (self.host.clone(), self.root.clone(), self.creds.clone(), self.device_login_cancel.clone());
    let this = self.handle();
    self.spawn(move |tx| async move {
      let client = match LoginChallengeClient::new(&host) {
        Ok(c) => c,
        Err(err) => {
          let _ = tx.send(Event::LoginFailed(login_error(err)));
          return;
        },
      };
      let challenge = match client.create().await {
        Ok(c) => c,
        Err(err) => {
          let _ = tx.send(Event::LoginFailed(login_error(err)));
          return;
        },
      };
      let _ = tx.send(Event::DeviceLogin { url: challenge.verification_url.clone(), code: challenge.confirmation_code.clone() });
      if let Err(err) = open::that(&challenge.verification_url) {
        warn!("Couldn't open the browser: {err}");
      }
      let interval = Duration::from_secs(u64::from(challenge.poll_interval_seconds.max(1)));
      loop {
        tokio::time::sleep(interval).await;
        if cancel.load(Ordering::Relaxed) {
          return;
        }
        if chrono::Utc::now() > challenge.expires_at {
          let _ = tx.send(Event::LoginFailed("The sign-in code expired. Please try again.".to_owned()));
          return;
        }
        match client.poll(&challenge.device_token).await {
          Ok(result) => {
            let signed = result.response.maybe_signed_session.or_else(|| result.session_set_cookie.as_deref().and_then(session_from_set_cookie));
            if let Some(session) = signed {
              store_session(&root, &creds, session);
              this.refresh_session();
              return;
            }
            if result.response.status == LoginChallengeState::Failed {
              let _ = tx.send(Event::LoginFailed("Sign-in was declined or failed.".to_owned()));
              return;
            }
          },
          Err(err) => warn!("Login poll failed: {}", login_error(err)),
        }
      }
    });
  }

  pub fn cancel_browser_login(&self) {
    self.device_login_cancel.store(true, Ordering::Relaxed);
  }

  /// Signs out on the server (best effort) and forgets the session here.
  pub fn logout(&self) {
    let api = self.api();
    let (root, creds) = (self.root.clone(), self.creds.clone());
    if let Ok(mut c) = creds.write() {
      *c = None;
    }
    session::delete(&root);
    self.spawn(move |tx| async move {
      if let Some(set) = api.creds.as_ref() {
        let result: Result<Value, _> = basic_json_post_request(&api.host, "/v1/logout", Some(set), serde_json::json!({})).await;
        if let Err(err) = result {
          warn!("Logout request failed: {err}");
        }
      }
      let _ = tx.send(Event::Session(None));
    });
  }

  // --- Models and costs --------------------------------------------------------------------

  /// Fetches the OmniGen model listing for `modality`.
  pub fn load_models(&self, modality: Modality) {
    let host = self.host.clone();
    self.spawn(move |tx| async move {
      let mut last_err = String::new();
      for attempt in 0..MODEL_LIST_ATTEMPTS {
        if attempt > 0 {
          tokio::time::sleep(MODEL_LIST_BACKOFF).await;
        }
        let result = match modality {
          Modality::Image => omni_gen_list_image_models(OmniGenListImageModelsArgs { api_host: &host, maybe_creds: None, provider: None }).await.map(|r| r.models.iter().map(models::image_model).collect::<Vec<_>>()),
          Modality::Video => omni_gen_list_video_models(OmniGenListVideoModelsArgs { api_host: &host, maybe_creds: None, provider: None }).await.map(|r| r.models.iter().map(models::video_model).collect::<Vec<_>>()),
        };
        match result {
          Ok(models) => {
            let _ = tx.send(Event::Models(modality, Ok(models)));
            return;
          },
          Err(err) => last_err = api_message(&err),
        }
      }
      error!("Listing {modality:?} models failed: {last_err}");
      let _ = tx.send(Event::Models(modality, Err(last_err)));
    });
  }

  /// Asks what a request would cost (`POST /v1/omni_gen/cost/{modality}`).
  pub fn estimate_cost(&self, modality: Modality, key: String, fields: Map<String, Value>) {
    let api = self.api();
    self.spawn(move |tx| async move {
      let path = format!("/v1/omni_gen/cost/{}", modality.path());
      let credits = match basic_json_post_request::<_, Value>(&api.host, &path, api.creds.as_ref(), fields).await {
        Ok(response) => response.get("cost_in_credits").and_then(Value::as_u64),
        Err(err) => {
          warn!("Cost estimate failed: {}", api_message(&err));
          None
        },
      };
      let _ = tx.send(Event::Cost { key, credits });
    });
  }

  /// Starts a generation (`POST /v1/omni_gen/generate/{modality}`).
  pub fn generate(&self, modality: Modality, mut fields: Map<String, Value>, meta: EnqueueMeta) {
    let api = self.api();
    self.spawn(move |tx| async move {
      let Some(creds) = api.creds.as_ref() else {
        let _ = tx.send(Event::EnqueueFailed { modality, message: "Please sign in to generate.".to_owned() });
        return;
      };
      fields.entry("idempotency_token").or_insert_with(|| Value::String(uuid::Uuid::new_v4().to_string()));
      let path = format!("/v1/omni_gen/generate/{}", modality.path());
      match basic_json_post_request::<_, Value>(&api.host, &path, Some(creds), fields).await {
        Ok(response) => {
          let tokens = job_tokens(&response);
          if tokens.is_empty() {
            let _ = tx.send(Event::EnqueueFailed { modality, message: "The server didn't start a job.".to_owned() });
          } else {
            let _ = tx.send(Event::Enqueued { modality, job_tokens: tokens, meta });
          }
          api.send_credits(&tx).await;
        },
        Err(err) => {
          let _ = tx.send(Event::EnqueueFailed { modality, message: api_message(&err) });
        },
      }
    });
  }

  // --- Uploads -----------------------------------------------------------------------------

  /// Uploads a reference file from disk; images, MP4 videos and audio.
  pub fn upload_file(&self, ref_id: u64, kind: crate::prompt_box::refs::RefKind, path: PathBuf) {
    use crate::prompt_box::refs::RefKind;
    let api = self.api();
    self.spawn(move |tx| async move {
      let token = match kind {
        RefKind::Image => upload_image_media_file_from_file(UploadImageFromFileArgs { api_host: &api.host, maybe_creds: api.creds.as_ref(), path: &path, is_intermediate_system_file: true, maybe_prompt_token: None, maybe_generation_provider: None, maybe_batch_token: None }).await.map(|r| r.media_file_token.to_string()).map_err(|e| api_message(&e)),
        RefKind::Video => upload_video_media_file_from_file(UploadVideoFromFileArgs { api_host: &api.host, maybe_creds: api.creds.as_ref(), path: &path, maybe_prompt_token: None, maybe_generation_provider: None }).await.map(|r| r.media_file_token.to_string()).map_err(|e| api_error_message(&e)),
        RefKind::Audio => api.upload_audio(&path).await,
      };
      let result = match token {
        Ok(token) => Ok(api.describe_upload(token).await),
        Err(message) => Err(message),
      };
      let _ = tx.send(Event::Uploaded { ref_id, result });
    });
  }

  /// Uploads a pasted image (PNG bytes).
  pub fn upload_png(&self, ref_id: u64, png: Vec<u8>) {
    let api = self.api();
    self.spawn(move |tx| async move {
      let result = upload_image_media_file_from_bytes(UploadImageBytesArgs { api_host: &api.host, maybe_creds: api.creds.as_ref(), image_bytes: png, image_type: ImageType::Png, is_intermediate_system_file: true, maybe_generation_provider: None }).await;
      let result = match result {
        Ok(r) => Ok(api.describe_upload(r.media_file_token.to_string()).await),
        Err(err) => Err(api_message(&err)),
      };
      let _ = tx.send(Event::Uploaded { ref_id, result });
    });
  }

  // --- Feed --------------------------------------------------------------------------------

  /// Polls the session's recent jobs (`GET /v1/jobs/session`).
  pub fn poll_jobs(&self) {
    let api = self.api();
    if api.creds.is_none() {
      return;
    }
    self.spawn(move |tx| async move {
      match api.get_json::<SessionJobs>("/v1/jobs/session").await {
        Ok(jobs) => {
          let _ = tx.send(Event::Jobs(jobs.jobs));
        },
        Err(err) => warn!("Polling jobs failed: {err}"),
      }
    });
  }

  /// Loads one page of the user's library, filtered to `classes` (e.g. `image`, `video`).
  pub fn load_library(&self, key: String, username: String, classes: &'static str, page: u32) {
    let api = self.api();
    self.spawn(move |tx| async move {
      let path = format!("/v1/media_files/list/user/{username}?filter_media_classes={classes}&page_size={LIBRARY_PAGE_SIZE}&page_index={page}");
      match api.get_json::<UserMediaList>(&path).await {
        Ok(list) => {
          let total_pages = list.pagination.map_or(0, |p| p.total_page_count);
          let items = list.results.into_iter().filter(|m| m.media_type != "scene_json" && m.origin_category != "upload").collect();
          let _ = tx.send(Event::LibraryPage { key, page, items, total_pages });
        },
        Err(message) => {
          let _ = tx.send(Event::LibraryFailed { key, message });
        },
      }
    });
  }

  /// Lists every file a batch job produced.
  pub fn load_batch(&self, job_token: String, batch_token: String) {
    let api = self.api();
    self.spawn(move |tx| async move {
      match api.get_json::<BatchMedia>(&format!("/v1/media_files/batch_gen_redux/{batch_token}")).await {
        Ok(batch) => {
          let _ = tx.send(Event::Batch { job_token, items: batch.media_files });
        },
        Err(err) => warn!("Loading batch {batch_token} failed: {err}"),
      }
    });
  }

  /// Fetches the prompt record behind a generation (for Recreate and the list view).
  pub fn load_prompt(&self, prompt_token: String) {
    let api = self.api();
    self.spawn(move |tx| async move {
      match api.get_json::<PromptResponse>(&format!("/v1/prompts/{prompt_token}")).await {
        Ok(r) if r.success => {
          let _ = tx.send(Event::Prompt(r.prompt));
        },
        Ok(_) => warn!("Prompt {prompt_token} not found"),
        Err(err) => warn!("Loading prompt {prompt_token} failed: {err}"),
      }
    });
  }

  /// Loads every page of the user's characters.
  pub fn load_characters(&self) {
    let api = self.api();
    if api.creds.is_none() {
      return;
    }
    self.spawn(move |tx| async move {
      let mut all = Vec::new();
      let mut cursor: Option<i64> = None;
      loop {
        let path = match cursor {
          Some(c) => format!("/v1/characters/session?cursor={c}"),
          None => "/v1/characters/session".to_owned(),
        };
        match api.request_json::<CharactersPage>(reqwest::Method::GET, &path, None).await {
          Ok(page) => {
            all.extend(page.characters);
            match page.next_cursor {
              Some(next) if Some(next) != cursor => cursor = Some(next),
              _ => break,
            }
          },
          Err(err) => {
            warn!("Loading characters failed: {err}");
            break;
          },
        }
      }
      let _ = tx.send(Event::Characters(all));
    });
  }

  /// Starts making a character from an uploaded reference image (`POST /v1/character/create`).
  pub fn create_character(&self, image_token: String, name: String, description: Option<String>) {
    let api = self.api();
    self.spawn(move |tx| async move {
      let body = serde_json::json!({ "image_media_token": image_token, "model": CHARACTER_MODEL, "uuid_idempotency_token": uuid::Uuid::new_v4().to_string(), "character_name": name, "character_description": description });
      match api.request_json::<Value>(reqwest::Method::POST, "/v1/character/create", Some(body)).await {
        Ok(r) => match r.get("inference_job_token").and_then(Value::as_str) {
          Some(job) => {
            let _ = tx.send(Event::CharacterCreating { job_token: job.to_owned(), name });
          },
          None => {
            let _ = tx.send(Event::Toast { error: true, message: "Failed to create character".to_owned() });
          },
        },
        Err(err) => {
          let _ = tx.send(Event::Toast { error: true, message: if err.is_empty() { "Failed to create character".to_owned() } else { err } });
        },
      }
    });
  }

  /// Renames or re-describes a character (`POST /v1/character/edit`).
  pub fn edit_character(&self, token: String, name: String, description: String) {
    let api = self.api();
    self.spawn(move |tx| async move {
      let body = serde_json::json!({ "token": token, "updated_name": name, "updated_description": description });
      match api.request_json::<Value>(reqwest::Method::POST, "/v1/character/edit", Some(body)).await {
        Ok(_) => {
          let _ = tx.send(Event::Toast { error: false, message: "Character updated".to_owned() });
          let _ = tx.send(Event::CharacterChanged);
        },
        Err(err) => {
          let _ = tx.send(Event::Toast { error: true, message: format!("Failed to update character: {err}") });
        },
      }
    });
  }

  /// `DELETE /v1/character/{token}`.
  pub fn delete_character(&self, token: String, name: String) {
    let api = self.api();
    self.spawn(move |tx| async move {
      match api.request_json::<Value>(reqwest::Method::DELETE, &format!("/v1/character/{token}"), None).await {
        Ok(_) => {
          let _ = tx.send(Event::Toast { error: false, message: format!("Character \"{name}\" deleted") });
          let _ = tx.send(Event::CharacterChanged);
        },
        Err(err) => {
          let _ = tx.send(Event::Toast { error: true, message: format!("Failed to delete character: {err}") });
        },
      }
    });
  }

  pub fn delete_media(&self, token: String) {
    let api = self.api();
    self.spawn(move |tx| async move {
      match delete_media_file(&api.host, api.creds.as_ref(), &MediaFileToken::new(token.clone())).await {
        Ok(_) => {
          let _ = tx.send(Event::Deleted(token));
          let _ = tx.send(Event::Toast { error: false, message: "File deleted.".to_owned() });
        },
        Err(err) => {
          let _ = tx.send(Event::Toast { error: true, message: format!("Couldn't delete: {}", api_message(&err)) });
        },
      }
    });
  }

  /// Downloads `url` to `path`.
  pub fn save_url(&self, url: String, path: PathBuf) {
    let http = self.http.clone();
    self.spawn(move |tx| async move {
      let result = async {
        let bytes = http.get(&url).send().await.and_then(|r| r.error_for_status()).map_err(|e| e.to_string())?.bytes().await.map_err(|e| e.to_string())?;
        tokio::fs::write(&path, &bytes).await.map_err(|e| e.to_string())
      }
      .await;
      match result {
        Ok(()) => {
          let _ = tx.send(Event::Saved(path));
        },
        Err(err) => {
          let _ = tx.send(Event::Toast { error: true, message: format!("File download failed: {err}") });
        },
      }
    });
  }

  // --- Plumbing ----------------------------------------------------------------------------

  fn api(&self) -> Api {
    let creds = self.creds.read().ok().and_then(|c| c.as_ref().map(Credentials::to_set));
    Api { host: self.host.clone(), creds, http: self.http.clone() }
  }

  /// A cheap handle for tasks that need to call back into the backend.
  fn handle(&self) -> BackendHandle {
    BackendHandle { host: self.host.clone(), creds: self.creds.clone(), http: self.http.clone(), tx: self.tx.clone(), ctx: self.ctx.clone(), rt: self.rt.handle().clone() }
  }

  fn spawn<F, Fut>(&self, task: F)
  where
    F: FnOnce(Sender<Event>) -> Fut + Send + 'static,
    Fut: Future<Output = ()> + Send + 'static,
  {
    let (tx, ctx) = (self.tx.clone(), self.ctx.clone());
    self.rt.spawn(async move {
      task(tx).await;
      ctx.request_repaint();
    });
  }
}

/// Enough of the backend to refresh the session from inside a task.
#[derive(Clone)]
struct BackendHandle {
  host: ApiHost,
  creds: Arc<RwLock<Option<Credentials>>>,
  http: reqwest::Client,
  tx: Sender<Event>,
  ctx: egui::Context,
  rt: tokio::runtime::Handle,
}

impl BackendHandle {
  fn refresh_session(&self) {
    let creds = self.creds.read().ok().and_then(|c| c.as_ref().map(Credentials::to_set));
    let api = Api { host: self.host.clone(), creds, http: self.http.clone() };
    let (tx, ctx) = (self.tx.clone(), self.ctx.clone());
    self.rt.spawn(async move {
      match api.get_json::<SessionInfo>("/v1/session").await {
        Ok(info) if info.logged_in => {
          let _ = tx.send(Event::Session(info.user));
          api.send_credits(&tx).await;
        },
        Ok(_) => {
          let _ = tx.send(Event::LoginFailed("The session wasn't accepted. Please try again.".to_owned()));
        },
        Err(err) => {
          let _ = tx.send(Event::LoginFailed(err));
        },
      }
      ctx.request_repaint();
    });
  }
}

/// One request's worth of host, credentials and HTTP client.
struct Api {
  host: ApiHost,
  creds: Option<StorytellerCredentialSet>,
  http: reqwest::Client,
}

impl Api {
  /// A GET with the desktop app's identity headers and cookies, decoded leniently.
  async fn get_json<T: DeserializeOwned>(&self, path: &str) -> Result<T, String> {
    self.request_json(reqwest::Method::GET, path, None).await
  }

  /// Any JSON call with the desktop app's identity headers and cookies, decoded leniently.
  async fn request_json<T: DeserializeOwned>(&self, method: reqwest::Method, path: &str, body: Option<Value>) -> Result<T, String> {
    let url = format!("{}{path}", self.host.to_api_hostname_and_scheme());
    let mut request = self.http.request(method, &url).header("Accept", "application/json").header("Origin", self.host.request_origin());
    if let Some(body) = body {
      request = request.json(&body);
    }
    if let Some(cookie) = self.creds.as_ref().and_then(StorytellerCredentialSet::maybe_as_cookie_header) {
      request = request.header("Cookie", cookie);
    }
    let response = request.send().await.map_err(|e| e.to_string())?;
    let status = response.status();
    let body = response.text().await.map_err(|e| e.to_string())?;
    if !status.is_success() {
      return Err(body_message(&body).unwrap_or_else(|| format!("HTTP {status}")));
    }
    serde_json::from_str(&body).map_err(|e| format!("Unexpected response from {path}: {e}"))
  }

  async fn send_credits(&self, tx: &Sender<Event>) {
    match get_session_credits(&self.host, self.creds.as_ref(), PaymentsNamespace::Artcraft).await {
      Ok(c) => {
        let _ = tx.send(Event::Credits(c.sum_total_credits));
      },
      Err(err) => warn!("Credits check failed: {}", api_message(&err)),
    }
  }

  /// `POST /v1/media_files/upload/audio` (no client function for audio yet).
  async fn upload_audio(&self, path: &Path) -> Result<String, String> {
    let bytes = tokio::fs::read(path).await.map_err(|e| e.to_string())?;
    let name = path.file_name().and_then(|n| n.to_str()).unwrap_or("audio").to_owned();
    let form = reqwest::multipart::Form::new().text("uuid_idempotency_token", uuid::Uuid::new_v4().to_string()).text("maybe_visibility", "public").part("file", reqwest::multipart::Part::bytes(bytes).file_name(name));
    let url = format!("{}/v1/media_files/upload/audio", self.host.to_api_hostname_and_scheme());
    let mut request = self.http.post(url).header("Accept", "application/json").header("Origin", self.host.request_origin()).multipart(form);
    if let Some(cookie) = self.creds.as_ref().and_then(StorytellerCredentialSet::maybe_as_cookie_header) {
      request = request.header("Cookie", cookie);
    }
    let response = request.send().await.map_err(|e| e.to_string())?;
    let status = response.status();
    let body = response.text().await.map_err(|e| e.to_string())?;
    if !status.is_success() {
      return Err(body_message(&body).unwrap_or_else(|| format!("HTTP {status}")));
    }
    let upload: UploadResponse = serde_json::from_str(&body).map_err(|e| e.to_string())?;
    if upload.media_file_token.is_empty() {
      return Err("The server didn't return a media token.".to_owned());
    }
    Ok(upload.media_file_token)
  }

  /// Looks up an uploaded file's duration and links (best effort).
  async fn describe_upload(&self, token: String) -> UploadedMedia {
    #[derive(serde::Deserialize, Default)]
    #[serde(default)]
    struct FileResponse {
      media_file: MediaFile,
    }
    let info = self.get_json::<FileResponse>(&format!("/v1/media_files/file/{token}")).await.ok();
    let file = info.map(|r| r.media_file);
    UploadedMedia { duration_secs: file.as_ref().and_then(|f| f.maybe_duration_millis).map_or(0.0, |ms| ms as f32 / 1000.0), thumbnail: file.as_ref().and_then(|f| f.media_links.thumbnail(256)), full_url: file.as_ref().map(|f| f.media_links.cdn_url.clone()).filter(|u| !u.is_empty()), token }
  }
}

fn store_session(root: &Path, creds: &Arc<RwLock<Option<Credentials>>>, session: String) {
  let visitor = creds.read().ok().and_then(|c| c.as_ref().and_then(|c| c.visitor.clone()));
  let new = Credentials { session, visitor };
  session::save(root, &new);
  if let Ok(mut c) = creds.write() {
    *c = Some(new);
  }
}

/// The `session` value out of a raw `Set-Cookie` header.
fn session_from_set_cookie(header: &str) -> Option<String> {
  cookie::Cookie::parse(header).ok().filter(|c| c.name() == "session").map(|c| c.value().to_owned())
}

/// All job tokens a generate call created (`inference_job_token` plus `all_job_tokens`).
fn job_tokens(response: &Value) -> Vec<String> {
  let mut tokens: Vec<String> = response.get("inference_job_token").and_then(Value::as_str).map(str::to_owned).into_iter().collect();
  for t in response.get("all_job_tokens").and_then(Value::as_array).into_iter().flatten().filter_map(Value::as_str) {
    if !tokens.iter().any(|x| x == t) {
      tokens.push(t.to_owned());
    }
  }
  tokens
}

/// The server's `error_message` (or `message`) from an error body.
fn body_message(body: &str) -> Option<String> {
  let v: Value = serde_json::from_str(body).ok()?;
  v.get("error_message").or_else(|| v.get("message")).and_then(Value::as_str).map(str::to_owned)
}

/// A user-facing message for a client error.
pub fn api_message(err: &StorytellerError) -> String {
  match err {
    StorytellerError::Api(api) => api_error_message(api),
    StorytellerError::Client(client) => format!("{client:?}"),
  }
}

fn api_error_message(err: &ApiError) -> String {
  let body = match err {
    ApiError::InvalidRequest(b) | ApiError::Unauthorized(b) | ApiError::PaymentRequired(b) | ApiError::Forbidden(b) | ApiError::NotFound(b) | ApiError::TooManyRequests(b) => Some(b.as_str()),
    ApiError::InternalServerError { body, .. } | ApiError::UncategorizedBadResponseWithStatusAndBody { body, .. } => Some(body.as_str()),
    _ => None,
  };
  let fallback = match err {
    ApiError::Unauthorized(_) | ApiError::Forbidden(_) => "Please sign in to ArtCraft.".to_owned(),
    ApiError::PaymentRequired(_) => "You don't have enough credits for this.".to_owned(),
    ApiError::TooManyRequests(_) => "Too many requests. Please wait a moment.".to_owned(),
    ApiError::NetworkError(_) | ApiError::Timeout(_) => "Couldn't reach ArtCraft. Check your connection.".to_owned(),
    other => format!("{other:?}"),
  };
  body.and_then(body_message).unwrap_or(fallback)
}

fn login_error(err: LoginChallengeClientError) -> String {
  err.maybe_rejection.and_then(|r| r.error_message).unwrap_or_else(|| err.message.to_owned())
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn collects_every_job_token_once() {
    let response = serde_json::json!({ "success": true, "inference_job_token": "j1", "all_job_tokens": ["j1", "j2", "j3"] });
    assert_eq!(job_tokens(&response), ["j1", "j2", "j3"]);
    assert_eq!(job_tokens(&serde_json::json!({ "inference_job_token": "only" })), ["only"]);
  }

  #[test]
  fn reads_the_servers_error_message() {
    assert_eq!(body_message(r#"{"success":false,"error_message":"Not enough credits"}"#).as_deref(), Some("Not enough credits"));
    assert_eq!(body_message(r#"{"message":"Origin is not allowed"}"#).as_deref(), Some("Origin is not allowed"));
    assert_eq!(body_message("<html>502</html>"), None);
    assert_eq!(api_error_message(&ApiError::PaymentRequired("{}".into())), "You don't have enough credits for this.");
  }

  #[test]
  fn takes_the_session_from_set_cookie() {
    assert_eq!(session_from_set_cookie("session=abc.def; Path=/; Secure").as_deref(), Some("abc.def"));
    assert_eq!(session_from_set_cookie("visitor=x; Path=/"), None);
  }
}
