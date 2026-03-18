use std::fs::{File, read_to_string};
use std::io::BufReader;
use std::path::PathBuf;
use std::time::Instant;

use anyhow::anyhow;
use log::{error, info, warn};

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::generic_inference_jobs::inference_result_type::InferenceResultType;
use filesys::check_file_exists::check_file_exists;
use filesys::file_size::file_size;
use filesys::file_deletion::safe_delete_directory::safe_delete_directory;
use filesys::file_deletion::safe_delete_file::safe_delete_file;
use hashing::sha256::sha256_hash_file::sha256_hash_file;
use mysql_queries::payloads::generic_inference_args::generic_inference_args::PolymorphicInferenceArgs::Mc;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use mysql_queries::queries::media_files::create::specialized_insert::insert_media_file_from_mocapnet::{insert_media_file_from_mocapnet, InsertArgs};
use videos::get_mp4_info::{get_mp4_info, Mp4Info};

use crate::job::job_loop::job_success_result::{JobSuccessResult, ResultEntity};
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::mocap::mocap_net::download_video_file::download_video_file;
use crate::job::job_types::mocap::mocap_net::mocapnet_inference_command::InferenceArgs;
use crate::job::job_types::mocap::mocap_net::validate_job::validate_job;
use crate::state::job_dependencies::JobDependencies;

const BUCKET_FILE_PREFIX: &str = "fakeyou_";
const BUCKET_FILE_EXTENSION: &str = ".bvh";

pub struct MocapNetProcessJobArgs<'a> {
    pub job_dependencies: &'a JobDependencies,
    pub job: &'a AvailableInferenceJob,
}

pub async fn process_job(args: MocapNetProcessJobArgs<'_>) -> Result<JobSuccessResult, ProcessSingleJobError> {
    let job = args.job;
    let deps = args.job_dependencies;

    let mut job_progress_reporter = args
        .job_dependencies
        .clients
        .job_progress_reporter
        .new_generic_inference(job.inference_job_token.as_str())
        .map_err(|e| ProcessSingleJobError::Other(anyhow!(e)))?;

    let model_dependencies = args
        .job_dependencies
        .job
        .job_specific_dependencies
        .maybe_mocapnet_dependencies
        .as_ref()
        .ok_or_else(|| ProcessSingleJobError::JobSystemMisconfiguration(Some("missing Mocap dependencies".to_string())))?;

    // ==================== UNPACK + VALIDATE INFERENCE ARGS ==================== //

    let job_args = validate_job(job)?;

    // ==================== JOB ARGS ==================== //

    let maybe_args = job.maybe_inference_args
        .as_ref()
        .map(|args| args.args.as_ref())
        .flatten();

    let poly_args = match maybe_args {
        None => return Err(ProcessSingleJobError::Other(anyhow!("Mocap args not found"))),
        Some(args) => args,
    };

    let mc_args = match poly_args {
        Mc(args) => args,
        _ => return Err(ProcessSingleJobError::Other(anyhow!("Mocap args not found"))),
    };

    // ==================== TEMP DIR ==================== //

    let work_temp_dir = format!("temp_mocapnet_inference_{}", job.id.0);

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

    // ==================== EXTRACT FILE METADATA (IF POSSIBLE) ==================== //

    // TODO(bt): better check for video file type
    let video_read_result = try_get_video_info(&video_path.filesystem_path);

    let mut maybe_width = mc_args.maybe_size1;
    let mut maybe_height = mc_args.maybe_size2;

    // NB: Fail open. In the event this fails, we want to continue processing.
    if let Some(video_info) = video_read_result {
        info!("Read video info from file: {:?}", video_info);

        maybe_width = Some(video_info.width as i32);
        maybe_height = Some(video_info.height as i32);
    }

    // ==================== SETUP FOR INFERENCE ==================== //

    info!("Ready for MocapNET inference...");

    job_progress_reporter.log_status("running inference")
        .map_err(|e| ProcessSingleJobError::Other(e))?;

    let output_bvh_path = model_dependencies.inference_command.mocapnet_root_code_directory.clone()
        .join("out.bvh");

    info!("Running MocapNET inference...");

    info!("Expected output bvh filename: {:?}", &output_bvh_path);

    // TODO: Limit output length for non-premium (???)

    // ==================== RUN INFERENCE SCRIPT ==================== //
    let stderr_output_file = work_temp_dir.path().join("stderr.txt");
    let inference_start_time = Instant::now();

    let command_exit_status = model_dependencies
        .inference_command
        .execute_inference(InferenceArgs {
            video_file: &usable_video_path,
            maybe_ik1: &mc_args.maybe_ik1,
            maybe_ik2: &mc_args.maybe_ik2,
            maybe_ik3: &mc_args.maybe_ik3,
            maybe_smoothing1: &mc_args.maybe_smoothing1,
            maybe_smoothing2: &mc_args.maybe_smoothing2,
            maybe_size1: &maybe_width,
            maybe_size2: &maybe_height,
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
        safe_delete_file(&output_bvh_path);
        safe_delete_file(&stderr_output_file);
        safe_delete_directory(&work_temp_dir);

        return Err(error);
    }

    // ==================== CHECK NON-WATERMARKED RESULT ==================== //

    info!("Checking that output file exists: {:?} ...", output_bvh_path);

    check_file_exists(&output_bvh_path).map_err(|e| ProcessSingleJobError::Other(e))?;

    // ==================== OPTIONAL WATERMARK ==================== //

    let finished_file = output_bvh_path.clone();

    // ==================== CHECK ALL FILES EXIST AND GET METADATA ==================== //

    info!("Checking that output watermark file exists: {:?} ...", finished_file);
    check_file_exists(&finished_file).map_err(|e| ProcessSingleJobError::Other(e))?;

    info!("Interrogating result file size ...");

    let file_size_bytes = file_size(&finished_file)
        .map_err(|err| ProcessSingleJobError::Other(err))?;

    info!("Interrogating result mimetype ...");

    let mimetype = "application/octet-stream";

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

    info!("Uploading BVH ...");

    args.job_dependencies.buckets.public_bucket_client.upload_filename_with_content_type(
        &result_bucket_object_pathbuf,
        &finished_file,
        &mimetype) // TODO: We should check the mimetype to make sure bad payloads can't get uploaded
        .await
        .map_err(|e| ProcessSingleJobError::Other(e))?;

    // ==================== DELETE TEMP FILES ==================== //

    safe_delete_file(&video_path.filesystem_path);
    safe_delete_file(&output_bvh_path);
    safe_delete_file(&stderr_output_file);
    safe_delete_directory(&work_temp_dir);

    // NB: We should be using a tempdir, but to make absolutely certain we don't overflow the disk...
    safe_delete_directory(&work_temp_dir);

    // ==================== SAVE RECORDS ==================== //

    info!("Saving MocapNET result (media_files table record) ...");

    let (media_file_token, id) = insert_media_file_from_mocapnet(InsertArgs {
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

    info!("Mocap Done.");

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

// Fail open if this doesn't work
fn try_get_video_info(video_filename: &PathBuf) -> Option<Mp4Info> {
    let video_file = File::open(video_filename).ok()?;
    let file_length = video_file.metadata().ok()?.len();
    let reader = BufReader::new(video_file);
    let info = get_mp4_info(reader, file_length).ok()?;
    Some(info)
}