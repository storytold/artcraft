use log::{debug, warn};

use pager::client::pager::Pager;
use pager::notification::notification_details_builder::NotificationDetailsBuilder;
use pager::notification::notification_urgency::NotificationUrgency;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;

/// Check `AdvancedCommonWebError` and alert on uncaught server errors.
/// Returns `true` if the error was handled (alerted or intentionally skipped).
pub(super) fn check_advanced_common_web_error(
  pager: &Pager,
  method: &str,
  path: &str,
  error: &AdvancedCommonWebError,
) -> bool {
  if !error.is_server_error() {
    // Non-500 errors (400, 401, 404, 402) are intentional — don't alert.
    return true;
  }

  let title = format!("UncaughtServerError on {} {}", method, path);

  // Clone the Arc'd causal error so the notification owns a reference to it.
  let cause_arc = error.clone_cause_arc();

  let mut builder = if let Some(arc_err) = cause_arc {
    NotificationDetailsBuilder::from_error(arc_err)
        .set_title(title)
  } else {
    NotificationDetailsBuilder::from_title(title)
  };

  builder = builder
      .set_http_method(Some(method.to_string()))
      .set_http_path(Some(path.to_string()))
      .set_http_status_code(Some(500))
      .set_urgency(Some(NotificationUrgency::Medium));

  let notification = builder.build();

  if let Err(err) = pager.enqueue_page(notification) {
    warn!("Error alerting middleware: failed to enqueue page: {:?}", err);
  } else {
    debug!("Error alerting middleware: enqueued alert for AdvancedCommonWebError::UncaughtServerError");
  }

  true
}
