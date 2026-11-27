//! Hand-off between the generate command and the worker: an unbounded channel, so the worker sleeps until a job
//! arrives instead of polling, plus a "ready" signal the worker raises once its startup cleanup is done.

use std::sync::Mutex;
use std::time::Duration;

use anyhow::anyhow;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_resolution::CommonResolution;
use errors::AnyhowResult;
use once_cell::sync::Lazy;
use tokio::sync::mpsc::{unbounded_channel, UnboundedReceiver, UnboundedSender};
use tokio::sync::watch;
use tokens::tokens::media_files::MediaFileToken;

/// How long a request waits for the worker to start before giving up.
const READY_TIMEOUT: Duration = Duration::from_secs(10);

/// One local generation, waiting for the worker.
#[derive(Clone, Debug)]
pub struct LocalJob {
  /// Provider job id stored in the local task database.
  pub job_id: String,
  pub model_id: String,
  pub prompt: String,
  pub maybe_negative_prompt: Option<String>,
  /// Reference images in workflow order (canvas, scene, then the request's own references).
  pub image_tokens: Vec<MediaFileToken>,
  pub batch_size: u32,
  /// Picker values, applied when the model binds a size.
  pub maybe_aspect_ratio: Option<CommonAspectRatio>,
  pub maybe_resolution: Option<CommonResolution>,
}

struct Channel {
  sender: UnboundedSender<LocalJob>,
  maybe_receiver: Mutex<Option<UnboundedReceiver<LocalJob>>>,
  ready: watch::Sender<bool>,
}

static CHANNEL: Lazy<Channel> = Lazy::new(|| {
  let (sender, receiver) = unbounded_channel();
  let (ready, _) = watch::channel(false);
  Channel { sender, maybe_receiver: Mutex::new(Some(receiver)), ready }
});

/// Waits until the worker has failed the jobs a previous run left behind, so a new job is never mistaken for one.
pub async fn wait_until_ready() -> AnyhowResult<()> {
  let mut ready = CHANNEL.ready.subscribe();
  // The sender is a static, so the wait itself cannot fail: only the timeout ends it early.
  let started = tokio::time::timeout(READY_TIMEOUT, ready.wait_for(|ready| *ready)).await.is_ok();
  started.then_some(()).ok_or_else(|| anyhow!("the local model worker is not running"))
}

/// Fails only if the worker is gone (its receiver was dropped).
pub fn enqueue(job: LocalJob) -> AnyhowResult<()> {
  CHANNEL.sender.send(job).map_err(|_| anyhow!("the local model worker is not running"))
}

/// The receiving end, for the single worker. Returns None if it was already taken.
pub fn take_receiver() -> Option<UnboundedReceiver<LocalJob>> {
  CHANNEL.maybe_receiver.lock().ok()?.take()
}

pub fn mark_ready() {
  CHANNEL.ready.send_replace(true);
}
