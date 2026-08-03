use std::marker::PhantomData;

use actix_web::http::header;
use actix_web::HttpRequest;
use log::warn;
use sqlx::{Executor, MySql};

use actix_artcraft::sessions::anonymous_visitor_tracking::avt_cookie_manager::AvtCookieManager;
use mysql_queries::queries::users::api_or_web_sessions::api_or_web_session_user_record::ApiOrWebSessionUserRecord;
use mysql_queries::queries::users::api_or_web_sessions::get_api_or_web_session_user_by_api_key::{
  get_api_or_web_session_user_by_api_key, GetApiOrWebSessionUserByApiKeyArgs,
};
use mysql_queries::queries::users::api_or_web_sessions::get_api_or_web_session_user_by_session_token::{
  get_api_or_web_session_user_by_session_token, GetApiOrWebSessionUserBySessionTokenArgs,
};
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::api_keys::ApiKeyToken;
use tokens::tokens::users::UserToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::user_lookup::user_session::session_utils::session_checker::SessionChecker;
use crate::http_server::web_utils::get_authorization_header_api_key::get_authorization_header_api_key;

const ADMIN_ROLE_SLUG: &str = "admin";

/// The authenticated identity behind a request that may come from either an API client
/// (`Authorization` header API key) or the website (session cookie). Fields common to both auth
/// paths are populated uniformly, so handlers don't need to care which path authenticated the
/// user.
pub struct ApiOrWebSession {
  pub session_type: SessionType,
  pub user_token: UserToken,
  pub username: String,
  pub display_name: String,
  pub email_address: String,

  pub user_role_slug: String,
  pub can_ban_users: bool,

  /// Optional comma-separated list of parseable `UserFeatureFlag` enum features.
  pub maybe_feature_flags: Option<String>,

  /// Only present for API-key sessions.
  pub maybe_api_key_token: Option<ApiKeyToken>,

  /// Anonymous visitor tracking cookie. Only ever present for web sessions.
  pub maybe_avt_token: Option<AnonymousVisitorTrackingToken>,
}

/// Which auth path authenticated the request.
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum SessionType {
  Api,
  WebSession,
}

impl ApiOrWebSession {
  pub fn is_mod(&self) -> bool {
    self.can_ban_users || self.user_role_slug == ADMIN_ROLE_SLUG
  }
}

/// Authenticate a request as either an API-key user or a web-session (cookie) user.
///
/// If an `Authorization` header is present, ONLY the API-key lookup is attempted — a malformed or
/// unknown key is a 401, never a fallthrough to cookies. Otherwise the session cookie is decoded
/// and looked up, and the AVT (anonymous visitor tracking) cookie is captured alongside it.
///
/// Neither path is cached: every request performs a fresh MySQL lookup. `mysql_executor` can be
/// any sqlx executor — prefer passing an already-open connection (`&mut *connection`) so the
/// lookup reuses it rather than acquiring a fresh one from the pool.
pub async fn require_api_or_web_session<'c, E>(
  http_request: &HttpRequest,
  session_checker: &SessionChecker,
  avt_cookie_manager: &AvtCookieManager,
  mysql_executor: E,
) -> Result<ApiOrWebSession, CommonWebError>
  where E: 'c + Executor<'c, Database = MySql>
{
  if http_request.headers().contains_key(header::AUTHORIZATION) {
    authenticate_by_api_key(http_request, mysql_executor).await
  } else {
    authenticate_by_web_session(http_request, session_checker, avt_cookie_manager, mysql_executor).await
  }
}

async fn authenticate_by_api_key<'c, E>(
  http_request: &HttpRequest,
  mysql_executor: E,
) -> Result<ApiOrWebSession, CommonWebError>
  where E: 'c + Executor<'c, Database = MySql>
{
  let api_key = match get_authorization_header_api_key(http_request) {
    Some(api_key) => api_key,
    None => {
      warn!("Authorization header present but not a usable API key");
      return Err(CommonWebError::NotAuthorized);
    }
  };

  let maybe_record = get_api_or_web_session_user_by_api_key(GetApiOrWebSessionUserByApiKeyArgs {
    api_key: &api_key,
    mysql_executor,
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

  into_session_rejecting_banned(record, SessionType::Api, None)
}

async fn authenticate_by_web_session<'c, E>(
  http_request: &HttpRequest,
  session_checker: &SessionChecker,
  avt_cookie_manager: &AvtCookieManager,
  mysql_executor: E,
) -> Result<ApiOrWebSession, CommonWebError>
  where E: 'c + Executor<'c, Database = MySql>
{
  let maybe_session_token = session_checker
      .get_session_token(http_request)
      .map_err(|err| {
        warn!("Session cookie decode error: {:?}", err);
        CommonWebError::from_error(err)
      })?;

  let session_token = match maybe_session_token {
    Some(session_token) => session_token,
    None => {
      warn!("not logged in");
      return Err(CommonWebError::NotAuthorized);
    }
  };

  let maybe_record = get_api_or_web_session_user_by_session_token(GetApiOrWebSessionUserBySessionTokenArgs {
    session_token: &session_token,
    mysql_executor,
    phantom: PhantomData,
  })
    .await
    .map_err(|err| {
      warn!("Web session user lookup error: {:?}", err);
      CommonWebError::from_error(err)
    })?;

  let record = match maybe_record {
    Some(record) => record,
    None => {
      warn!("Valid cookie; invalid session: {}", session_token);
      return Err(CommonWebError::NotAuthorized);
    }
  };

  let maybe_avt_token = avt_cookie_manager.get_avt_token_from_request(http_request);

  into_session_rejecting_banned(record, SessionType::WebSession, maybe_avt_token)
}

fn into_session_rejecting_banned(
  record: ApiOrWebSessionUserRecord,
  session_type: SessionType,
  maybe_avt_token: Option<AnonymousVisitorTrackingToken>,
) -> Result<ApiOrWebSession, CommonWebError> {
  if record.is_banned {
    warn!("user is banned: {:?}", record.user_token.as_str());
    return Err(CommonWebError::NotAuthorized);
  }

  Ok(ApiOrWebSession {
    session_type,
    user_token: record.user_token,
    username: record.username,
    display_name: record.display_name,
    email_address: record.email_address,
    user_role_slug: record.user_role_slug,
    can_ban_users: record.can_ban_users,
    maybe_feature_flags: record.maybe_feature_flags,
    maybe_api_key_token: record.maybe_api_key_token,
    maybe_avt_token,
  })
}
