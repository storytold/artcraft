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
//!
//! The Mini tier offers 480p and 720p; 1080p and 4K requests downgrade to
//! 720p on both execution and billing, which the tables below pin. Batches
//! of 1-8 bill in full (once, batch 8 executed in full but billed as 4).

use enums::common::generation::common_resolution::CommonResolution;
use enums::common::generation::common_video_model::CommonVideoModel;

use crate::http_server::endpoints::omni_gen::generate::video::tests::support::{
  assert_reference_video_charge_then_refund, assert_references_charge_more, assert_successful_generation_charges,
  assert_variant_charges_premium, Batch, CreditsDelta, ExpectedCredits, Seconds, TestHarness,
};

// ── Seedance 2.0 Mini (Volcengine) ──
mod seedance_2p0_mini {
  use super::*;

  /// Every duration 4-15s at every resolution, single video.
  /// 1080p and 4K downgrade to 720p (and price accordingly).
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn charges_every_duration_at_every_resolution() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(4), Batch(1), ExpectedCredits(14)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(18)),
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(1), ExpectedCredits(21)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(1), ExpectedCredits(25)),
      (Some(CommonResolution::FourEightyP), Seconds(8), Batch(1), ExpectedCredits(28)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(1), ExpectedCredits(32)),
      (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(35)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(1), ExpectedCredits(38)),
      (Some(CommonResolution::FourEightyP), Seconds(12), Batch(1), ExpectedCredits(42)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(1), ExpectedCredits(45)),
      (Some(CommonResolution::FourEightyP), Seconds(14), Batch(1), ExpectedCredits(49)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(1), ExpectedCredits(52)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(1), ExpectedCredits(36)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(45)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(1), ExpectedCredits(54)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(1), ExpectedCredits(63)),
      (Some(CommonResolution::SevenTwentyP), Seconds(8), Batch(1), ExpectedCredits(72)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(1), ExpectedCredits(81)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(89)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(1), ExpectedCredits(98)),
      (Some(CommonResolution::SevenTwentyP), Seconds(12), Batch(1), ExpectedCredits(107)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(1), ExpectedCredits(116)),
      (Some(CommonResolution::SevenTwentyP), Seconds(14), Batch(1), ExpectedCredits(125)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(134)),
      (Some(CommonResolution::TenEightyP), Seconds(4), Batch(1), ExpectedCredits(36)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(45)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(1), ExpectedCredits(54)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(1), ExpectedCredits(63)),
      (Some(CommonResolution::TenEightyP), Seconds(8), Batch(1), ExpectedCredits(72)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(1), ExpectedCredits(81)),
      (Some(CommonResolution::TenEightyP), Seconds(10), Batch(1), ExpectedCredits(89)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(1), ExpectedCredits(98)),
      (Some(CommonResolution::TenEightyP), Seconds(12), Batch(1), ExpectedCredits(107)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(1), ExpectedCredits(116)),
      (Some(CommonResolution::TenEightyP), Seconds(14), Batch(1), ExpectedCredits(125)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(1), ExpectedCredits(134)),
      (Some(CommonResolution::FourK), Seconds(4), Batch(1), ExpectedCredits(36)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(45)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(1), ExpectedCredits(54)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(1), ExpectedCredits(63)),
      (Some(CommonResolution::FourK), Seconds(8), Batch(1), ExpectedCredits(72)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(1), ExpectedCredits(81)),
      (Some(CommonResolution::FourK), Seconds(10), Batch(1), ExpectedCredits(89)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(1), ExpectedCredits(98)),
      (Some(CommonResolution::FourK), Seconds(12), Batch(1), ExpectedCredits(107)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(1), ExpectedCredits(116)),
      (Some(CommonResolution::FourK), Seconds(14), Batch(1), ExpectedCredits(125)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(1), ExpectedCredits(134)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p0Mini, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// Every batch size 1-10 at every resolution (5s).
  /// Mini supports batches of 1-8 and bills them in full; 9-10 clamp to 8.
  /// 1080p and 4K downgrade to 720p (and price accordingly).
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn charges_every_batch_size_at_every_resolution() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(18)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(2), ExpectedCredits(35)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(3), ExpectedCredits(52)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(4), ExpectedCredits(69)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(5), ExpectedCredits(87)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(6), ExpectedCredits(104)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(7), ExpectedCredits(121)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(8), ExpectedCredits(138)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(9), ExpectedCredits(138)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(10), ExpectedCredits(138)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(45)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(89)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(3), ExpectedCredits(134)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(4), ExpectedCredits(178)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(5), ExpectedCredits(223)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(6), ExpectedCredits(267)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(7), ExpectedCredits(312)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(356)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(9), ExpectedCredits(356)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(10), ExpectedCredits(356)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(45)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(2), ExpectedCredits(89)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(3), ExpectedCredits(134)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(4), ExpectedCredits(178)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(5), ExpectedCredits(223)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(6), ExpectedCredits(267)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(7), ExpectedCredits(312)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(8), ExpectedCredits(356)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(9), ExpectedCredits(356)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(10), ExpectedCredits(356)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(45)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(2), ExpectedCredits(89)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(3), ExpectedCredits(134)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(4), ExpectedCredits(178)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(5), ExpectedCredits(223)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(6), ExpectedCredits(267)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(7), ExpectedCredits(312)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(8), ExpectedCredits(356)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(9), ExpectedCredits(356)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(10), ExpectedCredits(356)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p0Mini, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// Spot checks across duration x batch x resolution.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn charges_spot_checked_combinations() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(2), ExpectedCredits(42)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(3), ExpectedCredits(73)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(4), ExpectedCredits(125)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(5), ExpectedCredits(190)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(8), ExpectedCredits(359)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(10), ExpectedCredits(414)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(2), ExpectedCredits(107)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(3), ExpectedCredits(187)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(4), ExpectedCredits(321)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(5), ExpectedCredits(490)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(8), ExpectedCredits(926)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(10), ExpectedCredits(1068)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(2), ExpectedCredits(107)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(3), ExpectedCredits(187)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(4), ExpectedCredits(321)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(5), ExpectedCredits(490)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(8), ExpectedCredits(926)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(10), ExpectedCredits(1068)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(2), ExpectedCredits(107)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(3), ExpectedCredits(187)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(4), ExpectedCredits(321)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(5), ExpectedCredits(490)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(8), ExpectedCredits(926)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(10), ExpectedCredits(1068)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p0Mini, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// With video references Mini adds its per-second surcharge before the single ceil-rounding. Charges are asserted on the refunded ledger entry (the fixture media is unreachable).
  /// Every duration 4-15s at every resolution, single video.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_every_duration_at_every_resolution() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(4), Batch(1), ExpectedCredits(18)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(22)),
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(1), ExpectedCredits(27)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(1), ExpectedCredits(31)),
      (Some(CommonResolution::FourEightyP), Seconds(8), Batch(1), ExpectedCredits(35)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(1), ExpectedCredits(40)),
      (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(44)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(1), ExpectedCredits(48)),
      (Some(CommonResolution::FourEightyP), Seconds(12), Batch(1), ExpectedCredits(53)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(1), ExpectedCredits(57)),
      (Some(CommonResolution::FourEightyP), Seconds(14), Batch(1), ExpectedCredits(61)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(1), ExpectedCredits(66)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(1), ExpectedCredits(43)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(54)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(1), ExpectedCredits(65)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(1), ExpectedCredits(75)),
      (Some(CommonResolution::SevenTwentyP), Seconds(8), Batch(1), ExpectedCredits(86)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(1), ExpectedCredits(97)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(108)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(1), ExpectedCredits(118)),
      (Some(CommonResolution::SevenTwentyP), Seconds(12), Batch(1), ExpectedCredits(129)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(1), ExpectedCredits(140)),
      (Some(CommonResolution::SevenTwentyP), Seconds(14), Batch(1), ExpectedCredits(150)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(161)),
      (Some(CommonResolution::TenEightyP), Seconds(4), Batch(1), ExpectedCredits(43)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(54)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(1), ExpectedCredits(65)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(1), ExpectedCredits(75)),
      (Some(CommonResolution::TenEightyP), Seconds(8), Batch(1), ExpectedCredits(86)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(1), ExpectedCredits(97)),
      (Some(CommonResolution::TenEightyP), Seconds(10), Batch(1), ExpectedCredits(108)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(1), ExpectedCredits(118)),
      (Some(CommonResolution::TenEightyP), Seconds(12), Batch(1), ExpectedCredits(129)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(1), ExpectedCredits(140)),
      (Some(CommonResolution::TenEightyP), Seconds(14), Batch(1), ExpectedCredits(150)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(1), ExpectedCredits(161)),
      (Some(CommonResolution::FourK), Seconds(4), Batch(1), ExpectedCredits(43)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(54)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(1), ExpectedCredits(65)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(1), ExpectedCredits(75)),
      (Some(CommonResolution::FourK), Seconds(8), Batch(1), ExpectedCredits(86)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(1), ExpectedCredits(97)),
      (Some(CommonResolution::FourK), Seconds(10), Batch(1), ExpectedCredits(108)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(1), ExpectedCredits(118)),
      (Some(CommonResolution::FourK), Seconds(12), Batch(1), ExpectedCredits(129)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(1), ExpectedCredits(140)),
      (Some(CommonResolution::FourK), Seconds(14), Batch(1), ExpectedCredits(150)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(1), ExpectedCredits(161)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p0Mini, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// With video references Mini adds its per-second surcharge before the single ceil-rounding. Charges are asserted on the refunded ledger entry (the fixture media is unreachable).
  /// Every batch size 1-10 at every resolution (5s).
  /// Mini supports batches of 1-8 and bills them in full; 9-10 clamp to 8.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_every_batch_size_at_every_resolution() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(22)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(2), ExpectedCredits(44)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(3), ExpectedCredits(66)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(4), ExpectedCredits(88)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(5), ExpectedCredits(109)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(6), ExpectedCredits(131)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(7), ExpectedCredits(153)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(8), ExpectedCredits(175)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(9), ExpectedCredits(175)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(10), ExpectedCredits(175)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(54)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(108)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(3), ExpectedCredits(161)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(4), ExpectedCredits(215)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(5), ExpectedCredits(268)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(6), ExpectedCredits(322)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(7), ExpectedCredits(375)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(429)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(9), ExpectedCredits(429)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(10), ExpectedCredits(429)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(54)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(2), ExpectedCredits(108)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(3), ExpectedCredits(161)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(4), ExpectedCredits(215)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(5), ExpectedCredits(268)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(6), ExpectedCredits(322)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(7), ExpectedCredits(375)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(8), ExpectedCredits(429)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(9), ExpectedCredits(429)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(10), ExpectedCredits(429)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(54)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(2), ExpectedCredits(108)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(3), ExpectedCredits(161)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(4), ExpectedCredits(215)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(5), ExpectedCredits(268)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(6), ExpectedCredits(322)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(7), ExpectedCredits(375)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(8), ExpectedCredits(429)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(9), ExpectedCredits(429)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(10), ExpectedCredits(429)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p0Mini, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// With video references Mini adds its per-second surcharge before the single ceil-rounding. Charges are asserted on the refunded ledger entry (the fixture media is unreachable).
  /// Spot checks across duration x batch x resolution.
  /// References must be CHARGED more than the identical no-reference
  /// request, at every resolution and across durations.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_more_than_no_references() {
    let harness = TestHarness::create().await;

    for resolution in [CommonResolution::FourEightyP, CommonResolution::SevenTwentyP] {
      for seconds in [5u16, 10, 15] {
        assert_references_charge_more(
          &harness, CommonVideoModel::Seedance2p0Mini, Some(resolution), Seconds(seconds),
        ).await;
      }
    }
  }

  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_spot_checked_combinations() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(2), ExpectedCredits(53)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(3), ExpectedCredits(92)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(4), ExpectedCredits(157)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(5), ExpectedCredits(240)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(8), ExpectedCredits(453)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(10), ExpectedCredits(523)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(2), ExpectedCredits(129)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(3), ExpectedCredits(225)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(4), ExpectedCredits(386)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(5), ExpectedCredits(589)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(8), ExpectedCredits(1113)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(10), ExpectedCredits(1285)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(2), ExpectedCredits(129)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(3), ExpectedCredits(225)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(4), ExpectedCredits(386)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(5), ExpectedCredits(589)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(8), ExpectedCredits(1113)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(10), ExpectedCredits(1285)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(2), ExpectedCredits(129)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(3), ExpectedCredits(225)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(4), ExpectedCredits(386)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(5), ExpectedCredits(589)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(8), ExpectedCredits(1113)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(10), ExpectedCredits(1285)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p0Mini, *resolution, *seconds, *batch, *expected,
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

  /// Every duration 4-15s at every resolution, single video.
  /// 1080p and 4K downgrade to 720p (and price accordingly).
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn charges_every_duration_at_every_resolution() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(4), Batch(1), ExpectedCredits(15)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(18)),
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(1), ExpectedCredits(22)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(1), ExpectedCredits(25)),
      (Some(CommonResolution::FourEightyP), Seconds(8), Batch(1), ExpectedCredits(29)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(1), ExpectedCredits(32)),
      (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(36)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(1), ExpectedCredits(40)),
      (Some(CommonResolution::FourEightyP), Seconds(12), Batch(1), ExpectedCredits(43)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(1), ExpectedCredits(47)),
      (Some(CommonResolution::FourEightyP), Seconds(14), Batch(1), ExpectedCredits(50)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(1), ExpectedCredits(54)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(1), ExpectedCredits(37)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(46)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(1), ExpectedCredits(55)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(1), ExpectedCredits(64)),
      (Some(CommonResolution::SevenTwentyP), Seconds(8), Batch(1), ExpectedCredits(73)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(1), ExpectedCredits(82)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(91)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(1), ExpectedCredits(101)),
      (Some(CommonResolution::SevenTwentyP), Seconds(12), Batch(1), ExpectedCredits(110)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(1), ExpectedCredits(119)),
      (Some(CommonResolution::SevenTwentyP), Seconds(14), Batch(1), ExpectedCredits(128)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(137)),
      (Some(CommonResolution::TenEightyP), Seconds(4), Batch(1), ExpectedCredits(37)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(46)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(1), ExpectedCredits(55)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(1), ExpectedCredits(64)),
      (Some(CommonResolution::TenEightyP), Seconds(8), Batch(1), ExpectedCredits(73)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(1), ExpectedCredits(82)),
      (Some(CommonResolution::TenEightyP), Seconds(10), Batch(1), ExpectedCredits(91)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(1), ExpectedCredits(101)),
      (Some(CommonResolution::TenEightyP), Seconds(12), Batch(1), ExpectedCredits(110)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(1), ExpectedCredits(119)),
      (Some(CommonResolution::TenEightyP), Seconds(14), Batch(1), ExpectedCredits(128)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(1), ExpectedCredits(137)),
      (Some(CommonResolution::FourK), Seconds(4), Batch(1), ExpectedCredits(37)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(46)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(1), ExpectedCredits(55)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(1), ExpectedCredits(64)),
      (Some(CommonResolution::FourK), Seconds(8), Batch(1), ExpectedCredits(73)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(1), ExpectedCredits(82)),
      (Some(CommonResolution::FourK), Seconds(10), Batch(1), ExpectedCredits(91)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(1), ExpectedCredits(101)),
      (Some(CommonResolution::FourK), Seconds(12), Batch(1), ExpectedCredits(110)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(1), ExpectedCredits(119)),
      (Some(CommonResolution::FourK), Seconds(14), Batch(1), ExpectedCredits(128)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(1), ExpectedCredits(137)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p0BytePlusMini, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// Every batch size 1-10 at every resolution (5s).
  /// Mini supports batches of 1-8 and bills them in full; 9-10 clamp to 8.
  /// 1080p and 4K downgrade to 720p (and price accordingly).
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn charges_every_batch_size_at_every_resolution() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(18)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(2), ExpectedCredits(36)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(3), ExpectedCredits(54)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(4), ExpectedCredits(71)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(5), ExpectedCredits(89)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(6), ExpectedCredits(107)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(7), ExpectedCredits(125)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(8), ExpectedCredits(142)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(9), ExpectedCredits(142)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(10), ExpectedCredits(142)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(46)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(91)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(3), ExpectedCredits(137)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(4), ExpectedCredits(182)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(5), ExpectedCredits(228)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(6), ExpectedCredits(273)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(7), ExpectedCredits(319)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(364)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(9), ExpectedCredits(364)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(10), ExpectedCredits(364)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(46)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(2), ExpectedCredits(91)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(3), ExpectedCredits(137)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(4), ExpectedCredits(182)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(5), ExpectedCredits(228)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(6), ExpectedCredits(273)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(7), ExpectedCredits(319)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(8), ExpectedCredits(364)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(9), ExpectedCredits(364)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(10), ExpectedCredits(364)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(46)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(2), ExpectedCredits(91)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(3), ExpectedCredits(137)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(4), ExpectedCredits(182)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(5), ExpectedCredits(228)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(6), ExpectedCredits(273)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(7), ExpectedCredits(319)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(8), ExpectedCredits(364)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(9), ExpectedCredits(364)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(10), ExpectedCredits(364)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p0BytePlusMini, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// Spot checks across duration x batch x resolution.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn charges_spot_checked_combinations() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(2), ExpectedCredits(43)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(3), ExpectedCredits(75)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(4), ExpectedCredits(128)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(5), ExpectedCredits(196)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(8), ExpectedCredits(370)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(10), ExpectedCredits(426)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(2), ExpectedCredits(110)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(3), ExpectedCredits(192)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(4), ExpectedCredits(328)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(5), ExpectedCredits(501)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(8), ExpectedCredits(947)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(10), ExpectedCredits(1092)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(2), ExpectedCredits(110)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(3), ExpectedCredits(192)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(4), ExpectedCredits(328)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(5), ExpectedCredits(501)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(8), ExpectedCredits(947)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(10), ExpectedCredits(1092)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(2), ExpectedCredits(110)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(3), ExpectedCredits(192)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(4), ExpectedCredits(328)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(5), ExpectedCredits(501)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(8), ExpectedCredits(947)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(10), ExpectedCredits(1092)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p0BytePlusMini, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// With video references Mini adds its per-second surcharge before the single ceil-rounding. Charges are asserted on the refunded ledger entry (the fixture media is unreachable).
  /// Every duration 4-15s at every resolution, single video.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_every_duration_at_every_resolution() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(4), Batch(1), ExpectedCredits(18)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(23)),
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(1), ExpectedCredits(27)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(1), ExpectedCredits(32)),
      (Some(CommonResolution::FourEightyP), Seconds(8), Batch(1), ExpectedCredits(36)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(1), ExpectedCredits(41)),
      (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(45)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(1), ExpectedCredits(50)),
      (Some(CommonResolution::FourEightyP), Seconds(12), Batch(1), ExpectedCredits(54)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(1), ExpectedCredits(59)),
      (Some(CommonResolution::FourEightyP), Seconds(14), Batch(1), ExpectedCredits(63)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(1), ExpectedCredits(68)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(1), ExpectedCredits(44)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(55)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(1), ExpectedCredits(66)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(1), ExpectedCredits(77)),
      (Some(CommonResolution::SevenTwentyP), Seconds(8), Batch(1), ExpectedCredits(88)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(1), ExpectedCredits(99)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(110)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(1), ExpectedCredits(121)),
      (Some(CommonResolution::SevenTwentyP), Seconds(12), Batch(1), ExpectedCredits(132)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(1), ExpectedCredits(143)),
      (Some(CommonResolution::SevenTwentyP), Seconds(14), Batch(1), ExpectedCredits(154)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(165)),
      (Some(CommonResolution::TenEightyP), Seconds(4), Batch(1), ExpectedCredits(44)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(55)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(1), ExpectedCredits(66)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(1), ExpectedCredits(77)),
      (Some(CommonResolution::TenEightyP), Seconds(8), Batch(1), ExpectedCredits(88)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(1), ExpectedCredits(99)),
      (Some(CommonResolution::TenEightyP), Seconds(10), Batch(1), ExpectedCredits(110)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(1), ExpectedCredits(121)),
      (Some(CommonResolution::TenEightyP), Seconds(12), Batch(1), ExpectedCredits(132)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(1), ExpectedCredits(143)),
      (Some(CommonResolution::TenEightyP), Seconds(14), Batch(1), ExpectedCredits(154)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(1), ExpectedCredits(165)),
      (Some(CommonResolution::FourK), Seconds(4), Batch(1), ExpectedCredits(44)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(55)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(1), ExpectedCredits(66)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(1), ExpectedCredits(77)),
      (Some(CommonResolution::FourK), Seconds(8), Batch(1), ExpectedCredits(88)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(1), ExpectedCredits(99)),
      (Some(CommonResolution::FourK), Seconds(10), Batch(1), ExpectedCredits(110)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(1), ExpectedCredits(121)),
      (Some(CommonResolution::FourK), Seconds(12), Batch(1), ExpectedCredits(132)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(1), ExpectedCredits(143)),
      (Some(CommonResolution::FourK), Seconds(14), Batch(1), ExpectedCredits(154)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(1), ExpectedCredits(165)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p0BytePlusMini, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// With video references Mini adds its per-second surcharge before the single ceil-rounding. Charges are asserted on the refunded ledger entry (the fixture media is unreachable).
  /// Every batch size 1-10 at every resolution (5s).
  /// Mini supports batches of 1-8 and bills them in full; 9-10 clamp to 8.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_every_batch_size_at_every_resolution() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(23)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(2), ExpectedCredits(45)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(3), ExpectedCredits(68)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(4), ExpectedCredits(90)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(5), ExpectedCredits(113)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(6), ExpectedCredits(135)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(7), ExpectedCredits(158)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(8), ExpectedCredits(180)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(9), ExpectedCredits(180)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(10), ExpectedCredits(180)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(55)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(110)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(3), ExpectedCredits(165)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(4), ExpectedCredits(219)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(5), ExpectedCredits(274)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(6), ExpectedCredits(329)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(7), ExpectedCredits(384)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(438)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(9), ExpectedCredits(438)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(10), ExpectedCredits(438)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(55)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(2), ExpectedCredits(110)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(3), ExpectedCredits(165)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(4), ExpectedCredits(219)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(5), ExpectedCredits(274)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(6), ExpectedCredits(329)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(7), ExpectedCredits(384)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(8), ExpectedCredits(438)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(9), ExpectedCredits(438)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(10), ExpectedCredits(438)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(55)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(2), ExpectedCredits(110)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(3), ExpectedCredits(165)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(4), ExpectedCredits(219)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(5), ExpectedCredits(274)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(6), ExpectedCredits(329)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(7), ExpectedCredits(384)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(8), ExpectedCredits(438)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(9), ExpectedCredits(438)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(10), ExpectedCredits(438)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p0BytePlusMini, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// With video references Mini adds its per-second surcharge before the single ceil-rounding. Charges are asserted on the refunded ledger entry (the fixture media is unreachable).
  /// Spot checks across duration x batch x resolution.
  /// References must be CHARGED more than the identical no-reference
  /// request, at every resolution and across durations.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_more_than_no_references() {
    let harness = TestHarness::create().await;

    for resolution in [CommonResolution::FourEightyP, CommonResolution::SevenTwentyP] {
      for seconds in [5u16, 10, 15] {
        assert_references_charge_more(
          &harness, CommonVideoModel::Seedance2p0BytePlusMini, Some(resolution), Seconds(seconds),
        ).await;
      }
    }
  }

  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_spot_checked_combinations() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(2), ExpectedCredits(54)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(3), ExpectedCredits(95)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(4), ExpectedCredits(162)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(5), ExpectedCredits(248)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(8), ExpectedCredits(468)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(10), ExpectedCredits(540)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(2), ExpectedCredits(132)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(3), ExpectedCredits(230)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(4), ExpectedCredits(395)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(5), ExpectedCredits(603)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(8), ExpectedCredits(1139)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(10), ExpectedCredits(1314)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(2), ExpectedCredits(132)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(3), ExpectedCredits(230)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(4), ExpectedCredits(395)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(5), ExpectedCredits(603)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(8), ExpectedCredits(1139)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(10), ExpectedCredits(1314)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(2), ExpectedCredits(132)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(3), ExpectedCredits(230)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(4), ExpectedCredits(395)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(5), ExpectedCredits(603)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(8), ExpectedCredits(1139)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(10), ExpectedCredits(1314)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p0BytePlusMini, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }
}

// ── Seedance 2.0 BytePlus Ultra Mini ──
// Shares the BytePlus Mini rate card; routed to the BytePlus Ultra account.
mod seedance_2p0_bpu_mini {
  use super::*;

  /// Every duration 4-15s at every resolution, single video.
  /// 1080p and 4K downgrade to 720p (and price accordingly).
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn charges_every_duration_at_every_resolution() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(4), Batch(1), ExpectedCredits(15)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(18)),
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(1), ExpectedCredits(22)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(1), ExpectedCredits(25)),
      (Some(CommonResolution::FourEightyP), Seconds(8), Batch(1), ExpectedCredits(29)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(1), ExpectedCredits(32)),
      (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(36)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(1), ExpectedCredits(40)),
      (Some(CommonResolution::FourEightyP), Seconds(12), Batch(1), ExpectedCredits(43)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(1), ExpectedCredits(47)),
      (Some(CommonResolution::FourEightyP), Seconds(14), Batch(1), ExpectedCredits(50)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(1), ExpectedCredits(54)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(1), ExpectedCredits(37)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(46)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(1), ExpectedCredits(55)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(1), ExpectedCredits(64)),
      (Some(CommonResolution::SevenTwentyP), Seconds(8), Batch(1), ExpectedCredits(73)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(1), ExpectedCredits(82)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(91)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(1), ExpectedCredits(101)),
      (Some(CommonResolution::SevenTwentyP), Seconds(12), Batch(1), ExpectedCredits(110)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(1), ExpectedCredits(119)),
      (Some(CommonResolution::SevenTwentyP), Seconds(14), Batch(1), ExpectedCredits(128)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(137)),
      (Some(CommonResolution::TenEightyP), Seconds(4), Batch(1), ExpectedCredits(37)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(46)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(1), ExpectedCredits(55)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(1), ExpectedCredits(64)),
      (Some(CommonResolution::TenEightyP), Seconds(8), Batch(1), ExpectedCredits(73)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(1), ExpectedCredits(82)),
      (Some(CommonResolution::TenEightyP), Seconds(10), Batch(1), ExpectedCredits(91)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(1), ExpectedCredits(101)),
      (Some(CommonResolution::TenEightyP), Seconds(12), Batch(1), ExpectedCredits(110)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(1), ExpectedCredits(119)),
      (Some(CommonResolution::TenEightyP), Seconds(14), Batch(1), ExpectedCredits(128)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(1), ExpectedCredits(137)),
      (Some(CommonResolution::FourK), Seconds(4), Batch(1), ExpectedCredits(37)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(46)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(1), ExpectedCredits(55)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(1), ExpectedCredits(64)),
      (Some(CommonResolution::FourK), Seconds(8), Batch(1), ExpectedCredits(73)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(1), ExpectedCredits(82)),
      (Some(CommonResolution::FourK), Seconds(10), Batch(1), ExpectedCredits(91)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(1), ExpectedCredits(101)),
      (Some(CommonResolution::FourK), Seconds(12), Batch(1), ExpectedCredits(110)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(1), ExpectedCredits(119)),
      (Some(CommonResolution::FourK), Seconds(14), Batch(1), ExpectedCredits(128)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(1), ExpectedCredits(137)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p0BytePlusUltraMini, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// Every batch size 1-10 at every resolution (5s).
  /// Mini supports batches of 1-8 and bills them in full; 9-10 clamp to 8.
  /// 1080p and 4K downgrade to 720p (and price accordingly).
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn charges_every_batch_size_at_every_resolution() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(18)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(2), ExpectedCredits(36)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(3), ExpectedCredits(54)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(4), ExpectedCredits(71)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(5), ExpectedCredits(89)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(6), ExpectedCredits(107)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(7), ExpectedCredits(125)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(8), ExpectedCredits(142)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(9), ExpectedCredits(142)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(10), ExpectedCredits(142)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(46)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(91)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(3), ExpectedCredits(137)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(4), ExpectedCredits(182)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(5), ExpectedCredits(228)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(6), ExpectedCredits(273)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(7), ExpectedCredits(319)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(364)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(9), ExpectedCredits(364)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(10), ExpectedCredits(364)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(46)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(2), ExpectedCredits(91)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(3), ExpectedCredits(137)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(4), ExpectedCredits(182)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(5), ExpectedCredits(228)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(6), ExpectedCredits(273)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(7), ExpectedCredits(319)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(8), ExpectedCredits(364)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(9), ExpectedCredits(364)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(10), ExpectedCredits(364)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(46)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(2), ExpectedCredits(91)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(3), ExpectedCredits(137)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(4), ExpectedCredits(182)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(5), ExpectedCredits(228)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(6), ExpectedCredits(273)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(7), ExpectedCredits(319)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(8), ExpectedCredits(364)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(9), ExpectedCredits(364)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(10), ExpectedCredits(364)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p0BytePlusUltraMini, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// Spot checks across duration x batch x resolution.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn charges_spot_checked_combinations() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(2), ExpectedCredits(43)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(3), ExpectedCredits(75)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(4), ExpectedCredits(128)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(5), ExpectedCredits(196)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(8), ExpectedCredits(370)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(10), ExpectedCredits(426)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(2), ExpectedCredits(110)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(3), ExpectedCredits(192)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(4), ExpectedCredits(328)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(5), ExpectedCredits(501)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(8), ExpectedCredits(947)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(10), ExpectedCredits(1092)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(2), ExpectedCredits(110)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(3), ExpectedCredits(192)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(4), ExpectedCredits(328)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(5), ExpectedCredits(501)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(8), ExpectedCredits(947)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(10), ExpectedCredits(1092)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(2), ExpectedCredits(110)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(3), ExpectedCredits(192)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(4), ExpectedCredits(328)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(5), ExpectedCredits(501)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(8), ExpectedCredits(947)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(10), ExpectedCredits(1092)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p0BytePlusUltraMini, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// With video references Mini adds its per-second surcharge before the single ceil-rounding. Charges are asserted on the refunded ledger entry (the fixture media is unreachable).
  /// Every duration 4-15s at every resolution, single video.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_every_duration_at_every_resolution() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(4), Batch(1), ExpectedCredits(18)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(23)),
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(1), ExpectedCredits(27)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(1), ExpectedCredits(32)),
      (Some(CommonResolution::FourEightyP), Seconds(8), Batch(1), ExpectedCredits(36)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(1), ExpectedCredits(41)),
      (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(45)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(1), ExpectedCredits(50)),
      (Some(CommonResolution::FourEightyP), Seconds(12), Batch(1), ExpectedCredits(54)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(1), ExpectedCredits(59)),
      (Some(CommonResolution::FourEightyP), Seconds(14), Batch(1), ExpectedCredits(63)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(1), ExpectedCredits(68)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(1), ExpectedCredits(44)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(55)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(1), ExpectedCredits(66)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(1), ExpectedCredits(77)),
      (Some(CommonResolution::SevenTwentyP), Seconds(8), Batch(1), ExpectedCredits(88)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(1), ExpectedCredits(99)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(110)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(1), ExpectedCredits(121)),
      (Some(CommonResolution::SevenTwentyP), Seconds(12), Batch(1), ExpectedCredits(132)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(1), ExpectedCredits(143)),
      (Some(CommonResolution::SevenTwentyP), Seconds(14), Batch(1), ExpectedCredits(154)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(165)),
      (Some(CommonResolution::TenEightyP), Seconds(4), Batch(1), ExpectedCredits(44)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(55)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(1), ExpectedCredits(66)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(1), ExpectedCredits(77)),
      (Some(CommonResolution::TenEightyP), Seconds(8), Batch(1), ExpectedCredits(88)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(1), ExpectedCredits(99)),
      (Some(CommonResolution::TenEightyP), Seconds(10), Batch(1), ExpectedCredits(110)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(1), ExpectedCredits(121)),
      (Some(CommonResolution::TenEightyP), Seconds(12), Batch(1), ExpectedCredits(132)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(1), ExpectedCredits(143)),
      (Some(CommonResolution::TenEightyP), Seconds(14), Batch(1), ExpectedCredits(154)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(1), ExpectedCredits(165)),
      (Some(CommonResolution::FourK), Seconds(4), Batch(1), ExpectedCredits(44)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(55)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(1), ExpectedCredits(66)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(1), ExpectedCredits(77)),
      (Some(CommonResolution::FourK), Seconds(8), Batch(1), ExpectedCredits(88)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(1), ExpectedCredits(99)),
      (Some(CommonResolution::FourK), Seconds(10), Batch(1), ExpectedCredits(110)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(1), ExpectedCredits(121)),
      (Some(CommonResolution::FourK), Seconds(12), Batch(1), ExpectedCredits(132)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(1), ExpectedCredits(143)),
      (Some(CommonResolution::FourK), Seconds(14), Batch(1), ExpectedCredits(154)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(1), ExpectedCredits(165)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p0BytePlusUltraMini, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// With video references Mini adds its per-second surcharge before the single ceil-rounding. Charges are asserted on the refunded ledger entry (the fixture media is unreachable).
  /// Every batch size 1-10 at every resolution (5s).
  /// Mini supports batches of 1-8 and bills them in full; 9-10 clamp to 8.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_every_batch_size_at_every_resolution() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(23)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(2), ExpectedCredits(45)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(3), ExpectedCredits(68)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(4), ExpectedCredits(90)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(5), ExpectedCredits(113)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(6), ExpectedCredits(135)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(7), ExpectedCredits(158)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(8), ExpectedCredits(180)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(9), ExpectedCredits(180)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(10), ExpectedCredits(180)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(55)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(110)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(3), ExpectedCredits(165)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(4), ExpectedCredits(219)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(5), ExpectedCredits(274)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(6), ExpectedCredits(329)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(7), ExpectedCredits(384)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(438)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(9), ExpectedCredits(438)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(10), ExpectedCredits(438)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(55)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(2), ExpectedCredits(110)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(3), ExpectedCredits(165)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(4), ExpectedCredits(219)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(5), ExpectedCredits(274)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(6), ExpectedCredits(329)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(7), ExpectedCredits(384)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(8), ExpectedCredits(438)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(9), ExpectedCredits(438)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(10), ExpectedCredits(438)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(55)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(2), ExpectedCredits(110)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(3), ExpectedCredits(165)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(4), ExpectedCredits(219)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(5), ExpectedCredits(274)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(6), ExpectedCredits(329)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(7), ExpectedCredits(384)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(8), ExpectedCredits(438)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(9), ExpectedCredits(438)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(10), ExpectedCredits(438)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p0BytePlusUltraMini, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// With video references Mini adds its per-second surcharge before the single ceil-rounding. Charges are asserted on the refunded ledger entry (the fixture media is unreachable).
  /// Spot checks across duration x batch x resolution.
  /// References must be CHARGED more than the identical no-reference
  /// request, at every resolution and across durations.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_more_than_no_references() {
    let harness = TestHarness::create().await;

    for resolution in [CommonResolution::FourEightyP, CommonResolution::SevenTwentyP] {
      for seconds in [5u16, 10, 15] {
        assert_references_charge_more(
          &harness, CommonVideoModel::Seedance2p0BytePlusUltraMini, Some(resolution), Seconds(seconds),
        ).await;
      }
    }
  }

  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_spot_checked_combinations() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(2), ExpectedCredits(54)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(3), ExpectedCredits(95)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(4), ExpectedCredits(162)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(5), ExpectedCredits(248)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(8), ExpectedCredits(468)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(10), ExpectedCredits(540)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(2), ExpectedCredits(132)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(3), ExpectedCredits(230)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(4), ExpectedCredits(395)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(5), ExpectedCredits(603)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(8), ExpectedCredits(1139)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(10), ExpectedCredits(1314)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(2), ExpectedCredits(132)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(3), ExpectedCredits(230)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(4), ExpectedCredits(395)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(5), ExpectedCredits(603)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(8), ExpectedCredits(1139)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(10), ExpectedCredits(1314)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(2), ExpectedCredits(132)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(3), ExpectedCredits(230)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(4), ExpectedCredits(395)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(5), ExpectedCredits(603)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(8), ExpectedCredits(1139)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(10), ExpectedCredits(1314)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p0BytePlusUltraMini, *resolution, *seconds, *batch, *expected,
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
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits, ExpectedCredits, CreditsDelta)] = &[
      // Ceil-rounding parity: the premium vanishes at 5s.
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(45), ExpectedCredits(46), CreditsDelta(1)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(89), ExpectedCredits(91), CreditsDelta(2)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(134), ExpectedCredits(137), CreditsDelta(3)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(1), ExpectedCredits(52), ExpectedCredits(54), CreditsDelta(2)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(356), ExpectedCredits(364), CreditsDelta(8)),
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
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits, ExpectedCredits, CreditsDelta)] = &[
      // Ceil-rounding parity: the premium vanishes at 5s.
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(45), ExpectedCredits(46), CreditsDelta(1)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(89), ExpectedCredits(91), CreditsDelta(2)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(134), ExpectedCredits(137), CreditsDelta(3)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(1), ExpectedCredits(52), ExpectedCredits(54), CreditsDelta(2)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(356), ExpectedCredits(364), CreditsDelta(8)),
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
