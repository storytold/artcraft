//! Seedance 2.0 FAST tier pricing tests: real generate endpoint, test
//! database, exact wallet-debit assertions.
//!
//! Models covered: Seedance2p0Fast, Seedance2p0UltraFast,
//! Seedance2p0BytePlusFast, Seedance2p0BytePlusUltraFast (plus the
//! PreviewModelFast alias, kept for the collapse-bug pin).

use enums::common::generation::common_resolution::CommonResolution;
use enums::common::generation::common_video_model::CommonVideoModel;

use crate::http_server::endpoints::omni_gen::generate::video::tests::support::{
  assert_generation_fails_and_charges_nothing, assert_reference_video_charge_then_refund,
  assert_successful_generation_charges, assert_variant_charges_premium, Batch, CreditsDelta,
  ExpectedCredits, Seconds, TestHarness,
};

// ── Seedance 2.0 Fast (Volcengine) ──
// Rates: 480p 5.181 ¢/s, 720p 12.727 ¢/s, rounded once after
// duration × batch. Credits = cents.
mod seedance_2p0_fast {
  use super::*;

  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn seedance_2p0_fast_charges_by_resolution_duration_and_batch() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(26)),
      (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(52)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(64)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(127)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(191)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(127)),
      // Non-Mini models cap batches at the platform max of 4 (execution and
      // billing both downgrade), so batch 8 prices as batch 4.
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(255)),
      // Default resolution is 720p.
      (None, Seconds(5), Batch(1), ExpectedCredits(64)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p0Fast, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// Attaching reference videos switches Fast to its with-references rate
  /// (480p 8.41 ¢/s, 720p 15.60 ¢/s, ceil-rounded). The unreachable fixture
  /// media then fails the upload, so the exact charge is asserted on the
  /// refunded ledger entry.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn seedance_2p0_fast_charges_the_video_reference_rate() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(5), ExpectedCredits(43)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), ExpectedCredits(78)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), ExpectedCredits(156)),
    ];

    for (resolution, seconds, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p0Fast, *resolution, *seconds, Batch(1), *expected,
      ).await;
    }
  }
}

// ── Seedance 2.0 BytePlus Fast (+ its PreviewModelFast alias) ──
// Collapse-bug regression pins: 480p 9 ¢/s, 720p 20 ¢/s. The shipped bug
// billed the base Fast rate (720p 5s: 64 instead of 100).
mod seedance_2p0_bp_fast {
  use super::*;

  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn seedance_2p0_byteplus_fast_charges_its_own_rates_not_the_base_rate() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      // 720p 5s — the canonical bug shape. 100, NOT 64.
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(100)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(45)),
      (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(90)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(200)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(200)),
      // Default resolution is 720p.
      (None, Seconds(5), Batch(1), ExpectedCredits(100)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p0BytePlusFast, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// PreviewModelFast is the temporary-rollout alias of the BytePlus Fast tier
  /// and was part of the collapse bug; it must charge the BytePlus Fast rates.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn preview_model_fast_charges_the_byteplus_fast_rates() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    assert_successful_generation_charges(
      &harness,
      CommonVideoModel::PreviewModelFast,
      Some(CommonResolution::SevenTwentyP),
      Seconds(5),
      Batch(1),
      ExpectedCredits(100),
    ).await;
  }
}

// ── Seedance 2.0 BytePlus Ultra Fast ──
// The BytePlus Fast rate card, routed to the BytePlus Ultra account.
mod seedance_2p0_bpu_fast {
  use super::*;

  /// BytePlus Ultra Fast: 480p 9 ¢/s, 720p 20 ¢/s (the BytePlus Fast card,
  /// routed to the BytePlus Ultra account). 720p 5s: 100, NOT the base-Fast 64.
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
}

// ── Seedance 2.0 Ultra Fast (GmiCloud, decommissioned) ──
mod seedance_2p0_u_fast {
  use super::*;

  /// Seedance2p0UltraFast has no active execution route (its GmiCloud routing
  /// is disabled in the pipeline). The request must fail cleanly BEFORE
  /// billing. If the route is ever re-enabled, this pin fails and pricing
  /// tests must be written for it.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn seedance_2p0_ultra_fast_is_unroutable_and_charges_nothing() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    assert_generation_fails_and_charges_nothing(
      &harness, CommonVideoModel::Seedance2p0UltraFast, Seconds(5),
    ).await;
  }
}

// ── Variant pricing relative to the base Fast model ──
// Both prices and the delta are encoded so a change to EITHER rate card
// shows up here, not just a flipped ordering.
mod premium {
  use super::*;

  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn seedance_2p0_byteplus_fast_charges_a_premium_over_fast() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits, ExpectedCredits, CreditsDelta)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(26), ExpectedCredits(45), CreditsDelta(19)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(64), ExpectedCredits(100), CreditsDelta(36)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(127), ExpectedCredits(200), CreditsDelta(73)),
    ];

    for (resolution, seconds, batch, base, variant, delta) in cases {
      assert_variant_charges_premium(
        &harness,
        CommonVideoModel::Seedance2p0Fast,
        CommonVideoModel::Seedance2p0BytePlusFast,
        *resolution, *seconds, *batch, *base, *variant, *delta,
      ).await;
    }
  }

  /// Seedance2p0UltraFast is NOT priced higher than Fast: its legacy (GmiCloud)
  /// rate card quotes BELOW the Fast card (720p 5s: 45 vs 64), it has no active
  /// execution route, and production has zero jobs for it, ever. Pinned via the
  /// cost endpoint (it cannot generate); if this fails, someone revived or
  /// repriced the Ultra tier and real pricing tests are required.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn seedance_2p0_ultra_fast_quotes_below_fast_on_its_legacy_rate_card() {
    use actix_web::web::Json;

    let fast_quote = quote_credits(CommonVideoModel::Seedance2p0Fast).await;
    let ultra_fast_quote = quote_credits(CommonVideoModel::Seedance2p0UltraFast).await;

    // 720p 5s: Fast 12.727 ¢/s → 64; UltraFast (legacy) 8.9089 ¢/s → 45.
    assert_eq!(fast_quote, 64);
    assert_eq!(ultra_fast_quote, 45);
    assert_eq!(fast_quote - ultra_fast_quote, 19);

    async fn quote_credits(model: CommonVideoModel) -> u64 {
      let mut request = crate::http_server::endpoints::omni_gen::generate::video::tests::support::base_generate_request(model);
      request.resolution = Some(CommonResolution::SevenTwentyP);
      request.duration_seconds = Some(5);

      let http_request = actix_web::test::TestRequest::post()
        .uri("/v1/omni_gen/cost/video")
        .to_http_request();
      // No ServerState: quotes come from the router alone (no DB, no network).
      crate::http_server::endpoints::omni_gen::cost::video::omni_gen_video_cost_handler::omni_gen_video_cost_handler(
        http_request, Json(request), None,
      )
      .await
      .expect("cost quote should succeed")
      .into_inner()
      .cost_in_credits
      .expect("quote should carry credits")
    }
  }
}
