use crate::notification::notification_details_builder::NotificationDetailsBuilder;
use crate::notification::notification_urgency::NotificationUrgency;

/// A builder for `NotificationDetails` that has not yet been given a title.
///
/// All fields except `title` can be set on this builder. Calling `set_title()`
/// consumes this builder and returns a full `NotificationDetailsBuilder`.
pub struct UntitledNotificationDetailsBuilder {
  pub(crate) builder: NotificationDetailsBuilder,
}

impl UntitledNotificationDetailsBuilder {
  pub(crate) fn new() -> Self {
    Self {
      builder: NotificationDetailsBuilder::from_title("untitled notification".to_string()),
    }
  }

  /// Set the title and return a full `NotificationDetailsBuilder`.
  pub fn set_title(mut self, title: String) -> NotificationDetailsBuilder {
    self.builder.title = title;
    self.builder
  }

  pub fn set_description(mut self, description: Option<String>) -> Self {
    self.builder.description = description;
    self
  }

  pub fn set_urgency(mut self, urgency: Option<NotificationUrgency>) -> Self {
    self.builder.urgency = urgency;
    self
  }

  pub fn set_error(mut self, error: Option<Box<dyn std::error::Error + Send + Sync + 'static>>) -> Self {
    self.builder.maybe_error = error;
    self
  }

  pub fn set_http_method(mut self, http_method: Option<String>) -> Self {
    self.builder.http_method = http_method;
    self
  }

  pub fn set_http_path(mut self, http_path: Option<String>) -> Self {
    self.builder.http_path = http_path;
    self
  }

  pub fn set_http_status_code(mut self, http_status_code: Option<u16>) -> Self {
    self.builder.http_status_code = http_status_code;
    self
  }

  pub fn set_user_token(mut self, user_token: Option<String>) -> Self {
    self.builder.user_token = user_token;
    self
  }

  pub fn set_media_file_token(mut self, media_file_token: Option<String>) -> Self {
    self.builder.media_file_token = media_file_token;
    self
  }

  pub fn set_inference_job_token(mut self, inference_job_token: Option<String>) -> Self {
    self.builder.inference_job_token = inference_job_token;
    self
  }

  pub fn set_third_party_id(mut self, third_party_id: Option<String>) -> Self {
    self.builder.third_party_id = third_party_id;
    self
  }
}
