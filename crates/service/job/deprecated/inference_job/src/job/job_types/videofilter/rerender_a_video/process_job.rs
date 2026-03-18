use std::fs::read_to_string;
use std::time::Instant;

use anyhow::{anyhow, Error};
use log::{error, info, warn};
use serde::{Deserialize, Serialize};

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::generic_inference_jobs::inference_result_type::InferenceResultType;
use filesys::check_file_exists::check_file_exists;
use filesys::file_size::file_size;
use filesys::file_deletion::safe_delete_directory::safe_delete_directory;
use filesys::file_deletion::safe_delete_file::safe_delete_file;
use hashing::sha256::sha256_hash_file::sha256_hash_file;
use mimetypes::mimetype_for_file::get_mimetype_for_file;
use mysql_queries::payloads::generic_inference_args::generic_inference_args::PolymorphicInferenceArgs::Rr;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use mysql_queries::queries::media_files::create::specialized_insert::insert_media_file_from_rerender::{insert_media_file_from_rerender, InsertArgs};
use mysql_queries::queries::model_weights::get::get_weight::get_weight_by_token;

use crate::job::job_loop::job_success_result::{JobSuccessResult, ResultEntity};
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::videofilter::rerender_a_video::download_model_file::download_model_file;
use crate::job::job_types::videofilter::rerender_a_video::download_video_file::download_video_file;
use crate::job::job_types::videofilter::rerender_a_video::rerender_inference_command::InferenceArgs;
use crate::job::job_types::videofilter::rerender_a_video::validate_job::validate_job;
use crate::state::job_dependencies::JobDependencies;

/// The maximum that either width or height can be
const MAX_DIMENSION : u32 = 1500;

const BUCKET_FILE_PREFIX: &str = "fakeyou_";
const BUCKET_FILE_EXTENSION: &str = ".mp4";

pub struct RerenderProcessJobArgs<'a> {
    pub job_dependencies: &'a JobDependencies,
    pub job: &'a AvailableInferenceJob,
}

pub async fn process_job(args: RerenderProcessJobArgs<'_>) -> Result<JobSuccessResult, ProcessSingleJobError> {
    let job = args.job;
    let deps = args.job_dependencies;

    let mut job_progress_reporter = args.job_dependencies
        .clients
        .job_progress_reporter
        .new_generic_inference(job.inference_job_token.as_str())
        .map_err(|e| ProcessSingleJobError::Other(anyhow!(e)))?;

    let model_dependencies = args
        .job_dependencies
        .job
        .job_specific_dependencies
        .maybe_rerender_dependencies
        .as_ref()
        .ok_or_else(|| ProcessSingleJobError::JobSystemMisconfiguration(Some("missing Rerender dependencies".to_string())))?;

    // ==================== UNPACK + VALIDATE INFERENCE ARGS ==================== //

    let job_args = validate_job(job)?;

    // ==================== TEMP DIR ==================== //

    let work_temp_dir = format!("temp_rerender_inference_{}", job.id.0);

    // NB: TempDir exists until it goes out of scope, at which point it should delete from filesystem.
    let work_temp_dir = args.job_dependencies
        .fs
        .scoped_temp_dir_creator_for_work
        .new_tempdir(&work_temp_dir)
        .map_err(|e| ProcessSingleJobError::from_io_error(e))?;


    // ==================== QUERY AND DOWNLOAD FILES ==================== //

    let video_path = download_video_file(
        &job_args.video_source,
        &args.job_dependencies.buckets.public_bucket_client,
        &mut job_progress_reporter,
        job,
        &args.job_dependencies.fs.scoped_temp_dir_creator_for_work,
        &work_temp_dir,
        &deps.db.mysql_pool
    ).await?;

    info!("Downloaded video file: {:?}", video_path.filesystem_path);

    // ==================== TRANSCODE MEDIA (IF NECESSARY) ==================== //

    let usable_video_path = video_path.filesystem_path.clone();

    //TODO: re encode with ffmpeg

    info!("Used video file: {:?}", usable_video_path);

    // ==================== SETUP FOR INFERENCE ==================== //

    info!("Ready for Rerender A Video inference...");

    job_progress_reporter.log_status("running inference")
        .map_err(|e| ProcessSingleJobError::Other(e))?;

    let output_video_fs_path = work_temp_dir.path().join("blend.mp4");

    info!("Running Rerender A Video inference...");

    info!("Expected output video filename: {:?}", &output_video_fs_path);

    // TODO: Limit output length for non-premium (???)

    let maybe_args = job.maybe_inference_args
        .as_ref()
        .map(|args| args.args.as_ref())
        .flatten();

    let poly_args = match maybe_args {
        None => return Err(ProcessSingleJobError::Other(anyhow!("Rerender args not found"))),
        Some(args) => args,
    };

    let rr_args = match poly_args {
        Rr(args) => args,
        _ => return Err(ProcessSingleJobError::Other(anyhow!("Rerender args not found"))),
    };


    // =================== LOAD MODELS AND LORAS ==================== //

    let sd_model_token = rr_args.maybe_sd_model_token.as_ref().ok_or(ProcessSingleJobError::Other(anyhow!("SD model not found")))?;

    let retrieved_sd_record =  get_weight_by_token(
        sd_model_token,
        false,
        &deps.db.mysql_pool
    ).await?;

    let model_path = download_model_file(
        &retrieved_sd_record,
        &args.job_dependencies.buckets.public_bucket_client,
        &mut job_progress_reporter,
        job,
        &args.job_dependencies.fs.scoped_temp_dir_creator_for_work,
        &work_temp_dir).await?;

    info!("Downloaded model file: {:?}", model_path.filesystem_path);
    let sd_model = model_path.filesystem_path.to_str().unwrap().to_string();

    let lora_path = match rr_args.maybe_lora_model_token.clone() {
        Some(lora_model_token) => {
            let retrieved_lora_record = get_weight_by_token(
                &lora_model_token,
                false,
                &deps.db.mysql_pool
            ).await?;

            let lora_path = download_model_file(
                &retrieved_lora_record,
                &args.job_dependencies.buckets.public_bucket_client,
                &mut job_progress_reporter,
                job,
                &args.job_dependencies.fs.scoped_temp_dir_creator_for_work,
                &work_temp_dir).await?;

            info!("Downloaded lora file: {:?}", lora_path.filesystem_path);

            Some(lora_path.filesystem_path)
        }
        None => None
    };
    let sd_lora = match lora_path {
        Some(lora_path) => Some(lora_path.to_str().unwrap().to_string()),
        None => None
    };

    // ============== CREATE AND WRITE CONFIG TO DISK  ============== //

    // create seed if not exists
    let seed = rr_args.maybe_seed.unwrap_or_else(|| rand::random::<i32>());

    let config = RerenderConfig {
        input: Some(usable_video_path.to_str().unwrap().to_string()),
        output: Some(output_video_fs_path.to_str().unwrap().to_string()),
        work_dir: Some(work_temp_dir.path().to_str().unwrap().to_string()),
        sd_model: Some(sd_model.to_string()),
        lora_path: sd_lora,
        prompt: rr_args.maybe_prompt.clone(),
        a_prompt: rr_args.maybe_a_prompt.clone(),
        n_prompt: rr_args.maybe_n_prompt.clone(),
        seed: Some(seed as i64),
        ..RerenderConfig::new()
    };

    config.validate().map_err(|e| ProcessSingleJobError::Other(anyhow!(e)))?;

    let config_path = work_temp_dir.path().join("config.json");
    let config_json = serde_json::to_string(&config).unwrap();
    std::fs::write(&config_path, config_json).unwrap();

    // ==================== RUN INFERENCE SCRIPT ==================== //
    let stderr_output_file = work_temp_dir.path().join("stderr.txt");
    let inference_start_time = Instant::now();

    let command_exit_status = model_dependencies
        .inference_command
        .execute_inference(InferenceArgs {
            config_file: &config_path,
            stderr_output_file: &stderr_output_file,
        });

    let inference_duration = Instant::now().duration_since(inference_start_time);

    info!("Inference took duration to complete: {:?}", &inference_duration);

    if !command_exit_status.is_success() {
        error!("Inference failed: {:?}", command_exit_status);

        let error = ProcessSingleJobError::Other(anyhow!("CommandExitStatus: {:?}", command_exit_status));

        if let Ok(contents) = read_to_string(&stderr_output_file) {
            warn!("Captured stderr output: {}", contents);
        }

        safe_delete_file(&video_path.filesystem_path);
        safe_delete_file(&config_path);
        safe_delete_file(&output_video_fs_path);
        safe_delete_file(&stderr_output_file);
        safe_delete_directory(&work_temp_dir);

        return Err(error);
    }

    // ==================== CHECK NON-WATERMARKED RESULT ==================== //

    info!("Checking that output file exists: {:?} ...", output_video_fs_path);

    check_file_exists(&output_video_fs_path).map_err(|e| ProcessSingleJobError::Other(e))?;

    // ==================== OPTIONAL WATERMARK ==================== //

    let finished_file = output_video_fs_path.clone();

    // ==================== CHECK ALL FILES EXIST AND GET METADATA ==================== //

    info!("Checking that output watermark file exists: {:?} ...", finished_file);
    check_file_exists(&finished_file).map_err(|e| ProcessSingleJobError::Other(e))?;

    info!("Interrogating result file size ...");

    let file_size_bytes = file_size(&finished_file)
        .map_err(|err| ProcessSingleJobError::Other(err))?;

    info!("Interrogating result mimetype ...");

    let mimetype = get_mimetype_for_file(&finished_file)
        .map_err(|err| ProcessSingleJobError::from_io_error(err))?
        .map(|mime| mime.to_string())
        .ok_or(ProcessSingleJobError::Other(anyhow!("Mimetype could not be determined")))?;

    info!("Calculating sha256...");

    let file_checksum = sha256_hash_file(&finished_file)
        .map_err(|err| {
            ProcessSingleJobError::Other(anyhow!("Error hashing file: {:?}", err))
        })?;

    // ==================== UPLOAD VIDEO TO BUCKET ==================== //

    job_progress_reporter.log_status("uploading result")
        .map_err(|e| ProcessSingleJobError::Other(e))?;

    let result_bucket_location = MediaFileBucketPath::generate_new(
        Some(BUCKET_FILE_PREFIX),
        Some(BUCKET_FILE_EXTENSION));

    let result_bucket_object_pathbuf = result_bucket_location.to_full_object_pathbuf();

    info!("Video destination bucket path: {:?}", &result_bucket_object_pathbuf);

    info!("Uploading media ...");

    args.job_dependencies.buckets.public_bucket_client.upload_filename_with_content_type(
        &result_bucket_object_pathbuf,
        &finished_file,
        &mimetype) // TODO: We should check the mimetype to make sure bad payloads can't get uploaded
        .await
        .map_err(|e| ProcessSingleJobError::Other(e))?;

    // ==================== DELETE TEMP FILES ==================== //

    safe_delete_file(&video_path.filesystem_path);
    safe_delete_file(&config_path);
    safe_delete_file(&output_video_fs_path);
    safe_delete_file(&stderr_output_file);
    safe_delete_directory(&work_temp_dir);

    // NB: We should be using a tempdir, but to make absolutely certain we don't overflow the disk...
    safe_delete_directory(&work_temp_dir);

    // ==================== SAVE RECORDS ==================== //

    info!("Saving Rerender result (media_files table record) ...");

    let (media_file_token, id) = insert_media_file_from_rerender(InsertArgs {
        pool: &args.job_dependencies.db.mysql_pool,
        job: &job,
        maybe_mime_type: Some(&mimetype),
        file_size_bytes,
        sha256_checksum: &file_checksum,
        public_bucket_directory_hash: result_bucket_location.get_object_hash(),
        maybe_public_bucket_prefix: Some(BUCKET_FILE_PREFIX),
        maybe_public_bucket_extension: Some(BUCKET_FILE_EXTENSION),
        is_on_prem: args.job_dependencies.job.info.container.is_on_prem,
        worker_hostname: &args.job_dependencies.job.info.container.hostname,
        worker_cluster: &args.job_dependencies.job.info.container.cluster_name,
    })
        .await
        .map_err(|e| ProcessSingleJobError::Other(e))?;

    info!("Rerender Done.");

    job_progress_reporter.log_status("done")
        .map_err(|e| ProcessSingleJobError::Other(e))?;

    info!("Job {:?} complete success! Downloaded, ran inference, and uploaded. Saved model record: {}, Result Token: {}",
        job.id, id, &media_file_token);

    Ok(JobSuccessResult {
        maybe_result_entity: Some(ResultEntity {
            entity_type: InferenceResultType::MediaFile,
            entity_token: media_file_token.to_string(),
        }),
        inference_duration,
    })
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RerenderConfig {
	#[serde(rename = "input")]
	pub input: Option<String>,

	#[serde(rename = "output")]
	pub output: Option<String>,

	#[serde(rename = "work_dir")]
	pub work_dir: Option<String>,

	#[serde(rename = "key_subdir")]
	pub key_subdir: Option<String>,

	#[serde(rename = "sd_model")]
	pub sd_model: Option<String>,

	#[serde(rename = "lora_path")]
	pub lora_path: Option<String>,

	#[serde(rename = "interval")]
	pub interval: Option<i32>,

	#[serde(rename = "prompt")]
	pub prompt: Option<String>,

	#[serde(rename = "a_prompt")]
	pub a_prompt: Option<String>,

	#[serde(rename = "n_prompt")]
	pub n_prompt: Option<String>,

	#[serde(rename = "x0_strength")]
	pub x0_strength: Option<f32>,

	#[serde(rename = "control_type")]
	pub control_type: Option<String>,

	#[serde(rename = "canny_low")]
	pub canny_low: Option<i32>,

	#[serde(rename = "canny_high")]
	pub canny_high: Option<i32>,

	#[serde(rename = "control_strength")]
	pub control_strength: Option<f32>,

	#[serde(rename = "seed")]
	pub seed: Option<i64>,

	#[serde(rename = "warp_period")]
	pub warp_period: Option<Vec<f32>>,

	#[serde(rename = "ada_period")]
	pub ada_period: Option<Vec<f32>>,
}

impl RerenderConfig {
    pub fn new() -> Self {
        Self {
            input: None,
            output: None,
            work_dir: None,
            key_subdir: Some("keys".to_string()),
            sd_model: None,
            lora_path: None,
            interval: Some(8),
            prompt: None,
            a_prompt: None,
            n_prompt: None,
            x0_strength: Some(0.95),
            control_type: Some("canny".to_string()),
            canny_low: Some(50),
            canny_high: Some(100),
            control_strength: Some(0.7),
            seed: None,
            warp_period: Some(vec![0., 0.1]),
            ada_period: Some(vec![0.8, 1.]),
        }
    }

    pub fn validate(&self) -> Result<(), Error> {
        let fields = &[
            (self.input.is_some(), "input"),
            (self.output.is_some(), "output"),
            (self.work_dir.is_some(), "work_dir"),
            (self.key_subdir.is_some(), "key_subdir"),
            (self.sd_model.is_some(), "sd_model"),
            (self.interval.is_some(), "interval"),
            (self.prompt.is_some(), "prompt"),
            (self.a_prompt.is_some(), "a_prompt"),
            (self.n_prompt.is_some(), "n_prompt"),
            (self.x0_strength.is_some(), "x0_strength"),
            (self.control_type.is_some(), "control_type"),
            (self.canny_low.is_some(), "canny_low"),
            (self.canny_high.is_some(), "canny_high"),
            (self.control_strength.is_some(), "control_strength"),
            (self.seed.is_some(), "seed"),
            (self.warp_period.is_some(), "warp_period"),
            (self.ada_period.is_some(), "ada_period"),
        ];

        let missing_fields: Vec<&str> = fields
            .iter()
            .filter_map(|(is_some, field_name)| if *is_some { None } else { Some(*field_name) })
            .collect();

        if missing_fields.is_empty() {
            Ok(())
        } else {
            Err(anyhow!("Missing fields: {}", missing_fields.join(", ")))
        }
    }
}
