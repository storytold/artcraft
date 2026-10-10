//! One create page's feed (`useDesktopGenerationFeed` + `useGalleryData`): jobs in flight and
//! failures from the session's job list, results as they land, and the library underneath.

use std::collections::{HashMap, HashSet};

use crate::backend::wire::{Job, JobPhase, MediaFile, unix_secs};
use crate::backend::EnqueueMeta;
use crate::feed::types::{FailedJob, FeedItem, MediaKind, PendingJob};
use crate::models::Catalog;

/// Failures older than this are history, not news.
const FAILURE_WINDOW_SECS: i64 = 24 * 60 * 60;
/// Thumbnails are requested at this width (`getMediaThumbnail(@512)`).
pub const THUMBNAIL_WIDTH: u32 = 512;

/// Something the store wants the app to do or say after an update.
#[derive(Debug, PartialEq)]
pub enum FeedNotice {
  Completed,
  Failed(String),
  /// Expand a finished batch job into all of its files.
  LoadBatch {
    job_token: String,
    batch_token: String,
  },
}

#[derive(Default)]
pub struct FeedStore {
  pub pending: Vec<PendingJob>,
  pub failed: Vec<FailedJob>,
  pub items: Vec<FeedItem>,
  pub has_more: bool,
  pub loading: bool,
  pub selecting: bool,
  pub selected: HashSet<String>,
  pub last_viewed: Option<String>,
  next_page: u32,
  library_started: bool,
  /// Jobs seen finished (so only new ones announce themselves).
  seen_complete: HashSet<String>,
  /// Jobs seen running in this session (so their outcome gets a toast).
  seen_running: HashSet<String>,
  first_poll_done: bool,
  dismissed: HashSet<String>,
  meta: HashMap<String, EnqueueMeta>,
}

impl FeedStore {
  pub fn has_content(&self) -> bool {
    !self.pending.is_empty() || !self.failed.is_empty() || !self.items.is_empty()
  }

  /// Shows the jobs a generate call just started, before the next poll catches up.
  pub fn add_enqueued(&mut self, kind: MediaKind, job_tokens: &[String], meta: &EnqueueMeta, catalog: &Catalog) {
    let now = chrono::Utc::now().timestamp();
    let expected = catalog.find(&meta.model_id).map_or(30.0, |m| m.expected_secs);
    for token in job_tokens {
      self.meta.insert(token.clone(), meta.clone());
      self.seen_running.insert(token.clone());
      if !self.pending.iter().any(|p| &p.job_token == token) {
        self.pending.insert(0, PendingJob { job_token: token.clone(), kind, prompt: meta.prompt.clone(), model_id: Some(meta.model_id.clone()), created_at: now, server_progress: None, expected_secs: expected, batch_count: meta.batch_count });
      }
    }
  }

  /// Applies a poll of the session's jobs, keeping only `kind`'s.
  pub fn apply_jobs(&mut self, kind: MediaKind, jobs: &[Job], catalog: &Catalog) -> Vec<FeedNotice> {
    let now = chrono::Utc::now().timestamp();
    let mut notices = Vec::new();
    let mut pending = Vec::new();
    let mut failed = Vec::new();
    let relevant: Vec<&Job> = jobs.iter().filter(|j| job_kind(j, catalog) == Some(kind) && !self.dismissed.contains(&j.job_token)).collect();
    for job in relevant {
      let meta = self.meta.get(&job.job_token).cloned();
      let meta = meta.as_ref();
      let model_id = meta.map(|m| m.model_id.clone()).or_else(|| job.request.maybe_model_type.clone());
      let prompt = meta.map(|m| m.prompt.clone()).or_else(|| job.request.maybe_raw_inference_text.clone()).unwrap_or_default();
      match job.status.phase() {
        JobPhase::Running => {
          self.seen_running.insert(job.job_token.clone());
          let expected = model_id.as_deref().and_then(|id| catalog.find(id)).map_or(if kind == MediaKind::Video { 900.0 } else { 30.0 }, |m| m.expected_secs);
          pending.push(PendingJob { job_token: job.job_token.clone(), kind, prompt, model_id, created_at: unix_secs(&job.created_at), server_progress: Some(job.status.progress_percentage), expected_secs: expected, batch_count: meta.map_or(1, |m| m.batch_count) });
        },
        JobPhase::Failed => {
          let updated = unix_secs(&job.updated_at);
          if self.seen_running.remove(&job.job_token) {
            notices.push(FeedNotice::Failed(job.status.maybe_failure_message.clone().unwrap_or_else(|| job.status.failure_reason())));
          }
          if now - updated <= FAILURE_WINDOW_SECS {
            failed.push(FailedJob { job_token: job.job_token.clone(), prompt, model_id, updated_at: updated, reason: job.status.failure_reason(), message: job.status.maybe_failure_message.clone().filter(|_| job.status.maybe_failure_category_updated.as_deref() != Some("unknown")), ref_image: meta.and_then(|m| m.ref_image.clone()) });
          }
        },
        JobPhase::Succeeded => {
          if !self.seen_complete.insert(job.job_token.clone()) || !self.first_poll_done {
            continue;
          }
          if self.seen_running.remove(&job.job_token) {
            notices.push(FeedNotice::Completed);
          }
          let Some(result) = &job.maybe_result else {
            continue;
          };
          // The finished card takes the pending card's place: date it by the job.
          let created_at = unix_secs(&job.created_at);
          self.push_item(FeedItem { token: result.entity_token.clone(), kind, thumbnail: result.media_links.thumbnail(THUMBNAIL_WIDTH), full_url: result.media_links.cdn_url.clone(), created_at, model_id: model_id.clone(), prompt_token: job.request.maybe_prompt_token.clone(), batch_token: result.maybe_batch_token.clone(), duration_secs: None });
          if let Some(batch) = &result.maybe_batch_token {
            notices.push(FeedNotice::LoadBatch { job_token: job.job_token.clone(), batch_token: batch.clone() });
          }
        },
      }
    }
    // Jobs started a moment ago may not be in the list yet: keep them.
    for p in self.pending.drain(..) {
      let listed = jobs.iter().any(|j| j.job_token == p.job_token);
      if !listed && now - p.created_at < 60 && !pending.iter().any(|q: &PendingJob| q.job_token == p.job_token) {
        pending.push(p);
      }
    }
    // Everything finished before the first poll comes from the library instead.
    self.first_poll_done = true;
    pending.sort_by_key(|p| std::cmp::Reverse(p.created_at));
    failed.sort_by_key(|f| std::cmp::Reverse(f.updated_at));
    self.pending = pending;
    self.failed = failed;
    notices
  }

  /// Adds every file of a finished batch, dated like the batch's first card.
  pub fn apply_batch(&mut self, kind: MediaKind, files: &[MediaFile]) {
    for file in files {
      let mut item = feed_item(kind, file);
      if let Some(first) = self.items.iter().find(|i| i.batch_token.is_some() && i.batch_token == file.maybe_batch_token) {
        item.created_at = first.created_at;
      }
      self.push_item(item);
    }
  }

  pub fn library_started(&self) -> bool {
    self.library_started
  }

  /// The next library page to fetch, if one is due.
  pub fn next_library_page(&mut self) -> Option<u32> {
    if self.loading || (self.library_started && !self.has_more) {
      return None;
    }
    self.loading = true;
    self.library_started = true;
    Some(self.next_page)
  }

  pub fn apply_library_page(&mut self, kind: MediaKind, page: u32, files: &[MediaFile], total_pages: u32) {
    self.loading = false;
    if page != self.next_page {
      return;
    }
    for file in files {
      self.push_item(feed_item(kind, file));
    }
    self.next_page = page + 1;
    self.has_more = self.next_page < total_pages;
  }

  pub fn library_failed(&mut self) {
    self.loading = false;
  }

  /// Starts the library over (after signing in or out).
  pub fn reset(&mut self) {
    *self = Self { dismissed: std::mem::take(&mut self.dismissed), ..Self::default() };
  }

  pub fn dismiss(&mut self, job_token: &str) {
    self.dismissed.insert(job_token.to_owned());
    self.failed.retain(|f| f.job_token != job_token);
  }

  pub fn remove_item(&mut self, token: &str) {
    self.items.retain(|i| i.token != token);
    self.selected.remove(token);
  }

  pub fn find(&self, token: &str) -> Option<&FeedItem> {
    self.items.iter().find(|i| i.token == token)
  }

  /// Finished items newest first (the lightbox's prev/next order).
  pub fn ordered_tokens(&self) -> Vec<String> {
    let mut items: Vec<&FeedItem> = self.items.iter().collect();
    items.sort_by_key(|i| std::cmp::Reverse(i.created_at));
    items.into_iter().map(|i| i.token.clone()).collect()
  }

  fn push_item(&mut self, item: FeedItem) {
    if !item.token.is_empty() && !self.items.iter().any(|i| i.token == item.token) {
      self.items.push(item);
    }
  }
}

/// Builds a feed item from a library or batch file.
pub fn feed_item(kind: MediaKind, file: &MediaFile) -> FeedItem {
  FeedItem {
    token: file.token.clone(),
    kind: match file.media_class.as_deref() {
      Some("video") => MediaKind::Video,
      Some("image") => MediaKind::Image,
      _ => kind,
    },
    thumbnail: file.media_links.thumbnail(THUMBNAIL_WIDTH),
    full_url: file.media_links.cdn_url.clone(),
    created_at: unix_secs(&file.created_at),
    model_id: file.maybe_model_type.clone().or_else(|| file.maybe_origin_model_type.clone()),
    prompt_token: file.maybe_prompt_token.clone(),
    batch_token: file.maybe_batch_token.clone(),
    duration_secs: file.maybe_duration_millis.map(|ms| ms as f32 / 1000.0),
  }
}

/// Whether a job made an image or a video: by its model, else by its category.
fn job_kind(job: &Job, catalog: &Catalog) -> Option<MediaKind> {
  if let Some(model) = job.request.maybe_model_type.as_deref() {
    if catalog.image.iter().any(|m| m.id == model) {
      return Some(MediaKind::Image);
    }
    if catalog.video.iter().any(|m| m.id == model) {
      return Some(MediaKind::Video);
    }
  }
  let category = job.request.inference_category.as_str();
  if category.contains("video") {
    Some(MediaKind::Video)
  } else if category.contains("image") {
    Some(MediaKind::Image)
  } else {
    None
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::models::ModelInfo;

  fn catalog() -> Catalog {
    let mut c = Catalog::default();
    c.set_image(vec![ModelInfo { id: "nano_banana_pro".into(), name: "Nano Banana Pro".into(), prompt_supported: true, ..Default::default() }]);
    c.set_video(vec![ModelInfo { id: "seedance_2p0".into(), name: "Seedance 2.0".into(), ..Default::default() }]);
    c
  }

  fn job(token: &str, model: &str, status: &str, created: &str) -> Job {
    serde_json::from_value(serde_json::json!({
      "job_token": token,
      "request": { "inference_category": "image_generation", "maybe_model_type": model, "maybe_raw_inference_text": "a red knight" },
      "status": { "status": status, "progress_percentage": 40, "maybe_failure_message": "Too spicy", "maybe_failure_category_updated": "rule_bans_user_text_prompt" },
      "maybe_result": { "entity_token": format!("m_{token}"), "media_links": { "cdn_url": "https://cdn/x.png", "maybe_thumbnail_template": "https://cdn/w={WIDTH}/x.png" } },
      "created_at": created,
      "updated_at": created,
    }))
    .expect("job json")
  }

  fn now_rfc3339() -> String {
    chrono::Utc::now().to_rfc3339()
  }

  #[test]
  fn first_poll_leaves_old_results_to_the_library() {
    let (c, mut store) = (catalog(), FeedStore::default());
    let notices = store.apply_jobs(MediaKind::Image, &[job("j1", "nano_banana_pro", "complete_success", &now_rfc3339())], &c);
    assert!(notices.is_empty());
    assert!(store.items.is_empty());
  }

  #[test]
  fn running_jobs_become_pending_then_announce_their_result() {
    let (c, mut store) = (catalog(), FeedStore::default());
    let t = now_rfc3339();
    store.apply_jobs(MediaKind::Image, &[], &c);
    store.apply_jobs(MediaKind::Image, &[job("j1", "nano_banana_pro", "started", &t)], &c);
    assert_eq!(store.pending.len(), 1);
    assert_eq!(store.pending[0].prompt, "a red knight");
    assert_eq!(store.pending[0].server_progress, Some(40));

    let notices = store.apply_jobs(MediaKind::Image, &[job("j1", "nano_banana_pro", "complete_success", &t)], &c);
    assert_eq!(notices, vec![FeedNotice::Completed]);
    assert!(store.pending.is_empty());
    assert_eq!(store.items[0].token, "m_j1");
    assert_eq!(store.items[0].thumbnail.as_deref(), Some("https://cdn/w=512/x.png"));
  }

  #[test]
  fn failures_show_with_their_reason_and_can_be_dismissed() {
    let (c, mut store) = (catalog(), FeedStore::default());
    let t = now_rfc3339();
    store.apply_jobs(MediaKind::Image, &[job("j2", "nano_banana_pro", "pending", &t)], &c);
    let notices = store.apply_jobs(MediaKind::Image, &[job("j2", "nano_banana_pro", "complete_failure", &t)], &c);
    assert_eq!(notices, vec![FeedNotice::Failed("Too spicy".into())]);
    assert_eq!(store.failed[0].reason, "Text prompt violates content policy");
    store.dismiss("j2");
    store.apply_jobs(MediaKind::Image, &[job("j2", "nano_banana_pro", "complete_failure", &t)], &c);
    assert!(store.failed.is_empty());
  }

  #[test]
  fn jobs_go_to_the_feed_of_their_model() {
    let (c, mut store) = (catalog(), FeedStore::default());
    store.apply_jobs(MediaKind::Video, &[job("j3", "nano_banana_pro", "started", &now_rfc3339())], &c);
    assert!(store.pending.is_empty());
    store.apply_jobs(MediaKind::Video, &[job("j4", "seedance_2p0", "started", &now_rfc3339())], &c);
    assert_eq!(store.pending.len(), 1);
  }

  #[test]
  fn just_enqueued_jobs_survive_a_poll_that_predates_them() {
    let (c, mut store) = (catalog(), FeedStore::default());
    let meta = EnqueueMeta { prompt: "p".into(), model_id: "nano_banana_pro".into(), batch_count: 2, ref_image: None };
    store.add_enqueued(MediaKind::Image, &["fresh".into()], &meta, &c);
    store.apply_jobs(MediaKind::Image, &[], &c);
    assert_eq!(store.pending.len(), 1);
    assert_eq!(store.pending[0].batch_count, 2);
  }
}
