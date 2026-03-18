use log::info;

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use mysql_queries::queries::media_files::job::list_video_media_files_without_thumbnails_for_job::VideoMediaFileWithoutThumbnail;

use crate::job_dependencies::JobDependencies;

/// Download the source video from the bucket, generate thumbnails, and upload them.
pub async fn process_single_media_file(
  deps: &JobDependencies,
  media_file: &VideoMediaFileWithoutThumbnail,
) -> anyhow::Result<()> {
  // Reconstruct the bucket object path from the media file record.
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

  // Download the video to a temp file.
  let video_extension = media_file
    .maybe_public_bucket_extension
    .as_deref()
    .unwrap_or(".mp4");

  let temp_video_path = deps.temp_dir.join(
    format!("video_thumbnail_{}{}", media_file.token.as_str(), video_extension),
  );

  deps
    .public_bucket_client
    .download_file_to_disk(object_path, &temp_video_path)
    .await?;

  info!(
    "Downloaded video to {:?}. Generating thumbnails for {}.",
    temp_video_path,
    media_file.token.as_str(),
  );

  // TODO: Generate thumbnails (jpg + gif) from the downloaded video using ffmpeg,
  // upload them to the bucket, and update the media file record with maybe_thumbnail_version.
  todo!("Generate thumbnails with ffmpeg, upload, and update DB record");

  // Clean up temp file (will be reached once todo!() is replaced).
  #[allow(unreachable_code)]
  {
    let _ = tokio::fs::remove_file(&temp_video_path).await;
    Ok(())
  }
}
