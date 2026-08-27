use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::mcp_sessions::refresh_mcp_session::{
  RefreshMcpSessionRequest, RefreshMcpSessionSuccessResponse,
};
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::mcp_sessions::refresh_mcp_session::{
  refresh_mcp_session, RefreshMcpSessionArgs,
};

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::get_authorization_header_mcp_private_session_token::get_authorization_header_mcp_private_session_token;
use crate::state::server_state::ServerState;

/// Refresh the calling MCP session, pushing its expiry two weeks out from now. Authenticated
/// by the session's `private_session_token` in the `Authorization` header PLUS its current
/// refresh token in the body — a session cannot bump itself without the refresh token.
///
/// Each success ROTATES the refresh token: the response carries the new one and the one just
/// used becomes invalid. This is deliberately NOT idempotent — a retried refresh (or a stale,
/// wrong, terminated, or expired credential) is a 401, never a replay.
#[utoipa::path(
  post,
  tag = "MCP Sessions",
  path = "/v1/mcp/session/refresh",
  request_body = RefreshMcpSessionRequest,
  responses(
    (status = 200, body = RefreshMcpSessionSuccessResponse),
    (status = 401, body = CommonWebError),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn refresh_mcp_session_handler(
  http_request: HttpRequest,
  request: Json<RefreshMcpSessionRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<RefreshMcpSessionSuccessResponse>, CommonWebError> {
  let private_session_token =
    get_authorization_header_mcp_private_session_token(&http_request)
      .ok_or_else(|| {
        warn!("MCP session refresh without a usable MCP session credential");
        CommonWebError::NotAuthorized
      })?;

  let ip_address = get_request_ip(&http_request);

  let mut conn = server_state.mysql_pool.acquire().await.map_err(|err| {
    warn!("MySQL pool error: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let maybe_new_refresh_token = refresh_mcp_session(RefreshMcpSessionArgs {
    private_session_token: &private_session_token,
    private_refresh_token: &request.private_refresh_token,
    ip_address: &ip_address,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("refresh_mcp_session failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  // An unknown, terminated, or expired session — or a stale/wrong refresh token — is a 401,
  // not a leak of which case occurred.
  let new_refresh_token = match maybe_new_refresh_token {
    Some(new_refresh_token) => new_refresh_token,
    None => {
      warn!("No refreshable MCP session for presented credentials");
      return Err(CommonWebError::NotAuthorized);
    }
  };

  Ok(Json(RefreshMcpSessionSuccessResponse {
    success: true,
    private_refresh_token: new_refresh_token,
  }))
}

#[cfg(test)]
mod tests {
  //! DATABASE TESTS: these connect to the guarded MySQL test database (see the `mysql_testing`
  //! crate — never production, never the local dev database) and drive the real handler with
  //! dummy Actix HTTP requests. They RUN BY DEFAULT under `cargo test`; on machines without a
  //! local MySQL, skip them with:
  //!
  //! ```bash
  //! SQLX_OFFLINE=true cargo test -p storyteller-web --features skip_database_tests
  //! ```

  use actix_web::test::TestRequest;
  use actix_web::web::Data;

  use mysql_queries::queries::mcp_sessions::insert_mcp_session::InsertedMcpSession;
  use mysql_testing::fixtures::mcp_sessions::create_test_mcp_session;
  use tokens::tokens::mcp_session_refresh::McpSessionRefreshToken;

  use crate::http_server::endpoints::omni_gen::generate::video::tests::support::TestHarness;

  use super::*;

  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn valid_refresh_extends_expiry_and_rotates_the_refresh_token() {
    let harness = TestHarness::create().await;
    let mcp_session = create_session(&harness).await;

    let expiry_before = session_expiry(&harness, &mcp_session).await;

    let response = post_refresh(&harness, &mcp_session, &mcp_session.private_refresh_token)
      .await
      .expect("valid refresh should succeed");
    assert!(response.success);
    assert_ne!(
      response.private_refresh_token,
      mcp_session.private_refresh_token,
      "a successful refresh must rotate the refresh token",
    );

    let expiry_after = session_expiry(&harness, &mcp_session).await;
    assert!(expiry_after >= expiry_before, "refresh must not shrink the expiry");

    // The rotation invalidates the old token (non-idempotent by design)...
    let replay = post_refresh(&harness, &mcp_session, &mcp_session.private_refresh_token).await;
    assert!(
      matches!(replay, Err(CommonWebError::NotAuthorized)),
      "a used refresh token must not be replayable",
    );

    // ...while the newly issued token works, rotating again.
    let second = post_refresh(&harness, &mcp_session, &response.private_refresh_token)
      .await
      .expect("the rotated refresh token should work");
    assert_ne!(second.private_refresh_token, response.private_refresh_token);
  }

  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn wrong_refresh_token_is_rejected() {
    let harness = TestHarness::create().await;
    let mcp_session = create_session(&harness).await;

    let wrong_token = McpSessionRefreshToken::generate();
    let result = post_refresh(&harness, &mcp_session, &wrong_token).await;

    assert!(matches!(result, Err(CommonWebError::NotAuthorized)));
  }

  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn refresh_without_a_session_credential_is_rejected() {
    let harness = TestHarness::create().await;
    let mcp_session = create_session(&harness).await;

    // No Authorization header at all: the refresh token alone must not be enough.
    let http_request = TestRequest::post()
      .uri("/v1/mcp/session/refresh")
      .peer_addr("127.0.0.1:9999".parse().expect("peer addr"))
      .to_http_request();
    let request = RefreshMcpSessionRequest {
      private_refresh_token: mcp_session.private_refresh_token.clone(),
    };

    let result = refresh_mcp_session_handler(
      http_request,
      Json(request),
      Data::new(harness.server_state.clone()),
    ).await;

    assert!(matches!(result, Err(CommonWebError::NotAuthorized)));
  }

  async fn create_session(harness: &TestHarness) -> InsertedMcpSession {
    let user = harness.create_funded_user(0).await;
    create_test_mcp_session(&harness.pool, &user.user_token)
      .await
      .expect("create mcp session")
  }

  /// Drive the real handler as the session, presenting `refresh_token` in the body.
  async fn post_refresh(
    harness: &TestHarness,
    mcp_session: &InsertedMcpSession,
    refresh_token: &McpSessionRefreshToken,
  ) -> Result<RefreshMcpSessionSuccessResponse, CommonWebError> {
    let http_request = TestRequest::post()
      .uri("/v1/mcp/session/refresh")
      .insert_header((
        "Authorization",
        format!("Bearer {}", mcp_session.private_session_token.as_str()),
      ))
      .peer_addr("127.0.0.1:9999".parse().expect("peer addr"))
      .to_http_request();

    let request = RefreshMcpSessionRequest {
      private_refresh_token: refresh_token.clone(),
    };

    refresh_mcp_session_handler(
      http_request,
      Json(request),
      Data::new(harness.server_state.clone()),
    )
    .await
    .map(Json::into_inner)
  }

  async fn session_expiry(
    harness: &TestHarness,
    mcp_session: &InsertedMcpSession,
  ) -> chrono::DateTime<chrono::Utc> {
    use std::marker::PhantomData;

    use mysql_queries::queries::mcp_sessions::get_mcp_session_by_token::{
      get_mcp_session_by_token, GetMcpSessionByTokenArgs,
    };

    let mut connection = harness.pool.acquire().await.expect("acquire for expiry read");
    get_mcp_session_by_token(GetMcpSessionByTokenArgs {
      token: &mcp_session.token,
      mysql_executor: &mut *connection,
      phantom: PhantomData,
    })
    .await
    .expect("read session")
    .expect("session row exists")
    .expires_at
  }
}
