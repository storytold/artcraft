use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;
use serde::Serialize;
use sqlx::MySqlPool;
use utoipa::ToSchema;

use errors::AnyhowResult;
use mysql_queries::queries::generic_inference::web::get_inference_job_status::get_inference_job_status;
use mysql_queries::queries::media_files::get::get_media_file::get_media_file;
use mysql_queries::queries::model_weights::get::get_weight::get_weight_by_token;
use mysql_queries::queries::prompts::get_prompt::get_prompt;
use mysql_queries::queries::users::user_profiles::get_user_profile_by_token::get_user_profile_by_token;
use mysql_queries::queries::users::user_profiles::get_user_profile_by_username::get_user_profile_by_username;
use tokens::tokens::generic_inference_jobs::InferenceJobToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::prompts::PromptToken;
use tokens::tokens::users::UserToken;

use crate::http_server::web_utils::serialize_as_json_error::serialize_as_json_error;
use crate::http_server::web_utils::user_session::require_moderator::{require_moderator, RequireModeratorError, UseDatabase};
use crate::state::server_state::ServerState;

/// For the URL PathInfo
#[derive(Deserialize, ToSchema)]
pub struct ModeratorTokenInfoPath {
  token: String,
}
#[derive(Serialize, ToSchema)]
pub struct ModeratorTokenInfoResponse {
  pub success: bool,

  /// Json-encoded payload
  pub maybe_payload: Option<String>,
}

#[derive(Debug, Serialize, ToSchema)]
pub enum ModeratorTokenInfoError {
  ServerError,
  Unauthorized,
}

impl ResponseError for ModeratorTokenInfoError {
  fn status_code(&self) -> StatusCode {
    match *self {
      ModeratorTokenInfoError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      ModeratorTokenInfoError::Unauthorized => StatusCode::UNAUTHORIZED,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using DeriveMore since Clion doesn't understand it.
impl fmt::Display for ModeratorTokenInfoError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

#[utoipa::path(
  get,
  tag = "Moderation",
  path = "/v1/moderation/token_info/{token}",
  responses(
    (status = 200, description = "Found", body = ModeratorTokenInfoResponse),
    (status = 401, description = "Not authorized", body = ModeratorTokenInfoError),
    (status = 500, description = "Server error", body = ModeratorTokenInfoError),
  ),
  params(
    ("path" = ModeratorTokenInfoPath, description = "Path for Request")
  )
)]
pub async fn moderator_get_token_info_handler(
  path: Path<ModeratorTokenInfoPath>,
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, ModeratorTokenInfoError> {

  let user_session = require_moderator(&http_request, &server_state, UseDatabase::GrabNewConnection)
      .await
      .map_err(|err| match err {
        RequireModeratorError::ServerError => ModeratorTokenInfoError::ServerError,
        RequireModeratorError::NotAuthorized => ModeratorTokenInfoError::Unauthorized,
      })?;

  let token = path.token.trim();
  let maybe_result = get_entity_from_token(&server_state.mysql_pool, &path.token)
      .await
      .map_err(|err| {
        warn!("get tts pending count error: {:?}", err);
        ModeratorTokenInfoError::ServerError
      })?;

  let response = ModeratorTokenInfoResponse {
    success: true,
    maybe_payload: maybe_result,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| ModeratorTokenInfoError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}

const LEGACY_USER_TOKEN_PREFIX : &str = "U:";

async fn get_entity_from_token(mysql_pool: &MySqlPool, token: &str) -> AnyhowResult<Option<String>> {

  if token.starts_with(UserToken::token_prefix()) || token.starts_with(LEGACY_USER_TOKEN_PREFIX) {
    let typed_token = UserToken::new_from_str(token);
    let maybe_result = get_user_profile_by_token(&typed_token, mysql_pool)
        .await?;
    return maybe_to_string(maybe_result);
  }

  if token.starts_with(MediaFileToken::token_prefix()) {
    let typed_token = MediaFileToken::new_from_str(token);
    let maybe_result = get_media_file(&typed_token, true, mysql_pool)
        .await?;
    return maybe_to_string(maybe_result);
  }

  if token.starts_with(ModelWeightToken::token_prefix()) {
    let typed_token = ModelWeightToken::new_from_str(token);
    let maybe_result = get_weight_by_token(&typed_token, true, mysql_pool)
        .await?;
    return maybe_to_string(maybe_result);
  }

  if token.starts_with(InferenceJobToken::token_prefix()) {
    let typed_token = InferenceJobToken::new_from_str(token);
    let maybe_result = get_inference_job_status(&typed_token, mysql_pool)
        .await?;
    return maybe_to_string(maybe_result);
  }

  if token.starts_with(PromptToken::token_prefix()) {
    let typed_token = PromptToken::new_from_str(token);
    let maybe_result = get_prompt(&typed_token, mysql_pool)
        .await?;
    return maybe_to_string(maybe_result);
  }

  // If nothing else works, try username lookup
  let username = token.to_lowercase();
  let maybe_result = get_user_profile_by_username(&username, mysql_pool)
      .await?;

  maybe_to_string(maybe_result)
}

fn maybe_to_string<T: Serialize>(maybe_data: Option<T>) -> AnyhowResult<Option<String>> {
  let maybe_stringified = maybe_data.map(|data| serde_json::to_string(&data))
      .transpose()?;
  Ok(maybe_stringified)
}