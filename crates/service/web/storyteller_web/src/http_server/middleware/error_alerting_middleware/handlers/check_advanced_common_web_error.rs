use error_utils::try_error_name::try_error_name;
use log::{debug, warn};

use pager::client::pager::Pager;
use pager::notification::notification_details_builder::NotificationDetailsBuilder;
use pager::notification::notification_urgency::NotificationUrgency;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::http_server::middleware::error_alerting_middleware::request_debugging_metadata::RequestDebuggingMetadata;

/// Check `AdvancedCommonWebError` and alert on uncaught server errors.
/// Returns `true` if the error was handled (alerted or intentionally skipped).
pub(crate) fn check_advanced_common_web_error(
  pager: &Pager,
  method: &str,
  path: &str,
  metadata: &RequestDebuggingMetadata,
  error: &AdvancedCommonWebError,
) -> bool {
  if !error.is_server_error() {
    // Non-500 errors (400, 401, 403, 403, 404...) are intentional — don't alert.
    return true;
  }

  let maybe_error_name = error.cause()
      .and_then(|cause| try_error_name(cause));

  let title = match maybe_error_name {
    Some(name) => format!("{} on {} {}", name, method, path),
    None => format!("UncaughtServerError on {} {}", method, path),
  };

  // Clone the Arc'd causal error so the notification owns a reference to it.
  let cause_arc = error.clone_cause_arc();

  let mut builder = if let Some(arc_err) = cause_arc {
    NotificationDetailsBuilder::from_error(arc_err)
        .set_title(title)
  } else {
    NotificationDetailsBuilder::from_title(title)
  };

  builder = builder
      .set_urgency(Some(NotificationUrgency::Medium))
      .set_http_method(Some(method.to_string()))
      .set_http_path(Some(path.to_string()))
      .set_http_status_code(Some(500))
      .set_request_ip_address(metadata.request_ip_address.clone())
      .set_avt_cookie_token(metadata.avt_cookie_token.clone())
      .set_session_token(metadata.session_token.clone())
      .set_session_user_token(metadata.session_user_token.clone());

  match error {
    AdvancedCommonWebError::UncaughtServerErrorWithInternalMessage { internal_message, error } => {
      builder = builder.set_extra_message(Some(internal_message.to_string()));
    }
    _ => {},
  }

  let notification = builder.build();

  if let Err(err) = pager.enqueue_page(notification) {
    warn!("Error alerting middleware: failed to enqueue page: {:?}", err);
  } else {
    debug!("Error alerting middleware: enqueued alert for AdvancedCommonWebError::UncaughtServerError");
  }

  true
}
