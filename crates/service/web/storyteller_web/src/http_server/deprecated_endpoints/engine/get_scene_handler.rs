use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpMessage, HttpRequest, HttpResponse};
use chrono::{DateTime, Utc};
use log::warn;
use utoipa::ToSchema;

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use enums::by_table::media_files::media_file_type::MediaFileType;
use mysql_queries::queries::media_files::get::get_media_file::get_media_file;
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;

/// For the URL PathInfo
#[derive(Deserialize, ToSchema)]
pub struct GetScenePathInfo {
  token: MediaFileToken,
}

#[derive(Serialize, ToSchema)]
pub struct GetSceneSuccessResponse {
  pub success: bool,
  pub media_file: MediaFileInfo,
}

#[derive(Serialize, ToSchema)]
pub struct MediaFileInfo {
  pub token: MediaFileToken,

  /// Type of media will dictate which fields are populated and what
  /// the frontend should display (eg. video player vs audio player).
  pub media_type: MediaFileType,

  /// URL to the media file
  pub public_bucket_path: String,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}
// NB: Not using derive_more::Display since Clion doesn't understand it.
#[utoipa::path(
  get,
  path = "/v1/engine/scene/{token}",
  responses(
    (status = 200, description = "Found", body = GetSceneSuccessResponse),
    (status = 404, description = "Not found", body = CommonWebError),
    (status = 500, description = "Server error", body = CommonWebError),
  ),
  params(
    ("path" = GetScenePathInfo, description = "Path for Request")
  )
)]
pub async fn get_scene_handler(
  http_request: HttpRequest,
  path: Path<GetScenePathInfo>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, CommonWebError>
{
  let media_file_token = path.into_inner().token;

  let response = modern_media_file_lookup(&media_file_token,
                                          false, &server_state).await?;

  let body = serde_json::to_string(&response)
      .map_err(CommonWebError::from_error)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}

async fn modern_media_file_lookup(
  media_file_token: &MediaFileToken,
  show_deleted_results: bool,
  server_state: &ServerState,
) -> Result<GetSceneSuccessResponse, CommonWebError> {

  let result = get_media_file(
    media_file_token,
    show_deleted_results,
    &server_state.mysql_pool
  ).await;

  let result = match result {
    Err(e) => {
      warn!("query error: {:?}", e);
      return Err(CommonWebError::from_anyhow_error(e));
    }
    Ok(None) => return Err(CommonWebError::NotFound),
    Ok(Some(result)) => result,
  };

  let public_bucket_path = MediaFileBucketPath::from_object_hash(
    &result.public_bucket_directory_hash,
    result.maybe_public_bucket_prefix.as_deref(),
    result.maybe_public_bucket_extension.as_deref())
      .get_full_object_path_str()
      .to_string();

  let maybe_cover_image_public_bucket_path = match result.maybe_model_cover_image_public_bucket_hash
      .as_deref()
  {
    None => None,
    Some(hash) => Some(MediaFileBucketPath::from_object_hash(
      &hash,
      result.maybe_model_cover_image_public_bucket_prefix.as_deref(),
      result.maybe_model_cover_image_public_bucket_extension.as_deref())
        .get_full_object_path_str()
        .to_string()
    )
  };

  Ok(GetSceneSuccessResponse {
    success: true,
    media_file: MediaFileInfo {
      token: result.token,
      media_type: result.media_type,
      public_bucket_path,
      created_at: result.created_at,
      updated_at: result.updated_at,
    },
  })
}

