use log::{debug, warn};

use pager::client::pager::Pager;
use pager::notification::notification_details_builder::NotificationDetailsBuilder;

/// Fallback alerting based on HTTP status code when no typed error matched.
pub(super) fn check_status_code_fallback(
  pager: &Pager,
  method: &str,
  path: &str,
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

      let notification = NotificationDetailsBuilder::from_summary(summary)
          .set_description(Some(description))
          .set_http_method(Some(method.to_string()))
          .set_http_path(Some(path.to_string()))
          .set_http_status_code(Some(status_code))
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
