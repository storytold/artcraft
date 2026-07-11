use std::sync::Arc;

use actix_web::web::{Json, Query};
use actix_web::{web, HttpRequest};

use artcraft_api_defs::media_file::list::by_type::list_session_common::ListSessionMediaFilesByTypeQueryParams;
use artcraft_api_defs::media_file::list::by_type::list_session_mesh_media_files::ListSessionMeshMediaFilesSuccessResponse;
use enums::by_table::media_files::media_file_class::MediaFileClass;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::media_files::list::by_type::common::list_session_common::list_session_media_files_of_class;
use crate::state::server_state::ServerState;

/// List the session user's mesh files (`media_class = 'mesh'`), paginated.
#[utoipa::path(
  get,
  tag = "Media Files",
  path = "/v1/media_files/mesh/list",
  params(ListSessionMediaFilesByTypeQueryParams),
  responses(
    (status = 200, description = "List the session user's mesh files", body = ListSessionMeshMediaFilesSuccessResponse),
    (status = 401, description = "Not authorized"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn list_session_mesh_media_files_handler(
  http_request: HttpRequest,
  query: Query<ListSessionMediaFilesByTypeQueryParams>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ListSessionMeshMediaFilesSuccessResponse>, CommonWebError> {

  let (results, pagination) = list_session_media_files_of_class(
    &http_request,
    &query,
    &server_state,
    MediaFileClass::Mesh,
  ).await?;

  Ok(Json(ListSessionMeshMediaFilesSuccessResponse {
    success: true,
    results,
    pagination,
  }))
}
