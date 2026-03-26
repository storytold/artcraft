use log::{debug, warn};

use pager::client::pager::Pager;
use pager::notification::notification_details::NotificationDetails;

pub(super) fn enqueue_alert(pager: &Pager, summary: String, description: String) {
  let notification = NotificationDetails::with_summary_and_description(summary, description);

  if let Err(err) = pager.enqueue_page(notification) {
    warn!("Error alerting middleware: failed to enqueue page: {:?}", err);
  } else {
    debug!("Error alerting middleware: enqueued alert");
  }
}
