use std::path::Path;
use std::thread;
use std::time::Duration;

use anyhow::anyhow;
use log::{debug, error, info};
use tempdir::TempDir;

use buckets::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::generic_inference_jobs::inference_result_type::InferenceResultType;
use enums::by_table::prompts::prompt_type::PromptType;
use enums::no_table::style_transfer::style_transfer_name::StyleTransferName;
use errors::AnyhowResult;
use filesys::file_size::file_size;
use filesys::path_to_string::path_to_string;
use filesys::safe_delete_temp_directory::safe_delete_temp_directory;
use filesys::safe_delete_temp_file::safe_delete_temp_file;
use filesys::safe_recursively_delete_files::safe_recursively_delete_files;
use hashing::sha256::sha256_hash_file::sha256_hash_file;
use jobs_common::job_progress_reporter::job_progress_reporter::JobProgressReporter;
use mimetypes::mimetype_for_file::get_mimetype_for_file;
use mysql_queries::payloads::generic_inference_args::workflow_payload::WorkflowArgs;
use mysql_queries::payloads::prompt_args::prompt_inner_payload::PromptInnerPayloadBuilder;
use mysql_queries::queries::generic_inference::job::list_available_generic_inference_jobs::AvailableInferenceJob;
use mysql_queries::queries::media_files::create::insert_media_file_from_comfy_ui::{insert_media_file_from_comfy_ui, InsertArgs};
use mysql_queries::queries::prompts::insert_prompt::{insert_prompt, InsertPromptArgs};
use thumbnail_generator::task_client::thumbnail_task::ThumbnailTaskBuilder;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;

use crate::job::job_loop::job_success_result::{JobSuccessResult, ResultEntity};
use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::workflow::comfy_ui::comfy_process_job_args::ComfyProcessJobArgs;
use crate::job::job_types::workflow::comfy_ui::comfy_ui_dependencies::ComfyDependencies;
use crate::job::job_types::workflow::comfy_ui::video_style_transfer::download_input_video::VideoDownloadDetails;
use crate::job::job_types::workflow::comfy_ui::video_style_transfer::validate_job::JobArgs;
use crate::job::job_types::workflow::comfy_ui::video_style_transfer::video_paths::VideoPaths;
use crate::job_dependencies::JobDependencies;

fn get_file_extension(mimetype: &str) -> anyhow::Result<&'static str> {
  let ext = match mimetype {
    "video/mp4" => "mp4",
    "image/png" => "png",
    "image/jpeg" => "jpg",
    "image/gif" => "gif",
    _ => return Err(anyhow!("Mimetype not supported: {}", mimetype)),
  };

  Ok(ext)
}

pub struct SaveResultsArgs<'a> {
  pub job: &'a AvailableInferenceJob,
  pub deps: &'a JobDependencies,
  pub comfy_deps: &'a ComfyDependencies,
  pub job_progress_reporter: &'a mut Box<dyn JobProgressReporter>,

  pub download_video: VideoDownloadDetails,
  pub videos: &'a VideoPaths,
  pub inference_duration: Duration,

  pub comfy_args: &'a WorkflowArgs,

  // TODO: Maybe remove these
  pub job_args: &'a JobArgs<'a>,
}

pub async fn validate_and_save_results(args: SaveResultsArgs<'_>) -> Result<MediaFileToken, ProcessSingleJobError> {

  // ==================== GET METADATA ==================== //

  info!("Interrogating result file size ...");

  let final_video = args.videos.get_final_video_to_upload();

  let file_size_bytes = file_size(final_video)
      .map_err(|err| ProcessSingleJobError::Other(err))?;

  info!("Interrogating result mimetype ...");

  let mimetype = get_mimetype_for_file(final_video)
      .map_err(|err| ProcessSingleJobError::from_io_error(err))?
      .map(|mime| mime.to_string())
      .ok_or(ProcessSingleJobError::Other(anyhow!("Mimetype could not be determined")))?;

  // create ext from mimetype
  let ext = get_file_extension(mimetype.as_str())
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  // Extension is really a "suffix" and should have the leading period to act as an extension.
  let ext_suffix = if ext.starts_with(".") {
    ext.to_string()
  } else {
    format!(".{ext}")
  };

  const PREFIX: &str = "storyteller_";

  //// determine media type from mime type
  //let media_type = match mimetype.as_str() {
  //    "video/mp4" => MediaFileType::Video,
  //    "image/png" => MediaFileType::Image,
  //    "image/jpeg" => MediaFileType::Image,
  //    _ => return Err(ProcessSingleJobError::Other(anyhow!("Mimetype not supported: {}", mimetype))),
  //};

  info!("Calculating sha256...");

  let file_checksum = sha256_hash_file(final_video)
      .map_err(|err| {
        ProcessSingleJobError::Other(anyhow!("Error hashing file: {:?}", err))
      })?;

  // ==================== UPLOAD VIDEO TO BUCKET ==================== //

  args.job_progress_reporter.log_status("uploading result")
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  let result_bucket_location = MediaFileBucketPath::generate_new(
    Some(PREFIX),
    Some(&ext_suffix));

  let result_bucket_object_pathbuf = result_bucket_location.to_full_object_pathbuf();

  info!("Output file destination bucket path: {:?}", &result_bucket_object_pathbuf);

  info!("Uploading media ...");

  args.deps.buckets.public_bucket_client.upload_filename_with_content_type(
    &result_bucket_object_pathbuf,
    &final_video,
    &mimetype) // TODO: We should check the mimetype to make sure bad payloads can't get uploaded
      .await
      .map_err(|e| ProcessSingleJobError::Other(e))?;

  // generate thumbnail using thumbnail service
  let thumbnail_types = match mimetype.as_str() {
    "video/mp4" => vec!["image/gif", "image/jpeg"],
    _ => vec![],
  };

  info!("Generating thumbnail tasks...");

  for output_type in thumbnail_types {
    let output_ext = match get_file_extension(output_type) {
        Ok(ext) => format!(".{}", ext),
        Err(e) => {
            error!("Failed to get extension for output type: {:?}", e);
            continue;
        }
    };
    let thumbnail_task_result = ThumbnailTaskBuilder::new()
        .with_bucket(&*args.deps.buckets.public_bucket_client.bucket_name())
        .with_path(&*path_to_string(result_bucket_object_pathbuf.clone()))
        .with_source_mimetype(mimetype.as_str())
        .with_output_mimetype(output_type)
        .with_output_suffix("thumb")
        .with_output_extension(&output_ext)
        .with_event_id(&args.job.id.0.to_string())
        .send()
        .await;

    match thumbnail_task_result {
      Ok(thumbnail_task) => {
        debug!("Thumbnail task created: {:?}", thumbnail_task);
      },
      Err(e) => {
        error!("Failed to create thumbnail task: {:?}", e);
      }
    }
  }

  // Also upload the non-watermarked copy
  info!("Uploading non-watermarked copy...");

  let result = args.deps.buckets.public_bucket_client.upload_filename_with_content_type(
    &result_bucket_object_pathbuf.with_extension("no_watermark.mp4"),
    &args.videos.get_non_watermarked_video_to_upload(),
    &mimetype) // TODO: We should check the mimetype to make sure bad payloads can't get uploaded
      .await;

  if let Err(err) = result {
    error!("Failed to upload non-watermarked copy: {:?}", err);
  }

  if let Some(sleep_millis) = args.comfy_args.sleep_millis {
    info!("Sleeping for millis: {sleep_millis}");
    thread::sleep(Duration::from_millis(sleep_millis));
  }

  // ==================== SAVE RECORDS ==================== //

  // create a json detailing the args used to create the media
  let args_json = serde_json::to_string(&args.job_args)
      .map_err(|e| ProcessSingleJobError::Other(e.into()))?;

  info!("Saving ComfyUI result (media_files table record) ...");

  // NB: We do this to avoid deep-frying the video.
  // This also lets us hide the engine renders from users.
  // This shouldn't ever become a deeply nested tree of children, but rather a single root
  // with potentially many direct children.
  let style_transfer_source_media_file_token = args.download_video
      .input_video_media_file
      .maybe_style_transfer_source_media_file_token
      .as_ref()
      .unwrap_or_else(|| &args.download_video.input_video_media_file.token);

  let prompt_token = PromptToken::generate();

  let (media_file_token, id) = insert_media_file_from_comfy_ui(InsertArgs {
    pool: &args.deps.db.mysql_pool,
    job: &args.job,
    maybe_mime_type: Some(&mimetype),
    maybe_title: args.download_video.input_video_media_file.maybe_title.as_deref(),
    maybe_style_transfer_source_media_file_token: Some(&style_transfer_source_media_file_token),
    maybe_scene_source_media_file_token: args.download_video.input_video_media_file.maybe_scene_source_media_file_token.as_ref(),
    file_size_bytes,
    sha256_checksum: &file_checksum,
    maybe_prompt_token: Some(&prompt_token),
    public_bucket_directory_hash: result_bucket_location.get_object_hash(),
    maybe_public_bucket_prefix: Some(PREFIX),
    maybe_public_bucket_extension: Some(&ext_suffix),
    is_on_prem: args.deps.job.info.container.is_on_prem,
    worker_hostname: &args.deps.job.info.container.hostname,
    worker_cluster: &args.deps.job.info.container.cluster_name,
    extra_file_modification_info: Some(&args_json),
  })
      .await
      .map_err(|e| {
        error!("Error saving media file record: {:?}", e);
        ProcessSingleJobError::Other(e)
      })?;

  let should_insert_prompt_record =
      args.comfy_args.positive_prompt.is_some()
          || args.comfy_args.negative_prompt.is_some()
          || args.comfy_args.lipsync_enabled.is_some()
          || args.comfy_args.strength.is_some()
          || args.comfy_args.style_name.is_some()
          || args.comfy_args.use_face_detailer.is_some()
          || args.comfy_args.disable_lcm.is_some()
          || args.comfy_args.use_cinematic.is_some()
          || args.comfy_args.use_upscaler.is_some();

  if should_insert_prompt_record {
    info!("Saving prompt record");

    let mut other_args_builder = PromptInnerPayloadBuilder::new();

    other_args_builder.set_main_ipa_workflow(args.comfy_deps.configs.main_workflow.clone());

    if let Some(style_name) = args.comfy_args.style_name {
      info!("building PromptInnerPayload with style_name = {:?}", style_name);
      other_args_builder.set_style_name(style_name);
    }

    if args.comfy_args.use_face_detailer.unwrap_or(false) {
      other_args_builder.set_used_face_detailer(true);
      other_args_builder.set_face_detailer_workflow(args.comfy_deps.configs.face_detailer_workflow.clone());
    }

    if args.comfy_args.use_upscaler.unwrap_or(false) {
      other_args_builder.set_used_upscaler(true);
      other_args_builder.set_upscaler_workflow(args.comfy_deps.configs.upscaler_workflow.clone());
    }

    if args.comfy_args.lipsync_enabled.unwrap_or(false) {
      other_args_builder.set_lipsync_enabled(true);
    }

    if args.comfy_args.disable_lcm.unwrap_or(false) {
      other_args_builder.set_disable_lcm(true);
    }

    if args.comfy_args.use_cinematic.unwrap_or(false) {
      other_args_builder.set_use_cinematic(true);
    }

    other_args_builder.set_strength(args.comfy_args.strength);

    if let Ok(duration) = chrono::Duration::from_std(args.inference_duration) {
      // NB: Fail open.
      other_args_builder.set_inference_duration(Some(duration));
    }

    let maybe_other_args = other_args_builder.build();

    info!("maybe other prompt args: {:?}", maybe_other_args);

    // NB: Don't fail the job if the query fails.
    let prompt_result = insert_prompt(InsertPromptArgs {
      maybe_apriori_prompt_token: Some(&prompt_token),
      prompt_type: PromptType::ComfyUi,
      maybe_creator_user_token: args.job.maybe_creator_user_token_typed.as_ref(),
      maybe_positive_prompt: args.comfy_args.positive_prompt.as_deref(),
      maybe_negative_prompt: args.comfy_args.negative_prompt.as_deref(),
      maybe_other_args: maybe_other_args.as_ref(),
      creator_ip_address: &args.job.creator_ip_address,
      mysql_executor: &args.deps.db.mysql_pool,
      phantom: Default::default(),
    }).await;

    if let Err(err) = prompt_result {
      error!("No prompt result token? something has failed: {:?} (we'll ignore this error)", err);
    }
  }

  info!("Result video media token: {:?}", &media_file_token);

  Ok(media_file_token)
}
