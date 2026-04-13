use std::cmp::min;
use std::time::Duration;

use log::{error, info, warn};
use pager::notification::notification_details_builder::NotificationDetailsBuilder;
use pager::notification::notification_urgency::NotificationUrgency;
use seedance2pro_client::requests::get_user_auth_details::get_user_auth_details::{
  get_user_auth_details, GetUserAuthDetailsArgs,
};

use crate::job_dependencies::JobDependencies;

const CREDITS_CHECK_INTERVAL: Duration = Duration::from_secs(30);

pub async fn credits_checking_main_loop(deps: JobDependencies) {
  let mut consecutive_failures: u32 = 0;

  while !deps.application_shutdown.get() {
    match check_credits(&deps).await {
      Ok(()) => {
        consecutive_failures = 0;
      }
      Err(err) => {
        consecutive_failures += 1;
        error!("Credits check failed ({} consecutive): {:?}", consecutive_failures, err);

        if consecutive_failures >= 2 {
          let notification = NotificationDetailsBuilder::from_title(
              "Kinovi credits check failing".to_string())
            .set_description(Some(format!(
              "Credits check has failed {} times in a row. Last error: {:?}",
              consecutive_failures, err,
            )))
            .set_urgency(Some(NotificationUrgency::Medium))
            .build();

          if let Err(pager_err) = deps.pager.enqueue_page(notification) {
            error!("Failed to enqueue credits check failure alert: {:?}", pager_err);
          }
        }
      }
    }

    tokio::select! {
      _ = tokio::time::sleep(CREDITS_CHECK_INTERVAL) => {}
      _ = deps.shutdown_notify.notified() => {}
    }
  }

  warn!("Credits checking main loop is shut down.");
}

async fn check_credits(deps: &JobDependencies) -> anyhow::Result<()> {
  let response = get_user_auth_details(GetUserAuthDetailsArgs {
    session: &deps.seedance2pro_session,
    host_override: None,
  })
    .await
    .map_err(|err| anyhow::anyhow!("get_user_auth_details failed: {:?}", err))?;

  let credits = min(response.credits, response.available_credits);
  let threshold = deps.credits_alert_threshold;

  info!(
    "Kinovi credits: {} (API credits: {}, API credits available: {}) (alert threshold: {})",
    credits,
    response.credits,
    response.available_credits,
    threshold,
  );

  if credits < threshold {
    warn!(
      "Kinovi credits are low! {} available credits (alert threshold: {})",
      credits, threshold,
    );

    let notification = NotificationDetailsBuilder::from_title(
        "Kinovi billing credits low !".to_string())
      .set_description(Some(format!(
        "Available credits: {}. Alert threshold: {}.",
        credits, threshold,
      )))
      .set_urgency(Some(NotificationUrgency::High))
      .build();

    if let Err(pager_err) = deps.pager.enqueue_page(notification) {
      error!("Failed to enqueue low credits alert: {:?}", pager_err);
    }
  }

  Ok(())
}
