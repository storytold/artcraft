use std::sync::Arc;

use actix_web::web::{Json, Query};
use actix_web::{web, HttpRequest};

use artcraft_api_defs::media_file::list::by_type::list_session_common::ListSessionMediaFilesByTypeQueryParams;
use artcraft_api_defs::media_file::list::by_type::list_session_splat_media_files::ListSessionSplatMediaFilesSuccessResponse;
use enums::by_table::media_files::media_file_class::MediaFileClass;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::media_files::list::by_type::common::list_session_common::list_session_media_files_of_class;
use crate::state::server_state::ServerState;

/// List the session user's gaussian splat files (`media_class = 'splat'`), paginated.
#[utoipa::path(
  get,
  tag = "Media Files",
  path = "/v1/media_files/splat/list",
  params(ListSessionMediaFilesByTypeQueryParams),
  responses(
    (status = 200, description = "List the session user's splat files", body = ListSessionSplatMediaFilesSuccessResponse),
    (status = 401, description = "Not authorized"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn list_session_splat_media_files_handler(
  http_request: HttpRequest,
  query: Query<ListSessionMediaFilesByTypeQueryParams>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ListSessionSplatMediaFilesSuccessResponse>, CommonWebError> {

  let (results, pagination) = list_session_media_files_of_class(
    &http_request,
    &query,
    &server_state,
    MediaFileClass::Splat,
  ).await?;

  Ok(Json(ListSessionSplatMediaFilesSuccessResponse {
    success: true,
    results,
    pagination,
  }))
}
