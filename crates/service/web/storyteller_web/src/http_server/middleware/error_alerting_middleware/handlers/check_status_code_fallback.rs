use log::{debug, warn};

use pager::client::pager::Pager;
use pager::notification::notification_details_builder::NotificationDetailsBuilder;
use pager::notification::notification_urgency::NotificationUrgency;

use crate::http_server::middleware::error_alerting_middleware::request_debugging_metadata::RequestDebuggingMetadata;

/// Fallback alerting based on HTTP status code when no typed error matched.
pub(crate) fn check_status_code_fallback(
  pager: &Pager,
  method: &str,
  path: &str,
  metadata: &RequestDebuggingMetadata,
  status_code: u16,
) {
  match status_code {
    500 => {
      let summary = format!("HTTP 500: {} {}", method, path);
      let description = format!(
        "An untyped HTTP 500 response was returned (no typed error matched).\n\n\
           Endpoint: {} {}\n\
           Time: {}",
        method, path,
        chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC"),
      );

      let notification = NotificationDetailsBuilder::from_title(summary)
          .set_description(Some(description))
          .set_urgency(Some(NotificationUrgency::Medium))
          .set_http_method(Some(method.to_string()))
          .set_http_path(Some(path.to_string()))
          .set_http_status_code(Some(status_code))
          .set_request_ip_address(metadata.request_ip_address.clone())
          .set_avt_cookie_token(metadata.avt_cookie_token.clone())
          .set_session_token(metadata.session_token.clone())
          .set_session_user_token(metadata.session_user_token.clone())
          .build();

      if let Err(err) = pager.enqueue_page(notification) {
        warn!("Error alerting middleware: failed to enqueue page: {:?}", err);
      } else {
        debug!("Error alerting middleware: enqueued alert for HTTP {}", status_code);
      }
    }
    // Add more status-based rules here:
    // 503 => { ... }
    _ => {}
  }
}
