use chrono::{DateTime, Utc};
use std::fmt::{Debug, Display};

/// Details for a pager notification.
#[derive(Clone, Debug)]
pub struct NotificationDetails {
  /// Title or summary of the alert.
  pub summary: String,

  /// Full details for the alert.
  pub description: Option<String>,

  /// When the event occurred.
  pub event_time: DateTime<Utc>,
}

impl NotificationDetails {
  /// Create a notification with a summary and description.
  pub fn with_summary_and_description(summary: String, description: String) -> Self {
    Self {
      summary,
      description: Some(description),
      event_time: Utc::now(),
    }
  }

  /// Create a notification with just a summary.
  pub fn with_summary(summary: String) -> Self {
    Self {
      summary,
      description: None,
      event_time: Utc::now(),
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
    let summary = format!("{}", error);

    // Truncate summary to a reasonable length for alert titles.
    let summary = if summary.len() > 200 {
      format!("{}...", &summary[..197])
    } else {
      summary
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
      summary,
      description: Some(description),
      event_time,
    }
  }

  /// Create a notification from an error, with a custom summary prefix.
  pub fn from_error_with_context<E: Debug + Display>(context: &str, error: &E) -> Self {
    let mut notification = Self::from_error(error);
    notification.summary = format!("{}: {}", context, notification.summary);
    if notification.summary.len() > 200 {
      notification.summary = format!("{}...", &notification.summary[..197]);
    }
    notification
  }
}
