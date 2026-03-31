use log::{debug, warn};

use rootly_client::creds::rootly_api_key::RootlyApiKey;
use rootly_client::requests::create_alert::create_alert::{
  create_alert, CreateAlertArgs,
};

use crate::error::pager_error::PagerError;
use crate::error::pager_service_error::PagerServiceError;
use crate::notification::notification_details::NotificationDetails;
use crate::notification::notification_urgency::NotificationUrgency;

/// The actual client that sends pages.
#[derive(Clone)]
pub struct PagerClient {
  /// The backend-specific configuration.
  pub client_config: PagerClientConfig,

  /// Application name used as the "source" tag in alerts (e.g. "storyteller-web", "seedance2-pro-job").
  pub application_name: Option<String>,

  /// Environment label (e.g. "production", "staging"). Inserted as a label on alerts.
  pub environment: Option<String>,

  /// Hostname of the machine sending alerts. Inserted as a label on alerts.
  pub hostname: Option<String>,

  /// Rootly service ID to associate alerts with.
  pub service_id: Option<String>,
}

/// Configuration for the pager client backend.
#[derive(Clone)]
pub enum PagerClientConfig {
  /// No-op backend. All calls are silently ignored.
  NoOp,

  /// Use Rootly as the paging backend.
  Rootly {
    api_key: RootlyApiKey,

    /// Alert urgency ID for high-urgency alerts.
    urgency_id_high: Option<String>,

    /// Alert urgency ID for medium-urgency alerts.
    urgency_id_medium: Option<String>,

    /// Alert urgency ID for low-urgency alerts.
    urgency_id_low: Option<String>,

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
  pub id: Option<String>,

  /// A short human-readable ID (if the backend provides one).
  pub short_id: Option<String>,
}

impl PagerClient {
  pub fn new(
    client_config: PagerClientConfig,
    application_name: Option<String>,
    environment: Option<String>,
    hostname: Option<String>,
    service_id: Option<String>,
  ) -> Self {
    Self { client_config, application_name, environment, hostname, service_id }
  }

  pub fn is_noop(&self) -> bool {
    matches!(self.client_config, PagerClientConfig::NoOp)
  }

  /// Send a page immediately. Returns `Ok(None)` for NoOp.
  pub async fn send_page(&self, notification: &NotificationDetails) -> Result<Option<PageSentResult>, PagerError> {
    match &self.client_config {
      PagerClientConfig::NoOp => {
        debug!("Pager no-op: would have sent page: {}", notification.title);
        Ok(None)
      }
      PagerClientConfig::Rootly { .. } => {
        self.send_page_via_rootly(notification).await.map(Some)
      }
    }
  }

  async fn send_page_via_rootly(
    &self,
    notification: &NotificationDetails,
  ) -> Result<PageSentResult, PagerError> {
    let PagerClientConfig::Rootly {
      api_key,
      urgency_id_high,
      urgency_id_medium,
      urgency_id_low,
      notification_target_type,
      notification_target_id,
    } = &self.client_config else {
      return Ok(PageSentResult { id: None, short_id: None });
    };

    let source = self.application_name
        .clone()
        .unwrap_or_else(|| "unknown".to_string());

    debug!("Sending page via Rootly (source={}): {}", source, notification.title);

    let mut labels: Vec<(String, String)> = Vec::new();

    if let Some(name) = &self.application_name {
      labels.push(("application_name".to_string(), name.clone()));
    }

    if let Some(id) = &self.service_id {
      labels.push(("service_id".to_string(), id.clone()));
    }

    if let Some(env) = &self.environment {
      labels.push(("environment".to_string(), env.clone()));
    }

    if let Some(h) = &self.hostname {
      labels.push(("hostname".to_string(), h.clone()));
    }

    if let Some(method) = &notification.http_method {
      labels.push(("http_method".to_string(), method.clone()));
    }

    if let Some(path) = &notification.http_path {
      labels.push(("http_path".to_string(), path.clone()));
    }

    if let Some(status_code) = notification.http_status_code {
      labels.push(("http_status_code".to_string(), status_code.to_string()));
    }

    let labels = if labels.is_empty() { None } else { Some(labels) };

    // Enrich the description with context and hostname if present.
    let description = match &notification.description {
      Some(desc) => {
        let mut parts = vec![desc.clone()];

        match (&self.application_name, &self.service_id) {
          (Some(name), Some(id)) => {
            parts.push(format!("Application: {} (service_id: {})", name, id));
          }
          (Some(name), None) => {
            parts.push(format!("Application: {}", name));
          }
          (None, Some(id)) => {
            parts.push(format!("Service ID: {}", id));
          }
          (None, None) => {}
        }

        if let Some(method) = &notification.http_method {
          parts.push(format!("HTTP Method: {}", method));
        }

        if let Some(path) = &notification.http_path {
          parts.push(format!("HTTP Path: {}", path));
        }

        if let Some(status_code) = notification.http_status_code {
          parts.push(format!("HTTP Status Code: {}", status_code));
        }

        if let Some(user_token) = &notification.user_token {
          parts.push(format!("User Token: {}", user_token));
        }

        if let Some(media_file_token) = &notification.media_file_token {
          parts.push(format!("Media File Token: {}", media_file_token));
        }

        if let Some(inference_job_token) = &notification.inference_job_token {
          parts.push(format!("Inference Job Token: {}", inference_job_token));
        }

        if let Some(third_party_id) = &notification.third_party_id {
          parts.push(format!("Third Party ID: {}", third_party_id));
        }

        if let Some(h) = &self.hostname {
          parts.push(format!("Hostname: {}", h));
        }

        Some(parts.join("\n\n"))
      }
      None => None,
    };

    // https://docs.rootly.com/api-reference/alerts/creates-an-alert
    let result = create_alert(CreateAlertArgs {
      api_key: api_key.clone(),
      source: "api".to_string(),
      summary: notification.title.clone(),
      description,
      status: Some("triggered".to_string()),
      service_ids: self.service_id
          .as_ref()
          .map(|id| vec![id.clone()]),
      group_ids: None,
      environment_ids: None,
      external_id: None,
      external_url: None,
      alert_urgency_id: match notification.urgency.unwrap_or(NotificationUrgency::Medium) {
        NotificationUrgency::High => urgency_id_high.clone(),
        NotificationUrgency::Medium => urgency_id_medium.clone(),
        NotificationUrgency::Low => urgency_id_low.clone(),
      },
      notification_target_type: notification_target_type.clone(),
      notification_target_id: notification_target_id.clone(),
      labels,
      deduplication_key: Some(notification.to_deduplication_key()),
    }).await;

    match result {
      Ok(success) => {
        debug!("Page sent successfully via Rootly: id={}, short_id={:?}", success.id, success.short_id);
        Ok(PageSentResult {
          id: Some(success.id),
          short_id: success.short_id,
        })
      }
      Err(err) => {
        warn!("Failed to send page via Rootly: {}", err);
        Err(PagerError::Service(PagerServiceError::RootlyError(err)))
      }
    }
  }
}
