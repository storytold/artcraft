use crate::job::job_loop::job_success_result::{JobSuccessResult, ResultEntity};
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::studio_gen2::animate_x::animate_x_dependencies::AnimateXDependencies;
use crate::job::job_types::studio_gen2::animate_x::animate_x_inference_command::AnimateXInferenceArgs;
use crate::job::job_types::studio_gen2::animate_x::animate_x_process_frames_command::{AnimateXProcessFramesCommand, ProcessFramesArgs};
use crate::job::job_types::studio_gen2::download_file_for_studio::{download_file_for_studio, DownloadFileForStudioArgs};
use crate::job::job_types::studio_gen2::resize_image_for_studio::{resize_image_for_studio, ImageResizeType};
use crate::job::job_types::studio_gen2::stable_animator::stable_animator_command::InferenceArgs;
use crate::job::job_types::studio_gen2::stable_animator::stable_animator_dependencies::StableAnimatorDependencies;
use crate::job::job_types::studio_gen2::studio_gen2_dirs::StudioGen2Dirs;
use crate::job::job_types::studio_gen2::validate_and_save_results::{validate_and_save_results, SaveResultsArgs};
use crate::state::job_dependencies::JobDependencies;
use crate::util::common_commands::ffmpeg::ffmpeg_resample_fps_args::FfmpegResampleFpsArgs;
use anyhow::anyhow;
use cloud_storage::remote_file_manager::remote_cloud_file_manager::RemoteCloudFileClient;
use enums::by_table::generic_inference_jobs::inference_result_type::InferenceResultType;
use filesys::check_file_exists::check_file_exists;
use filesys::create_dir_all_if_missing::create_dir_all_if_missing;
use filesys::file_deletion::safe_delete_possible_files_and_directories::safe_delete_possible_files_and_directories;
use images::image::io::Reader;
use images::resize_preserving_aspect::resize_preserving_aspect;
use log::{error, info, warn};
use mysql_queries::payloads::generic_inference_args::generic_inference_args::PolymorphicInferenceArgs::{Cu, S2};
use mysql_queries::payloads::generic_inference_args::inner_payloads::studio_gen2_payload::StudioGen2Payload;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use mysql_queries::utils::transactor::Transactor;
use std::fs::{read_to_string, File};
use std::io::BufReader;
use std::path::Path;
use std::time::{Duration, Instant};
use subprocess_common::command_runner::command_runner_args::{RunAsSubprocessArgs, StreamRedirection};
use videos::ffprobe_get_dimensions::ffprobe_get_dimensions;

enum StudioModelPipeline<'a> {
  None,
  AnimateX(&'a AnimateXDependencies),
  StableAnimator(&'a StableAnimatorDependencies),
}

pub async fn process_single_studio_gen2_job(
  deps: &JobDependencies,
  job: &AvailableInferenceJob
) -> Result<JobSuccessResult, ProcessSingleJobError> {

  let mut job_progress_reporter = deps
      .clients
      .job_progress_reporter
      .new_generic_inference(job.inference_job_token.as_str())
      .map_err(|e| ProcessSingleJobError::Other(anyhow!(e)))?;

  let gen2_deps = deps
      .job
      .job_specific_dependencies
      .maybe_studio_gen2_dependencies
      .as_ref()
      .ok_or_else(|| ProcessSingleJobError::JobSystemMisconfiguration(Some("Missing Studio Gen2 dependencies".to_string())))?;


  // ==================== UNPACK + VALIDATE INFERENCE ARGS ==================== //

  let mut studio_job_type = StudioModelPipeline::None;

  if let Some(deps) = gen2_deps.stable_animator.as_ref() {
    studio_job_type = StudioModelPipeline::StableAnimator(deps);
  } else if let Some(deps) = gen2_deps.animate_x.as_ref() {
    studio_job_type = StudioModelPipeline::AnimateX(deps);
  }

  let work_paths = StudioGen2Dirs::new(&gen2_deps)?;

  info!("Input path: {:?}", &work_paths.input_dir.path());
  info!("Output path: {:?}", &work_paths.output_dir.path());

  let remote_cloud_file_client = RemoteCloudFileClient::get_remote_cloud_file_client()
      .await
      .map_err(|e| ProcessSingleJobError::Other(anyhow!("failed to get remote cloud file client: {:?}", e)))?;

  info!("Grabbing mysql connection from pool");

  let mut mysql_connection = deps.db.mysql_pool.acquire()
      .await
      .map_err(|e| {
        warn!("Could not acquire DB pool: {:?}", e);
        ProcessSingleJobError::Other(anyhow!("Could not acquire DB pool: {:?}", e))
      })?;

  let studio_args = job.maybe_inference_args
      .as_ref()
      .map(|args| args.args.as_ref())
      .flatten()
      .ok_or_else(|| ProcessSingleJobError::Other(anyhow!("Job args not found")))
      .map(|poly_args| match poly_args {
        S2(args) => Ok(args),
        _ => return Err(ProcessSingleJobError::Other(anyhow!("Studio Gen2 args not found"))),
      })??;

  info!("Studio args: {:?}", studio_args);


  // ==================== DOWNLOAD IMAGE ==================== //

  let unaltered_image_file;

  match studio_args.image_file.as_ref() {
    None => return Err(ProcessSingleJobError::Other(anyhow!("image_file not set"))),
    Some(media_token) => {
      unaltered_image_file = download_file_for_studio(DownloadFileForStudioArgs {
        media_token,
        input_paths: &work_paths,
        remote_cloud_file_client: &remote_cloud_file_client,
        filename_without_extension: "input_image",
      }, Transactor::for_connection(&mut mysql_connection)).await?;

      info!("Downloaded image to {:?}", &unaltered_image_file.file_path);
    }
  }

  // ==================== DOWNLOAD VIDEO ==================== //

  let unaltered_video_file;

  match studio_args.video_file.as_ref() {
    None => return Err(ProcessSingleJobError::Other(anyhow!("video_file not set"))),
    Some(media_token) => {
      unaltered_video_file = download_file_for_studio(DownloadFileForStudioArgs {
        media_token,
        input_paths: &work_paths,
        remote_cloud_file_client: &remote_cloud_file_client,
        filename_without_extension: "input_video",
      }, Transactor::for_connection(&mut mysql_connection)).await?;

      info!("Downloaded video to {:?}", &unaltered_video_file.file_path);
    }
  }

  //if let Ok(Some(dimensions)) = ffprobe_get_dimensions(&videos.primary_video.original_download_path) {
  //  info!("Download video dimensions: {}x{}", dimensions.width, dimensions.height);
  //}

  // ========================= TRIM AND PREPROCESS VIDEO ======================== //

  const RESAMPLE_FRAME_RATE : u64 = 30; // TODO(bt,2025-02-02): Upstream we produce 60fps out of studio. We should do 24fps

  let mut resampled_video_path = unaltered_video_file.file_path.clone();

  /*
  {
    resampled_video_path = work_paths.output_dir.path().join("resampled_video.mp4");

    let command_exit_status = gen2_deps.ffmpeg
      .run_with_subprocess(RunAsSubprocessArgs {
        args: Box::new(&FfmpegResampleFpsArgs {
          input_video_file: &unaltered_video_file.file_path,
          output_video_file: &resampled_video_path,
          fps: studio_args.fps.unwrap_or(RESAMPLE_FRAME_RATE) as usize,
        }),
        stderr: StreamRedirection::None,
        stdout: StreamRedirection::None,
      });

    if !command_exit_status.is_success() {
      error!("Resample video failed: {:?} ; we'll revert to the original.", command_exit_status);
      resampled_video_path = unaltered_video_file.file_path.clone();
    }
  }
  */

  // ========================= RESIZE IMAGE ======================== //

  let resized_image_path = work_paths.output_dir.path().join("resized_image.png");

  let image_resize_type = match studio_job_type {
    StudioModelPipeline::None => return Err(ProcessSingleJobError::Other(anyhow!("Studio job type not set"))),
    StudioModelPipeline::AnimateX(_) => ImageResizeType::AnimateX,
    StudioModelPipeline::StableAnimator(_) => ImageResizeType::StableAnimator,
  };

  let dimensions = resize_image_for_studio(&unaltered_image_file.file_path, &resized_image_path, image_resize_type)?;

  // ==================== RUN INFERENCE ==================== //

  info!("Preparing for studio inference...");

  job_progress_reporter.log_status("running inference")
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  let stderr_output_file = work_paths.output_dir.path().join("stderr.txt");
  let stdout_output_file = work_paths.output_dir.path().join("stdout.txt");

  let video_output_path = work_paths.output_dir.path().join("output_video.mp4");

  let inference_duration;

  match studio_job_type {
    StudioModelPipeline::None => {
      return Err(ProcessSingleJobError::Other(anyhow!("Studio job type not set")));
    }
    StudioModelPipeline::AnimateX(deps) => {
      info!("Running Studio Gen2 pose frame generation (Animate-X)...");

      let pose_pkl_dir= work_paths.output_dir.path().join("pose_pickle_data");
      create_dir_all_if_missing(&pose_pkl_dir)?;

      let pose_pkl_file = pose_pkl_dir.join("pose.pkl");

      let pose_frames_dir = work_paths.output_dir.path().join("pose_frames");
      create_dir_all_if_missing(&pose_frames_dir)?;

      let original_frames_dir = work_paths.output_dir.path().join("original_frames");
      create_dir_all_if_missing(&original_frames_dir)?;

      let inference_start_time = Instant::now();

      let command_exit_status = deps
          .process_frames_command
          .execute_inference(ProcessFramesArgs {
            stderr_output_file: &stderr_output_file,
            stdout_output_file: &stdout_output_file,
            model_directory: &deps.model_directory_path,
            source_video_path: &resampled_video_path,
            saved_pose_pkl_dir: &pose_pkl_dir,
            saved_pose_frames_dir: &pose_frames_dir,
            saved_original_frames_dir: &original_frames_dir,
          }).await;

      info!("Running Studio Gen2 inference (Animate-X)...");

      let command_exit_status = deps
          .inference_command
          .execute_inference(AnimateXInferenceArgs {
            stderr_output_file: &stderr_output_file,
            stdout_output_file: &stdout_output_file,
            model_directory: &deps.model_directory_path,
            image_file: &resized_image_path,
            saved_pose_pkl_file: &pose_pkl_file,
            saved_pose_frames_dir: &pose_frames_dir,
            saved_original_frames_dir: &original_frames_dir,
            width: Some(dimensions.width as u64),
            height: Some(dimensions.height as u64),
            max_frames: studio_args.max_frames,
            result_filename: &video_output_path,
          }).await;

      inference_duration = Instant::now().duration_since(inference_start_time);
    }
    StudioModelPipeline::StableAnimator(deps) => {
      let pose_frames_dir = work_paths.output_dir.path().join("pose_frames");
      create_dir_all_if_missing(&pose_frames_dir)?;

      let video_frames_output_dir = work_paths.output_dir.path().join("final_frames");
      create_dir_all_if_missing(&video_frames_output_dir)?;

      info!("Running Studio Gen2 inference (Stable Animator)...");

      let inference_start_time = Instant::now();

      let command_exit_status = deps
          .command
          .execute_inference(
            InferenceArgs {
              stderr_output_file: &stderr_output_file,
              stdout_output_file: &stdout_output_file,
              start_image_path: &resized_image_path,
              pre_pose_video_path: Some(resampled_video_path.as_ref()),
              pose_images_dir: &pose_frames_dir,
              frame_output_dir: &video_frames_output_dir,
              video_output_path: &video_output_path,
              pretrained_model_name_or_path: &deps.pretrained_model_name_or_path,
              posenet_model_name_or_path: &deps.posenet_model_name_or_path,
              face_encoder_model_name_or_path: &deps.face_encoder_model_name_or_path,
              unet_model_name_or_path: &deps.unet_model_name_or_path,
              output_width: studio_args.output_width,
              output_height: studio_args.output_height,
              output_fps: studio_args.fps,
            }).await;

      inference_duration = Instant::now().duration_since(inference_start_time);

      info!("Inference command exited with status: {:?}", command_exit_status);
      info!("Inference took duration to complete: {:?}", &inference_duration);
    }
  }

  // check stdout for success and check if file exists
  if let Ok(contents) = read_to_string(&stdout_output_file) {
    info!("Captured stdout output: {}", contents);
  }

  if let Ok(contents) = read_to_string(&stderr_output_file) {
    info!("Captured stderr output: {}", contents);
  }

  //if let Ok(Some(dimensions)) = ffprobe_get_dimensions(&videos.primary_video.comfy_output_video_path) {
  //  info!("Comfy output video dimensions: {}x{}", dimensions.width, dimensions.height);
  //}

  // ==================== CHECK OUTPUT FILE ======================== //

  if let Err(err) = check_file_exists(&video_output_path) {
    error!("Output file does not  exist: {:?}", err);

    //error!("Inference failed: {:?}", command_exit_status);

    if let Ok(contents) = read_to_string(&stderr_output_file) {
      warn!("Captured stderr output: {}", contents);
    }

    maybe_debug_sleep(studio_args).await;

    // NB: Forcing generic type to `&Path` with turbofish
    safe_delete_possible_files_and_directories::<&Path>(&[
      Some(work_paths.input_dir.path()),
      Some(work_paths.output_dir.path()),
    ]);

    return Err(ProcessSingleJobError::Other(anyhow!("Output file did not exist: {:?}",
            &video_output_path)));
  }

  //// ==================== COPY BACK AUDIO ==================== //

  //post_process_restore_audio(PostProcessRestoreVideoArgs {
  //  comfy_deps: gen2_deps,
  //  videos: &mut videos,
  //});

  //// ==================== OPTIONAL WATERMARK ==================== //

  //post_process_add_watermark(PostProcessAddWatermarkArgs {
  //  comfy_deps: gen2_deps,
  //  videos: &mut videos,
  //});

  // ==================== DEBUG ======================== //

  if let Ok(Some(dimensions)) = ffprobe_get_dimensions(&video_output_path) {
    info!("Final video upload dimensions: {}x{}", dimensions.width, dimensions.height);
  }

  // ==================== VALIDATE AND SAVE RESULTS ======================== //

  let result = validate_and_save_results(SaveResultsArgs {
    job,
    deps: &deps,
    gen2_deps,
    studio_args,
    output_video_path: &video_output_path,
    job_progress_reporter: &mut job_progress_reporter,
    inference_duration,
  }).await;

  let media_file_token = match result {
    Ok(token) => token,
    Err(err) => {
      error!("Error validating and saving results: {:?}", err);

      maybe_debug_sleep(studio_args).await;

      // NB: Forcing generic type to `&Path` with turbofish
      safe_delete_possible_files_and_directories::<&Path>(&[
        Some(work_paths.input_dir.path()),
        Some(work_paths.output_dir.path()),
      ]);

      return Err(err);
    }
  };

  // ==================== CLEANUP/ DELETE TEMP FILES ==================== //

  maybe_debug_sleep(studio_args).await;

  info!("Cleaning up temporary files...");

  // NB: Forcing generic type to `&Path` with turbofish
  safe_delete_possible_files_and_directories::<&Path>(&[
    Some(work_paths.input_dir.path()),
    Some(work_paths.output_dir.path()),
  ]);

  // ==================== DONE ==================== //

  info!("Studio Gen2 Done.");

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

async fn maybe_debug_sleep(args: &StudioGen2Payload) {
  if let Some(sleep_millis) = args.after_job_debug_sleep_millis {
    info!("Debug sleeping for millis: {sleep_millis}");
    tokio::time::sleep(Duration::from_millis(sleep_millis)).await;
  }
}
