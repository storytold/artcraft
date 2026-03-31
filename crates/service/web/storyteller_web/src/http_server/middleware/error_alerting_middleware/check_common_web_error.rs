use log::{debug, warn};

use pager::client::pager::Pager;
use pager::notification::notification_details_builder::NotificationDetailsBuilder;
use pager::notification::notification_urgency::NotificationUrgency;

use crate::http_server::common_responses::common_web_error::CommonWebError;

/// Check `CommonWebError` and alert on server errors.
/// Returns `true` if the error was handled (alerted or intentionally skipped).
pub(super) fn check_common_web_error(
  pager: &Pager,
  method: &str,
  path: &str,
  error: &CommonWebError,
) -> bool {
  match error {
    CommonWebError::ServerError => {
      let summary = format!("CommonWebError::ServerError on {} {}", method, path);
      let description = format!(
        "A CommonWebError::ServerError was returned.\n\n\
           Endpoint: {} {}\n\
           Error: {:?}\n\
           Time: {}",
        method, path, error,
        chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC"),
      );

      let notification = NotificationDetailsBuilder::from_summary(summary)
          .set_description(Some(description))
          .set_http_method(Some(method.to_string()))
          .set_http_path(Some(path.to_string()))
          .set_http_status_code(Some(500))
          .set_urgency(Some(NotificationUrgency::Medium))
          .build();

      if let Err(err) = pager.enqueue_page(notification) {
        warn!("Error alerting middleware: failed to enqueue page: {:?}", err);
      } else {
        debug!("Error alerting middleware: enqueued alert for CommonWebError::ServerError");
      }

      true
    }
    // Don't alert on client errors (400, 401, 404, 402).
    CommonWebError::BadInputWithSimpleMessage(_) => true,
    CommonWebError::NotFound => true,
    CommonWebError::NotAuthorized => true,
    CommonWebError::PaymentRequired => true,
  }
}
