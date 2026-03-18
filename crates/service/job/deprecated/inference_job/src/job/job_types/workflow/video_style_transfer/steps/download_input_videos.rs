
use anyhow::anyhow;
use log::{error, info};
use sqlx::MySqlConnection;

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use cloud_storage::remote_file_manager::remote_cloud_file_manager::RemoteCloudFileClient;
use filesys::path_to_string::path_to_string;
use mysql_queries::queries::media_files::get::batch_get_media_files_by_tokens::{batch_get_media_files_by_tokens_with_transactor, MediaFilesByTokensRecord};
use mysql_queries::queries::media_files::get::get_media_file::get_media_file_with_transactor;
use mysql_queries::utils::transactor::Transactor;
use tokens::tokens::media_files::MediaFileToken;

use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::workflow::video_style_transfer::steps::check_and_validate_job::JobArgs;
use crate::job::job_types::workflow::video_style_transfer::util::comfy_dirs::ComfyDirs;
use crate::job::job_types::workflow::video_style_transfer::util::video_pathing::{PrimaryInputVideoAndPaths, SecondaryInputVideoAndPaths, VideoPathing};

pub struct DownloadInputVideoArgs<'a> {
  pub job_args: &'a JobArgs<'a>,
  pub comfy_dirs: &'a ComfyDirs,
  pub mysql_connection: &'a mut MySqlConnection,
  pub remote_cloud_file_client: &'a RemoteCloudFileClient,
}

pub async fn download_input_videos(
  mut args: DownloadInputVideoArgs<'_>,
) -> Result<VideoPathing, ProcessSingleJobError> {
  let video_downloads = download_primary_video(&mut args).await?;
  let video_downloads = maybe_download_secondary_videos(video_downloads, &mut args).await?;
  Ok(video_downloads)
}

// TODO: Consolidate primary video download with secondary download logic.
async fn download_primary_video(
  args: &mut DownloadInputVideoArgs<'_>,
) -> Result<VideoPathing, ProcessSingleJobError> {
  let input_media_file_token = match args.job_args.maybe_input_file {
    None => return Err(ProcessSingleJobError::InvalidJob(anyhow!("No primary input video file provided"))),
    Some(token) => token.clone(),
  };

  info!("Querying primary input media file by token: {:?} ...", &input_media_file_token);

  let mut input_media_file =  get_media_file_with_transactor(
    &input_media_file_token,
    false,
    Transactor::for_connection(args.mysql_connection),
  ).await?.ok_or_else(|| {
    error!("primary input media_file not found: {:?}", &input_media_file_token);
    ProcessSingleJobError::Other(anyhow!("primary input media_file not found: {:?}", &input_media_file_token))
  })?;

  if let Some(source_media_file_token) = &input_media_file.maybe_style_transfer_source_media_file_token {
    // NB: We do this to avoid deep-frying the video.
    // This also lets us hide the engine renders from users.
    // This shouldn't ever become a deeply nested tree of children, but rather a single root
    // with potentially many direct children.
    // TODO(bt,2024-05-14): Perhaps fail open and use the first media file if the original
    //  isn't found?
    info!("Looking up original style transfer source media file...");
    input_media_file =  get_media_file_with_transactor(
      &source_media_file_token,
      true, // NB: In case the original was deleted, allow this to continue.
      Transactor::for_connection(args.mysql_connection),
    ).await?.ok_or_else(|| {
      error!("source input media_file not found: {:?}", &input_media_file_token);
      ProcessSingleJobError::Other(anyhow!("source input media_file not found: {:?}",
        &input_media_file_token))
    })?;
  }

  let media_file_bucket_path = MediaFileBucketPath::from_object_hash(
    &input_media_file.public_bucket_directory_hash,
    input_media_file.maybe_public_bucket_prefix.as_deref(),
    input_media_file.maybe_public_bucket_extension.as_deref());

  info!("Primary input media file cloud bucket path: {:?}", media_file_bucket_path.get_full_object_path_str());

  // NB(bt,2024-07-09): This convention is muddled with the python side.
  // We may not have flexibility to change this pathing for a while.
  let download_path = args.comfy_dirs.comfy_input_dir.join("video.mp4");

  info!("Downloading primary input file to {:?}", download_path);

  args.remote_cloud_file_client.download_media_file(
    &media_file_bucket_path,
    path_to_string(&download_path)
  ).await?;

  info!("Downloaded primary input video!");

  // TODO: This monumentally sucks.
  //  The upstream shouldn't be telling us what to do about this at all.
  let job_output_path = args.job_args.output_path;

  Ok(VideoPathing {
    primary_video: PrimaryInputVideoAndPaths::new(
      input_media_file, &args.comfy_dirs, job_output_path),
    maybe_depth: None,
    maybe_normal: None,
    maybe_outline: None,
  })
}

#[derive(Clone, Copy)]
enum SecondaryVideoType {
  Depth,
  Normal,
  Outline,
}

async fn maybe_download_secondary_videos(
  mut video_downloads: VideoPathing,
  args: &mut DownloadInputVideoArgs<'_>,
) -> Result<VideoPathing, ProcessSingleJobError> {
  const CAN_SEE_DELETED : bool = true; // We don't need to care about the deleted flag.

  let mut tokens = Vec::with_capacity(3);

  if let Some(token) = args.job_args.maybe_depth_input_file {
    tokens.push(token.clone());
  }

  if let Some(token) = args.job_args.maybe_normal_input_file {
    tokens.push(token.clone());
  }

  if let Some(token) = args.job_args.maybe_outline_input_file {
    tokens.push(token.clone());
  }

  if tokens.is_empty() {
    return Ok(video_downloads);
  }

  let results = batch_get_media_files_by_tokens_with_transactor(
    Transactor::for_connection(args.mysql_connection),
    &tokens,
    CAN_SEE_DELETED)
      .await
      .map_err(|err| {
        ProcessSingleJobError::Other(anyhow!("error querying secondary videos: {:?}", &err))
      })?;

  if let Some(token) = args.job_args.maybe_depth_input_file {
    video_downloads.maybe_depth =
        download_secondary_video(SecondaryVideoType::Depth, token, &results, args).await?;
  }

  if let Some(token) = args.job_args.maybe_normal_input_file {
    video_downloads.maybe_normal =
        download_secondary_video(SecondaryVideoType::Normal, token, &results, args).await?;
  }

  if let Some(token) = args.job_args.maybe_outline_input_file {
    video_downloads.maybe_outline =
        download_secondary_video(SecondaryVideoType::Outline, token, &results, args).await?;
  }

  Ok(video_downloads)
}

async fn download_secondary_video(
  secondary_video_type: SecondaryVideoType,
  desired_token: &MediaFileToken,
  all_video_media_files: &[MediaFilesByTokensRecord],
  args: &DownloadInputVideoArgs<'_>
) -> Result<Option<SecondaryInputVideoAndPaths>, ProcessSingleJobError> {

  let file_description = match secondary_video_type {
    SecondaryVideoType::Depth => "depth video",
    SecondaryVideoType::Normal => "normal video",
    SecondaryVideoType::Outline => "outline video",
  };

  let download_path = match secondary_video_type {
    SecondaryVideoType::Depth => args.comfy_dirs.comfy_input_dir.join("depth_download.mp4"),
    SecondaryVideoType::Normal => args.comfy_dirs.comfy_input_dir.join("normal_download.mp4"),
    SecondaryVideoType::Outline => args.comfy_dirs.comfy_input_dir.join("outline_download.mp4"),
  };

  let maybe_media_file = all_video_media_files
      .iter()
      .find(|media_file| media_file.token.eq(desired_token));

  let media_file = match maybe_media_file {
    Some(media_file) => media_file,
    None => {
      error!("secondary input media_file '{}' not found: {:?}", file_description, desired_token);
      return Ok(None);
    }
  };

  let media_file_bucket_path = MediaFileBucketPath::from_object_hash(
    &media_file.public_bucket_directory_hash,
    media_file.maybe_public_bucket_prefix.as_deref(),
    media_file.maybe_public_bucket_extension.as_deref());

  info!("Media file '{}' cloud bucket path: {:?}",file_description,
    media_file_bucket_path.get_full_object_path_str());

  info!("Downloading '{}' media file to {:?}", file_description, download_path);

  args.remote_cloud_file_client.download_media_file(
    &media_file_bucket_path,
    path_to_string(&download_path)
  ).await?;

  Ok(Some(SecondaryInputVideoAndPaths {
    record: media_file.clone(),
    original_download_path: download_path,
    maybe_processed_path: None,
  }))
}
