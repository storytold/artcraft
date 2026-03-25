use log::{error, info};

use rootly_client::creds::rootly_api_key::RootlyApiKey;
use rootly_client::requests::create_alert::create_alert::{
  create_alert, CreateAlertArgs,
};

use crate::error::pager_error::PagerError;
use crate::error::pager_service_error::PagerServiceError;
use crate::notification::notification_details::NotificationDetails;

/// The actual client that sends pages.
#[derive(Clone)]
pub struct PagerClient {
  /// The backend-specific configuration.
  pub client_config: PagerClientConfig,

  /// Application name used as the "source" tag in alerts (e.g. "storyteller-web", "seedance2-pro-job").
  pub application_name: Option<String>,

  /// Environment label (e.g. "production", "staging"). Inserted as a label on alerts.
  pub environment: Option<String>,
}

/// Configuration for the pager client backend.
#[derive(Clone)]
pub enum PagerClientConfig {
  /// Use Rootly as the paging backend.
  Rootly {
    api_key: RootlyApiKey,

    /// Alert urgency ID (e.g. "62fde143-..." maps to "High" in our org).
    alert_urgency_id: Option<String>,

    /// Notification target type (e.g. "User", "EscalationPolicy").
    notification_target_type: Option<String>,

    /// Notification target ID (e.g. a user ID or escalation policy ID).
    notification_target_id: Option<String>,
  },
}

/// Result of a successfully sent page.
#[derive(Debug, Clone)]
pub struct PageSentResult {
  /// A backend-specific identifier for the sent notification.
  pub id: String,

  /// A short human-readable ID (if the backend provides one).
  pub short_id: Option<String>,
}

impl PagerClient {
  pub fn new(
    client_config: PagerClientConfig,
    application_name: Option<String>,
    environment: Option<String>,
  ) -> Self {
    Self { client_config, application_name, environment }
  }

  /// Send a page immediately.
  pub async fn send_page(&self, notification: &NotificationDetails) -> Result<PageSentResult, PagerError> {
    match &self.client_config {
      PagerClientConfig::Rootly { .. } => self.send_page_via_rootly(notification).await,
    }
  }

  async fn send_page_via_rootly(
    &self,
    notification: &NotificationDetails,
  ) -> Result<PageSentResult, PagerError> {
    let PagerClientConfig::Rootly {
      api_key,
      alert_urgency_id,
      notification_target_type,
      notification_target_id,
    } = &self.client_config;

    let source = self.application_name
        .clone()
        .unwrap_or_else(|| "unknown".to_string());

    info!("Sending page via Rootly (source={}): {}", source, notification.summary);

    let mut labels: Vec<(String, String)> = Vec::new();

    if let Some(env) = &self.environment {
      labels.push(("environment".to_string(), env.clone()));
    }

    let labels = if labels.is_empty() { None } else { Some(labels) };

    let result = create_alert(CreateAlertArgs {
      api_key: api_key.clone(),
      source,
      summary: notification.summary.clone(),
      description: notification.description.clone(),
      status: Some("triggered".to_string()),
      service_ids: None,
      group_ids: None,
      environment_ids: None,
      external_id: None,
      external_url: None,
      alert_urgency_id: alert_urgency_id.clone(),
      notification_target_type: notification_target_type.clone(),
      notification_target_id: notification_target_id.clone(),
      labels,
      deduplication_key: None,
    }).await;

    match result {
      Ok(success) => {
        info!("Page sent successfully via Rootly: id={}, short_id={:?}", success.id, success.short_id);
        Ok(PageSentResult {
          id: success.id,
          short_id: success.short_id,
        })
      }
      Err(err) => {
        error!("Failed to send page via Rootly: {}", err);
        Err(PagerError::Service(PagerServiceError::RootlyError(err)))
      }
    }
  }
}
