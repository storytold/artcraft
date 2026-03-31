use std::sync::Arc;

use log::warn;
use rootly_client::creds::rootly_api_key::RootlyApiKey;

use crate::client::pager::Pager;
use crate::client::pager_client::{PagerClient, PagerClientConfig};
use crate::worker::pager_worker_message_queue::{new_shared_queue, new_shared_queue_with_capacity, PagerWorkerMessageQueue};
use crate::worker::pager_worker::PagerWorker;

/// Builder for constructing a `Pager` instance.
pub struct PagerBuilder {
  client_config: Option<PagerClientConfig>,
  application_name: Option<String>,
  environment: Option<String>,
  hostname: Option<String>,
  service_id: Option<String>,
  queue_capacity: Option<usize>,
}

impl PagerBuilder {
  pub fn new() -> Self {
    Self {
      client_config: None,
      application_name: None,
      environment: None,
      hostname: None,
      service_id: None,
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

  /// Set the hostname of the machine sending alerts.
  pub fn hostname(mut self, hostname: String) -> Self {
    self.hostname = Some(hostname);
    self
  }

  /// Set the service ID to associate alerts with.
  pub fn service_id(mut self, service_id: String) -> Self {
    self.service_id = Some(service_id);
    self
  }

  /// Configure the Rootly backend. Returns a sub-builder for Rootly-specific options.
  pub fn rootly(self, api_key: RootlyApiKey) -> RootlyConfigBuilder {
    RootlyConfigBuilder {
      parent: self,
      api_key,
      urgency_id_high: None,
      urgency_id_medium: None,
      urgency_id_low: None,
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
  /// If no backend was configured, a NoOp pager is returned.
  pub fn build(self) -> Pager {
    let client = self.make_client();
    Pager::new(client)
  }

  /// Build a `Pager` with a background worker thread.
  ///
  /// If no backend was configured, a NoOp pager is returned (the worker will idle).
  ///
  /// The caller is responsible for running the worker on a dedicated thread:
  /// ```ignore
  /// let (pager, worker) = PagerBuilder::new()
  ///     .application_name("my-service".to_string())
  ///     .rootly(api_key)
  ///     .build_with_worker();
  /// ```
  pub fn build_with_worker(self) -> (Pager, PagerWorker) {
    let client = self.make_client();

    let queue: Arc<PagerWorkerMessageQueue> = match self.queue_capacity {
      Some(capacity) => new_shared_queue_with_capacity(capacity),
      None => new_shared_queue(),
    };

    let worker = PagerWorker::new(queue.clone(), client.clone());
    let shutdown = worker.shutdown_handle();
    let pager = Pager::with_queue(client, queue, shutdown);

    (pager, worker)
  }

  fn make_client(&self) -> PagerClient {
    let client_config = match self.client_config.clone() {
      Some(config) => config,
      None => {
        warn!("No pager backend configured. Using NoOp pager.");
        PagerClientConfig::NoOp
      }
    };

    PagerClient::new(client_config, self.application_name.clone(), self.environment.clone(), self.hostname.clone(), self.service_id.clone())
  }
}

/// Sub-builder for configuring the Rootly backend.
/// Returned by `PagerBuilder::rootly()`.
pub struct RootlyConfigBuilder {
  parent: PagerBuilder,
  api_key: RootlyApiKey,
  urgency_id_high: Option<String>,
  urgency_id_medium: Option<String>,
  urgency_id_low: Option<String>,
  notification_target_type: Option<String>,
  notification_target_id: Option<String>,
}

impl RootlyConfigBuilder {
  /// Set the urgency ID for high-urgency alerts.
  pub fn urgency_id_high(mut self, id: String) -> Self {
    self.urgency_id_high = Some(id);
    self
  }

  /// Set the urgency ID for medium-urgency alerts.
  pub fn urgency_id_medium(mut self, id: String) -> Self {
    self.urgency_id_medium = Some(id);
    self
  }

  /// Set the urgency ID for low-urgency alerts.
  pub fn urgency_id_low(mut self, id: String) -> Self {
    self.urgency_id_low = Some(id);
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
      urgency_id_high: self.urgency_id_high,
      urgency_id_medium: self.urgency_id_medium,
      urgency_id_low: self.urgency_id_low,
      notification_target_type: self.notification_target_type,
      notification_target_id: self.notification_target_id,
    });
    self.parent
  }

  /// Shortcut: finish Rootly config and build without a worker.
  pub fn build(self) -> Pager {
    self.done().build()
  }

  /// Shortcut: finish Rootly config and build with a worker.
  pub fn build_with_worker(self) -> (Pager, PagerWorker) {
    self.done().build_with_worker()
  }
}
