use pager::client::pager::Pager;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use super::enqueue_alert::enqueue_alert;

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
      enqueue_alert(
        pager,
        format!("CommonWebError::ServerError on {} {}", method, path),
        format!(
          "A CommonWebError::ServerError was returned.\n\n\
           Endpoint: {} {}\n\
           Error: {:?}\n\
           Time: {}",
          method, path, error,
          chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC"),
        ),
      );
      true
    }
    // Don't alert on client errors (400, 401, 404, 402).
    CommonWebError::BadInputWithSimpleMessage(_) => true,
    CommonWebError::NotFound => true,
    CommonWebError::NotAuthorized => true,
    CommonWebError::PaymentRequired => true,
  }
}
