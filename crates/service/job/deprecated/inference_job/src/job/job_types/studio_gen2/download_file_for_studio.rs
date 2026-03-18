use std::path::{Path, PathBuf};

use anyhow::anyhow;
use log::{error, info};

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use cloud_storage::remote_file_manager::remote_cloud_file_manager::RemoteCloudFileClient;
use filesys::path_to_string::path_to_string;
use mysql_queries::queries::media_files::get::get_media_file::{get_media_file_with_transactor, MediaFile};
use mysql_queries::utils::transactor::Transactor;
use tokens::tokens::media_files::MediaFileToken;

use crate::job::job_loop::process_single_job_error::ProcessSingleJobError;
use crate::job::job_types::studio_gen2::studio_gen2_dirs::StudioGen2Dirs;

const DEFAULT_SUFFIX : &str = ".jpg";

pub struct DownloadDetails {
  pub media_file: MediaFile,
  pub file_path: PathBuf,
}

pub struct DownloadFileForStudioArgs<'a> {
  pub media_token: &'a MediaFileToken,
  pub input_paths: &'a StudioGen2Dirs,
  pub filename_without_extension: &'a str,
  pub remote_cloud_file_client: &'a RemoteCloudFileClient,
}

pub async fn download_file_for_studio(
  args: DownloadFileForStudioArgs<'_>,
  transactor: Transactor<'_, '_>,
) -> Result<DownloadDetails, ProcessSingleJobError> {

  info!("Querying input media file by token: {:?} ...", &args.media_token);

  let input_media_file =  get_media_file_with_transactor(
    &args.media_token,
    true,
    transactor,
  ).await?.ok_or_else(|| {
    error!("media_file not found: {:?}", &args.media_token);
    ProcessSingleJobError::Other(anyhow!("media_file not found: {:?}", &args.media_token))
  })?;

  let media_file_bucket_path = MediaFileBucketPath::from_object_hash(
    &input_media_file.public_bucket_directory_hash,
    input_media_file.maybe_public_bucket_prefix.as_deref(),
    input_media_file.maybe_public_bucket_extension.as_deref());

  info!("media file cloud bucket path: {:?}", media_file_bucket_path.get_full_object_path_str());

  let suffix = get_suffix(&input_media_file);

  let filesystem_path = args.input_paths.input_dir.path()
      .join(format!("{}{}", args.filename_without_extension, suffix));

  info!("Downloading input file to {:?}", &filesystem_path);

  args.remote_cloud_file_client.download_media_file(
    &media_file_bucket_path,
    path_to_string(&filesystem_path)
  ).await?;

  info!("Downloaded file!");

  Ok(DownloadDetails {
    media_file: input_media_file,
    file_path: filesystem_path,
  })
}

fn get_suffix(input_media_file: &MediaFile) -> String {
  let mut suffix;

  if let Some(extension) = input_media_file.maybe_public_bucket_extension.as_deref() {
    suffix = extension.to_string();
  } else if let Some(mime_type) = input_media_file.maybe_mime_type.as_deref() {
    suffix = match mime_type {
      "image/jpeg" => ".jpg".to_string(),
      "image/png" => ".png".to_string(),
      "video/mp4" => ".mp4".to_string(),
      _ => DEFAULT_SUFFIX.to_string(),
    }
  } else {
    suffix = DEFAULT_SUFFIX.to_string();
  }

  if !suffix.starts_with(".") {
    suffix = format!(".{}", suffix);
  }

  suffix
}
