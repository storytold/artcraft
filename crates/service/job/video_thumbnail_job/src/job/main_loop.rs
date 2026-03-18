use std::time::Duration;

use log::{error, info, warn};

use mysql_queries::queries::media_files::thumbnails::list_video_media_files_without_thumbnails_for_job::{
  list_video_media_files_without_thumbnails_for_job,
  ListVideoMediaFilesWithoutThumbnailsArgs,
};

use crate::job_dependencies::JobDependencies;
use crate::job::process_single_media_file::process_single_media_file;

pub async fn main_loop(deps: JobDependencies) {
  while !deps.application_shutdown.get() {
    let processed_any = match run_batch_cycle(&deps).await {
      Ok(count) => {
        if count > 0 {
          info!("Processed {} video thumbnail(s) this cycle.", count);
        }
        count > 0
      }
      Err(err) => {
        error!("Error in video thumbnail batch cycle: {:?}", err);
        let _ = deps.job_stats.increment_failure_count();

        // Wait before retrying after a failure.
        tokio::time::sleep(Duration::from_millis(deps.query_failure_retry_delay_millis)).await;
        false
      }
    };

    // If we didn't process anything, sleep for the poll interval before checking again.
    if !processed_any {
      tokio::time::sleep(Duration::from_millis(deps.poll_interval_millis)).await;
    }
  }

  warn!("Video thumbnail job main loop is shut down.");
}

/// Run one full pagination cycle: keep querying pages of media files without thumbnails
/// until there are no more results. Returns the total number of items processed.
async fn run_batch_cycle(deps: &JobDependencies) -> anyhow::Result<u64> {
  let mut maybe_cursor: Option<i64> = None;
  let mut total_processed: u64 = 0;

  loop {
    if deps.application_shutdown.get() {
      break;
    }

    let result = list_video_media_files_without_thumbnails_for_job(
      ListVideoMediaFilesWithoutThumbnailsArgs {
        custom_max_lookback_hours: deps.custom_max_lookback_hours,
        custom_page_size: deps.custom_page_size,
        maybe_id_cursor: maybe_cursor,
        executor: &deps.mysql_pool,
      },
    ).await?;

    if result.media_files.is_empty() {
      break;
    }

    for media_file in &result.media_files {
      if deps.application_shutdown.get() {
        break;
      }

      match process_single_media_file(deps, media_file).await {
        Ok(()) => {
          let _ = deps.job_stats.increment_success_count();
          total_processed += 1;
        }
        Err(err) => {
          warn!(
            "Failed to generate thumbnail for media file {}: {:?}",
            media_file.token.as_str(),
            err,
          );
          let _ = deps.job_stats.increment_failure_count();
        }
      }
    }

    maybe_cursor = result.next_cursor;
    if maybe_cursor.is_none() {
      break;
    }

    // Throttle between pages.
    tokio::time::sleep(Duration::from_millis(deps.query_delay_millis)).await;
  }

  Ok(total_processed)
}
