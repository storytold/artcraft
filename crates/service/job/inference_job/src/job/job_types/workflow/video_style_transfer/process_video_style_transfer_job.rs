use std::collections::HashMap;
use std::fs::{read_to_string, File};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::thread;
use std::time::{Duration, Instant};

use anyhow::{anyhow, Result};
use log::{debug, error, info, warn};
use oneshot::channel;
use r2d2_redis::redis::Commands;
use serde_json::Value;
use tokio::sync::mpsc;
use tokio::sync::oneshot;
use walkdir::WalkDir;

use bucket_paths::legacy::remote_file_manager_paths::remote_cloud_bucket_details::RemoteCloudBucketDetails;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_directory::MediaFileBucketDirectory;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use cloud_storage::remote_file_manager::remote_cloud_file_manager::RemoteCloudFileClient;
use enums::by_table::generic_inference_jobs::inference_result_type::InferenceResultType;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::by_table::prompts::prompt_type::PromptType;
use enums::common::job_status_plus::JobStatusPlus;
use errors::AnyhowResult;
use filesys::check_file_exists::check_file_exists;
use filesys::file_deletion::safe_delete_directory::safe_delete_directory;
use filesys::file_deletion::safe_delete_file::safe_delete_file;
use filesys::file_deletion::safe_delete_files_and_directories::safe_delete_files_and_directories;
use filesys::file_deletion::safe_delete_possible_files_and_directories::safe_delete_possible_files_and_directories;
use filesys::file_deletion::safe_recursively_delete_files::safe_recursively_delete_files;
use filesys::file_exists::file_exists;
use filesys::file_read_bytes::file_read_bytes;
use filesys::file_size::file_size;
use filesys::path_to_string::path_to_string;
use hashing::sha256::sha256_hash_file::sha256_hash_file;
use mimetypes::mimetype_for_file::get_mimetype_for_file;
use mysql_queries::payloads::generic_inference_args::generic_inference_args::PolymorphicInferenceArgs::Cu;
use mysql_queries::payloads::generic_inference_args::inner_payloads::workflow_payload::NewValue;
use mysql_queries::payloads::prompt_args::encoded_style_transfer_name::EncodedStyleTransferName;
use mysql_queries::payloads::prompt_args::prompt_inner_payload::{PromptInnerPayload, PromptInnerPayloadBuilder};
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use mysql_queries::queries::generic_inference::web::get_inference_job_status::get_inference_job_status;
use mysql_queries::queries::generic_inference::web::job_status::GenericInferenceJobStatus;
use mysql_queries::queries::media_files::get::get_media_file::get_media_file;
use mysql_queries::queries::model_weights::get::get_weight::{get_weight_by_token, get_weight_by_token_with_transactor};
use mysql_queries::queries::prompts::insert_prompt::{insert_prompt, InsertPromptArgs};
use mysql_queries::utils::transactor::Transactor;
use subprocess_common::command_runner::command_runner_args::{RunAsSubprocessArgs, StreamRedirection};
use thumbnail_generator::task_client::thumbnail_task::ThumbnailTaskBuilder;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;
use videos::ffprobe_get_dimensions::ffprobe_get_dimensions;

use crate::job::job_loop::job_success_result::{JobSuccessResult, ResultEntity};
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::workflow::comfy_ui_inference_command::{InferenceArgs, InferenceDetails};
use crate::job::job_types::workflow::video_style_transfer::steps::check_and_validate_job::check_and_validate_job;
use crate::job::job_types::workflow::video_style_transfer::steps::download_global_ipa_image::{download_global_ipa_image, DownloadGlobalIpaImageArgs};
use crate::job::job_types::workflow::video_style_transfer::steps::download_input_videos::{download_input_videos, DownloadInputVideoArgs};
use crate::job::job_types::workflow::video_style_transfer::steps::post_process_add_watermark::{post_process_add_watermark, PostProcessAddWatermarkArgs};
use crate::job::job_types::workflow::video_style_transfer::steps::post_process_restore_audio::{post_process_restore_audio, PostProcessRestoreVideoArgs};
use crate::job::job_types::workflow::video_style_transfer::steps::preprocess_save_audio::{preprocess_save_audio, ProcessSaveAudioArgs};
use crate::job::job_types::workflow::video_style_transfer::steps::preprocess_trim_and_resample_videos::{preprocess_trim_and_resample_videos, ProcessTrimAndResampleVideoArgs};
use crate::job::job_types::workflow::video_style_transfer::steps::validate_and_save_results::{validate_and_save_results, SaveResultsArgs};
use crate::job::job_types::workflow::video_style_transfer::util::comfy_dirs::ComfyDirs;
use crate::job::job_types::workflow::video_style_transfer::util::process_preview_updates::PreviewProcessor;
use crate::job::job_types::workflow::video_style_transfer::util::video_pathing::{PrimaryInputVideoAndPaths, SecondaryInputVideoAndPaths, VideoPathing};
use crate::job::job_types::workflow::video_style_transfer::util::write_workflow_prompt::{write_workflow_prompt, WorkflowPromptArgs};
use crate::state::job_dependencies::JobDependencies;

pub async fn process_video_style_transfer_job(deps: &JobDependencies, job: &AvailableInferenceJob) -> Result<JobSuccessResult, ProcessSingleJobError> {

    let mut job_progress_reporter = deps
        .clients
        .job_progress_reporter
        .new_generic_inference(job.inference_job_token.as_str())
        .map_err(|e| ProcessSingleJobError::Other(anyhow!(e)))?;

    let comfy_deps = deps
        .job
        .job_specific_dependencies
        .maybe_comfy_ui_dependencies
        .as_ref()
        .ok_or_else(|| ProcessSingleJobError::JobSystemMisconfiguration(Some("Missing ComfyUI dependencies".to_string())))?;

    // ==================== UNPACK + VALIDATE INFERENCE ARGS ==================== //
    // check for lack of maybe_json_modifications

    let job_args = check_and_validate_job(job)?;

    // ==================== TEMP DIR ==================== //

    let work_temp_dir = format!("temp_comfy_inference{}", job.id.0);

    // NB: TempDir exists until it goes out of scope, at which point it should delete from filesystem.
    let work_temp_dir = deps
        .fs
        .scoped_temp_dir_creator_for_work
        .new_tempdir(&work_temp_dir)
        .map_err(|e| ProcessSingleJobError::from_io_error(e))?;

    // ===================== DOWNLOAD REQUIRED MODELS IF NOT EXIST ===================== //

    // TODO: Replace all other paths with this
    let comfy_dirs = ComfyDirs::new(&comfy_deps);

    let root_comfy_path = comfy_deps.inference_command.mounts_directory.clone();

    let remote_cloud_file_client = RemoteCloudFileClient::get_remote_cloud_file_client().await;
    let remote_cloud_file_client = match remote_cloud_file_client {
        Ok(res) => {
            res
        }
        Err(_) => {
            return Err(ProcessSingleJobError::from(anyhow!("failed to get remote cloud file client")));
        }
    };

    // Download workflow to ComfyRunner
    let workflow_dir = root_comfy_path.join("prompt");
    // make folder if not exist
    if !workflow_dir.exists() {
        std::fs::create_dir_all(&workflow_dir).map_err(|err| ProcessSingleJobError::IoError(err))?;
    }

    let mut workflow_path = workflow_dir.join("prompt.json").to_str().unwrap().to_string();

    info!("Grabbing redis connection from pool");

    let redis_pool_dep = deps
      .db
      .maybe_keepalive_redis_pool.clone();

    let redis_pool = redis_pool_dep
      .ok_or_else(|| ProcessSingleJobError::Other(anyhow!("failed to get redis pool")))?;
      // .map(|redis| redis.get())
      // .transpose()
      // .map_err(|err| ProcessSingleJobError::Other(anyhow!("redis pool error: {:?}", err)))?;

    info!("Grabbing mysql connection from pool");

    let mut mysql_connection = deps.db.mysql_pool.acquire()
        .await
        .map_err(|e| {
            warn!("Could not acquire DB pool: {:?}", e);
            ProcessSingleJobError::Other(anyhow!("Could not acquire DB pool: {:?}", e))
        })?;

    // download workflow if not none
    match job_args.workflow_source {
        Some(workflow_token) => {
            let retrieved_workflow_record =  get_weight_by_token_with_transactor(
                workflow_token,
                false,
                Transactor::for_connection(&mut mysql_connection)
            ).await?.ok_or_else(|| ProcessSingleJobError::Other(anyhow!("Workflow not found")))?;

            let bucket_details = RemoteCloudBucketDetails {
                object_hash: retrieved_workflow_record.public_bucket_hash,
                prefix: retrieved_workflow_record.maybe_public_bucket_prefix.unwrap(),
                suffix: retrieved_workflow_record.maybe_public_bucket_extension.unwrap(),
            };
            remote_cloud_file_client.download_file(bucket_details, workflow_path.clone()).await?;
            info!("Downloaded workflow to {:?}", workflow_path);
        }
        _ => { }
    }

    let maybe_args = job.maybe_inference_args
        .as_ref()
        .map(|args| args.args.as_ref())
        .flatten();

    let poly_args = match maybe_args {
        None => return Err(ProcessSingleJobError::Other(anyhow!("ComfyUi args not found"))),
        Some(args) => args,
    };

    let comfy_args = match poly_args {
        Cu(args) => args,
        _ => return Err(ProcessSingleJobError::Other(anyhow!("ComfyUi args not found"))),
    };

    info!("Workflow args: {:?}", comfy_args);

    // ==================== WRITE WORKFLOW PROMPT ==================== //

    workflow_path = write_workflow_prompt(WorkflowPromptArgs {
        workflow_path: &workflow_path,
        comfy_args: &comfy_args,
        model_dependencies: &comfy_deps,
        maybe_positive_prompt: comfy_args.positive_prompt.as_deref(),
        maybe_negative_prompt: comfy_args.negative_prompt.as_deref(),
    })?;

    // ==================== QUERY AND DOWNLOAD FILES ==================== //

    // Download Lora model if specified
    let mut maybe_lora_path: Option<PathBuf> = None;

    match job_args.maybe_lora_model {
        Some(lora_model_weight_token) => {
            let lora_dir = root_comfy_path.join("models").join("loras");
            // make if not exist
            if !lora_dir.exists() {
                std::fs::create_dir_all(&lora_dir)
                    .map_err(|err| ProcessSingleJobError::IoError(err))?;
            }

            info!("Querying lora model by token: {:?} ...", &lora_model_weight_token);

            let retrieved_lora_record =  get_weight_by_token_with_transactor(
                lora_model_weight_token,
                true,
                Transactor::for_connection(&mut mysql_connection)
            ).await?.ok_or_else(|| {
                error!("Lora model not found: {:?}", lora_model_weight_token);
                ProcessSingleJobError::Other(anyhow!("Lora model not found: {:?}", lora_model_weight_token))
            })?;

            let bucket_details = RemoteCloudBucketDetails {
                object_hash: retrieved_lora_record.public_bucket_hash,
                prefix: retrieved_lora_record.maybe_public_bucket_prefix.unwrap(),
                suffix: retrieved_lora_record.maybe_public_bucket_extension.unwrap(),
            };

            let lora_filename = "lora.safetensors";
            let lora_path = lora_dir.join(lora_filename).to_str().unwrap().to_string();
            remote_cloud_file_client.download_file(bucket_details, lora_path.clone()).await?;
            maybe_lora_path = Some(lora_path.parse().unwrap());
            info!("Downloaded Lora model to {:?}", lora_path);
            maybe_lora_path = Some(lora_path.parse().unwrap());
        }
        None => {}
    }

    let input_dir = root_comfy_path.join("input");

    if !input_dir.exists() {
        std::fs::create_dir_all(&input_dir)
            .map_err(|err| ProcessSingleJobError::IoError(err))?;
    }

    // Keep track of all the video files we generate
    info!("Root comfy path: {:?}", &root_comfy_path);
    info!("Job output path will be (fix this code! the job shouldn't set this path!): {:?}", &job_args.output_path);

    // TODO(bt,2024-04-20): Clean up this mess.

    // ==================== DOWNLOAD GLOBAL IPA IMAGE (IF SET) ==================== //

    let mut global_ipa_image = None;

    if let Some(ipa_media_token) = comfy_args.global_ip_adapter_token.as_ref() {
        let results = download_global_ipa_image(DownloadGlobalIpaImageArgs {
            ipa_media_token,
            comfy_input_directory: &input_dir,
            remote_cloud_file_client: &remote_cloud_file_client,
        }, Transactor::for_connection(&mut mysql_connection)).await?;

        info!("Downloaded global IPA image to {:?}", results.ipa_image_path);

        global_ipa_image = Some(results);
    }

    // ==================== DOWNLOAD VIDEOS ==================== //

    let mut videos = download_input_videos(DownloadInputVideoArgs {
        job_args: &job_args,
        comfy_dirs: &comfy_dirs,
        mysql_connection: &mut mysql_connection,
        remote_cloud_file_client: &remote_cloud_file_client,
    }).await?;

    info!("Downloaded video!");

    videos.debug_print_video_paths();

    if let Ok(Some(dimensions)) = ffprobe_get_dimensions(&videos.primary_video.original_download_path) {
        info!("Download video dimensions: {}x{}", dimensions.width, dimensions.height);
    }

    // ========================= TRIM AND PREPROCESS VIDEO ======================== //

    let expected_frame_count = preprocess_trim_and_resample_videos(ProcessTrimAndResampleVideoArgs {
        comfy_args,
        comfy_deps,
        comfy_dirs: &comfy_dirs,
        videos: &mut videos,
    })?;


    // ========================= PREPROCESS AUDIO ======================== //

    let mut lipsync_enabled = comfy_args.lipsync_enabled.unwrap_or(false);
    if let Err(err) = preprocess_save_audio(ProcessSaveAudioArgs {
        comfy_deps,
        videos: &mut videos,
    }) {
        error!("Audio extraction failed: {:?}", err);

        lipsync_enabled = false;
    }

    // ========================= CREATE OUTPUT DIR ======================== //

    // make outputs dir if not exist
    let output_dir = root_comfy_path.join("output");
    if !output_dir.exists() {
        std::fs::create_dir_all(&output_dir)
            .map_err(|err| ProcessSingleJobError::IoError(err))?;
    }

    // ==================== RUN COMFY INFERENCE ==================== //

    info!("Preparing for ComfyUI inference...");

    job_progress_reporter.log_status("running inference")
        .map_err(|e| ProcessSingleJobError::Other(e))?;

    let stderr_output_file = work_temp_dir.path().join("stderr.txt");
    let stdout_output_file = work_temp_dir.path().join("stdout.txt");

    let positive_prompt_file = work_temp_dir.path().join("positive_prompt.txt");
    let negative_prompt_file = work_temp_dir.path().join("negative_prompt.txt");
    let travel_prompt_file = work_temp_dir.path().join("travel_prompt.txt");
    let preview_frames_dir = work_temp_dir.path().join("preview_frames");

    let maybe_positive_prompt_filename = comfy_args.positive_prompt
        .as_deref()
        .map(|prompt| {
            std::fs::write(&positive_prompt_file, prompt)
                .map(|_| positive_prompt_file.as_path())
                .map_err(|e| ProcessSingleJobError::IoError(e))
        })
        .transpose()?;

    let maybe_negative_prompt_filename = comfy_args.negative_prompt
        .as_deref()
        .map(|prompt| {
            std::fs::write(&negative_prompt_file, prompt)
                .map(|_| negative_prompt_file.as_path())
                .map_err(|e| ProcessSingleJobError::IoError(e))
        })
        .transpose()?;

    let maybe_travel_prompt_filename = comfy_args.travel_prompt
        .as_deref()
        .map(|prompt| {
            std::fs::write(&travel_prompt_file, prompt)
                .map(|_| travel_prompt_file.as_path())
                .map_err(|e| ProcessSingleJobError::IoError(e))
        })
        .transpose()?;

    let inference_details = InferenceDetails::NewPythonArgs {
        maybe_style: comfy_args.style_name,
        maybe_positive_prompt_filename,
        maybe_negative_prompt_filename,
        maybe_travel_prompt_filename,
    };

    let inference_start_time = Instant::now();
    
    let ephemeral_bucket_client = deps.buckets.auto_gc_bucket_client.clone();
    let previews_media_file_directory = MediaFileBucketDirectory::generate_new();


    // let mysql_pool = deps.db.mysql_pool.clone();
    let (_cancel_tx, mut cancel_rx) = oneshot::channel();
    // let mut interval = tokio::time::interval(Duration::from_millis(30_000));
    // let job_token = job.inference_job_token.clone();
    //
    // let _cancellation_watcher = tokio::spawn(async move {
    //     let mut connection = match mysql_pool.acquire().await {
    //         Ok(connection) => connection,
    //         Err(e) => {
    //             error!("Error acquiring mysql connection: {:?}", e);
    //             return
    //         }
    //     };
    //     let mut fail_count = 0;
    //     loop {
    //         interval.tick().await;
    //         let current_status = get_inference_job_status_from_connection(
    //             &job_token,
    //             &mut connection
    //         ).await;
    //         let current_status = match current_status {
    //             Ok(status) => status,
    //             Err(e) => {
    //                 fail_count += 1;
    //                 error!("Error #{fail_count} getting job status: {:?}", e);
    //                 if fail_count > 3 {
    //                     return;
    //                 }
    //                 tokio::time::sleep(Duration::from_secs(3)).await;
    //                 continue
    //             }
    //         };
    //         fail_count = 0;
    //         match current_status {
    //             Some(status) => {
    //                 if status.status == JobStatusPlus::CancelledByUser {
    //                     cancel_tx.send(()).unwrap();
    //                     break
    //                 }
    //             }
    //             None => {
    //                 debug!("Job status not found. This has to be an error");
    //             }
    //         }
    //     }
    // });
    //
    let preview_frames_enabled = comfy_args.generate_fast_previews.unwrap_or(false);
    let (preview_cancellation_tx, rx) = channel();
    let mut preview_processor = PreviewProcessor::new(
        job.inference_job_token.clone(),
        redis_pool,
        preview_frames_dir.clone(),
        previews_media_file_directory,
        expected_frame_count as u32,
        rx,
    );

    tokio::spawn(async move {
        preview_processor.start_processing(&ephemeral_bucket_client).await;;
    });

    info!("Running ComfyUI inference...");

    // tokio::time::sleep(Duration::from_secs(30)).await;
    let command_exit_status = comfy_deps
        .inference_command
        .execute_inference(
            &mut cancel_rx,
            InferenceArgs {
                generate_previews: comfy_args.generate_fast_previews.unwrap_or(false),
                preview_frames_directory: Some(preview_frames_dir.as_ref()),
                stderr_output_file: &stderr_output_file,
                stdout_output_file: &stdout_output_file,
                inference_details,
                face_detailer_enabled: comfy_args.use_face_detailer.unwrap_or(false),
                upscaler_enabled: comfy_args.use_upscaler.unwrap_or(false),
                lipsync_enabled,
                disable_lcm: comfy_args.disable_lcm.unwrap_or(false),
                use_cinematic: comfy_args.use_cinematic.unwrap_or(false),
                maybe_strength: comfy_args.strength,
                frame_skip: comfy_args.frame_skip,
                global_ipa_image_filename: global_ipa_image
                    .as_ref()
                    .map(|image| path_to_string(&image.ipa_image_path)),
                global_ipa_strength: None, // TODO: Expose a UI slider
                depth_video_path: videos.maybe_depth.as_ref()
                    .map(|v| v.maybe_processed_path.as_deref())
                    .flatten(),
                normal_video_path: videos.maybe_normal.as_ref()
                    .map(|v| v.maybe_processed_path.as_deref())
                    .flatten(),
                outline_video_path: videos.maybe_outline.as_ref()
                    .map(|v| v.maybe_processed_path.as_deref())
                    .flatten(),
        }).await;

    // tokio::time::sleep(Duration::from_secs(60)).await;
    let inference_duration = Instant::now().duration_since(inference_start_time);

    info!("Inference command exited with status: {:?}", command_exit_status);

    info!("Inference took duration to complete: {:?}", &inference_duration);

    // check stdout for success and check if file exists
    if let Ok(contents) = read_to_string(&stdout_output_file) {
        info!("Captured stdout output: {}", contents);
    }

    if let Ok(contents) = read_to_string(&stderr_output_file) {
        info!("Captured stderr output: {}", contents);
    }

    videos.debug_print_video_paths();

    if let Ok(Some(dimensions)) = ffprobe_get_dimensions(&videos.primary_video.comfy_output_video_path) {
        info!("Comfy output video dimensions: {}x{}", dimensions.width, dimensions.height);
    }

    // tokio::time::sleep(Duration::from_secs(10)).await;
    // preview_frames_uploader.await.map_err(|e| ProcessSingleJobError::Other(anyhow!("bucket uploader error: {:?}", e)))?;
    let _ = preview_cancellation_tx.send(());

    // ==================== CHECK OUTPUT FILE ======================== //

    if let Err(err) = check_file_exists(&videos.primary_video.comfy_output_video_path) {
        error!("Output file does not  exist: {:?}", err);

        error!("Inference failed: {:?}", command_exit_status);

        if let Ok(contents) = read_to_string(&stderr_output_file) {
            warn!("Captured stderr output: {}", contents);
        }

        safe_delete_all_input_videos(&videos);
        safe_recursively_delete_files(&comfy_dirs.comfy_output_dir); // NB: Don't delete directory itself.

        // NB: Forcing generic type to `&Path` with turbofish
        safe_delete_possible_files_and_directories::<&Path>(&[
            Some(&negative_prompt_file),
            Some(&output_dir),
            Some(&positive_prompt_file),
            Some(&preview_frames_dir),
            Some(&stderr_output_file),
            Some(&stdout_output_file),
            Some(&travel_prompt_file),
            Some(work_temp_dir.path()),
            Some(workflow_path.as_ref()),
            global_ipa_image.as_ref().map(|ipa| ipa.ipa_image_path.as_path()),
            maybe_lora_path.as_deref(),
        ]);

        return Err(ProcessSingleJobError::Other(anyhow!("Output file did not exist: {:?}",
            &videos.primary_video.comfy_output_video_path)));
    }

    // ==================== COPY BACK AUDIO ==================== //

    post_process_restore_audio(PostProcessRestoreVideoArgs {
        comfy_deps,
        videos: &mut videos,
    });

    // ==================== OPTIONAL WATERMARK ==================== //

    post_process_add_watermark(PostProcessAddWatermarkArgs {
        comfy_deps,
        videos: &mut videos,
    });

    // ==================== DEBUG ======================== //

    videos.debug_print_video_paths();

    if let Ok(Some(dimensions)) = ffprobe_get_dimensions(&videos.primary_video.get_final_video_to_upload()) {
        info!("Final video upload dimensions: {}x{}", dimensions.width, dimensions.height);
    }

    // ==================== VALIDATE AND SAVE RESULTS ======================== //

    let result = validate_and_save_results(SaveResultsArgs {
        job,
        deps: &deps,
        job_args: &job_args,
        comfy_deps,
        comfy_args,
        videos: &videos,
        job_progress_reporter: &mut job_progress_reporter,
        inference_duration,
    }).await;

    let media_file_token = match result {
        Ok(token) => token,
        Err(err) => {
            error!("Error validating and saving results: {:?}", err);
            safe_delete_all_input_videos(&videos);
            safe_recursively_delete_files(&comfy_dirs.comfy_output_dir); // NB: Don't delete directory itself.

            // NB: Forcing generic type to `&Path` with turbofish
            safe_delete_possible_files_and_directories::<&Path>(&[
                Some(&comfy_dirs.comfy_output_dir),
                Some(&negative_prompt_file),
                Some(&output_dir),
                Some(&preview_frames_dir),
                Some(&stderr_output_file),
                Some(&stdout_output_file),
                Some(&travel_prompt_file),
                Some(&positive_prompt_file),
                Some(work_temp_dir.path()),
                Some(workflow_path.as_ref()),
                global_ipa_image.as_ref().map(|ipa| ipa.ipa_image_path.as_path()),
                maybe_lora_path.as_deref(),
            ]);

            return Err(err);
        }
    };

    // ==================== (OPTIONAL) DEBUG SLEEP ==================== //

    if let Some(sleep_millis) = comfy_args.sleep_millis {
        info!("Sleeping for millis: {sleep_millis}");
        thread::sleep(Duration::from_millis(sleep_millis));
    }

    // ==================== CLEANUP/ DELETE TEMP FILES ==================== //

    info!("Cleaning up temporary files...");

    safe_delete_all_input_videos(&videos);
    safe_recursively_delete_files(&comfy_dirs.comfy_output_dir); // NB: Don't delete directory itself.

    // NB: Forcing generic type to `&Path` with turbofish
    safe_delete_possible_files_and_directories::<&Path>(&[
        Some(&comfy_dirs.comfy_output_dir),
        Some(&negative_prompt_file),
        Some(&output_dir),
        Some(&preview_frames_dir),
        Some(&stderr_output_file),
        Some(&stdout_output_file),
        Some(&travel_prompt_file),
        Some(&positive_prompt_file),
        Some(work_temp_dir.path()),
        Some(workflow_path.as_ref()),
        global_ipa_image.as_ref().map(|ipa| ipa.ipa_image_path.as_path()),
        maybe_lora_path.as_deref(),
    ]);

    // ==================== DONE ==================== //

    info!("ComfyUI Done.");

    job_progress_reporter.log_status("done")
        .map_err(|e| ProcessSingleJobError::Other(e))?;

    info!("Result video media token: {:?}", &media_file_token);

    info!("Job {:?} complete success!", job.id);

    Ok(JobSuccessResult {
        maybe_result_entity: Some(ResultEntity {
            entity_type: InferenceResultType::MediaFile,
            entity_token: media_file_token.to_string(),
        }),
        inference_duration,
    })
}

fn safe_delete_all_input_videos(videos: &VideoPathing) {
    safe_delete_primary_videos(&videos.primary_video);
    if let Some(depth) = &videos.maybe_depth {
        safe_delete_secondary_videos(depth);
    }
    if let Some(normal) = &videos.maybe_normal {
        safe_delete_secondary_videos(normal);
    }
    if let Some(outline) = &videos.maybe_outline {
        safe_delete_secondary_videos(outline);
    }
}

fn safe_delete_primary_videos(video: &PrimaryInputVideoAndPaths) {
    safe_delete_possible_files_and_directories::<&Path>(&[
        Some(&video.comfy_input_video_path),
        Some(&video.comfy_output_video_path),
        Some(&video.original_download_path),
        Some(&video.trimmed_wav_audio_path),
        Some(video.get_final_video_to_upload()),
        Some(video.get_non_watermarked_video_to_upload()),
        Some(video.video_to_watermark()),
        video.audio_restored_video_path.as_deref(),
        video.maybe_trimmed_resampled_path.as_deref(),
        video.watermarked_video_path.as_deref(),
    ]);
}

fn safe_delete_secondary_videos(video: &SecondaryInputVideoAndPaths) {
    safe_delete_possible_files_and_directories::<&Path>(&[
        Some(&video.original_download_path),
        video.maybe_processed_path.as_deref(),
    ]);
}
