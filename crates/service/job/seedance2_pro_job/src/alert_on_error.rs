use log::error;
use mysql_queries::queries::generic_inference::api_providers::kinovi_web::list_pending_kinovi_web_video_jobs::PendingKinoviWebJob;
use pager::client::pager::Pager;
use pager::notification::notification_details_builder::NotificationDetailsBuilder;
use pager::notification::notification_urgency::NotificationUrgency;

/// Enqueue a pager alert for the error, then return it as `Err`.
pub fn alert_pager_and_return_err<T>(
  pager: &Pager,
  title: &str,
  err: anyhow::Error,
  job: Option<&PendingKinoviWebJob>,
) -> anyhow::Result<T> {
  let err_message = format!("{:#}", err);

  let mut builder = NotificationDetailsBuilder::from_boxed_error(err.into())
      .set_title(title.to_string())
      .set_urgency(Some(NotificationUrgency::Medium));

  if let Some(job) = job {
    builder = builder
        .set_inference_job_token(Some(job.job_token.to_string()))
        .set_third_party_id(Some(job.order_id.clone()))
        .set_user_token(job.maybe_creator_user_token.as_ref().map(|t| t.to_string()));
  }

  let notification = builder.build();

  if let Err(pager_err) = pager.enqueue_page(notification) {
    error!("Failed to enqueue pager alert: {:?}", pager_err);
  }

  Err(anyhow::anyhow!(err_message))
}
