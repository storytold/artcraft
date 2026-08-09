//! Seedance 2.0 MINI tier pricing tests: real generate endpoint, test
//! database, exact wallet-debit assertions.
//!
//! Models covered: Seedance2p0Mini, Seedance2p0BytePlusMini,
//! Seedance2p0BytePlusUltraMini.
//!
//! Rate cards (ceil-rounded once after rate × duration × batch):
//! - Mini (Volcengine):    480p 3.24074074 ¢/s (+0.86419753 with video
//!   refs), 720p 8.64197531 ¢/s (+1.72839506 with video refs)
//! - BytePlus / BytePlus Ultra Mini (shared card): 480p 3.27160494 ¢/s
//!   (+0.87242798), 720p 8.72427984 ¢/s (+1.74485597)

use enums::common::generation::common_resolution::CommonResolution;
use enums::common::generation::common_video_model::CommonVideoModel;

use crate::http_server::endpoints::omni_gen::generate::video::tests::support::{
  assert_reference_video_charge_then_refund, assert_successful_generation_charges,
  assert_variant_charges_premium, Batch, CreditsDelta, ExpectedCredits, Seconds, TestHarness,
};

// ── Seedance 2.0 Mini (Volcengine) ──
mod seedance_2p0_mini {
  use super::*;

  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn seedance_2p0_mini_charges_by_resolution_duration_and_batch() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(4), Batch(1), ExpectedCredits(13)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(17)),
      (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(33)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(1), ExpectedCredits(49)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(1), ExpectedCredits(35)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(44)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(87)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(130)),
      // Batches of 1-8 multiply inside the single ceil-rounding. Batch 8 was
      // once generated in full but billed as batch 4 — keep these pins.
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(87)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(4), ExpectedCredits(65)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(8), ExpectedCredits(130)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(346)),
      // Default resolution is 720p.
      (None, Seconds(5), Batch(1), ExpectedCredits(44)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p0Mini, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// Every batch size 1-8 bills in full at 720p 5s. Batch 8 once executed in
  /// full but billed as batch 4 — this sweep is the regression pin.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn seedance_2p0_mini_charges_every_batch_size_up_to_eight() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Batch, ExpectedCredits)] = &[
      (Batch(1), ExpectedCredits(44)),
      (Batch(2), ExpectedCredits(87)),
      (Batch(3), ExpectedCredits(130)),
      (Batch(4), ExpectedCredits(173)),
      (Batch(5), ExpectedCredits(217)),
      (Batch(6), ExpectedCredits(260)),
      (Batch(7), ExpectedCredits(303)),
      (Batch(8), ExpectedCredits(346)),
    ];

    for (batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p0Mini,
        Some(CommonResolution::SevenTwentyP), Seconds(5), *batch, *expected,
      ).await;
    }
  }

  /// Mini's with-references rate adds the surcharge before the single
  /// ceil-rounding. The unreachable fixture media fails the upload, so the
  /// exact charge is asserted on the refunded ledger entry.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn seedance_2p0_mini_charges_the_video_reference_rate() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(5), ExpectedCredits(21)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), ExpectedCredits(52)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), ExpectedCredits(104)),
    ];

    for (resolution, seconds, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p0Mini, *resolution, *seconds, Batch(1), *expected,
      ).await;
    }
  }
}

// ── Seedance 2.0 BytePlus Mini ──
// The Minis were NOT affected by the collapse bug (they never collapsed),
// but they get the same treatment so a future restructure can't silently
// change their billing either.
mod seedance_2p0_bp_mini {
  use super::*;

  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn seedance_2p0_byteplus_mini_charges_the_byteplus_mini_rates() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(4), Batch(1), ExpectedCredits(14)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(17)),
      (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(33)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(1), ExpectedCredits(50)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(1), ExpectedCredits(35)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(44)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(88)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(131)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(88)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(349)),
      // Default resolution is 720p.
      (None, Seconds(5), Batch(1), ExpectedCredits(44)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p0BytePlusMini, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// Every batch size 1-8 bills in full at 720p 5s.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn seedance_2p0_byteplus_mini_charges_every_batch_size_up_to_eight() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Batch, ExpectedCredits)] = &[
      (Batch(1), ExpectedCredits(44)),
      (Batch(2), ExpectedCredits(88)),
      (Batch(3), ExpectedCredits(131)),
      (Batch(4), ExpectedCredits(175)),
      (Batch(5), ExpectedCredits(219)),
      (Batch(6), ExpectedCredits(262)),
      (Batch(7), ExpectedCredits(306)),
      (Batch(8), ExpectedCredits(349)),
    ];

    for (batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p0BytePlusMini,
        Some(CommonResolution::SevenTwentyP), Seconds(5), *batch, *expected,
      ).await;
    }
  }

  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn seedance_2p0_byteplus_mini_charges_the_video_reference_rate() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(5), ExpectedCredits(21)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), ExpectedCredits(53)),
    ];

    for (resolution, seconds, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p0BytePlusMini, *resolution, *seconds, Batch(1), *expected,
      ).await;
    }
  }
}

// ── Seedance 2.0 BytePlus Ultra Mini ──
// Shares the BytePlus Mini rate card; routed to the BytePlus Ultra account.
mod seedance_2p0_bpu_mini {
  use super::*;

  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn seedance_2p0_byteplus_ultra_mini_charges_the_byteplus_mini_rates() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(17)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(1), ExpectedCredits(50)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(44)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(88)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(131)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(88)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(349)),
      // Default resolution is 720p.
      (None, Seconds(5), Batch(1), ExpectedCredits(44)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p0BytePlusUltraMini, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// Every batch size 1-8 bills in full at 720p 5s.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn seedance_2p0_byteplus_ultra_mini_charges_every_batch_size_up_to_eight() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Batch, ExpectedCredits)] = &[
      (Batch(1), ExpectedCredits(44)),
      (Batch(2), ExpectedCredits(88)),
      (Batch(3), ExpectedCredits(131)),
      (Batch(4), ExpectedCredits(175)),
      (Batch(5), ExpectedCredits(219)),
      (Batch(6), ExpectedCredits(262)),
      (Batch(7), ExpectedCredits(306)),
      (Batch(8), ExpectedCredits(349)),
    ];

    for (batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p0BytePlusUltraMini,
        Some(CommonResolution::SevenTwentyP), Seconds(5), *batch, *expected,
      ).await;
    }
  }

  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn seedance_2p0_byteplus_ultra_mini_charges_the_video_reference_rate() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(5), ExpectedCredits(21)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), ExpectedCredits(53)),
    ];

    for (resolution, seconds, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p0BytePlusUltraMini, *resolution, *seconds, Batch(1), *expected,
      ).await;
    }
  }
}

// ── Variant premiums over the base Mini model ──
// Both prices and the delta are encoded so a change to EITHER rate card
// shows up here. The BytePlus premium is sub-cent per second, so short
// durations round to a delta of ZERO; longer durations and batches make it
// materialize.
mod premium {
  use super::*;

  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn seedance_2p0_byteplus_mini_charges_a_premium_over_mini() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits, ExpectedCredits, CreditsDelta)] = &[
      // Ceil-rounding parity: the premium vanishes at 5s.
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(44), ExpectedCredits(44), CreditsDelta(0)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(87), ExpectedCredits(88), CreditsDelta(1)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(130), ExpectedCredits(131), CreditsDelta(1)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(1), ExpectedCredits(49), ExpectedCredits(50), CreditsDelta(1)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(346), ExpectedCredits(349), CreditsDelta(3)),
    ];

    for (resolution, seconds, batch, base, variant, delta) in cases {
      assert_variant_charges_premium(
        &harness,
        CommonVideoModel::Seedance2p0Mini,
        CommonVideoModel::Seedance2p0BytePlusMini,
        *resolution, *seconds, *batch, *base, *variant, *delta,
      ).await;
    }
  }

  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn seedance_2p0_byteplus_ultra_mini_charges_a_premium_over_mini() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits, ExpectedCredits, CreditsDelta)] = &[
      // Ceil-rounding parity: the premium vanishes at 5s.
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(44), ExpectedCredits(44), CreditsDelta(0)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(87), ExpectedCredits(88), CreditsDelta(1)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(130), ExpectedCredits(131), CreditsDelta(1)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(1), ExpectedCredits(49), ExpectedCredits(50), CreditsDelta(1)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(346), ExpectedCredits(349), CreditsDelta(3)),
    ];

    for (resolution, seconds, batch, base, variant, delta) in cases {
      assert_variant_charges_premium(
        &harness,
        CommonVideoModel::Seedance2p0Mini,
        CommonVideoModel::Seedance2p0BytePlusUltraMini,
        *resolution, *seconds, *batch, *base, *variant, *delta,
      ).await;
    }
  }
}
