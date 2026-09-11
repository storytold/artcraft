use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use crate::common::responses::pagination_cursors::PaginationCursors;
use crate::media_file::list::by_type::list_session_common::SessionMediaFileInfo;

pub const LIST_SESSION_SPLAT_MEDIA_FILES_URL_PATH: &str = "/v1/media_files/splat/list";

#[derive(Serialize, Deserialize, ToSchema)]
pub struct ListSessionSplatMediaFilesSuccessResponse {
  pub success: bool,
  pub results: Vec<SessionMediaFileInfo>,
  pub pagination: PaginationCursors,
}
