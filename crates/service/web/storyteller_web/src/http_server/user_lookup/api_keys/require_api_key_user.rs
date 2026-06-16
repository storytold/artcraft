use std::marker::PhantomData;

use actix_web::HttpRequest;
use log::{info, warn};
use sqlx::MySqlConnection;

use mysql_queries::queries::api_keys::get_api_key_user_by_value::{
  get_api_key_user_by_value, GetApiKeyUserByValueArgs,
};
use tokens::tokens::api_keys::ApiKeyToken;
use tokens::tokens::users::UserToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::get_authorization_header_api_key::get_authorization_header_api_key;

/// The authenticated identity behind an API-key request — the API-key analogue of a cookie
/// `SessionUserRecord`, but deliberately minimal (just what the omni-api handlers need).
///
/// Unlike cookie sessions, this is **never** cached in Redis: every request performs a fresh MySQL
/// lookup.
pub struct UserApiSession {
  pub api_key_token: ApiKeyToken,
  pub user_token: UserToken,
  pub is_banned: bool,
}

/// Authenticate a request using the API key in its `Authorization` header (see
/// `get_authorization_header_api_key` for the accepted formats).
///
/// Returns `CommonWebError::NotAuthorized` (401) when the header is missing/unparseable, when the
/// key does not match a live (non-soft-deleted) API key whose owning user still exists, or when
/// that owner is banned. `mysql_executor` can be any sqlx executor — pass `&mut *connection` to
/// reuse a connection the handler already holds.
pub async fn require_api_key_user(
  http_request: &HttpRequest,
  mysql_connection: &mut MySqlConnection,
) -> Result<UserApiSession, CommonWebError> {
  let api_key = match get_authorization_header_api_key(http_request) {
    Some(api_key) => api_key,
    None => {
      warn!("Missing or malformed Authorization header API key");
      return Err(CommonWebError::NotAuthorized);
    }
  };

  let maybe_record = get_api_key_user_by_value(GetApiKeyUserByValueArgs {
    api_key: &api_key,
    mysql_executor: &mut *mysql_connection,
    phantom: PhantomData,
  })
    .await
    .map_err(|err| {
      warn!("API key user lookup error: {:?}", err);
      CommonWebError::from_error(err)
    })?;

  // A missing or soft-deleted key (or a key whose owner no longer exists) is a 401, not a leak of
  // which case occurred.
  let record = match maybe_record {
    Some(record) => record,
    None => {
      warn!("No live API key user for presented key: {:?}", api_key);
      return Err(CommonWebError::NotAuthorized);
    }
  };

  if record.is_banned {
    warn!("API key owner is banned: {:?}", record.user_token.as_str());
    return Err(CommonWebError::NotAuthorized);
  }

  info!(
    "API key user authenticated: api_key_token={:?} user_token={:?}",
    record.api_key_token.as_str(),
    record.user_token.as_str(),
  );

  Ok(UserApiSession {
    api_key_token: record.api_key_token,
    user_token: record.user_token,
    is_banned: record.is_banned,
  })
}
