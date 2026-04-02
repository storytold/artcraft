use log::error;
use pager::client::pager::Pager;
use pager::notification::notification_details_builder::NotificationDetailsBuilder;
use pager::notification::notification_urgency::NotificationUrgency;

/// Enqueue a pager alert for the error, then return it as `Err`.
pub fn alert_pager_and_return_err<T>(
  pager: &Pager,
  title: &str,
  err: anyhow::Error,
) -> anyhow::Result<T> {
  let err_message = format!("{:#}", err);

  let notification = NotificationDetailsBuilder::from_error(err.into())
      .set_title(title.to_string())
      .set_urgency(Some(NotificationUrgency::Medium))
      .build();

  if let Err(pager_err) = pager.enqueue_page(notification) {
    error!("Failed to enqueue pager alert: {:?}", pager_err);
  }

  Err(anyhow::anyhow!(err_message))
}
