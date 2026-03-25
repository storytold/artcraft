use std::sync::Arc;
use std::sync::atomic::AtomicBool;

use log::info;

use crate::client::pager_client::{PageSentResult, PagerClient};
use crate::error::pager_error::PagerError;
use crate::error::pager_service_error::PagerServiceError;
use crate::notification::notification_details::NotificationDetails;
use crate::worker::pager_worker_message_queue::SharedMessageQueue;
use crate::worker::pager_worker_thread::PagerWorkerThread;

/// The main programmer interface to the pager system.
///
/// Supports two modes:
/// - **Immediate**: `send_page_immediately()` sends inline (blocks until API responds).
/// - **Queued**: `enqueue_page()` pushes to a background worker (non-blocking).
///
/// Build an instance via `PagerBuilder`.
///
pub struct Pager {
  client: PagerClient,
  queue: Option<SharedMessageQueue>,
  worker: Option<PagerWorkerThread>,
  worker_shutdown: Option<Arc<AtomicBool>>,
}

impl Pager {

  /// External users will need to create instances via `PagerBuilder`.
  pub(crate) fn new(
    client: PagerClient,
    queue: Option<SharedMessageQueue>,
    worker: Option<PagerWorkerThread>,
    worker_shutdown: Option<Arc<AtomicBool>>,
  ) -> Self {
    Self { client, queue, worker, worker_shutdown }
  }

  /// Send a page immediately, blocking until the API responds.
  pub async fn send_page_immediately(
    &self,
    notification: NotificationDetails,
  ) -> Result<PageSentResult, PagerError> {
    self.client.send_page(&notification)
        .await
        .map_err(PagerError::Client)
  }

  /// Enqueue a page to be sent by the background worker thread.
  ///
  /// Returns an error if the worker is not configured.
  /// If the queue is full, the oldest item is dropped.
  pub fn enqueue_page(
    &self,
    notification: NotificationDetails,
  ) -> Result<(), PagerError> {
    let queue = self.queue.as_ref()
      .ok_or(PagerServiceError::WorkerNotAvailable)?;

    let dropped = queue.push(notification)
      .map_err(PagerError::Service)?;

    if let Some(dropped_summary) = dropped {
      // We still enqueued the new item — just warn that we lost an old one.
      log::warn!("Pager queue overflow: dropped '{}'", dropped_summary);
    }

    Ok(())
  }

  /// Take the worker thread out of this Pager so it can be spawned.
  ///
  /// Returns `None` if the worker was not configured or was already taken.
  pub fn take_worker(&mut self) -> Option<PagerWorkerThread> {
    self.worker.take()
  }

  /// Signal the worker thread to shut down.
  pub fn shutdown_worker(&self) {
    if let Some(ref shutdown) = self.worker_shutdown {
      info!("Pager: signaling worker shutdown.");
      shutdown.store(true, std::sync::atomic::Ordering::Relaxed);
      if let Some(ref queue) = self.queue {
        queue.notify_all();
      }
    }
  }
}
