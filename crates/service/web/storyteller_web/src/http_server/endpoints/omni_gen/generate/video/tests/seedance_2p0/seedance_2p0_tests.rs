//! Seedance 2.0 BASE tier pricing tests: drive the REAL generate endpoint
//! with dummy HTTP requests against the test database and assert the exact
//! credits debited from the wallet.
//!
//! Models covered: Seedance2p0, Seedance2p0BytePlus, Seedance2p0Ultra,
//! Seedance2p0BytePlusUltra (plus the PreviewModel alias of BytePlus, kept
//! for the collapse-bug pin). Fast-tier variants live in
//! `seedance_2p0_fast_tests`.
//!
//! These exist because of a shipped pricing bug where the BytePlus / Preview
//! variants billed the base Volcengine rate while quoting their own higher
//! rates. Every expectation here is the model's OWN rate — if the pipeline
//! ever collapses a variant before billing again, these fail.

use enums::common::generation::common_resolution::CommonResolution;
use enums::common::generation::common_video_model::CommonVideoModel;

use crate::http_server::endpoints::omni_gen::generate::video::tests::support::{
  assert_generation_fails_and_charges_nothing, assert_reference_video_charge_then_refund,
  assert_successful_generation_charges, assert_variant_charges_premium, base_generate_request,
  Batch, CreditsDelta, ExpectedCredits, Seconds, TestHarness,
};

// ── Seedance 2.0 (Volcengine) ──
// Rates: 480p 7.772 ¢/s, 720p 16 ¢/s, 1080p 46.632 ¢/s, rounded once after
// duration × batch. Credits = cents.
mod seedance_2p0 {
  use super::*;

  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn seedance_2p0_charges_by_resolution_duration_and_batch() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(39)),
      (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(78)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(1), ExpectedCredits(64)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(4), ExpectedCredits(256)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(80)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(160)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(4), ExpectedCredits(320)),
      // Non-Mini models cap batches at the platform max of 4 (execution and
      // billing both downgrade), so batch 8 prices as batch 4.
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(320)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(160)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(4), ExpectedCredits(640)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(240)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(4), ExpectedCredits(960)),
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

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(45)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(1), ExpectedCredits(89)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(4), ExpectedCredits(353)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(111)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(4), ExpectedCredits(441)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(221)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(4), ExpectedCredits(882)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(331)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(4), ExpectedCredits(1323)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(256)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p0, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

}

// ── Seedance 2.0 BytePlus (+ its PreviewModel alias) ──
// THE collapse-bug regression pins. These variants are FULFILLED by the
// base Seedance 2.0 request but must be PRICED as themselves: 480p 10 ¢/s,
// 720p 25 ¢/s, 1080p 50 ¢/s. The shipped bug billed them at the base rate
// (720p 5s: 80 instead of 125).
mod seedance_2p0_bp {
  use super::*;

  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn seedance_2p0_byteplus_charges_its_own_rates_not_the_base_rate() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(50)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(1), ExpectedCredits(100)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(4), ExpectedCredits(400)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(125)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(250)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(4), ExpectedCredits(500)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(250)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(4), ExpectedCredits(1000)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(375)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(4), ExpectedCredits(1500)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(250)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p0BytePlus, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// The BytePlus rate cards are flat below 4K: attaching reference videos
  /// does NOT change the price (unlike the base Volcengine model). Every
  /// expectation equals the same duration x batch without references. Pinned
  /// so a rate-card restructure shows up here.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn seedance_2p0_byteplus_video_references_do_not_change_the_price() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(4), ExpectedCredits(400)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(125)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(4), ExpectedCredits(500)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(4), ExpectedCredits(1000)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(4), ExpectedCredits(1500)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p0BytePlus, *resolution, *seconds, *batch, *expected,
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
}

// ── Seedance 2.0 BytePlus Ultra ──
// Same rate card as BytePlus, routed to the BytePlus Ultra account; the
// same collapse-bug pins apply.
mod seedance_2p0_bpu {
  use super::*;

  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn seedance_2p0_byteplus_ultra_charges_its_own_rates_not_the_base_rate() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(50)),
      (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(100)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(1), ExpectedCredits(100)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(4), ExpectedCredits(400)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(125)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(250)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(4), ExpectedCredits(500)),
      // Batch caps at the platform max of 4: batch 8 prices as batch 4.
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(500)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(250)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(4), ExpectedCredits(1000)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(375)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(4), ExpectedCredits(1500)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(250)),
      // Default resolution is 720p.
      (None, Seconds(5), Batch(1), ExpectedCredits(125)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p0BytePlusUltra, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// See [`seedance_2p0_byteplus_video_references_do_not_change_the_price`];
  /// the BytePlus Ultra card is flat below 4K too.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn seedance_2p0_byteplus_ultra_video_references_do_not_change_the_price() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(4), ExpectedCredits(400)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(125)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(4), ExpectedCredits(500)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(4), ExpectedCredits(1000)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(4), ExpectedCredits(1500)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p0BytePlusUltra, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }
}

// ── Seedance 2.0 Ultra (GmiCloud, decommissioned) ──
mod seedance_2p0_u {
  use super::*;

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
}

// ── Variant premiums over the base model ──
// Both prices and the delta are encoded so a change to EITHER rate card
// shows up here, not just a flipped ordering.
mod premium {
  use super::*;

  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn seedance_2p0_byteplus_charges_a_premium_over_the_base_model() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits, ExpectedCredits, CreditsDelta)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(39), ExpectedCredits(50), CreditsDelta(11)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(80), ExpectedCredits(125), CreditsDelta(45)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(160), ExpectedCredits(250), CreditsDelta(90)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(233), ExpectedCredits(250), CreditsDelta(17)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(240), ExpectedCredits(375), CreditsDelta(135)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(4), ExpectedCredits(320), ExpectedCredits(500), CreditsDelta(180)),
      // Batch 8 is accepted but downgrades to the platform max of 4 on both
      // execution and billing, so it prices identically to batch 4.
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(320), ExpectedCredits(500), CreditsDelta(180)),
      // 4K carries NO premium: base and BytePlus tiers share one 4K rate card
      // (86.6 cents/s), so the delta is zero — including at scale.
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(433), ExpectedCredits(433), CreditsDelta(0)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(4), ExpectedCredits(5196), ExpectedCredits(5196), CreditsDelta(0)),
    ];

    for (resolution, seconds, batch, base, variant, delta) in cases {
      assert_variant_charges_premium(
        &harness,
        CommonVideoModel::Seedance2p0,
        CommonVideoModel::Seedance2p0BytePlus,
        *resolution, *seconds, *batch, *base, *variant, *delta,
      ).await;
    }
  }

  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn seedance_2p0_byteplus_ultra_charges_a_premium_over_the_base_model() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits, ExpectedCredits, CreditsDelta)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(39), ExpectedCredits(50), CreditsDelta(11)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(80), ExpectedCredits(125), CreditsDelta(45)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(160), ExpectedCredits(250), CreditsDelta(90)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(233), ExpectedCredits(250), CreditsDelta(17)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(240), ExpectedCredits(375), CreditsDelta(135)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(4), ExpectedCredits(320), ExpectedCredits(500), CreditsDelta(180)),
      // Batch 8 is accepted but downgrades to the platform max of 4 on both
      // execution and billing, so it prices identically to batch 4.
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(320), ExpectedCredits(500), CreditsDelta(180)),
      // 4K carries NO premium: base and BytePlus tiers share one 4K rate card
      // (86.6 cents/s), so the delta is zero — including at scale.
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(433), ExpectedCredits(433), CreditsDelta(0)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(4), ExpectedCredits(5196), ExpectedCredits(5196), CreditsDelta(0)),
    ];

    for (resolution, seconds, batch, base, variant, delta) in cases {
      assert_variant_charges_premium(
        &harness,
        CommonVideoModel::Seedance2p0,
        CommonVideoModel::Seedance2p0BytePlusUltra,
        *resolution, *seconds, *batch, *base, *variant, *delta,
      ).await;
    }
  }
}

mod misc {
  use super::*;

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
}
