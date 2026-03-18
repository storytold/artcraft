use std::path::PathBuf;

use log::info;
use tempdir::TempDir;

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use bucket_paths::path_conventions::video_thumbnail_suffixes::{CURRENT_VIDEO_THUMBNAIL_VERSION, VIDEO_ANIMATED_GIF_THUMBNAIL_SUFFIX, VIDEO_STATIC_JPG_THUMBNAIL_SUFFIX};
use ffmpeg_utils::ffmpeg::ffmpeg_video_first_frame_to_jpg_thumbnail::{ffmpeg_video_first_frame_to_jpg_thumbnail, FfmpegVideoFirstFrameToJpgThumbnailArgs};
use ffmpeg_utils::ffmpeg::ffmpeg_video_gif_preview::{ffmpeg_video_gif_preview, FfmpegVideoGifPreviewArgs};
use mysql_queries::queries::media_files::thumbnails::list_video_media_files_without_thumbnails_for_job::VideoMediaFileWithoutThumbnail;
use mysql_queries::queries::media_files::thumbnails::update_video_media_file_with_thumbnail::update_video_media_file_with_thumbnail;

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

  info!(
    "Processing media file {:?} (id: {}, created at: {})",
    media_file.token,
    media_file.id,
    media_file.created_at,
  );

  let downloaded = download_video(deps, media_file).await?;

  info!(
    "Downloaded video to {:?}. Generating thumbnails for {:?}.",
    downloaded.file_path,
    media_file.token,
  );

  // Upload thumbnails to bucket beside the original video
  let video_object_path = get_video_object_path(media_file);

  // Generate jpg thumbnail
  let jpg_path = downloaded.temp_dir.path().join("thumbnail.jpg");

  ffmpeg_video_first_frame_to_jpg_thumbnail(
    FfmpegVideoFirstFrameToJpgThumbnailArgs {
      input_video_path: &downloaded.file_path,
      output_jpg_path: &jpg_path,
    },
  )?;

  info!("Generated JPG thumbnail for {}", media_file.token.as_str());

  let jpg_object_path = format!("{video_object_path}{VIDEO_STATIC_JPG_THUMBNAIL_SUFFIX}");
  
  deps
      .public_bucket_client
      .upload_filename(&jpg_object_path, &jpg_path)
      .await?;

  info!("Uploaded JPG thumbnail to {}", jpg_object_path);

  // Generate gif thumbnail
  let gif_path = downloaded.temp_dir.path().join("thumbnail.gif");

  ffmpeg_video_gif_preview(
    FfmpegVideoGifPreviewArgs {
      input_video_path: &downloaded.file_path,
      output_gif_path: &gif_path,
    },
  )?;

  info!("Generated GIF preview for {}", media_file.token.as_str());

  let gif_object_path = format!("{video_object_path}{VIDEO_ANIMATED_GIF_THUMBNAIL_SUFFIX}");

  deps
    .public_bucket_client
    .upload_filename(&gif_object_path, &gif_path)
    .await?;

  info!("Uploaded GIF preview to {}", gif_object_path);

  info!("Marking thumbnail job for {:?} done", media_file.token);

  // Mark the media file as having a thumbnail in the database.
  update_video_media_file_with_thumbnail(
    &media_file.token,
    CURRENT_VIDEO_THUMBNAIL_VERSION,
    &deps.mysql_pool,
  ).await?;

  info!(
    "Updated thumbnail version for media file {:?} (id: {}, created at: {})",
    media_file.token,
    media_file.id,
    media_file.created_at,
  );

  // `downloaded.temp_dir` is dropped here, cleaning up the temp directory and all contents.
  Ok(())
}

/// Build the full bucket object path for the video file.
fn get_video_object_path(media_file: &VideoMediaFileWithoutThumbnail) -> String {
  let bucket_path = MediaFileBucketPath::from_object_hash(
    &media_file.public_bucket_directory_hash,
    media_file.maybe_public_bucket_prefix.as_deref(),
    media_file.maybe_public_bucket_extension.as_deref(),
  );

  bucket_path.get_full_object_path_str().to_string()
}

/// Download the source video from the public bucket into a new temp directory.
async fn download_video(
  deps: &JobDependencies,
  media_file: &VideoMediaFileWithoutThumbnail,
) -> anyhow::Result<DownloadedFile> {
  let object_path = get_video_object_path(media_file);

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
    .download_file_to_disk(&object_path, &file_path)
    .await?;

  Ok(DownloadedFile { temp_dir, file_path })
}
