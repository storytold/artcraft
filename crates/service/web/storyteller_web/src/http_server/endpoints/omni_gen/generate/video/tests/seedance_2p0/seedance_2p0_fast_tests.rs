//! Seedance 2.0 FAST tier pricing tests: real generate endpoint, test
//! database, exact wallet-debit assertions.
//!
//! Models covered: Seedance2p0Fast, Seedance2p0UltraFast,
//! Seedance2p0BytePlusFast, Seedance2p0BytePlusUltraFast (plus the
//! PreviewModelFast alias, kept for the collapse-bug pin).
//!
//! The Fast tier offers 480p and 720p; 1080p and 4K requests downgrade to
//! 720p on both execution and billing, which the tables below pin.

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

  /// Every duration 4-15s at every resolution, single video.
  /// 1080p and 4K downgrade to 720p (and price accordingly).
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn charges_every_duration_at_every_resolution() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(4), Batch(1), ExpectedCredits(21)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(26)),
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(1), ExpectedCredits(31)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(1), ExpectedCredits(36)),
      (Some(CommonResolution::FourEightyP), Seconds(8), Batch(1), ExpectedCredits(41)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(1), ExpectedCredits(47)),
      (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(52)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(1), ExpectedCredits(57)),
      (Some(CommonResolution::FourEightyP), Seconds(12), Batch(1), ExpectedCredits(62)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(1), ExpectedCredits(67)),
      (Some(CommonResolution::FourEightyP), Seconds(14), Batch(1), ExpectedCredits(73)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(1), ExpectedCredits(78)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(1), ExpectedCredits(51)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(64)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(1), ExpectedCredits(76)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(1), ExpectedCredits(89)),
      (Some(CommonResolution::SevenTwentyP), Seconds(8), Batch(1), ExpectedCredits(102)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(1), ExpectedCredits(115)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(127)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(1), ExpectedCredits(140)),
      (Some(CommonResolution::SevenTwentyP), Seconds(12), Batch(1), ExpectedCredits(153)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(1), ExpectedCredits(165)),
      (Some(CommonResolution::SevenTwentyP), Seconds(14), Batch(1), ExpectedCredits(178)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(191)),
      (Some(CommonResolution::TenEightyP), Seconds(4), Batch(1), ExpectedCredits(51)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(64)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(1), ExpectedCredits(76)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(1), ExpectedCredits(89)),
      (Some(CommonResolution::TenEightyP), Seconds(8), Batch(1), ExpectedCredits(102)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(1), ExpectedCredits(115)),
      (Some(CommonResolution::TenEightyP), Seconds(10), Batch(1), ExpectedCredits(127)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(1), ExpectedCredits(140)),
      (Some(CommonResolution::TenEightyP), Seconds(12), Batch(1), ExpectedCredits(153)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(1), ExpectedCredits(165)),
      (Some(CommonResolution::TenEightyP), Seconds(14), Batch(1), ExpectedCredits(178)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(1), ExpectedCredits(191)),
      (Some(CommonResolution::FourK), Seconds(4), Batch(1), ExpectedCredits(51)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(64)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(1), ExpectedCredits(76)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(1), ExpectedCredits(89)),
      (Some(CommonResolution::FourK), Seconds(8), Batch(1), ExpectedCredits(102)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(1), ExpectedCredits(115)),
      (Some(CommonResolution::FourK), Seconds(10), Batch(1), ExpectedCredits(127)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(1), ExpectedCredits(140)),
      (Some(CommonResolution::FourK), Seconds(12), Batch(1), ExpectedCredits(153)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(1), ExpectedCredits(165)),
      (Some(CommonResolution::FourK), Seconds(14), Batch(1), ExpectedCredits(178)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(1), ExpectedCredits(191)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p0Fast, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// Every batch size 1-10 at every resolution (5s).
  /// Batches over the platform max of 4 downgrade to 4 (3 upgrades to 4); execution and billing agree.
  /// 1080p and 4K downgrade to 720p (and price accordingly).
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn charges_every_batch_size_at_every_resolution() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(26)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(2), ExpectedCredits(52)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(3), ExpectedCredits(104)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(4), ExpectedCredits(104)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(5), ExpectedCredits(104)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(6), ExpectedCredits(104)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(7), ExpectedCredits(104)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(8), ExpectedCredits(104)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(9), ExpectedCredits(104)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(10), ExpectedCredits(104)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(64)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(127)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(3), ExpectedCredits(255)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(4), ExpectedCredits(255)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(5), ExpectedCredits(255)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(6), ExpectedCredits(255)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(7), ExpectedCredits(255)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(255)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(9), ExpectedCredits(255)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(10), ExpectedCredits(255)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(64)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(2), ExpectedCredits(127)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(3), ExpectedCredits(255)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(4), ExpectedCredits(255)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(5), ExpectedCredits(255)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(6), ExpectedCredits(255)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(7), ExpectedCredits(255)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(8), ExpectedCredits(255)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(9), ExpectedCredits(255)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(10), ExpectedCredits(255)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(64)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(2), ExpectedCredits(127)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(3), ExpectedCredits(255)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(4), ExpectedCredits(255)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(5), ExpectedCredits(255)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(6), ExpectedCredits(255)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(7), ExpectedCredits(255)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(8), ExpectedCredits(255)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(9), ExpectedCredits(255)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(10), ExpectedCredits(255)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p0Fast, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// Spot checks across duration x batch x resolution.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn charges_spot_checked_combinations() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(2), ExpectedCredits(62)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(3), ExpectedCredits(145)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(4), ExpectedCredits(187)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(5), ExpectedCredits(228)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(8), ExpectedCredits(269)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(10), ExpectedCredits(311)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(2), ExpectedCredits(153)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(3), ExpectedCredits(356)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(4), ExpectedCredits(458)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(5), ExpectedCredits(560)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(8), ExpectedCredits(662)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(10), ExpectedCredits(764)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(2), ExpectedCredits(153)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(3), ExpectedCredits(356)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(4), ExpectedCredits(458)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(5), ExpectedCredits(560)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(8), ExpectedCredits(662)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(10), ExpectedCredits(764)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(2), ExpectedCredits(153)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(3), ExpectedCredits(356)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(4), ExpectedCredits(458)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(5), ExpectedCredits(560)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(8), ExpectedCredits(662)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(10), ExpectedCredits(764)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p0Fast, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// With video references Fast switches to its with-references rate card (480p 8.41, 720p 15.60 cents/s, ceil-rounded). Charges are asserted on the refunded ledger entry (the fixture media is unreachable).
  /// Every duration 4-15s at every resolution, single video.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_every_duration_at_every_resolution() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(4), Batch(1), ExpectedCredits(34)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(43)),
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(1), ExpectedCredits(51)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(1), ExpectedCredits(59)),
      (Some(CommonResolution::FourEightyP), Seconds(8), Batch(1), ExpectedCredits(68)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(1), ExpectedCredits(76)),
      (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(85)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(1), ExpectedCredits(93)),
      (Some(CommonResolution::FourEightyP), Seconds(12), Batch(1), ExpectedCredits(101)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(1), ExpectedCredits(110)),
      (Some(CommonResolution::FourEightyP), Seconds(14), Batch(1), ExpectedCredits(118)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(1), ExpectedCredits(127)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(1), ExpectedCredits(63)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(78)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(1), ExpectedCredits(94)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(1), ExpectedCredits(110)),
      (Some(CommonResolution::SevenTwentyP), Seconds(8), Batch(1), ExpectedCredits(125)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(1), ExpectedCredits(141)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(156)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(1), ExpectedCredits(172)),
      (Some(CommonResolution::SevenTwentyP), Seconds(12), Batch(1), ExpectedCredits(188)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(1), ExpectedCredits(203)),
      (Some(CommonResolution::SevenTwentyP), Seconds(14), Batch(1), ExpectedCredits(219)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(234)),
      (Some(CommonResolution::TenEightyP), Seconds(4), Batch(1), ExpectedCredits(63)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(78)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(1), ExpectedCredits(94)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(1), ExpectedCredits(110)),
      (Some(CommonResolution::TenEightyP), Seconds(8), Batch(1), ExpectedCredits(125)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(1), ExpectedCredits(141)),
      (Some(CommonResolution::TenEightyP), Seconds(10), Batch(1), ExpectedCredits(156)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(1), ExpectedCredits(172)),
      (Some(CommonResolution::TenEightyP), Seconds(12), Batch(1), ExpectedCredits(188)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(1), ExpectedCredits(203)),
      (Some(CommonResolution::TenEightyP), Seconds(14), Batch(1), ExpectedCredits(219)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(1), ExpectedCredits(234)),
      (Some(CommonResolution::FourK), Seconds(4), Batch(1), ExpectedCredits(63)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(78)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(1), ExpectedCredits(94)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(1), ExpectedCredits(110)),
      (Some(CommonResolution::FourK), Seconds(8), Batch(1), ExpectedCredits(125)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(1), ExpectedCredits(141)),
      (Some(CommonResolution::FourK), Seconds(10), Batch(1), ExpectedCredits(156)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(1), ExpectedCredits(172)),
      (Some(CommonResolution::FourK), Seconds(12), Batch(1), ExpectedCredits(188)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(1), ExpectedCredits(203)),
      (Some(CommonResolution::FourK), Seconds(14), Batch(1), ExpectedCredits(219)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(1), ExpectedCredits(234)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p0Fast, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// With video references Fast switches to its with-references rate card (480p 8.41, 720p 15.60 cents/s, ceil-rounded). Charges are asserted on the refunded ledger entry (the fixture media is unreachable).
  /// Every batch size 1-10 at every resolution (5s).
  /// Batches over the platform max of 4 downgrade to 4 (3 upgrades to 4); execution and billing agree.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_every_batch_size_at_every_resolution() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(43)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(2), ExpectedCredits(85)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(3), ExpectedCredits(169)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(4), ExpectedCredits(169)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(5), ExpectedCredits(169)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(6), ExpectedCredits(169)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(7), ExpectedCredits(169)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(8), ExpectedCredits(169)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(9), ExpectedCredits(169)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(10), ExpectedCredits(169)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(78)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(156)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(3), ExpectedCredits(312)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(4), ExpectedCredits(312)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(5), ExpectedCredits(312)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(6), ExpectedCredits(312)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(7), ExpectedCredits(312)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(312)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(9), ExpectedCredits(312)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(10), ExpectedCredits(312)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(78)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(2), ExpectedCredits(156)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(3), ExpectedCredits(312)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(4), ExpectedCredits(312)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(5), ExpectedCredits(312)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(6), ExpectedCredits(312)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(7), ExpectedCredits(312)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(8), ExpectedCredits(312)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(9), ExpectedCredits(312)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(10), ExpectedCredits(312)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(78)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(2), ExpectedCredits(156)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(3), ExpectedCredits(312)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(4), ExpectedCredits(312)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(5), ExpectedCredits(312)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(6), ExpectedCredits(312)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(7), ExpectedCredits(312)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(8), ExpectedCredits(312)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(9), ExpectedCredits(312)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(10), ExpectedCredits(312)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p0Fast, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// With video references Fast switches to its with-references rate card (480p 8.41, 720p 15.60 cents/s, ceil-rounded). Charges are asserted on the refunded ledger entry (the fixture media is unreachable).
  /// Spot checks across duration x batch x resolution.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_spot_checked_combinations() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(2), ExpectedCredits(101)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(3), ExpectedCredits(236)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(4), ExpectedCredits(303)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(5), ExpectedCredits(371)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(8), ExpectedCredits(438)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(10), ExpectedCredits(505)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(2), ExpectedCredits(188)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(3), ExpectedCredits(437)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(4), ExpectedCredits(562)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(5), ExpectedCredits(687)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(8), ExpectedCredits(812)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(10), ExpectedCredits(936)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(2), ExpectedCredits(188)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(3), ExpectedCredits(437)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(4), ExpectedCredits(562)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(5), ExpectedCredits(687)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(8), ExpectedCredits(812)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(10), ExpectedCredits(936)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(2), ExpectedCredits(188)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(3), ExpectedCredits(437)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(4), ExpectedCredits(562)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(5), ExpectedCredits(687)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(8), ExpectedCredits(812)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(10), ExpectedCredits(936)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p0Fast, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }
}

// ── Seedance 2.0 BytePlus Fast (+ its PreviewModelFast alias) ──
// Collapse-bug regression pins: 480p 9 ¢/s, 720p 20 ¢/s. The shipped bug
// billed the base Fast rate (720p 5s: 64 instead of 100).
mod seedance_2p0_bp_fast {
  use super::*;

  /// Every duration 4-15s at every resolution, single video.
  /// 1080p and 4K downgrade to 720p (and price accordingly).
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn charges_every_duration_at_every_resolution() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(4), Batch(1), ExpectedCredits(36)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(45)),
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(1), ExpectedCredits(54)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(1), ExpectedCredits(63)),
      (Some(CommonResolution::FourEightyP), Seconds(8), Batch(1), ExpectedCredits(72)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(1), ExpectedCredits(81)),
      (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(90)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(1), ExpectedCredits(99)),
      (Some(CommonResolution::FourEightyP), Seconds(12), Batch(1), ExpectedCredits(108)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(1), ExpectedCredits(117)),
      (Some(CommonResolution::FourEightyP), Seconds(14), Batch(1), ExpectedCredits(126)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(1), ExpectedCredits(135)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(1), ExpectedCredits(80)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(100)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(1), ExpectedCredits(120)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(1), ExpectedCredits(140)),
      (Some(CommonResolution::SevenTwentyP), Seconds(8), Batch(1), ExpectedCredits(160)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(1), ExpectedCredits(180)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(200)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(1), ExpectedCredits(220)),
      (Some(CommonResolution::SevenTwentyP), Seconds(12), Batch(1), ExpectedCredits(240)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(1), ExpectedCredits(260)),
      (Some(CommonResolution::SevenTwentyP), Seconds(14), Batch(1), ExpectedCredits(280)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(300)),
      (Some(CommonResolution::TenEightyP), Seconds(4), Batch(1), ExpectedCredits(80)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(100)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(1), ExpectedCredits(120)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(1), ExpectedCredits(140)),
      (Some(CommonResolution::TenEightyP), Seconds(8), Batch(1), ExpectedCredits(160)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(1), ExpectedCredits(180)),
      (Some(CommonResolution::TenEightyP), Seconds(10), Batch(1), ExpectedCredits(200)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(1), ExpectedCredits(220)),
      (Some(CommonResolution::TenEightyP), Seconds(12), Batch(1), ExpectedCredits(240)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(1), ExpectedCredits(260)),
      (Some(CommonResolution::TenEightyP), Seconds(14), Batch(1), ExpectedCredits(280)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(1), ExpectedCredits(300)),
      (Some(CommonResolution::FourK), Seconds(4), Batch(1), ExpectedCredits(80)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(100)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(1), ExpectedCredits(120)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(1), ExpectedCredits(140)),
      (Some(CommonResolution::FourK), Seconds(8), Batch(1), ExpectedCredits(160)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(1), ExpectedCredits(180)),
      (Some(CommonResolution::FourK), Seconds(10), Batch(1), ExpectedCredits(200)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(1), ExpectedCredits(220)),
      (Some(CommonResolution::FourK), Seconds(12), Batch(1), ExpectedCredits(240)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(1), ExpectedCredits(260)),
      (Some(CommonResolution::FourK), Seconds(14), Batch(1), ExpectedCredits(280)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(1), ExpectedCredits(300)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p0BytePlusFast, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// Every batch size 1-10 at every resolution (5s).
  /// Batches over the platform max of 4 downgrade to 4 (3 upgrades to 4); execution and billing agree.
  /// 1080p and 4K downgrade to 720p (and price accordingly).
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn charges_every_batch_size_at_every_resolution() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(45)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(2), ExpectedCredits(90)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(3), ExpectedCredits(180)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(4), ExpectedCredits(180)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(5), ExpectedCredits(180)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(6), ExpectedCredits(180)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(7), ExpectedCredits(180)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(8), ExpectedCredits(180)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(9), ExpectedCredits(180)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(10), ExpectedCredits(180)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(100)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(200)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(3), ExpectedCredits(400)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(4), ExpectedCredits(400)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(5), ExpectedCredits(400)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(6), ExpectedCredits(400)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(7), ExpectedCredits(400)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(400)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(9), ExpectedCredits(400)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(10), ExpectedCredits(400)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(100)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(2), ExpectedCredits(200)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(3), ExpectedCredits(400)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(4), ExpectedCredits(400)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(5), ExpectedCredits(400)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(6), ExpectedCredits(400)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(7), ExpectedCredits(400)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(8), ExpectedCredits(400)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(9), ExpectedCredits(400)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(10), ExpectedCredits(400)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(100)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(2), ExpectedCredits(200)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(3), ExpectedCredits(400)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(4), ExpectedCredits(400)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(5), ExpectedCredits(400)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(6), ExpectedCredits(400)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(7), ExpectedCredits(400)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(8), ExpectedCredits(400)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(9), ExpectedCredits(400)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(10), ExpectedCredits(400)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p0BytePlusFast, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// Spot checks across duration x batch x resolution.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn charges_spot_checked_combinations() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(2), ExpectedCredits(108)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(3), ExpectedCredits(252)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(4), ExpectedCredits(324)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(5), ExpectedCredits(396)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(8), ExpectedCredits(468)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(10), ExpectedCredits(540)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(2), ExpectedCredits(240)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(3), ExpectedCredits(560)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(4), ExpectedCredits(720)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(5), ExpectedCredits(880)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(8), ExpectedCredits(1040)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(10), ExpectedCredits(1200)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(2), ExpectedCredits(240)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(3), ExpectedCredits(560)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(4), ExpectedCredits(720)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(5), ExpectedCredits(880)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(8), ExpectedCredits(1040)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(10), ExpectedCredits(1200)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(2), ExpectedCredits(240)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(3), ExpectedCredits(560)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(4), ExpectedCredits(720)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(5), ExpectedCredits(880)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(8), ExpectedCredits(1040)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(10), ExpectedCredits(1200)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p0BytePlusFast, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// The BytePlus Fast rate card is flat: reference videos never change the price. Charges are asserted on the refunded ledger entry (the fixture media is unreachable).
  /// Every duration 4-15s at every resolution, single video.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_every_duration_at_every_resolution() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(4), Batch(1), ExpectedCredits(36)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(45)),
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(1), ExpectedCredits(54)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(1), ExpectedCredits(63)),
      (Some(CommonResolution::FourEightyP), Seconds(8), Batch(1), ExpectedCredits(72)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(1), ExpectedCredits(81)),
      (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(90)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(1), ExpectedCredits(99)),
      (Some(CommonResolution::FourEightyP), Seconds(12), Batch(1), ExpectedCredits(108)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(1), ExpectedCredits(117)),
      (Some(CommonResolution::FourEightyP), Seconds(14), Batch(1), ExpectedCredits(126)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(1), ExpectedCredits(135)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(1), ExpectedCredits(80)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(100)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(1), ExpectedCredits(120)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(1), ExpectedCredits(140)),
      (Some(CommonResolution::SevenTwentyP), Seconds(8), Batch(1), ExpectedCredits(160)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(1), ExpectedCredits(180)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(200)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(1), ExpectedCredits(220)),
      (Some(CommonResolution::SevenTwentyP), Seconds(12), Batch(1), ExpectedCredits(240)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(1), ExpectedCredits(260)),
      (Some(CommonResolution::SevenTwentyP), Seconds(14), Batch(1), ExpectedCredits(280)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(300)),
      (Some(CommonResolution::TenEightyP), Seconds(4), Batch(1), ExpectedCredits(80)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(100)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(1), ExpectedCredits(120)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(1), ExpectedCredits(140)),
      (Some(CommonResolution::TenEightyP), Seconds(8), Batch(1), ExpectedCredits(160)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(1), ExpectedCredits(180)),
      (Some(CommonResolution::TenEightyP), Seconds(10), Batch(1), ExpectedCredits(200)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(1), ExpectedCredits(220)),
      (Some(CommonResolution::TenEightyP), Seconds(12), Batch(1), ExpectedCredits(240)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(1), ExpectedCredits(260)),
      (Some(CommonResolution::TenEightyP), Seconds(14), Batch(1), ExpectedCredits(280)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(1), ExpectedCredits(300)),
      (Some(CommonResolution::FourK), Seconds(4), Batch(1), ExpectedCredits(80)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(100)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(1), ExpectedCredits(120)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(1), ExpectedCredits(140)),
      (Some(CommonResolution::FourK), Seconds(8), Batch(1), ExpectedCredits(160)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(1), ExpectedCredits(180)),
      (Some(CommonResolution::FourK), Seconds(10), Batch(1), ExpectedCredits(200)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(1), ExpectedCredits(220)),
      (Some(CommonResolution::FourK), Seconds(12), Batch(1), ExpectedCredits(240)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(1), ExpectedCredits(260)),
      (Some(CommonResolution::FourK), Seconds(14), Batch(1), ExpectedCredits(280)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(1), ExpectedCredits(300)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p0BytePlusFast, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// The BytePlus Fast rate card is flat: reference videos never change the price. Charges are asserted on the refunded ledger entry (the fixture media is unreachable).
  /// Every batch size 1-10 at every resolution (5s).
  /// Batches over the platform max of 4 downgrade to 4 (3 upgrades to 4); execution and billing agree.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_every_batch_size_at_every_resolution() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(45)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(2), ExpectedCredits(90)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(3), ExpectedCredits(180)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(4), ExpectedCredits(180)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(5), ExpectedCredits(180)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(6), ExpectedCredits(180)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(7), ExpectedCredits(180)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(8), ExpectedCredits(180)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(9), ExpectedCredits(180)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(10), ExpectedCredits(180)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(100)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(200)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(3), ExpectedCredits(400)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(4), ExpectedCredits(400)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(5), ExpectedCredits(400)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(6), ExpectedCredits(400)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(7), ExpectedCredits(400)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(400)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(9), ExpectedCredits(400)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(10), ExpectedCredits(400)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(100)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(2), ExpectedCredits(200)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(3), ExpectedCredits(400)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(4), ExpectedCredits(400)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(5), ExpectedCredits(400)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(6), ExpectedCredits(400)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(7), ExpectedCredits(400)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(8), ExpectedCredits(400)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(9), ExpectedCredits(400)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(10), ExpectedCredits(400)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(100)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(2), ExpectedCredits(200)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(3), ExpectedCredits(400)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(4), ExpectedCredits(400)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(5), ExpectedCredits(400)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(6), ExpectedCredits(400)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(7), ExpectedCredits(400)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(8), ExpectedCredits(400)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(9), ExpectedCredits(400)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(10), ExpectedCredits(400)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p0BytePlusFast, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// The BytePlus Fast rate card is flat: reference videos never change the price. Charges are asserted on the refunded ledger entry (the fixture media is unreachable).
  /// Spot checks across duration x batch x resolution.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_spot_checked_combinations() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(2), ExpectedCredits(108)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(3), ExpectedCredits(252)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(4), ExpectedCredits(324)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(5), ExpectedCredits(396)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(8), ExpectedCredits(468)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(10), ExpectedCredits(540)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(2), ExpectedCredits(240)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(3), ExpectedCredits(560)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(4), ExpectedCredits(720)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(5), ExpectedCredits(880)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(8), ExpectedCredits(1040)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(10), ExpectedCredits(1200)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(2), ExpectedCredits(240)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(3), ExpectedCredits(560)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(4), ExpectedCredits(720)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(5), ExpectedCredits(880)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(8), ExpectedCredits(1040)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(10), ExpectedCredits(1200)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(2), ExpectedCredits(240)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(3), ExpectedCredits(560)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(4), ExpectedCredits(720)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(5), ExpectedCredits(880)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(8), ExpectedCredits(1040)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(10), ExpectedCredits(1200)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
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

  /// Every duration 4-15s at every resolution, single video.
  /// 1080p and 4K downgrade to 720p (and price accordingly).
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn charges_every_duration_at_every_resolution() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(4), Batch(1), ExpectedCredits(36)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(45)),
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(1), ExpectedCredits(54)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(1), ExpectedCredits(63)),
      (Some(CommonResolution::FourEightyP), Seconds(8), Batch(1), ExpectedCredits(72)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(1), ExpectedCredits(81)),
      (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(90)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(1), ExpectedCredits(99)),
      (Some(CommonResolution::FourEightyP), Seconds(12), Batch(1), ExpectedCredits(108)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(1), ExpectedCredits(117)),
      (Some(CommonResolution::FourEightyP), Seconds(14), Batch(1), ExpectedCredits(126)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(1), ExpectedCredits(135)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(1), ExpectedCredits(80)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(100)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(1), ExpectedCredits(120)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(1), ExpectedCredits(140)),
      (Some(CommonResolution::SevenTwentyP), Seconds(8), Batch(1), ExpectedCredits(160)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(1), ExpectedCredits(180)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(200)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(1), ExpectedCredits(220)),
      (Some(CommonResolution::SevenTwentyP), Seconds(12), Batch(1), ExpectedCredits(240)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(1), ExpectedCredits(260)),
      (Some(CommonResolution::SevenTwentyP), Seconds(14), Batch(1), ExpectedCredits(280)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(300)),
      (Some(CommonResolution::TenEightyP), Seconds(4), Batch(1), ExpectedCredits(80)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(100)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(1), ExpectedCredits(120)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(1), ExpectedCredits(140)),
      (Some(CommonResolution::TenEightyP), Seconds(8), Batch(1), ExpectedCredits(160)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(1), ExpectedCredits(180)),
      (Some(CommonResolution::TenEightyP), Seconds(10), Batch(1), ExpectedCredits(200)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(1), ExpectedCredits(220)),
      (Some(CommonResolution::TenEightyP), Seconds(12), Batch(1), ExpectedCredits(240)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(1), ExpectedCredits(260)),
      (Some(CommonResolution::TenEightyP), Seconds(14), Batch(1), ExpectedCredits(280)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(1), ExpectedCredits(300)),
      (Some(CommonResolution::FourK), Seconds(4), Batch(1), ExpectedCredits(80)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(100)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(1), ExpectedCredits(120)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(1), ExpectedCredits(140)),
      (Some(CommonResolution::FourK), Seconds(8), Batch(1), ExpectedCredits(160)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(1), ExpectedCredits(180)),
      (Some(CommonResolution::FourK), Seconds(10), Batch(1), ExpectedCredits(200)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(1), ExpectedCredits(220)),
      (Some(CommonResolution::FourK), Seconds(12), Batch(1), ExpectedCredits(240)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(1), ExpectedCredits(260)),
      (Some(CommonResolution::FourK), Seconds(14), Batch(1), ExpectedCredits(280)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(1), ExpectedCredits(300)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p0BytePlusUltraFast, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// Every batch size 1-10 at every resolution (5s).
  /// Batches over the platform max of 4 downgrade to 4 (3 upgrades to 4); execution and billing agree.
  /// 1080p and 4K downgrade to 720p (and price accordingly).
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn charges_every_batch_size_at_every_resolution() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(45)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(2), ExpectedCredits(90)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(3), ExpectedCredits(180)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(4), ExpectedCredits(180)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(5), ExpectedCredits(180)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(6), ExpectedCredits(180)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(7), ExpectedCredits(180)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(8), ExpectedCredits(180)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(9), ExpectedCredits(180)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(10), ExpectedCredits(180)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(100)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(200)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(3), ExpectedCredits(400)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(4), ExpectedCredits(400)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(5), ExpectedCredits(400)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(6), ExpectedCredits(400)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(7), ExpectedCredits(400)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(400)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(9), ExpectedCredits(400)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(10), ExpectedCredits(400)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(100)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(2), ExpectedCredits(200)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(3), ExpectedCredits(400)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(4), ExpectedCredits(400)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(5), ExpectedCredits(400)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(6), ExpectedCredits(400)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(7), ExpectedCredits(400)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(8), ExpectedCredits(400)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(9), ExpectedCredits(400)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(10), ExpectedCredits(400)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(100)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(2), ExpectedCredits(200)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(3), ExpectedCredits(400)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(4), ExpectedCredits(400)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(5), ExpectedCredits(400)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(6), ExpectedCredits(400)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(7), ExpectedCredits(400)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(8), ExpectedCredits(400)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(9), ExpectedCredits(400)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(10), ExpectedCredits(400)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p0BytePlusUltraFast, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// Spot checks across duration x batch x resolution.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn charges_spot_checked_combinations() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(2), ExpectedCredits(108)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(3), ExpectedCredits(252)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(4), ExpectedCredits(324)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(5), ExpectedCredits(396)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(8), ExpectedCredits(468)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(10), ExpectedCredits(540)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(2), ExpectedCredits(240)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(3), ExpectedCredits(560)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(4), ExpectedCredits(720)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(5), ExpectedCredits(880)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(8), ExpectedCredits(1040)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(10), ExpectedCredits(1200)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(2), ExpectedCredits(240)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(3), ExpectedCredits(560)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(4), ExpectedCredits(720)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(5), ExpectedCredits(880)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(8), ExpectedCredits(1040)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(10), ExpectedCredits(1200)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(2), ExpectedCredits(240)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(3), ExpectedCredits(560)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(4), ExpectedCredits(720)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(5), ExpectedCredits(880)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(8), ExpectedCredits(1040)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(10), ExpectedCredits(1200)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p0BytePlusUltraFast, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// The BytePlus Fast rate card is flat: reference videos never change the price. Charges are asserted on the refunded ledger entry (the fixture media is unreachable).
  /// Every duration 4-15s at every resolution, single video.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_every_duration_at_every_resolution() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(4), Batch(1), ExpectedCredits(36)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(45)),
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(1), ExpectedCredits(54)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(1), ExpectedCredits(63)),
      (Some(CommonResolution::FourEightyP), Seconds(8), Batch(1), ExpectedCredits(72)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(1), ExpectedCredits(81)),
      (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(90)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(1), ExpectedCredits(99)),
      (Some(CommonResolution::FourEightyP), Seconds(12), Batch(1), ExpectedCredits(108)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(1), ExpectedCredits(117)),
      (Some(CommonResolution::FourEightyP), Seconds(14), Batch(1), ExpectedCredits(126)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(1), ExpectedCredits(135)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(1), ExpectedCredits(80)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(100)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(1), ExpectedCredits(120)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(1), ExpectedCredits(140)),
      (Some(CommonResolution::SevenTwentyP), Seconds(8), Batch(1), ExpectedCredits(160)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(1), ExpectedCredits(180)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(200)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(1), ExpectedCredits(220)),
      (Some(CommonResolution::SevenTwentyP), Seconds(12), Batch(1), ExpectedCredits(240)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(1), ExpectedCredits(260)),
      (Some(CommonResolution::SevenTwentyP), Seconds(14), Batch(1), ExpectedCredits(280)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(300)),
      (Some(CommonResolution::TenEightyP), Seconds(4), Batch(1), ExpectedCredits(80)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(100)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(1), ExpectedCredits(120)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(1), ExpectedCredits(140)),
      (Some(CommonResolution::TenEightyP), Seconds(8), Batch(1), ExpectedCredits(160)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(1), ExpectedCredits(180)),
      (Some(CommonResolution::TenEightyP), Seconds(10), Batch(1), ExpectedCredits(200)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(1), ExpectedCredits(220)),
      (Some(CommonResolution::TenEightyP), Seconds(12), Batch(1), ExpectedCredits(240)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(1), ExpectedCredits(260)),
      (Some(CommonResolution::TenEightyP), Seconds(14), Batch(1), ExpectedCredits(280)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(1), ExpectedCredits(300)),
      (Some(CommonResolution::FourK), Seconds(4), Batch(1), ExpectedCredits(80)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(100)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(1), ExpectedCredits(120)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(1), ExpectedCredits(140)),
      (Some(CommonResolution::FourK), Seconds(8), Batch(1), ExpectedCredits(160)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(1), ExpectedCredits(180)),
      (Some(CommonResolution::FourK), Seconds(10), Batch(1), ExpectedCredits(200)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(1), ExpectedCredits(220)),
      (Some(CommonResolution::FourK), Seconds(12), Batch(1), ExpectedCredits(240)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(1), ExpectedCredits(260)),
      (Some(CommonResolution::FourK), Seconds(14), Batch(1), ExpectedCredits(280)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(1), ExpectedCredits(300)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p0BytePlusUltraFast, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// The BytePlus Fast rate card is flat: reference videos never change the price. Charges are asserted on the refunded ledger entry (the fixture media is unreachable).
  /// Every batch size 1-10 at every resolution (5s).
  /// Batches over the platform max of 4 downgrade to 4 (3 upgrades to 4); execution and billing agree.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_every_batch_size_at_every_resolution() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(45)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(2), ExpectedCredits(90)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(3), ExpectedCredits(180)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(4), ExpectedCredits(180)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(5), ExpectedCredits(180)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(6), ExpectedCredits(180)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(7), ExpectedCredits(180)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(8), ExpectedCredits(180)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(9), ExpectedCredits(180)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(10), ExpectedCredits(180)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(100)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(200)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(3), ExpectedCredits(400)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(4), ExpectedCredits(400)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(5), ExpectedCredits(400)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(6), ExpectedCredits(400)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(7), ExpectedCredits(400)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(400)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(9), ExpectedCredits(400)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(10), ExpectedCredits(400)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(100)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(2), ExpectedCredits(200)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(3), ExpectedCredits(400)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(4), ExpectedCredits(400)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(5), ExpectedCredits(400)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(6), ExpectedCredits(400)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(7), ExpectedCredits(400)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(8), ExpectedCredits(400)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(9), ExpectedCredits(400)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(10), ExpectedCredits(400)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(100)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(2), ExpectedCredits(200)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(3), ExpectedCredits(400)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(4), ExpectedCredits(400)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(5), ExpectedCredits(400)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(6), ExpectedCredits(400)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(7), ExpectedCredits(400)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(8), ExpectedCredits(400)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(9), ExpectedCredits(400)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(10), ExpectedCredits(400)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p0BytePlusUltraFast, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// The BytePlus Fast rate card is flat: reference videos never change the price. Charges are asserted on the refunded ledger entry (the fixture media is unreachable).
  /// Spot checks across duration x batch x resolution.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_spot_checked_combinations() {
    let _serial = mysql_testing::serial::acquire_serial_test_lock().await;
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(2), ExpectedCredits(108)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(3), ExpectedCredits(252)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(4), ExpectedCredits(324)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(5), ExpectedCredits(396)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(8), ExpectedCredits(468)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(10), ExpectedCredits(540)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(2), ExpectedCredits(240)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(3), ExpectedCredits(560)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(4), ExpectedCredits(720)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(5), ExpectedCredits(880)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(8), ExpectedCredits(1040)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(10), ExpectedCredits(1200)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(2), ExpectedCredits(240)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(3), ExpectedCredits(560)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(4), ExpectedCredits(720)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(5), ExpectedCredits(880)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(8), ExpectedCredits(1040)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(10), ExpectedCredits(1200)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(2), ExpectedCredits(240)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(3), ExpectedCredits(560)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(4), ExpectedCredits(720)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(5), ExpectedCredits(880)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(8), ExpectedCredits(1040)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(10), ExpectedCredits(1200)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
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
