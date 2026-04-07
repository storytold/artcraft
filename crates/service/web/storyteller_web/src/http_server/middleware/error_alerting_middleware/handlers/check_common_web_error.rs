use log::{debug, warn};

use pager::client::pager::Pager;
use pager::notification::notification_details_builder::NotificationDetailsBuilder;
use pager::notification::notification_urgency::NotificationUrgency;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::middleware::error_alerting_middleware::request_debugging_metadata::RequestDebuggingMetadata;

/// Check `CommonWebError` and alert on server errors.
/// Returns `true` if the error was handled (alerted or intentionally skipped).
pub(crate) fn check_common_web_error(
  pager: &Pager,
  method: &str,
  path: &str,
  metadata: &RequestDebuggingMetadata,
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

      let notification = NotificationDetailsBuilder::from_title(summary)
          .set_description(Some(description))
          .set_urgency(Some(NotificationUrgency::Medium))
          .set_http_method(Some(method.to_string()))
          .set_http_path(Some(path.to_string()))
          .set_http_status_code(Some(500))
          .set_request_ip_address(metadata.request_ip_address.clone())
          .set_avt_cookie_token(metadata.avt_cookie_token.clone())
          .set_session_token(metadata.session_token.clone())
          .set_session_user_token(metadata.session_user_token.clone())
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
