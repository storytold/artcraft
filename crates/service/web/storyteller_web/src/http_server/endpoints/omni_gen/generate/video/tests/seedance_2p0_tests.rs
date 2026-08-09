//! Seedance 2.0 family pricing tests: drive the REAL generate endpoint with
//! dummy HTTP requests against the test database and assert the exact
//! credits debited from the wallet.
//!
//! These exist because of a shipped pricing bug where the BytePlus / Preview
//! variants billed the base Volcengine rate while quoting their own higher
//! rates. Every expectation here is the model's OWN rate — if the pipeline
//! ever collapses a variant before billing again, these fail.

use enums::common::generation::common_resolution::CommonResolution;
use enums::common::generation::common_video_model::CommonVideoModel;

use super::support::{base_generate_request, Batch, ExpectedCredits, Seconds, TestHarness};

const STARTING_CREDITS: u64 = 100_000;

// ── Text-to-video pricing (successful generation via the stub provider) ──

#[tokio::test]
#[cfg_attr(feature = "skip_database_tests", ignore)]
async fn seedance_2p0_charges_by_resolution_duration_and_batch() {
  let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
  let harness = TestHarness::create().await;

  // Volcengine rates: 480p 7.772 ¢/s, 720p 16 ¢/s, 1080p 46.632 ¢/s,
  // rounded once after duration × batch. Credits = cents.
  let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
    (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(39)),
    (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(78)),
    (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(80)),
    (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(160)),
    (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(240)),
    (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(160)),
    (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(233)),
    (Some(CommonResolution::TenEightyP), Seconds(10), Batch(1), ExpectedCredits(466)),
    // Default resolution is 720p.
    (None, Seconds(5), Batch(1), ExpectedCredits(80)),
  ];

  for (resolution, seconds, batch, expected) in cases {
    assert_successful_generation_charges(
      &harness,
      CommonVideoModel::Seedance2p0,
      *resolution,
      *seconds,
      *batch,
      *expected,
    )
    .await;
  }
}

#[tokio::test]
#[cfg_attr(feature = "skip_database_tests", ignore)]
async fn seedance_2p0_fast_charges_by_resolution_and_duration() {
  let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
  let harness = TestHarness::create().await;

  // Fast rates: 480p 5.181 ¢/s, 720p 12.727 ¢/s.
  let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
    (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(26)),
    (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(64)),
    (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(127)),
    (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(127)),
  ];

  for (resolution, seconds, batch, expected) in cases {
    assert_successful_generation_charges(
      &harness,
      CommonVideoModel::Seedance2p0Fast,
      *resolution,
      *seconds,
      *batch,
      *expected,
    )
    .await;
  }
}

// ── THE collapse-bug regression pins ──
//
// The BytePlus / BytePlus Ultra / Preview variants are FULFILLED by the base
// Seedance 2.0 request but must be PRICED as themselves (480p 10 ¢/s,
// 720p 25 ¢/s, 1080p 50 ¢/s; Fast: 480p 9 ¢/s, 720p 20 ¢/s). The shipped bug
// billed all of these at the base rate (720p 5s: 80 instead of 125).

#[tokio::test]
#[cfg_attr(feature = "skip_database_tests", ignore)]
async fn byteplus_and_preview_variants_charge_their_own_rates_not_the_base_rate() {
  let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
  let harness = TestHarness::create().await;

  let cases: &[(CommonVideoModel, Option<CommonResolution>, Seconds, ExpectedCredits)] = &[
    // 720p 5s — the canonical bug shape. 125, NOT 80.
    (CommonVideoModel::Seedance2p0BytePlus, Some(CommonResolution::SevenTwentyP), Seconds(5), ExpectedCredits(125)),
    (CommonVideoModel::Seedance2p0BytePlusUltra, Some(CommonResolution::SevenTwentyP), Seconds(5), ExpectedCredits(125)),
    (CommonVideoModel::PreviewModel, Some(CommonResolution::SevenTwentyP), Seconds(5), ExpectedCredits(125)),
    // Fast 720p 5s: 100, NOT 64.
    (CommonVideoModel::Seedance2p0BytePlusFast, Some(CommonResolution::SevenTwentyP), Seconds(5), ExpectedCredits(100)),
    (CommonVideoModel::Seedance2p0BytePlusUltraFast, Some(CommonResolution::SevenTwentyP), Seconds(5), ExpectedCredits(100)),
    (CommonVideoModel::PreviewModelFast, Some(CommonResolution::SevenTwentyP), Seconds(5), ExpectedCredits(100)),
    // Other resolutions and durations hold too.
    (CommonVideoModel::Seedance2p0BytePlusUltra, Some(CommonResolution::FourEightyP), Seconds(5), ExpectedCredits(50)),
    (CommonVideoModel::Seedance2p0BytePlusUltra, Some(CommonResolution::TenEightyP), Seconds(5), ExpectedCredits(250)),
    (CommonVideoModel::Seedance2p0BytePlusUltra, Some(CommonResolution::SevenTwentyP), Seconds(10), ExpectedCredits(250)),
    (CommonVideoModel::Seedance2p0BytePlusUltraFast, Some(CommonResolution::FourEightyP), Seconds(10), ExpectedCredits(90)),
  ];

  for (model, resolution, seconds, expected) in cases {
    assert_successful_generation_charges(
      &harness,
      *model,
      *resolution,
      *seconds,
      Batch(1),
      *expected,
    )
    .await;
  }
}

// ── Insufficient funds ──

#[tokio::test]
#[cfg_attr(feature = "skip_database_tests", ignore)]
async fn insufficient_balance_is_a_402_and_charges_nothing() {
  let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
  let harness = TestHarness::create().await;

  // 720p 5s costs 80; the user has 79.
  let user = harness.create_funded_user(79).await;

  let mut request = base_generate_request(CommonVideoModel::Seedance2p0);
  request.resolution = Some(CommonResolution::SevenTwentyP);
  request.duration_seconds = Some(5);

  let error = match harness.post_generate(&user, request).await {
    Ok(_) => panic!("under-funded generation must be rejected"),
    Err(error) => error,
  };
  let status = actix_web::ResponseError::status_code(&error);
  assert_eq!(status.as_u16(), 402, "expected 402 PaymentRequired, got {}", status);

  assert_eq!(harness.wallet_balance(&user).await, 79, "no credits may be deducted");
}

// ── Shared assertion ──

/// Fund a fresh user, run one generation to completion via the stub Kinovi
/// server, and assert the wallet was debited exactly the expected credits
/// (balance delta AND ledger entry).
async fn assert_successful_generation_charges(
  harness: &TestHarness,
  model: CommonVideoModel,
  resolution: Option<CommonResolution>,
  Seconds(duration_seconds): Seconds,
  Batch(batch_count): Batch,
  ExpectedCredits(expected_credits): ExpectedCredits,
) {
  let user = harness.create_funded_user(STARTING_CREDITS).await;

  let mut request = base_generate_request(model);
  request.resolution = resolution;
  request.duration_seconds = Some(duration_seconds);
  request.video_batch_count = Some(batch_count);

  let response = harness
    .post_generate(&user, request)
    .await
    .unwrap_or_else(|err| {
      panic!("{:?} {:?} {}s x{}: generation failed: {:?}", model, resolution, duration_seconds, batch_count, err)
    });
  assert!(response.success);

  let balance = harness.wallet_balance(&user).await;
  assert_eq!(
    STARTING_CREDITS - balance,
    expected_credits,
    "{:?} {:?} {}s x{}: wrong wallet debit", model, resolution, duration_seconds, batch_count,
  );

  let entries = harness.ledger_entries(&user).await;
  let debit = entries
    .iter()
    .find(|entry| entry.credits_delta < 0)
    .unwrap_or_else(|| panic!("{:?}: no debit ledger entry found", model));
  assert_eq!(
    -debit.credits_delta,
    expected_credits as i64,
    "{:?} {:?} {}s x{}: wrong ledger debit", model, resolution, duration_seconds, batch_count,
  );
  assert!(!debit.is_refunded, "{:?}: successful generation must not be refunded", model);
}
