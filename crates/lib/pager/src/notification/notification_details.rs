use chrono::{DateTime, Utc};
use std::fmt::{Debug, Display};

use crate::notification::generate_deduplication_key::generate_deduplication_key;
use crate::notification::notification_urgency::NotificationUrgency;

/// Details for a pager notification.
#[derive(Clone, Debug)]
pub struct NotificationDetails {
  /// Title or summary of the alert.
  pub title: String,

  /// Full details for the alert.
  pub description: Option<String>,

  /// When the event occurred.
  pub event_time: DateTime<Utc>,

  /// HTTP method associated with the event, if any.
  pub http_method: Option<String>,

  /// HTTP endpoint path associated with the event, if any.
  pub http_path: Option<String>,

  /// HTTP status code associated with the event, if any.
  pub http_status_code: Option<u16>,

  /// Whether this notification originated from an error.
  pub is_from_error: bool,

  /// Urgency level for the notification.
  pub urgency: Option<NotificationUrgency>,
}

impl NotificationDetails {
  pub fn to_deduplication_key(&self) -> String {
    generate_deduplication_key(self)
  }

  /// Create a notification with a title and description.
  pub fn with_title_and_description(title: String, description: String) -> Self {
    Self {
      title,
      description: Some(description),
      event_time: Utc::now(),
      http_method: None,
      http_path: None,
      http_status_code: None,
      is_from_error: false,
      urgency: None,
    }
  }

  /// Create a notification with just a title.
  pub fn with_title(title: String) -> Self {
    Self {
      title,
      description: None,
      event_time: Utc::now(),
      http_method: None,
      http_path: None,
      http_status_code: None,
      is_from_error: false,
      urgency: None,
    }
  }

  /// Create a notification from any error type.
  ///
  /// Formats the error into a structured description that includes:
  /// - The error message
  /// - The error's source chain (if any)
  /// - A backtrace (if available via `std::backtrace`)
  /// - The timestamp of the event
  pub fn from_error<E: Debug + Display>(error: &E) -> Self {
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
      event_time,
      http_method: None,
      http_path: None,
      http_status_code: None,
      is_from_error: true,
      urgency: None,
    }
  }

  /// Create a notification from an error, with a custom title prefix.
  pub fn from_error_with_context<E: Debug + Display>(context: &str, error: &E) -> Self {
    let mut notification = Self::from_error(error);
    notification.title = format!("{}: {}", context, notification.title);
    if notification.title.len() > 200 {
      notification.title = format!("{}...", &notification.title[..197]);
    }
    notification
  }
}
