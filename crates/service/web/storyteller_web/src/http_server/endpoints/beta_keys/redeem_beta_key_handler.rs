use std::sync::Arc;

use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;
use utoipa::ToSchema;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::session::lookup::user_session_feature_flags::UserSessionFeatureFlags;
use enums::by_table::beta_keys::beta_key_product::BetaKeyProduct;
use enums::by_table::users::user_feature_flag::UserFeatureFlag;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::beta_keys::get_beta_key_by_value::get_beta_key_by_value;
use mysql_queries::queries::beta_keys::redeem_beta_key::redeem_beta_key;
use mysql_queries::queries::users::user::update::set_can_access_studio_transactional::{set_can_access_studio_transactional, SetCanAccessStudioArgs};
use mysql_queries::queries::users::user::update::set_user_feature_flags_transactional::{set_user_feature_flags_transactional, SetUserFeatureFlagTransactionalArgs};
use mysql_queries::queries::users::user_sessions::get_user_session_by_token::SessionUserRecord;

use crate::http_server::web_utils::try_delete_session_cache::try_delete_session_cache;
use crate::http_server::web_utils::user_session::require_user_session::require_user_session;
use crate::state::server_state::ServerState;

#[derive(Deserialize, ToSchema)]
pub struct RedeemBetaKeyRequest {
  beta_key: String,
}

#[derive(Serialize, ToSchema)]
pub struct RedeemBetaKeySuccessResponse {
  pub success: bool,
}

/// Redeem a beta key to gain access to a feature
#[utoipa::path(
  post,
  tag = "Beta Keys",
  path = "/v1/beta_keys/redeem",
  responses(
    (status = 200, description = "Success", body = RedeemBetaKeySuccessResponse),
    (status = 400, description = "Bad input", body = CommonWebError),
    (status = 401, description = "Not authorized", body = CommonWebError),
    (status = 404, description = "Not found", body = CommonWebError),
    (status = 429, description = "Rate limited", body = CommonWebError),
    (status = 500, description = "Server error", body = CommonWebError),
  ),
  params(
    ("request" = RedeemBetaKeyRequest, description = "Payload for Request"),
  )
)]
pub async fn redeem_beta_key_handler(
  http_request: HttpRequest,
  request: web::Json<RedeemBetaKeyRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<HttpResponse, CommonWebError>
{
  let user_session = require_user_session(&http_request, &server_state).await?;

  let rate_limiter = &server_state.redis_rate_limiters.logged_out;

  if rate_limiter.rate_limit_request(&http_request).await.is_err() {
    return Err(CommonWebError::TooManyRequests);
  }

  let maybe_beta_key = get_beta_key_by_value(&request.beta_key, &server_state.mysql_pool)
      .await
      .map_err(|err| {
        warn!("Error getting beta key by value: {:?}", &err);
        CommonWebError::from_anyhow_error(err)
      })?;

  let beta_key = match maybe_beta_key {
    Some(beta_key) => beta_key,
    None => return Err(CommonWebError::NotFound),
  };

  if beta_key.maybe_redeemed_at.is_some() || beta_key.maybe_redeemer_user_token.is_some() {
    return Err(CommonWebError::BadInputWithSimpleMessage("beta key already redeemed".to_string()));
  }

  let ip_address = get_request_ip(&http_request);

  match beta_key.product {
    BetaKeyProduct::Studio => {
      enroll_in_studio(&request, &server_state, &user_session, &ip_address).await?;
    }
  }

  try_delete_session_cache(&http_request, &server_state);

  let response = RedeemBetaKeySuccessResponse {
    success: true,
  };

  // `?` via the `From<serde_json::Error>` impl on CommonWebError.
  let body = serde_json::to_string(&response)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}

async fn enroll_in_studio(
  request: &RedeemBetaKeyRequest,
  server_state: &ServerState,
  user_session: &SessionUserRecord,
  ip_address: &str,
) -> Result<(), CommonWebError> {
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
        CommonWebError::from_error(e)
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
        CommonWebError::from_anyhow_error(e)
      })?;

  // NB: This isn't a necessary field, but can be useful for analytics.
  set_can_access_studio_transactional(SetCanAccessStudioArgs {
    subject_user_token: &user_session.user_token,
    can_access_studio: true,
    transaction: &mut transaction,
  }).await
      .map_err(|e| {
        warn!("Could not set can_access_studio: {:?}", e);
        CommonWebError::from_anyhow_error(e)
      })?;

  redeem_beta_key(&request.beta_key, &user_session.user_token, &mut transaction)
      .await
      .map_err(|e| {
        warn!("Could not redeem beta key: {:?}", e);
        CommonWebError::from_anyhow_error(e)
      })?;

  transaction.commit()
      .await
      .map_err(|e| {
        warn!("Could not commit transaction: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  Ok(())
}
