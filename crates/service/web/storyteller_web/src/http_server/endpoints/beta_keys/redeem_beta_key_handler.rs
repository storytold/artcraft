use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;
use utoipa::ToSchema;

use crate::http_server::session::lookup::user_session_feature_flags::UserSessionFeatureFlags;
use enums_db::by_table::beta_keys::beta_key_product::BetaKeyProduct;
use enums_api::by_table::beta_keys::beta_key_product::BetaKeyProduct as ApiBetaKeyProduct;
use enums_api::by_table::users::user_feature_flag::UserFeatureFlag;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::beta_keys::get_beta_key_by_value::get_beta_key_by_value;
use mysql_queries::queries::beta_keys::redeem_beta_key::redeem_beta_key;
use mysql_queries::queries::users::user::update::set_can_access_studio_transactional::{set_can_access_studio_transactional, SetCanAccessStudioArgs};
use mysql_queries::queries::users::user::update::set_user_feature_flags_transactional::{set_user_feature_flags_transactional, SetUserFeatureFlagTransactionalArgs};
use mysql_queries::queries::users::user_sessions::get_user_session_by_token::SessionUserRecord;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::web_utils::try_delete_session_cache::try_delete_session_cache;
use crate::http_server::web_utils::user_session::require_user_session::{require_user_session, RequireUserSessionError};
use crate::state::server_state::ServerState;

#[derive(Deserialize, ToSchema)]
pub struct RedeemBetaKeyRequest {
  beta_key: String,
}

#[derive(Serialize, ToSchema)]
pub struct RedeemBetaKeySuccessResponse {
  pub success: bool,
}

#[derive(Debug, ToSchema)]
pub enum RedeemBetaKeyError {
  BadInput(String),
  NotAuthorized,
  NotFound,
  RateLimited,
  ServerError,
}

impl ResponseError for RedeemBetaKeyError {
  fn status_code(&self) -> StatusCode {
    match *self {
      RedeemBetaKeyError::BadInput(_) => StatusCode::BAD_REQUEST,
      RedeemBetaKeyError::NotAuthorized => StatusCode::UNAUTHORIZED,
      RedeemBetaKeyError::NotFound => StatusCode::NOT_FOUND,
      RedeemBetaKeyError::RateLimited => StatusCode::TOO_MANY_REQUESTS,
      RedeemBetaKeyError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      RedeemBetaKeyError::BadInput(reason) => reason.to_string(),
      RedeemBetaKeyError::NotAuthorized => "unauthorized".to_string(),
      RedeemBetaKeyError::NotFound => "not found".to_string(),
      RedeemBetaKeyError::RateLimited => "rate limited".to_string(),
      RedeemBetaKeyError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for RedeemBetaKeyError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

/// Redeem a beta key to gain access to a feature
#[utoipa::path(
  post,
  tag = "Beta Keys",
  path = "/v1/beta_keys/redeem",
  responses(
    (status = 200, description = "Success", body = RedeemBetaKeySuccessResponse),
    (status = 400, description = "Bad input", body = RedeemBetaKeyError),
    (status = 401, description = "Not authorized", body = RedeemBetaKeyError),
    (status = 404, description = "Not found", body = RedeemBetaKeyError),
    (status = 429, description = "Rate limited", body = RedeemBetaKeyError),
    (status = 500, description = "Server error", body = RedeemBetaKeyError),
  ),
  params(
    ("request" = RedeemBetaKeyRequest, description = "Payload for Request"),
  )
)]
pub async fn redeem_beta_key_handler(
  http_request: HttpRequest,
  request: web::Json<RedeemBetaKeyRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<HttpResponse, RedeemBetaKeyError>
{
  let user_session = require_user_session(&http_request, &server_state)
      .await
      .map_err(|err| match err {
        RequireUserSessionError::ServerError => RedeemBetaKeyError::ServerError,
        RequireUserSessionError::NotAuthorized => RedeemBetaKeyError::NotAuthorized,
      })?;

  let rate_limiter = &server_state.redis_rate_limiters.logged_out;

  if let Err(_err) = rate_limiter.rate_limit_request(&http_request).await {
    return Err(RedeemBetaKeyError::RateLimited);
  }

  let maybe_beta_key = get_beta_key_by_value(&request.beta_key, &server_state.mysql_pool)
      .await
      .map_err(|err| {
        warn!("Error getting beta key by value: {:?}", &err);
        RedeemBetaKeyError::ServerError
      })?;

  let beta_key = match maybe_beta_key {
    Some(beta_key) => beta_key,
    None => return Err(RedeemBetaKeyError::NotFound),
  };

  if beta_key.maybe_redeemed_at.is_some() || beta_key.maybe_redeemer_user_token.is_some() {
    return Err(RedeemBetaKeyError::BadInput("beta key already redeemed".to_string()));
  }

  let ip_address = get_request_ip(&http_request);

  match beta_key.product {
    BetaKeyProduct::Studio => {

      enroll_in_studio(&request, &server_state, &user_session, &ip_address)
          .await
          .map_err(|err| {
            warn!("Error enrolling in studio: {:?}", &err);
            RedeemBetaKeyError::ServerError
          })?;
    }
  }

  try_delete_session_cache(&http_request, &server_state);

  let response = RedeemBetaKeySuccessResponse {
    success: true,
  };

  let body = serde_json::to_string(&response)
      .map_err(|_e| RedeemBetaKeyError::ServerError)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}

async fn enroll_in_studio(
  request: &RedeemBetaKeyRequest,
  server_state: &ServerState,
  user_session: &SessionUserRecord,
  ip_address: &str,
) -> Result<(), RedeemBetaKeyError> {
  let mut user_feature_flags =
      UserSessionFeatureFlags::new(user_session.maybe_feature_flags.as_deref());

  user_feature_flags.add_flags([
    UserFeatureFlag::Studio,
    UserFeatureFlag::VideoStyleTransfer,
  ]);

  let mut transaction = server_state.mysql_pool.begin()
      .await
      .map_err(|e| {
        warn!("Could not open transaction: {:?}", e);
        RedeemBetaKeyError::ServerError
      })?;

  set_user_feature_flags_transactional(SetUserFeatureFlagTransactionalArgs {
    subject_user_token: &user_session.user_token,
    maybe_feature_flags: user_feature_flags.maybe_serialize_string().as_deref(),
    maybe_mod_user_token: None,
    ip_address: &ip_address,
    transaction: &mut transaction,
  }).await
      .map_err(|e| {
        warn!("Could not set flags: {:?}", e);
        RedeemBetaKeyError::ServerError
      })?;

  // NB: This isn't a necessary field, but can be useful for analytics.
  set_can_access_studio_transactional(SetCanAccessStudioArgs {
    subject_user_token: &user_session.user_token,
    can_access_studio: true,
    transaction: &mut transaction,
  }).await
      .map_err(|e| {
        warn!("Could not set can_access_studio: {:?}", e);
        RedeemBetaKeyError::ServerError
      })?;

  redeem_beta_key(&request.beta_key, &user_session.user_token, &mut transaction)
      .await
      .map_err(|e| {
        warn!("Could not redeem beta key: {:?}", e);
        RedeemBetaKeyError::ServerError
      })?;

  transaction.commit()
      .await
      .map_err(|e| {
        warn!("Could not commit transaction: {:?}", e);
        RedeemBetaKeyError::ServerError
      })?;

  Ok(())
}
