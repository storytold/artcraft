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
use mysql_queries::queries::users::api_or_web_sessions::get_api_or_web_session_user_by_mcp_private_session_token::{
  get_api_or_web_session_user_by_mcp_private_session_token,
  GetApiOrWebSessionUserByMcpPrivateSessionTokenArgs,
};
use mysql_queries::queries::users::api_or_web_sessions::get_api_or_web_session_user_by_session_token::{
  get_api_or_web_session_user_by_session_token, GetApiOrWebSessionUserBySessionTokenArgs,
};
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::api_keys::ApiKeyToken;
use tokens::tokens::mcp_session_private::McpSessionPrivateToken;
use tokens::tokens::mcp_sessions::McpSessionToken;
use tokens::tokens::users::UserToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::user_lookup::user_session::session_utils::session_checker::SessionChecker;
use crate::http_server::web_utils::get_authorization_header_api_key::get_authorization_header_api_key;

const ADMIN_ROLE_SLUG: &str = "admin";

/// The authenticated identity behind a request that may come from an API client (`Authorization`
/// header API key), an MCP client (`Authorization` header MCP session credential), or the
/// website (session cookie). Fields common to all auth paths are populated uniformly, so
/// handlers don't need to care which path authenticated the user.
pub struct AnySession {
  pub session_type: AnySessionType,
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

  /// Only present for MCP sessions. This is the session's non-private management `token`, never
  /// the `private_session_token`.
  pub maybe_mcp_session_token: Option<McpSessionToken>,

  /// Anonymous visitor tracking cookie. Only ever present for web sessions.
  pub maybe_avt_token: Option<AnonymousVisitorTrackingToken>,
}

/// Which auth path authenticated the request.
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum AnySessionType {
  Api,
  WebSession,
  McpSession,
}

impl AnySession {
  pub fn is_mod(&self) -> bool {
    self.can_ban_users || self.user_role_slug == ADMIN_ROLE_SLUG
  }
}

/// Authenticate a request as an API-key user, an MCP-session user, or a web-session (cookie)
/// user.
///
/// If an `Authorization` header is present, ONLY the header credential is attempted — a
/// malformed or unknown credential is a 401, never a fallthrough to cookies. Header credentials
/// with the `mcp_session_` prefix are looked up as MCP sessions (live and unexpired only);
/// anything else in the header is looked up as an API key. Without the header, the session
/// cookie is decoded and looked up, and the AVT (anonymous visitor tracking) cookie is captured
/// alongside it.
///
/// No path is cached: every request performs a fresh MySQL lookup. `mysql_executor` can be any
/// sqlx executor — prefer passing an already-open connection (`&mut *connection`) so the lookup
/// reuses it rather than acquiring a fresh one from the pool.
pub async fn require_any_session_or_key<'c, E>(
  http_request: &HttpRequest,
  session_checker: &SessionChecker,
  avt_cookie_manager: &AvtCookieManager,
  mysql_executor: E,
) -> Result<AnySession, CommonWebError>
  where E: 'c + Executor<'c, Database = MySql>
{
  if http_request.headers().contains_key(header::AUTHORIZATION) {
    authenticate_by_header_credential(http_request, mysql_executor).await
  } else {
    authenticate_by_web_session(http_request, session_checker, avt_cookie_manager, mysql_executor).await
  }
}

async fn authenticate_by_header_credential<'c, E>(
  http_request: &HttpRequest,
  mysql_executor: E,
) -> Result<AnySession, CommonWebError>
  where E: 'c + Executor<'c, Database = MySql>
{
  let credential = match get_authorization_header_api_key(http_request) {
    Some(credential) => credential,
    None => {
      warn!("Authorization header present but not a usable credential");
      return Err(CommonWebError::NotAuthorized);
    }
  };

  // MCP session credentials live in the same header (and forms) as API keys; the token prefix
  // is what tells them apart. (If MCP credentials ever become JWTs, add heuristics here.)
  if credential.as_str_be_careful().starts_with(McpSessionPrivateToken::token_prefix()) {
    let private_session_token = McpSessionPrivateToken::new_from_str(credential.as_str_be_careful());
    return authenticate_by_mcp_session(&private_session_token, mysql_executor).await;
  }

  let maybe_record = get_api_or_web_session_user_by_api_key(GetApiOrWebSessionUserByApiKeyArgs {
    api_key: &credential,
    mysql_executor,
    phantom: PhantomData,
  })
    .await
    .map_err(|err| {
      warn!("API key user lookup error: {:?}", err);
      CommonWebError::from_error(err)
    })?;

  // A missing or soft-deleted key (or a key whose owner no longer exists) is a 401, not a leak
  // of which case occurred.
  let record = match maybe_record {
    Some(record) => record,
    None => {
      warn!("No live API key user for presented key: {:?}", credential);
      return Err(CommonWebError::NotAuthorized);
    }
  };

  into_session_rejecting_banned(record, AnySessionType::Api, None)
}

async fn authenticate_by_mcp_session<'c, E>(
  private_session_token: &McpSessionPrivateToken,
  mysql_executor: E,
) -> Result<AnySession, CommonWebError>
  where E: 'c + Executor<'c, Database = MySql>
{
  let maybe_record = get_api_or_web_session_user_by_mcp_private_session_token(
    GetApiOrWebSessionUserByMcpPrivateSessionTokenArgs {
      private_session_token,
      mysql_executor,
      phantom: PhantomData,
    })
    .await
    .map_err(|err| {
      warn!("MCP session user lookup error: {:?}", err);
      CommonWebError::from_error(err)
    })?;

  // A missing, terminated, or expired session (or one whose owner no longer exists) is a 401,
  // not a leak of which case occurred.
  let record = match maybe_record {
    Some(record) => record,
    None => {
      warn!("No live MCP session for presented credential");
      return Err(CommonWebError::NotAuthorized);
    }
  };

  into_session_rejecting_banned(record, AnySessionType::McpSession, None)
}

async fn authenticate_by_web_session<'c, E>(
  http_request: &HttpRequest,
  session_checker: &SessionChecker,
  avt_cookie_manager: &AvtCookieManager,
  mysql_executor: E,
) -> Result<AnySession, CommonWebError>
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

  into_session_rejecting_banned(record, AnySessionType::WebSession, maybe_avt_token)
}

fn into_session_rejecting_banned(
  record: ApiOrWebSessionUserRecord,
  session_type: AnySessionType,
  maybe_avt_token: Option<AnonymousVisitorTrackingToken>,
) -> Result<AnySession, CommonWebError> {
  if record.is_banned {
    warn!("user is banned: {:?}", record.user_token.as_str());
    return Err(CommonWebError::NotAuthorized);
  }

  Ok(AnySession {
    session_type,
    user_token: record.user_token,
    username: record.username,
    display_name: record.display_name,
    email_address: record.email_address,
    user_role_slug: record.user_role_slug,
    can_ban_users: record.can_ban_users,
    maybe_feature_flags: record.maybe_feature_flags,
    maybe_api_key_token: record.maybe_api_key_token,
    maybe_mcp_session_token: record.maybe_mcp_session_token,
    maybe_avt_token,
  })
}

#[cfg(test)]
mod tests {
  //! DATABASE TESTS: these connect to the guarded MySQL test database (see the `mysql_testing`
  //! crate — never production, never the local dev database) and drive the real lookup with
  //! dummy Actix HTTP requests. They RUN BY DEFAULT under `cargo test`; on machines without a
  //! local MySQL, skip them with:
  //!
  //! ```bash
  //! SQLX_OFFLINE=true cargo test -p storyteller-web --features skip_database_tests
  //! ```
  //!
  //! They run in PARALLEL: every test creates its own users, API keys, and MCP sessions.

  use actix_web::cookie::Cookie;
  use actix_web::test::TestRequest;

  use actix_artcraft::sessions::user_sessions::http_user_session_manager::HttpUserSessionManager;
  use artcraft_api_keys::ArtcraftApiKey;
  use mysql_queries::queries::api_keys::insert_api_key::{insert_api_key, InsertApiKeyArgs};
  use mysql_testing::fixtures::mcp_sessions::{create_test_mcp_session, force_expire_mcp_session};
  use mysql_testing::fixtures::users::{create_test_user, TestUser};
  use mysql_queries::queries::mcp_sessions::revoke_mcp_session::{
    revoke_mcp_session, RevokeMcpSessionArgs,
  };
  use sqlx::MySqlPool;

  use super::*;

  const TEST_COOKIE_DOMAIN: &str = "localhost";
  const TEST_COOKIE_SECRET: &str = "test_cookie_secret";

  mod web_session_lookups {
    use super::*;

    #[tokio::test]
    #[cfg_attr(feature = "skip_database_tests", ignore)]
    async fn web_session_cookie_authenticates() {
      let harness = LookupHarness::create().await;
      let user = harness.create_user().await;

      let request = harness.request_with_session_cookie(&user);
      let session = harness.require(&request).await.expect("web session should authenticate");

      assert_eq!(session.session_type, AnySessionType::WebSession);
      assert_eq!(session.user_token, user.user_token);
      assert_eq!(session.username, user.username);
      assert_eq!(session.email_address, user.email_address);
      assert!(session.maybe_api_key_token.is_none());
      assert!(session.maybe_mcp_session_token.is_none());
    }

    #[tokio::test]
    #[cfg_attr(feature = "skip_database_tests", ignore)]
    async fn no_credentials_at_all_is_rejected() {
      let harness = LookupHarness::create().await;

      let request = TestRequest::default().to_http_request();
      let result = harness.require(&request).await;

      assert!(matches!(result, Err(CommonWebError::NotAuthorized)));
    }
  }

  mod api_key_lookups {
    use super::*;

    #[tokio::test]
    #[cfg_attr(feature = "skip_database_tests", ignore)]
    async fn api_key_authenticates() {
      let harness = LookupHarness::create().await;
      let user = harness.create_user().await;
      let api_key = harness.create_api_key(&user).await;

      let request = request_with_bearer(api_key.as_str_be_careful());
      let session = harness.require(&request).await.expect("API key should authenticate");

      assert_eq!(session.session_type, AnySessionType::Api);
      assert_eq!(session.user_token, user.user_token);
      assert!(session.maybe_api_key_token.is_some());
      assert!(session.maybe_mcp_session_token.is_none());
      assert!(session.maybe_avt_token.is_none());
    }

    #[tokio::test]
    #[cfg_attr(feature = "skip_database_tests", ignore)]
    async fn unknown_api_key_is_rejected() {
      let harness = LookupHarness::create().await;

      let request = request_with_bearer("artcraft_api_no_such_key_0000000000000000");
      let result = harness.require(&request).await;

      assert!(matches!(result, Err(CommonWebError::NotAuthorized)));
    }
  }

  mod mcp_session_lookups {
    use super::*;

    #[tokio::test]
    #[cfg_attr(feature = "skip_database_tests", ignore)]
    async fn mcp_session_authenticates() {
      let harness = LookupHarness::create().await;
      let user = harness.create_user().await;
      let mcp_session = create_test_mcp_session(&harness.pool, &user.user_token)
        .await
        .expect("create mcp session");

      let request = request_with_bearer(mcp_session.private_session_token.as_str());
      let session = harness.require(&request).await.expect("MCP session should authenticate");

      assert_eq!(session.session_type, AnySessionType::McpSession);
      assert_eq!(session.user_token, user.user_token);
      assert_eq!(session.maybe_mcp_session_token, Some(mcp_session.token));
      assert!(session.maybe_api_key_token.is_none());
      assert!(session.maybe_avt_token.is_none());
    }

    #[tokio::test]
    #[cfg_attr(feature = "skip_database_tests", ignore)]
    async fn expired_mcp_session_is_rejected() {
      let harness = LookupHarness::create().await;
      let user = harness.create_user().await;
      let mcp_session = create_test_mcp_session(&harness.pool, &user.user_token)
        .await
        .expect("create mcp session");
      force_expire_mcp_session(&harness.pool, &mcp_session.token)
        .await
        .expect("expire mcp session");

      let request = request_with_bearer(mcp_session.private_session_token.as_str());
      let result = harness.require(&request).await;

      assert!(matches!(result, Err(CommonWebError::NotAuthorized)));
    }

    #[tokio::test]
    #[cfg_attr(feature = "skip_database_tests", ignore)]
    async fn revoked_mcp_session_is_rejected() {
      let harness = LookupHarness::create().await;
      let user = harness.create_user().await;
      let mcp_session = create_test_mcp_session(&harness.pool, &user.user_token)
        .await
        .expect("create mcp session");

      let mut connection = harness.pool.acquire().await.expect("acquire for revoke");
      let revoked = revoke_mcp_session(RevokeMcpSessionArgs {
        private_session_token: &mcp_session.private_session_token,
        mysql_executor: &mut *connection,
        phantom: PhantomData,
      })
      .await
      .expect("revoke mcp session");
      assert_eq!(revoked, 1);

      let request = request_with_bearer(mcp_session.private_session_token.as_str());
      let result = harness.require(&request).await;

      assert!(matches!(result, Err(CommonWebError::NotAuthorized)));
    }

    #[tokio::test]
    #[cfg_attr(feature = "skip_database_tests", ignore)]
    async fn unknown_mcp_credential_is_rejected() {
      let harness = LookupHarness::create().await;

      let request = request_with_bearer("mcp_session_no_such_session_00000000000000000000000000000000");
      let result = harness.require(&request).await;

      assert!(matches!(result, Err(CommonWebError::NotAuthorized)));
    }
  }

  /// The guarded test pool plus the cookie machinery `require_any_session_or_key` needs.
  struct LookupHarness {
    pool: MySqlPool,
    session_cookie_manager: HttpUserSessionManager,
    session_checker: SessionChecker,
    avt_cookie_manager: AvtCookieManager,
  }

  impl LookupHarness {
    async fn create() -> LookupHarness {
      let pool = mysql_testing::pool::create_test_pool().await;
      let session_cookie_manager = HttpUserSessionManager::new(TEST_COOKIE_DOMAIN, TEST_COOKIE_SECRET)
        .expect("session cookie manager");
      let session_checker = SessionChecker::new(&session_cookie_manager);
      let avt_cookie_manager =
        AvtCookieManager::new(TEST_COOKIE_DOMAIN, TEST_COOKIE_SECRET).expect("avt cookie manager");

      LookupHarness {
        pool,
        session_cookie_manager,
        session_checker,
        avt_cookie_manager,
      }
    }

    async fn create_user(&self) -> TestUser {
      create_test_user(&self.pool).await.expect("create test user")
    }

    /// Mint and insert an API key owned by `user`. The key value derives from the (unique)
    /// user token so parallel tests never collide on the `api_key` column.
    async fn create_api_key(&self, user: &TestUser) -> ArtcraftApiKey {
      let entropy = user.user_token.as_str().trim_start_matches("user_").to_string();
      let api_key = ArtcraftApiKey::new_from_str(&format!("artcraft_api_test{entropy}"));
      let mut connection = self.pool.acquire().await.expect("acquire for api key");
      insert_api_key(InsertApiKeyArgs {
        owner_user_token: &user.user_token,
        ip_address: "127.0.0.1",
        name: "test key",
        maybe_description: None,
        api_key: &api_key,
        mysql_executor: &mut *connection,
        phantom: PhantomData,
      })
      .await
      .expect("insert api key");
      api_key
    }

    /// Run the lookup under test against a fresh connection from the test pool.
    async fn require(&self, request: &HttpRequest) -> Result<AnySession, CommonWebError> {
      let mut connection = self.pool.acquire().await.expect("acquire for lookup");
      require_any_session_or_key(
        request,
        &self.session_checker,
        &self.avt_cookie_manager,
        &mut *connection,
      )
      .await
    }

    /// A dummy HTTP request carrying the user's session cookie and no Authorization header.
    fn request_with_session_cookie(&self, user: &TestUser) -> HttpRequest {
      let cookie = self
        .session_cookie_manager
        .create_cookie(&user.session_token, &user.user_token)
        .expect("create session cookie");
      // TestRequest wants an owned cookie with a 'static-compatible lifetime.
      let cookie = Cookie::new("session", cookie.value().to_string());

      TestRequest::default().cookie(cookie).to_http_request()
    }
  }

  /// A dummy HTTP request presenting `credential` as a Bearer Authorization header.
  fn request_with_bearer(credential: &str) -> HttpRequest {
    TestRequest::default()
      .insert_header(("Authorization", format!("Bearer {credential}")))
      .to_http_request()
  }
}
