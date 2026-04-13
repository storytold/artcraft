use std::collections::HashMap;
use std::time::{Duration, Instant};

use chrono::Utc;
use log::{error, info, warn};
use pager::notification::notification_details_builder::NotificationDetailsBuilder;
use pager::notification::notification_urgency::NotificationUrgency;
use mysql_queries::queries::generic_inference::seedance2pro::list_pending_seedance2pro_video_jobs::{list_pending_seedance2pro_video_jobs, PendingSeedance2ProJob};
use seedance2pro_client::requests::poll_orders::poll_orders::{poll_orders, OrderStatus, PollOrdersArgs, TaskStatus};

use crate::jobs::video_polling_job::alert_on_error::alert_pager_and_return_err;
use crate::jobs::video_polling_job::process_orders_batch::process_orders_batch;
use crate::job_dependencies::JobDependencies;

const POLL_ALERT_THRESHOLD: Duration = Duration::from_mins(6);

pub async fn video_polling_main_loop(job_dependencies: JobDependencies) {
  while !job_dependencies.application_shutdown.get() {
    let start = Instant::now();

    //
    // Run a single polling iteration and alert if it takes too long
    //

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
            "Poll iteration took {:.1} seconds, exceeding the 10-minute threshold.",
            elapsed.as_secs_f64(),
          )))
          .set_urgency(Some(NotificationUrgency::Medium))
          .build();

      if let Err(pager_err) = job_dependencies.pager.enqueue_page(notification) {
        error!("Failed to enqueue slow iteration alert: {:?}", pager_err);
      }
    }

    tokio::time::sleep(Duration::from_millis(job_dependencies.poll_interval_millis)).await;
  }

  warn!("Kinovi job runner main loop is shut down.");
}

async fn run_poll_iteration(deps: &JobDependencies) -> anyhow::Result<()> {
  // 1. Query all (limit 25,000) non-terminal Seedance2Pro jobs from DB.
  //    This is all non-(complete_success, complete_failure) jobs.
  let pending_jobs = match list_pending_seedance2pro_video_jobs(&deps.mysql_pool).await {
    Ok(jobs) => jobs,
    Err(err) => {
      error!("Failed to list pending database jobs: {:?}", err);
      return alert_pager_and_return_err(&deps.pager, "Jobs DB query failed", err.into(), None);
    }
  };

  let total_pending_jobs = pending_jobs.len();

  if pending_jobs.is_empty() {
    info!("No pending database jobs found in the database.");
    return Ok(());
  }

  info!("Found {} pending database job(s).", pending_jobs.len());

  let result = website_polling_loop(&deps, pending_jobs).await?;

  info!(
    "Database + Kinovi poll iteration complete: \
    {} total database jobs, \
    {} total Kinovi pages, \
    {} total Kinovi orders seen.",
    total_pending_jobs,
    result.total_pages_seen,
    result.total_orders_seen
  );

  Ok(())
}

struct WebsitePollingResult {
  total_pages_seen: u32,
  total_orders_seen: u32,
}

async fn website_polling_loop(
  deps: &&JobDependencies,
  pending_jobs: Vec<PendingSeedance2ProJob>
) -> anyhow::Result<WebsitePollingResult> {

  // Build a lookup: order_id -> job. This is mutated as batches are processed
  // so that each order is handled at most once.
  let mut job_by_order_id: HashMap<String, _> = pending_jobs
      .into_iter()
      .map(|job| (job.order_id.clone(), job))
      .collect();

  // 2. Poll orders from Kinovi API, optionally processing in chunks.
  let mut cursor: Option<u64> = None;
  let mut total_pages_seen: u32 = 0;
  let mut total_orders_seen: u32 = 0;

  // Accumulates orders for the current batch (when chunking is enabled)
  // or all orders (when chunking is disabled).
  let mut batch_orders: Vec<OrderStatus> = Vec::new();
  let mut pages_in_current_batch: u32 = 0;

  loop {
    if deps.application_shutdown.get() {
      info!("Shutdown requested during pagination. Stopping early.");
      break;
    }

    info!(
      "Beginning request for Kinovi page {}... (cursor: {:?}, total orders seen thus far: {})",
      total_pages_seen, cursor, total_orders_seen
    );

    let response = match poll_orders(PollOrdersArgs {
      session: &deps.seedance2pro_session,
      cursor,
      host_override: None,
    }).await {
      Ok(r) => r,
      Err(err) => {
        warn!("Error polling Kinovi orders: {:?}", err);
        return alert_pager_and_return_err(
          &deps.pager,
          "Kinovi API polling failed",
          anyhow::anyhow!("poll_orders failed: {:?}", err),
          None,
        );
      }
    };

    let page_orders_count = response.orders.len() as u32;

    total_pages_seen += 1;
    total_orders_seen += page_orders_count;

    pages_in_current_batch += 1;

    let maybe_last_order_created_at = response.orders
        .iter()
        .filter(|order| order.created_at_utc.is_some())
        .last()
        .and_then(|order| order.created_at_utc);

    info!(
      "Done polling Kinovi orders page {}. \
      Got {} orders on this page (oldest on page created at {:?}).",
      total_pages_seen,
      page_orders_count,
      maybe_last_order_created_at,
    );

    // Check if the last (oldest) order in this page exceeds the max age threshold.
    // Orders are returned newest-first, so the last order is the oldest.
    let mut exceeded_max_age = false;

    if let Some(ref max_age) = deps.maybe_max_job_age {
      if let Some(last_order_created_at) = maybe_last_order_created_at {
        let order_age = Utc::now() - last_order_created_at;
        let too_old = order_age > *max_age;
        if too_old {
          info!(
            "Last order on Kinovi order page {} is {} hours old \
            (staleness threshold: {} hours). Stopping Kinovi pagination.",
            total_pages_seen,
            order_age.num_hours(),
            max_age.num_hours()
          );
          exceeded_max_age = true;
        }
      }
    };

    batch_orders.extend(response.orders);

    cursor = response.next_cursor;

    let reached_end = cursor.is_none() || exceeded_max_age;

    let batch_is_full = deps.maybe_pages_per_batch
        .map(|batch_page_limit| pages_in_current_batch >= batch_page_limit)
        .unwrap_or(false);

    // Determine if we should process the current batch now.
    let should_process_batch_now = reached_end || batch_is_full;

    if should_process_batch_now && !batch_orders.is_empty() {
      process_orders_batch(
        deps,
        &batch_orders,
        &mut job_by_order_id,
        pages_in_current_batch
      ).await;

      batch_orders.clear();
      pages_in_current_batch = 0;

      // If all pending jobs have been matched, no need to keep paging.
      if job_by_order_id.is_empty() {
        info!("All pending database jobs have been matched to Kinovi orders and processed. Stopping pagination early.");
        break;
      }
    }

    if reached_end {
      break;
    }
  }

  Ok(WebsitePollingResult {
    total_pages_seen,
    total_orders_seen
  })
}

