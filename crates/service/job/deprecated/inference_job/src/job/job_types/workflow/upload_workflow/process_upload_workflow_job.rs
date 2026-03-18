use std::time::Duration;

use anyhow::{anyhow, Result};
use log::info;

use bucket_paths::legacy::remote_file_manager_paths::weights_descriptor::WeightsWorkflowDescriptor;
use cloud_storage::remote_file_manager::remote_cloud_file_manager::RemoteCloudFileClient;
use enums::by_table::generic_inference_jobs::inference_result_type::InferenceResultType;
use enums::by_table::model_weights::weights_category::WeightsCategory;
use enums::by_table::model_weights::weights_types::WeightsType;
use enums::common::visibility::Visibility;
use filesys::file_exists::file_exists;
use google_drive_common::google_drive_download_command::GoogleDriveDownloadCommand;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use mysql_queries::queries::model_weights::create::create_weight;
use mysql_queries::queries::model_weights::create::create_weight::CreateModelWeightsArgs;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::users::UserToken;

use crate::job::job_loop::job_success_result::{JobSuccessResult, ResultEntity};
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::workflow::video_style_transfer::extract_vst_workflow_payload_from_job::extract_vst_workflow_payload_from_job;
use crate::state::job_dependencies::JobDependencies;

#[deprecated(note = "bt(2024-09-02): this looks like a way for users to upload garbage to the website and looks as if we no longer use it anymore")]
pub async fn process_upload_workflow_job(deps: &JobDependencies, job: &AvailableInferenceJob) -> Result<JobSuccessResult, ProcessSingleJobError>{
   let mysql_pool = &deps.db.mysql_pool;

    let wf_args = extract_vst_workflow_payload_from_job(&job)?;

    let title = match wf_args.maybe_title {
        Some(val) => {
            val
        },
        None => { "".to_string() }
    };

    let description = match wf_args.maybe_description {
        Some(val) => {
            val
        },
        None => { "".to_string() }
    };

    let commit_hash = match wf_args.maybe_commit_hash {
        Some(val) => {
            val
        },
        None => { "".to_string() }
    };

    let visibility = match wf_args.creator_visibility {
        Some(val) => {
            val
        },
        None => { Visibility::Public }
    };
  

    let file_name = "workflow.json";

    let download_script = easyenv::get_env_string_or_default(
        "DOWNLOAD_SCRIPT",
        "download_internet_file.py"
    );

    let creator_ip_address = &job.creator_ip_address;

    let creator_user_token = match &job.maybe_creator_user_token {
      Some(token) => UserToken::new_from_str(token),
      None => return Err(ProcessSingleJobError::InvalidJob(anyhow!("Missing Creator User Token"))),
    };
    
    let download_url = match wf_args.maybe_google_drive_link {
        Some(val) => val,
        None => "".to_string() 
    };

    if download_url.len() == 0 {
        return Err(ProcessSingleJobError::InvalidJob(anyhow!("Download URL Too Short")));
    }

    let google_drive_downloader = GoogleDriveDownloadCommand::new(
      &download_script, None, None, None);

    info!("Downloading {}", download_url);

    let work_temp_dir = format!("workflow_upload_{}", job.id.0);
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
        return Err(ProcessSingleJobError::from_anyhow_error(anyhow!("Failed to Download Work Flow  from Google")));
    }

    info!("File Retrieved at {}", download_file_path.display());

    let remote_cloud_file_client = RemoteCloudFileClient::get_remote_cloud_file_client().await?;
                                                   
    let weights_sd_descriptor = Box::new(WeightsWorkflowDescriptor{});
    let metadata = remote_cloud_file_client.upload_file(weights_sd_descriptor,download_file_path.to_str().unwrap_or_default()).await?;
    // chekc the model hash for duplicated models.
    let bucket_details = match metadata.bucket_details {
        Some(metadata) => metadata,
        None => {
        return Err(ProcessSingleJobError::from_anyhow_error(anyhow!("Failed to generate bucket details!")));
        }
    };
    
    let model_weight_token: &ModelWeightToken = &ModelWeightToken::generate();
    
    let model_weight_token_result = create_weight::create_weight(CreateModelWeightsArgs {
        token: &model_weight_token,
        weights_type: WeightsType::ComfyUi,
        weights_category: WeightsCategory::WorkflowConfig,
        title,
        maybe_cover_image_media_file_token: job.maybe_cover_image_media_file_token.clone(),
        maybe_description_markdown: Some(description),
        maybe_description_rendered_html: None,
        creator_user_token: Some(&creator_user_token),
        creator_ip_address,
        creator_set_visibility:visibility,
        maybe_last_update_user_token: None,
        original_download_url: Some(download_url),
        original_filename: None,
        file_size_bytes: metadata.file_size_bytes,
        file_checksum_sha2: commit_hash,
        public_bucket_hash: bucket_details.object_hash,
        maybe_public_bucket_prefix: Some(bucket_details.prefix),
        maybe_public_bucket_extension:Some(bucket_details.suffix),
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
