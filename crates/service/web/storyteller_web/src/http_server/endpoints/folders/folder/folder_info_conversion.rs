use artcraft_api_defs::folders::common::FolderInfo;
use mysql_queries::queries::folders::folder::folder_row::FolderRow;

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
