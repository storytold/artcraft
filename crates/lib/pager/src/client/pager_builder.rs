use std::sync::Arc;
use std::sync::atomic::AtomicBool;

use rootly_client::creds::rootly_api_key::RootlyApiKey;

use crate::client::pager::Pager;
use crate::client::pager_client::{PagerClient, PagerClientConfig};
use crate::worker::pager_worker_message_queue::{new_shared_queue, new_shared_queue_with_capacity, SharedMessageQueue};
use crate::worker::pager_worker_thread::PagerWorkerThread;

/// Builder for constructing a `Pager` instance.
pub struct PagerBuilder {
  api_key: Option<RootlyApiKey>,
  source: Option<String>,
  alert_urgency_id: Option<String>,
  notification_target_type: Option<String>,
  notification_target_id: Option<String>,
  enable_worker: bool,
  queue_capacity: Option<usize>,
}

impl PagerBuilder {
  pub fn new() -> Self {
    Self {
      api_key: None,
      source: None,
      alert_urgency_id: None,
      notification_target_type: None,
      notification_target_id: None,
      enable_worker: false,
      queue_capacity: None,
    }
  }

  /// Set the Rootly API key.
  pub fn api_key(mut self, api_key: RootlyApiKey) -> Self {
    self.api_key = Some(api_key);
    self
  }

  /// Set the source tag for alerts (e.g. "artcraft", "seedance2pro-job").
  pub fn source(mut self, source: String) -> Self {
    self.source = Some(source);
    self
  }

  /// Set the alert urgency ID.
  pub fn alert_urgency_id(mut self, id: String) -> Self {
    self.alert_urgency_id = Some(id);
    self
  }

  /// Set the notification target (who gets paged).
  pub fn notification_target(mut self, target_type: String, target_id: String) -> Self {
    self.notification_target_type = Some(target_type);
    self.notification_target_id = Some(target_id);
    self
  }

  /// Enable the background worker thread for async paging via `enqueue_page()`.
  pub fn with_worker(mut self) -> Self {
    self.enable_worker = true;
    self
  }

  /// Set the maximum capacity for the worker message queue.
  /// Only relevant if `with_worker()` is called.
  pub fn queue_capacity(mut self, capacity: usize) -> Self {
    self.queue_capacity = Some(capacity);
    self
  }

  /// Build the `Pager`.
  ///
  /// If `with_worker()` was called, this also creates a `PagerWorkerThread`.
  /// The caller is responsible for spawning the worker thread (via `Pager::worker()`).
  pub fn build(self) -> Pager {
    let api_key = self.api_key.unwrap_or_else(|| {
      log::warn!("PagerBuilder: No API key set. Pages will fail at send time.");
      RootlyApiKey::new(String::new())
    });

    let source = self.source.unwrap_or_else(|| "unknown".to_string());

    let config = PagerClientConfig {
      api_key,
      source,
      alert_urgency_id: self.alert_urgency_id,
      notification_target_type: self.notification_target_type,
      notification_target_id: self.notification_target_id,
    };

    let client = PagerClient::new(config);

    let (queue, worker, worker_shutdown) = if self.enable_worker {
      let queue: SharedMessageQueue = match self.queue_capacity {
        Some(capacity) => new_shared_queue_with_capacity(capacity),
        None => new_shared_queue(),
      };

      let worker = PagerWorkerThread::new(queue.clone(), client.clone());
      let shutdown = worker.shutdown_handle();

      (Some(queue), Some(worker), Some(shutdown))
    } else {
      (None, None, None)
    };

    Pager::new(client, queue, worker, worker_shutdown)
  }
}
