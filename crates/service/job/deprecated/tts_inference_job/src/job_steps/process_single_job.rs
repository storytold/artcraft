// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::fs::File;
use std::io::Read;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

use anyhow::anyhow;
use log::{error, info, warn};
use tempdir::TempDir;

use errors::AnyhowResult;
use filesys::check_file_exists::check_file_exists;
use filesys::file_deletion::safe_delete_directory::safe_delete_directory;
use filesys::file_deletion::safe_delete_file::safe_delete_file;
use hashing::sha256::sha256_hash_string::sha256_hash_string;
use mysql_queries::column_types::vocoder_type::VocoderType;
use mysql_queries::queries::tts::tts_inference_jobs::list_available_tts_inference_jobs::AvailableTtsInferenceJob;
use mysql_queries::queries::tts::tts_inference_jobs::mark_tts_inference_job_done::mark_tts_inference_job_done;
use mysql_queries::queries::tts::tts_inference_jobs::mark_tts_inference_job_pending_and_grab_lock::mark_tts_inference_job_pending_and_grab_lock;
use mysql_queries::queries::tts::tts_models::get_tts_model_for_inference::{get_tts_model_for_inference, TtsModelForInferenceRecord};
use mysql_queries::queries::tts::tts_results::insert_tts_result::{insert_tts_result, JobType};
use tts_common::clean_symbols::clean_symbols;
use tts_common::text_pipelines::guess_pipeline::guess_text_pipeline_heuristic;
use tts_common::text_pipelines::text_pipeline_type::TextPipelineType;

use crate::job_steps::download_file_from_bucket::maybe_download_file_from_bucket;
use crate::job_steps::job_args::JobArgs;
use crate::job_steps::process_single_job_error::ProcessSingleJobError;
use crate::job_steps::seconds_to_decoder_steps::seconds_to_decoder_steps;

/// Text starting with this will be treated as a test request.
/// This allows the request to bypass the model cache and query the latest TTS model.
const TEST_REQUEST_TEXT: &str = "This is a test request.";

#[derive(Deserialize, Default)]
struct FileMetadata {
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

pub async fn process_single_job(
  job_args: &JobArgs,
  job: &AvailableTtsInferenceJob,
  cached_model_record: &TtsModelForInferenceRecord,
) -> Result<(), ProcessSingleJobError> {

  // NB: Hack to allow cache bypass for debug requests
  // This will let us iterate faster with model changes.
  let mut maybe_queried_model = None;
  let mut model_record = cached_model_record;

  let mut job_progress_reporter = job_args
      .job_progress_reporter
      .new_tts_inference(&job.inference_job_token)
      .map_err(|e| ProcessSingleJobError::Other(anyhow!(e)))?;

  // ==================== ATTEMPT TO GRAB JOB LOCK ==================== //

  info!("Attempting to grab lock for job: {}", job.inference_job_token);

  let lock_acquired =
      mark_tts_inference_job_pending_and_grab_lock(&job_args.mysql_pool, job.id)
          .await
          .map_err(|e| ProcessSingleJobError::Other(e))?;

  if !lock_acquired {
    warn!("Could not acquire job lock for: {:?}", &job.id);
    return Ok(());
  }

  info!("Lock acquired for job: {}", job.inference_job_token);

  // ==================== DEBUG REQUEST ==================== //

  if job.raw_inference_text.starts_with(TEST_REQUEST_TEXT) {
    warn!("Test request - bypassing TTS model cache and re-querying...");

    // Under ordinary circumstances, model records are held in a long duration cache.
    // If we're operating quickly with edits, we may want to bypass that cache.
    let tts_model = get_tts_model_for_inference(
      &job_args.mysql_pool,
      &job.model_token)
        .await
        .map_err(|e| {
          ProcessSingleJobError::from_anyhow_error(anyhow!("error querying to bypass cache: {:?}", e))
        })?;

    maybe_queried_model = Some(tts_model); // Hold reference
    model_record = maybe_queried_model.as_ref().unwrap_or(cached_model_record);
  }

  // ==================== CONFIRM OR DOWNLOAD WAVEGLOW VOCODER MODEL ==================== //

  let waveglow_vocoder_model_fs_path = {
    let waveglow_vocoder_model_filename = job_args.waveglow_vocoder_model_filename.clone();
    let waveglow_vocoder_model_fs_path = job_args.semi_persistent_cache.tts_pretrained_vocoder_model_path(&waveglow_vocoder_model_filename);
    let waveglow_vocoder_model_object_path = job_args.bucket_path_unifier.tts_pretrained_vocoders_path(&waveglow_vocoder_model_filename);

    maybe_download_file_from_bucket(
      "waveglow vocoder model",
      &waveglow_vocoder_model_fs_path,
      &waveglow_vocoder_model_object_path,
      &job_args.private_bucket_client,
      &mut job_progress_reporter,
      "downloading vocoder (1 of 3)",
      job.id.0,
      &job_args.scoped_temp_dir_creator,
    ).await?;

    waveglow_vocoder_model_fs_path
  };

  // ==================== CONFIRM OR DOWNLOAD HIFIGAN (NORMAL) VOCODER MODEL ==================== //

  let pretrained_hifigan_vocoder_model_fs_path = {
    let hifigan_vocoder_model_filename = job_args.hifigan_vocoder_model_filename.clone();
    let hifigan_vocoder_model_fs_path = job_args.semi_persistent_cache.tts_pretrained_vocoder_model_path(&hifigan_vocoder_model_filename);
    let hifigan_vocoder_model_object_path = job_args.bucket_path_unifier.tts_pretrained_vocoders_path(&hifigan_vocoder_model_filename);

    maybe_download_file_from_bucket(
      "hifigan vocoder model",
      &hifigan_vocoder_model_fs_path,
      &hifigan_vocoder_model_object_path,
      &job_args.private_bucket_client,
      &mut job_progress_reporter,
      "downloading vocoder (2 of 3)",
      job.id.0,
      &job_args.scoped_temp_dir_creator,
    ).await?;

    hifigan_vocoder_model_fs_path
  };

  // ==================== CONFIRM OR DOWNLOAD HIFIGAN (SUPERRES) VOCODER MODEL ==================== //

  let hifigan_superres_vocoder_model_fs_path = {
    let hifigan_superres_vocoder_model_filename = job_args.hifigan_superres_vocoder_model_filename.clone();
    let hifigan_superres_vocoder_model_fs_path = job_args.semi_persistent_cache.tts_pretrained_vocoder_model_path(&hifigan_superres_vocoder_model_filename);
    let hifigan_superres_vocoder_model_object_path = job_args.bucket_path_unifier.tts_pretrained_vocoders_path(&hifigan_superres_vocoder_model_filename);

    maybe_download_file_from_bucket(
      "hifigan superres vocoder model",
      &hifigan_superres_vocoder_model_fs_path,
      &hifigan_superres_vocoder_model_object_path,
      &job_args.private_bucket_client,
      &mut job_progress_reporter,
      "downloading vocoder (3 of 3)",
      job.id.0,
      &job_args.scoped_temp_dir_creator,
    ).await?;

    hifigan_superres_vocoder_model_fs_path
  };

//  // ==================== CONFIRM OR DOWNLOAD OPTIONAL CUSTOM VOCODER MODEL ==================== //

  let custom_vocoder_fs_path = match &model_record.maybe_custom_vocoder {
    None => None,
    Some(vocoder) => {
      let custom_vocoder_fs_path = job_args.semi_persistent_cache.custom_vocoder_model_path(&vocoder.vocoder_token);
      let custom_vocoder_object_path  = job_args.bucket_path_unifier.vocoder_path(&vocoder.vocoder_private_bucket_hash);

      maybe_download_file_from_bucket(
        "custom vocoder",
        &custom_vocoder_fs_path,
        &custom_vocoder_object_path,
        &job_args.private_bucket_client,
        &mut job_progress_reporter,
        "downloading user vocoder",
        job.id.0,
        &job_args.scoped_temp_dir_creator,
      ).await?;

      Some(custom_vocoder_fs_path)
    }
  };

  // ==================== CONFIRM OR DOWNLOAD TTS SYNTHESIZER MODEL ==================== //

  let tts_synthesizer_fs_path = {
    let tts_synthesizer_fs_path = job_args.semi_persistent_cache.tts_synthesizer_model_path(&model_record.model_token);
    let tts_synthesizer_object_path  = job_args.bucket_path_unifier.tts_synthesizer_path(&model_record.private_bucket_hash);

    maybe_download_file_from_bucket(
      "synthesizer",
      &tts_synthesizer_fs_path,
      &tts_synthesizer_object_path,
      &job_args.private_bucket_client,
      &mut job_progress_reporter,
      "downloading synthesizer",
      job.id.0,
      &job_args.scoped_temp_dir_creator,
    ).await?;

    tts_synthesizer_fs_path
  };

  // ==================== Preprocess text ==================== //

  let cleaned_inference_text = clean_symbols(&job.raw_inference_text);

  // ==================== WRITE TEXT TO FILE ==================== //

  info!("Creating tempdir for inference results.");

  let temp_dir = format!("temp_tts_inference_{}", job.id.0);

  // NB: TempDir exists until it goes out of scope, at which point it should delete from filesystem.
  let temp_dir = TempDir::new(&temp_dir)
      .map_err(|e| ProcessSingleJobError::from_io_error(e))?;

  let text_input_fs_path = temp_dir.path().join("inference_input.txt");

  std::fs::write(&text_input_fs_path, &cleaned_inference_text)
      .map_err(|e| ProcessSingleJobError::from_io_error(e))?;

  // ==================== RUN INFERENCE ==================== //

  job_progress_reporter.log_status("running inference")
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  // TODO: Fix this.
  let maybe_unload_model_path = job_args
      .virtual_model_lfu
      .insert_returning_replaced(tts_synthesizer_fs_path.to_str().unwrap_or(""))
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  if let Some(model_path) = maybe_unload_model_path.as_deref() {
    warn!("Remove model from LFU cache: {:?}", model_path);
  }

  let output_audio_fs_path = temp_dir.path().join("output.wav");
  let output_metadata_fs_path = temp_dir.path().join("metadata.json");
  let output_spectrogram_fs_path = temp_dir.path().join("spectrogram.json");

  info!("Running TTS inference...");

  info!("Expected output audio filename: {:?}", &output_audio_fs_path);
  info!("Expected output spectrogram filename: {:?}", &output_spectrogram_fs_path);
  info!("Expected output metadata filename: {:?}", &output_metadata_fs_path);

  if let Some(model_path) = maybe_unload_model_path.as_deref() {
    warn!("Unload model from sidecar: {:?}", &model_path);
  }

  let mut pretrained_vocoder = VocoderType::HifiGanSuperResolution;
  if let Some(default_vocoder) = model_record.maybe_default_pretrained_vocoder.as_deref() {
    pretrained_vocoder = VocoderType::from_str(default_vocoder)
        .map_err(|e| ProcessSingleJobError::Other(e))?;
  }

  info!("With pretrained vocoder: {:?}", pretrained_vocoder);

  let text_pipeline_type_or_guess = model_record.text_pipeline_type
      .as_deref()
      .and_then(|pipeline_type|
          TextPipelineType::from_str(pipeline_type).ok())// NB: If there's an error deserializing, turn it to None.
      .unwrap_or_else(||
          guess_text_pipeline_heuristic(Some(model_record.created_at)));

  info!("With text pipeline type `{:?} ` (or guess: {:?})",
    &model_record.text_pipeline_type,
    &text_pipeline_type_or_guess);

  let hifigan_vocoder_model_fs_path_to_use = match custom_vocoder_fs_path {
    None => {
      info!("using pretrained HiFi-GAN vocoder");
      pretrained_hifigan_vocoder_model_fs_path
    },
    Some(custom_vocoder_fs_path) => {
      info!("using custom user-trained HiFi-GAN vocoder: {:?}", custom_vocoder_fs_path);
      custom_vocoder_fs_path
    },
  };

  // NB: Tacotron operates on decoder steps. 1000 steps is the default and correlates to
  //  roughly 12 seconds max. Here we map seconds to decoder steps.
  let max_decoder_steps = seconds_to_decoder_steps(job.max_duration_seconds);

  job_args.http_clients.tts_inference_sidecar_client.request_inference(
    &cleaned_inference_text,
    max_decoder_steps,
    &tts_synthesizer_fs_path,
    pretrained_vocoder,
    &text_pipeline_type_or_guess.to_str(),
    &hifigan_vocoder_model_fs_path_to_use,
    &hifigan_superres_vocoder_model_fs_path,
    &waveglow_vocoder_model_fs_path,
    &output_audio_fs_path,
    &output_spectrogram_fs_path,
    &output_metadata_fs_path,
    maybe_unload_model_path,
    model_record.use_default_mel_multiply_factor,
    model_record.maybe_custom_mel_multiply_factor,
  )
      .await
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  // ==================== CHECK ALL FILES EXIST AND GET METADATA ==================== //

  info!("Checking that output files exist...");

  check_file_exists(&output_audio_fs_path).map_err(|e| ProcessSingleJobError::Other(e))?;
  check_file_exists(&output_spectrogram_fs_path).map_err(|e| ProcessSingleJobError::Other(e))?;
  check_file_exists(&output_metadata_fs_path).map_err(|e| ProcessSingleJobError::Other(e))?;

  let file_metadata = read_metadata_file(&output_metadata_fs_path)
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  safe_delete_file(&output_metadata_fs_path);

  // ==================== UPLOAD AUDIO TO BUCKET ==================== //

  job_progress_reporter.log_status("uploading result")
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  let audio_result_object_path = job_args.bucket_path_unifier.tts_inference_wav_audio_output_path(
    &job.uuid_idempotency_token); // TODO: Don't use this!

  info!("Audio destination bucket path: {:?}", &audio_result_object_path);

  info!("Uploading audio...");

  job_args.public_bucket_client.upload_filename_with_content_type(
    &audio_result_object_path,
    &output_audio_fs_path,
    "audio/wav")
      .await
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  safe_delete_file(&output_audio_fs_path);

  // ==================== UPLOAD SPECTROGRAM TO BUCKETS ==================== //

  let spectrogram_result_object_path = job_args.bucket_path_unifier.tts_inference_spectrogram_output_path(
    &job.uuid_idempotency_token); // TODO: Don't use this!

  info!("Spectrogram destination bucket path: {:?}", &spectrogram_result_object_path);

  info!("Uploading spectrogram...");

  job_args.public_bucket_client.upload_filename_with_content_type(
    &spectrogram_result_object_path,
    &output_spectrogram_fs_path,
    "application/json")
      .await
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  safe_delete_file(&output_spectrogram_fs_path);

  // ==================== DELETE DOWNLOADED FILE ==================== //

  // NB: We should be using a tempdir, but to make absolutely certain we don't overflow the disk...
  safe_delete_directory(&temp_dir);

  // ==================== SAVE RECORDS ==================== //

  let text_hash = sha256_hash_string(&cleaned_inference_text)
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  let worker_name = job_args.get_worker_name();

  info!("Saving tts inference record...");

  let (id, inference_result_token) = insert_tts_result(
    &job_args.mysql_pool,
    JobType::TtsJob(&job),
    &text_hash,
    Some(pretrained_vocoder),
    &audio_result_object_path,
    &spectrogram_result_object_path,
    file_metadata.file_size_bytes,
    file_metadata.duration_millis.unwrap_or(0),
    job_args.worker_details.is_on_prem,
    &worker_name,
    job_args.worker_details.is_debug_worker)
      .await
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  info!("Marking job complete...");
  mark_tts_inference_job_done(
    &job_args.mysql_pool,
    job.id,
    true,
    Some(&inference_result_token),
    &worker_name)
      .await
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  info!("TTS Done. Original text was: {}", &job.raw_inference_text);

  job_args.firehose_publisher.tts_inference_finished(
    job.maybe_creator_user_token.as_deref(),
    &model_record.model_token,
    &inference_result_token)
      .await
      .map_err(|e| {
        error!("error publishing event: {:?}", e);
        ProcessSingleJobError::Other(anyhow!("error publishing event"))
      })?;

  job_progress_reporter.log_status("done")
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  info!("Job {:?} complete success! Downloaded, ran inference, and uploaded. Saved model record: {}, Result Token: {}",
        job.id, id, &inference_result_token);

  Ok(())
}

fn get_timestamp_millis() -> u64 {
  SystemTime::now()
      .duration_since(UNIX_EPOCH)
      .map(|d| d.as_millis() as u64)
      .unwrap_or(0)
}
