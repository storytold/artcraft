use std::sync::Arc;

use actix_multipart::form::MultipartForm;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};

use artcraft_api_defs::media_file::project::upload_new_mood_board_project::UploadNewMoodBoardProjectSuccessResponse;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::media_files::upload::project::project_upload_shared::{save_new_project, NewProjectMultipartForm, MOOD_BOARD_PROJECT_CONFIG};
use crate::state::server_state::ServerState;

/// Save a new mood board project (multipart JSON document upload).
///
/// You'll get back a media file token for accessing and querying the project
/// in the future. To save further changes to the same project, call the
/// corresponding update endpoint — only call this endpoint again if the user
/// wants to save a brand new copy.
///
/// Anonymous (logged-out) users may also save projects.
#[utoipa::path(
  post,
  tag = "Media Files (Projects)",
  path = "/v1/media_files/upload/project/mood_board/new",
  responses(
    (status = 200, description = "New mood board project saved", body = UploadNewMoodBoardProjectSuccessResponse),
    (status = 400, description = "Bad input"),
    (status = 401, description = "Not authorized"),
    (status = 500, description = "Server error"),
  ),
  params(
    (
      "request" = NewProjectMultipartForm,
      description = "IF VIEWING DOCS, PLEASE SEE BOTTOM OF PAGE `NewProjectMultipartForm` (Under 'Schema') FOR DETAILS ON FIELDS AND NULLABILITY."
    ),
  )
)]
pub async fn upload_new_mood_board_project_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>,
  MultipartForm(form): MultipartForm<NewProjectMultipartForm>,
) -> Result<Json<UploadNewMoodBoardProjectSuccessResponse>, CommonWebError> {
  let media_file_token = save_new_project(
    &http_request, &server_state, &MOOD_BOARD_PROJECT_CONFIG, form).await?;

  Ok(Json(UploadNewMoodBoardProjectSuccessResponse {
    success: true,
    media_file_token,
  }))
}
