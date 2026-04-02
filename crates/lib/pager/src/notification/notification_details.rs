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

  /// Return a key that can group notifications for deduplication,
  /// which will prevent spamming the same page over and over.
  pub fn to_deduplication_key(&self) -> String {
    generate_deduplication_key(self)
  }

  // =============== Description Building ===============

  /// Build the full enriched description for this notification.
  ///
  /// Assembles atomic sections in a consistent order:
  /// 1. User-provided description
  /// 2. Error chain (if a boxed error is attached)
  /// 3. Event time
  /// 4. HTTP context
  /// 5. Service tokens
  /// 6. Application/service identity and hostname
  pub(crate) fn build_enriched_description(
    &self,
    application_name: Option<&str>,
    service_id: Option<&str>,
    hostname: Option<&str>,
  ) -> Option<String> {
    let mut sections: Vec<String> = Vec::new();

    // 1. User-provided description
    if let Some(desc) = &self.description {
      sections.push(desc.clone());
    }

    // 2. Error chain
    if let Some(error_section) = self.format_error_chain() {
      sections.push(error_section);
    }

    // 3. Event time
    sections.push(self.format_event_time());

    // 4. HTTP context
    if let Some(http_section) = self.format_http_context() {
      sections.push(http_section);
    }

    // 5. Service tokens
    if let Some(tokens_section) = self.format_service_tokens() {
      sections.push(tokens_section);
    }

    // 6. Application/service identity and hostname
    if let Some(identity_section) = Self::format_app_identity(application_name, service_id, hostname) {
      sections.push(identity_section);
    }

    if sections.is_empty() {
      None
    } else {
      Some(sections.join("\n\n"))
    }
  }

  /// Format the error chain from the boxed error, walking the source chain.
  fn format_error_chain(&self) -> Option<String> {
    let error = self.maybe_error.as_ref()?;

    let mut parts: Vec<String> = Vec::new();

    // Top-level error
    parts.push(format!("Error: {}", error));

    // Debug representation if it differs
    let debug_repr = format!("{:?}", error);
    let display_repr = format!("{}", error);
    if debug_repr != display_repr {
      parts.push(format!("Debug: {}", debug_repr));
    }

    // Walk the source chain
    let mut depth = 0;
    let mut source = error.source();
    while let Some(cause) = source {
      depth += 1;
      parts.push(format!("Caused by ({depth}): {cause}"));

      let cause_debug = format!("{:?}", cause);
      let cause_display = format!("{}", cause);
      if cause_debug != cause_display {
        parts.push(format!("  Debug ({depth}): {cause_debug}"));
      }

      source = cause.source();
    }

    Some(parts.join("\n"))
  }

  /// Format the event time.
  fn format_event_time(&self) -> String {
    format!("Event time: {}", self.event_time.format("%Y-%m-%d %H:%M:%S UTC"))
  }

  /// Format HTTP context (method, path, status code) if any fields are present.
  fn format_http_context(&self) -> Option<String> {
    let mut parts: Vec<String> = Vec::new();

    if let Some(method) = &self.http_method {
      parts.push(format!("HTTP Method: {}", method));
    }

    if let Some(path) = &self.http_path {
      parts.push(format!("HTTP Path: {}", path));
    }

    if let Some(status_code) = self.http_status_code {
      parts.push(format!("HTTP Status Code: {}", status_code));
    }

    if parts.is_empty() { None } else { Some(parts.join("\n")) }
  }

  /// Format service tokens (user, media file, inference job, third party) if any are present.
  fn format_service_tokens(&self) -> Option<String> {
    let mut parts: Vec<String> = Vec::new();

    if let Some(user_token) = &self.user_token {
      parts.push(format!("User Token: {}", user_token));
    }

    if let Some(media_file_token) = &self.media_file_token {
      parts.push(format!("Media File Token: {}", media_file_token));
    }

    if let Some(inference_job_token) = &self.inference_job_token {
      parts.push(format!("Inference Job Token: {}", inference_job_token));
    }

    if let Some(third_party_id) = &self.third_party_id {
      parts.push(format!("Third Party ID: {}", third_party_id));
    }

    if parts.is_empty() { None } else { Some(parts.join("\n")) }
  }

  /// Format the application name, service ID, and hostname.
  fn format_app_identity(
    application_name: Option<&str>,
    service_id: Option<&str>,
    hostname: Option<&str>,
  ) -> Option<String> {
    let mut parts: Vec<String> = Vec::new();

    match (application_name, service_id) {
      (Some(name), Some(id)) => {
        parts.push(format!("Application: {} (service_id: {})", name, id));
      }
      (Some(name), None) => {
        parts.push(format!("Application: {}", name));
      }
      (None, Some(id)) => {
        parts.push(format!("Service ID: {}", id));
      }
      (None, None) => {}
    }

    if let Some(h) = hostname {
      parts.push(format!("Hostname: {}", h));
    }

    if parts.is_empty() { None } else { Some(parts.join("\n")) }
  }
}
