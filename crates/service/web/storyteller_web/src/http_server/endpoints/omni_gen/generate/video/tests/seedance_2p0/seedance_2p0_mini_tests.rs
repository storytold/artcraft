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
  assert_reference_video_charge_then_refund, assert_successful_generation_charges,
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
      (Some(CommonResolution::FourEightyP), Seconds(4), Batch(1), ExpectedCredits(13)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(17)),
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(1), ExpectedCredits(20)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(1), ExpectedCredits(23)),
      (Some(CommonResolution::FourEightyP), Seconds(8), Batch(1), ExpectedCredits(26)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(1), ExpectedCredits(30)),
      (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(33)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(1), ExpectedCredits(36)),
      (Some(CommonResolution::FourEightyP), Seconds(12), Batch(1), ExpectedCredits(39)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(1), ExpectedCredits(43)),
      (Some(CommonResolution::FourEightyP), Seconds(14), Batch(1), ExpectedCredits(46)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(1), ExpectedCredits(49)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(1), ExpectedCredits(35)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(44)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(1), ExpectedCredits(52)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(1), ExpectedCredits(61)),
      (Some(CommonResolution::SevenTwentyP), Seconds(8), Batch(1), ExpectedCredits(70)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(1), ExpectedCredits(78)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(87)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(1), ExpectedCredits(96)),
      (Some(CommonResolution::SevenTwentyP), Seconds(12), Batch(1), ExpectedCredits(104)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(1), ExpectedCredits(113)),
      (Some(CommonResolution::SevenTwentyP), Seconds(14), Batch(1), ExpectedCredits(121)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(130)),
      (Some(CommonResolution::TenEightyP), Seconds(4), Batch(1), ExpectedCredits(35)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(44)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(1), ExpectedCredits(52)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(1), ExpectedCredits(61)),
      (Some(CommonResolution::TenEightyP), Seconds(8), Batch(1), ExpectedCredits(70)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(1), ExpectedCredits(78)),
      (Some(CommonResolution::TenEightyP), Seconds(10), Batch(1), ExpectedCredits(87)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(1), ExpectedCredits(96)),
      (Some(CommonResolution::TenEightyP), Seconds(12), Batch(1), ExpectedCredits(104)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(1), ExpectedCredits(113)),
      (Some(CommonResolution::TenEightyP), Seconds(14), Batch(1), ExpectedCredits(121)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(1), ExpectedCredits(130)),
      (Some(CommonResolution::FourK), Seconds(4), Batch(1), ExpectedCredits(35)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(44)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(1), ExpectedCredits(52)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(1), ExpectedCredits(61)),
      (Some(CommonResolution::FourK), Seconds(8), Batch(1), ExpectedCredits(70)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(1), ExpectedCredits(78)),
      (Some(CommonResolution::FourK), Seconds(10), Batch(1), ExpectedCredits(87)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(1), ExpectedCredits(96)),
      (Some(CommonResolution::FourK), Seconds(12), Batch(1), ExpectedCredits(104)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(1), ExpectedCredits(113)),
      (Some(CommonResolution::FourK), Seconds(14), Batch(1), ExpectedCredits(121)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(1), ExpectedCredits(130)),
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
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(17)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(2), ExpectedCredits(33)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(3), ExpectedCredits(49)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(4), ExpectedCredits(65)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(5), ExpectedCredits(82)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(6), ExpectedCredits(98)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(7), ExpectedCredits(114)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(8), ExpectedCredits(130)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(9), ExpectedCredits(130)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(10), ExpectedCredits(130)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(44)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(87)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(3), ExpectedCredits(130)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(4), ExpectedCredits(173)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(5), ExpectedCredits(217)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(6), ExpectedCredits(260)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(7), ExpectedCredits(303)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(346)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(9), ExpectedCredits(346)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(10), ExpectedCredits(346)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(44)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(2), ExpectedCredits(87)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(3), ExpectedCredits(130)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(4), ExpectedCredits(173)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(5), ExpectedCredits(217)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(6), ExpectedCredits(260)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(7), ExpectedCredits(303)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(8), ExpectedCredits(346)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(9), ExpectedCredits(346)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(10), ExpectedCredits(346)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(44)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(2), ExpectedCredits(87)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(3), ExpectedCredits(130)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(4), ExpectedCredits(173)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(5), ExpectedCredits(217)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(6), ExpectedCredits(260)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(7), ExpectedCredits(303)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(8), ExpectedCredits(346)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(9), ExpectedCredits(346)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(10), ExpectedCredits(346)),
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
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(2), ExpectedCredits(39)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(3), ExpectedCredits(69)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(4), ExpectedCredits(117)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(5), ExpectedCredits(179)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(8), ExpectedCredits(338)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(10), ExpectedCredits(389)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(2), ExpectedCredits(104)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(3), ExpectedCredits(182)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(4), ExpectedCredits(312)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(5), ExpectedCredits(476)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(8), ExpectedCredits(899)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(10), ExpectedCredits(1038)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(2), ExpectedCredits(104)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(3), ExpectedCredits(182)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(4), ExpectedCredits(312)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(5), ExpectedCredits(476)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(8), ExpectedCredits(899)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(10), ExpectedCredits(1038)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(2), ExpectedCredits(104)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(3), ExpectedCredits(182)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(4), ExpectedCredits(312)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(5), ExpectedCredits(476)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(8), ExpectedCredits(899)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(10), ExpectedCredits(1038)),
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
      (Some(CommonResolution::FourEightyP), Seconds(4), Batch(1), ExpectedCredits(17)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(21)),
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(1), ExpectedCredits(25)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(1), ExpectedCredits(29)),
      (Some(CommonResolution::FourEightyP), Seconds(8), Batch(1), ExpectedCredits(33)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(1), ExpectedCredits(37)),
      (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(42)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(1), ExpectedCredits(46)),
      (Some(CommonResolution::FourEightyP), Seconds(12), Batch(1), ExpectedCredits(50)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(1), ExpectedCredits(54)),
      (Some(CommonResolution::FourEightyP), Seconds(14), Batch(1), ExpectedCredits(58)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(1), ExpectedCredits(62)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(1), ExpectedCredits(42)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(52)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(1), ExpectedCredits(63)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(1), ExpectedCredits(73)),
      (Some(CommonResolution::SevenTwentyP), Seconds(8), Batch(1), ExpectedCredits(83)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(1), ExpectedCredits(94)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(104)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(1), ExpectedCredits(115)),
      (Some(CommonResolution::SevenTwentyP), Seconds(12), Batch(1), ExpectedCredits(125)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(1), ExpectedCredits(135)),
      (Some(CommonResolution::SevenTwentyP), Seconds(14), Batch(1), ExpectedCredits(146)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(156)),
      (Some(CommonResolution::TenEightyP), Seconds(4), Batch(1), ExpectedCredits(42)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(52)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(1), ExpectedCredits(63)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(1), ExpectedCredits(73)),
      (Some(CommonResolution::TenEightyP), Seconds(8), Batch(1), ExpectedCredits(83)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(1), ExpectedCredits(94)),
      (Some(CommonResolution::TenEightyP), Seconds(10), Batch(1), ExpectedCredits(104)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(1), ExpectedCredits(115)),
      (Some(CommonResolution::TenEightyP), Seconds(12), Batch(1), ExpectedCredits(125)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(1), ExpectedCredits(135)),
      (Some(CommonResolution::TenEightyP), Seconds(14), Batch(1), ExpectedCredits(146)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(1), ExpectedCredits(156)),
      (Some(CommonResolution::FourK), Seconds(4), Batch(1), ExpectedCredits(42)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(52)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(1), ExpectedCredits(63)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(1), ExpectedCredits(73)),
      (Some(CommonResolution::FourK), Seconds(8), Batch(1), ExpectedCredits(83)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(1), ExpectedCredits(94)),
      (Some(CommonResolution::FourK), Seconds(10), Batch(1), ExpectedCredits(104)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(1), ExpectedCredits(115)),
      (Some(CommonResolution::FourK), Seconds(12), Batch(1), ExpectedCredits(125)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(1), ExpectedCredits(135)),
      (Some(CommonResolution::FourK), Seconds(14), Batch(1), ExpectedCredits(146)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(1), ExpectedCredits(156)),
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
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(21)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(2), ExpectedCredits(42)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(3), ExpectedCredits(62)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(4), ExpectedCredits(83)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(5), ExpectedCredits(103)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(6), ExpectedCredits(124)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(7), ExpectedCredits(144)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(8), ExpectedCredits(165)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(9), ExpectedCredits(165)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(10), ExpectedCredits(165)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(52)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(104)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(3), ExpectedCredits(156)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(4), ExpectedCredits(208)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(5), ExpectedCredits(260)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(6), ExpectedCredits(312)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(7), ExpectedCredits(363)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(415)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(9), ExpectedCredits(415)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(10), ExpectedCredits(415)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(52)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(2), ExpectedCredits(104)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(3), ExpectedCredits(156)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(4), ExpectedCredits(208)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(5), ExpectedCredits(260)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(6), ExpectedCredits(312)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(7), ExpectedCredits(363)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(8), ExpectedCredits(415)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(9), ExpectedCredits(415)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(10), ExpectedCredits(415)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(52)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(2), ExpectedCredits(104)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(3), ExpectedCredits(156)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(4), ExpectedCredits(208)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(5), ExpectedCredits(260)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(6), ExpectedCredits(312)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(7), ExpectedCredits(363)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(8), ExpectedCredits(415)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(9), ExpectedCredits(415)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(10), ExpectedCredits(415)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p0Mini, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// With video references Mini adds its per-second surcharge before the single ceil-rounding. Charges are asserted on the refunded ledger entry (the fixture media is unreachable).
  /// Spot checks across duration x batch x resolution.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_spot_checked_combinations() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(2), ExpectedCredits(50)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(3), ExpectedCredits(87)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(4), ExpectedCredits(148)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(5), ExpectedCredits(226)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(8), ExpectedCredits(427)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(10), ExpectedCredits(493)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(2), ExpectedCredits(125)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(3), ExpectedCredits(218)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(4), ExpectedCredits(374)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(5), ExpectedCredits(571)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(8), ExpectedCredits(1079)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(10), ExpectedCredits(1245)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(2), ExpectedCredits(125)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(3), ExpectedCredits(218)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(4), ExpectedCredits(374)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(5), ExpectedCredits(571)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(8), ExpectedCredits(1079)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(10), ExpectedCredits(1245)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(2), ExpectedCredits(125)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(3), ExpectedCredits(218)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(4), ExpectedCredits(374)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(5), ExpectedCredits(571)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(8), ExpectedCredits(1079)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(10), ExpectedCredits(1245)),
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
      (Some(CommonResolution::FourEightyP), Seconds(4), Batch(1), ExpectedCredits(14)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(17)),
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(1), ExpectedCredits(20)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(1), ExpectedCredits(23)),
      (Some(CommonResolution::FourEightyP), Seconds(8), Batch(1), ExpectedCredits(27)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(1), ExpectedCredits(30)),
      (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(33)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(1), ExpectedCredits(36)),
      (Some(CommonResolution::FourEightyP), Seconds(12), Batch(1), ExpectedCredits(40)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(1), ExpectedCredits(43)),
      (Some(CommonResolution::FourEightyP), Seconds(14), Batch(1), ExpectedCredits(46)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(1), ExpectedCredits(50)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(1), ExpectedCredits(35)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(44)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(1), ExpectedCredits(53)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(1), ExpectedCredits(62)),
      (Some(CommonResolution::SevenTwentyP), Seconds(8), Batch(1), ExpectedCredits(70)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(1), ExpectedCredits(79)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(88)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(1), ExpectedCredits(96)),
      (Some(CommonResolution::SevenTwentyP), Seconds(12), Batch(1), ExpectedCredits(105)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(1), ExpectedCredits(114)),
      (Some(CommonResolution::SevenTwentyP), Seconds(14), Batch(1), ExpectedCredits(123)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(131)),
      (Some(CommonResolution::TenEightyP), Seconds(4), Batch(1), ExpectedCredits(35)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(44)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(1), ExpectedCredits(53)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(1), ExpectedCredits(62)),
      (Some(CommonResolution::TenEightyP), Seconds(8), Batch(1), ExpectedCredits(70)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(1), ExpectedCredits(79)),
      (Some(CommonResolution::TenEightyP), Seconds(10), Batch(1), ExpectedCredits(88)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(1), ExpectedCredits(96)),
      (Some(CommonResolution::TenEightyP), Seconds(12), Batch(1), ExpectedCredits(105)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(1), ExpectedCredits(114)),
      (Some(CommonResolution::TenEightyP), Seconds(14), Batch(1), ExpectedCredits(123)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(1), ExpectedCredits(131)),
      (Some(CommonResolution::FourK), Seconds(4), Batch(1), ExpectedCredits(35)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(44)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(1), ExpectedCredits(53)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(1), ExpectedCredits(62)),
      (Some(CommonResolution::FourK), Seconds(8), Batch(1), ExpectedCredits(70)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(1), ExpectedCredits(79)),
      (Some(CommonResolution::FourK), Seconds(10), Batch(1), ExpectedCredits(88)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(1), ExpectedCredits(96)),
      (Some(CommonResolution::FourK), Seconds(12), Batch(1), ExpectedCredits(105)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(1), ExpectedCredits(114)),
      (Some(CommonResolution::FourK), Seconds(14), Batch(1), ExpectedCredits(123)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(1), ExpectedCredits(131)),
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
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(17)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(2), ExpectedCredits(33)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(3), ExpectedCredits(50)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(4), ExpectedCredits(66)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(5), ExpectedCredits(82)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(6), ExpectedCredits(99)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(7), ExpectedCredits(115)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(8), ExpectedCredits(131)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(9), ExpectedCredits(131)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(10), ExpectedCredits(131)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(44)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(88)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(3), ExpectedCredits(131)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(4), ExpectedCredits(175)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(5), ExpectedCredits(219)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(6), ExpectedCredits(262)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(7), ExpectedCredits(306)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(349)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(9), ExpectedCredits(349)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(10), ExpectedCredits(349)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(44)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(2), ExpectedCredits(88)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(3), ExpectedCredits(131)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(4), ExpectedCredits(175)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(5), ExpectedCredits(219)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(6), ExpectedCredits(262)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(7), ExpectedCredits(306)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(8), ExpectedCredits(349)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(9), ExpectedCredits(349)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(10), ExpectedCredits(349)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(44)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(2), ExpectedCredits(88)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(3), ExpectedCredits(131)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(4), ExpectedCredits(175)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(5), ExpectedCredits(219)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(6), ExpectedCredits(262)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(7), ExpectedCredits(306)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(8), ExpectedCredits(349)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(9), ExpectedCredits(349)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(10), ExpectedCredits(349)),
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
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(2), ExpectedCredits(40)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(3), ExpectedCredits(69)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(4), ExpectedCredits(118)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(5), ExpectedCredits(180)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(8), ExpectedCredits(341)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(10), ExpectedCredits(393)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(2), ExpectedCredits(105)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(3), ExpectedCredits(184)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(4), ExpectedCredits(315)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(5), ExpectedCredits(480)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(8), ExpectedCredits(908)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(10), ExpectedCredits(1047)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(2), ExpectedCredits(105)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(3), ExpectedCredits(184)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(4), ExpectedCredits(315)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(5), ExpectedCredits(480)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(8), ExpectedCredits(908)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(10), ExpectedCredits(1047)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(2), ExpectedCredits(105)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(3), ExpectedCredits(184)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(4), ExpectedCredits(315)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(5), ExpectedCredits(480)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(8), ExpectedCredits(908)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(10), ExpectedCredits(1047)),
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
      (Some(CommonResolution::FourEightyP), Seconds(4), Batch(1), ExpectedCredits(17)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(21)),
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(1), ExpectedCredits(25)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(1), ExpectedCredits(30)),
      (Some(CommonResolution::FourEightyP), Seconds(8), Batch(1), ExpectedCredits(34)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(1), ExpectedCredits(38)),
      (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(42)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(1), ExpectedCredits(46)),
      (Some(CommonResolution::FourEightyP), Seconds(12), Batch(1), ExpectedCredits(50)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(1), ExpectedCredits(54)),
      (Some(CommonResolution::FourEightyP), Seconds(14), Batch(1), ExpectedCredits(59)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(1), ExpectedCredits(63)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(1), ExpectedCredits(42)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(53)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(1), ExpectedCredits(63)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(1), ExpectedCredits(74)),
      (Some(CommonResolution::SevenTwentyP), Seconds(8), Batch(1), ExpectedCredits(84)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(1), ExpectedCredits(95)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(105)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(1), ExpectedCredits(116)),
      (Some(CommonResolution::SevenTwentyP), Seconds(12), Batch(1), ExpectedCredits(126)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(1), ExpectedCredits(137)),
      (Some(CommonResolution::SevenTwentyP), Seconds(14), Batch(1), ExpectedCredits(147)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(158)),
      (Some(CommonResolution::TenEightyP), Seconds(4), Batch(1), ExpectedCredits(42)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(53)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(1), ExpectedCredits(63)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(1), ExpectedCredits(74)),
      (Some(CommonResolution::TenEightyP), Seconds(8), Batch(1), ExpectedCredits(84)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(1), ExpectedCredits(95)),
      (Some(CommonResolution::TenEightyP), Seconds(10), Batch(1), ExpectedCredits(105)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(1), ExpectedCredits(116)),
      (Some(CommonResolution::TenEightyP), Seconds(12), Batch(1), ExpectedCredits(126)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(1), ExpectedCredits(137)),
      (Some(CommonResolution::TenEightyP), Seconds(14), Batch(1), ExpectedCredits(147)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(1), ExpectedCredits(158)),
      (Some(CommonResolution::FourK), Seconds(4), Batch(1), ExpectedCredits(42)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(53)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(1), ExpectedCredits(63)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(1), ExpectedCredits(74)),
      (Some(CommonResolution::FourK), Seconds(8), Batch(1), ExpectedCredits(84)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(1), ExpectedCredits(95)),
      (Some(CommonResolution::FourK), Seconds(10), Batch(1), ExpectedCredits(105)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(1), ExpectedCredits(116)),
      (Some(CommonResolution::FourK), Seconds(12), Batch(1), ExpectedCredits(126)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(1), ExpectedCredits(137)),
      (Some(CommonResolution::FourK), Seconds(14), Batch(1), ExpectedCredits(147)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(1), ExpectedCredits(158)),
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
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(21)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(2), ExpectedCredits(42)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(3), ExpectedCredits(63)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(4), ExpectedCredits(83)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(5), ExpectedCredits(104)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(6), ExpectedCredits(125)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(7), ExpectedCredits(146)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(8), ExpectedCredits(166)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(9), ExpectedCredits(166)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(10), ExpectedCredits(166)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(53)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(105)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(3), ExpectedCredits(158)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(4), ExpectedCredits(210)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(5), ExpectedCredits(262)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(6), ExpectedCredits(315)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(7), ExpectedCredits(367)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(419)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(9), ExpectedCredits(419)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(10), ExpectedCredits(419)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(53)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(2), ExpectedCredits(105)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(3), ExpectedCredits(158)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(4), ExpectedCredits(210)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(5), ExpectedCredits(262)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(6), ExpectedCredits(315)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(7), ExpectedCredits(367)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(8), ExpectedCredits(419)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(9), ExpectedCredits(419)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(10), ExpectedCredits(419)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(53)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(2), ExpectedCredits(105)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(3), ExpectedCredits(158)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(4), ExpectedCredits(210)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(5), ExpectedCredits(262)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(6), ExpectedCredits(315)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(7), ExpectedCredits(367)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(8), ExpectedCredits(419)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(9), ExpectedCredits(419)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(10), ExpectedCredits(419)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p0BytePlusMini, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// With video references Mini adds its per-second surcharge before the single ceil-rounding. Charges are asserted on the refunded ledger entry (the fixture media is unreachable).
  /// Spot checks across duration x batch x resolution.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_spot_checked_combinations() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(2), ExpectedCredits(50)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(3), ExpectedCredits(88)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(4), ExpectedCredits(150)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(5), ExpectedCredits(228)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(8), ExpectedCredits(431)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(10), ExpectedCredits(498)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(2), ExpectedCredits(126)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(3), ExpectedCredits(220)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(4), ExpectedCredits(377)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(5), ExpectedCredits(576)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(8), ExpectedCredits(1089)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(10), ExpectedCredits(1257)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(2), ExpectedCredits(126)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(3), ExpectedCredits(220)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(4), ExpectedCredits(377)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(5), ExpectedCredits(576)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(8), ExpectedCredits(1089)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(10), ExpectedCredits(1257)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(2), ExpectedCredits(126)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(3), ExpectedCredits(220)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(4), ExpectedCredits(377)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(5), ExpectedCredits(576)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(8), ExpectedCredits(1089)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(10), ExpectedCredits(1257)),
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
      (Some(CommonResolution::FourEightyP), Seconds(4), Batch(1), ExpectedCredits(14)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(17)),
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(1), ExpectedCredits(20)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(1), ExpectedCredits(23)),
      (Some(CommonResolution::FourEightyP), Seconds(8), Batch(1), ExpectedCredits(27)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(1), ExpectedCredits(30)),
      (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(33)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(1), ExpectedCredits(36)),
      (Some(CommonResolution::FourEightyP), Seconds(12), Batch(1), ExpectedCredits(40)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(1), ExpectedCredits(43)),
      (Some(CommonResolution::FourEightyP), Seconds(14), Batch(1), ExpectedCredits(46)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(1), ExpectedCredits(50)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(1), ExpectedCredits(35)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(44)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(1), ExpectedCredits(53)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(1), ExpectedCredits(62)),
      (Some(CommonResolution::SevenTwentyP), Seconds(8), Batch(1), ExpectedCredits(70)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(1), ExpectedCredits(79)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(88)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(1), ExpectedCredits(96)),
      (Some(CommonResolution::SevenTwentyP), Seconds(12), Batch(1), ExpectedCredits(105)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(1), ExpectedCredits(114)),
      (Some(CommonResolution::SevenTwentyP), Seconds(14), Batch(1), ExpectedCredits(123)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(131)),
      (Some(CommonResolution::TenEightyP), Seconds(4), Batch(1), ExpectedCredits(35)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(44)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(1), ExpectedCredits(53)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(1), ExpectedCredits(62)),
      (Some(CommonResolution::TenEightyP), Seconds(8), Batch(1), ExpectedCredits(70)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(1), ExpectedCredits(79)),
      (Some(CommonResolution::TenEightyP), Seconds(10), Batch(1), ExpectedCredits(88)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(1), ExpectedCredits(96)),
      (Some(CommonResolution::TenEightyP), Seconds(12), Batch(1), ExpectedCredits(105)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(1), ExpectedCredits(114)),
      (Some(CommonResolution::TenEightyP), Seconds(14), Batch(1), ExpectedCredits(123)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(1), ExpectedCredits(131)),
      (Some(CommonResolution::FourK), Seconds(4), Batch(1), ExpectedCredits(35)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(44)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(1), ExpectedCredits(53)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(1), ExpectedCredits(62)),
      (Some(CommonResolution::FourK), Seconds(8), Batch(1), ExpectedCredits(70)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(1), ExpectedCredits(79)),
      (Some(CommonResolution::FourK), Seconds(10), Batch(1), ExpectedCredits(88)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(1), ExpectedCredits(96)),
      (Some(CommonResolution::FourK), Seconds(12), Batch(1), ExpectedCredits(105)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(1), ExpectedCredits(114)),
      (Some(CommonResolution::FourK), Seconds(14), Batch(1), ExpectedCredits(123)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(1), ExpectedCredits(131)),
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
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(17)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(2), ExpectedCredits(33)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(3), ExpectedCredits(50)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(4), ExpectedCredits(66)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(5), ExpectedCredits(82)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(6), ExpectedCredits(99)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(7), ExpectedCredits(115)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(8), ExpectedCredits(131)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(9), ExpectedCredits(131)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(10), ExpectedCredits(131)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(44)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(88)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(3), ExpectedCredits(131)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(4), ExpectedCredits(175)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(5), ExpectedCredits(219)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(6), ExpectedCredits(262)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(7), ExpectedCredits(306)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(349)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(9), ExpectedCredits(349)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(10), ExpectedCredits(349)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(44)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(2), ExpectedCredits(88)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(3), ExpectedCredits(131)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(4), ExpectedCredits(175)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(5), ExpectedCredits(219)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(6), ExpectedCredits(262)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(7), ExpectedCredits(306)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(8), ExpectedCredits(349)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(9), ExpectedCredits(349)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(10), ExpectedCredits(349)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(44)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(2), ExpectedCredits(88)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(3), ExpectedCredits(131)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(4), ExpectedCredits(175)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(5), ExpectedCredits(219)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(6), ExpectedCredits(262)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(7), ExpectedCredits(306)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(8), ExpectedCredits(349)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(9), ExpectedCredits(349)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(10), ExpectedCredits(349)),
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
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(2), ExpectedCredits(40)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(3), ExpectedCredits(69)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(4), ExpectedCredits(118)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(5), ExpectedCredits(180)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(8), ExpectedCredits(341)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(10), ExpectedCredits(393)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(2), ExpectedCredits(105)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(3), ExpectedCredits(184)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(4), ExpectedCredits(315)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(5), ExpectedCredits(480)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(8), ExpectedCredits(908)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(10), ExpectedCredits(1047)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(2), ExpectedCredits(105)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(3), ExpectedCredits(184)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(4), ExpectedCredits(315)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(5), ExpectedCredits(480)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(8), ExpectedCredits(908)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(10), ExpectedCredits(1047)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(2), ExpectedCredits(105)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(3), ExpectedCredits(184)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(4), ExpectedCredits(315)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(5), ExpectedCredits(480)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(8), ExpectedCredits(908)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(10), ExpectedCredits(1047)),
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
      (Some(CommonResolution::FourEightyP), Seconds(4), Batch(1), ExpectedCredits(17)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(21)),
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(1), ExpectedCredits(25)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(1), ExpectedCredits(30)),
      (Some(CommonResolution::FourEightyP), Seconds(8), Batch(1), ExpectedCredits(34)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(1), ExpectedCredits(38)),
      (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(42)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(1), ExpectedCredits(46)),
      (Some(CommonResolution::FourEightyP), Seconds(12), Batch(1), ExpectedCredits(50)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(1), ExpectedCredits(54)),
      (Some(CommonResolution::FourEightyP), Seconds(14), Batch(1), ExpectedCredits(59)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(1), ExpectedCredits(63)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(1), ExpectedCredits(42)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(53)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(1), ExpectedCredits(63)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(1), ExpectedCredits(74)),
      (Some(CommonResolution::SevenTwentyP), Seconds(8), Batch(1), ExpectedCredits(84)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(1), ExpectedCredits(95)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(105)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(1), ExpectedCredits(116)),
      (Some(CommonResolution::SevenTwentyP), Seconds(12), Batch(1), ExpectedCredits(126)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(1), ExpectedCredits(137)),
      (Some(CommonResolution::SevenTwentyP), Seconds(14), Batch(1), ExpectedCredits(147)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(158)),
      (Some(CommonResolution::TenEightyP), Seconds(4), Batch(1), ExpectedCredits(42)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(53)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(1), ExpectedCredits(63)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(1), ExpectedCredits(74)),
      (Some(CommonResolution::TenEightyP), Seconds(8), Batch(1), ExpectedCredits(84)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(1), ExpectedCredits(95)),
      (Some(CommonResolution::TenEightyP), Seconds(10), Batch(1), ExpectedCredits(105)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(1), ExpectedCredits(116)),
      (Some(CommonResolution::TenEightyP), Seconds(12), Batch(1), ExpectedCredits(126)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(1), ExpectedCredits(137)),
      (Some(CommonResolution::TenEightyP), Seconds(14), Batch(1), ExpectedCredits(147)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(1), ExpectedCredits(158)),
      (Some(CommonResolution::FourK), Seconds(4), Batch(1), ExpectedCredits(42)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(53)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(1), ExpectedCredits(63)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(1), ExpectedCredits(74)),
      (Some(CommonResolution::FourK), Seconds(8), Batch(1), ExpectedCredits(84)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(1), ExpectedCredits(95)),
      (Some(CommonResolution::FourK), Seconds(10), Batch(1), ExpectedCredits(105)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(1), ExpectedCredits(116)),
      (Some(CommonResolution::FourK), Seconds(12), Batch(1), ExpectedCredits(126)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(1), ExpectedCredits(137)),
      (Some(CommonResolution::FourK), Seconds(14), Batch(1), ExpectedCredits(147)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(1), ExpectedCredits(158)),
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
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(21)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(2), ExpectedCredits(42)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(3), ExpectedCredits(63)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(4), ExpectedCredits(83)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(5), ExpectedCredits(104)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(6), ExpectedCredits(125)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(7), ExpectedCredits(146)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(8), ExpectedCredits(166)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(9), ExpectedCredits(166)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(10), ExpectedCredits(166)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(53)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(105)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(3), ExpectedCredits(158)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(4), ExpectedCredits(210)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(5), ExpectedCredits(262)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(6), ExpectedCredits(315)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(7), ExpectedCredits(367)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(419)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(9), ExpectedCredits(419)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(10), ExpectedCredits(419)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(53)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(2), ExpectedCredits(105)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(3), ExpectedCredits(158)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(4), ExpectedCredits(210)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(5), ExpectedCredits(262)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(6), ExpectedCredits(315)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(7), ExpectedCredits(367)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(8), ExpectedCredits(419)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(9), ExpectedCredits(419)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(10), ExpectedCredits(419)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(53)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(2), ExpectedCredits(105)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(3), ExpectedCredits(158)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(4), ExpectedCredits(210)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(5), ExpectedCredits(262)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(6), ExpectedCredits(315)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(7), ExpectedCredits(367)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(8), ExpectedCredits(419)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(9), ExpectedCredits(419)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(10), ExpectedCredits(419)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p0BytePlusUltraMini, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// With video references Mini adds its per-second surcharge before the single ceil-rounding. Charges are asserted on the refunded ledger entry (the fixture media is unreachable).
  /// Spot checks across duration x batch x resolution.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_spot_checked_combinations() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(2), ExpectedCredits(50)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(3), ExpectedCredits(88)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(4), ExpectedCredits(150)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(5), ExpectedCredits(228)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(8), ExpectedCredits(431)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(10), ExpectedCredits(498)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(2), ExpectedCredits(126)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(3), ExpectedCredits(220)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(4), ExpectedCredits(377)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(5), ExpectedCredits(576)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(8), ExpectedCredits(1089)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(10), ExpectedCredits(1257)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(2), ExpectedCredits(126)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(3), ExpectedCredits(220)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(4), ExpectedCredits(377)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(5), ExpectedCredits(576)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(8), ExpectedCredits(1089)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(10), ExpectedCredits(1257)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(2), ExpectedCredits(126)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(3), ExpectedCredits(220)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(4), ExpectedCredits(377)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(5), ExpectedCredits(576)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(8), ExpectedCredits(1089)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(10), ExpectedCredits(1257)),
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
