use std::collections::HashMap;
use std::time::Duration;

use log::{error, info, warn};
use mysql_queries::queries::generic_inference::seedance2pro::list_pending_seedance2pro_jobs::list_pending_seedance2pro_jobs;
use seedance2pro_client::requests::poll_orders::poll_orders::{poll_orders, PollOrdersArgs, TaskStatus};

use crate::process_job::process_failed_job::process_failed_job;
use crate::process_job::process_successful_job::process_successful_job;
use crate::job_dependencies::JobDependencies;

pub async fn main_loop(job_dependencies: JobDependencies) {
  while !job_dependencies.application_shutdown.get() {
    let result = run_poll_iteration(&job_dependencies).await;

    if let Err(err) = result {
      error!("Error in poll iteration: {:?}", err);
      let _ = job_dependencies.job_stats.increment_failure_count();
    }

    tokio::time::sleep(Duration::from_millis(job_dependencies.poll_interval_millis)).await;
  }

  warn!("Seedance2Pro job runner main loop is shut down.");
}

async fn run_poll_iteration(deps: &JobDependencies) -> anyhow::Result<()> {
  // 1. Query all non-terminal Seedance2Pro jobs from DB.
  let pending_jobs = list_pending_seedance2pro_jobs(&deps.mysql_pool).await?;

  if pending_jobs.is_empty() {
    info!("No pending Seedance2Pro jobs.");
    return Ok(());
  }

  info!("Found {} pending Seedance2Pro job(s).", pending_jobs.len());

  // Build a lookup: order_id -> job
  let mut job_by_order_id: HashMap<String, _> = pending_jobs
    .into_iter()
    .map(|job| (job.order_id.clone(), job))
    .collect();

  // 2. Poll all orders from seedance2pro API (exhausting pagination).
  let mut all_orders = Vec::new();
  let mut cursor: Option<u64> = None;
  let mut page_number: u32 = 0;

  loop {
    page_number += 1;
    info!("Beginning request for page {}... (cursor={:?}, total_orders_so_far={})", page_number, cursor, all_orders.len());

    let response = poll_orders(PollOrdersArgs {
      session: &deps.seedance2pro_session,
      cursor,
      host_override: None,
    })
      .await
      .map_err(|err| {
        warn!("Error polling seedance2pro orders: {:?}", err);
        anyhow::anyhow!("poll_orders failed: {:?}", err)
      })?;

    info!("Done polling page {}. Got {} orders on this page.", page_number, response.orders.len());
    all_orders.extend(response.orders);

    cursor = response.next_cursor;
    if cursor.is_none() {
      break;
    }
  }

  // Summarize polling results.
  let mut succeeded = 0u32;
  let mut failed = 0u32;
  let mut in_progress = 0u32;
  let mut unknown = 0u32;
  for order in &all_orders {
    match &order.task_status {
      TaskStatus::Completed => succeeded += 1,
      TaskStatus::Failed => failed += 1,
      TaskStatus::Pending | TaskStatus::Processing => in_progress += 1,
      TaskStatus::Unknown(_) => unknown += 1,
    }
  }
  info!(
    "Polling complete: {} pages, {} total orders (succeeded={}, failed={}, in_progress={}, unknown={})",
    page_number, all_orders.len(), succeeded, failed, in_progress, unknown
  );

  // 3. Match API orders to DB jobs and process terminal ones.
  for order in &all_orders {
    let job = match job_by_order_id.remove(&order.order_id) {
      Some(j) => j,
      None => continue, // Not one of our pending jobs.
    };

    match &order.task_status {
      TaskStatus::Completed => {
        info!(
          "Order {} completed, processing job {}",
          order.order_id,
          job.job_token.as_str()
        );
        if let Err(err) = process_successful_job(deps, &job, order).await {
          warn!(
            "Error processing completed order {}: {:?}",
            order.order_id, err
          );
          let _ = deps.job_stats.increment_failure_count();
        } else {
          let _ = deps.job_stats.increment_success_count();
        }
      }
      TaskStatus::Failed => {
        process_failed_job(deps, &job, order).await;
      }
      TaskStatus::Pending | TaskStatus::Processing => {
        // Still in progress — check again next poll.
      }
      TaskStatus::Unknown(unknown_status) => {
        // NB: Keep polling it?
        warn!("Unknown order status: {:?}", unknown_status);
      }
    }
  }

  Ok(())
}
