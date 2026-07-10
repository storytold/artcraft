use std::sync::Arc;

use actix_multipart::form::MultipartForm;
use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};

use artcraft_api_defs::media_file::project::upload_updated_scene_3d_project::{UploadUpdatedScene3dProjectPathInfo, UploadUpdatedScene3dProjectSuccessResponse};

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::media_files::upload::project::project_upload_config::SCENE_3D_PROJECT_CONFIG;
use crate::http_server::endpoints::media_files::upload::project::update_project::{update_project, UpdateProjectArgs, UpdateProjectMultipartForm};
use crate::state::server_state::ServerState;

/// Overwrite an existing 3D scene project (multipart JSON document upload).
///
/// Only the project's creator may update it: user-owned projects require a
/// matching user session, and anonymously created projects require a matching
/// anonymous visitor token. To save a brand new copy instead, call the
/// corresponding "new" endpoint.
#[utoipa::path(
  post,
  tag = "Media Files (Projects)",
  path = "/v1/media_files/upload/project/scene_3d/update/{token}",
  responses(
    (status = 200, description = "3d scene project updated", body = UploadUpdatedScene3dProjectSuccessResponse),
    (status = 400, description = "Bad input"),
    (status = 401, description = "Not authorized"),
    (status = 404, description = "Not found"),
    (status = 500, description = "Server error"),
  ),
  params(
    ("path" = UploadUpdatedScene3dProjectPathInfo, description = "Path for Request"),
    (
      "request" = UpdateProjectMultipartForm,
      description = "IF VIEWING DOCS, PLEASE SEE BOTTOM OF PAGE `UpdateProjectMultipartForm` (Under 'Schema') FOR DETAILS ON FIELDS AND NULLABILITY."
    ),
  )
)]
pub async fn upload_updated_scene_3d_project_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>,
  path: Path<UploadUpdatedScene3dProjectPathInfo>,
  MultipartForm(form): MultipartForm<UpdateProjectMultipartForm>,
) -> Result<Json<UploadUpdatedScene3dProjectSuccessResponse>, CommonWebError> {
  update_project(UpdateProjectArgs {
    http_request: &http_request,
    server_state: &server_state,
    config: &SCENE_3D_PROJECT_CONFIG,
    media_file_token: &path.token,
    form,
  }).await?;

  Ok(Json(UploadUpdatedScene3dProjectSuccessResponse {
    success: true,
    media_file_token: path.into_inner().token,
  }))
}
