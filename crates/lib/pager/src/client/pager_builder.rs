use std::sync::Arc;

use rootly_client::creds::rootly_api_key::RootlyApiKey;

use crate::client::pager::Pager;
use crate::client::pager_client::{PagerClient, PagerClientConfig};
use crate::error::pager_builder_error::PagerBuilderError;
use crate::error::pager_error::PagerError;
use crate::worker::pager_worker_message_queue::{new_shared_queue, new_shared_queue_with_capacity, PagerWorkerMessageQueue};
use crate::worker::pager_worker::PagerWorker;

/// Builder for constructing a `Pager` instance.
pub struct PagerBuilder {
  client_config: Option<PagerClientConfig>,
  application_name: Option<String>,
  environment: Option<String>,
  queue_capacity: Option<usize>,
}

impl PagerBuilder {
  pub fn new() -> Self {
    Self {
      client_config: None,
      application_name: None,
      environment: None,
      queue_capacity: None,
    }
  }

  /// Set the application name (used as the "source" tag on alerts).
  pub fn application_name(mut self, name: String) -> Self {
    self.application_name = Some(name);
    self
  }

  /// Set the environment label (e.g. "production", "staging").
  pub fn environment(mut self, environment: String) -> Self {
    self.environment = Some(environment);
    self
  }

  /// Configure the Rootly backend. Returns a sub-builder for Rootly-specific options.
  pub fn rootly(self, api_key: RootlyApiKey) -> RootlyConfigBuilder {
    RootlyConfigBuilder {
      parent: self,
      api_key,
      alert_urgency_id: None,
      notification_target_type: None,
      notification_target_id: None,
    }
  }

  /// Set the backend config directly (for advanced use or future backends).
  pub fn client_config(mut self, config: PagerClientConfig) -> Self {
    self.client_config = Some(config);
    self
  }

  /// Set the maximum capacity for the worker message queue.
  /// Only relevant when using `build_with_worker()`.
  pub fn queue_capacity(mut self, capacity: usize) -> Self {
    self.queue_capacity = Some(capacity);
    self
  }

  /// Build a `Pager` without a background worker.
  ///
  /// Only `send_page_immediately()` will be available.
  /// Calling `enqueue_page()` will return `PagerServiceError::WorkerNotAvailable`.
  pub fn build(self) -> Result<Pager, PagerError> {
    let client = self.make_client()?;
    Ok(Pager::new(client))
  }

  /// Build a `Pager` with a background worker thread.
  ///
  /// Returns both the `Pager` (for enqueuing) and the `PagerWorker` (to spawn).
  /// The caller is responsible for running the worker on a dedicated thread:
  /// ```ignore
  /// let (pager, worker) = PagerBuilder::new()
  ///     .application_name("my-service".to_string())
  ///     .rootly(api_key)
  ///     .build_with_worker()?;
  ///
  /// std::thread::spawn(move || {
  ///   let rt = tokio::runtime::Runtime::new().unwrap();
  ///   rt.block_on(worker.run());
  /// });
  /// ```
  pub fn build_with_worker(self) -> Result<(Pager, PagerWorker), PagerError> {
    let client = self.make_client()?;

    let queue: Arc<PagerWorkerMessageQueue> = match self.queue_capacity {
      Some(capacity) => new_shared_queue_with_capacity(capacity),
      None => new_shared_queue(),
    };

    let worker = PagerWorker::new(queue.clone(), client.clone());
    let shutdown = worker.shutdown_handle();
    let pager = Pager::with_queue(client, queue, shutdown);

    Ok((pager, worker))
  }

  fn make_client(&self) -> Result<PagerClient, PagerError> {
    let client_config = self.client_config.clone()
      .ok_or(PagerBuilderError::NoBackendConfigured)?;

    Ok(PagerClient::new(client_config, self.application_name.clone(), self.environment.clone()))
  }
}

/// Sub-builder for configuring the Rootly backend.
/// Returned by `PagerBuilder::rootly()`.
pub struct RootlyConfigBuilder {
  parent: PagerBuilder,
  api_key: RootlyApiKey,
  alert_urgency_id: Option<String>,
  notification_target_type: Option<String>,
  notification_target_id: Option<String>,
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

  /// Finish Rootly configuration and return to the parent builder.
  pub fn done(mut self) -> PagerBuilder {
    self.parent.client_config = Some(PagerClientConfig::Rootly {
      api_key: self.api_key,
      alert_urgency_id: self.alert_urgency_id,
      notification_target_type: self.notification_target_type,
      notification_target_id: self.notification_target_id,
    });
    self.parent
  }

  /// Shortcut: finish Rootly config and build without a worker.
  pub fn build(self) -> Result<Pager, PagerError> {
    self.done().build()
  }

  /// Shortcut: finish Rootly config and build with a worker.
  pub fn build_with_worker(self) -> Result<(Pager, PagerWorker), PagerError> {
    self.done().build_with_worker()
  }
}
