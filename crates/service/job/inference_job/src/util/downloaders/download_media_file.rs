use std::path::{Path, PathBuf};

use anyhow::anyhow;
use log::{error, info};
use sqlx::MySqlPool;

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use cloud_storage::remote_file_manager::remote_cloud_file_manager::RemoteCloudFileClient;
use filesys::path_to_string::path_to_string;
use mysql_queries::queries::media_files::get::get_media_file::{get_media_file, MediaFile};
use tokens::tokens::media_files::MediaFileToken;

use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;

pub struct DownloadMediaFileArgs<'a> {
  pub mysql_pool: &'a MySqlPool,
  pub remote_cloud_file_client: &'a RemoteCloudFileClient,
  pub media_file_token: &'a MediaFileToken,

  /// Can query and download deleted media files.
  pub can_see_deleted: bool,

  /// NB: We want to be intentional about where we download the file.
  /// If we want to give it a proper extension that we didn't know
  /// a priori, the caller can handle it.
  pub download_path: &'a Path,
}

pub struct MediaFileAndPath {
  pub media_file: MediaFile,
  pub download_path: PathBuf,
}

pub async fn download_media_file(
  args: DownloadMediaFileArgs<'_>
) -> Result<MediaFileAndPath, ProcessSingleJobError> {

  info!("Querying media file by token: {:?} ...", &args.media_file_token);

  let media_file =  get_media_file(
    &args.media_file_token,
    args.can_see_deleted,
    args.mysql_pool
  ).await?.ok_or_else(|| {
    error!("media file not found: {:?}", &args.media_file_token);
    ProcessSingleJobError::Other(anyhow!("media file not found: {:?}", &args.media_file_token))
  })?;

  let media_file_bucket_path = MediaFileBucketPath::from_object_hash(
    &media_file.public_bucket_directory_hash,
    media_file.maybe_public_bucket_prefix.as_deref(),
    media_file.maybe_public_bucket_extension.as_deref());

  info!("Media file cloud bucket path: {:?}", media_file_bucket_path.get_full_object_path_str());

  info!("Downloading media file to {:?}", args.download_path);

  args.remote_cloud_file_client.download_media_file(
    &media_file_bucket_path,
    path_to_string(&args.download_path)
  ).await?;

  info!("Downloaded media file!");

  Ok(MediaFileAndPath {
    media_file,
    download_path: args.download_path.to_path_buf(),
  })
}
