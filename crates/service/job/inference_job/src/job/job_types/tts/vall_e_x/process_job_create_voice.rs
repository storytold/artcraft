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
use enums::by_table::zs_voices::encoding_type::ZsVoiceEncodingType;
use enums::by_table::zs_voices::model_category::ZsVoiceModelCategory;
use enums::by_table::zs_voices::model_type::ZsVoiceModelType;
use enums::common::visibility::Visibility;
use mysql_queries::queries::voice_designer::datasets::get_dataset::get_dataset_by_token;
use mysql_queries::queries::voice_designer::datasets::get_dataset::ZsDataset;
use mysql_queries::queries::voice_designer::voice_samples::list_dataset_samples_for_dataset_token::DatasetSampleRecordForList;
use mysql_queries::queries::voice_designer::voice_samples::list_dataset_samples_for_dataset_token::list_dataset_samples_for_dataset_token;
use mysql_queries::queries::voice_designer::voices::create_voice::create_voice;
use mysql_queries::queries::voice_designer::voices::create_voice::CreateVoiceArgs;
use tokens::tokens::users::UserToken;

use crate::job;
use crate::job::job_loop::job_success_result::JobSuccessResult;
use crate::job::job_loop::job_success_result::ResultEntity;
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::tts::vall_e_x::process_job::VALLEXProcessJobArgs;

const BUCKET_FILE_PREFIX_CREATE: &str = "fakeyou_";
const BUCKET_FILE_EXTENSION_CREATE: &str = ".bin";
const MIME_TYPE_CREATE: &str = "application/x-binary";

/// We'll increment this if we change the underlying Vall-E code in an incompatible way.
const CURRENT_VALLE_MODEL_VERSION: u64 = 0;

pub async fn process_create_voice(
  args: VALLEXProcessJobArgs<'_>,
  dataset_token: String
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
  let mut job_progress_reporter = deps.clients.job_progress_reporter
      .new_generic_inference(job.inference_job_token.as_str())
      .map_err(|e| ProcessSingleJobError::Other(anyhow!(e)))?;

  info!("token! {}", dataset_token);
  let voice_dataset_token = tokens::tokens::zs_voice_datasets::ZsVoiceDatasetToken(dataset_token);

  let creator_ip_address = &job.creator_ip_address;

  let creator_user_token = match &job.maybe_creator_user_token {
    Some(token) => {
      UserToken::new_from_str(token)
    },
    None => {
      return Err(ProcessSingleJobError::InvalidJob(anyhow!("Missing Creator User Token")));
    }
  };

  // STEP 1. SETUP A TEMP DIRECTORY
  let work_temp_dir = format!("/tmp/temp_zeroshot_create_voice_{}", job.id.0);
  // NB: TempDir exists until it goes out of scope, at which point it should delete from filesystem.
  let work_temp_dir = args.job_dependencies.fs.scoped_temp_dir_creator_for_work
      .new_tempdir(&work_temp_dir)
      .map_err(|e| ProcessSingleJobError::from_io_error(e))?;

  let workdir = work_temp_dir.path().to_path_buf();

  // STEP 2. Get dataset for the title for the voice
  let voice_dataset = get_dataset_by_token(&voice_dataset_token, false, &mysql_pool).await;
  let single_dataset: ZsDataset;
  match voice_dataset {
    Ok(val) => {
      match val {
        Some(val) => {
          single_dataset = val;
        }
        None => {
          return Err(ProcessSingleJobError::InvalidJob(anyhow!("Missing Dataset")));
        }
      }
    }
    Err(e) => {
      return Err(ProcessSingleJobError::from_anyhow_error(e));
    }
  }
  info!("Title:{} Token:{}", &single_dataset.title, &single_dataset.token);

  // STEP 3. Download dataset each audio file
  let result = list_dataset_samples_for_dataset_token(
    &voice_dataset_token,
    false,
    &mysql_pool
  ).await;

  let dataset: Vec<DatasetSampleRecordForList> = match result {
    Ok(val) => val,
    Err(e) => return Err(ProcessSingleJobError::from_anyhow_error(e)),
  };

  info!("Dataset length info: {}", dataset.len());

//  let temp_extension = String::from(".bin");
//  let temp_prefix: String;
//
//  if !deps.job.info.container.is_on_prem {
//    temp_prefix = String::from("sample_"); // this is for seed in local dev to download the samples
//  } else {
//    temp_prefix = String::from(BUCKET_FILE_PREFIX_CREATE);
//  }

  let mut downloaded_dataset: Vec<PathBuf> = Vec::new();

  for (index, record) in dataset.iter().enumerate() {
    //https://storage.googleapis.com/dev-vocodes-public/media/5/3/3/w/8/533w8zs0fy11nv7gkcna7p7vt03h8nda/dev_zs_533w8zs0fy11nv7gkcna7p7vt03h8nda.bin <-- where the file actually is

    let prefix: Option<&str> = record.maybe_public_bucket_prefix.as_ref().map(|s| s.as_str());
    let extension: Option<&str> = record.maybe_public_bucket_extension.as_ref().map(|s| s.as_str());

    info!("Record=> hash:{} prefix:{:?} extension:{:?}",
      record.public_bucket_directory_hash,
      prefix,
      extension
    );

    let audio_media_file = MediaFileBucketPath::from_object_hash(
      &record.public_bucket_directory_hash,
      prefix,
      extension
    );

    info!("Download using audio_media_file_path: {:?}", audio_media_file.to_full_object_pathbuf());

    let file_name_wav = format!("{}.wav", index);

    let mut file_path = PathBuf::new();
    file_path.push(workdir.clone());
    file_path.push(file_path.clone());
    file_path.push(file_name_wav);

    info!("Downloading to path: {:?}", file_path);

    // TODO: we might want to catch the error and not include the pathes into download dataset?
    let result = deps.buckets.public_bucket_client.download_file_to_disk(
      audio_media_file.to_full_object_pathbuf(),
      &file_path
    ).await;

    if let Err(err) = result {
      error!("could not download sample: {:?}", err);
      return Err(ProcessSingleJobError::from_anyhow_error(err));
    }

    info!("FilePath to clone voice: {}", file_path.to_string_lossy());
    downloaded_dataset.push(file_path.clone());
  }

  info!("Dataset Length {}", downloaded_dataset.len());

  // STEP 4 Download the models
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

  job_progress_reporter
      .log_status("running inference")
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  // Command line arg for a list of paths to insert the container
  let audio_files = join_paths(downloaded_dataset);

  info!("Files to process: {:?}", audio_files);

  // Name of the output file
  // NB: don't use the extension... for the inference since the container will add the extension.
  let output_file_name = PathBuf::from("temp");

  let stderr_output_file = work_temp_dir.path().join("zero_shot_create_voice_err.txt");

  let inference_start_time = Instant::now();

  // Run Inference
  let command_exit_status =
      model_dependencies.create_embedding_command.execute_inference(
        job::job_types::tts::vall_e_x::vall_e_x_inference_command::CreateVoiceInferenceArgs {
          output_embedding_path: &workdir,
          output_embedding_name: &output_file_name,
          audio_files,
          stderr_output_file: &stderr_output_file,
        }
      );

  let inference_duration = Instant::now().duration_since(inference_start_time);

  if !command_exit_status.is_success() {
    error!("Create Embedding Failed: {:?}", command_exit_status);

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

  info!("Inference success!");

  //info!("Success; waiting...");
  //thread::sleep(Duration::from_secs(300));


  // STEP 4. Download dataset each audio file
  info!("Uploading Media ...");

  let embedding_bucket_location = ZeroShotVoiceEmbeddingBucketPath::generate_new(
    ModelCategory::Tts,
    ModelType::VallEx,
    CURRENT_VALLE_MODEL_VERSION
  );

  let embedding_bucket_object_pathbuf = embedding_bucket_location.to_full_object_pathbuf();

  // Get Finished File
  let mut finished_file = work_temp_dir.path().to_path_buf();

  let output_bucket_file_name = String::from("temp.npz"); // use extension for bucket upload.
  finished_file.push(&output_bucket_file_name);

  info!("Upload File Path: {:?}", finished_file);
  info!("Upload Bucket Path: {:?}", embedding_bucket_object_pathbuf);

  args.job_dependencies.buckets.private_bucket_client
      .upload_filename_with_content_type(
        &embedding_bucket_object_pathbuf,
        &finished_file,
        &MIME_TYPE_CREATE
      )
      .await // TODO: We should check the mimetype to make sure bad payloads can't get uploaded
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  // CLEARIFY! these items
  // 1.Should this be object hash?
  // 2.As well as this what should the voice name be?
  let voice_name = single_dataset.title;

  // insert record
  let voice_token = create_voice(CreateVoiceArgs {
    dataset_token: &voice_dataset_token,
    model_category: ZsVoiceModelCategory::Tts,
    model_type: ZsVoiceModelType::VallEX,
    model_version: CURRENT_VALLE_MODEL_VERSION,
    model_encoding_type: ZsVoiceEncodingType::Encodec,
    voice_title: &voice_name,
    bucket_hash: embedding_bucket_location.get_object_hash(),
    maybe_creator_user_token: Some(&creator_user_token),
    creator_ip_address: &creator_ip_address,
    creator_set_visibility: Visibility::Public,
    mysql_pool,
  }).await
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  Ok(JobSuccessResult {
    maybe_result_entity: Some(ResultEntity {
      entity_type: InferenceResultType::ZeroShotVoiceEmbedding,
      entity_token: voice_token.to_string(),
    }),
    inference_duration,
  })
}

pub struct AudioFile {
  pub filesystem_path: PathBuf,
}

pub async fn download_audio_from_hash(
  bucket_hash: &str,
  name: &str,
  private_bucket_client: &BucketClient,
  path: &PathBuf
) -> Result<AudioFile, ProcessSingleJobError> {
  let unifer = BucketPathUnifier::default_paths();
  let object_path = unifer.zero_shot_tts_speaker_encoding(bucket_hash, 0);

  let mut path = path.clone();

  let file_name = format!("{}", name);
  path.push(&file_name);

  private_bucket_client.download_file_to_disk(object_path, &path)
      .await
      .map_err(|err| {
        error!("Could not download audio file: {err}");
        ProcessSingleJobError::from_anyhow_error(anyhow!("Could not download audio file: {err}"))
      })?;

  let audio_file = AudioFile {
    filesystem_path: PathBuf::from(&path.clone()),
  };

  Ok(audio_file)
}

fn join_paths(paths: Vec<PathBuf>) -> String {
  paths
      .into_iter()
      .map(|p| format!("\"{}\"", p.display()))
      .collect::<Vec<String>>()
      .join(" ")
}

#[cfg(test)]
mod tests {
  use std::path::PathBuf;

  use crate::job::job_types::tts::vall_e_x::process_job_create_voice::join_paths;

  #[test]
  fn test_path_build() {
    let paths = vec![
      PathBuf::from("/home/tensor/code/TTSDockerContainer/Vall-E-mount/input/20.wav"),
      PathBuf::from("/home/tensor/code/TTSDockerContainer/Vall-E-mount/input/21.wav")
    ];

    let value = join_paths(paths);
    let expected =
        "\"/home/tensor/code/TTSDockerContainer/Vall-E-mount/input/20.wav\" \"/home/tensor/code/TTSDockerContainer/Vall-E-mount/input/21.wav\"";
    assert_eq!(value, expected);
  }
}
