use std::sync::Arc;
use std::sync::atomic::AtomicBool;

use log::info;

use crate::client::pager_client::{PageSentResult, PagerClient};
use crate::error::pager_error::PagerError;
use crate::error::pager_system_error::PagerSystemError;
use crate::notification::notification_details::NotificationDetails;
use crate::worker::pager_worker_message_queue::PagerWorkerMessageQueue;

/// The main programmer interface to the pager system.
///
/// Supports two modes:
/// - **Immediate**: `send_page_immediately()` sends inline (blocks until API responds).
/// - **Queued**: `enqueue_page()` pushes to a background worker (non-blocking).
///
/// Build an instance via `PagerBuilder`:
/// ```ignore
/// // Without worker:
/// let pager = PagerBuilder::new()
///     .application_name("my-service".to_string())
///     .rootly(api_key)
///     .build()?;
///
/// // With worker:
/// let (pager, worker) = PagerBuilder::new()
///     .application_name("my-service".to_string())
///     .rootly(api_key)
///     .build_with_worker()?;
/// ```
pub struct Pager {
  client: PagerClient,
  queue: Option<Arc<PagerWorkerMessageQueue>>,
  worker_shutdown: Option<Arc<AtomicBool>>,
}

impl Pager {
  /// Create a Pager without a worker (immediate-only mode).
  pub(crate) fn new(client: PagerClient) -> Self {
    Self { client, queue: None, worker_shutdown: None }
  }

  /// Create a Pager with a shared queue and shutdown handle (worker mode).
  pub(crate) fn with_queue(
    client: PagerClient,
    queue: Arc<PagerWorkerMessageQueue>,
    worker_shutdown: Arc<AtomicBool>,
  ) -> Self {
    Self {
      client,
      queue: Some(queue),
      worker_shutdown: Some(worker_shutdown),
    }
  }

  /// Send a page immediately, blocking until the API responds.
  pub async fn send_page_immediately(
    &self,
    notification: NotificationDetails,
  ) -> Result<PageSentResult, PagerError> {
    self.client.send_page(&notification).await
  }

  /// Enqueue a page to be sent by the background worker thread.
  ///
  /// Returns an error if the worker is not configured (use `build_with_worker()`).
  /// If the queue is full, the oldest item is dropped.
  pub fn enqueue_page(
    &self,
    notification: NotificationDetails,
  ) -> Result<(), PagerError> {
    let queue = self.queue.as_ref()
      .ok_or(PagerSystemError::QueueNotConfigured)?;

    let dropped = queue.push(notification)?;

    if let Some(dropped) = dropped {
      log::warn!("Pager queue overflow: dropped '{}'", dropped.summary);
    }

    Ok(())
  }

  /// Signal the worker thread to shut down.
  pub fn shutdown_worker(&self) {
    if let Some(ref shutdown) = self.worker_shutdown {
      info!("Pager: signaling worker shutdown.");
      shutdown.store(true, std::sync::atomic::Ordering::Relaxed);
    }
    if let Some(ref queue) = self.queue {
      info!("Pager: notifying threads blocking on queue of shutdown.");
      queue.notify_all();
    }
  }
}
