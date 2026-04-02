use std::fmt::{Debug, Display};
use std::sync::Arc;

use chrono::{DateTime, Utc};

use crate::notification::notification_details::NotificationDetails;
use crate::notification::notification_urgency::NotificationUrgency;

pub struct NotificationDetailsBuilder {
  title: String,
  pub(crate) description: Option<String>,
  pub(crate) urgency: Option<NotificationUrgency>,
  pub(crate) event_time: DateTime<Utc>,

  pub(crate) maybe_error: Option<Arc<dyn std::error::Error + Send + Sync + 'static>>,
  pub(crate) is_from_error: bool,

  pub(crate) http_method: Option<String>,
  pub(crate) http_path: Option<String>,
  pub(crate) http_status_code: Option<u16>,

  pub(crate) user_token: Option<String>,
  pub(crate) media_file_token: Option<String>,
  pub(crate) inference_job_token: Option<String>,
  pub(crate) third_party_id: Option<String>,
}

impl NotificationDetailsBuilder {
  /// Create a builder from a summary string.
  pub fn from_title(title: String) -> Self {
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

  /// Create a builder from a boxed error. Converts to `Arc` internally for shareability.
  pub fn from_boxed_error(error: Box<dyn std::error::Error + Send + Sync + 'static>) -> Self {
    Self::from_error(Arc::from(error))
  }

  /// Create a builder from an `Arc`'d error.
  pub fn from_error(error: Arc<dyn std::error::Error + Send + Sync + 'static>) -> Self {
    Self {
      title: "Notification from Error".to_string(),
      description: None,
      urgency: None,
      event_time: Utc::now(),
      maybe_error: Some(error),
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

  pub fn set_title(mut self, title: String) -> Self {
    self.title = title;
    self
  }

  pub fn set_description(mut self, description: Option<String>) -> Self {
    self.description = description;
    self
  }

  pub fn set_urgency(mut self, urgency: Option<NotificationUrgency>) -> Self {
    self.urgency = urgency;
    self
  }

  pub fn set_error(mut self, error: Option<Arc<dyn std::error::Error + Send + Sync + 'static>>) -> Self {
    self.maybe_error = error;
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
      urgency: self.urgency,
      event_time: self.event_time,
      maybe_error: self.maybe_error,
      is_from_error: self.is_from_error,
      http_method: self.http_method,
      http_path: self.http_path,
      http_status_code: self.http_status_code,
      user_token: self.user_token,
      media_file_token: self.media_file_token,
      inference_job_token: self.inference_job_token,
      third_party_id: self.third_party_id,
    }
  }
}
