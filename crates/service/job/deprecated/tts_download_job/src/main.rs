#![forbid(private_bounds)]
#![forbid(private_interfaces)]
#![forbid(unused_must_use)]
//#![forbid(warnings)]

#![allow(dead_code)]
#![allow(non_snake_case)]
#![allow(unreachable_patterns)]
#![allow(unused_imports)]
#![allow(unused_mut)]
#![allow(unused_variables)]

#[macro_use] extern crate serde_derive;

use std::fs;
use std::fs::File;
use std::io::{BufReader, Error, Read};
use std::ops::Deref;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::Duration;

use anyhow::anyhow;
use chrono::Utc;
use log::{error, info, warn};
use r2d2_redis::r2d2;
use r2d2_redis::RedisConnectionManager;
use sqlx::mysql::MySqlPoolOptions;
use sqlx::MySqlPool;
use tempdir::TempDir;

use cloud_storage::bucket_client::BucketClient;
use bucket_paths::legacy::old_bespoke_paths::bucket_path_unifier::BucketPathUnifier;
use config::bad_urls::is_bad_tts_model_download_url;
use config::common_env::CommonEnv;
use config::shared_constants::DEFAULT_MYSQL_CONNECTION_STRING;
use config::shared_constants::DEFAULT_RUST_LOG;
use enums::by_table::tts_models::tts_model_type::TtsModelType;
use errors::AnyhowResult;
use filesys::check_directory_exists::check_directory_exists;
use filesys::check_file_exists::check_file_exists;
use filesys::file_deletion::safe_delete_directory::safe_delete_directory;
use filesys::file_deletion::safe_delete_file::safe_delete_file;
use google_drive_common::google_drive_download_command::GoogleDriveDownloadCommand;
use hashing::sha256::sha256_hash_file::sha256_hash_file;
use jobs_common::noop_logger::NoOpLogger;
use jobs_common::redis_job_status_logger::RedisJobStatusLogger;
use mysql_queries::mediators::badge_granter::BadgeGranter;
use mysql_queries::mediators::firehose_publisher::FirehosePublisher;
use mysql_queries::queries::tts::tts_download_jobs::tts_download_job_queries::grab_job_lock_and_mark_pending;
use mysql_queries::queries::tts::tts_download_jobs::tts_download_job_queries::insert_tts_model;
use mysql_queries::queries::tts::tts_download_jobs::tts_download_job_queries::mark_tts_upload_job_done;
use mysql_queries::queries::tts::tts_download_jobs::tts_download_job_queries::mark_tts_upload_job_failure;
use mysql_queries::queries::tts::tts_download_jobs::tts_download_job_queries::query_tts_upload_job_records;
use mysql_queries::queries::tts::tts_download_jobs::tts_download_job_queries::TtsUploadJobRecord;

use crate::script_execution::tacotron_model_check_command::TacotronModelCheckCommand;
use crate::script_execution::talknet_model_check_command::TalknetModelCheckCommand;

pub mod script_execution;

// Buckets
const ENV_ACCESS_KEY : &str = "ACCESS_KEY";
const ENV_SECRET_KEY : &str = "SECRET_KEY";
const ENV_REGION_NAME : &str = "REGION_NAME";
const ENV_BUCKET_NAME : &str = "TTS_DOWNLOAD_BUCKET_NAME";
const ENV_BUCKET_ROOT : &str = "TTS_DOWNLOAD_BUCKET_ROOT";

const DEFAULT_TEMP_DIR: &str = "/tmp";

struct Downloader {
  pub download_temp_directory: PathBuf,
  pub mysql_pool: MySqlPool,

  pub redis_pool: r2d2::Pool<RedisConnectionManager>,

  pub bucket_client: BucketClient,
  pub firehose_publisher: FirehosePublisher,
  pub badge_granter: BadgeGranter,
  pub google_drive_downloader: GoogleDriveDownloadCommand,

  pub bucket_path_unifier: BucketPathUnifier,

  pub tacotron_tts_check: TacotronModelCheckCommand,
  pub talknet_tts_check: TalknetModelCheckCommand,

  // Command to run
  pub download_script: String,
  // Root to store TTS results
  pub bucket_root_tts_model_uploads: String,

  // Sleep between batches
  pub job_batch_wait_millis: u64,

  // How long to wait between log lines
  pub no_op_logger_millis: u64,

  // Max job attempts before failure.
  // NB: This is an i32 so we don't need to convert to db column type.
  pub job_max_attempts: i32,
}

#[tokio::main]
async fn main() -> AnyhowResult<()> {
  easyenv::init_all_with_default_logging(Some(DEFAULT_RUST_LOG));

  let _ = dotenv::from_filename(".env-secrets").ok();

  info!("Obtaining hostname...");

  let server_hostname = hostname::get()
    .ok()
    .and_then(|h| h.into_string().ok())
    .unwrap_or("tts-download-job".to_string());

  info!("Hostname: {}", &server_hostname);

  // Bucket stuff
  let access_key = easyenv::get_env_string_required(ENV_ACCESS_KEY)?;
  let secret_key = easyenv::get_env_string_required(ENV_SECRET_KEY)?;
  let region_name = easyenv::get_env_string_required(ENV_REGION_NAME)?;
  let bucket_name = easyenv::get_env_string_required(ENV_BUCKET_NAME)?;
  let bucket_root = easyenv::get_env_string_required(ENV_BUCKET_ROOT)?;

  let s3_compatible_endpoint_url = easyenv::get_env_string_or_default(
    "S3_COMPATIBLE_ENDPOINT_URL",
    "https://storage.googleapis.com");
  let bucket_timeout = easyenv::get_env_duration_seconds_or_default("BUCKET_TIMEOUT_SECONDS",
    Duration::from_secs(60 * 5));

  let bucket_client = BucketClient::create(
    &access_key,
    &secret_key,
    &region_name,
    &bucket_name,
    &s3_compatible_endpoint_url,
    None,
    Some(bucket_timeout),
  )?;

  let temp_directory = easyenv::get_env_string_or_default(
    "DOWNLOAD_TEMP_DIR",
    DEFAULT_TEMP_DIR);

  let download_script = easyenv::get_env_string_or_default(
    "DOWNLOAD_SCRIPT",
    "./scripts/download_internet_file.py");

  let google_drive_downloader =
      GoogleDriveDownloadCommand::new_production(&download_script);

  let temp_directory = PathBuf::from(temp_directory);

  check_directory_exists(&temp_directory)?;

  let db_connection_string =
    easyenv::get_env_string_or_default(
      "MYSQL_URL",
      DEFAULT_MYSQL_CONNECTION_STRING);

  info!("Connecting to database...");

  let mysql_pool = MySqlPoolOptions::new()
    .max_connections(5)
    .connect(&db_connection_string)
    .await?;

  let common_env = CommonEnv::read_from_env()?;

  info!("Connecting to redis...");

  let redis_manager =
      RedisConnectionManager::new(common_env.redis_0_connection_string.deref())?;

  let redis_pool = r2d2::Pool::builder()
      .build(redis_manager)?;

  let firehose_publisher = FirehosePublisher {
    mysql_pool: mysql_pool.clone(), // NB: Pool is sync/send/clone-safe
  };

  let badge_granter = BadgeGranter {
    mysql_pool: mysql_pool.clone(), // NB: Pool is sync/send/clone-safe
    firehose_publisher: firehose_publisher.clone(), // NB: Also safe
  };

  let tacotron_root_code_directory = easyenv::get_env_string_required("TACOTRON_ROOT_CODE_DIRECTORY")?;
  let tacotron_virtual_env_activation_command = easyenv::get_env_string_or_default(
    "TACOTRON_VIRTUAL_ENV_ACTIVATION_COMMAND",
    "source python-tacotron/bin/activate");

  let tacotron_model_check_script_name = easyenv::get_env_string_or_default(
    "TACOTRON_MODEL_CHECK_SCRIPT_NAME",
    "vocodes_model_check_tacotron.py");

  let tacotron_check_command= TacotronModelCheckCommand::new(
    &tacotron_root_code_directory,
    &tacotron_virtual_env_activation_command,
    &tacotron_model_check_script_name,
  );

  let talknet_root_code_directory = easyenv::get_env_string_required("TALKNET_ROOT_CODE_DIRECTORY")?;
  let talknet_check_script_name = easyenv::get_env_string_required("TALKNET_MODEL_CHECK_SCRIPT_NAME")?;

  let talknet_check_command= TalknetModelCheckCommand::new(
    &talknet_root_code_directory,
    &talknet_check_script_name,
  );

  let downloader = Downloader {
    download_temp_directory: temp_directory,
    mysql_pool,
    redis_pool,
    bucket_client,
    download_script,
    google_drive_downloader,
    bucket_path_unifier: BucketPathUnifier::default_paths(),
    bucket_root_tts_model_uploads: bucket_root.to_string(),
    firehose_publisher,
    badge_granter,
    tacotron_tts_check: tacotron_check_command,
    talknet_tts_check: talknet_check_command,
    job_batch_wait_millis: common_env.job_batch_wait_millis,
    job_max_attempts: common_env.job_max_attempts as i32,
    no_op_logger_millis: common_env.no_op_logger_millis,
  };

  main_loop(downloader).await;

  Ok(())
}

const START_TIMEOUT_MILLIS : u64 = 500;
const INCREASE_TIMEOUT_MILLIS : u64 = 1000;

async fn main_loop(downloader: Downloader) {
  let mut error_timeout_millis = START_TIMEOUT_MILLIS;

  let mut noop_logger = NoOpLogger::new(downloader.no_op_logger_millis as i64);

  loop {
    let num_records = 1;
    let query_result = query_tts_upload_job_records(&downloader.mysql_pool, num_records).await;

    let jobs = match query_result {
      Ok(jobs) => jobs,
      Err(e) => {
        warn!("Error querying jobs: {:?}", e);
        std::thread::sleep(Duration::from_millis(error_timeout_millis));
        error_timeout_millis += INCREASE_TIMEOUT_MILLIS;
        continue;
      }
    };

    if jobs.is_empty() {
      noop_logger.log_after_awhile();

      std::thread::sleep(Duration::from_millis(downloader.job_batch_wait_millis));
      continue;
    }

    let result = process_jobs(&downloader, jobs).await;

    match result {
      Ok(_) => {},
      Err(e) => {
        warn!("Error querying jobs: {:?}", e);
        std::thread::sleep(Duration::from_millis(error_timeout_millis));
        error_timeout_millis += INCREASE_TIMEOUT_MILLIS;
        continue;
      }
    }

    error_timeout_millis = START_TIMEOUT_MILLIS; // reset

    std::thread::sleep(Duration::from_millis(downloader.job_batch_wait_millis));
  }
}

async fn process_jobs(downloader: &Downloader, jobs: Vec<TtsUploadJobRecord>) -> AnyhowResult<()> {
  for job in jobs.into_iter() {
    let result = process_job(downloader, &job).await;
    match result {
      Ok(_) => {},
      Err(e) => {
        warn!("Failure to process job: {:?}", e);
        let failure_reason = "";
        let _r = mark_tts_upload_job_failure(
          &downloader.mysql_pool,
          &job,
          failure_reason,
          downloader.job_max_attempts
        ).await;
      }
    }
  }

  Ok(())
}

#[derive(Deserialize)]
struct FileMetadata {
  pub file_size_bytes: u64,
}

fn read_metadata_file(filename: &PathBuf) -> AnyhowResult<FileMetadata> {
  let mut file = File::open(filename)?;
  let mut buffer = String::new();
  file.read_to_string(&mut buffer)?;
  Ok(serde_json::from_str(&buffer)?)
}

async fn process_job(downloader: &Downloader, job: &TtsUploadJobRecord) -> AnyhowResult<()> {
  // TODO: 1. Mark processing. (DONE)
  // TODO: 2. Download. (DONE)
  // TODO: 3. Upload. (DONE)
  // TODO: 4. Save record. (DONE)
  // TODO: 5. Mark job done. (DONE)

  let mut redis = downloader.redis_pool.get()?;
  let mut redis_logger = RedisJobStatusLogger::new_tts_download(
    &mut redis,
    &job.token);

  // ==================== ATTEMPT TO GRAB JOB LOCK ==================== //

  let lock_acquired = grab_job_lock_and_mark_pending(&downloader.mysql_pool, job).await?;

  if !lock_acquired {
    warn!("Could not acquire job lock for: {}", &job.id);
    return Ok(())
  }

  // ==================== SETUP TEMP DIRS ==================== //

  let temp_dir = format!("temp_{}", job.id);
  let temp_dir = TempDir::new(&temp_dir)?;

  // ==================== DOWNLOAD MODEL FILE ==================== //

  info!("Calling downloader...");

  redis_logger.log_status("downloading model")?;

  let download_url = job.download_url.as_ref()
    .map(|c| c.to_string())
    .unwrap_or("".to_string());

  if is_bad_tts_model_download_url(&download_url)? {
    warn!("Bad download URL: `{}`", &download_url);
    return Err(anyhow!("Bad download URL: `{}`", &download_url));
  }

  let download_filename = match downloader.google_drive_downloader.download_file(&download_url, &temp_dir).await {
    Ok(filename) => filename,
    Err(e) => {
      safe_delete_directory(&temp_dir);
      return Err(e);
    }
  };

  let model_type = if download_filename.to_lowercase().ends_with("zip") {
    // TODO: Finish supporting TalkNet
    warn!("File ends with `.zip`. Unsupported model type!");
    return Err(anyhow!("File ends with `.zip`. Unsupported model type!"));
  } else {
    // NB: This isn't a guarantee that this is the model type.
    TtsModelType::Tacotron2
  };

  info!("Uploaded model type: {:?}", model_type);

  // ==================== RUN MODEL CHECK ==================== //

  info!("Checking that model is valid...");

  redis_logger.log_status("checking model")?;

  let file_path = PathBuf::from(download_filename.clone());

  let output_metadata_fs_path = temp_dir.path().join("metadata.json");

  match model_type {
    TtsModelType::Tacotron2 => {
      let result = downloader.tacotron_tts_check.execute(
        &file_path,
        &output_metadata_fs_path,
        false,
      );

      if let Err(e) = result {
        safe_delete_file(&file_path);
        safe_delete_directory(&temp_dir);
      }
    },
    _ => {
      error!("Wrong model type for tts-download-job: {:?}", &model_type);
      return Err(anyhow!("Wrong model type for tts-download-job: {:?}", &model_type));;
    }
  }

  // ==================== CHECK ALL FILES EXIST AND GET METADATA ==================== //

  info!("Checking that metadata output file exists...");

  check_file_exists(&output_metadata_fs_path)?;

  let file_metadata = match read_metadata_file(&output_metadata_fs_path) {
    Ok(metadata) => metadata,
    Err(e) => {
      safe_delete_file(&file_path);
      safe_delete_file(&output_metadata_fs_path);
      safe_delete_directory(&temp_dir);
      return Err(e);
    }
  };

  // ==================== UPLOAD MODEL FILE ==================== //

  info!("Uploading model to GCS...");

  let private_bucket_hash = sha256_hash_file(&download_filename)?;

  info!("File hash: {}", private_bucket_hash);

  let synthesizer_model_bucket_path = match model_type {
    TtsModelType::Tacotron2 => downloader.bucket_path_unifier.tts_synthesizer_path(&private_bucket_hash),
    TtsModelType::Vits => unreachable!("we don't download VITS models with tts-download-job; use download-job"),
  };

  info!("Destination bucket path: {:?}", &synthesizer_model_bucket_path);

  redis_logger.log_status("uploading model")?;

  if let Err(e) = downloader.bucket_client.upload_filename(&synthesizer_model_bucket_path, &file_path).await {
    safe_delete_file(&output_metadata_fs_path);
    safe_delete_file(&file_path);
    safe_delete_directory(&temp_dir);
    return Err(e);
  }

  // ==================== DELETE DOWNLOADED FILE ==================== //

  // NB: We should be using a tempdir, but to make absolutely certain we don't overflow the disk...
  safe_delete_file(&output_metadata_fs_path);
  safe_delete_file(&file_path);
  safe_delete_directory(&temp_dir);

  // ==================== SAVE RECORDS ==================== //

  info!("Saving model record...");
  let (id, model_token) = insert_tts_model(
    &downloader.mysql_pool,
    job,
    &private_bucket_hash,
    synthesizer_model_bucket_path,
    file_metadata.file_size_bytes)
    .await?;

  info!("Marking job complete...");
  mark_tts_upload_job_done(
    &downloader.mysql_pool,
    job,
    true,
    Some(&model_token)
  ).await?;

  info!("Saved model record: {}", id);

  downloader.firehose_publisher.publish_tts_model_upload_finished(&job.creator_user_token, &model_token)
      .await
      .map_err(|e| {
        warn!("error publishing event: {:?}", e);
        anyhow!("error publishing event")
      })?;

  downloader.badge_granter.maybe_grant_tts_model_uploads_badge(&job.creator_user_token)
      .await
      .map_err(|e| {
        warn!("error maybe awarding badge: {:?}", e);
        anyhow!("error maybe awarding badge")
      })?;

  redis_logger.log_status("done")?;

  info!("Job done: {}", job.id);

  Ok(())
}
