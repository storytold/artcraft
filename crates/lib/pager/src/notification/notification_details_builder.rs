use chrono::{DateTime, Utc};
use std::fmt::{Debug, Display};

use crate::notification::notification_details::NotificationDetails;
use crate::notification::notification_urgency::NotificationUrgency;

pub struct NotificationDetailsBuilder {
  title: String,
  description: Option<String>,
  event_time: DateTime<Utc>,
  http_method: Option<String>,
  http_path: Option<String>,
  http_status_code: Option<u16>,
  is_from_error: bool,
  urgency: Option<NotificationUrgency>,
  user_token: Option<String>,
  media_file_token: Option<String>,
  inference_job_token: Option<String>,
  third_party_id: Option<String>,
  maybe_error: Option<Box<dyn std::error::Error + Send + Sync + 'static>>,
}

impl NotificationDetailsBuilder {
  /// Create a builder from a summary string.
  pub fn from_title(title: String) -> Self {
    Self {
      title,
      description: None,
      event_time: Utc::now(),
      http_method: None,
      http_path: None,
      http_status_code: None,
      is_from_error: false,
      urgency: None,
      user_token: None,
      media_file_token: None,
      inference_job_token: None,
      third_party_id: None,
      maybe_error: None,
    }
  }

  /// Create a builder from an error's Display/Debug info.
  ///
  /// Sets `is_from_error` to true and derives the title and description
  /// from the error. Does NOT retain the error object itself.
  ///
  /// Use `from_title().set_error()` to attach the actual error.
  #[deprecated(note = "Use from_title().set_error() instead")]
  pub fn from_error_info<E: Debug + Display>(error: &E) -> Self {
    #[allow(deprecated)]
    let details = NotificationDetails::from_error_info(error);
    Self {
      title: details.title,
      description: details.description,
      event_time: details.event_time,
      http_method: None,
      http_path: None,
      http_status_code: None,
      is_from_error: true,
      urgency: None,
      user_token: None,
      media_file_token: None,
      inference_job_token: None,
      third_party_id: None,
      maybe_error: None,
    }
  }

  pub fn set_title(mut self, title: String) -> Self {
    self.title = title;
    self
  }

  pub fn set_description(mut self, description: Option<String>) -> Self {
    self.description = description;
    self
  }

  pub fn set_http_method(mut self, http_method: Option<String>) -> Self {
    self.http_method = http_method;
    self
  }

  pub fn set_http_path(mut self, http_path: Option<String>) -> Self {
    self.http_path = http_path;
    self
  }

  pub fn set_http_status_code(mut self, http_status_code: Option<u16>) -> Self {
    self.http_status_code = http_status_code;
    self
  }

  pub fn set_urgency(mut self, urgency: Option<NotificationUrgency>) -> Self {
    self.urgency = urgency;
    self
  }

  pub fn set_user_token(mut self, user_token: Option<String>) -> Self {
    self.user_token = user_token;
    self
  }

  pub fn set_media_file_token(mut self, media_file_token: Option<String>) -> Self {
    self.media_file_token = media_file_token;
    self
  }

  pub fn set_inference_job_token(mut self, inference_job_token: Option<String>) -> Self {
    self.inference_job_token = inference_job_token;
    self
  }

  pub fn set_third_party_id(mut self, third_party_id: Option<String>) -> Self {
    self.third_party_id = third_party_id;
    self
  }

  pub fn set_error(mut self, error: Option<Box<dyn std::error::Error + Send + Sync + 'static>>) -> Self {
    self.maybe_error = error;
    self
  }

  pub fn build(self) -> NotificationDetails {
    NotificationDetails {
      title: self.title,
      description: self.description,
      event_time: self.event_time,
      http_method: self.http_method,
      http_path: self.http_path,
      http_status_code: self.http_status_code,
      is_from_error: self.is_from_error,
      urgency: self.urgency,
      user_token: self.user_token,
      media_file_token: self.media_file_token,
      inference_job_token: self.inference_job_token,
      third_party_id: self.third_party_id,
      maybe_error: self.maybe_error,
    }
  }
}
