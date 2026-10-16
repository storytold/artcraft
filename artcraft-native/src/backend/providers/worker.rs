//! Finishing provider jobs in the background (the Tauri app's `midjourney_long_polling_thread`
//! and `poll_fal_tasks`): fal's queue is polled; Midjourney's feed is read every 15 s and its
//! websocket reports completions sooner; OpenRouter's requests are sent from here (each in its
//! own task, as they take minutes) and their images saved to disk. Finished results are
//! downloaded and uploaded into the user's library as one batch, resuming where they left off
//! after a failure or restart. Signed out, fal and OpenRouter results go into the local library
//! instead (Midjourney jobs need a sign-in to start, and wait for one to finish).

use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::sync::mpsc::Sender;
use std::sync::{Arc, Mutex, RwLock};
use std::time::{Duration, Instant};

use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::endpoints::media_files::upload_image_media_file_from_file::{UploadImageFromFileArgs, upload_image_media_file_from_file_with_idempotency_token};
use artcraft_client::utils::api_host::ApiHost;
use artcraft_router::client::router_client::RouterClient;
use artcraft_router::client::router_openrouter_client::RouterOpenRouterClient;
use artcraft_router::errors::artcraft_router_error::ArtcraftRouterError;
use artcraft_router::errors::provider_error::ProviderError;
use artcraft_router::generate::generate_image::generate_image_response::GenerateImageResponse;
use artcraft_router::generate::generate_image::image_generation_request::ImageGenerationRequest;
use artcraft_router::generate::generate_image::providers::openrouter::request::OpenRouterImageRequestState;
use enums::common::generation_provider::GenerationProvider;
use fal_client::creds::fal_api_key::FalApiKey;
use fal_client::polling::poll_job_response::poll_job_response::{PollJobResponseArgs, poll_job_response};
use fal_client::polling::poll_job_response::success_case_extractors::PollResponseExtractedContents;
use fal_client::polling::poll_job_status::poll_job_status::{FalJobStatus, PollJobStatusArgs, poll_job_status};
use local_generations::image_extension_for;
use log::{info, warn};
use midjourney_client::client::websocket::midjourney_websocket::MidjourneyWebSocket;
use midjourney_client::client::websocket::midjourney_ws_event::MidjourneyWsEvent;
use midjourney_client::client::websocket::open_midjourney_websocket::{OpenMidjourneyWebSocketRequest, open_midjourney_websocket};
use midjourney_client::credentials::credential_manager::MidjourneySession;
use midjourney_client::endpoints::imagine::{ImagineArgs, ImagineRequest, imagine};
use midjourney_client::recipes::get_user_info::{GetUserInfoArgs, get_user_info};
use midjourney_client::utils::image_downloader_client::ImageDownloaderClient;
use openrouter_client::api::generate_image::OpenRouterImage;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::prompts::PromptToken;
use tokio::sync::broadcast::Receiver;
use tokio::sync::broadcast::error::TryRecvError;
use tokio::time::timeout;

use super::Provider;
use super::accounts::ProviderAccounts;
use super::jobs::{JobStore, ProviderJob};
use crate::backend::Event;
use crate::backend::local_library::LocalLibrary;
use crate::backend::session::Credentials;

/// How often jobs are checked (fal's poll interval).
const TICK: Duration = Duration::from_secs(2);
const FEED_INTERVAL: Duration = Duration::from_secs(15);
const SOCKET_RETRY_INTERVAL: Duration = Duration::from_secs(60);
const REQUEST_TIMEOUT: Duration = Duration::from_secs(20);
/// Each download and upload of a result.
const TRANSFER_TIMEOUT: Duration = Duration::from_secs(60);
/// A Midjourney job not seen finished by then is given up on.
const MIDJOURNEY_GIVE_UP_SECS: i64 = 60 * 60;
/// Direct Midjourney jobs make four images.
const MIDJOURNEY_RESULTS: usize = 4;

#[derive(Clone)]
pub struct Worker {
  pub host: ApiHost,
  pub creds: Arc<RwLock<Option<Credentials>>>,
  pub http: reqwest::Client,
  pub accounts: ProviderAccounts,
  pub jobs: JobStore,
  pub local: LocalLibrary,
  pub tx: Sender<Event>,
  pub ctx: egui::Context,
}

/// Where a job's results come from.
enum Results<'a> {
  Urls(Vec<String>),
  Midjourney(&'a ImageDownloaderClient),
  Files(Vec<PathBuf>),
}

impl Results<'_> {
  fn count(&self) -> usize {
    match self {
      Results::Urls(urls) => urls.len(),
      Results::Midjourney(_) => MIDJOURNEY_RESULTS,
      Results::Files(paths) => paths.len(),
    }
  }
}

/// The OpenRouter requests in flight. A job saved before this run started with no images yet
/// was cut off by a restart: OpenRouter only bills finished images, so it's failed, not resent.
struct OpenRouterRuns {
  started_at: i64,
  running: Arc<Mutex<HashSet<String>>>,
}

/// What the Midjourney side remembers between ticks.
#[derive(Default)]
struct MidjourneyWatch {
  socket: Option<Socket>,
  /// Jobs seen finished (by the websocket or the feed).
  finished: HashSet<String>,
  next_feed: Option<Instant>,
  next_socket_attempt: Option<Instant>,
}

struct Socket {
  credential_id: String,
  socket: MidjourneyWebSocket,
  events: Receiver<Arc<MidjourneyWsEvent>>,
  subscribed: HashSet<String>,
}

impl Worker {
  pub async fn run(self) {
    let mut watch = MidjourneyWatch::default();
    let runs = OpenRouterRuns { started_at: chrono::Utc::now().timestamp(), running: Arc::default() };
    loop {
      self.tick(&mut watch, &runs).await;
      tokio::time::sleep(TICK).await;
    }
  }

  async fn tick(&self, watch: &mut MidjourneyWatch, runs: &OpenRouterRuns) {
    let jobs = self.jobs.all();
    let (openrouter, jobs): (Vec<ProviderJob>, Vec<ProviderJob>) = jobs.into_iter().partition(|j| j.provider == Provider::OpenRouter);
    let (midjourney, fal): (Vec<ProviderJob>, Vec<ProviderJob>) = jobs.into_iter().partition(|j| j.provider == Provider::Midjourney);
    if midjourney.is_empty() {
      watch.close();
    }
    // Generating doesn't need an ArtCraft session; only the uploads do.
    let saved = self.start_openrouter(runs, openrouter);
    // Signed in, results go into the library; signed out, onto this computer.
    let creds = self.creds.read().ok().and_then(|c| c.as_ref().map(Credentials::to_set));
    for job in saved {
      let (id, files) = (job.provider_job_id.clone(), job.result_files.clone());
      if let Err(err) = self.finish(job, Results::Files(files), creds.as_ref()).await {
        warn!("Saving OpenRouter results for {id} failed (will retry): {err}");
      }
    }
    if !fal.is_empty() {
      if let Some(key) = self.accounts.fal_key().map(|k| FalApiKey::from_str(&k)) {
        for job in fal {
          self.poll_fal(job, &key, creds.as_ref()).await;
        }
      }
    }
    if let (false, Some(creds)) = (midjourney.is_empty(), creds.as_ref()) {
      self.poll_midjourney(watch, midjourney, creds).await;
    }
  }

  async fn poll_fal(&self, job: ProviderJob, key: &FalApiKey, creds: Option<&StorytellerCredentialSet>) {
    let Some(status_url) = job.maybe_status_url.clone() else {
      return self.fail(&job, "No queue status URL to check");
    };
    let status = match timeout(REQUEST_TIMEOUT, poll_job_status(PollJobStatusArgs { status_url: &status_url, api_key: key })).await {
      Ok(Ok(status)) => status,
      other => return warn!("Polling FAL job {} failed: {other:?}", job.provider_job_id),
    };
    if status.status != FalJobStatus::Completed {
      return;
    }
    let Some(response_url) = job.maybe_response_url.clone().or(status.response_url) else {
      return self.fail(&job, "Job completed but no response URL available");
    };
    let response = match timeout(REQUEST_TIMEOUT, poll_job_response(PollJobResponseArgs { response_url: &response_url, api_key: key })).await {
      Ok(Ok(response)) => response,
      other => return warn!("Fetching FAL results for {} failed (will retry): {other:?}", job.provider_job_id),
    };
    let urls = image_urls(response.extracted_contents.as_ref());
    if urls.is_empty() {
      return self.fail(&job, "FAL returned no images");
    }
    if let Err(err) = self.finish(job, Results::Urls(urls), creds).await {
      warn!("Saving FAL results failed (will retry): {err}");
    }
  }

  /// Starts the OpenRouter jobs not running yet, and returns those whose images are saved.
  fn start_openrouter(&self, runs: &OpenRouterRuns, jobs: Vec<ProviderJob>) -> Vec<ProviderJob> {
    let mut saved = Vec::new();
    for job in jobs {
      if !job.result_files.is_empty() {
        saved.push(job);
        continue;
      }
      let Ok(mut running) = runs.running.lock() else {
        continue;
      };
      if running.contains(&job.id) {
        continue;
      }
      if job.created_at < runs.started_at {
        self.fail(&job, "ArtCraft closed before OpenRouter finished this job");
        continue;
      }
      running.insert(job.id.clone());
      let (worker, running) = (self.clone(), runs.running.clone());
      tokio::spawn(async move {
        let id = job.id.clone();
        worker.run_openrouter(job).await;
        if let Ok(mut running) = running.lock() {
          running.remove(&id);
        }
      });
    }
    saved
  }

  /// Sends a job's requests and saves the images; the next tick uploads them.
  async fn run_openrouter(&self, mut job: ProviderJob) {
    let Some(key) = self.accounts.openrouter_key() else {
      return self.fail(&job, "Add your OpenRouter API key in Settings to generate with OpenRouter");
    };
    let client = RouterClient::OpenRouter(RouterOpenRouterClient::new_from_raw_key(&key));
    let requests = match job.openrouter_requests_to_send() {
      Ok(requests) => requests,
      Err(err) => return self.fail(&job, &format!("Couldn't read a reference image: {err}")),
    };
    let request = ImageGenerationRequest::OpenRouter(OpenRouterImageRequestState { requests });
    let images = match request.send_request(&client).await {
      Ok(GenerateImageResponse::OpenRouter(payload)) => payload.images,
      Ok(_) => return self.fail(&job, "Unexpected OpenRouter response"),
      Err(err) => return self.fail(&job, &openrouter_failure(&err)),
    };
    if let Some(reason) = unkeepable_image(&images) {
      return self.fail(&job, &reason);
    }
    match save_results(&self.jobs.results_dir(&job.id), &images) {
      Ok(paths) => {
        info!("OpenRouter job {} made {} images", job.id, paths.len());
        job.result_files = paths;
        self.jobs.put(job);
        self.ctx.request_repaint();
      },
      Err(err) => self.fail(&job, &format!("Couldn't save OpenRouter's images: {err}")),
    }
  }

  async fn poll_midjourney(&self, watch: &mut MidjourneyWatch, jobs: Vec<ProviderJob>, creds: &StorytellerCredentialSet) {
    let session = match self.accounts.midjourney.session().await {
      Ok(Some(session)) => session,
      Ok(None) => return watch.close(),
      Err(err) => return warn!("Midjourney login check failed: {err}"),
    };
    let now = chrono::Utc::now().timestamp();
    for job in jobs.iter().filter(|j| now - j.created_at > MIDJOURNEY_GIVE_UP_SECS && !watch.finished.contains(&j.provider_job_id)) {
      self.fail(job, "Midjourney didn't finish this job");
    }
    let pending: HashSet<String> = jobs.iter().filter(|j| now - j.created_at <= MIDJOURNEY_GIVE_UP_SECS || watch.finished.contains(&j.provider_job_id)).map(|j| j.provider_job_id.clone()).collect();
    watch.finished.retain(|id| pending.contains(id));
    watch.refresh(&session, &pending).await;
    let downloader = match ImageDownloaderClient::create(Some(session.browser.clone())) {
      Ok(downloader) => downloader,
      Err(err) => return warn!("Midjourney downloader unavailable: {err:?}"),
    };
    let done: Vec<ProviderJob> = jobs.into_iter().filter(|j| watch.finished.contains(&j.provider_job_id)).collect();
    for job in done {
      let id = job.provider_job_id.clone();
      match self.finish(job, Results::Midjourney(&downloader), Some(creds)).await {
        Ok(()) => {
          watch.finished.remove(&id);
        },
        Err(err) => warn!("Uploading Midjourney results for {id} failed (will retry): {err}"),
      }
    }
  }

  /// Uploads the results not uploaded yet (or, signed out, keeps them on this computer), then
  /// reports the job done.
  async fn finish(&self, job: ProviderJob, results: Results<'_>, creds: Option<&StorytellerCredentialSet>) -> anyhow::Result<()> {
    match creds {
      Some(creds) => self.upload(job, results, creds).await,
      None => self.keep_locally(job, results).await,
    }
  }

  async fn upload(&self, mut job: ProviderJob, results: Results<'_>, creds: &StorytellerCredentialSet) -> anyhow::Result<()> {
    let provider = match job.provider {
      Provider::Midjourney => Some(GenerationProvider::Midjourney),
      Provider::Fal => Some(GenerationProvider::Fal),
      Provider::Artcraft => Some(GenerationProvider::Artcraft),
      // Left unset: servers that predate `open_router` would reject the upload.
      Provider::OpenRouter => None,
    };
    let prompt = job.maybe_prompt_token.as_deref().map(PromptToken::new_from_str);
    let batch = BatchGenerationToken::new_from_str(&job.batch_token);
    for index in job.uploaded.len()..results.count() {
      let (bytes, ext) = timeout(TRANSFER_TIMEOUT, self.download(&results, &job, index)).await??;
      let mut file = tempfile::Builder::new().prefix("artcraft-provider-").suffix(&format!(".{ext}")).tempfile()?;
      std::io::Write::write_all(&mut file, &bytes)?;
      // The token is saved before the upload, so a retry can't upload the same result twice.
      let token = job.upload_token(index);
      self.jobs.put(job.clone());
      let args = UploadImageFromFileArgs { api_host: &self.host, maybe_creds: Some(creds), path: file.path(), is_intermediate_system_file: false, maybe_prompt_token: prompt.as_ref(), maybe_generation_provider: provider, maybe_batch_token: Some(&batch) };
      let uploaded = timeout(TRANSFER_TIMEOUT, upload_image_media_file_from_file_with_idempotency_token(args, &token)).await??;
      job.uploaded.push(uploaded.media_file_token.to_string());
      self.jobs.put(job.clone());
    }
    info!("{:?} job {} finished with {} results", job.provider, job.provider_job_id, job.uploaded.len());
    self.jobs.remove(&job.id);
    self.remove_results(&job.id);
    self.send(Event::ProviderJobFinished { job_id: job.id, batch_token: job.batch_token });
    Ok(())
  }

  /// Saves every result into the local library, under ids made from the job and result index, so
  /// a retry (after a failure partway, or a restart before the job is removed) overwrites instead
  /// of keeping an image twice. A result that can't be kept fails the job: retrying won't help.
  async fn keep_locally(&self, job: ProviderJob, results: Results<'_>) -> anyhow::Result<()> {
    let mut fetched = Vec::with_capacity(results.count());
    for index in 0..results.count() {
      fetched.push(timeout(TRANSFER_TIMEOUT, self.download(&results, &job, index)).await??);
    }
    if let Some((_, ext)) = fetched.iter().find(|(bytes, ext)| image_extension_for(bytes, ext).is_none()) {
      self.fail(&job, &unkeepable_reason(ext));
      return Ok(());
    }
    let images = fetched.iter().enumerate()
      .map(|(index, (bytes, ext))| self.local.add_as(&format!("{}_{index}", job.id), bytes, ext, &job.prompt, &job.model_id, job.provider))
      .collect::<anyhow::Result<Vec<_>>>()?;
    info!("{:?} job {} kept {} results on this computer", job.provider, job.provider_job_id, images.len());
    self.jobs.remove(&job.id);
    self.remove_results(&job.id);
    self.send(Event::ProviderJobKeptLocally { job_id: job.id, images });
    Ok(())
  }

  async fn download(&self, results: &Results<'_>, job: &ProviderJob, index: usize) -> anyhow::Result<(Vec<u8>, String)> {
    match results {
      Results::Urls(urls) => {
        let url = &urls[index];
        let bytes = self.http.get(url).send().await?.error_for_status()?.bytes().await?;
        Ok((bytes.to_vec(), image_extension(url).to_owned()))
      },
      Results::Midjourney(downloader) => Ok((downloader.download_image(&job.provider_job_id, index as u8).await?, "png".to_owned())),
      // Saved under their real type (see `save_results`), so an unkeepable one shows as such.
      Results::Files(paths) => Ok((tokio::fs::read(&paths[index]).await?, paths[index].extension().and_then(|e| e.to_str()).unwrap_or("png").to_owned())),
    }
  }

  fn fail(&self, job: &ProviderJob, reason: &str) {
    warn!("{:?} job {} failed: {reason}", job.provider, job.provider_job_id);
    self.jobs.remove(&job.id);
    self.remove_results(&job.id);
    self.send(Event::ProviderJobFailed { job_id: job.id.clone(), reason: reason.to_owned() });
  }

  fn remove_results(&self, job_id: &str) {
    let dir = self.jobs.results_dir(job_id);
    if let Err(err) = std::fs::remove_dir_all(&dir) {
      if err.kind() != std::io::ErrorKind::NotFound {
        warn!("Couldn't remove {}: {err}", dir.display());
      }
    }
  }

  fn send(&self, event: Event) {
    let _ = self.tx.send(event);
    self.ctx.request_repaint();
  }
}

impl MidjourneyWatch {
  /// Notes which pending jobs have finished: websocket events as they come, and the feed every
  /// so often (it also covers frames the socket missed, and jobs from before a restart).
  async fn refresh(&mut self, session: &MidjourneySession, pending: &HashSet<String>) {
    if self.socket.as_ref().is_some_and(|s| s.credential_id != session.credential_id || !s.socket.is_connected()) {
      self.close();
    }
    self.drain(pending);
    let now = Instant::now();
    if self.next_feed.is_none_or(|t| now >= t) {
      self.next_feed = Some(now + FEED_INTERVAL);
      match timeout(REQUEST_TIMEOUT, imagine(ImagineArgs { request: ImagineRequest { user_id: &session.user_id, page_size: None }, cookie_header: &session.cookie_header, hostname: None, browser: Some(session.browser.clone()) })).await {
        Ok(Ok(feed)) => self.finished.extend(feed.items.into_iter().filter_map(|item| item.id).filter(|id| pending.contains(id))),
        other => warn!("Reading the Midjourney feed failed: {other:?}"),
      }
    }
    if self.socket.is_none() && self.next_socket_attempt.is_none_or(|t| now >= t) {
      self.next_socket_attempt = Some(now + SOCKET_RETRY_INTERVAL);
      match timeout(REQUEST_TIMEOUT, open_socket(session)).await {
        Ok(Ok(socket)) => self.socket = Some(socket),
        _ => log::debug!("Midjourney websocket unavailable; the feed still reports completions"),
      }
    }
    if let Some(socket) = self.socket.as_mut() {
      socket.subscribed.retain(|id| pending.contains(id));
      for id in pending {
        if !socket.subscribed.contains(id) && socket.socket.subscribe_to_job(id).is_ok() {
          socket.subscribed.insert(id.clone());
        }
      }
    }
  }

  fn drain(&mut self, pending: &HashSet<String>) {
    let Some(socket) = self.socket.as_mut() else {
      return;
    };
    loop {
      match socket.events.try_recv() {
        Ok(event) => {
          if let MidjourneyWsEvent::Completed { job_id, .. } = event.as_ref() {
            if pending.contains(job_id) {
              self.finished.insert(job_id.clone());
            }
          }
        },
        // Missed frames: read the feed now.
        Err(TryRecvError::Lagged(_)) => self.next_feed = None,
        Err(TryRecvError::Empty | TryRecvError::Closed) => break,
      }
    }
  }

  fn close(&mut self) {
    if let Some(socket) = self.socket.take() {
      socket.socket.close();
    }
  }
}

async fn open_socket(session: &MidjourneySession) -> anyhow::Result<Socket> {
  let info = get_user_info(GetUserInfoArgs { cookie_header: &session.cookie_header, hostname: None, browser: Some(session.browser.clone()) }).await?;
  let token = info.websocket_token.ok_or_else(|| anyhow::anyhow!("No Midjourney websocket token"))?;
  let socket = open_midjourney_websocket(OpenMidjourneyWebSocketRequest { websocket_token: &token, user_id: session.user_id.clone(), hostname: None, browser: Some(session.browser.clone()) }).await?;
  let events = socket.events();
  Ok(Socket { credential_id: session.credential_id.clone(), socket, events, subscribed: HashSet::new() })
}

/// Writes OpenRouter's images as `0.png`, `1.jpg`, ... in `dir`.
fn save_results(dir: &Path, images: &[OpenRouterImage]) -> std::io::Result<Vec<PathBuf>> {
  std::fs::create_dir_all(dir)?;
  images.iter().enumerate().map(|(index, image)| {
    let path = dir.join(format!("{index}.{}", image.extension()));
    std::fs::write(&path, &image.bytes)?;
    Ok(path)
  }).collect()
}

/// Why a job fails when one of OpenRouter's images (eg. an SVG) can be neither kept nor uploaded.
fn unkeepable_image(images: &[OpenRouterImage]) -> Option<String> {
  images.iter().find(|image| image_extension_for(&image.bytes, image.extension()).is_none()).map(|image| unkeepable_reason(image.extension()))
}

fn unkeepable_reason(extension: &str) -> String {
  format!("Got a .{extension} image, which ArtCraft can't save: only PNG, JPEG, WebP and GIF images are supported")
}

/// What the user sees when OpenRouter fails: billing problems point at their account.
fn openrouter_failure(err: &ArtcraftRouterError) -> String {
  match err {
    ArtcraftRouterError::ProviderBillingError(_) => "Your OpenRouter account is out of credits. Add credits at openrouter.ai to keep generating.".to_owned(),
    ArtcraftRouterError::Provider(ProviderError::OpenRouter(err)) => err.user_message(),
    other => other.to_string(),
  }
}

/// A fal job's image links: the batch, else the single image.
fn image_urls(extracted: Option<&PollResponseExtractedContents>) -> Vec<String> {
  let Some(extracted) = extracted else {
    return Vec::new();
  };
  let batch: Vec<String> = extracted.images.iter().flatten().filter_map(|i| i.url.clone()).collect();
  if !batch.is_empty() {
    return batch;
  }
  extracted.image.as_ref().and_then(|i| i.url.clone()).into_iter().collect()
}

/// The file extension a result URL ends in (PNG when it doesn't say).
fn image_extension(url: &str) -> &'static str {
  let path = url.split(['?', '#']).next().unwrap_or_default().to_ascii_lowercase();
  ["jpg", "jpeg", "webp", "png"].into_iter().find(|ext| path.ends_with(&format!(".{ext}"))).unwrap_or("png")
}

#[cfg(test)]
mod tests {
  use std::sync::mpsc::channel;

  use base64::Engine;
  use openrouter_client::api::generate_image::ENV_OPENROUTER_CUSTOM_API_BASE;
  use openrouter_client::error::openrouter_error::OpenRouterError;
  use serde_json::json;
  use tokio::io::{AsyncReadExt, AsyncWriteExt};
  use tokio::net::TcpListener;

  use super::*;
  use crate::backend::local_library::LocalImage;
  use crate::backend::providers::submit::submit;

  const STUB_IMAGE: &[u8] = b"\x89PNG stub image";
  const SVG_IMAGE: &[u8] = b"<svg xmlns=\"http://www.w3.org/2000/svg\"/>";

  #[tokio::test(flavor = "multi_thread")]
  async fn openrouter_jobs_run_and_signed_out_are_kept_on_this_computer() {
    let (base, requests) = stub_openrouter().await;
    // SAFETY: no other test reads this variable (OpenRouter is only called here).
    unsafe { std::env::set_var(ENV_OPENROUTER_CUSTOM_API_BASE, &base) };
    let dir = std::env::temp_dir().join(format!("artcraft-native-worker-{}", uuid::Uuid::new_v4()));
    let (worker, rx) = worker(&dir);
    worker.accounts.set_openrouter_key("sk-or-test").unwrap();
    let fields = json!({ "model": "nano_banana_pro", "prompt": "a fox", "aspect_ratio": "wide_sixteen_by_nine", "image_batch_count": 2 });
    // A reference added while signed out.
    let reference = format!("data:image/png;base64,{}", base64::engine::general_purpose::STANDARD.encode(STUB_IMAGE));
    let job = submit(&worker.host, None, &worker.accounts, Provider::OpenRouter, fields.as_object().unwrap(), vec![reference.clone()]).await.unwrap();
    worker.jobs.put(job.clone());
    let runs = OpenRouterRuns { started_at: job.created_at, running: Arc::default() };

    assert!(worker.start_openrouter(&runs, worker.jobs.all()).is_empty(), "nothing saved yet");
    let saved = wait_for(|| worker.jobs.all().into_iter().find(|j| !j.result_files.is_empty())).await;
    assert_eq!(saved.result_files.len(), 2, "one image per Gemini request");
    assert_eq!(std::fs::read(&saved.result_files[0]).unwrap(), STUB_IMAGE);
    assert_eq!(worker.start_openrouter(&runs, worker.jobs.all()).len(), 1, "saved jobs are handed to the uploader");
    let sent = requests.lock().unwrap().clone();
    assert_eq!(sent.len(), 2);
    assert!(sent.iter().all(|r| r.contains(r#""model":"google/gemini-3-pro-image""#) && r.contains(r#""aspect_ratio":"16:9""#) && r.to_ascii_lowercase().contains("authorization: bearer sk-or-test")), "{sent:?}");
    assert!(sent.iter().all(|r| r.contains(&format!(r#""image_url":{{"url":"{reference}"}}"#))), "each request still sends the reference as a data URL: {sent:?}");
    assert!(rx.try_recv().is_err(), "nothing failed");

    worker.finish(saved.clone(), Results::Files(saved.result_files.clone()), None).await.unwrap();
    let images = match rx.try_recv() {
      Ok(Event::ProviderJobKeptLocally { job_id, images }) if job_id == job.id => images,
      _ => panic!("expected the job to be kept locally"),
    };
    assert_eq!(images.len(), 2);
    assert!(images.iter().all(|i| std::fs::read(&i.path).unwrap() == STUB_IMAGE && i.prompt == "a fox" && i.model_id == "nano_banana_pro" && i.provider == "open_router"));
    assert!(images.iter().all(|i| worker.local.all().contains(i)), "the local library has them");
    assert!(worker.jobs.all().is_empty() && !worker.jobs.results_dir(&job.id).exists(), "the job and its scratch files are gone");
    let _ = std::fs::remove_dir_all(dir);
  }

  #[tokio::test]
  async fn openrouter_jobs_cut_off_by_a_restart_fail_without_resending() {
    let dir = std::env::temp_dir().join(format!("artcraft-native-worker-{}", uuid::Uuid::new_v4()));
    let (worker, rx) = worker(&dir);
    worker.accounts.set_openrouter_key("sk-or-test").unwrap();
    let fields = json!({ "model": "gpt_image_2", "prompt": "a fox" });
    let mut job = submit(&worker.host, None, &worker.accounts, Provider::OpenRouter, fields.as_object().unwrap(), Vec::new()).await.unwrap();
    job.created_at -= 60;
    worker.jobs.put(job.clone());
    let runs = OpenRouterRuns { started_at: job.created_at + 30, running: Arc::default() };
    assert!(worker.start_openrouter(&runs, worker.jobs.all()).is_empty());
    assert!(worker.jobs.all().is_empty(), "the job is dropped");
    match rx.try_recv() {
      Ok(Event::ProviderJobFailed { job_id, reason }) => assert_eq!((job_id.as_str(), reason.as_str()), (job.id.as_str(), "ArtCraft closed before OpenRouter finished this job")),
      Ok(_) => panic!("expected a failure event"),
      Err(err) => panic!("expected a failure event: {err}"),
    }
    let _ = std::fs::remove_dir_all(dir);
  }

  #[tokio::test]
  async fn keeping_a_job_again_overwrites_instead_of_duplicating() {
    let dir = std::env::temp_dir().join(format!("artcraft-native-worker-{}", uuid::Uuid::new_v4()));
    let (worker, rx) = worker(&dir);
    let job = saved_job(&worker, &[("0.png", STUB_IMAGE), ("1.png", STUB_IMAGE)]).await;
    worker.finish(job.clone(), Results::Files(job.result_files.clone()), None).await.unwrap();
    // Killed after the images were kept but before the job was removed: it runs again.
    write_results(&worker, &job, &[("0.png", STUB_IMAGE), ("1.png", STUB_IMAGE)]);
    worker.jobs.put(job.clone());
    worker.finish(job.clone(), Results::Files(job.result_files.clone()), None).await.unwrap();
    let ids = |event| match event {
      Ok(Event::ProviderJobKeptLocally { images, .. }) => images.into_iter().map(|i: LocalImage| i.id).collect::<Vec<_>>(),
      _ => panic!("expected the job to be kept locally"),
    };
    assert_eq!(ids(rx.try_recv()), ids(rx.try_recv()), "a retry keeps the same ids");
    assert_eq!(worker.local.all().len(), 2, "nothing is kept twice");
    let _ = std::fs::remove_dir_all(dir);
  }

  #[tokio::test]
  async fn images_that_cant_be_kept_fail_the_job_instead_of_retrying() {
    let dir = std::env::temp_dir().join(format!("artcraft-native-worker-{}", uuid::Uuid::new_v4()));
    let (worker, rx) = worker(&dir);
    let job = saved_job(&worker, &[("0.png", STUB_IMAGE), ("1.svg", SVG_IMAGE)]).await;
    worker.finish(job.clone(), Results::Files(job.result_files.clone()), None).await.unwrap();
    match rx.try_recv() {
      Ok(Event::ProviderJobFailed { job_id, reason }) => assert!(job_id == job.id && reason.contains("PNG, JPEG, WebP and GIF"), "{reason}"),
      _ => panic!("expected a failure event"),
    }
    assert!(worker.local.all().is_empty(), "nothing is kept");
    assert!(worker.jobs.all().is_empty() && !worker.jobs.results_dir(&job.id).exists(), "the job isn't retried");
    let _ = std::fs::remove_dir_all(dir);
  }

  #[test]
  fn openrouter_images_that_cant_be_kept_are_caught_before_saving() {
    let png = OpenRouterImage { bytes: STUB_IMAGE.to_vec(), maybe_media_type: Some("image/png".into()) };
    let svg = OpenRouterImage { bytes: SVG_IMAGE.to_vec(), maybe_media_type: Some("image/svg+xml".into()) };
    assert_eq!(unkeepable_image(std::slice::from_ref(&png)), None);
    assert!(unkeepable_image(&[png, svg]).is_some_and(|reason| reason.contains(".svg") && reason.contains("PNG, JPEG, WebP and GIF")));
  }

  #[test]
  fn openrouter_failures_show_their_user_message() {
    let refused = ArtcraftRouterError::from(OpenRouterError::from_status(400, "big"));
    assert_eq!(openrouter_failure(&refused), "OpenRouter refused the request (400): big");
    let billing = ArtcraftRouterError::from(OpenRouterError::from_status(402, "none"));
    assert_eq!(openrouter_failure(&billing), "Your OpenRouter account is out of credits. Add credits at openrouter.ai to keep generating.");
  }

  #[test]
  fn results_keep_their_file_type() {
    assert_eq!(image_extension("https://fal.media/files/a/b.jpeg?x=1"), "jpeg");
    assert_eq!(image_extension("https://fal.media/files/a/b.webp"), "webp");
    assert_eq!(image_extension("https://fal.media/files/a/b"), "png");
  }

  #[test]
  fn openrouter_images_are_saved_with_their_type() {
    let dir = std::env::temp_dir().join(format!("artcraft-native-results-{}", uuid::Uuid::new_v4()));
    let images = [OpenRouterImage { bytes: b"png".to_vec(), maybe_media_type: Some("image/png".into()) }, OpenRouterImage { bytes: b"jpg".to_vec(), maybe_media_type: Some("image/jpeg".into()) }];
    let paths = save_results(&dir, &images).unwrap();
    assert_eq!(paths, vec![dir.join("0.png"), dir.join("1.jpg")]);
    assert_eq!(std::fs::read(&paths[1]).unwrap(), b"jpg");
    assert_eq!(image_extension(&paths[1].to_string_lossy()), "jpg");
    let _ = std::fs::remove_dir_all(dir);
  }

  #[test]
  fn fal_results_prefer_the_batch() {
    let contents = fal_client::polling::poll_job_response::success_case_extractors::extract_contents_from_response(&serde_json::json!({ "images": [{ "url": "https://fal/1.png" }, { "url": "https://fal/2.png" }] }));
    assert_eq!(image_urls(contents.as_ref()), ["https://fal/1.png", "https://fal/2.png"]);
    let single = fal_client::polling::poll_job_response::success_case_extractors::extract_contents_from_response(&serde_json::json!({ "image": { "url": "https://fal/one.png" } }));
    assert_eq!(image_urls(single.as_ref()), ["https://fal/one.png"]);
    assert!(image_urls(None).is_empty());
  }

  fn worker(dir: &Path) -> (Worker, std::sync::mpsc::Receiver<Event>) {
    let (tx, rx) = channel();
    let worker = Worker { host: ApiHost::Storyteller, creds: Arc::new(RwLock::new(None)), http: reqwest::Client::new(), accounts: ProviderAccounts::load(dir), jobs: JobStore::load(dir), local: LocalLibrary::load(dir), tx, ctx: egui::Context::default() };
    (worker, rx)
  }

  /// A signed-out OpenRouter job whose images (`files`) are saved, waiting to be kept.
  async fn saved_job(worker: &Worker, files: &[(&str, &[u8])]) -> ProviderJob {
    worker.accounts.set_openrouter_key("sk-or-test").unwrap();
    let fields = json!({ "model": "gpt_image_2", "prompt": "a fox" });
    let mut job = submit(&worker.host, None, &worker.accounts, Provider::OpenRouter, fields.as_object().unwrap(), Vec::new()).await.unwrap();
    job.result_files = write_results(worker, &job, files);
    worker.jobs.put(job.clone());
    job
  }

  fn write_results(worker: &Worker, job: &ProviderJob, files: &[(&str, &[u8])]) -> Vec<PathBuf> {
    let dir = worker.jobs.results_dir(&job.id);
    std::fs::create_dir_all(&dir).unwrap();
    files.iter().map(|(name, bytes)| {
      std::fs::write(dir.join(name), bytes).unwrap();
      dir.join(name)
    }).collect()
  }

  async fn wait_for<T>(mut check: impl FnMut() -> Option<T>) -> T {
    for _ in 0..200 {
      if let Some(found) = check() {
        return found;
      }
      tokio::time::sleep(Duration::from_millis(25)).await;
    }
    panic!("timed out");
  }

  /// A stub OpenRouter answering every image request with one stub PNG; also returns the requests.
  async fn stub_openrouter() -> (String, Arc<Mutex<Vec<String>>>) {
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let base = format!("http://{}", listener.local_addr().unwrap());
    let requests = Arc::new(Mutex::new(Vec::new()));
    let seen = requests.clone();
    let body = json!({ "data": [{ "b64_json": base64::engine::general_purpose::STANDARD.encode(STUB_IMAGE), "media_type": "image/png" }], "usage": { "cost": 0.04 } }).to_string();
    tokio::spawn(async move {
      loop {
        let Ok((mut socket, _)) = listener.accept().await else { return };
        let (seen, body) = (seen.clone(), body.clone());
        tokio::spawn(async move {
          let mut raw = Vec::new();
          let mut buf = [0u8; 8192];
          loop {
            let n = socket.read(&mut buf).await.unwrap_or(0);
            raw.extend_from_slice(&buf[..n]);
            let text = String::from_utf8_lossy(&raw).to_string();
            let Some(end) = text.find("\r\n\r\n") else { if n == 0 { break } else { continue } };
            let length = text.lines().find_map(|l| l.to_ascii_lowercase().strip_prefix("content-length:").map(|v| v.trim().parse::<usize>().unwrap_or(0))).unwrap_or(0);
            if raw.len() >= end + 4 + length || n == 0 {
              break;
            }
          }
          seen.lock().unwrap().push(String::from_utf8_lossy(&raw).to_string());
          let reply = format!("HTTP/1.1 200 OK\r\ncontent-type: application/json\r\ncontent-length: {}\r\nconnection: close\r\n\r\n{body}", body.len());
          let _ = socket.write_all(reply.as_bytes()).await;
        });
      }
    });
    (base, requests)
  }
}
