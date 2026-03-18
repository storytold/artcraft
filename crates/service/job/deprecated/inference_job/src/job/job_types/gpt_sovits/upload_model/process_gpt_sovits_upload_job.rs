use std::time::Duration;

use anyhow::{anyhow, Result};
use log::{info, warn};

use bucket_paths::legacy::typified_paths::public::weight_files::bucket_directory::WeightFileBucketDirectory;
use bucket_paths::legacy::typified_paths::public::weight_files::bucket_file_path::WeightFileBucketPath;
use enums::by_table::generic_inference_jobs::inference_result_type::InferenceResultType;
use enums::by_table::model_weights::weights_category::WeightsCategory;
use enums::by_table::model_weights::weights_types::WeightsType;
use enums::common::visibility::Visibility;
use filesys::file_exists::file_exists;
use filesys::file_read_bytes::file_read_bytes;
use filesys::file_size::file_size;
use google_drive_common::google_drive_download_command::GoogleDriveDownloadCommand;
use hashing::sha256::sha256_hash_file::sha256_hash_file;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use mysql_queries::queries::model_weights::create::create_weight;
use mysql_queries::queries::model_weights::create::create_weight::CreateModelWeightsArgs;
use tokens::tokens::model_weights::ModelWeightToken;

use crate::job::job_loop::job_success_result::{JobSuccessResult, ResultEntity};
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::gpt_sovits::upload_model::extract_and_upload_gpt_sovits_package::extract_and_upload_gpt_sovits_package_files;
use crate::job::job_types::gpt_sovits::upload_model::extract_gpt_sovits_payload_from_job::extract_gpt_sovits_payload_from_job;
use crate::state::job_dependencies::JobDependencies;

pub async fn process_gpt_sovits_upload_job(deps: &JobDependencies, job: &AvailableInferenceJob) -> Result<JobSuccessResult, ProcessSingleJobError>{
  let mysql_pool = &deps.db.mysql_pool;

  let bucket_client = &deps.buckets.public_bucket_client;

  let upload_args = extract_gpt_sovits_payload_from_job(&job)?;

  let title = upload_args.maybe_title
      .unwrap_or_else(|| "untitled model".to_string());

  let description = upload_args.maybe_description
      .unwrap_or_else(|| "".to_string());

  let visibility = upload_args.creator_visibility
      .unwrap_or(Visibility::Public);

  let file_name = "model.zip";

  let download_script = easyenv::get_env_string_or_default(
    "DOWNLOAD_SCRIPT",
    "download_internet_file.py"
  );

  let creator_ip_address = &job.creator_ip_address;

  let creator_user_token = job.maybe_creator_user_token_typed
      .as_ref()
      .ok_or_else(|| ProcessSingleJobError::InvalidJob(anyhow!("Missing Creator User Token")))?;

  let download_url = job.maybe_download_url
      .as_deref()
      .ok_or_else(|| ProcessSingleJobError::InvalidJob(anyhow!("Missing Download URL")))?;

  if download_url.len() == 0 {
    return Err(ProcessSingleJobError::InvalidJob(anyhow!("Download URL Too Short")));
  }

  let google_drive_downloader = GoogleDriveDownloadCommand::new(
    &download_script, None, None, None);

  info!("Downloading {}", download_url);

  let work_temp_dir = format!("gpt_sovits_upload_{}", job.id.0);
  let work_temp_dir = deps.fs.scoped_temp_dir_creator_for_work
    .new_tempdir(&work_temp_dir)
    .map_err(|e| ProcessSingleJobError::from_io_error(e))?;

  let download_filename = match google_drive_downloader.download_file_with_file_name(
    &download_url,
    &work_temp_dir,
    file_name
  ).await
  {
    Ok(filename) => filename,
    Err(_e) => return Err(ProcessSingleJobError::from_anyhow_error(anyhow!("Failed to Download"))),
  };

  let download_file_path = work_temp_dir.path().join(download_filename);

  if file_exists(download_file_path.as_path()) == false {
    return Err(ProcessSingleJobError::from_anyhow_error(anyhow!("Failed to Download")));
  }

  info!("File Retrieved at {}", download_file_path.display());

  const PREFIX: Option<&str> = Some("weight_");

  let mut file_bytes = Vec::new();
  file_bytes = file_read_bytes(&download_file_path)
    .map_err(|e| ProcessSingleJobError::from_anyhow_error(anyhow!("Processing archive failed")))?;

  let model_weight_token: &ModelWeightToken = &ModelWeightToken::generate();
  let weight_file_bucket_directory = WeightFileBucketDirectory::from_object_hash(model_weight_token.entropy_suffix());

  // TODO(KS, 22-07-2023): We should decide if these details are worth persisting anywhere
  let _ = extract_and_upload_gpt_sovits_package_files(&file_bytes, bucket_client, &weight_file_bucket_directory)
    .await.map_err(|easyenv| {
    warn!("Failed to extract and verify GPT-SoViTS package: {:?}", easyenv);
    ProcessSingleJobError::from_anyhow_error(anyhow!("Failed to extract and verify GPT-SoViTS package"))
  })?;

  let bucket_public_upload_path = WeightFileBucketPath::from_object_hash(
    weight_file_bucket_directory.get_object_hash(),
    Some("weight_"),
    Some(".zip"),
  );

  bucket_client.upload_filename(
    &bucket_public_upload_path.to_full_object_pathbuf(),&download_file_path)
    .await
    .map_err(|e| ProcessSingleJobError::from_anyhow_error(anyhow!("Failed to upload file")))?;

  let file_size_bytes = file_size(&download_file_path)
    .map_err(|e| ProcessSingleJobError::from_anyhow_error(anyhow!("Failed to get file size")))?;

  let file_checksum = sha256_hash_file(&download_file_path)
    .map_err(|e| ProcessSingleJobError::from_anyhow_error(anyhow!("Failed to process archive checksum")))?;

  let model_weight_token_result = create_weight::create_weight(CreateModelWeightsArgs {
    token: &model_weight_token,
    weights_type: WeightsType::GptSoVits,
    weights_category: WeightsCategory::TextToSpeech,
    title,
    maybe_cover_image_media_file_token: job.maybe_cover_image_media_file_token.clone(),
    maybe_description_markdown: Some(description),
    maybe_description_rendered_html: None,
    creator_user_token: Some(creator_user_token),
    creator_ip_address,
    creator_set_visibility: visibility,
    maybe_last_update_user_token: None,
    original_download_url: Some(download_url.to_string()),
    original_filename: None,
    file_size_bytes,
    file_checksum_sha2: file_checksum,
    public_bucket_hash: bucket_public_upload_path.get_object_hash().to_string(),
    maybe_public_bucket_prefix: Some(PREFIX.unwrap().to_string()),
    maybe_public_bucket_extension: Some(".zip".to_string()),
    version: 0,
    mysql_pool,
  }).await?;

  Ok(JobSuccessResult {
    maybe_result_entity: Some(ResultEntity {
      entity_type: InferenceResultType::UploadModel,
      entity_token: model_weight_token_result.to_string(),
    }),
    inference_duration: Duration::from_secs(0),
  })
}
