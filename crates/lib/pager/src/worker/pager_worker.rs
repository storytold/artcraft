use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;

use log::{debug, error, info, warn};

use crate::client::pager_client::PagerClient;
use crate::worker::pager_worker_message_queue::PagerWorkerMessageQueue;

/// A background worker thread that consumes a message queue and sends pages.
pub struct PagerWorker {
  queue: Arc<PagerWorkerMessageQueue>,
  client: PagerClient,
  shutdown: Arc<AtomicBool>,
}

impl PagerWorker {
  pub fn new(
    queue: Arc<PagerWorkerMessageQueue>,
    client: PagerClient,
  ) -> Self {
    Self {
      queue,
      client,
      shutdown: Arc::new(AtomicBool::new(false)),
    }
  }

  /// Get a handle to the shutdown flag so external code can trigger shutdown.
  pub fn shutdown_handle(&self) -> Arc<AtomicBool> {
    self.shutdown.clone()
  }

  /// Signal the worker to stop.
  pub fn shutdown(&self) {
    info!("Pager worker thread shutdown requested.");
    self.shutdown.store(true, Ordering::Relaxed);
    // Wake the thread in case it's blocked on wait_and_drain().
    self.queue.notify_all();
  }

  /// Run the main loop. This blocks the current thread until shutdown is signaled.
  ///
  /// Intended to be called from a dedicated thread:
  /// ```ignore
  /// std::thread::spawn(move || {
  ///   let rt = tokio::runtime::Runtime::new().unwrap();
  ///   rt.block_on(worker.run());
  /// });
  /// ```
  pub async fn run(&self) {
    info!("Pager worker thread started.");

    while !self.shutdown.load(Ordering::Relaxed) {
      // Block until items are available (or we're woken up for shutdown).
      let items = match self.queue.wait_and_drain() {
        Ok(items) => items,
        Err(err) => {
          error!("Pager worker queue error: {}. Retrying in 5s.", err);
          tokio::time::sleep(Duration::from_secs(5)).await;
          continue;
        }
      };

      if items.is_empty() {
        // Woken up for shutdown with no items.
        continue;
      }

      debug!("Pager worker processing {} queued notification(s).", items.len());

      for notification in &items {
        if self.shutdown.load(Ordering::Relaxed) {
          warn!("Pager worker shutting down, {} item(s) still in batch.", items.len());
          break;
        }

        match self.client.send_page(notification).await {
          Ok(Some(success)) => {
            debug!(
              "Pager worker sent page: id={:?}, title={}",
              success.id, notification.title
            );
          }
          Ok(None) => {
            // NoOp — already logged by the client.
          }
          Err(err) => {
            error!(
              "Pager worker failed to send page for '{}': {}",
              notification.title, err
            );
            // Don't kill the thread on errors — keep processing.
          }
        }
      }
    }

    // Drain any remaining items on shutdown.
    match self.queue.drain_available() {
      Ok(remaining) if !remaining.is_empty() => {
        warn!(
          "Pager worker shutting down with {} unsent notification(s) in queue.",
          remaining.len()
        );
      }
      Err(err) => {
        error!("Pager worker could not drain queue on shutdown: {}", err);
      }
      _ => {}
    }

    info!("Pager worker thread stopped.");
  }
}
