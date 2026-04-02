use chrono::{DateTime, Utc};

use crate::notification::generate_deduplication_key::generate_deduplication_key;
use crate::notification::notification_details_builder::NotificationDetailsBuilder;
use crate::notification::notification_urgency::NotificationUrgency;

/// Details for a pager notification.
#[derive(Debug)]
pub struct NotificationDetails {
  /// Title or summary of the alert.
  pub title: String,

  /// Full details for the alert.
  pub description: Option<String>,

  /// Urgency level for the notification.
  pub urgency: Option<NotificationUrgency>,

  /// When the event occurred.
  pub event_time: DateTime<Utc>,

  /// The error that triggered this notification, if any.
  pub maybe_error: Option<Box<dyn std::error::Error + Send + Sync + 'static>>,

  /// Whether this notification originated from an error.
  pub is_from_error: bool,

  /// HTTP method associated with the event, if any.
  pub http_method: Option<String>,

  /// HTTP endpoint path associated with the event, if any.
  pub http_path: Option<String>,

  /// HTTP status code associated with the event, if any.
  pub http_status_code: Option<u16>,

  /// User token associated with the event, if any.
  pub user_token: Option<String>,

  /// Media file token associated with the event, if any.
  pub media_file_token: Option<String>,

  /// Inference job token associated with the event, if any.
  pub inference_job_token: Option<String>,

  /// Third-party identifier associated with the event, if any.
  pub third_party_id: Option<String>,
}

impl NotificationDetails {
  pub fn from_title(title: String) -> NotificationDetailsBuilder {
    NotificationDetailsBuilder::from_title(title)
  }

  pub fn to_deduplication_key(&self) -> String {
    generate_deduplication_key(self)
  }
}
