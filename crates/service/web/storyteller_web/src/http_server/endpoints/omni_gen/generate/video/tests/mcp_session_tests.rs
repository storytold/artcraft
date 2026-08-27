//! MCP-session authentication tests for the omni_gen video generate endpoint.
//!
//! The endpoint accepts three credentials: web-session cookies, API keys, and
//! MCP session credentials (`mcp_session_…` in the Authorization header).
//! These tests pin the MCP path: a live session generates and bills exactly
//! like the other paths, and a revoked session is rejected before any
//! billable work.

use std::marker::PhantomData;

use enums::common::generation::common_resolution::CommonResolution;
use enums::common::generation::common_video_model::CommonVideoModel;
use mysql_queries::queries::mcp_sessions::revoke_mcp_session::{
  revoke_mcp_session, RevokeMcpSessionArgs,
};

use crate::http_server::endpoints::omni_gen::generate::video::tests::support::{
  base_generate_request, TestHarness, STARTING_CREDITS,
};

mod mcp_session_auth {
  use super::*;

  /// Base Seedance 2.0 at 720p 5s via an MCP session credential: the same 93
  /// credits the parity tests pin for the cookie and API-key paths.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn mcp_session_generates_and_bills_exactly() {
    const EXPECTED_CREDITS: u64 = 93;

    let harness = TestHarness::create().await;
    let user = harness.create_funded_user(STARTING_CREDITS).await;
    let credential = harness.create_mcp_session(&user).await;

    let mut request = base_generate_request(CommonVideoModel::Seedance2p0);
    request.resolution = Some(CommonResolution::SevenTwentyP);
    request.duration_seconds = Some(5);

    let response = harness
      .post_generate_via_mcp_session(&credential, request)
      .await
      .expect("MCP-session generation should succeed");
    assert!(response.success);

    assert_eq!(
      STARTING_CREDITS - harness.wallet_balance(&user).await,
      EXPECTED_CREDITS,
      "MCP-session generation billed the wrong amount",
    );
  }

  /// A revoked session must be rejected up front — no generation, no charge.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn revoked_mcp_session_is_rejected_and_charges_nothing() {
    let harness = TestHarness::create().await;
    let user = harness.create_funded_user(STARTING_CREDITS).await;
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

    let mut request = base_generate_request(CommonVideoModel::Seedance2p0);
    request.resolution = Some(CommonResolution::SevenTwentyP);
    request.duration_seconds = Some(5);

    let result = harness.post_generate_via_mcp_session(&credential, request).await;
    assert!(result.is_err(), "revoked MCP session must be rejected");

    assert_eq!(
      harness.wallet_balance(&user).await,
      STARTING_CREDITS,
      "rejected MCP-session generation must not charge",
    );
  }
}
