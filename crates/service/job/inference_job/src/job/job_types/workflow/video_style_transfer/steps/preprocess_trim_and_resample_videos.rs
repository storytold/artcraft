use std::path::PathBuf;
use std::process::{Command, Stdio};

use anyhow::anyhow;
use log::{error, info};

use filesys::path_to_string::path_to_string;
use mysql_queries::payloads::generic_inference_args::inner_payloads::workflow_payload::WorkflowArgs;
use videos::ffprobe_get_dimensions::ffprobe_get_dimensions;

use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::workflow::comfy_ui_dependencies::ComfyDependencies;
use crate::job::job_types::workflow::video_style_transfer::util::comfy_dirs::ComfyDirs;
use crate::job::job_types::workflow::video_style_transfer::util::video_pathing::{SecondaryInputVideoAndPaths, VideoPathing};

pub struct ProcessTrimAndResampleVideoArgs<'a> {
  pub comfy_args: &'a WorkflowArgs,
  pub comfy_deps: &'a ComfyDependencies,
  pub comfy_dirs: &'a ComfyDirs,
  pub videos: &'a mut VideoPathing,
}

pub fn preprocess_trim_and_resample_videos(
  args: ProcessTrimAndResampleVideoArgs<'_>
) -> Result<u64, ProcessSingleJobError> {
  let target_fps = args.comfy_args.target_fps.unwrap_or(24);

  let trim_start_millis = args.comfy_args.trim_start_milliseconds
      .or_else(|| args.comfy_args.trim_start_seconds.map(|s| s as u64 * 1_000))
      .unwrap_or(0);

  let trim_end_millis = args.comfy_args.trim_end_milliseconds
      .or_else(|| args.comfy_args.trim_end_seconds.map(|s| s as u64 * 1_000))
      .unwrap_or(3_000);

  let expected_frames = (trim_end_millis - trim_start_millis) * (target_fps as u64) / 1_000;

  info!("trim start millis: {trim_start_millis}");
  info!("trim end millis: {trim_end_millis}");
  info!("target FPS: {target_fps}");

  let resample_details = ResampleDetails {
    target_fps,
    trim_start_millis,
    trim_end_millis,
  };

  let skip_resampling_video = args.comfy_args.skip_process_video.unwrap_or(false);

  preprocess_trim_and_resample_primary_video(
    &args.comfy_deps,
    &args.comfy_dirs,
    &resample_details,
    skip_resampling_video,
    args.videos)?;

  if !skip_resampling_video {
    preprocess_trim_and_resample_secondary_videos(
      &args.comfy_deps,
      &resample_details,
      args.videos)?;
  }

  Ok(expected_frames)
}

struct ResampleDetails {
  target_fps: u32,
  trim_start_millis: u64,
  trim_end_millis: u64,
}

fn preprocess_trim_and_resample_primary_video(
  comfy_deps: &ComfyDependencies,
  comfy_dirs: &ComfyDirs,
  resample_details: &ResampleDetails,
  skip_process_video: bool,
  videos: &mut VideoPathing,
) -> Result<(), ProcessSingleJobError> {

  let resampled_path = comfy_dirs.comfy_input_dir.join("trimmed.mp4");

  if skip_process_video {
    info!("Skipping video trim / resample...");
    info!("(This might break if we need to copy the video path. Salt's code implicitly expects videos to be in certain places, but doesn't allow passing of config, and that's horrible.)");

    std::fs::copy(&videos.primary_video.original_download_path, &resampled_path)
        .map_err(|err| {
          error!("Error copying video (1): {:?}", err);
          ProcessSingleJobError::IoError(err)
        })?;

    std::fs::copy(&videos.primary_video.original_download_path, &videos.primary_video.comfy_output_video_path)
        .map_err(|err| {
          error!("Error copying video (2): {:?}", err);
          ProcessSingleJobError::IoError(err)
        })?;

  } else {
    info!("Calling video trim / resample...");
    info!("Script: {:?}", &comfy_deps.inference_command.processing_script);

    // NB(bt,2024-07-09): Despite what the comments on this field say, the script `format_video.py` writes
    // to a file named 'input.mp4', not 'trimmed.mp4'. This pathing really needs to be cleaned up.
    let comfy_input_video_path = comfy_dirs.comfy_input_dir.join("input.mp4");

    // shell out to python script
    let output = Command::new("python3")
        .stdout(Stdio::inherit()) // NB: This should emit to the rust job's stdout
        .stderr(Stdio::inherit()) // NB: This should emit to the rust job's stderr
        .arg(path_to_string(&comfy_deps.inference_command.processing_script))
        .arg("DO_NOT_USE_THIS_ARG_ANYMORE")
        .arg(format!("{:?}", resample_details.trim_start_millis))
        .arg(format!("{:?}", resample_details.trim_end_millis))
        .arg(format!("{:?}", resample_details.target_fps))
        .arg("--input")
        .arg(path_to_string(&videos.primary_video.original_download_path))
        .arg("--output")
        // NB(bt,2024-07-09): Despite what the comments on this field say, the script `format_video.py` writes
        // to a file named 'input.mp4', not 'trimmed.mp4'. This pathing really needs to be cleaned up.
        .arg(path_to_string(&comfy_input_video_path))
        .output()
        .map_err(|e| {
          error!("Error running inference: {:?}", e);
          ProcessSingleJobError::Other(e.into())
        })?;

    // check if the command was successful
    if !output.status.success() {
      // print stdout and stderr
      error!("Video processing failed: {:?}", output.status);
      error!("stdout: {}", String::from_utf8_lossy(&output.stdout));
      error!("stderr: {}", String::from_utf8_lossy(&output.stderr));
      return Err(ProcessSingleJobError::Other(anyhow!("Command failed: {:?}", output.status)));
    }

    info!("Finished video trim / resample.");

    // NB: The process video script implicitly saves the above video as "input.mp4"
    // Comfy sometimes overwrites this, so we need to make a copy.
    std::fs::copy(&comfy_input_video_path, &resampled_path)
        .map_err(|err| {
          error!("Error copying trimmed video: {:?}", err);
          ProcessSingleJobError::IoError(err)
        })?;
  }

  //primary_video_paths.debug_print_paths_after_trim();

  if let Ok(Some(dimensions)) = ffprobe_get_dimensions(&resampled_path) {
    info!("Trimmed / resampled video dimensions: {}x{}", dimensions.width, dimensions.height);
  }

  // NB(bt,2024-07-10): Even if we don't resample, the python side still expects certain pathing for now
  videos.primary_video.maybe_trimmed_resampled_path = Some(resampled_path);

  Ok(())
}

fn preprocess_trim_and_resample_secondary_videos(
  comfy_deps: &ComfyDependencies,
  resample_details: &ResampleDetails,
  secondary_videos: &mut VideoPathing,
) -> Result<(), ProcessSingleJobError> {

  if let Some(depth) = secondary_videos.maybe_depth.as_mut() {
    let resampled_path = preprocess_trim_and_resample_secondary_video(comfy_deps, resample_details, depth)?;
    depth.maybe_processed_path = Some(resampled_path);
  }

  if let Some(normal) = secondary_videos.maybe_normal.as_mut() {
    let resampled_path = preprocess_trim_and_resample_secondary_video(comfy_deps, resample_details, normal)?;
    normal.maybe_processed_path = Some(resampled_path);
  }

  if let Some(outline) = secondary_videos.maybe_outline.as_mut() {
    let resampled_path = preprocess_trim_and_resample_secondary_video(comfy_deps, resample_details, outline)?;
    outline.maybe_processed_path = Some(resampled_path);
  }

  Ok(())
}

fn preprocess_trim_and_resample_secondary_video(
  comfy_deps: &ComfyDependencies,
  resample_details: &ResampleDetails,
  video: &SecondaryInputVideoAndPaths,
) -> Result<PathBuf, ProcessSingleJobError> {
  info!("Calling video trim / resample...");
  info!("Script: {:?}", &comfy_deps.inference_command.processing_script);

  let output_path = {
    let filename = video.original_download_path
        .file_stem()
        .map(|s| s.to_str())
        .flatten()
        .ok_or_else(|| {
          ProcessSingleJobError::Other(anyhow!("Error getting filename: {:?}", video.original_download_path))
        })?;

    let filename = format!("{}_resampled.mp4", filename);

    video.original_download_path.with_file_name(filename)
  };

  // shell out to python script
  let output = Command::new("python3")
      .stdout(Stdio::inherit()) // NB: This should emit to the rust job's stdout
      .stderr(Stdio::inherit()) // NB: This should emit to the rust job's stderr
      .arg(path_to_string(&comfy_deps.inference_command.processing_script))
      .arg(path_to_string("DO_NOT_USE_THIS_ARG_ANYMORE"))
      .arg(format!("{:?}", resample_details.trim_start_millis))
      .arg(format!("{:?}", resample_details.trim_end_millis))
      .arg(format!("{:?}", resample_details.target_fps))
      .arg("--input")
      .arg(path_to_string(&video.original_download_path))
      .arg("--output")
      .arg(path_to_string(&output_path))
      .output()
      .map_err(|e| {
        error!("Error running inference: {:?}", e);
        ProcessSingleJobError::Other(e.into())
      })?;

  // check if the command was successful
  if !output.status.success() {
    // print stdout and stderr
    error!("Video processing failed: {:?}", output.status);
    error!("stdout: {}", String::from_utf8_lossy(&output.stdout));
    error!("stderr: {}", String::from_utf8_lossy(&output.stderr));
    return Err(ProcessSingleJobError::Other(anyhow!("Command failed: {:?}", output.status)));
  }

  info!("Finished video trim / resample.");

  Ok(output_path)
}
