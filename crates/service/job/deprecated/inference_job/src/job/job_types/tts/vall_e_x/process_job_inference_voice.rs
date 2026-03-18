use std::fs::read_to_string;
use std::path::PathBuf;
use std::time::Instant;

use anyhow::anyhow;
use log::{error, info, warn};

use bucket_paths::legacy::typified_paths::private::zs_voices::bucket_directory::{ModelCategory, ModelType};
use bucket_paths::legacy::typified_paths::private::zs_voices::bucket_file_path::ZeroShotVoiceEmbeddingBucketPath;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use cloud_storage::bucket_client::BucketClient;
use bucket_paths::legacy::old_bespoke_paths::bucket_path_unifier::BucketPathUnifier;
use enums::by_table::generic_inference_jobs::inference_result_type::InferenceResultType;
use enums::by_table::media_files::media_file_origin_model_type::MediaFileOriginModelType;
use filesys::file_size::file_size;
use hashing::sha256::sha256_hash_file::sha256_hash_file;
use mysql_queries::queries::media_files::create::specialized_insert::insert_media_file_from_zero_shot_tts::insert_media_file_from_zero_shot;
use mysql_queries::queries::media_files::create::specialized_insert::insert_media_file_from_zero_shot_tts::InsertArgs;
use mysql_queries::queries::voice_designer::voices::get_voice::{get_voice_by_token, ZsVoice};

use crate::job::job_loop::job_success_result::JobSuccessResult;
use crate::job::job_loop::job_success_result::ResultEntity;
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::tts::vall_e_x::process_job::VALLEXProcessJobArgs;
use crate::job::job_types::tts::vall_e_x::vall_e_x_inference_command::InferenceArgs;

const BUCKET_FILE_PREFIX: &str = "fakeyou_";
const BUCKET_FILE_EXTENSION: &str = ".wav";
const MIME_TYPE: &str = "audio/wav";


pub async fn process_inference_voice(
  args: VALLEXProcessJobArgs<'_>,
  voice_token: String
) -> Result<JobSuccessResult, ProcessSingleJobError> {
  let deps = args.job_dependencies;
  let job = args.job;
  let mysql_pool = &deps.db.mysql_pool;

  let model_dependencies = deps
      .job
      .job_specific_dependencies
      .maybe_vall_e_x_dependencies
      .as_ref()
      .ok_or_else(|| ProcessSingleJobError::JobSystemMisconfiguration(Some("missing VALL-E-X dependencies".to_string())))?;

  // get some globals
  let mut job_progress_reporter = deps
      .clients
      .job_progress_reporter
      .new_generic_inference(job.inference_job_token.as_str())
      .map_err(|e| ProcessSingleJobError::Other(anyhow!(e)))?;

  // get job args
  let text = match job.maybe_raw_inference_text.clone() {
    Some(value) => { value }
    None => {
      return Err(ProcessSingleJobError::InvalidJob(anyhow!("Missing Text for Inference")));
    }
  };

  let voice_token = tokens::tokens::zs_voices::ZsVoiceToken(voice_token);

  // Get voice bucket hash - from voice token
  let voice_lookup_result = get_voice_by_token(&voice_token, false, &mysql_pool).await;

  let voice = match voice_lookup_result {
    Ok(Some(voice)) => voice,
    Ok(None) => {
      warn!("Voice not found: {:?}", voice_token);
      return Err(ProcessSingleJobError::Other(anyhow!("Voice not found: {:?}", voice_token)));
    }
    Err(err) => {
      warn!("Error looking up voice: {:?}", err);
      return Err(ProcessSingleJobError::Other(anyhow!("Error looking up voice: {:?}", err)));
    }
  };

  // Need to download the models
  info!("Download models (if not present)...");

  for downloader in model_dependencies.downloaders.all_downloaders() {
    let result = downloader.download_if_not_on_filesystem(
      &args.job_dependencies.buckets.private_bucket_client,
      &args.job_dependencies.fs.scoped_temp_dir_creator_for_short_lived_downloads
    ).await;

    if let Err(err) = result {
      error!("could not download: {:?}", err);
      return Err(err);
    }
  }

  // Might not need this for inference.
  // let creator_user_token:UserToken;
  // match &job.maybe_creator_user_token {
  //     Some(token) => {
  //         creator_user_token = UserToken::new_from_str(token);
  //     },
  //     None => {
  //         return Err(ProcessSingleJobError::InvalidJob(anyhow!("Missing Creator User Token")));
  //     }
  // }

  // run inference
  let work_temp_dir = format!("/tmp/temp_zeroshot_inference_{}", job.id.0);

  // NB: TempDir exists until it goes out of scope, at which point it should delete from filesystem.
  let work_temp_dir = args.job_dependencies.fs.scoped_temp_dir_creator_for_work
      .new_tempdir(&work_temp_dir)
      .map_err(|e| ProcessSingleJobError::from_io_error(e))?;

  let workdir = work_temp_dir.path().to_path_buf();
  let filename = "weights.npz".to_string();

  let mut downloaded_weights_path = work_temp_dir.path().to_path_buf();
  downloaded_weights_path.push(&filename);

  let voice_file = download_voice_embedding(
    &voice,
    &deps.buckets.private_bucket_client,
    &downloaded_weights_path
  ).await?;

  println!("voice file path! {}", voice_file.filesystem_path.to_string_lossy());

  // Download embeddings file using embedding token
  // Create a temp dir to download things to
  job_progress_reporter
      .log_status("running inference")
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  let inference_start_time = Instant::now();

  let output_file_name = String::from("output.wav");

  let stderr_output_file = work_temp_dir.path().join("zero_shot_inference.txt");

  // Run Inference
  let command_exit_status =
      model_dependencies.inference_command.execute_inference(
        InferenceArgs {
          input_embedding_path: &workdir,
          input_embedding_name: filename,
          input_text: String::from(text), // text
          output_file_name: output_file_name.clone(), // output file name in the output folder
          stderr_output_file: &stderr_output_file,
        }
      );

  let inference_duration = Instant::now().duration_since(inference_start_time);

  if !command_exit_status.is_success() {
    error!("Zero shot TTS failed: {:?}", command_exit_status);

    let error = ProcessSingleJobError::Other(anyhow!("CommandExitStatus: {:?}", command_exit_status));

    if let Ok(contents) = read_to_string(&stderr_output_file) {
      warn!("Captured stderr output: {}", contents);

      // Re-categorize error?
      //match categorize_error(&contents)  {
      //    Some(ProcessSingleJobError::FaceDetectionFailure) => {
      //        warn!("Face not detected in source image");
      //        error = ProcessSingleJobError::FaceDetectionFailure;
      //    }
      //    _ => {}
      //}
    }

    //thread::sleep(Duration::from_secs(300));

    // Clean up temp files
    //safe_delete_file(&audio_path.filesystem_path);
    //safe_delete_file(&image_path.filesystem_path);
    //safe_delete_file(&usable_image_path);
    //safe_delete_file(&output_video_fs_path);
    //safe_delete_file(&stderr_output_file);
    //safe_delete_directory(&work_temp_dir);

    return Err(error);
  }

  // upload audio to bucket
  info!("Uploading media ...");

  let result_bucket_location = MediaFileBucketPath::generate_new(
    Some(BUCKET_FILE_PREFIX),
    Some(BUCKET_FILE_EXTENSION)
  );

  let result_bucket_object_pathbuf = result_bucket_location.to_full_object_pathbuf();

  // Finished file path
  let mut finished_file = work_temp_dir.path().to_path_buf();
  finished_file.push(&output_file_name);

  info!("Upload Bucket Path: {:?}", result_bucket_object_pathbuf);
  info!("Upload File Path: {:?}", finished_file);

  args.job_dependencies.buckets.public_bucket_client
      .upload_filename_with_content_type(
        &result_bucket_object_pathbuf,
        &finished_file,
        &MIME_TYPE
      )
      .await
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  // ==================== UPLOAD AUDIO TO BUCKET ====================

  info!("Calculating sha256...");

  let file_checksum = sha256_hash_file(&finished_file).map_err(|err| {
    ProcessSingleJobError::Other(anyhow!("Error hashing file: {:?}", err))
  })?;

  let file_size_bytes = file_size(&finished_file).map_err(|err|
      ProcessSingleJobError::Other(err)
  )?;

  job_progress_reporter.log_status("done").map_err(|e| ProcessSingleJobError::Other(e))?;

  // insert into db the record
  let (media_file_token, id) = insert_media_file_from_zero_shot(InsertArgs {
    pool: &args.job_dependencies.db.mysql_pool,
    job: &job,
    origin_model_type: MediaFileOriginModelType::VallEX,
    maybe_mime_type: Some(&MIME_TYPE),
    file_size_bytes,
    sha256_checksum: &file_checksum,
    public_bucket_directory_hash: result_bucket_location.get_object_hash(),
    maybe_public_bucket_prefix: Some(BUCKET_FILE_PREFIX),
    maybe_public_bucket_extension: Some(BUCKET_FILE_EXTENSION),
    is_on_prem: args.job_dependencies.job.info.container.is_on_prem,
    worker_hostname: &args.job_dependencies.job.info.container.hostname,
    worker_cluster: &args.job_dependencies.job.info.container.cluster_name,
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

pub struct VoiceFile {
  pub filesystem_path: PathBuf,
}

pub async fn download_voice_embedding_from_hash(
  bucket_hash: &str,
  name: &str,
  private_bucket_client: &BucketClient,
  path: &PathBuf
) -> Result<VoiceFile, ProcessSingleJobError> {
  let unifer = BucketPathUnifier::default_paths();
  let object_path = unifer.zero_shot_tts_speaker_encoding(bucket_hash, 0);

  let mut path = path.clone();

  let file_name = format!("{}", name);
  path.push(&file_name);

  private_bucket_client.download_file_to_disk(object_path, &path)
      .await
      .map_err(|err| {
        error!("Could not download embedding file: {err}");
        ProcessSingleJobError::from_anyhow_error(anyhow!("Could not download embedding file: {err}"))
      })?;

  let voice_file = VoiceFile {
    filesystem_path: PathBuf::from(&path.clone()),
  };

  Ok(voice_file)
}

pub async fn download_voice_embedding(
  voice: &ZsVoice,
  private_bucket_client: &BucketClient,
  download_path: &PathBuf,
) -> Result<VoiceFile, ProcessSingleJobError> {

  let embedding_bucket_location = ZeroShotVoiceEmbeddingBucketPath::from_object_hash(
    &voice.bucket_hash,
    ModelCategory::Tts,
    ModelType::VallEx,
    voice.model_version
  );

  info!("Downloading embedding from: {:?}", &embedding_bucket_location.to_full_object_pathbuf());
  info!("Downloading to filesystem location: {:?}", download_path);

  let result = private_bucket_client.download_file_to_disk(
    embedding_bucket_location.to_full_object_pathbuf(),
    &download_path
  ).await;

  if let Err(err) = result {
    error!("could not download embedding file: {:?}", err);
    return Err(ProcessSingleJobError::from_anyhow_error(err));
  }

  let voice_file = VoiceFile {
    filesystem_path: PathBuf::from(&download_path.clone()),
  };

  Ok(voice_file)
}

