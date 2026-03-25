use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;

use log::{error, info, warn};

use crate::client::pager_client::PagerClient;
use crate::worker::pager_worker_message_queue::SharedMessageQueue;

/// A background worker thread that consumes a message queue and sends pages.
pub struct PagerWorkerThread {
  queue: SharedMessageQueue,
  client: PagerClient,
  shutdown: Arc<AtomicBool>,
}

impl PagerWorkerThread {
  pub fn new(
    queue: SharedMessageQueue,
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
        Some(items) => items,
        None => {
          warn!("Pager worker queue lock was poisoned. Retrying in 5s.");
          tokio::time::sleep(Duration::from_secs(5)).await;
          continue;
        }
      };

      if items.is_empty() {
        // Woken up for shutdown with no items.
        continue;
      }

      info!("Pager worker processing {} queued notification(s).", items.len());

      for notification in &items {
        if self.shutdown.load(Ordering::Relaxed) {
          warn!("Pager worker shutting down, {} item(s) still in batch.", items.len());
          break;
        }

        match self.client.send_page(notification).await {
          Ok(success) => {
            info!(
              "Pager worker sent page: id={}, summary={}",
              success.id, notification.summary
            );
          }
          Err(err) => {
            error!(
              "Pager worker failed to send page for '{}': {}",
              notification.summary, err
            );
            // Don't kill the thread on errors — keep processing.
          }
        }
      }
    }

    // Drain any remaining items on shutdown.
    let remaining = self.queue.drain_available();
    if !remaining.is_empty() {
      warn!(
        "Pager worker shutting down with {} unsent notification(s) in queue.",
        remaining.len()
      );
    }

    info!("Pager worker thread stopped.");
  }
}
