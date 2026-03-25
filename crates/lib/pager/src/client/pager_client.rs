use log::{error, info};

use rootly_client::creds::rootly_api_key::RootlyApiKey;
use rootly_client::requests::create_alert::create_alert::{
  create_alert, CreateAlertArgs, CreateAlertSuccess,
};

use crate::error::pager_client_error::PagerClientError;
use crate::notification::notification_details::NotificationDetails;

/// Configuration for the pager client.
#[derive(Clone)]
pub struct PagerClientConfig {
  /// Rootly API key.
  pub api_key: RootlyApiKey,

  /// The source tag sent with every alert (e.g. "artcraft", "seedance2pro-job").
  pub source: String,

  /// Optional alert urgency ID (e.g. High urgency).
  pub alert_urgency_id: Option<String>,

  /// Optional notification target type (e.g. "User", "EscalationPolicy").
  pub notification_target_type: Option<String>,

  /// Optional notification target ID.
  pub notification_target_id: Option<String>,
}

/// The actual client that sends pages to Rootly.
#[derive(Clone)]
pub struct PagerClient {
  config: PagerClientConfig,
}

impl PagerClient {
  pub fn new(config: PagerClientConfig) -> Self {
    Self { config }
  }

  /// Send a page immediately via the Rootly API.
  pub async fn send_page(&self, notification: &NotificationDetails) -> Result<CreateAlertSuccess, PagerClientError> {
    info!("Sending page: {}", notification.summary);

    let result = create_alert(CreateAlertArgs {
      api_key: self.config.api_key.clone(),
      source: self.config.source.clone(),
      summary: notification.summary.clone(),
      description: notification.description.clone(),
      status: Some("triggered".to_string()),
      service_ids: None,
      group_ids: None,
      environment_ids: None,
      external_id: None,
      external_url: None,
      alert_urgency_id: self.config.alert_urgency_id.clone(),
      notification_target_type: self.config.notification_target_type.clone(),
      notification_target_id: self.config.notification_target_id.clone(),
      labels: None,
      deduplication_key: None,
    }).await;

    match result {
      Ok(success) => {
        info!("Page sent successfully: id={}, short_id={:?}", success.id, success.short_id);
        Ok(success)
      }
      Err(err) => {
        error!("Failed to send page: {}", err);
        Err(PagerClientError::RootlyError(err))
      }
    }
  }
}
