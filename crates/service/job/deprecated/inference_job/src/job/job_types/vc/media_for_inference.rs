use std::path::PathBuf;

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use bucket_paths::legacy::typified_paths::public::media_uploads::bucket_file_path::MediaUploadOriginalFilePath;
use mysql_queries::queries::media_files::get::get_media_file_for_inference::MediaFileForInference;
use mysql_queries::queries::media_uploads::get_media_upload_for_inference::MediaUploadRecordForInference;

/// Dynamic payload for inference job media that also serves as an adapter
/// to each type's specific fields and behaviors.
pub enum MediaForInference {
  MediaFile(MediaFileForInference),
  LegacyMediaUpload(MediaUploadRecordForInference),
}

impl MediaForInference {
  pub fn file_size_bytes(&self) -> u32 {
    match self {
      MediaForInference::MediaFile(media_file) => media_file.file_size_bytes,
      MediaForInference::LegacyMediaUpload(media_upload) => media_upload.original_file_size_bytes,
    }
  }

  pub fn maybe_duration_millis(&self) -> Option<u32> {
    match self {
      MediaForInference::MediaFile(media_file) => media_file.maybe_duration_millis,
      MediaForInference::LegacyMediaUpload(media_upload) => Some(media_upload.original_duration_millis),
    }
  }

  pub fn get_bucket_path(&self) -> PathBuf {
    match self {
      MediaForInference::MediaFile(media_file) => {
        let media_file_bucket_path = MediaFileBucketPath::from_object_hash(
          &media_file.public_bucket_directory_hash,
          media_file.maybe_public_bucket_prefix.as_deref(),
          media_file.maybe_public_bucket_extension.as_deref());

        media_file_bucket_path.to_full_object_pathbuf()
      }
      MediaForInference::LegacyMediaUpload(media_upload) => {
        let media_upload_bucket_path =
            MediaUploadOriginalFilePath::from_object_hash(&media_upload.public_bucket_directory_hash);

        media_upload_bucket_path.to_full_object_pathbuf()
      }
    }
  }
}
