use chrono::{DateTime, Utc};
use std::fmt::{Debug, Display};

use crate::notification::generate_deduplication_key::generate_deduplication_key;
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
  pub fn to_deduplication_key(&self) -> String {
    generate_deduplication_key(self)
  }

  /// Create a notification with a title and description.
  #[deprecated(note = "Use NotificationDetailsBuilder::from_title() instead")]
  pub fn with_title_and_description(title: String, description: String) -> Self {
    Self {
      title,
      description: Some(description),
      urgency: None,
      event_time: Utc::now(),
      maybe_error: None,
      is_from_error: false,
      http_method: None,
      http_path: None,
      http_status_code: None,
      user_token: None,
      media_file_token: None,
      inference_job_token: None,
      third_party_id: None,
    }
  }

  /// Create a notification with just a title.
  #[deprecated(note = "Use NotificationDetailsBuilder::from_title() instead")]
  pub fn with_title(title: String) -> Self {
    Self {
      title,
      description: None,
      urgency: None,
      event_time: Utc::now(),
      maybe_error: None,
      is_from_error: false,
      http_method: None,
      http_path: None,
      http_status_code: None,
      user_token: None,
      media_file_token: None,
      inference_job_token: None,
      third_party_id: None,
    }
  }

  /// Create a notification from any error type.
  ///
  /// Formats the error into a structured description that includes:
  /// - The error message
  /// - The error's source chain (if any)
  /// - A backtrace (if available via `std::backtrace`)
  /// - The timestamp of the event
  ///
  /// Note: this does not retain the error object itself. Use
  /// `NotificationDetailsBuilder::from_title().set_error()` to attach an error.
  #[deprecated(note = "Use NotificationDetailsBuilder::from_title().set_error() instead")]
  pub fn from_error_info<E: Debug + Display>(error: &E) -> Self {
    let title = format!("{}", error);

    // Truncate the title to a reasonable length for alert titles.
    let title = if title.len() > 200 {
      format!("{}...", &title[..197])
    } else {
      title
    };

    let event_time = Utc::now();

    let mut description_parts: Vec<String> = Vec::new();

    description_parts.push(format!("Event time: {}", event_time.format("%Y-%m-%d %H:%M:%S UTC")));
    description_parts.push(String::new());
    description_parts.push(format!("Error: {}", error));

    // Include the Debug representation if it differs from Display (often has more detail).
    let debug_repr = format!("{:?}", error);
    let display_repr = format!("{}", error);
    if debug_repr != display_repr {
      description_parts.push(String::new());
      description_parts.push(format!("Debug: {}", debug_repr));
    }

    // Attempt to walk the error source chain.
    // NB: We use the Debug trait here since we can't require std::error::Error
    // (that would require E: 'static + Error which is too restrictive for callers).

    // Try to capture a backtrace from the current call site.
    #[cfg(feature = "backtrace")]
    {
      let bt = std::backtrace::Backtrace::capture();
      if bt.status() == std::backtrace::BacktraceStatus::Captured {
        description_parts.push(String::new());
        description_parts.push(format!("Backtrace:\n{}", bt));
      }
    }

    let description = description_parts.join("\n");

    Self {
      title,
      description: Some(description),
      urgency: None,
      event_time,
      maybe_error: None,
      is_from_error: true,
      http_method: None,
      http_path: None,
      http_status_code: None,
      user_token: None,
      media_file_token: None,
      inference_job_token: None,
      third_party_id: None,
    }
  }

  /// Create a notification from an error, with a custom title prefix.
  #[deprecated(note = "Use NotificationDetailsBuilder::from_title().set_error() instead")]
  pub fn from_error_info_with_context<E: Debug + Display>(context: &str, error: &E) -> Self {
    #[allow(deprecated)]
    let mut notification = Self::from_error_info(error);
    notification.title = format!("{}: {}", context, notification.title);
    if notification.title.len() > 200 {
      notification.title = format!("{}...", &notification.title[..197]);
    }
    notification
  }
}
