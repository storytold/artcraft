use artcraft_api_defs::folders::common::{FolderInfo, FolderMediaFileInfo};
use mysql_queries::queries::folders::folder::folder_row::FolderRow;
use mysql_queries::queries::folders::media_files::list_folder_media_files::FolderMediaFileRow;

pub fn folder_row_to_info(row: FolderRow) -> FolderInfo {
  FolderInfo {
    token: row.token,
    name: row.name,
    owner_user_token: row.owner_user_token,
    maybe_parent_folder_token: row.maybe_parent_folder_token,
    maybe_last_media_file_token_1: row.maybe_last_media_file_token_1,
    maybe_last_media_file_token_2: row.maybe_last_media_file_token_2,
    maybe_last_media_file_token_3: row.maybe_last_media_file_token_3,
    maybe_last_media_file_token_4: row.maybe_last_media_file_token_4,
    maybe_cover_image_custom_media_token: row.maybe_cover_image_custom_media_token,
    maybe_color_code: row.maybe_color_code,
    has_star: row.has_star,
    created_at: row.created_at,
    updated_at: row.updated_at,
    is_orphaned: row.is_orphaned,
  }
}

pub fn folder_media_file_row_to_info(row: FolderMediaFileRow) -> FolderMediaFileInfo {
  FolderMediaFileInfo {
    media_file_token: row.media_file_token,
    added_to_folder_at: row.added_to_folder_at,
    media_type: row.media_type,
    media_class: row.media_class,
    maybe_mime_type: row.maybe_mime_type,
    public_bucket_directory_hash: row.public_bucket_directory_hash,
    maybe_public_bucket_prefix: row.maybe_public_bucket_prefix,
    maybe_public_bucket_extension: row.maybe_public_bucket_extension,
    maybe_frame_width: row.maybe_frame_width,
    maybe_frame_height: row.maybe_frame_height,
    maybe_duration_millis: row.maybe_duration_millis,
    maybe_title: row.maybe_title,
  }
}
