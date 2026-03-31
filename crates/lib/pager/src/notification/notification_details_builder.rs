use chrono::{DateTime, Utc};
use std::fmt::{Debug, Display};

use crate::notification::notification_details::NotificationDetails;

pub struct NotificationDetailsBuilder {
  summary: String,
  description: Option<String>,
  event_time: DateTime<Utc>,
  http_method: Option<String>,
  endpoint_path: Option<String>,
  is_from_error: bool,
}

impl NotificationDetailsBuilder {
  /// Create a builder from a summary string.
  pub fn from_summary(summary: String) -> Self {
    Self {
      summary,
      description: None,
      event_time: Utc::now(),
      http_method: None,
      endpoint_path: None,
      is_from_error: false,
    }
  }

  /// Create a builder from an error.
  ///
  /// Sets `is_from_error` to true and derives the summary and description
  /// from the error, matching the behavior of `NotificationDetails::from_error`.
  pub fn from_error<E: Debug + Display>(error: &E) -> Self {
    // TODO(bt,2026-03-30): Clean this up
    let details = NotificationDetails::from_error(error);
    Self {
      summary: details.summary,
      description: details.description,
      event_time: details.event_time,
      http_method: None,
      endpoint_path: None,
      is_from_error: true,
    }
  }

  pub fn set_description(mut self, description: Option<String>) -> Self {
    self.description = description;
    self
  }

  pub fn set_http_method(mut self, http_method: Option<String>) -> Self {
    self.http_method = http_method;
    self
  }

  pub fn set_endpoint_path(mut self, endpoint_path: Option<String>) -> Self {
    self.endpoint_path = endpoint_path;
    self
  }

  pub fn build(self) -> NotificationDetails {
    NotificationDetails {
      summary: self.summary,
      description: self.description,
      event_time: self.event_time,
      http_method: self.http_method,
      endpoint_path: self.endpoint_path,
      is_from_error: self.is_from_error,
    }
  }
}
