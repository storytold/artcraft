use std::collections::HashMap;
use std::time::{Duration, Instant};

use chrono::Utc;
use enums::by_table::generic_inference_jobs::inference_job_external_third_party::InferenceJobExternalThirdParty;
use enums::by_table::generic_inference_jobs::inference_job_type::InferenceJobType;
use log::{error, info, warn};
use mysql_queries::queries::generic_inference::api_providers::seedance2pro::list_pending_seedance2pro_video_jobs::{list_pending_seedance2pro_video_jobs, PendingSeedance2ProJob};
use pager::notification::notification_details_builder::NotificationDetailsBuilder;
use pager::notification::notification_urgency::NotificationUrgency;
use seedance2pro_client::requests::poll_orders::poll_orders::{poll_orders, OrderStatus, PollOrdersArgs, PollOrdersResponse};

use crate::alert_on_error::alert_pager_and_return_err;
use crate::job_dependencies::JobDependencies;
use crate::kinovi_version::KinoviVersion;

const POLL_ALERT_THRESHOLD: Duration = Duration::from_mins(6);

/// How many of the newest order pages to re-scan when we periodically revisit
/// the head of the list. Recently-submitted jobs finish soonest, so checking
/// the first few pages more often shortens their tail latency without waiting
/// for a full deep walk to complete.
const HEAD_PAGE_COUNT: u32 = 2;

/// After this many pages of the deep (long-tail) walk, pause and re-scan the
/// head pages before continuing onward.
const DEEP_PAGES_BETWEEN_HEAD_RECHECKS: u32 = 5;

/// The producer half of the pipeline.
///
/// Walks Kinovi's order list looking for orders that have *finished* (completed
/// or failed) and match one of our pending database jobs, and stages each into
/// the shared [`OrderReconciler`](crate::order_reconciler::OrderReconciler).
/// It does no downloading, uploading, or job settling itself — that's the
/// processing loop's job. Staging happens the moment a finished order is seen,
/// so the processor can pick it up immediately rather than waiting for a whole
/// batch (or the whole walk) to complete.
pub async fn order_polling_main_loop(job_dependencies: JobDependencies) {
  while !job_dependencies.application_shutdown.get() {
    let start = Instant::now();

    let result = run_poll_iteration(&job_dependencies).await;

    let elapsed = start.elapsed();

    if let Err(err) = result {
      error!("Error in poll iteration: {:?}", err);
      let _ = alert_pager_and_return_err::<()>(&job_dependencies.pager, "Kinovi poll iteration error", err, None);
      let _ = job_dependencies.job_stats.increment_failure_count();
    }

    if elapsed > POLL_ALERT_THRESHOLD {
      warn!("Poll iteration took {:.1}s (threshold: {}s)", elapsed.as_secs_f64(), POLL_ALERT_THRESHOLD.as_secs());

      let notification = NotificationDetailsBuilder::from_title(
            "Kinovi poll iteration slow".to_string())
          .set_description(Some(format!(
            "Poll iteration took {:.1} seconds, exceeding the threshold.",
            elapsed.as_secs_f64(),
          )))
          .set_urgency(Some(NotificationUrgency::Medium))
          .build();

      if let Err(pager_err) = job_dependencies.pager.enqueue_page(notification) {
        error!("Failed to enqueue slow iteration alert: {:?}", pager_err);
      }
    }

    tokio::select! {
      _ = tokio::time::sleep(Duration::from_millis(job_dependencies.poll_interval_millis)) => {}
      _ = job_dependencies.shutdown_notify.notified() => {}
    }
  }

  warn!("Kinovi order polling main loop is shut down.");
}

async fn run_poll_iteration(deps: &JobDependencies) -> anyhow::Result<()> {
  info!("Querying database jobs for type: {:?}", deps.kinovi_version);

  let (job_type, third_party) = match deps.kinovi_version {
    KinoviVersion::Volcengine => (
      InferenceJobType::Seedance2ProQueue,
      InferenceJobExternalThirdParty::Seedance2Pro,
    ),
    KinoviVersion::BytePlus => (
      InferenceJobType::Seedance2ProAltQueue,
      InferenceJobExternalThirdParty::Seedance2ProAlt,
    ),
    KinoviVersion::BytePlusUltra => (
      InferenceJobType::Seedance2ProBytePlusUltraQueue,
      InferenceJobExternalThirdParty::Seedance2ProBytePlusUltra,
    ),
  };

  // 1. Query all (limit 25,000) non-terminal Seedance2Pro jobs from the DB.
  let pending_jobs = match list_pending_seedance2pro_video_jobs(&deps.mysql_pool, third_party, job_type).await {
    Ok(jobs) => jobs,
    Err(err) => {
      error!("Failed to list pending database jobs: {:?}", err);
      return alert_pager_and_return_err(&deps.pager, "Jobs DB query failed", err.into(), None);
    }
  };

  if pending_jobs.is_empty() {
    info!("No pending database jobs found.");
    return Ok(());
  }

  info!("Found {} pending database job(s).", pending_jobs.len());

  let result = walk_orders(deps, pending_jobs).await?;

  info!(
    "Order poll iteration complete: {} pages seen, {} orders seen, {} finished orders staged. \
    Reconciler currently holds {} order(s) awaiting processing.",
    result.pages_seen,
    result.orders_seen,
    result.orders_staged,
    deps.order_reconciler.len(),
  );

  Ok(())
}

#[derive(Default)]
struct WalkResult {
  pages_seen: u32,
  orders_seen: u32,
  orders_staged: u32,
}

/// Walk Kinovi's order pages newest-first, staging finished orders that match a
/// pending job. Periodically pauses the deep walk to re-scan the head pages so
/// recent jobs are caught with lower latency than the long tail.
async fn walk_orders(
  deps: &JobDependencies,
  pending_jobs: Vec<PendingSeedance2ProJob>,
) -> anyhow::Result<WalkResult> {
  let job_by_order_id: HashMap<String, PendingSeedance2ProJob> = pending_jobs
      .into_iter()
      .map(|job| (job.order_id.clone(), job))
      .collect();

  let pending_db_job_count = job_by_order_id.len();

  let iteration_start = Instant::now();
  let mut result = WalkResult::default();
  let mut cursor: Option<u64> = None;
  let mut pages_since_head_recheck: u32 = 0;

  loop {
    if deps.application_shutdown.get() {
      info!("Shutdown requested during pagination. Stopping early.");
      break;
    }

    // Log the iteration state up front (before the poll) so that, if the poll
    // itself fails, we still have the surrounding context in the logs.
    let iteration_elapsed = iteration_start.elapsed();

    info!(
      "Requesting Kinovi page:\n  \
         page:                  {page}\n  \
         cursor:                {cursor:?}\n  \
         orders seen so far:    {orders_seen}\n  \
         pending gDB jobs:       {pending}\n  \
         reconciler backlog:    {backlog} order(s) awaiting processing\n  \
         iteration elapsed:     {secs}s ({millis}ms)",
      page = result.pages_seen,
      cursor = cursor,
      orders_seen = result.orders_seen,
      pending = pending_db_job_count,
      backlog = deps.order_reconciler.len(),
      secs = iteration_elapsed.as_secs(),
      millis = iteration_elapsed.as_millis(),
    );

    let response = poll_orders_with_retry(deps, cursor).await?;

    let page_summary = stage_finished_orders(deps, &response.orders, &job_by_order_id);

    result.pages_seen += 1;
    result.orders_seen += response.orders.len() as u32;
    result.orders_staged += page_summary.staged;

    let maybe_oldest_created_at = response.orders
        .iter()
        .filter_map(|order| order.created_at_utc)
        .last();

    info!(
      "Polled Kinovi page {}: {} orders (oldest on page created at {:?}); {} finished orders staged from this page.",
      result.pages_seen,
      response.orders.len(),
      maybe_oldest_created_at,
      page_summary.staged,
    );

    cursor = response.next_cursor;

    let exceeded_max_age = match (deps.maybe_max_job_age, maybe_oldest_created_at) {
      (Some(max_age), Some(oldest)) => {
        let age = Utc::now() - oldest;
        if age > max_age {
          info!(
            "Oldest order on page {} is {} hours old (threshold {} hours). Stopping deep walk.",
            result.pages_seen, age.num_hours(), max_age.num_hours(),
          );
          true
        } else {
          false
        }
      }
      _ => false,
    };

    if cursor.is_none() || exceeded_max_age {
      break;
    }

    // Periodically revisit the head of the list mid-walk so freshly-finished
    // recent orders don't have to wait for the entire long tail to be scanned.
    pages_since_head_recheck += 1;
    if pages_since_head_recheck >= DEEP_PAGES_BETWEEN_HEAD_RECHECKS {
      pages_since_head_recheck = 0;
      let head = recheck_head_pages(deps, &job_by_order_id).await?;
      result.pages_seen += head.pages_seen;
      result.orders_seen += head.orders_seen;
      result.orders_staged += head.orders_staged;
    }
  }

  Ok(result)
}

/// Re-scan the first [`HEAD_PAGE_COUNT`] pages (newest orders) and stage any
/// finished matches. Used mid-walk to keep recent-job latency low.
async fn recheck_head_pages(
  deps: &JobDependencies,
  job_by_order_id: &HashMap<String, PendingSeedance2ProJob>,
) -> anyhow::Result<WalkResult> {
  info!("Re-checking the {} newest order page(s).", HEAD_PAGE_COUNT);

  let mut result = WalkResult::default();
  let mut cursor: Option<u64> = None;

  for _ in 0..HEAD_PAGE_COUNT {
    if deps.application_shutdown.get() {
      break;
    }

    let response = poll_orders_with_retry(deps, cursor).await?;

    let page_summary = stage_finished_orders(deps, &response.orders, job_by_order_id);

    result.pages_seen += 1;
    result.orders_seen += response.orders.len() as u32;
    result.orders_staged += page_summary.staged;

    cursor = response.next_cursor;
    if cursor.is_none() {
      break;
    }
  }

  Ok(result)
}

struct PageStageSummary {
  staged: u32,
}

/// Stage every finished (completed/failed) order on this page that matches a
/// pending job. Orders still in progress are ignored — we'll see them again on
/// a later poll. Staging is idempotent: the reconciler drops duplicates.
fn stage_finished_orders(
  deps: &JobDependencies,
  orders: &[OrderStatus],
  job_by_order_id: &HashMap<String, PendingSeedance2ProJob>,
) -> PageStageSummary {
  let mut staged = 0u32;

  for order in orders {
    let job = match job_by_order_id.get(&order.order_id) {
      Some(job) => job,
      None => continue, // Not one of our pending jobs.
    };

    if !order.task_status.is_terminal() {
      continue; // Still pending/processing — check again next poll.
    }

    let newly_staged = deps.order_reconciler.push_order(
      order.order_id.clone(),
      order.clone(),
      job.clone(),
    );

    if newly_staged {
      staged += 1;
      info!(
        "Staged finished order {} (status {:?}) for job {}.",
        order.order_id, order.task_status, job.job_token.as_str(),
      );
    }
  }

  PageStageSummary { staged }
}

/// Poll orders from Kinovi with retries. On transient failures, waits with
/// increasing delay (attempt × 2s, capped at `poll_retry_max_delay_millis`).
/// After exhausting retries, alerts the pager and returns an error.
async fn poll_orders_with_retry(
  deps: &JobDependencies,
  cursor: Option<u64>,
) -> anyhow::Result<PollOrdersResponse> {
  let max_retries = deps.poll_max_retries;

  for attempt in 1..=max_retries {
    match poll_orders(PollOrdersArgs {
      session: &deps.seedance2pro_session,
      cursor,
      host_override: None,
    }).await {
      Ok(response) => return Ok(response),
      Err(err) => {
        warn!(
          "Error polling Kinovi orders (attempt {}/{}): {:?}",
          attempt, max_retries, err
        );

        if attempt >= max_retries {
          return alert_pager_and_return_err(
            &deps.pager,
            "Kinovi API polling failed after retries",
            anyhow::anyhow!("poll_orders failed after {} attempts: {:?}", attempt, err),
            None,
          );
        }

        let delay_millis = (attempt as u64 * 2_000).min(deps.poll_retry_max_delay_millis);
        tokio::time::sleep(Duration::from_millis(delay_millis)).await;
      }
    }
  }

  alert_pager_and_return_err(
    &deps.pager,
    "Kinovi API polling failed after max retries",
    anyhow::anyhow!("poll_orders failed after {} attempts", max_retries),
    None,
  )
}
