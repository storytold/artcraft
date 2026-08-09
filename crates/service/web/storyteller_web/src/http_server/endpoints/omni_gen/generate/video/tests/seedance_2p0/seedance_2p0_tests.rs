//! Seedance 2.0 BASE tier pricing tests: drive the REAL generate endpoint
//! with dummy HTTP requests against the test database and assert the exact
//! credits debited from the wallet.
//!
//! Models covered: Seedance2p0, Seedance2p0BytePlus, Seedance2p0Ultra,
//! Seedance2p0BytePlusUltra, Seedance2p0BytePlusUltraFast (plus the
//! PreviewModel alias of BytePlus, kept for the collapse-bug pin).
//!
//! These exist because of a shipped pricing bug where the BytePlus / Preview
//! variants billed the base Volcengine rate while quoting their own higher
//! rates. Every expectation here is the model's OWN rate — if the pipeline
//! ever collapses a variant before billing again, these fail.

use enums::common::generation::common_resolution::CommonResolution;
use enums::common::generation::common_video_model::CommonVideoModel;

use crate::http_server::endpoints::omni_gen::generate::video::tests::support::{
  assert_generation_fails_and_charges_nothing, assert_reference_video_charge_then_refund,
  assert_successful_generation_charges, base_generate_request, Batch, ExpectedCredits, Seconds,
  TestHarness,
};

// ── Seedance 2.0 (Volcengine) ──
// Rates: 480p 7.772 ¢/s, 720p 16 ¢/s, 1080p 46.632 ¢/s, rounded once after
// duration × batch. Credits = cents.

#[tokio::test]
#[cfg_attr(feature = "skip_database_tests", ignore)]
async fn seedance_2p0_charges_by_resolution_duration_and_batch() {
  let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
  let harness = TestHarness::create().await;

  let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
    (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(39)),
    (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(78)),
    (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(80)),
    (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(160)),
    (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(240)),
    (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(160)),
    // Non-Mini models cap batches at the platform max of 4 (execution and
    // billing both downgrade), so batch 8 prices as batch 4.
    (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(320)),
    (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(233)),
    (Some(CommonResolution::TenEightyP), Seconds(10), Batch(1), ExpectedCredits(466)),
    // Default resolution is 720p.
    (None, Seconds(5), Batch(1), ExpectedCredits(80)),
  ];

  for (resolution, seconds, batch, expected) in cases {
    assert_successful_generation_charges(
      &harness, CommonVideoModel::Seedance2p0, *resolution, *seconds, *batch, *expected,
    ).await;
  }
}

/// Attaching reference videos switches Seedance 2.0 to its with-references
/// rate (480p 8.81 ¢/s, 720p 22.05 ¢/s, 1080p 51.10 ¢/s, ceil-rounded).
/// The unreachable fixture media then fails the upload, so the exact charge
/// is asserted on the refunded ledger entry.
#[tokio::test]
#[cfg_attr(feature = "skip_database_tests", ignore)]
async fn seedance_2p0_charges_the_video_reference_rate() {
  let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
  let harness = TestHarness::create().await;

  let cases: &[(Option<CommonResolution>, Seconds, ExpectedCredits)] = &[
    (Some(CommonResolution::FourEightyP), Seconds(5), ExpectedCredits(45)),
    (Some(CommonResolution::SevenTwentyP), Seconds(5), ExpectedCredits(111)),
    (Some(CommonResolution::SevenTwentyP), Seconds(10), ExpectedCredits(221)),
    (Some(CommonResolution::TenEightyP), Seconds(5), ExpectedCredits(256)),
  ];

  for (resolution, seconds, expected) in cases {
    assert_reference_video_charge_then_refund(
      &harness, CommonVideoModel::Seedance2p0, *resolution, *seconds, *expected,
    ).await;
  }
}

// ── Seedance 2.0 BytePlus / BytePlus Ultra / Preview ──
// THE collapse-bug regression pins. These variants are FULFILLED by the base
// Seedance 2.0 request but must be PRICED as themselves: 480p 10 ¢/s,
// 720p 25 ¢/s, 1080p 50 ¢/s. The shipped bug billed them at the base rate
// (720p 5s: 80 instead of 125).

#[tokio::test]
#[cfg_attr(feature = "skip_database_tests", ignore)]
async fn seedance_2p0_byteplus_charges_its_own_rates_not_the_base_rate() {
  let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
  let harness = TestHarness::create().await;

  let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
    // 720p 5s — the canonical bug shape. 125, NOT 80.
    (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(125)),
    (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(50)),
    (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(250)),
    (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(250)),
    (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(250)),
  ];

  for (resolution, seconds, batch, expected) in cases {
    assert_successful_generation_charges(
      &harness, CommonVideoModel::Seedance2p0BytePlus, *resolution, *seconds, *batch, *expected,
    ).await;
  }
}

#[tokio::test]
#[cfg_attr(feature = "skip_database_tests", ignore)]
async fn seedance_2p0_byteplus_ultra_charges_its_own_rates_not_the_base_rate() {
  let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
  let harness = TestHarness::create().await;

  let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
    (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(125)),
    (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(50)),
    (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(100)),
    (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(250)),
    (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(250)),
    (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(375)),
    (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(250)),
    // Batch caps at the platform max of 4: batch 8 prices as batch 4.
    (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(500)),
    // Default resolution is 720p.
    (None, Seconds(5), Batch(1), ExpectedCredits(125)),
  ];

  for (resolution, seconds, batch, expected) in cases {
    assert_successful_generation_charges(
      &harness, CommonVideoModel::Seedance2p0BytePlusUltra, *resolution, *seconds, *batch, *expected,
    ).await;
  }
}

/// The BytePlus Ultra rate card is flat below 4K: attaching reference videos
/// does NOT change the price (unlike the base Volcengine model). Pinned so a
/// rate-card restructure shows up here.
#[tokio::test]
#[cfg_attr(feature = "skip_database_tests", ignore)]
async fn seedance_2p0_byteplus_ultra_video_references_do_not_change_the_price() {
  let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
  let harness = TestHarness::create().await;

  assert_reference_video_charge_then_refund(
    &harness,
    CommonVideoModel::Seedance2p0BytePlusUltra,
    Some(CommonResolution::SevenTwentyP),
    Seconds(5),
    ExpectedCredits(125), // same as without references
  ).await;
}

/// BytePlus Ultra Fast (grouped with the base tier per the module split):
/// 480p 9 ¢/s, 720p 20 ¢/s. 720p 5s: 100, NOT the base-Fast 64.
#[tokio::test]
#[cfg_attr(feature = "skip_database_tests", ignore)]
async fn seedance_2p0_byteplus_ultra_fast_charges_its_own_rates_not_the_base_rate() {
  let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
  let harness = TestHarness::create().await;

  let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
    (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(100)),
    (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(45)),
    (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(90)),
    (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(200)),
    (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(200)),
    // Batch caps at the platform max of 4: batch 8 prices as batch 4.
    (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(400)),
  ];

  for (resolution, seconds, batch, expected) in cases {
    assert_successful_generation_charges(
      &harness, CommonVideoModel::Seedance2p0BytePlusUltraFast, *resolution, *seconds, *batch, *expected,
    ).await;
  }
}

/// PreviewModel is the temporary-rollout alias of the BytePlus tier and was
/// part of the collapse bug; it must charge the BytePlus rates.
#[tokio::test]
#[cfg_attr(feature = "skip_database_tests", ignore)]
async fn preview_model_charges_the_byteplus_rates() {
  let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
  let harness = TestHarness::create().await;

  assert_successful_generation_charges(
    &harness,
    CommonVideoModel::PreviewModel,
    Some(CommonResolution::SevenTwentyP),
    Seconds(5),
    Batch(1),
    ExpectedCredits(125),
  ).await;
}

// ── Seedance 2.0 Ultra (GmiCloud) ──

/// Seedance2p0Ultra has no active execution route (its GmiCloud routing is
/// disabled in the pipeline). The request must fail cleanly BEFORE billing.
/// If the route is ever re-enabled, this pin fails and pricing tests must be
/// written for it.
#[tokio::test]
#[cfg_attr(feature = "skip_database_tests", ignore)]
async fn seedance_2p0_ultra_is_unroutable_and_charges_nothing() {
  let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
  let harness = TestHarness::create().await;

  assert_generation_fails_and_charges_nothing(
    &harness, CommonVideoModel::Seedance2p0Ultra, Seconds(5),
  ).await;
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
