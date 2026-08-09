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

use super::support::{base_generate_request, TestHarness};

const STARTING_CREDITS: u64 = 100_000;

// ── Text-to-video pricing (successful generation via the stub provider) ──

#[tokio::test]
#[cfg_attr(not(feature = "database_tests"), ignore)]
async fn seedance_2p5_charges_by_resolution_and_duration() {
  let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
  let harness = TestHarness::create().await;

  // 2.5 rates: 480p 11.76954733 ¢/s, 720p 26.70781893 ¢/s, ceil-rounded.
  // Only 480p/720p exist; 1080p downgrades to 720p pricing. No batching.
  let cases: &[(Option<CommonResolution>, u16, u64)] = &[
    (Some(CommonResolution::FourEightyP), 4, 48),
    (Some(CommonResolution::FourEightyP), 5, 59),
    (Some(CommonResolution::FourEightyP), 30, 354),
    (Some(CommonResolution::SevenTwentyP), 4, 107),
    (Some(CommonResolution::SevenTwentyP), 5, 134),
    (Some(CommonResolution::SevenTwentyP), 10, 268),
    (Some(CommonResolution::SevenTwentyP), 30, 802),
    // Default resolution is 720p.
    (None, 5, 134),
  ];

  for (resolution, duration_seconds, expected_credits) in cases {
    assert_successful_generation_charges(
      &harness,
      CommonVideoModel::Seedance2p5,
      *resolution,
      *duration_seconds,
      *expected_credits,
    )
    .await;
  }
}

/// Seedance 2.5 Ultra is fulfilled by Seedance 2.5 but has its own (higher)
/// price. Same shape as the 2.0 collapse-bug pins: if the pipeline ever
/// collapses Ultra before billing, these fail with the regular 2.5 numbers.
#[tokio::test]
#[cfg_attr(not(feature = "database_tests"), ignore)]
async fn seedance_2p5_ultra_charges_its_own_higher_rates() {
  let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
  let harness = TestHarness::create().await;

  // Ultra rates: 480p 13.90946502 ¢/s, 720p 31.56378601 ¢/s, ceil-rounded.
  let cases: &[(Option<CommonResolution>, u16, u64)] = &[
    (Some(CommonResolution::FourEightyP), 5, 70),   // regular would be 59
    (Some(CommonResolution::FourEightyP), 30, 418), // regular would be 354
    (Some(CommonResolution::SevenTwentyP), 5, 158), // regular would be 134
    (Some(CommonResolution::SevenTwentyP), 30, 947), // regular would be 802
    (None, 5, 158),
  ];

  for (resolution, duration_seconds, expected_credits) in cases {
    assert_successful_generation_charges(
      &harness,
      CommonVideoModel::Seedance2p5Ultra,
      *resolution,
      *duration_seconds,
      *expected_credits,
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
#[cfg_attr(not(feature = "database_tests"), ignore)]
async fn seedance_2p5_bills_reference_video_input_seconds_at_worst_case_when_unprobeable() {
  let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
  let harness = TestHarness::create().await;

  let cases: &[(CommonVideoModel, Option<CommonResolution>, u16, u64)] = &[
    (CommonVideoModel::Seedance2p5, Some(CommonResolution::FourEightyP), 30, 435),
    (CommonVideoModel::Seedance2p5, Some(CommonResolution::SevenTwentyP), 30, 951),
    (CommonVideoModel::Seedance2p5Ultra, Some(CommonResolution::FourEightyP), 30, 514),
    (CommonVideoModel::Seedance2p5Ultra, Some(CommonResolution::SevenTwentyP), 30, 1124),
  ];

  for (model, resolution, duration_seconds, expected_credits) in cases {
    assert_reference_video_charge_then_refund(
      &harness,
      *model,
      *resolution,
      *duration_seconds,
      *expected_credits,
    )
    .await;
  }
}

// ── Shared assertions ──

/// Fund a fresh user, run one t2v generation via the stub Kinovi server, and
/// assert the exact wallet debit (balance delta AND ledger entry).
async fn assert_successful_generation_charges(
  harness: &TestHarness,
  model: CommonVideoModel,
  resolution: Option<CommonResolution>,
  duration_seconds: u16,
  expected_credits: u64,
) {
  let user = harness.create_funded_user(STARTING_CREDITS).await;

  let mut request = base_generate_request(model);
  request.resolution = resolution;
  request.duration_seconds = Some(duration_seconds);

  let response = harness
    .post_generate(&user, request)
    .await
    .unwrap_or_else(|err| {
      panic!("{:?} {:?} {}s: generation failed: {:?}", model, resolution, duration_seconds, err)
    });
  assert!(response.success);

  let balance = harness.wallet_balance(&user).await;
  assert_eq!(
    STARTING_CREDITS - balance,
    expected_credits,
    "{:?} {:?} {}s: wrong wallet debit", model, resolution, duration_seconds,
  );
}

/// Reference-video request: the charge lands (pinning the with-references
/// price), then the unreachable media makes the provider upload fail and the
/// charge is refunded. Asserts the exact debit amount on the refunded ledger
/// entry and that the balance is made whole.
async fn assert_reference_video_charge_then_refund(
  harness: &TestHarness,
  model: CommonVideoModel,
  resolution: Option<CommonResolution>,
  duration_seconds: u16,
  expected_credits: u64,
) {
  let user = harness.create_funded_user(STARTING_CREDITS).await;

  let video_token = mysql_testing::fixtures::media_files::create_test_video_media_file(
    &harness.pool,
    &user.user_token,
    Some(6_000),
  )
  .await
  .expect("create video media file fixture");

  let mut request = base_generate_request(model);
  request.resolution = resolution;
  request.duration_seconds = Some(duration_seconds);
  request.reference_video_media_tokens = Some(vec![video_token]);

  // The upload of the (unreachable) reference video fails after billing, so
  // the endpoint errors and the charge is refunded.
  let result = harness.post_generate(&user, request).await;
  assert!(
    result.is_err(),
    "{:?}: generation with unreachable reference media should fail", model,
  );

  let entries = harness.ledger_entries(&user).await;
  let debit = entries
    .iter()
    .find(|entry| entry.credits_delta < 0)
    .unwrap_or_else(|| panic!("{:?}: no debit ledger entry found", model));
  assert_eq!(
    -debit.credits_delta,
    expected_credits as i64,
    "{:?} {:?} {}s + refs: wrong charged amount", model, resolution, duration_seconds,
  );
  assert!(
    debit.is_refunded,
    "{:?}: failed generation must refund the charge", model,
  );

  assert_eq!(
    harness.wallet_balance(&user).await,
    STARTING_CREDITS,
    "{:?}: refund must make the wallet whole", model,
  );
}
