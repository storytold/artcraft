use std::path::PathBuf;

use log::info;
use tempdir::TempDir;

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use mysql_queries::queries::media_files::job::list_video_media_files_without_thumbnails_for_job::VideoMediaFileWithoutThumbnail;

use crate::job_dependencies::JobDependencies;

/// A downloaded video file alongside its owning temp directory.
/// The temp directory (and its contents) are cleaned up when this struct is dropped.
pub struct DownloadedFile {
  pub temp_dir: TempDir,
  pub file_path: PathBuf,
}

/// Download the source video from the bucket, generate thumbnails, and upload them.
pub async fn process_single_media_file(
  deps: &JobDependencies,
  media_file: &VideoMediaFileWithoutThumbnail,
) -> anyhow::Result<()> {
  let downloaded = download_video(deps, media_file).await?;

  info!(
    "Downloaded video to {:?}. Generating thumbnails for {}.",
    downloaded.file_path,
    media_file.token.as_str(),
  );

  // TODO: Generate thumbnails (jpg + gif) from the downloaded video using ffmpeg,
  // upload them to the bucket, and update the media file record with maybe_thumbnail_version.
  todo!("Generate thumbnails with ffmpeg, upload, and update DB record");

  // `downloaded.temp_dir` is dropped here, cleaning up the temp directory and all contents.
  #[allow(unreachable_code)]
  Ok(())
}

/// Download the source video from the public bucket into a new temp directory.
async fn download_video(
  deps: &JobDependencies,
  media_file: &VideoMediaFileWithoutThumbnail,
) -> anyhow::Result<DownloadedFile> {
  let bucket_path = MediaFileBucketPath::from_object_hash(
    &media_file.public_bucket_directory_hash,
    media_file.maybe_public_bucket_prefix.as_deref(),
    media_file.maybe_public_bucket_extension.as_deref(),
  );

  let object_path = bucket_path.get_full_object_path_str();

  info!(
    "Downloading video for media file {} from bucket path: {}",
    media_file.token.as_str(),
    object_path,
  );

  let temp_dir = TempDir::new_in(&deps.temp_dir, "video_thumbnail")?;

  let video_extension = media_file
    .maybe_public_bucket_extension
    .as_deref()
    .unwrap_or(".mp4");

  let filename = format!("{}{}", media_file.token.as_str(), video_extension);
  let file_path = temp_dir.path().join(&filename);

  deps
    .public_bucket_client
    .download_file_to_disk(object_path, &file_path)
    .await?;

  Ok(DownloadedFile { temp_dir, file_path })
}
