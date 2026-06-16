use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::api_keys::create_api_key::{CreateApiKeyRequest, CreateApiKeySuccessResponse};
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::api_keys::insert_api_key::{insert_api_key, InsertApiKeyArgs};

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::session::lookup::user_session_feature_flags::UserSessionFeatureFlags;
use crate::http_server::web_utils::user_session::require_user_session::require_user_session;
use crate::state::server_state::ServerState;
use crate::util::generate_api_key::generate_api_key;

const MAX_NAME_LEN: usize = 255;
const MAX_DESCRIPTION_LEN: usize = 512;

/// Create a new API key for the logged-in user. The full secret `api_key`
/// value is returned exactly once in this response — it can never be retrieved
/// again afterward.
#[utoipa::path(
  post,
  tag = "API Keys",
  path = "/v1/api_keys/create",
  request_body = CreateApiKeyRequest,
  responses(
    (status = 200, body = CreateApiKeySuccessResponse),
    (status = 400, body = CommonWebError),
    (status = 401, body = CommonWebError),
    (status = 403, body = CommonWebError),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn create_api_key_handler(
  http_request: HttpRequest,
  request: Json<CreateApiKeyRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<CreateApiKeySuccessResponse>, CommonWebError> {
  let mut conn = server_state.mysql_pool.acquire().await.map_err(|err| {
    warn!("MySQL pool error: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let user_session = require_user_session(&http_request, &server_state.session_checker, &mut *conn).await?;

  // API key creation is gated behind the `api_key` feature flag.
  let feature_flags = UserSessionFeatureFlags::new(user_session.maybe_feature_flags.as_deref());

  if !feature_flags.can_create_api_key() {
    warn!("User {:?} attempted to create an API key without the api_key feature flag", user_session.user_token.as_str());
    return Err(CommonWebError::Forbidden);
  }

  let name = request.name.trim().to_string();

  let maybe_description = request.maybe_description.as_ref().map(|s| s.trim().to_string());

  if name.is_empty() {
    return Err(CommonWebError::BadInputWithSimpleMessage("name is empty".to_string()));
  }
  if name.len() > MAX_NAME_LEN {
    return Err(CommonWebError::BadInputWithSimpleMessage(
      format!("name too long (max {} chars)", MAX_NAME_LEN),
    ));
  }

  if let Some(description) = &maybe_description {
    if description.len() > MAX_DESCRIPTION_LEN {
      return Err(CommonWebError::BadInputWithSimpleMessage(
        format!("description too long (max {} chars)", MAX_DESCRIPTION_LEN),
      ));
    }
  }

  let ip_address = get_request_ip(&http_request);

  // Generate the secret once. It is returned to the caller here and never again.
  let api_key = generate_api_key();

  let token = insert_api_key(InsertApiKeyArgs {
    owner_user_token: &user_session.user_token,
    ip_address: &ip_address,
    name: &name,
    maybe_description: maybe_description.as_deref(),
    api_key: &api_key,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("insert_api_key failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  Ok(Json(CreateApiKeySuccessResponse {
    success: true,
    api_key_token: token,
    // Return the full secret value (never the redacted Debug/Display form). This is the only
    // time it is ever exposed.
    api_key: api_key.to_string_be_careful(), // NB: This is okay in this case
  }))
}
