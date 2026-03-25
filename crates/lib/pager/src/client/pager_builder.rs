use rootly_client::creds::rootly_api_key::RootlyApiKey;

use crate::client::pager::Pager;
use crate::client::pager_client::{PagerClient, PagerClientConfig};
use crate::error::pager_client_error::PagerClientError;
use crate::error::pager_error::PagerError;
use crate::worker::pager_worker_message_queue::{new_shared_queue, new_shared_queue_with_capacity, SharedMessageQueue};
use crate::worker::pager_worker_thread::PagerWorkerThread;

/// Builder for constructing a `Pager` instance.
pub struct PagerBuilder {
  config: Option<PagerClientConfig>,
  enable_worker: bool,
  queue_capacity: Option<usize>,
}

impl PagerBuilder {
  pub fn new() -> Self {
    Self {
      config: None,
      enable_worker: false,
      queue_capacity: None,
    }
  }

  /// Configure the Rootly backend. Returns a sub-builder for Rootly-specific options.
  pub fn rootly(
    self,
    api_key: RootlyApiKey,
    source: String,
  ) -> RootlyConfigBuilder {
    RootlyConfigBuilder {
      parent: self,
      api_key,
      source,
      alert_urgency_id: None,
      notification_target_type: None,
      notification_target_id: None,
      environment: None,
    }
  }

  /// Set the backend config directly (for advanced use or future backends).
  pub fn config(mut self, config: PagerClientConfig) -> Self {
    self.config = Some(config);
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
  /// The caller is responsible for spawning the worker thread (via `Pager::take_worker()`).
  pub fn build(self) -> Result<Pager, PagerError> {
    let config = self.config
      .ok_or(PagerClientError::NotConfigured("no backend configured — call .rootly() or .config()".to_string()))?;

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

    Ok(Pager::new(client, queue, worker, worker_shutdown))
  }
}

/// Sub-builder for configuring the Rootly backend.
/// Returned by `PagerBuilder::rootly()`.
pub struct RootlyConfigBuilder {
  parent: PagerBuilder,
  api_key: RootlyApiKey,
  source: String,
  alert_urgency_id: Option<String>,
  notification_target_type: Option<String>,
  notification_target_id: Option<String>,
  environment: Option<String>,
}

impl RootlyConfigBuilder {
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

  /// Set the environment label (e.g. "production", "staging").
  pub fn environment(mut self, environment: String) -> Self {
    self.environment = Some(environment);
    self
  }

  /// Finish Rootly configuration and return to the parent builder.
  pub fn done(mut self) -> PagerBuilder {
    self.parent.config = Some(PagerClientConfig::Rootly {
      api_key: self.api_key,
      alert_urgency_id: self.alert_urgency_id,
      source: self.source,
      notification_target_type: self.notification_target_type,
      notification_target_id: self.notification_target_id,
      environment: self.environment,
    });
    self.parent
  }

  /// Shortcut: finish Rootly config, enable worker, and build.
  pub fn with_worker(self) -> PagerBuilder {
    self.done().with_worker()
  }

  /// Shortcut: finish Rootly config and build immediately.
  pub fn build(self) -> Result<Pager, PagerError> {
    self.done().build()
  }
}
