use actix_web::http::header;
use actix_web::HttpRequest;
use log::{error, warn};
use sqlx::pool::PoolConnection;
use sqlx::MySql;

use enums::common::visibility::Visibility;
use mysql_queries::queries::users::user_sessions::get_user_session_by_token::SessionUserRecord;
use tokens::tokens::users::UserToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::media_files::upload::upload_error::MediaFileUploadError;
use crate::http_server::user_lookup::api_or_web_session::require_any_session_or_key::{
  require_any_session_or_key, AnySession,
};
use crate::state::server_state::ServerState;

/// The optionally-authenticated identity behind a media file upload.
///
/// Uploads historically allow anonymous (cookie-less) callers, so the cookie path stays
/// OPTIONAL. Header credentials (API keys and MCP sessions) are different: presenting one is an
/// explicit claim of identity, so a bad credential is a 401, never an anonymous fallthrough.
pub struct UploadSessionAuth {
  /// Present when the request authenticated via an `Authorization` header credential (an API
  /// key or an MCP session).
  pub maybe_header_session: Option<AnySession>,

  /// Present when the request carried a valid web-session cookie (and no `Authorization`
  /// header).
  pub maybe_cookie_session: Option<SessionUserRecord>,
}

impl UploadSessionAuth {
  /// The uploading user, whichever auth path identified them. `None` = anonymous upload.
  pub fn maybe_user_token(&self) -> Option<&UserToken> {
    self.maybe_header_session
        .as_ref()
        .map(|session| &session.user_token)
        .or_else(|| {
          self.maybe_cookie_session
              .as_ref()
              .map(|session| session.get_user_token())
        })
  }

  pub fn is_logged_in(&self) -> bool {
    self.maybe_header_session.is_some() || self.maybe_cookie_session.is_some()
  }

  /// The user's preferred result visibility. Only web-session lookups carry preferences;
  /// header-authenticated (API key / MCP) uploads fall back to the caller's default.
  pub fn maybe_preferred_visibility(&self) -> Option<Visibility> {
    self.maybe_cookie_session
        .as_ref()
        .map(|session| session.preferred_tts_result_visibility)
  }
}

/// Read the upload's identity: a REQUIRED `Authorization` header credential (API key or MCP
/// session) when one is present, otherwise an OPTIONAL web-session cookie. Banned users are
/// rejected on both paths.
pub async fn read_upload_session(
  http_request: &HttpRequest,
  server_state: &ServerState,
  mysql_connection: &mut PoolConnection<MySql>,
) -> Result<UploadSessionAuth, MediaFileUploadError> {
  if http_request.headers().contains_key(header::AUTHORIZATION) {
    let session = require_any_session_or_key(
      http_request,
      &server_state.session_checker,
      &server_state.avt_cookie_manager,
      &mut **mysql_connection,
    )
    .await
    .map_err(|err| match err {
      CommonWebError::NotAuthorized => MediaFileUploadError::NotAuthorized,
      other => {
        error!("Header credential lookup error: {:?}", other);
        MediaFileUploadError::ServerError
      }
    })?;

    return Ok(UploadSessionAuth {
      maybe_header_session: Some(session),
      maybe_cookie_session: None,
    });
  }

  let maybe_cookie_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(http_request, mysql_connection)
      .await
      .map_err(|err| {
        error!("Session checker error: {:?}", err);
        MediaFileUploadError::ServerError
      })?;

  if let Some(ref user) = maybe_cookie_session {
    if user.is_banned {
      warn!("user is banned: {:?}", user.get_user_token().as_str());
      return Err(MediaFileUploadError::NotAuthorizedVerbose("user is banned".to_string()));
    }
  }

  Ok(UploadSessionAuth {
    maybe_header_session: None,
    maybe_cookie_session,
  })
}
