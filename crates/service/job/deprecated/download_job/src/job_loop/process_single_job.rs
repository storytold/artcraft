use std::time::Instant;

use anyhow::anyhow;
use log::{info, warn};
use tempdir::TempDir;

use config::is_bad_download_url::is_bad_download_url;
use errors::AnyhowResult;
use filesys::file_deletion::safe_delete_directory::safe_delete_directory;
use jobs_common::redis_job_status_logger::RedisJobStatusLogger;
use mysql_queries::queries::generic_download::job::list_available_generic_download_jobs::AvailableDownloadJob;
use mysql_queries::queries::generic_download::job::mark_generic_download_job_done::mark_generic_download_job_done;
use mysql_queries::queries::generic_download::job::mark_generic_download_job_pending_and_grab_lock::mark_generic_download_job_pending_and_grab_lock;

use crate::job_types::dispatch_job_to_handler::{dispatch_job_to_handler, DispatchJobToHandlerArgs};
use crate::JobState;

pub async fn process_single_job(job_state: &JobState, job: &AvailableDownloadJob) -> AnyhowResult<()> {

  // ==================== ATTEMPT TO GRAB JOB LOCK ==================== //

  let lock_acquired = mark_generic_download_job_pending_and_grab_lock(
    &job_state.mysql_pool,
    job.id,
    &job_state.container_db,
  ).await?;

  if !lock_acquired {
    warn!("Could not acquire job lock for: {}", &job.id.0);
    return Ok(())
  }

  process_single_job_wrap_with_logs(job_state, job).await
}

async fn process_single_job_wrap_with_logs(
  job_state: &JobState,
  job: &AvailableDownloadJob,
) -> AnyhowResult<()> {

  println!("\n  ----------------------------------------- JOB START -----------------------------------------  \n");

  info!("Beginning work download ({}): {:?}", job.id.0, job.download_job_token);
  info!("Download Type: {:?}", job.download_type);
  info!("Title: {:?}", job.title);
  info!("Download URL: {:?}", job.download_url);

  let result = do_process_single_job(job_state, job).await;

  println!("\n  ----------------------------------------- JOB END -----------------------------------------  \n");

  result
}

pub async fn do_process_single_job(job_state: &JobState, job: &AvailableDownloadJob) -> AnyhowResult<()> {

  // TODO(bt, 2023-07-27): Redis pool management probably belongs at near the outermost loop.
  let mut redis = job_state.redis_pool.get()?;
  let mut redis_logger = RedisJobStatusLogger::new_generic_download(&mut redis, job.download_job_token.as_str());

  let job_start_time = Instant::now();

  // ==================== SETUP TEMP DIRS ==================== //

  let temp_dir = format!("temp_{}", job.id.0);
  let temp_dir = TempDir::new(&temp_dir)?;

  // ==================== DOWNLOAD MODEL FILE ==================== //

  info!("Calling downloader...");

  redis_logger.log_status("downloading URL")?;

  if is_bad_download_url(&job.download_url)? {
    warn!("Bad download URL: `{}`", &job.download_url);
    return Err(anyhow!("Bad download URL: `{}`", &job.download_url));
  }

  // TODO USE THIS DOWNLOADER

  let download_filename = match job_state.sidecar_configs.google_drive_downloader.download_file(&job.download_url, &temp_dir).await {
    Ok(filename) => filename,
    Err(e) => {
      safe_delete_directory(&temp_dir);
      return Err(e);
    }
  };

  info!("Downloaded filename: {}", &download_filename);

  // ==================== HANDLE DIFFERENT DOWNLOAD TYPES ==================== //

  let result_details = dispatch_job_to_handler(DispatchJobToHandlerArgs {
    job_runner_state: job_state,
    job,
    temp_dir: &temp_dir,
    download_filename: &download_filename,
    redis_logger: &mut redis_logger,
  }).await?;

  let mut entity_token: Option<String> = None;
  let mut entity_type: Option<String> = None;

  if let Some(result_details) = result_details {
    // TODO: Cleanup
    entity_token = Some(result_details.entity_token.clone());
    entity_type = Some(result_details.entity_token.clone());
  }

  // =====================================================

  let job_duration = Instant::now().duration_since(job_start_time);

  info!("Job took duration to complete: {:?}", &job_duration);

  info!("Marking job complete...");

  mark_generic_download_job_done(
    &job_state.mysql_pool,
    job,
    true,
    entity_token.as_deref(),
    entity_type.as_deref(),
    job_duration,
  ).await?;

  info!("Saved model record: {} - {}", job.id.0, &job.download_job_token);

  job_state.firehose_publisher.publish_generic_download_finished(
    &job.creator_user_token,
    entity_token.as_deref())
      .await
      .map_err(|e| {
        warn!("error publishing event: {:?}", e);
        anyhow!("error publishing event")
      })?;

  redis_logger.log_status("done")?;

  info!("Job done: {}", job.id.0);

  Ok(())
}
