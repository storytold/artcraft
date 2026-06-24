use log::warn;

use errors::AnyhowResult;
use seedance2pro_client::requests::poll_orders::poll_orders::{OrderMediaType, TaskStatus};

use crate::job_dependencies::JobDependencies;
use crate::jobs::order_processing_job::process_failed_job::process_failed_job;
use crate::jobs::order_processing_job::process_successful_image_job::process_successful_image_job;
use crate::jobs::order_processing_job::process_successful_video_job::process_successful_video_job;
use crate::order_reconciler::OrderDetails;

/// Reconcile a single finished order into our system, dispatching on its
/// terminal status and media type.
pub async fn process_one_order(
  deps: &JobDependencies,
  details: &OrderDetails,
) -> AnyhowResult<()> {
  let job = &details.database_record;
  let order = &details.kinovi_record;

  match &order.task_status {
    TaskStatus::Completed => {
      // Dispatch on media type: Midjourney image orders return ~4 PNGs and need
      // different download/insert handling than the video path. `None` (older
      // response shapes that pre-date the `mediaType` field) and `Some(Video)`
      // both fall to the video handler for back-compat.
      match &order.media_type {
        Some(OrderMediaType::Image) => process_successful_image_job(deps, job, order).await,
        Some(OrderMediaType::Video) | None => process_successful_video_job(deps, job, order).await,
        Some(OrderMediaType::Unknown(other)) => {
          warn!(
            "Order {} has unrecognised media_type {:?}; treating as video.",
            order.order_id, other,
          );
          process_successful_video_job(deps, job, order).await
        }
      }
    }
    TaskStatus::Failed => {
      process_failed_job(deps, job, order).await;
      Ok(())
    }
    // The poller only stages terminal orders, so these shouldn't occur — but be
    // defensive rather than mis-process a non-final order.
    TaskStatus::Pending | TaskStatus::Processing => {
      warn!(
        "Staged order {} is unexpectedly still in progress ({:?}); skipping.",
        order.order_id, order.task_status,
      );
      Ok(())
    }
    TaskStatus::Unknown(status) => {
      warn!(
        "Staged order {} has unknown status {:?}; skipping.",
        order.order_id, status,
      );
      Ok(())
    }
  }
}
