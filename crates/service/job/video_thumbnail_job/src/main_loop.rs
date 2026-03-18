use std::time::Duration;

use log::{error, info, warn};

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use mysql_queries::queries::media_files::job::list_video_media_files_without_thumbnails_for_job::{
  list_video_media_files_without_thumbnails_for_job,
  ListVideoMediaFilesWithoutThumbnailsArgs,
  VideoMediaFileWithoutThumbnail,
};

use crate::job_dependencies::JobDependencies;

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
      },
      &deps.mysql_pool,
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

/// Download the source video from the bucket, generate thumbnails, and upload them.
async fn process_single_media_file(
  deps: &JobDependencies,
  media_file: &VideoMediaFileWithoutThumbnail,
) -> anyhow::Result<()> {
  // Reconstruct the bucket object path from the media file record.
  let bucket_path = MediaFileBucketPath::from_object_hash(
    &media_file.public_bucket_directory_hash,
    media_file.maybe_public_bucket_prefix.as_deref(),
    media_file.maybe_public_bucket_extension.as_deref(),
  );

  let object_path = bucket_path.get_full_object_path_str();

  info!(
    "Downloading video for media file {} from bucket path: {}",
    media_file.token.as_str(),
    object_path,
  );

  // Download the video to a temp file.
  let video_extension = media_file
    .maybe_public_bucket_extension
    .as_deref()
    .unwrap_or(".mp4");

  let temp_video_path = deps.temp_dir.join(
    format!("video_thumbnail_{}{}", media_file.token.as_str(), video_extension),
  );

  deps
    .public_bucket_client
    .download_file_to_disk(object_path, &temp_video_path)
    .await?;

  info!(
    "Downloaded video to {:?}. Generating thumbnails for {}.",
    temp_video_path,
    media_file.token.as_str(),
  );

  // TODO: Generate thumbnails (jpg + gif) from the downloaded video using ffmpeg,
  // upload them to the bucket, and update the media file record with maybe_thumbnail_version.
  todo!("Generate thumbnails with ffmpeg, upload, and update DB record");

  // Clean up temp file (will be reached once todo!() is replaced).
  #[allow(unreachable_code)]
  {
    let _ = tokio::fs::remove_file(&temp_video_path).await;
    Ok(())
  }
}
