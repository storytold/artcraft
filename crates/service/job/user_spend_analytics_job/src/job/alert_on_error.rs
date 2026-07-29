use log::error;
use pager::client::pager::Pager;
use pager::notification::notification_details_builder::NotificationDetailsBuilder;
use pager::notification::notification_urgency::NotificationUrgency;

/// Enqueue a pager alert for an error WITHOUT interrupting the job. The caller is
/// expected to keep going (next date / user / record) after a recovery sleep.
pub fn alert_pager(pager: &Pager, title: &str, detail: &str) {
  let notification = NotificationDetailsBuilder::from_title(title.to_string())
    .set_description(Some(detail.to_string()))
    .set_urgency(Some(NotificationUrgency::Medium))
    .build();

  if let Err(pager_err) = pager.enqueue_page(notification) {
    error!("Failed to enqueue pager alert: {:?}", pager_err);
  }
}
