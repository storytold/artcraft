use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;
use utoipa::ToSchema;

use crockford::crockford_entropy_lower;
use enums::by_table::beta_keys::beta_key_product::BetaKeyProduct;
use mysql_queries::queries::beta_keys::insert_batch_beta_keys::{insert_batch_beta_keys, InsertBatchArgs};
use mysql_queries::queries::users::user_profiles::get_user_profile_by_username::get_user_profile_by_username;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::web_utils::user_session::require_moderator::{require_moderator, RequireModeratorError, UseDatabase};
use crate::state::server_state::ServerState;

const MAXIMUM_KEYS : u32 = 100;

#[derive(Deserialize, ToSchema)]
pub struct CreateBetaKeysRequest {
  uuid_idempotency_token: String,

  /// The username these keys will be assigned to (as the "referrer" that hands out the keys)
  maybe_referrer_username: Option<String>,

  /// A note that will be assigned to each key, if present. This can be edited later.
  maybe_note: Option<String>,

  /// The number of keys to generate. Between 1 and 100.
  number_of_keys: u32,
}

#[derive(Serialize, ToSchema)]
pub struct CreateBetaKeysSuccessResponse {
  pub success: bool,
  pub beta_keys: Vec<String>,
}

#[derive(Debug, ToSchema)]
pub enum CreateBetaKeysError {
  BadInput(String),
  NotAuthorized,
  ServerError,
}

impl ResponseError for CreateBetaKeysError {
  fn status_code(&self) -> StatusCode {
    match *self {
      CreateBetaKeysError::BadInput(_) => StatusCode::BAD_REQUEST,
      CreateBetaKeysError::NotAuthorized => StatusCode::UNAUTHORIZED,
      CreateBetaKeysError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      CreateBetaKeysError::BadInput(reason) => reason.to_string(),
      CreateBetaKeysError::NotAuthorized => "unauthorized".to_string(),
      CreateBetaKeysError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for CreateBetaKeysError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

/// Create beta keys in bulk, and possibly assign them to a referrer user.
#[utoipa::path(
  post,
  tag = "Beta Keys",
  path = "/v1/beta_keys/create",
  responses(
    (status = 200, description = "Success", body = CreateBetaKeysSuccessResponse),
    (status = 400, description = "Bad input", body = CreateBetaKeysError),
    (status = 401, description = "Not authorized", body = CreateBetaKeysError),
    (status = 500, description = "Server error", body = CreateBetaKeysError),
  ),
  params(
    ("request" = CreateBetaKeysRequest, description = "Payload for Request"),
  )
)]
pub async fn create_beta_keys_handler(
  http_request: HttpRequest,
  request: web::Json<CreateBetaKeysRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<HttpResponse, CreateBetaKeysError>
{
  let user_session = require_moderator(&http_request, &server_state, UseDatabase::GrabNewConnection)
      .await
      .map_err(|err| match err {
        RequireModeratorError::ServerError => CreateBetaKeysError::ServerError,
        RequireModeratorError::NotAuthorized => CreateBetaKeysError::NotAuthorized,
      })?;

  let mut maybe_referrer_user_token = None;

  if let Some(username) = &request.maybe_referrer_username {
    let username = username.to_lowercase();
    let maybe_user = get_user_profile_by_username(&username, &server_state.mysql_pool)
        .await
        .map_err(|err| {
          warn!("Error inserting beta keys: {:?}", err);
          CreateBetaKeysError::ServerError
        })?;

    let user = match maybe_user {
      Some(user) => user,
      None => {
        return Err(CreateBetaKeysError::BadInput("referrer user not found".to_string()));
      }
    };

    maybe_referrer_user_token = Some(user.user_token);
  }

  let number_of_keys = request.number_of_keys.min(MAXIMUM_KEYS);

  let beta_keys = (0..number_of_keys).map(|_| {
    crockford_entropy_lower(8)
  }).collect::<Vec::<String>>();

  insert_batch_beta_keys(InsertBatchArgs {
    product: BetaKeyProduct::Studio,
    creator_user_token: &user_session.user_token,
    maybe_referrer_user_token: maybe_referrer_user_token.as_ref(),
    maybe_note: request.maybe_note.as_deref(),
    beta_keys: &beta_keys,
    mysql_pool: &server_state.mysql_pool,
  }).await.map_err(|err| {
    warn!("Error inserting beta keys: {:?}", err);
    CreateBetaKeysError::ServerError
  })?;

  let response = CreateBetaKeysSuccessResponse {
    success: true,
    beta_keys,
  };

  let body = serde_json::to_string(&response)
      .map_err(|_e| CreateBetaKeysError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}

