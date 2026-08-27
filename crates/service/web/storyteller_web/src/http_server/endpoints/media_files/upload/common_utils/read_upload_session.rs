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

#[cfg(test)]
mod tests {
  //! DATABASE TESTS: these connect to the guarded MySQL test database (see the `mysql_testing`
  //! crate — never production, never the local dev database) and drive the real helper with
  //! dummy Actix HTTP requests against a test `ServerState`. They RUN BY DEFAULT under
  //! `cargo test`; on machines without a local MySQL, skip them with:
  //!
  //! ```bash
  //! SQLX_OFFLINE=true cargo test -p storyteller-web --features skip_database_tests
  //! ```
  //!
  //! They run in PARALLEL: every test creates its own users, API keys, and MCP sessions.

  use std::marker::PhantomData;

  use actix_web::cookie::Cookie;
  use actix_web::test::TestRequest;
  use actix_web::HttpRequest;

  use mysql_queries::queries::mcp_sessions::revoke_mcp_session::{
    revoke_mcp_session, RevokeMcpSessionArgs,
  };
  use mysql_testing::fixtures::users::{create_test_user, TestUser};

  use crate::http_server::endpoints::omni_gen::generate::video::tests::support::TestHarness;
  use crate::http_server::user_lookup::api_or_web_session::require_any_session_or_key::AnySessionType;

  use super::*;

  mod anonymous_and_cookie_lookups {
    use super::*;

    #[tokio::test]
    #[cfg_attr(feature = "skip_database_tests", ignore)]
    async fn no_credentials_is_an_anonymous_upload() {
      let harness = TestHarness::create().await;

      let request = TestRequest::default().to_http_request();
      let session_auth = read(&harness, &request).await.expect("anonymous should be allowed");

      assert!(!session_auth.is_logged_in());
      assert!(session_auth.maybe_user_token().is_none());
      assert!(session_auth.maybe_header_session.is_none());
      assert!(session_auth.maybe_cookie_session.is_none());
      assert!(session_auth.maybe_preferred_visibility().is_none());
    }

    #[tokio::test]
    #[cfg_attr(feature = "skip_database_tests", ignore)]
    async fn web_session_cookie_identifies_the_user() {
      let harness = TestHarness::create().await;
      let user = create_user(&harness).await;

      let request = request_with_session_cookie(&harness, &user);
      let session_auth = read(&harness, &request).await.expect("cookie session should be read");

      assert!(session_auth.is_logged_in());
      assert_eq!(session_auth.maybe_user_token(), Some(&user.user_token));
      assert!(session_auth.maybe_header_session.is_none());
      // Cookie sessions carry the user's preferences.
      assert!(session_auth.maybe_preferred_visibility().is_some());
    }
  }

  mod header_credential_lookups {
    use super::*;

    #[tokio::test]
    #[cfg_attr(feature = "skip_database_tests", ignore)]
    async fn api_key_identifies_the_user() {
      let harness = TestHarness::create().await;
      let user = create_user(&harness).await;
      let api_key = harness.create_api_key(&user).await;

      let request = request_with_bearer(api_key.as_str_be_careful());
      let session_auth = read(&harness, &request).await.expect("API key should authenticate");

      assert!(session_auth.is_logged_in());
      assert_eq!(session_auth.maybe_user_token(), Some(&user.user_token));
      let header_session = session_auth.maybe_header_session.as_ref().expect("header session");
      assert_eq!(header_session.session_type, AnySessionType::Api);
      assert!(header_session.maybe_api_key_token.is_some());
      // Header lookups don't carry user preferences.
      assert!(session_auth.maybe_preferred_visibility().is_none());
    }

    #[tokio::test]
    #[cfg_attr(feature = "skip_database_tests", ignore)]
    async fn mcp_session_identifies_the_user() {
      let harness = TestHarness::create().await;
      let user = create_user(&harness).await;
      let credential = harness.create_mcp_session(&user).await;

      let request = request_with_bearer(credential.as_str());
      let session_auth = read(&harness, &request).await.expect("MCP session should authenticate");

      assert!(session_auth.is_logged_in());
      assert_eq!(session_auth.maybe_user_token(), Some(&user.user_token));
      let header_session = session_auth.maybe_header_session.as_ref().expect("header session");
      assert_eq!(header_session.session_type, AnySessionType::McpSession);
      assert!(header_session.maybe_mcp_session_token.is_some());
      assert!(session_auth.maybe_preferred_visibility().is_none());
    }

    #[tokio::test]
    #[cfg_attr(feature = "skip_database_tests", ignore)]
    async fn header_credential_wins_over_a_session_cookie() {
      let harness = TestHarness::create().await;
      let cookie_user = create_user(&harness).await;
      let api_key_user = create_user(&harness).await;
      let api_key = harness.create_api_key(&api_key_user).await;

      let cookie = session_cookie(&harness, &cookie_user);
      let request = TestRequest::default()
        .insert_header(("Authorization", format!("Bearer {}", api_key.as_str_be_careful())))
        .cookie(cookie)
        .to_http_request();
      let session_auth = read(&harness, &request).await.expect("header credential should win");

      assert_eq!(session_auth.maybe_user_token(), Some(&api_key_user.user_token));
      assert!(session_auth.maybe_cookie_session.is_none());
    }

    #[tokio::test]
    #[cfg_attr(feature = "skip_database_tests", ignore)]
    async fn unknown_header_credentials_are_rejected_not_anonymous() {
      let harness = TestHarness::create().await;

      for credential in [
        "artcraft_api_no_such_key_0000000000000000",
        "mcp_session_no_such_session_00000000000000000000000000000000",
      ] {
        let request = request_with_bearer(credential);
        let result = read(&harness, &request).await;
        assert!(
          matches!(result, Err(MediaFileUploadError::NotAuthorized)),
          "bad credential {credential:?} must be a 401, not an anonymous fallthrough",
        );
      }
    }

    #[tokio::test]
    #[cfg_attr(feature = "skip_database_tests", ignore)]
    async fn revoked_mcp_session_is_rejected() {
      let harness = TestHarness::create().await;
      let user = create_user(&harness).await;
      let credential = harness.create_mcp_session(&user).await;

      let mut connection = harness.pool.acquire().await.expect("acquire for revoke");
      let revoked = revoke_mcp_session(RevokeMcpSessionArgs {
        private_session_token: &credential,
        mysql_executor: &mut *connection,
        phantom: PhantomData,
      })
      .await
      .expect("revoke mcp session");
      assert_eq!(revoked, 1);

      let request = request_with_bearer(credential.as_str());
      let result = read(&harness, &request).await;

      assert!(matches!(result, Err(MediaFileUploadError::NotAuthorized)));
    }
  }

  /// Run the helper under test against a fresh connection from the test pool.
  async fn read(
    harness: &TestHarness,
    request: &HttpRequest,
  ) -> Result<UploadSessionAuth, MediaFileUploadError> {
    let mut connection = harness.pool.acquire().await.expect("acquire for lookup");
    read_upload_session(request, &harness.server_state, &mut connection).await
  }

  async fn create_user(harness: &TestHarness) -> TestUser {
    create_test_user(&harness.pool).await.expect("create test user")
  }

  /// A dummy HTTP request presenting `credential` as a Bearer Authorization header.
  fn request_with_bearer(credential: &str) -> HttpRequest {
    TestRequest::default()
      .insert_header(("Authorization", format!("Bearer {credential}")))
      .to_http_request()
  }

  /// A dummy HTTP request carrying the user's session cookie and no Authorization header.
  fn request_with_session_cookie(harness: &TestHarness, user: &TestUser) -> HttpRequest {
    TestRequest::default()
      .cookie(session_cookie(harness, user))
      .to_http_request()
  }

  /// The user's session cookie, owned so TestRequest can take it.
  fn session_cookie(harness: &TestHarness, user: &TestUser) -> Cookie<'static> {
    let cookie = harness
      .server_state
      .session_cookie_manager
      .create_cookie(&user.session_token, &user.user_token)
      .expect("create session cookie");
    Cookie::new("session", cookie.value().to_string())
  }
}
