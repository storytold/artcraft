//! Seedance 2.5 family pricing tests: 2.5 and 2.5 Ultra through the real
//! generate endpoint against the test database, asserting exact wallet
//! debits — including the reference-video input-seconds dimension.
//!
//! Reference-video note: the fixture media files point at unreachable CDN
//! URLs, so the duration probe fails open and bills the worst-case 30 input
//! seconds (pinned here), and the provider upload then fails, triggering a
//! refund. The ledger entry keeps its original debit amount with
//! `is_refunded = true`, which lets these tests assert the exact charge for
//! reference-video requests without any real media.

use enums::common::generation::common_resolution::CommonResolution;
use enums::common::generation::common_video_model::CommonVideoModel;

use super::support::{
  assert_reference_video_charge_then_refund, assert_successful_generation_charges, Batch,
  ExpectedCredits, Seconds, TestHarness,
};

// ── Text-to-video pricing (successful generation via the stub provider) ──

#[tokio::test]
#[cfg_attr(feature = "skip_database_tests", ignore)]
async fn seedance_2p5_charges_by_resolution_and_duration() {
  let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
  let harness = TestHarness::create().await;

  // 2.5 rates: 480p 11.76954733 ¢/s, 720p 26.70781893 ¢/s, ceil-rounded.
  // Only 480p/720p exist; 1080p downgrades to 720p pricing. No batching.
  let cases: &[(Option<CommonResolution>, Seconds, ExpectedCredits)] = &[
    (Some(CommonResolution::FourEightyP), Seconds(4), ExpectedCredits(48)),
    (Some(CommonResolution::FourEightyP), Seconds(5), ExpectedCredits(59)),
    (Some(CommonResolution::FourEightyP), Seconds(30), ExpectedCredits(354)),
    (Some(CommonResolution::SevenTwentyP), Seconds(4), ExpectedCredits(107)),
    (Some(CommonResolution::SevenTwentyP), Seconds(5), ExpectedCredits(134)),
    (Some(CommonResolution::SevenTwentyP), Seconds(10), ExpectedCredits(268)),
    (Some(CommonResolution::SevenTwentyP), Seconds(30), ExpectedCredits(802)),
    // Default resolution is 720p.
    (None, Seconds(5), ExpectedCredits(134)),
  ];

  for (resolution, seconds, expected) in cases {
    assert_successful_generation_charges(
      &harness,
      CommonVideoModel::Seedance2p5,
      *resolution,
      *seconds,
      Batch(1),
      *expected,
    )
    .await;
  }
}

/// Seedance 2.5 Ultra is fulfilled by Seedance 2.5 but has its own (higher)
/// price. Same shape as the 2.0 collapse-bug pins: if the pipeline ever
/// collapses Ultra before billing, these fail with the regular 2.5 numbers.
#[tokio::test]
#[cfg_attr(feature = "skip_database_tests", ignore)]
async fn seedance_2p5_ultra_charges_its_own_higher_rates() {
  let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
  let harness = TestHarness::create().await;

  // Ultra rates: 480p 13.90946502 ¢/s, 720p 31.56378601 ¢/s, ceil-rounded.
  let cases: &[(Option<CommonResolution>, Seconds, ExpectedCredits)] = &[
    (Some(CommonResolution::FourEightyP), Seconds(5), ExpectedCredits(70)),    // regular would be 59
    (Some(CommonResolution::FourEightyP), Seconds(30), ExpectedCredits(418)),  // regular would be 354
    (Some(CommonResolution::SevenTwentyP), Seconds(5), ExpectedCredits(158)),  // regular would be 134
    (Some(CommonResolution::SevenTwentyP), Seconds(30), ExpectedCredits(947)), // regular would be 802
    (None, Seconds(5), ExpectedCredits(158)),
  ];

  for (resolution, seconds, expected) in cases {
    assert_successful_generation_charges(
      &harness,
      CommonVideoModel::Seedance2p5Ultra,
      *resolution,
      *seconds,
      Batch(1),
      *expected,
    )
    .await;
  }
}

// ── Reference-video input-seconds billing ──
//
// With video references the per-second rate drops but billed seconds =
// output duration + probed input seconds. Unreachable fixture media probes
// fail open to the 30-second worst case:
//   2.5:   480p with refs = 7.24279835 ¢/s  → 30s out + 30s in = 60 × rate = 435
//   2.5:   720p with refs = 15.84362140 ¢/s → 60 × rate = 951
//   Ultra: 480p with refs = 8.55967078 ¢/s  → 60 × rate = 514
//   Ultra: 720p with refs = 18.72427984 ¢/s → 60 × rate = 1124

#[tokio::test]
#[cfg_attr(feature = "skip_database_tests", ignore)]
async fn seedance_2p5_bills_reference_video_input_seconds_at_worst_case_when_unprobeable() {
  let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
  let harness = TestHarness::create().await;

  let cases: &[(CommonVideoModel, Option<CommonResolution>, Seconds, ExpectedCredits)] = &[
    (CommonVideoModel::Seedance2p5, Some(CommonResolution::FourEightyP), Seconds(30), ExpectedCredits(435)),
    (CommonVideoModel::Seedance2p5, Some(CommonResolution::SevenTwentyP), Seconds(30), ExpectedCredits(951)),
    (CommonVideoModel::Seedance2p5Ultra, Some(CommonResolution::FourEightyP), Seconds(30), ExpectedCredits(514)),
    (CommonVideoModel::Seedance2p5Ultra, Some(CommonResolution::SevenTwentyP), Seconds(30), ExpectedCredits(1124)),
  ];

  for (model, resolution, seconds, expected) in cases {
    assert_reference_video_charge_then_refund(
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
