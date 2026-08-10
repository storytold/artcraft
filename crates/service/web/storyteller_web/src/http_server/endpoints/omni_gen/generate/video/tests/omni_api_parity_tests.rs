//! Parity tests for the omni_api (API-key only) generate endpoint.
//!
//! The omni_api handler is a razor-thin wrapper that delegates to the same
//! shared generation core as omni_gen. These tests pin that: the same
//! request bills the SAME credits through either endpoint, and the omni_api
//! endpoint only accepts API-key authentication (session cookies are
//! rejected before any billable work).

use enums::common::generation::common_resolution::CommonResolution;
use enums::common::generation::common_video_model::CommonVideoModel;

use artcraft_api_keys::ArtcraftApiKey;

use crate::http_server::endpoints::omni_gen::generate::video::tests::support::{
  base_generate_request, ExpectedCredits, Seconds, TestHarness, STARTING_CREDITS,
};

mod billing_parity {
  use super::*;

  /// Base Seedance 2.0 at 720p 5s — same request, both endpoints, same debit.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn seedance_2p0_bills_identically_on_both_endpoints() {
    assert_endpoints_bill_identically(
      CommonVideoModel::Seedance2p0,
      Some(CommonResolution::SevenTwentyP),
      Seconds(5),
      ExpectedCredits(80),
    ).await;
  }

  /// BytePlus Ultra at 720p 5s — the canonical collapse-bug shape (125, NOT
  /// the base model's 80). If the omni_api path ever bills the collapsed
  /// model again, this fails.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn seedance_2p0_byteplus_ultra_bills_identically_on_both_endpoints() {
    assert_endpoints_bill_identically(
      CommonVideoModel::Seedance2p0BytePlusUltra,
      Some(CommonResolution::SevenTwentyP),
      Seconds(5),
      ExpectedCredits(125),
    ).await;
  }
}

mod api_key_only_auth {
  use super::*;

  /// A key that was never inserted is a 401, and nothing is charged.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn unknown_api_key_is_rejected() {
    let harness = TestHarness::create().await;

    let bogus_key = ArtcraftApiKey::new_from_str("artcraft_api_test_never_inserted_key");
    let request = base_generate_request(CommonVideoModel::Seedance2p0);

    let result = harness.post_generate_via_api_key(&bogus_key, request).await;
    assert!(result.is_err(), "unknown API key must be rejected");
  }

  /// The omni_api endpoint is API-key ONLY: a valid session cookie (which
  /// omni_gen accepts) must be rejected, and nothing charged.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn session_cookie_is_rejected() {
    let harness = TestHarness::create().await;
    let user = harness.create_funded_user(STARTING_CREDITS).await;

    let request = base_generate_request(CommonVideoModel::Seedance2p0);
    let result = harness
      .post_generate_via_session_cookie_on_omni_api(&user, request)
      .await;

    assert!(result.is_err(), "session cookies must not authenticate omni_api");
    assert_eq!(
      harness.wallet_balance(&user).await,
      STARTING_CREDITS,
      "rejected session-cookie request must not charge",
    );
  }
}

/// Run the same generation through omni_gen (session cookie) and omni_api
/// (API key) as two independent fixture users; assert both succeed and both
/// debit exactly `expected_credits`.
async fn assert_endpoints_bill_identically(
  model: CommonVideoModel,
  resolution: Option<CommonResolution>,
  Seconds(duration_seconds): Seconds,
  ExpectedCredits(expected_credits): ExpectedCredits,
) {
  let harness = TestHarness::create().await;

  // omni_gen, session-cookie user.
  let web_user = harness.create_funded_user(STARTING_CREDITS).await;
  let mut request = base_generate_request(model);
  request.resolution = resolution;
  request.duration_seconds = Some(duration_seconds);
  let response = harness
    .post_generate(&web_user, request)
    .await
    .unwrap_or_else(|err| panic!("{:?}: omni_gen generation failed: {:?}", model, err));
  assert!(response.success);

  // omni_api, API-key user.
  let api_user = harness.create_funded_user(STARTING_CREDITS).await;
  let api_key = harness.create_api_key(&api_user).await;
  let mut request = base_generate_request(model);
  request.resolution = resolution;
  request.duration_seconds = Some(duration_seconds);
  let response = harness
    .post_generate_via_api_key(&api_key, request)
    .await
    .unwrap_or_else(|err| panic!("{:?}: omni_api generation failed: {:?}", model, err));
  assert!(response.success);

  let web_debit = STARTING_CREDITS - harness.wallet_balance(&web_user).await;
  let api_debit = STARTING_CREDITS - harness.wallet_balance(&api_user).await;
  assert_eq!(
    web_debit, expected_credits,
    "{:?}: omni_gen debited the wrong amount", model,
  );
  assert_eq!(
    api_debit, expected_credits,
    "{:?}: omni_api debited the wrong amount", model,
  );
}
