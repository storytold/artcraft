use chrono::{DateTime, Utc};

use crate::notification::generate_deduplication_key::generate_deduplication_key;
use crate::notification::notification_details_builder::NotificationDetailsBuilder;
use crate::notification::notification_urgency::NotificationUrgency;

/// Details for a pager notification.
#[derive(Debug)]
pub struct NotificationDetails {
  /// Title or summary of the alert.
  pub(crate) title: String,

  /// Full details for the alert.
  pub(crate) description: Option<String>,

  /// Urgency level for the notification.
  pub(crate) urgency: Option<NotificationUrgency>,

  /// When the event occurred.
  pub(crate) event_time: DateTime<Utc>,

  /// The error that triggered this notification, if any.
  pub(crate) maybe_error: Option<Box<dyn std::error::Error + Send + Sync + 'static>>,

  /// Whether this notification originated from an error.
  pub(crate) is_from_error: bool,

  /// HTTP method associated with the event, if any.
  pub(crate) http_method: Option<String>,

  /// HTTP endpoint path associated with the event, if any.
  pub(crate) http_path: Option<String>,

  /// HTTP status code associated with the event, if any.
  pub(crate) http_status_code: Option<u16>,

  /// User token associated with the event, if any.
  pub(crate) user_token: Option<String>,

  /// Media file token associated with the event, if any.
  pub(crate) media_file_token: Option<String>,

  /// Inference job token associated with the event, if any.
  pub(crate) inference_job_token: Option<String>,

  /// Third-party identifier associated with the event, if any.
  pub(crate) third_party_id: Option<String>,
}

impl NotificationDetails {
  pub fn to_deduplication_key(&self) -> String {
    generate_deduplication_key(self)
  }
}
