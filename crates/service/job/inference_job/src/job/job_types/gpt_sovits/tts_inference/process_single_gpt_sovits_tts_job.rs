use std::thread;
use std::time::{Duration, Instant};

use anyhow::anyhow;
use log::info;

use buckets::public::media_files::bucket_file_path::MediaFileBucketPath;
use buckets::public::weight_files::bucket_directory::WeightFileBucketDirectory;
use enums::by_table::generic_inference_jobs::inference_result_type::InferenceResultType;
use enums::by_table::media_files::media_file_origin_model_type::MediaFileOriginModelType;
use filesys::check_file_exists::check_file_exists;
use filesys::file_size::file_size;
use hashing::sha256::sha256_hash_file::sha256_hash_file;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use mysql_queries::queries::media_files::create::insert_media_file_from_zero_shot_tts::{insert_media_file_from_zero_shot, InsertArgs};
use mysql_queries::queries::model_weights::get::get_weight::get_weight_by_token;

use crate::job::job_loop::job_success_result::{JobSuccessResult, ResultEntity};
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::gpt_sovits::gpt_sovits_inference_command::InferenceArgs;
use crate::job::job_types::gpt_sovits::model_package::download_package::download_package;
use crate::job::job_types::gpt_sovits::model_package::model_package::GptSovitsPackageFileType;
use crate::job::job_types::gpt_sovits::tts_inference::check_and_validate_job::check_and_validate_job;
use crate::state::job_dependencies::JobDependencies;

const BUCKET_FILE_PREFIX: &str = "fakeyou_";
const BUCKET_FILE_EXTENSION: &str = ".wav";
const MIME_TYPE: &str = "audio/wav";

pub async fn process_single_gpt_sovits_tts_job(
  job_dependencies: &JobDependencies,
  job: &AvailableInferenceJob
) -> Result<JobSuccessResult, ProcessSingleJobError> {

  let mut job_progress_reporter = job_dependencies
    .clients
    .job_progress_reporter
    .new_generic_inference(job.inference_job_token.as_str())
    .map_err(|e| ProcessSingleJobError::Other(anyhow!(e)))?;


  let gpt_sovits_deps = job_dependencies
    .job
    .job_specific_dependencies
    .maybe_gpt_sovits_dependencies
    .as_ref()
    .ok_or_else(|| ProcessSingleJobError::JobSystemMisconfiguration(Some("Missing GPT-Sovits dependencies".to_string())))?;

  let job_args = check_and_validate_job(job)?;

  let work_temp_dir = format!("temp_gpt_sovits_tts_{}", job.id.0);

  // NB: TempDir exists until it goes out of scope, at which point it should delete from filesystem.
  let work_temp_dir = job_dependencies
    .fs
    .scoped_temp_dir_creator_for_work
    .new_tempdir(&work_temp_dir)
    .map_err(|e| ProcessSingleJobError::from_io_error(e))?;

  let output_dir = work_temp_dir.path().join("output");
  let output_file_path = output_dir.join("GPTSoVITS_1.wav");

  if !output_dir.exists() {
    std::fs::create_dir_all(&output_dir)
      .map_err(|err| ProcessSingleJobError::IoError(err))?;
  }

  let input_text = job_args.input_text;
  let gpt_sovits_model = job_args.gpt_sovits_model;

  let model_record = get_weight_by_token(&gpt_sovits_model, false, &job_dependencies.db.mysql_pool)
    .await?.ok_or_else(|| ProcessSingleJobError::ModelDeleted)?;

  let model_token = model_record.token.clone();
  let weights_file_bucket_directory = WeightFileBucketDirectory::from_object_hash(&model_record.public_bucket_hash);

  let weights_directory = &job_dependencies.fs.semi_persistent_cache.gpt_sovits_model_path(&model_token.as_str());

  // TODO(KS): Expose this as configuration
  let force_download = job.attempt_count > 2;

  download_package(
    gpt_sovits_model,
    &weights_file_bucket_directory,
    &weights_directory,
    &job_dependencies.buckets.public_bucket_client,
    &job_dependencies.fs.scoped_temp_dir_creator_for_short_lived_downloads,
    force_download,
  ).await?;

  let stderr_output_file = work_temp_dir.path().join("stderr.txt");
  let stdout_output_file = work_temp_dir.path().join("stdout.txt");
  let text_input_fs_path = work_temp_dir.path().join("inference_input.txt");

  std::fs::write(&text_input_fs_path, &input_text)
    .map_err(|e| ProcessSingleJobError::from_io_error(e))?;

  let gpt_model_path = weights_directory.join(format!("{}{}", model_token.as_str(), GptSovitsPackageFileType::GptModel.get_expected_package_suffix()));
  let sovits_model_path = weights_directory.join(format!("{}{}", model_token.as_str(), GptSovitsPackageFileType::SovitsCheckpoint.get_expected_package_suffix()));
  let reference_audio_path = weights_directory.join(format!("{}{}", model_token.as_str(), GptSovitsPackageFileType::ReferenceAudio.get_expected_package_suffix()));
  let reference_transcript_path = weights_directory.join(format!("{}{}", model_token.as_str(), GptSovitsPackageFileType::ReferenceTranscript.get_expected_package_suffix()));

  let inference_start_time = Instant::now();
  let command_exit_status = gpt_sovits_deps
    .inference_command
    .execute_inference(InferenceArgs{
      stderr_output_file: &stderr_output_file,
      stdout_output_file: &stdout_output_file,
      input_text_file: &text_input_fs_path,
      gpt_model_path: &gpt_model_path,
      sovits_model_path: &sovits_model_path,
      reference_audio_path: &reference_audio_path,
      reference_transcript_path: &reference_transcript_path,
      output_audio_directory: &output_dir,
      maybe_reference_free: None,
      maybe_temperature: None,
      maybe_target_language: Some("english".to_string()),
    });
  let inference_duration = Instant::now().duration_since(inference_start_time);

  info!("Inference command exited with status: {:?}", command_exit_status);
  info!("Inference took duration to complete: {:?}", &inference_duration);

  // ==================== CHECK ALL FILES EXIST AND GET METADATA ==================== //

  info!("Checking that output files exist...");

  check_file_exists(&output_file_path).map_err(|e| ProcessSingleJobError::Other(e))?;

  // upload audio to bucket
  info!("Uploading media ...");

  let result_bucket_location = MediaFileBucketPath::generate_new(
    Some(BUCKET_FILE_PREFIX),
    Some(BUCKET_FILE_EXTENSION)
  );

  let result_bucket_object_pathbuf = result_bucket_location.to_full_object_pathbuf();

  // Finished file path
  info!("Upload Bucket Path: {:?}", result_bucket_object_pathbuf);
  info!("Upload File Path: {:?}", &output_file_path);

  job_dependencies.buckets.public_bucket_client
    .upload_filename_with_content_type(
      &result_bucket_object_pathbuf,
      &output_file_path,
      &MIME_TYPE
    )
    .await
    .map_err(|e| ProcessSingleJobError::Other(e))?;
  
  // ==================== UPLOAD AUDIO TO BUCKET ====================

  info!("Calculating sha256...");

  let file_checksum = sha256_hash_file(&output_file_path).map_err(|err| {
    ProcessSingleJobError::Other(anyhow!("Error hashing file: {:?}", err))
  })?;

  let file_size_bytes = file_size(&output_file_path).map_err(|err|
    ProcessSingleJobError::Other(err)
  )?;

  job_progress_reporter.log_status("done").map_err(|e| ProcessSingleJobError::Other(e))?;
  let (media_file_token, id) = insert_media_file_from_zero_shot(InsertArgs {
    pool: &job_dependencies.db.mysql_pool,
    job: &job,
    origin_model_type: MediaFileOriginModelType::GptSovits,
    maybe_mime_type: Some(&MIME_TYPE),
    file_size_bytes,
    sha256_checksum: &file_checksum,
    public_bucket_directory_hash: result_bucket_location.get_object_hash(),
    maybe_public_bucket_prefix: Some(BUCKET_FILE_PREFIX),
    maybe_public_bucket_extension: Some(BUCKET_FILE_EXTENSION),
    is_on_prem: job_dependencies.job.info.container.is_on_prem,
    worker_hostname: &job_dependencies.job.info.container.hostname,
    worker_cluster: &job_dependencies.job.info.container.cluster_name,
  }).await.map_err(|e| ProcessSingleJobError::Other(e))?;

  info!(
        "Job {:?} complete success! Downloaded, ran inference, and uploaded. Saved model record: {}, Result Token: {}",
        job.id,
        id,
        &media_file_token
    );

  Ok(JobSuccessResult {
    maybe_result_entity: Some(ResultEntity {
      entity_type: InferenceResultType::MediaFile,
      entity_token: media_file_token.to_string(),
    }),
    inference_duration,
  })
}