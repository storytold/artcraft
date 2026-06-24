use std::time::Duration;

use log::{error, info, warn};
use mysql_queries::queries::generic_inference::web::get_inference_job_status_value::get_inference_job_status_value;

use crate::job_dependencies::JobDependencies;
use crate::jobs::order_processing_job::is_job_status_terminal::is_job_status_terminal;
use crate::jobs::order_processing_job::process_one_order::process_one_order;

/// How long to nap when the reconciler is empty before peeking again.
const IDLE_SLEEP: Duration = Duration::from_millis(500);

/// How long to back off after a transient error before retrying.
const ERROR_BACKOFF: Duration = Duration::from_secs(2);

/// The consumer half of the pipeline.
///
/// Drains finished orders staged by the polling loop and reconciles each into
/// our system: a lightweight DB pre-check (skip jobs already settled before
/// downloading anything), then download + upload, then a `SELECT ... FOR
/// UPDATE` transaction that re-checks the job is still pending before writing
/// the conclusion. Runs independently of polling, so an order is handled as
/// soon as it's staged rather than after a whole batch.
pub async fn order_processing_main_loop(deps: JobDependencies) {
  while !deps.application_shutdown.get() {
    let details = match deps.order_reconciler.peek_random() {
      Some(details) => details,
      None => {
        nap(&deps, IDLE_SLEEP).await;
        continue;
      }
    };

    let order_id = details.kinovi_record.order_id.clone();
    let job_token = details.database_record.job_token.clone();

    // Lightweight pre-check: if the DB already considers the job terminal, drop
    // the staged order without doing any expensive download/upload work.
    match get_inference_job_status_value(&deps.mysql_pool, &job_token).await {
      Ok(Some(status)) if is_job_status_terminal(status) => {
        info!(
          "Job {} is already terminal ({:?}); dropping staged order {}.",
          job_token.as_str(), status, order_id,
        );
        deps.order_reconciler.remove(&order_id);
        continue;
      }
      Ok(Some(_)) => {
        // Still pending — proceed to process.
      }
      Ok(None) => {
        warn!(
          "Job {} for staged order {} no longer exists in the DB; dropping.",
          job_token.as_str(), order_id,
        );
        deps.order_reconciler.remove(&order_id);
        continue;
      }
      Err(err) => {
        error!(
          "Failed to read status for job {} (order {}): {:?}. Leaving staged; backing off.",
          job_token.as_str(), order_id, err,
        );
        nap(&deps, ERROR_BACKOFF).await;
        continue;
      }
    }

    // Commit to this order: pop it so we don't peek it again while working.
    deps.order_reconciler.remove(&order_id);

    match process_one_order(&deps, &details).await {
      Ok(()) => {
        let _ = deps.job_stats.increment_success_count();
      }
      Err(err) => {
        warn!(
          "Error processing order {} (job {}): {:?}. It will be re-staged on a \
          later poll if the job is still pending.",
          order_id, job_token.as_str(), err,
        );
        let _ = deps.job_stats.increment_failure_count();
      }
    }
  }

  warn!("Kinovi order processing main loop is shut down.");
}

/// Sleep, but wake immediately on shutdown.
async fn nap(deps: &JobDependencies, duration: Duration) {
  tokio::select! {
    _ = tokio::time::sleep(duration) => {}
    _ = deps.shutdown_notify.notified() => {}
  }
}
