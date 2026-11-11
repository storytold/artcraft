//! Finishing provider jobs in the background (the Tauri app's `midjourney_long_polling_thread`
//! and `poll_fal_tasks`): fal's queue is polled; Midjourney's feed is read every 15 s and its
//! websocket reports completions sooner. Finished results are downloaded and uploaded into the
//! user's library as one batch, resuming where they left off after a failure or restart.

use std::collections::HashSet;
use std::sync::mpsc::Sender;
use std::sync::{Arc, RwLock};
use std::time::{Duration, Instant};

use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::endpoints::media_files::upload_image_media_file_from_file::{UploadImageFromFileArgs, upload_image_media_file_from_file_with_idempotency_token};
use artcraft_client::utils::api_host::ApiHost;
use enums::common::generation_provider::GenerationProvider;
use fal_client::creds::fal_api_key::FalApiKey;
use fal_client::polling::poll_job_response::poll_job_response::{PollJobResponseArgs, poll_job_response};
use fal_client::polling::poll_job_response::success_case_extractors::PollResponseExtractedContents;
use fal_client::polling::poll_job_status::poll_job_status::{FalJobStatus, PollJobStatusArgs, poll_job_status};
use log::{info, warn};
use midjourney_client::client::websocket::midjourney_websocket::MidjourneyWebSocket;
use midjourney_client::client::websocket::midjourney_ws_event::MidjourneyWsEvent;
use midjourney_client::client::websocket::open_midjourney_websocket::{OpenMidjourneyWebSocketRequest, open_midjourney_websocket};
use midjourney_client::credentials::credential_manager::MidjourneySession;
use midjourney_client::endpoints::imagine::{ImagineArgs, ImagineRequest, imagine};
use midjourney_client::recipes::get_user_info::{GetUserInfoArgs, get_user_info};
use midjourney_client::utils::image_downloader_client::ImageDownloaderClient;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::prompts::PromptToken;
use tokio::sync::broadcast::Receiver;
use tokio::sync::broadcast::error::TryRecvError;
use tokio::time::timeout;

use super::Provider;
use super::accounts::ProviderAccounts;
use super::jobs::{JobStore, ProviderJob};
use crate::backend::Event;
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

pub struct Worker {
  pub host: ApiHost,
  pub creds: Arc<RwLock<Option<Credentials>>>,
  pub http: reqwest::Client,
  pub accounts: ProviderAccounts,
  pub jobs: JobStore,
  pub tx: Sender<Event>,
  pub ctx: egui::Context,
}

/// Where a job's results come from.
enum Results<'a> {
  Urls(Vec<String>),
  Midjourney(&'a ImageDownloaderClient),
}

impl Results<'_> {
  fn count(&self) -> usize {
    match self {
      Results::Urls(urls) => urls.len(),
      Results::Midjourney(_) => MIDJOURNEY_RESULTS,
    }
  }
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
    loop {
      self.tick(&mut watch).await;
      tokio::time::sleep(TICK).await;
    }
  }

  async fn tick(&self, watch: &mut MidjourneyWatch) {
    let jobs = self.jobs.all();
    let (midjourney, fal): (Vec<ProviderJob>, Vec<ProviderJob>) = jobs.into_iter().partition(|j| j.provider == Provider::Midjourney);
    if midjourney.is_empty() {
      watch.close();
    }
    // Results go into the library: nothing can finish until someone's signed in.
    let Some(creds) = self.creds.read().ok().and_then(|c| c.as_ref().map(Credentials::to_set)) else {
      return;
    };
    if !fal.is_empty() {
      if let Some(key) = self.accounts.fal_key().map(|k| FalApiKey::from_str(&k)) {
        for job in fal {
          self.poll_fal(job, &key, &creds).await;
        }
      }
    }
    if !midjourney.is_empty() {
      self.poll_midjourney(watch, midjourney, &creds).await;
    }
  }

  async fn poll_fal(&self, job: ProviderJob, key: &FalApiKey, creds: &StorytellerCredentialSet) {
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
      warn!("Uploading FAL results failed (will retry): {err}");
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
      match self.finish(job, Results::Midjourney(&downloader), creds).await {
        Ok(()) => {
          watch.finished.remove(&id);
        },
        Err(err) => warn!("Uploading Midjourney results for {id} failed (will retry): {err}"),
      }
    }
  }

  /// Uploads the results not uploaded yet, then reports the job done.
  async fn finish(&self, mut job: ProviderJob, results: Results<'_>, creds: &StorytellerCredentialSet) -> anyhow::Result<()> {
    let provider = match job.provider {
      Provider::Midjourney => GenerationProvider::Midjourney,
      Provider::Fal => GenerationProvider::Fal,
      Provider::Artcraft => GenerationProvider::Artcraft,
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
      let args = UploadImageFromFileArgs { api_host: &self.host, maybe_creds: Some(creds), path: file.path(), is_intermediate_system_file: false, maybe_prompt_token: prompt.as_ref(), maybe_generation_provider: Some(provider), maybe_batch_token: Some(&batch) };
      let uploaded = timeout(TRANSFER_TIMEOUT, upload_image_media_file_from_file_with_idempotency_token(args, &token)).await??;
      job.uploaded.push(uploaded.media_file_token.to_string());
      self.jobs.put(job.clone());
    }
    info!("{:?} job {} finished with {} results", job.provider, job.provider_job_id, job.uploaded.len());
    self.jobs.remove(&job.id);
    self.send(Event::ProviderJobFinished { job_id: job.id, batch_token: job.batch_token });
    Ok(())
  }

  async fn download(&self, results: &Results<'_>, job: &ProviderJob, index: usize) -> anyhow::Result<(Vec<u8>, &'static str)> {
    match results {
      Results::Urls(urls) => {
        let url = &urls[index];
        let bytes = self.http.get(url).send().await?.error_for_status()?.bytes().await?;
        Ok((bytes.to_vec(), image_extension(url)))
      },
      Results::Midjourney(downloader) => Ok((downloader.download_image(&job.provider_job_id, index as u8).await?, "png")),
    }
  }

  fn fail(&self, job: &ProviderJob, reason: &str) {
    warn!("{:?} job {} failed: {reason}", job.provider, job.provider_job_id);
    self.jobs.remove(&job.id);
    self.send(Event::ProviderJobFailed { job_id: job.id.clone(), reason: reason.to_owned() });
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
  use super::*;

  #[test]
  fn results_keep_their_file_type() {
    assert_eq!(image_extension("https://fal.media/files/a/b.jpeg?x=1"), "jpeg");
    assert_eq!(image_extension("https://fal.media/files/a/b.webp"), "webp");
    assert_eq!(image_extension("https://fal.media/files/a/b"), "png");
  }

  #[test]
  fn fal_results_prefer_the_batch() {
    let contents = fal_client::polling::poll_job_response::success_case_extractors::extract_contents_from_response(&serde_json::json!({ "images": [{ "url": "https://fal/1.png" }, { "url": "https://fal/2.png" }] }));
    assert_eq!(image_urls(contents.as_ref()), ["https://fal/1.png", "https://fal/2.png"]);
    let single = fal_client::polling::poll_job_response::success_case_extractors::extract_contents_from_response(&serde_json::json!({ "image": { "url": "https://fal/one.png" } }));
    assert_eq!(image_urls(single.as_ref()), ["https://fal/one.png"]);
    assert!(image_urls(None).is_empty());
  }
}
