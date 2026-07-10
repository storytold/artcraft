use std::sync::Arc;

use actix_multipart::form::MultipartForm;
use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};

use artcraft_api_defs::media_file::project::update_editor_2d_project::{UpdateEditor2dProjectPathInfo, UpdateEditor2dProjectSuccessResponse};

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::media_files::upload::project::project_upload_shared::{update_project, UpdateProjectMultipartForm, EDITOR_2D_PROJECT_CONFIG};
use crate::state::server_state::ServerState;

/// Overwrite an existing 2D editor project (multipart JSON document upload).
///
/// Only the project's creator may update it: user-owned projects require a
/// matching user session, and anonymously created projects require a matching
/// anonymous visitor token. To save a brand new copy instead, call the
/// corresponding "new" endpoint.
#[utoipa::path(
  post,
  tag = "Media Files (Projects)",
  path = "/v1/media_files/upload/project/editor_2d/update/{token}",
  responses(
    (status = 200, description = "2d editor project updated", body = UpdateEditor2dProjectSuccessResponse),
    (status = 400, description = "Bad input"),
    (status = 401, description = "Not authorized"),
    (status = 404, description = "Not found"),
    (status = 500, description = "Server error"),
  ),
  params(
    ("path" = UpdateEditor2dProjectPathInfo, description = "Path for Request"),
    (
      "request" = UpdateProjectMultipartForm,
      description = "IF VIEWING DOCS, PLEASE SEE BOTTOM OF PAGE `UpdateProjectMultipartForm` (Under 'Schema') FOR DETAILS ON FIELDS AND NULLABILITY."
    ),
  )
)]
pub async fn update_editor_2d_project_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>,
  path: Path<UpdateEditor2dProjectPathInfo>,
  MultipartForm(form): MultipartForm<UpdateProjectMultipartForm>,
) -> Result<Json<UpdateEditor2dProjectSuccessResponse>, CommonWebError> {
  update_project(
    &http_request, &server_state, &EDITOR_2D_PROJECT_CONFIG, &path.token, form).await?;

  Ok(Json(UpdateEditor2dProjectSuccessResponse {
    success: true,
    media_file_token: path.into_inner().token,
  }))
}
