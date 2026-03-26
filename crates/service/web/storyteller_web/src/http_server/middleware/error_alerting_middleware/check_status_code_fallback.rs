use pager::client::pager::Pager;

use super::enqueue_alert::enqueue_alert;

/// Fallback alerting based on HTTP status code when no typed error matched.
pub(super) fn check_status_code_fallback(
  pager: &Pager,
  method: &str,
  path: &str,
  status_code: u16,
) {
  match status_code {
    500 => {
      enqueue_alert(
        pager,
        format!("HTTP 500: {} {}", method, path),
        format!(
          "An untyped HTTP 500 response was returned (no typed error matched).\n\n\
           Endpoint: {} {}\n\
           Time: {}",
          method, path,
          chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC"),
        ),
      );
    }
    // Add more status-based rules here:
    // 503 => { enqueue_alert(...); }
    _ => {}
  }
}
