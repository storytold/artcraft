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
    }
  }
}
