use std::fs::read_to_string;
use std::path::PathBuf;
use std::time::Duration;

use actix_web::dev::ResourcePath;
use anyhow::anyhow;
use log::{error, info, warn};

use bucket_paths::legacy::remote_file_manager_paths::weights_descriptor::WeightsSD15Descriptor;
use cloud_storage::remote_file_manager::remote_cloud_file_manager::RemoteCloudFileClient;
use enums::by_table::generic_inference_jobs::inference_result_type::InferenceResultType;
use enums::by_table::model_weights::weights_category::WeightsCategory;
use enums::by_table::model_weights::weights_types::WeightsType;
use filesys::file_exists::file_exists;
use filesys::path_to_string::path_to_string;
use google_drive_common::google_drive_download_command::GoogleDriveDownloadCommand;
use mysql_queries::queries::model_weights::create::create_weight::{
  create_weight,
  CreateModelWeightsArgs,
};
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::users::UserToken;

use crate::job::job_loop::job_success_result::{JobSuccessResult, ResultEntity};
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::image_generation::sd::process_job::{sd_args_from_job, StableDiffusionProcessArgs};
use crate::job::job_types::image_generation::sd::sd_inference_command::InferenceArgs;

pub async fn process_job_sd_upload(
  args: &StableDiffusionProcessArgs<'_>
) -> Result<JobSuccessResult, ProcessSingleJobError> {

  let job = args.job;
  let deps = args.job_dependencies;
  let mysql_pool = &deps.db.mysql_pool;

  let sd_args = sd_args_from_job(&args).await?;

  let sd_deps = match
  &args.job_dependencies.job.job_specific_dependencies.maybe_stable_diffusion_dependencies
  {
    None => {
      return Err(ProcessSingleJobError::Other(anyhow!("Missing Job Specific Dependencies")));
    }
    Some(val) => { val }
  };

  let creator_ip_address = &job.creator_ip_address;

  let creator_user_token = match &job.maybe_creator_user_token {
    Some(token) => UserToken::new_from_str(token),
    None => return Err(ProcessSingleJobError::InvalidJob(anyhow!("Missing Creator User Token"))),
  };

  // The parameters will be updated on another screen perhaps?
  // so right now it will fill with the availible  values.

  let work_temp_dir = format!("temp_stable_diffusion_inference_{}", job.id.0);
  let work_temp_dir = args.job_dependencies.fs.scoped_temp_dir_creator_for_work
      .new_tempdir(&work_temp_dir)
      .map_err(|e| ProcessSingleJobError::from_io_error(e))?;

  let sd_checkpoint_path = work_temp_dir.path().join("sd_checkpoint.safetensors");
  //let vae_path = work_temp_dir.path().join("vae.safetensors");
  let vae_path = work_temp_dir.path().join("vae.pt"); // TODO: Should this be `.safetensors` or `.pt`?
  let output_path = work_temp_dir.path().join("output");

  info!("Paths to download to:");
  info!("sd_checkpoint_path: {:?}", sd_checkpoint_path);
  info!("vae_path: {:?}", vae_path);
  info!("output_path: {:?}", output_path);

  let download_url = match sd_args.maybe_upload_path {
    Some(val) => { val }
    None => { "".to_string() }
  };

  if download_url.len() == 0 {
    return Err(
      ProcessSingleJobError::from_anyhow_error(anyhow!("Failed to Download URL Missing"))
    );
  }

  let file_name = "sd_checkpoint.safetensors";
  let download_script = easyenv::get_env_string_or_default(
    "DOWNLOAD_SCRIPT",
    "download_internet_file.py"
  );

  let google_drive_downloader = GoogleDriveDownloadCommand::new(&download_script,
                                                                None, None, None);

  info!("Downloading {}", download_url);

  let download_filename = match
  google_drive_downloader.download_file_with_file_name(
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
    return Err(ProcessSingleJobError::from_anyhow_error(anyhow!("Failed to Download SD Model from Google")));
  }

  info!("File Retrieved at {}", download_file_path.display());

  // download vae for model

  args.job_dependencies
      .buckets
      .public_bucket_client
      .download_file_to_disk(&sd_deps.vae_bucket_path, &vae_path)
      .await
      .map_err(|err| {
        error!("could not download VAE: {:?}", err);
        ProcessSingleJobError::from_anyhow_error(anyhow!("could not download VAE: {:?}", err))
      })?;

  info!("VAE downloaded to: {:?}", &vae_path);

//    // use this vae doesn't matter though
//    // VAE token for now
//    let vae_token = String::from("REPLACE_ME");
//    let model_weight_vae = ModelWeightToken(vae_token);
//    let vae_weight_record = get_weight_by_token(
//        &model_weight_vae,
//        false,
//        &deps.db.mysql_pool
//    ).await?;
//    let vae_weight_record = match vae_weight_record {
//        Some(val) => val,
//        None => {
//            return Err(
//                ProcessSingleJobError::from_anyhow_error(anyhow!("no VAE? thats a problem."))
//            );
//        }
//    };
//
//    let vae_details = RemoteCloudBucketDetails::new(
//        vae_weight_record.public_bucket_hash.clone(),
//        vae_weight_record.maybe_public_bucket_prefix.clone().unwrap_or_else(|| "".to_string()),
//        vae_weight_record.maybe_public_bucket_extension.clone().unwrap_or_else(|| "".to_string())
//    );
//
//    let remote_cloud_file_client = RemoteCloudFileClient::get_remote_cloud_file_client().await?;
//    remote_cloud_file_client.download_file(vae_details, path_to_string(vae_path.clone())).await?;

  let remote_cloud_file_client = RemoteCloudFileClient::get_remote_cloud_file_client().await?;

  let stderr_output_file = work_temp_dir.path().join("sd_err.txt");
  let stdout_output_file = work_temp_dir.path().join("sd_out.txt");

  // run inference on loRA downloaded
  let exit_status = sd_deps.inference_command.execute_inference(InferenceArgs {
    work_dir: work_temp_dir.path().to_path_buf(),
    output_file: output_path.clone(),
    stderr_output_file: &stderr_output_file,
    stdout_output_file: &stdout_output_file,
    prompt:String::from("This is a green sign that says go this is a test prompt to test the model."),
    negative_prompt: sd_args.maybe_n_prompt.clone().unwrap_or_default(),
    number_of_samples:20,
    samplers: sd_args.maybe_sampler.clone().unwrap_or(String::from("Euler a")),
    width: sd_args.maybe_width.unwrap_or(512),
    height: sd_args.maybe_height.unwrap_or(512),
    cfg_scale: sd_args.maybe_cfg_scale.unwrap_or(7),
    seed: sd_args.maybe_seed.unwrap_or(1),
    lora_path: PathBuf::from(""),
    checkpoint_path: sd_checkpoint_path.clone(),
    vae: vae_path.clone(),
    batch_count: sd_args.maybe_batch_count.unwrap_or(1),
  });

  if !exit_status.is_success() {
    error!("SD inference failed: {:?}", exit_status);

    let error = ProcessSingleJobError::Other(anyhow!("CommandExitStatus: {:?}", exit_status));

    if let Ok(contents) = read_to_string(&stderr_output_file) {
      warn!("Captured stderr output: {}", contents);

      //match categorize_error(&contents)  {
      //  Some(ProcessSingleJobError::FaceDetectionFailure) => {
      //    warn!("Face not detected in source image");
      //    error = ProcessSingleJobError::FaceDetectionFailure;
      //  }
      //  _ => {}
      //}
    }
    return Err(error);
  }

  // check if file exists if it does not error out....
  let path = output_path.clone();
  let file_path = format!("{}_{}.png", path_to_string(path), 0);

  if !file_exists(file_path.path()) {
    error!("Output file did not exist: {:?}", file_path);

    if let Ok(contents) = read_to_string(&stderr_output_file) {
      error!("Captured stderr output: {}", contents);
    }

    return Err(ProcessSingleJobError::from_anyhow_error(anyhow!("Failed to Upload Not a SD Model")));
  }

  // If it worked and didn't fail! then we should save and create the weight.
  // upload and create weights for loRA...
  let weights_sd_descriptor = Box::new(WeightsSD15Descriptor{});
  let metadata = remote_cloud_file_client.upload_file(weights_sd_descriptor,sd_checkpoint_path.to_str().unwrap_or_default()).await?;
  // chekc the model hash for duplicated models.
  let bucket_details = match metadata.bucket_details {
    Some(metadata) => metadata,
    None => {
      return Err(ProcessSingleJobError::from_anyhow_error(anyhow!("Failed to generate bucket details!")));
    }
  };

  let model_weight_token: &ModelWeightToken = &ModelWeightToken::generate();
  let model_weight_token_result = create_weight(CreateModelWeightsArgs {
    token: &model_weight_token,
    weights_type: WeightsType::StableDiffusion15,
    weights_category: WeightsCategory::ImageGeneration,
    title: sd_args.maybe_name.unwrap_or(String::from("")),
    maybe_cover_image_media_file_token: job.maybe_cover_image_media_file_token.clone(),
    maybe_description_markdown: sd_args.maybe_description,
    maybe_description_rendered_html: None,
    creator_user_token: Some(&creator_user_token),
    creator_ip_address,
    creator_set_visibility: Default::default(),
    maybe_last_update_user_token: None,
    original_download_url: Some(download_url),
    original_filename: None,
    file_size_bytes: metadata.file_size_bytes,
    file_checksum_sha2: metadata.sha256_checksum,
    public_bucket_hash: bucket_details.object_hash,
    maybe_public_bucket_prefix: Some(bucket_details.prefix),
    maybe_public_bucket_extension:Some(bucket_details.suffix),
    version: sd_args.maybe_version.unwrap_or(0),
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
