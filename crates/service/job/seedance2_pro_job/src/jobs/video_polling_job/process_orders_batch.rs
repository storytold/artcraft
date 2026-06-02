use std::collections::HashMap;

use log::{info, warn};
use mysql_queries::queries::generic_inference::api_providers::seedance2pro::list_pending_seedance2pro_video_jobs::PendingSeedance2ProJob;
use seedance2pro_client::requests::poll_orders::poll_orders::{OrderMediaType, OrderStatus, TaskStatus};

use crate::job_dependencies::JobDependencies;
use crate::jobs::video_polling_job::process_job::process_failed_job::process_failed_job;
use crate::jobs::video_polling_job::process_job::process_successful_image_job::process_successful_image_job;
use crate::jobs::video_polling_job::process_job::process_successful_job::process_successful_job;

/// Process a batch of polled orders against the pending jobs map.
///
/// Removes matched order_ids from `job_by_order_id` so they are not
/// processed again in subsequent batches.
pub async fn process_orders_batch(
  deps: &JobDependencies,
  kinovi_orders: &[OrderStatus],
  job_by_order_id: &mut HashMap<String, PendingSeedance2ProJob>,
  pages_in_current_batch: u32,
) {
  log_batch_summary(&kinovi_orders, pages_in_current_batch);

  let pending_job_count = job_by_order_id.len();

  let mut batch_succeeded = 0u32;
  let mut batch_failed = 0u32;
  let mut batch_in_progress = 0u32;
  let mut batch_matched = 0u32;

  for order in kinovi_orders {
    let job = match job_by_order_id.remove(&order.order_id) {
      Some(j) => j,
      None => continue, // Not one of our pending jobs.
    };

    batch_matched += 1;

    match &order.task_status {
      TaskStatus::Completed => {
        info!(
          "Order {} completed (media_type={:?}), processing job {}",
          order.order_id,
          order.media_type,
          job.job_token.as_str()
        );

        // Dispatch on media type: Midjourney image orders return ~4 PNGs
        // and need different download/insert handling than the video
        // path. `None` (older response shapes that pre-date the
        // `mediaType` field) and `Some(Video)` both fall to the video
        // handler for back-compat with the seedance video flow.
        let result = match &order.media_type {
          Some(OrderMediaType::Image) => process_successful_image_job(deps, &job, order).await,
          Some(OrderMediaType::Video) | None => process_successful_job(deps, &job, order).await,
          Some(OrderMediaType::Unknown(other)) => {
            warn!(
              "Order {} has unrecognised media_type {:?}; treating as video",
              order.order_id, other,
            );
            process_successful_job(deps, &job, order).await
          }
        };

        if let Err(err) = result {
          warn!(
            "Error processing completed order {}: {:?}",
            order.order_id, err
          );
          let _ = deps.job_stats.increment_failure_count();
        } else {
          let _ = deps.job_stats.increment_success_count();
          batch_succeeded += 1;
        }
      }
      TaskStatus::Failed => {
        process_failed_job(deps, &job, order).await;
        batch_failed += 1;
      }
      TaskStatus::Pending | TaskStatus::Processing => {
        // Still in progress — check again next poll.
        batch_in_progress += 1;
      }
      TaskStatus::Unknown(unknown_status) => {
        warn!("Unknown order status: {:?}", unknown_status);
        batch_in_progress += 1;
      }
    }
  }

  info!(
    "Batch processing done: \
    {} kinovi orders in polled batch, \
    {} pending db jobs in batch at start, \
    {} kinovi orders in batch matched pending jobs \
    (orders succeeded={}, orders failed={}, orders in_progress={}), \
    {} pending db jobs in batch remaining",
    kinovi_orders.len(),
    pending_job_count,
    batch_matched,
    batch_succeeded,
    batch_failed,
    batch_in_progress,
    job_by_order_id.len(),
  );
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
    "Processing batch of {} Kinovi order pages, {} total orders (succeeded={}, failed={}, in_progress={}, unknown={})",
    pages_in_batch, orders.len(), succeeded, failed, in_progress, unknown
  );
}
