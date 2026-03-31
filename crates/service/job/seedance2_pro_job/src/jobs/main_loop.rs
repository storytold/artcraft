use std::collections::HashMap;
use std::time::{Duration, Instant};

use log::{error, info, warn};
use pager::notification::notification_details_builder::NotificationDetailsBuilder;
use pager::notification::notification_urgency::NotificationUrgency;
use mysql_queries::queries::generic_inference::seedance2pro::list_pending_seedance2pro_jobs::list_pending_seedance2pro_jobs;
use seedance2pro_client::requests::poll_orders::poll_orders::{poll_orders, OrderStatus, PollOrdersArgs, TaskStatus};

use crate::jobs::alert_on_error::alert_pager_and_return_err;
use crate::jobs::process_page_batch::process_page_batch;
use crate::job_dependencies::JobDependencies;

const POLL_ALERT_THRESHOLD: Duration = Duration::from_secs(600);

pub async fn main_loop(job_dependencies: JobDependencies) {
  while !job_dependencies.application_shutdown.get() {
    let start = Instant::now();
    let result = run_poll_iteration(&job_dependencies).await;
    let elapsed = start.elapsed();

    if let Err(err) = result {
      error!("Error in poll iteration: {:?}", err);
      let _ = alert_pager_and_return_err::<()>(&job_dependencies.pager, "Seedance2Pro poll iteration error", err, None);
      let _ = job_dependencies.job_stats.increment_failure_count();
    }

    if elapsed > POLL_ALERT_THRESHOLD {
      warn!("Poll iteration took {:.1}s (threshold: {}s)", elapsed.as_secs_f64(), POLL_ALERT_THRESHOLD.as_secs());

      let notification = NotificationDetailsBuilder::from_title(
            "Seedance2Pro poll iteration slow".to_string())
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

  warn!("Seedance2Pro job runner main loop is shut down.");
}

async fn run_poll_iteration(deps: &JobDependencies) -> anyhow::Result<()> {
  // 1. Query all non-terminal Seedance2Pro jobs from DB.
  let pending_jobs = match list_pending_seedance2pro_jobs(&deps.mysql_pool).await {
    Ok(jobs) => jobs,
    Err(err) => {
      error!("Failed to list pending seedance2pro jobs: {:?}", err);
      return alert_pager_and_return_err(&deps.pager, "Seedance2Pro DB query failed", err.into(), None);
    }
  };

  if pending_jobs.is_empty() {
    info!("No pending Seedance2Pro jobs.");
    return Ok(());
  }

  info!("Found {} pending Seedance2Pro job(s).", pending_jobs.len());

  // Build a lookup: order_id -> job. This is mutated as batches are processed
  // so that each order is handled at most once.
  let mut job_by_order_id: HashMap<String, _> = pending_jobs
    .into_iter()
    .map(|job| (job.order_id.clone(), job))
    .collect();

  // 2. Poll orders from seedance2pro API, optionally processing in chunks.
  let mut cursor: Option<u64> = None;
  let mut total_page_number: u32 = 0;
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

    total_page_number += 1;
    pages_in_current_batch += 1;

    info!(
      "Beginning request for page {}... (cursor={:?}, total_orders_so_far={})",
      total_page_number, cursor, total_orders_seen
    );

    let response = match poll_orders(PollOrdersArgs {
      session: &deps.seedance2pro_session,
      cursor,
      host_override: None,
    }).await {
      Ok(r) => r,
      Err(err) => {
        warn!("Error polling seedance2pro orders: {:?}", err);
        return alert_pager_and_return_err(
          &deps.pager,
          "Seedance2Pro API poll failed",
          anyhow::anyhow!("poll_orders failed: {:?}", err),
          None,
        );
      }
    };

    let page_count = response.orders.len() as u32;
    info!("Done polling page {}. Got {} orders on this page.", total_page_number, page_count);

    total_orders_seen += page_count;
    batch_orders.extend(response.orders);

    cursor = response.next_cursor;
    let reached_end = cursor.is_none();

    // Determine if we should process the current batch now.
    let should_process_batch = reached_end
      || deps.maybe_pages_per_batch
        .map(|limit| pages_in_current_batch >= limit)
        .unwrap_or(false);

    if should_process_batch && !batch_orders.is_empty() {
      log_batch_summary(&batch_orders, pages_in_current_batch);

      process_page_batch(deps, &batch_orders, &mut job_by_order_id).await;

      batch_orders.clear();
      pages_in_current_batch = 0;

      // If all pending jobs have been matched, no need to keep paging.
      if job_by_order_id.is_empty() {
        info!("All pending jobs have been matched. Stopping pagination early.");
        break;
      }
    }

    if reached_end {
      break;
    }
  }

  info!(
    "Poll iteration complete: {} total pages, {} total orders seen.",
    total_page_number, total_orders_seen
  );

  Ok(())
}

fn log_batch_summary(orders: &[OrderStatus], pages_in_batch: u32) {
  let mut succeeded = 0u32;
  let mut failed = 0u32;
  let mut in_progress = 0u32;
  let mut unknown = 0u32;

  for order in orders {
    match &order.task_status {
      TaskStatus::Completed => succeeded += 1,
      TaskStatus::Failed => failed += 1,
      TaskStatus::Pending | TaskStatus::Processing => in_progress += 1,
      TaskStatus::Unknown(_) => unknown += 1,
    }
  }

  info!(
    "Processing batch of {} pages, {} orders (succeeded={}, failed={}, in_progress={}, unknown={})",
    pages_in_batch, orders.len(), succeeded, failed, in_progress, unknown
  );
}
