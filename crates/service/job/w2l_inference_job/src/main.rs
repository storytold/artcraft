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

use std::fs::{File, metadata};
use std::io::{BufReader, Read};
use std::ops::Deref;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::thread;
use std::time::Duration;

use anyhow::anyhow;
use chrono::Utc;
use log::{info, warn};
use r2d2_redis::r2d2;
use r2d2_redis::r2d2::PooledConnection;
use r2d2_redis::redis::Commands;
use r2d2_redis::RedisConnectionManager;
use sqlx::mysql::MySqlPoolOptions;
use sqlx::MySqlPool;
use tempdir::TempDir;

use cloud_storage::bucket_client::BucketClient;
use cloud_storage::bucket_path_unifier::BucketPathUnifier;
use config::common_env::CommonEnv;
use config::shared_constants::DEFAULT_MYSQL_CONNECTION_STRING;
use config::shared_constants::DEFAULT_RUST_LOG;
use container_common::anyhow_result::AnyhowResult;
use filesys::check_directory_exists::check_directory_exists;
use filesys::check_file_exists::check_file_exists;
use filesys::safe_delete_temp_directory::safe_delete_temp_directory;
use filesys::safe_delete_temp_file::safe_delete_temp_file;
use google_drive_common::google_drive_download_command::GoogleDriveDownloadCommand;
use jobs_common::noop_logger::NoOpLogger;
use jobs_common::redis_job_status_logger::RedisJobStatusLogger;
use jobs_common::semi_persistent_cache_dir::SemiPersistentCacheDir;
use mysql_queries::mediators::firehose_publisher::FirehosePublisher;
use mysql_queries::queries::w2l::w2l_inference_jobs::w2l_inference_job_queries::get_w2l_template_by_token;
use mysql_queries::queries::w2l::w2l_inference_jobs::w2l_inference_job_queries::grab_job_lock_and_mark_pending;
use mysql_queries::queries::w2l::w2l_inference_jobs::w2l_inference_job_queries::insert_w2l_result;
use mysql_queries::queries::w2l::w2l_inference_jobs::w2l_inference_job_queries::mark_w2l_inference_job_done;
use mysql_queries::queries::w2l::w2l_inference_jobs::w2l_inference_job_queries::mark_w2l_inference_job_failure;
use mysql_queries::queries::w2l::w2l_inference_jobs::w2l_inference_job_queries::query_w2l_inference_job_records;
use mysql_queries::queries::w2l::w2l_inference_jobs::w2l_inference_job_queries::W2lInferenceJobRecord;

use crate::script_execution::wav2lip_inference_command::Wav2LipInferenceCommand;

mod script_execution;

// Buckets (shared config)
const ENV_ACCESS_KEY : &str = "ACCESS_KEY";
const ENV_SECRET_KEY : &str = "SECRET_KEY";
const ENV_REGION_NAME : &str = "REGION_NAME";

// Buckets (private data)
const ENV_PRIVATE_BUCKET_NAME : &str = "W2L_PRIVATE_DOWNLOAD_BUCKET_NAME";
// Buckets (public data)
const ENV_PUBLIC_BUCKET_NAME : &str = "W2L_PUBLIC_DOWNLOAD_BUCKET_NAME";

// Where models and other assets get downloaded to.
const ENV_SEMIPERSISTENT_CACHE_DIR : &str = "SEMIPERSISTENT_CACHE_DIR";

// Python code
const ENV_CODE_DIRECTORY : &str = "W2L_CODE_DIRECTORY";
const ENV_MODEL_CHECKPOINT : &str = "W2L_MODEL_CHECKPOINT";
const ENV_INFERENCE_SCRIPT_NAME : &str = "W2L_INFERENCE_SCRIPT_NAME";

const DEFAULT_TEMP_DIR: &str = "/tmp";

struct Inferencer {
  pub download_temp_directory: PathBuf,
  pub mysql_pool: MySqlPool,

  pub redis_pool: r2d2::Pool<RedisConnectionManager>,

  pub private_bucket_client: BucketClient,
  pub public_bucket_client: BucketClient,

  pub firehose_publisher: FirehosePublisher,

  pub bucket_path_unifier: BucketPathUnifier,
  pub semi_persistent_cache: SemiPersistentCacheDir,

  pub google_drive_downloader: GoogleDriveDownloadCommand,
  pub w2l_inference: Wav2LipInferenceCommand,
  //pub ffmpeg_image_preview_generator: FfmpegGeneratePreviewImageCommand,
  //pub ffmpeg_video_preview_generator: FfmpegGeneratePreviewVideoCommand,
  //pub imagemagick_image_preview_generator: ImagemagickGeneratePreviewImageCommand,

  // Command to run
  pub inference_script: String,
  pub w2l_model_filename: String,
  pub w2l_end_bump_filename: String,

  // Sleep between batches
  pub job_batch_wait_millis: u64,

  // How long to wait between log lines
  pub no_op_logger_millis: u64,

  // Max job attempts before failure.
  // NB: This is an i32 so we don't need to convert to db column type.
  pub job_max_attempts: i32,

  // Temporary for debugging
  // Arbitrary timeouts can be inserted so we can exec in and poke around.
  pub debug_job_end_sleep_millis: u64,
}

#[tokio::main]
async fn main() -> AnyhowResult<()> {
  easyenv::init_all_with_default_logging(Some(DEFAULT_RUST_LOG));

  // NB: Do not check this secrets-containing dotenv file into VCS.
  // This file should only contain *development* secrets, never production.
  let _ = dotenv::from_filename(".env-secrets").ok();

  info!("Obtaining hostname...");

  let server_hostname = hostname::get()
    .ok()
    .and_then(|h| h.into_string().ok())
    .unwrap_or("w2l-inference-job".to_string());

  info!("Hostname: {}", &server_hostname);

  // Bucket stuff (shared)
  let access_key = easyenv::get_env_string_required(ENV_ACCESS_KEY)?;
  let secret_key = easyenv::get_env_string_required(ENV_SECRET_KEY)?;
  let region_name = easyenv::get_env_string_required(ENV_REGION_NAME)?;

  // Private and Public Buckets
  let private_bucket_name = easyenv::get_env_string_required(ENV_PRIVATE_BUCKET_NAME)?;
  let public_bucket_name = easyenv::get_env_string_required(ENV_PUBLIC_BUCKET_NAME)?;

  let s3_compatible_endpoint_url = easyenv::get_env_string_or_default(
    "S3_COMPATIBLE_ENDPOINT_URL",
    "https://storage.googleapis.com");
  let bucket_timeout = easyenv::get_env_duration_seconds_or_default("BUCKET_TIMEOUT_SECONDS",
    Duration::from_secs(60 * 5));

  let private_bucket_client = BucketClient::create(
    &access_key,
    &secret_key,
    &region_name,
    &private_bucket_name,
    &s3_compatible_endpoint_url,
    None,
    Some(bucket_timeout),
  )?;

  let public_bucket_client = BucketClient::create(
    &access_key,
    &secret_key,
    &region_name,
    &public_bucket_name,
    &s3_compatible_endpoint_url,
    None,
    Some(bucket_timeout),
  )?;

  let py_code_directory = easyenv::get_env_string_required(ENV_CODE_DIRECTORY)?;
  let py_script_name = easyenv::get_env_string_required(ENV_INFERENCE_SCRIPT_NAME)?;
  let py_model_checkpoint = easyenv::get_env_string_required(ENV_MODEL_CHECKPOINT)?;

  let w2l_inference_command = Wav2LipInferenceCommand::new(
    &py_code_directory,
    &py_script_name,
    &py_model_checkpoint,
  );

  let temp_directory = easyenv::get_env_string_or_default(
    "DOWNLOAD_TEMP_DIR",
    DEFAULT_TEMP_DIR);

  // TODO: In the future, we may want to enable downloading images or audio files.
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

  let inference_script = "TODO".to_string();

  let persistent_cache_path = easyenv::get_env_string_or_default(
    ENV_SEMIPERSISTENT_CACHE_DIR,
    "/tmp");

  let semi_persistent_cache = SemiPersistentCacheDir::configured_root(&persistent_cache_path);

  info!("Creating pod semi-persistent cache dirs...");
  semi_persistent_cache.create_w2l_model_path()?;
  semi_persistent_cache.create_w2l_end_bump_path()?;
  semi_persistent_cache.create_w2l_face_template_path()?;
  semi_persistent_cache.create_w2l_template_media_path()?;

  let w2l_model_filename = easyenv::get_env_string_or_default(
    "W2L_MODEL_FILENAME", "wav2lip_gan.pth");

  let w2l_end_bump_filename = easyenv::get_env_string_or_default(
    "W2L_END_BUMP_FILENAME", "vocodes-short-end-bump.mp4");

  let firehose_publisher = FirehosePublisher {
    mysql_pool: mysql_pool.clone(), // NB: MySqlPool is clone/send/sync safe
  };
  
  let common_env = CommonEnv::read_from_env()?;

  let inferencer = Inferencer {
    download_temp_directory: temp_directory,
    mysql_pool,
    redis_pool,
    public_bucket_client,
    private_bucket_client,
    inference_script,
    google_drive_downloader,
    w2l_inference: w2l_inference_command,
    bucket_path_unifier: BucketPathUnifier::default_paths(),
    semi_persistent_cache,
    firehose_publisher,
    w2l_model_filename,
    w2l_end_bump_filename,
    job_batch_wait_millis: common_env.job_batch_wait_millis,
    job_max_attempts: common_env.job_max_attempts as i32,
    no_op_logger_millis: common_env.no_op_logger_millis,
    debug_job_end_sleep_millis: common_env.debug_job_end_sleep_millis,
  };

  main_loop(inferencer).await;

  Ok(())
}

const START_TIMEOUT_MILLIS : u64 = 500;
const INCREASE_TIMEOUT_MILLIS : u64 = 1000;

async fn main_loop(inferencer: Inferencer) {
  let mut error_timeout_millis = START_TIMEOUT_MILLIS;

  let mut noop_logger = NoOpLogger::new(inferencer.no_op_logger_millis as i64);

  loop {
    let num_records = 1;

    let query_result = query_w2l_inference_job_records(
      &inferencer.mysql_pool,
      num_records)
      .await;

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

      std::thread::sleep(Duration::from_millis(inferencer.job_batch_wait_millis));
      continue;
    }

    let result = process_jobs(&inferencer, jobs).await;

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

    std::thread::sleep(Duration::from_millis(inferencer.job_batch_wait_millis));
  }
}

async fn process_jobs(inferencer: &Inferencer, jobs: Vec<W2lInferenceJobRecord>) -> AnyhowResult<()> {
  for job in jobs.into_iter() {
    let result = process_job(inferencer, &job).await;
    match result {
      Ok(_) => {},
      Err(e) => {
        warn!("Failure to process job: {:?}", e);
        let failure_reason = "";
        let _r = mark_w2l_inference_job_failure(
          &inferencer.mysql_pool,
          &job,
          failure_reason,
          inferencer.job_max_attempts
        ).await;
      }
    }
  }

  Ok(())
}

#[derive(Deserialize)]
struct FileMetadata {
  pub is_video: bool,
  pub width: u32,
  pub height: u32,
  //pub num_frames: u64,
  //pub fps: Option<f32>,
  pub duration_millis: Option<u64>,
  pub mimetype: Option<String>,
  pub file_size_bytes: u64,
}

fn read_metadata_file(filename: &PathBuf) -> AnyhowResult<FileMetadata> {
  let mut file = File::open(filename)?;
  let mut buffer = String::new();
  file.read_to_string(&mut buffer)?;
  Ok(serde_json::from_str(&buffer)?)
}

async fn process_job(inferencer: &Inferencer, job: &W2lInferenceJobRecord) -> AnyhowResult<()> {

  // TODO 1. Mark Processing
  //
  // TODO: 2. Check if w2l model is downloaded / download it to a stable cache location (DONE)
  // TODO: 3. Check if w2l template faces are downloaded and download it (done)
  // TODO: 4. Download user audio (done)

  // TODO: 5. Process Inference

  // TODO 6. Upload result
  // TODO 7. Save record
  // TODO 8. Mark job done

  let mut redis = inferencer.redis_pool.get()?;
  let mut redis_logger = RedisJobStatusLogger::new_w2l_inference(
    &mut redis,
    &job.inference_job_token);

  // ==================== ATTEMPT TO GRAB JOB LOCK ==================== //

  let lock_acquired = grab_job_lock_and_mark_pending(&inferencer.mysql_pool, job).await?;

  if !lock_acquired {
    warn!("Could not acquire job lock for: {}", &job.id);
    return Ok(())
  }

  // ==================== CONFIRM OR DOWNLOAD W2L MODEL ==================== //

  let model_filename = inferencer.w2l_model_filename.clone();
  let model_fs_path = inferencer.semi_persistent_cache.w2l_model_path(&model_filename);

  if !model_fs_path.exists() {
    warn!("Model file does not exist: {:?}", &model_fs_path);

    redis_logger.log_status("downloading model")?;

    let model_object_path = inferencer.bucket_path_unifier
      .w2l_pretrained_models_path(&model_filename);

    info!("Download from bucket path: {:?}", &model_object_path);

    inferencer.private_bucket_client.download_file_to_disk(
      &model_object_path,
      &model_fs_path
    ).await?;

    info!("Downloaded model from bucket!");
  }

  // ==================== CONFIRM OR DOWNLOAD W2L END BUMP ==================== //

  let end_bump_filename = inferencer.w2l_end_bump_filename.clone();
  let end_bump_fs_path = inferencer.semi_persistent_cache.w2l_end_bump_path(&end_bump_filename);

  if !end_bump_fs_path.exists() {
    warn!("End bump file does not exist: {:?}", &end_bump_fs_path);

    redis_logger.log_status("downloading assets")?;

    let end_bump_object_path = inferencer.bucket_path_unifier
      .end_bump_video_for_w2l_path(&end_bump_filename);

    info!("Download from bucket path: {:?}", &end_bump_object_path);

    inferencer.private_bucket_client.download_file_to_disk(
      &end_bump_object_path,
      &end_bump_fs_path
    ).await?;

    info!("Downloaded end bump from bucket!");
  }

  // ==================== LOOK UP TEMPLATE RECORD ==================== //

  let template_token = match &job.maybe_w2l_template_token {
    Some(token) => token.to_string(),
    None => {
      warn!("non-template token based inference not yet supported");
      return Err(anyhow!("non-template token based inference not yet supported"))
    },
  };

  info!("Looking up w2l template by token: {}", &template_token);

  let query_result = get_w2l_template_by_token(&inferencer.mysql_pool, &template_token).await?;

  let w2l_template = match query_result {
    Some(template) => template,
    None => {
      warn!("W2L Template not found: {}", &template_token);
      return Err(anyhow!("Template not found!"))
    },
  };

  // ==================== CONFIRM OR DOWNLOAD W2L TEMPLATE AUDIO OR VIDEO ==================== //

  // Template is based on the `private_bucket_hash`:
  //  - private_bucket_hash: 1519edf86e6975fdcd0a56a5953d84948db79f2b9ce588818d7fa544d5cb38b2
  //  - private_bucket_object_name: /user_uploaded_w2l_templates/1/5/1/1519edf86e6975fdcd0a56a5953d84948db79f2b9ce588818d7fa544d5cb38b2
  //  - private_bucket_cached_faces_object_name: /user_uploaded_w2l_templates/1/5/1/1519edf86e6975fdcd0a56a5953d84948db79f2b9ce588818d7fa544d5cb38b2_detected_faces.pickle
  //  - maybe_public_bucket_preview_image_object_name: /user_uploaded_w2l_templates/1/5/1/1519edf86e6975fdcd0a56a5953d84948db79f2b9ce588818d7fa544d5cb38b2_preview.webp

  let template_media_fs_path = inferencer.semi_persistent_cache.w2l_template_media_path(
    &w2l_template.private_bucket_hash);

  if !template_media_fs_path.exists() {
    info!("W2L template media file does not exist: {:?}", &template_media_fs_path);

    redis_logger.log_status("downloading template")?;

    let template_media_object_path = inferencer.bucket_path_unifier
      .media_templates_for_w2l_path(&w2l_template.private_bucket_hash);

    info!("Download from template media path: {:?}", &template_media_object_path);

    inferencer.private_bucket_client.download_file_to_disk(
      &template_media_object_path,
      &template_media_fs_path
    ).await?;

    info!("Downloaded template media from bucket!");
  }

  // ==================== CONFIRM OR DOWNLOAD W2L TEMPLATE FACE ==================== //

  // Template is based on the `private_bucket_hash`:
  //  - private_bucket_hash: 1519edf86e6975fdcd0a56a5953d84948db79f2b9ce588818d7fa544d5cb38b2
  //  - private_bucket_object_name: /user_uploaded_w2l_templates/1/5/1/1519edf86e6975fdcd0a56a5953d84948db79f2b9ce588818d7fa544d5cb38b2
  //  - private_bucket_cached_faces_object_name: /user_uploaded_w2l_templates/1/5/1/1519edf86e6975fdcd0a56a5953d84948db79f2b9ce588818d7fa544d5cb38b2_detected_faces.pickle
  //  - maybe_public_bucket_preview_image_object_name: /user_uploaded_w2l_templates/1/5/1/1519edf86e6975fdcd0a56a5953d84948db79f2b9ce588818d7fa544d5cb38b2_preview.webp

  let face_template_fs_path = inferencer.semi_persistent_cache.w2l_face_template_path(
    &w2l_template.private_bucket_hash);

  if !face_template_fs_path.exists() {
    info!("W2L face template file does not exist: {:?}", &face_template_fs_path);

    redis_logger.log_status("downloading template metadata")?;

    let face_template_object_path = inferencer.bucket_path_unifier
      .precomputed_faces_for_w2l_path(&w2l_template.private_bucket_hash);

    info!("Download from face template path: {:?}", &face_template_object_path);

    inferencer.private_bucket_client.download_file_to_disk(
      &face_template_object_path,
      &face_template_fs_path
    ).await?;

    info!("Downloaded face template from bucket!");
  }

  // ==================== DOWNLOAD USER AUDIO ==================== //

  redis_logger.log_status("downloading audio")?;

  let temp_dir = format!("temp_{}", job.id);
  let temp_dir = TempDir::new(&temp_dir)?; // NB: Exists until it goes out of scope.

  let audio_bucket_hash = match &job.maybe_public_audio_bucket_hash {
    Some(l) => l.clone(),
    None => {
      warn!("Only W2L jobs with user-uploaded audio are supported right now");
      return Err(anyhow!("Only W2L jobs with user-uploaded audio are supported right now"))
    },
  };

  let audio_fs_path = temp_dir.path().join(&audio_bucket_hash);

  let audio_object_path = inferencer.bucket_path_unifier
    .user_audio_for_w2l_inference_path(&audio_bucket_hash);

  inferencer.private_bucket_client.download_file_to_disk(
    &audio_object_path,
    &audio_fs_path
  ).await?;


  // ==================== RUN INFERENCE ==================== //

  redis_logger.log_status("executing")?;

  let output_video_fs_path = temp_dir.path().join("output.mp4");
  let output_metadata_fs_path = temp_dir.path().join("metadata.json");

  let is_image = w2l_template.template_type.contains("image");

  info!("Is image? {}", is_image);
  info!("Running W2L inference...");

  let inference_result = inferencer.w2l_inference.execute(
    &model_fs_path,
    &audio_fs_path,
    &end_bump_fs_path,
    &template_media_fs_path,
    &face_template_fs_path,
    &output_metadata_fs_path,
    &output_video_fs_path,
    false,
    false
  );

  if let Err(e) = inference_result {
    safe_delete_temp_file(&audio_fs_path);
    safe_delete_temp_file(&output_video_fs_path);
    safe_delete_temp_directory(&temp_dir);
    return Err(e);
  }

  info!("Output filename: {:?}", &output_video_fs_path);

  // ==================== CHECK ALL FILES EXIST AND GET METADATA ==================== //

  info!("Checking that output files exist...");

  check_file_exists(&output_video_fs_path)?;
  check_file_exists(&output_metadata_fs_path)?;

  let file_metadata = read_metadata_file(&output_metadata_fs_path)?;

  safe_delete_temp_file(&output_metadata_fs_path);

  // ==================== UPLOAD TO BUCKETS ==================== //

  redis_logger.log_status("uploading result")?;

  let result_object_path = inferencer.bucket_path_unifier.w2l_inference_video_output_path(
    &job.inference_job_token);

  info!("Image/video destination bucket path: {:?}", &result_object_path);

  info!("Uploading image/video...");

  let original_mime_type = file_metadata.mimetype
    .as_deref()
    .unwrap_or("application/octet-stream");

  let upload_result = inferencer.public_bucket_client.upload_filename_with_content_type(
    &result_object_path,
    &output_video_fs_path,
    original_mime_type)
    .await;

  if let Err(e) = upload_result {
    safe_delete_temp_file(&audio_fs_path);
    safe_delete_temp_file(&output_video_fs_path);
    safe_delete_temp_directory(&temp_dir);
    return Err(e);
  }

  safe_delete_temp_file(&output_video_fs_path);

  // ==================== DELETE DOWNLOADED FILE ==================== //

  // NB: We should be using a tempdir, but to make absolutely certain we don't overflow the disk...
  safe_delete_temp_directory(&temp_dir);

  // ==================== SAVE RECORDS ==================== //

  info!("Saving w2l inference record...");
  let (id, inference_result_token) = insert_w2l_result(
    &inferencer.mysql_pool,
    job,
    &result_object_path,
    file_metadata.file_size_bytes,
    file_metadata.mimetype.as_deref(),
    file_metadata.width,
    file_metadata.height,
    file_metadata.duration_millis.unwrap_or(0))
    .await?;

  info!("Marking job complete...");

  mark_w2l_inference_job_done(
    &inferencer.mysql_pool,
    job,
    true,
    Some(&inference_result_token)
  ).await?;

  inferencer.firehose_publisher.w2l_inference_finished(
    job.maybe_creator_user_token.as_deref(),
    &job.inference_job_token,
    &inference_result_token)
    .await
    .map_err(|e| {
      warn!("error publishing event: {:?}", e);
      anyhow!("error publishing event")
    })?;

  redis_logger.log_status("done")?;

  if inferencer.debug_job_end_sleep_millis != 0 {
    warn!("Debug sleep after job end: {} ms", inferencer.debug_job_end_sleep_millis);
    thread::sleep(Duration::from_millis(inferencer.debug_job_end_sleep_millis));
  }

  info!("Job {} complete success! Downloaded, ran inference, and uploaded. Saved model record: {}",
        job.id, id);

  Ok(())
}
