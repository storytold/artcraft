use std::time::Duration;

use log::{info, warn};

use crate::job::backfill_daily_spends::backfill_daily_spends;
use crate::job::backfill_user_summaries::backfill_user_summaries;
use crate::job_dependencies::JobDependencies;

const SHUTDOWN_POLL_SLICE: Duration = Duration::from_secs(2);

/// Run the two backfill tasks in order each cycle, then sleep. Errors inside the
/// tasks are paged and skipped (they never abort the cycle).
pub async fn main_loop(deps: JobDependencies) {
  while !deps.application_shutdown.get() {
    info!("==== Starting spend-analytics cycle ====");

    backfill_daily_spends(&deps).await;
    if deps.application_shutdown.get() {
      break;
    }
    backfill_user_summaries(&deps).await;

    info!("Cycle complete. Sleeping {:?} before next cycle.", deps.sleep_between_cycles);
    sleep_interruptible(&deps, deps.sleep_between_cycles).await;
  }

  warn!("User spend analytics job main loop is shut down.");
}

/// Sleep in small slices so a shutdown signal is honored promptly.
async fn sleep_interruptible(deps: &JobDependencies, total: Duration) {
  let mut remaining = total;
  while remaining > Duration::ZERO && !deps.application_shutdown.get() {
    let nap = remaining.min(SHUTDOWN_POLL_SLICE);
    tokio::time::sleep(nap).await;
    remaining = remaining.saturating_sub(nap);
  }
}
