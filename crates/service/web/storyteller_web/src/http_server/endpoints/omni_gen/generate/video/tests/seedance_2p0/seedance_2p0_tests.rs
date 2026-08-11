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
  assert_generation_fails_and_charges_nothing, assert_reference_video_charge_then_refund, assert_references_charge_more,
  assert_successful_generation_charges, assert_variant_charges_premium, base_generate_request,
  Batch, CreditsDelta, ExpectedCredits, Seconds, TestHarness,
};

// ── Seedance 2.0 (Volcengine) ──
// Rates: 480p 7.772 ¢/s, 720p 16 ¢/s, 1080p 46.632 ¢/s, 4K 86.6 ¢/s
// (4K ceil-rounds; the rest round once after duration × batch).
mod seedance_2p0 {
  use super::*;

  /// Every duration 4-15s at every resolution, single video.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn charges_every_duration_at_every_resolution() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(4), Batch(1), ExpectedCredits(31)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(39)),
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(1), ExpectedCredits(47)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(1), ExpectedCredits(54)),
      (Some(CommonResolution::FourEightyP), Seconds(8), Batch(1), ExpectedCredits(62)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(1), ExpectedCredits(70)),
      (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(78)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(1), ExpectedCredits(85)),
      (Some(CommonResolution::FourEightyP), Seconds(12), Batch(1), ExpectedCredits(93)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(1), ExpectedCredits(101)),
      (Some(CommonResolution::FourEightyP), Seconds(14), Batch(1), ExpectedCredits(109)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(1), ExpectedCredits(117)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(1), ExpectedCredits(64)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(80)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(1), ExpectedCredits(96)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(1), ExpectedCredits(112)),
      (Some(CommonResolution::SevenTwentyP), Seconds(8), Batch(1), ExpectedCredits(128)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(1), ExpectedCredits(144)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(160)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(1), ExpectedCredits(176)),
      (Some(CommonResolution::SevenTwentyP), Seconds(12), Batch(1), ExpectedCredits(192)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(1), ExpectedCredits(208)),
      (Some(CommonResolution::SevenTwentyP), Seconds(14), Batch(1), ExpectedCredits(224)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(240)),
      (Some(CommonResolution::TenEightyP), Seconds(4), Batch(1), ExpectedCredits(187)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(233)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(1), ExpectedCredits(280)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(1), ExpectedCredits(326)),
      (Some(CommonResolution::TenEightyP), Seconds(8), Batch(1), ExpectedCredits(373)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(1), ExpectedCredits(420)),
      (Some(CommonResolution::TenEightyP), Seconds(10), Batch(1), ExpectedCredits(466)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(1), ExpectedCredits(513)),
      (Some(CommonResolution::TenEightyP), Seconds(12), Batch(1), ExpectedCredits(560)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(1), ExpectedCredits(606)),
      (Some(CommonResolution::TenEightyP), Seconds(14), Batch(1), ExpectedCredits(653)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(1), ExpectedCredits(699)),
      (Some(CommonResolution::FourK), Seconds(4), Batch(1), ExpectedCredits(347)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(433)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(1), ExpectedCredits(520)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(1), ExpectedCredits(607)),
      (Some(CommonResolution::FourK), Seconds(8), Batch(1), ExpectedCredits(693)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(1), ExpectedCredits(780)),
      (Some(CommonResolution::FourK), Seconds(10), Batch(1), ExpectedCredits(866)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(1), ExpectedCredits(953)),
      (Some(CommonResolution::FourK), Seconds(12), Batch(1), ExpectedCredits(1040)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(1), ExpectedCredits(1126)),
      (Some(CommonResolution::FourK), Seconds(14), Batch(1), ExpectedCredits(1213)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(1), ExpectedCredits(1299)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p0, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// Every batch size 1-10 at every resolution (5s).
  /// Batches over the platform max of 4 downgrade to 4 (3 upgrades to 4); execution and billing agree.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn charges_every_batch_size_at_every_resolution() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(39)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(2), ExpectedCredits(78)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(3), ExpectedCredits(117)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(4), ExpectedCredits(155)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(5), ExpectedCredits(155)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(6), ExpectedCredits(155)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(7), ExpectedCredits(155)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(8), ExpectedCredits(155)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(9), ExpectedCredits(155)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(10), ExpectedCredits(155)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(80)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(160)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(3), ExpectedCredits(240)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(4), ExpectedCredits(320)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(5), ExpectedCredits(320)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(6), ExpectedCredits(320)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(7), ExpectedCredits(320)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(320)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(9), ExpectedCredits(320)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(10), ExpectedCredits(320)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(233)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(2), ExpectedCredits(466)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(3), ExpectedCredits(699)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(4), ExpectedCredits(933)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(5), ExpectedCredits(933)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(6), ExpectedCredits(933)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(7), ExpectedCredits(933)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(8), ExpectedCredits(933)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(9), ExpectedCredits(933)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(10), ExpectedCredits(933)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(433)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(2), ExpectedCredits(866)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(3), ExpectedCredits(1299)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(4), ExpectedCredits(1732)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(5), ExpectedCredits(1732)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(6), ExpectedCredits(1732)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(7), ExpectedCredits(1732)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(8), ExpectedCredits(1732)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(9), ExpectedCredits(1732)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(10), ExpectedCredits(1732)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p0, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// Spot checks across duration x batch x resolution.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn charges_spot_checked_combinations() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(2), ExpectedCredits(93)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(3), ExpectedCredits(163)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(4), ExpectedCredits(280)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(5), ExpectedCredits(342)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(8), ExpectedCredits(404)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(10), ExpectedCredits(466)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(2), ExpectedCredits(192)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(3), ExpectedCredits(336)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(4), ExpectedCredits(576)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(5), ExpectedCredits(704)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(8), ExpectedCredits(832)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(10), ExpectedCredits(960)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(2), ExpectedCredits(560)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(3), ExpectedCredits(979)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(4), ExpectedCredits(1679)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(5), ExpectedCredits(2052)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(8), ExpectedCredits(2425)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(10), ExpectedCredits(2798)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(2), ExpectedCredits(1040)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(3), ExpectedCredits(1819)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(4), ExpectedCredits(3118)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(5), ExpectedCredits(3811)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(8), ExpectedCredits(4504)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(10), ExpectedCredits(5196)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p0, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// With video references Seedance 2.0 switches to its with-references rate card (480p 8.81, 720p 22.05, 1080p 51.10, 4K 113.80 cents/s, ceil-rounded). The unreachable fixture media fails the upload after billing, so the exact charge is asserted on the refunded ledger entry.
  /// Every duration 4-15s at every resolution, single video.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_every_duration_at_every_resolution() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(4), Batch(1), ExpectedCredits(36)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(45)),
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(1), ExpectedCredits(53)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(1), ExpectedCredits(62)),
      (Some(CommonResolution::FourEightyP), Seconds(8), Batch(1), ExpectedCredits(71)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(1), ExpectedCredits(80)),
      (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(89)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(1), ExpectedCredits(97)),
      (Some(CommonResolution::FourEightyP), Seconds(12), Batch(1), ExpectedCredits(106)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(1), ExpectedCredits(115)),
      (Some(CommonResolution::FourEightyP), Seconds(14), Batch(1), ExpectedCredits(124)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(1), ExpectedCredits(133)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(1), ExpectedCredits(89)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(111)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(1), ExpectedCredits(133)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(1), ExpectedCredits(155)),
      (Some(CommonResolution::SevenTwentyP), Seconds(8), Batch(1), ExpectedCredits(177)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(1), ExpectedCredits(199)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(221)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(1), ExpectedCredits(243)),
      (Some(CommonResolution::SevenTwentyP), Seconds(12), Batch(1), ExpectedCredits(265)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(1), ExpectedCredits(287)),
      (Some(CommonResolution::SevenTwentyP), Seconds(14), Batch(1), ExpectedCredits(309)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(331)),
      (Some(CommonResolution::TenEightyP), Seconds(4), Batch(1), ExpectedCredits(205)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(256)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(1), ExpectedCredits(307)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(1), ExpectedCredits(358)),
      (Some(CommonResolution::TenEightyP), Seconds(8), Batch(1), ExpectedCredits(409)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(1), ExpectedCredits(460)),
      (Some(CommonResolution::TenEightyP), Seconds(10), Batch(1), ExpectedCredits(511)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(1), ExpectedCredits(563)),
      (Some(CommonResolution::TenEightyP), Seconds(12), Batch(1), ExpectedCredits(614)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(1), ExpectedCredits(665)),
      (Some(CommonResolution::TenEightyP), Seconds(14), Batch(1), ExpectedCredits(716)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(1), ExpectedCredits(767)),
      (Some(CommonResolution::FourK), Seconds(4), Batch(1), ExpectedCredits(456)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(569)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(1), ExpectedCredits(683)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(1), ExpectedCredits(797)),
      (Some(CommonResolution::FourK), Seconds(8), Batch(1), ExpectedCredits(911)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(1), ExpectedCredits(1025)),
      (Some(CommonResolution::FourK), Seconds(10), Batch(1), ExpectedCredits(1138)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(1), ExpectedCredits(1252)),
      (Some(CommonResolution::FourK), Seconds(12), Batch(1), ExpectedCredits(1366)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(1), ExpectedCredits(1480)),
      (Some(CommonResolution::FourK), Seconds(14), Batch(1), ExpectedCredits(1594)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(1), ExpectedCredits(1707)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p0, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// With video references Seedance 2.0 switches to its with-references rate card (480p 8.81, 720p 22.05, 1080p 51.10, 4K 113.80 cents/s, ceil-rounded). The unreachable fixture media fails the upload after billing, so the exact charge is asserted on the refunded ledger entry.
  /// Every batch size 1-10 at every resolution (5s).
  /// Batches over the platform max of 4 downgrade to 4 (3 upgrades to 4); execution and billing agree.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_every_batch_size_at_every_resolution() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(45)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(2), ExpectedCredits(89)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(3), ExpectedCredits(133)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(4), ExpectedCredits(177)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(5), ExpectedCredits(177)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(6), ExpectedCredits(177)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(7), ExpectedCredits(177)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(8), ExpectedCredits(177)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(9), ExpectedCredits(177)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(10), ExpectedCredits(177)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(111)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(221)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(3), ExpectedCredits(331)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(4), ExpectedCredits(441)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(5), ExpectedCredits(441)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(6), ExpectedCredits(441)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(7), ExpectedCredits(441)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(441)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(9), ExpectedCredits(441)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(10), ExpectedCredits(441)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(256)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(2), ExpectedCredits(511)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(3), ExpectedCredits(767)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(4), ExpectedCredits(1022)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(5), ExpectedCredits(1022)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(6), ExpectedCredits(1022)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(7), ExpectedCredits(1022)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(8), ExpectedCredits(1022)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(9), ExpectedCredits(1022)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(10), ExpectedCredits(1022)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(569)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(2), ExpectedCredits(1138)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(3), ExpectedCredits(1707)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(4), ExpectedCredits(2276)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(5), ExpectedCredits(2276)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(6), ExpectedCredits(2276)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(7), ExpectedCredits(2276)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(8), ExpectedCredits(2276)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(9), ExpectedCredits(2276)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(10), ExpectedCredits(2276)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p0, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// With video references Seedance 2.0 switches to its with-references rate card (480p 8.81, 720p 22.05, 1080p 51.10, 4K 113.80 cents/s, ceil-rounded). The unreachable fixture media fails the upload after billing, so the exact charge is asserted on the refunded ledger entry.
  /// Spot checks across duration x batch x resolution.
  /// References must be CHARGED more than the identical no-reference
  /// request, at every resolution and across durations.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_more_than_no_references() {
    let harness = TestHarness::create().await;

    for resolution in [CommonResolution::FourEightyP, CommonResolution::SevenTwentyP, CommonResolution::TenEightyP, CommonResolution::FourK] {
      for seconds in [5u16, 10, 15] {
        assert_references_charge_more(
          &harness, CommonVideoModel::Seedance2p0, Some(resolution), Seconds(seconds),
        ).await;
      }
    }
  }

  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_spot_checked_combinations() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(2), ExpectedCredits(106)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(3), ExpectedCredits(186)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(4), ExpectedCredits(318)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(5), ExpectedCredits(388)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(8), ExpectedCredits(459)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(10), ExpectedCredits(529)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(2), ExpectedCredits(265)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(3), ExpectedCredits(464)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(4), ExpectedCredits(794)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(5), ExpectedCredits(971)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(8), ExpectedCredits(1147)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(10), ExpectedCredits(1323)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(2), ExpectedCredits(614)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(3), ExpectedCredits(1074)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(4), ExpectedCredits(1840)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(5), ExpectedCredits(2249)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(8), ExpectedCredits(2658)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(10), ExpectedCredits(3066)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(2), ExpectedCredits(1366)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(3), ExpectedCredits(2390)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(4), ExpectedCredits(4097)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(5), ExpectedCredits(5008)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(8), ExpectedCredits(5918)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(10), ExpectedCredits(6828)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p0, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn insufficient_balance_is_a_402_and_charges_nothing() {
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

// ── Seedance 2.0 BytePlus (+ its PreviewModel alias) ──
// THE collapse-bug regression pins. These variants are FULFILLED by the
// base Seedance 2.0 request but must be PRICED as themselves: 480p 10 ¢/s,
// 720p 25 ¢/s, 1080p 50 ¢/s, 4K 86.6 ¢/s. The shipped bug billed them at
// the base rate (720p 5s: 80 instead of 125).
mod seedance_2p0_bp {
  use super::*;

  /// Every duration 4-15s at every resolution, single video.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn charges_every_duration_at_every_resolution() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(4), Batch(1), ExpectedCredits(40)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(50)),
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(1), ExpectedCredits(60)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(1), ExpectedCredits(70)),
      (Some(CommonResolution::FourEightyP), Seconds(8), Batch(1), ExpectedCredits(80)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(1), ExpectedCredits(90)),
      (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(100)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(1), ExpectedCredits(110)),
      (Some(CommonResolution::FourEightyP), Seconds(12), Batch(1), ExpectedCredits(120)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(1), ExpectedCredits(130)),
      (Some(CommonResolution::FourEightyP), Seconds(14), Batch(1), ExpectedCredits(140)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(1), ExpectedCredits(150)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(1), ExpectedCredits(100)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(125)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(1), ExpectedCredits(150)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(1), ExpectedCredits(175)),
      (Some(CommonResolution::SevenTwentyP), Seconds(8), Batch(1), ExpectedCredits(200)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(1), ExpectedCredits(225)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(250)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(1), ExpectedCredits(275)),
      (Some(CommonResolution::SevenTwentyP), Seconds(12), Batch(1), ExpectedCredits(300)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(1), ExpectedCredits(325)),
      (Some(CommonResolution::SevenTwentyP), Seconds(14), Batch(1), ExpectedCredits(350)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(375)),
      (Some(CommonResolution::TenEightyP), Seconds(4), Batch(1), ExpectedCredits(200)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(250)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(1), ExpectedCredits(300)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(1), ExpectedCredits(350)),
      (Some(CommonResolution::TenEightyP), Seconds(8), Batch(1), ExpectedCredits(400)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(1), ExpectedCredits(450)),
      (Some(CommonResolution::TenEightyP), Seconds(10), Batch(1), ExpectedCredits(500)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(1), ExpectedCredits(550)),
      (Some(CommonResolution::TenEightyP), Seconds(12), Batch(1), ExpectedCredits(600)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(1), ExpectedCredits(650)),
      (Some(CommonResolution::TenEightyP), Seconds(14), Batch(1), ExpectedCredits(700)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(1), ExpectedCredits(750)),
      (Some(CommonResolution::FourK), Seconds(4), Batch(1), ExpectedCredits(380)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(475)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(1), ExpectedCredits(570)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(1), ExpectedCredits(665)),
      (Some(CommonResolution::FourK), Seconds(8), Batch(1), ExpectedCredits(760)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(1), ExpectedCredits(855)),
      (Some(CommonResolution::FourK), Seconds(10), Batch(1), ExpectedCredits(950)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(1), ExpectedCredits(1045)),
      (Some(CommonResolution::FourK), Seconds(12), Batch(1), ExpectedCredits(1140)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(1), ExpectedCredits(1235)),
      (Some(CommonResolution::FourK), Seconds(14), Batch(1), ExpectedCredits(1330)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(1), ExpectedCredits(1425)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p0BytePlus, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// Every batch size 1-10 at every resolution (5s).
  /// Batches over the platform max of 4 downgrade to 4 (3 upgrades to 4); execution and billing agree.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn charges_every_batch_size_at_every_resolution() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(50)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(2), ExpectedCredits(100)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(3), ExpectedCredits(150)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(4), ExpectedCredits(200)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(5), ExpectedCredits(200)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(6), ExpectedCredits(200)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(7), ExpectedCredits(200)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(8), ExpectedCredits(200)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(9), ExpectedCredits(200)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(10), ExpectedCredits(200)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(125)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(250)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(3), ExpectedCredits(375)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(4), ExpectedCredits(500)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(5), ExpectedCredits(500)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(6), ExpectedCredits(500)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(7), ExpectedCredits(500)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(500)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(9), ExpectedCredits(500)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(10), ExpectedCredits(500)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(250)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(2), ExpectedCredits(500)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(3), ExpectedCredits(750)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(4), ExpectedCredits(1000)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(5), ExpectedCredits(1000)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(6), ExpectedCredits(1000)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(7), ExpectedCredits(1000)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(8), ExpectedCredits(1000)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(9), ExpectedCredits(1000)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(10), ExpectedCredits(1000)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(475)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(2), ExpectedCredits(950)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(3), ExpectedCredits(1425)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(4), ExpectedCredits(1900)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(5), ExpectedCredits(1900)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(6), ExpectedCredits(1900)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(7), ExpectedCredits(1900)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(8), ExpectedCredits(1900)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(9), ExpectedCredits(1900)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(10), ExpectedCredits(1900)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p0BytePlus, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// Spot checks across duration x batch x resolution.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn charges_spot_checked_combinations() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(2), ExpectedCredits(120)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(3), ExpectedCredits(210)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(4), ExpectedCredits(360)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(5), ExpectedCredits(440)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(8), ExpectedCredits(520)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(10), ExpectedCredits(600)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(2), ExpectedCredits(300)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(3), ExpectedCredits(525)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(4), ExpectedCredits(900)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(5), ExpectedCredits(1100)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(8), ExpectedCredits(1300)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(10), ExpectedCredits(1500)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(2), ExpectedCredits(600)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(3), ExpectedCredits(1050)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(4), ExpectedCredits(1800)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(5), ExpectedCredits(2200)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(8), ExpectedCredits(2600)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(10), ExpectedCredits(3000)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(2), ExpectedCredits(1140)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(3), ExpectedCredits(1995)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(4), ExpectedCredits(3420)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(5), ExpectedCredits(4180)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(8), ExpectedCredits(4940)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(10), ExpectedCredits(5700)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p0BytePlus, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// The BytePlus rate cards are flat below 4K: reference videos only change the 4K price (a 17.20 cents/s surcharge). Charges are asserted on the refunded ledger entry (the fixture media is unreachable).
  /// Every duration 4-15s at every resolution, single video.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_every_duration_at_every_resolution() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(4), Batch(1), ExpectedCredits(41)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(51)),
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(1), ExpectedCredits(62)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(1), ExpectedCredits(72)),
      (Some(CommonResolution::FourEightyP), Seconds(8), Batch(1), ExpectedCredits(82)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(1), ExpectedCredits(92)),
      (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(102)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(1), ExpectedCredits(113)),
      (Some(CommonResolution::FourEightyP), Seconds(12), Batch(1), ExpectedCredits(123)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(1), ExpectedCredits(133)),
      (Some(CommonResolution::FourEightyP), Seconds(14), Batch(1), ExpectedCredits(143)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(1), ExpectedCredits(153)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(1), ExpectedCredits(103)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(129)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(1), ExpectedCredits(155)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(1), ExpectedCredits(180)),
      (Some(CommonResolution::SevenTwentyP), Seconds(8), Batch(1), ExpectedCredits(206)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(1), ExpectedCredits(232)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(257)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(1), ExpectedCredits(283)),
      (Some(CommonResolution::SevenTwentyP), Seconds(12), Batch(1), ExpectedCredits(309)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(1), ExpectedCredits(335)),
      (Some(CommonResolution::SevenTwentyP), Seconds(14), Batch(1), ExpectedCredits(360)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(386)),
      (Some(CommonResolution::TenEightyP), Seconds(4), Batch(1), ExpectedCredits(232)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(289)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(1), ExpectedCredits(347)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(1), ExpectedCredits(405)),
      (Some(CommonResolution::TenEightyP), Seconds(8), Batch(1), ExpectedCredits(463)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(1), ExpectedCredits(521)),
      (Some(CommonResolution::TenEightyP), Seconds(10), Batch(1), ExpectedCredits(578)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(1), ExpectedCredits(636)),
      (Some(CommonResolution::TenEightyP), Seconds(12), Batch(1), ExpectedCredits(694)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(1), ExpectedCredits(752)),
      (Some(CommonResolution::TenEightyP), Seconds(14), Batch(1), ExpectedCredits(810)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(1), ExpectedCredits(867)),
      (Some(CommonResolution::FourK), Seconds(4), Batch(1), ExpectedCredits(476)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(595)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(1), ExpectedCredits(714)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(1), ExpectedCredits(833)),
      (Some(CommonResolution::FourK), Seconds(8), Batch(1), ExpectedCredits(952)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(1), ExpectedCredits(1071)),
      (Some(CommonResolution::FourK), Seconds(10), Batch(1), ExpectedCredits(1190)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(1), ExpectedCredits(1309)),
      (Some(CommonResolution::FourK), Seconds(12), Batch(1), ExpectedCredits(1428)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(1), ExpectedCredits(1547)),
      (Some(CommonResolution::FourK), Seconds(14), Batch(1), ExpectedCredits(1666)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(1), ExpectedCredits(1785)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p0BytePlus, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// The BytePlus rate cards are flat below 4K: reference videos only change the 4K price (a 17.20 cents/s surcharge). Charges are asserted on the refunded ledger entry (the fixture media is unreachable).
  /// Every batch size 1-10 at every resolution (5s).
  /// Batches over the platform max of 4 downgrade to 4 (3 upgrades to 4); execution and billing agree.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_every_batch_size_at_every_resolution() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(51)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(2), ExpectedCredits(102)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(3), ExpectedCredits(153)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(4), ExpectedCredits(204)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(5), ExpectedCredits(204)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(6), ExpectedCredits(204)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(7), ExpectedCredits(204)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(8), ExpectedCredits(204)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(9), ExpectedCredits(204)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(10), ExpectedCredits(204)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(129)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(257)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(3), ExpectedCredits(386)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(4), ExpectedCredits(514)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(5), ExpectedCredits(514)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(6), ExpectedCredits(514)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(7), ExpectedCredits(514)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(514)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(9), ExpectedCredits(514)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(10), ExpectedCredits(514)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(289)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(2), ExpectedCredits(578)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(3), ExpectedCredits(867)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(4), ExpectedCredits(1156)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(5), ExpectedCredits(1156)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(6), ExpectedCredits(1156)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(7), ExpectedCredits(1156)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(8), ExpectedCredits(1156)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(9), ExpectedCredits(1156)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(10), ExpectedCredits(1156)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(595)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(2), ExpectedCredits(1190)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(3), ExpectedCredits(1785)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(4), ExpectedCredits(2380)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(5), ExpectedCredits(2380)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(6), ExpectedCredits(2380)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(7), ExpectedCredits(2380)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(8), ExpectedCredits(2380)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(9), ExpectedCredits(2380)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(10), ExpectedCredits(2380)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p0BytePlus, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// The BytePlus rate cards are flat below 4K: reference videos only change the 4K price (a 17.20 cents/s surcharge). Charges are asserted on the refunded ledger entry (the fixture media is unreachable).
  /// Spot checks across duration x batch x resolution.
  /// References must be CHARGED more than the identical no-reference
  /// request, at every resolution and across durations.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_more_than_no_references() {
    let harness = TestHarness::create().await;

    for resolution in [CommonResolution::FourEightyP, CommonResolution::SevenTwentyP, CommonResolution::TenEightyP, CommonResolution::FourK] {
      for seconds in [5u16, 10, 15] {
        assert_references_charge_more(
          &harness, CommonVideoModel::Seedance2p0BytePlus, Some(resolution), Seconds(seconds),
        ).await;
      }
    }
  }

  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_spot_checked_combinations() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(2), ExpectedCredits(123)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(3), ExpectedCredits(215)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(4), ExpectedCredits(368)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(5), ExpectedCredits(449)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(8), ExpectedCredits(531)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(10), ExpectedCredits(612)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(2), ExpectedCredits(309)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(3), ExpectedCredits(540)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(4), ExpectedCredits(926)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(5), ExpectedCredits(1131)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(8), ExpectedCredits(1337)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(10), ExpectedCredits(1542)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(2), ExpectedCredits(694)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(3), ExpectedCredits(1214)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(4), ExpectedCredits(2081)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(5), ExpectedCredits(2544)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(8), ExpectedCredits(3006)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(10), ExpectedCredits(3468)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(2), ExpectedCredits(1428)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(3), ExpectedCredits(2499)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(4), ExpectedCredits(4284)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(5), ExpectedCredits(5236)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(8), ExpectedCredits(6188)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(10), ExpectedCredits(7140)),
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

  /// Every duration 4-15s at every resolution, single video.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn charges_every_duration_at_every_resolution() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(4), Batch(1), ExpectedCredits(40)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(50)),
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(1), ExpectedCredits(60)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(1), ExpectedCredits(70)),
      (Some(CommonResolution::FourEightyP), Seconds(8), Batch(1), ExpectedCredits(80)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(1), ExpectedCredits(90)),
      (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(100)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(1), ExpectedCredits(110)),
      (Some(CommonResolution::FourEightyP), Seconds(12), Batch(1), ExpectedCredits(120)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(1), ExpectedCredits(130)),
      (Some(CommonResolution::FourEightyP), Seconds(14), Batch(1), ExpectedCredits(140)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(1), ExpectedCredits(150)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(1), ExpectedCredits(100)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(125)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(1), ExpectedCredits(150)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(1), ExpectedCredits(175)),
      (Some(CommonResolution::SevenTwentyP), Seconds(8), Batch(1), ExpectedCredits(200)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(1), ExpectedCredits(225)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(250)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(1), ExpectedCredits(275)),
      (Some(CommonResolution::SevenTwentyP), Seconds(12), Batch(1), ExpectedCredits(300)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(1), ExpectedCredits(325)),
      (Some(CommonResolution::SevenTwentyP), Seconds(14), Batch(1), ExpectedCredits(350)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(375)),
      (Some(CommonResolution::TenEightyP), Seconds(4), Batch(1), ExpectedCredits(200)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(250)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(1), ExpectedCredits(300)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(1), ExpectedCredits(350)),
      (Some(CommonResolution::TenEightyP), Seconds(8), Batch(1), ExpectedCredits(400)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(1), ExpectedCredits(450)),
      (Some(CommonResolution::TenEightyP), Seconds(10), Batch(1), ExpectedCredits(500)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(1), ExpectedCredits(550)),
      (Some(CommonResolution::TenEightyP), Seconds(12), Batch(1), ExpectedCredits(600)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(1), ExpectedCredits(650)),
      (Some(CommonResolution::TenEightyP), Seconds(14), Batch(1), ExpectedCredits(700)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(1), ExpectedCredits(750)),
      (Some(CommonResolution::FourK), Seconds(4), Batch(1), ExpectedCredits(380)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(475)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(1), ExpectedCredits(570)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(1), ExpectedCredits(665)),
      (Some(CommonResolution::FourK), Seconds(8), Batch(1), ExpectedCredits(760)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(1), ExpectedCredits(855)),
      (Some(CommonResolution::FourK), Seconds(10), Batch(1), ExpectedCredits(950)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(1), ExpectedCredits(1045)),
      (Some(CommonResolution::FourK), Seconds(12), Batch(1), ExpectedCredits(1140)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(1), ExpectedCredits(1235)),
      (Some(CommonResolution::FourK), Seconds(14), Batch(1), ExpectedCredits(1330)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(1), ExpectedCredits(1425)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p0BytePlusUltra, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// Every batch size 1-10 at every resolution (5s).
  /// Batches over the platform max of 4 downgrade to 4 (3 upgrades to 4); execution and billing agree.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn charges_every_batch_size_at_every_resolution() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(50)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(2), ExpectedCredits(100)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(3), ExpectedCredits(150)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(4), ExpectedCredits(200)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(5), ExpectedCredits(200)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(6), ExpectedCredits(200)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(7), ExpectedCredits(200)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(8), ExpectedCredits(200)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(9), ExpectedCredits(200)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(10), ExpectedCredits(200)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(125)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(250)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(3), ExpectedCredits(375)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(4), ExpectedCredits(500)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(5), ExpectedCredits(500)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(6), ExpectedCredits(500)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(7), ExpectedCredits(500)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(500)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(9), ExpectedCredits(500)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(10), ExpectedCredits(500)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(250)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(2), ExpectedCredits(500)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(3), ExpectedCredits(750)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(4), ExpectedCredits(1000)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(5), ExpectedCredits(1000)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(6), ExpectedCredits(1000)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(7), ExpectedCredits(1000)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(8), ExpectedCredits(1000)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(9), ExpectedCredits(1000)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(10), ExpectedCredits(1000)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(475)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(2), ExpectedCredits(950)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(3), ExpectedCredits(1425)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(4), ExpectedCredits(1900)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(5), ExpectedCredits(1900)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(6), ExpectedCredits(1900)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(7), ExpectedCredits(1900)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(8), ExpectedCredits(1900)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(9), ExpectedCredits(1900)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(10), ExpectedCredits(1900)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p0BytePlusUltra, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// Spot checks across duration x batch x resolution.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn charges_spot_checked_combinations() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(2), ExpectedCredits(120)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(3), ExpectedCredits(210)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(4), ExpectedCredits(360)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(5), ExpectedCredits(440)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(8), ExpectedCredits(520)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(10), ExpectedCredits(600)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(2), ExpectedCredits(300)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(3), ExpectedCredits(525)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(4), ExpectedCredits(900)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(5), ExpectedCredits(1100)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(8), ExpectedCredits(1300)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(10), ExpectedCredits(1500)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(2), ExpectedCredits(600)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(3), ExpectedCredits(1050)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(4), ExpectedCredits(1800)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(5), ExpectedCredits(2200)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(8), ExpectedCredits(2600)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(10), ExpectedCredits(3000)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(2), ExpectedCredits(1140)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(3), ExpectedCredits(1995)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(4), ExpectedCredits(3420)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(5), ExpectedCredits(4180)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(8), ExpectedCredits(4940)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(10), ExpectedCredits(5700)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p0BytePlusUltra, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// The BytePlus rate cards are flat below 4K: reference videos only change the 4K price (a 17.20 cents/s surcharge). Charges are asserted on the refunded ledger entry (the fixture media is unreachable).
  /// Every duration 4-15s at every resolution, single video.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_every_duration_at_every_resolution() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(4), Batch(1), ExpectedCredits(41)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(51)),
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(1), ExpectedCredits(62)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(1), ExpectedCredits(72)),
      (Some(CommonResolution::FourEightyP), Seconds(8), Batch(1), ExpectedCredits(82)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(1), ExpectedCredits(92)),
      (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(102)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(1), ExpectedCredits(113)),
      (Some(CommonResolution::FourEightyP), Seconds(12), Batch(1), ExpectedCredits(123)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(1), ExpectedCredits(133)),
      (Some(CommonResolution::FourEightyP), Seconds(14), Batch(1), ExpectedCredits(143)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(1), ExpectedCredits(153)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(1), ExpectedCredits(103)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(129)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(1), ExpectedCredits(155)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(1), ExpectedCredits(180)),
      (Some(CommonResolution::SevenTwentyP), Seconds(8), Batch(1), ExpectedCredits(206)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(1), ExpectedCredits(232)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(257)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(1), ExpectedCredits(283)),
      (Some(CommonResolution::SevenTwentyP), Seconds(12), Batch(1), ExpectedCredits(309)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(1), ExpectedCredits(335)),
      (Some(CommonResolution::SevenTwentyP), Seconds(14), Batch(1), ExpectedCredits(360)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(386)),
      (Some(CommonResolution::TenEightyP), Seconds(4), Batch(1), ExpectedCredits(232)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(289)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(1), ExpectedCredits(347)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(1), ExpectedCredits(405)),
      (Some(CommonResolution::TenEightyP), Seconds(8), Batch(1), ExpectedCredits(463)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(1), ExpectedCredits(521)),
      (Some(CommonResolution::TenEightyP), Seconds(10), Batch(1), ExpectedCredits(578)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(1), ExpectedCredits(636)),
      (Some(CommonResolution::TenEightyP), Seconds(12), Batch(1), ExpectedCredits(694)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(1), ExpectedCredits(752)),
      (Some(CommonResolution::TenEightyP), Seconds(14), Batch(1), ExpectedCredits(810)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(1), ExpectedCredits(867)),
      (Some(CommonResolution::FourK), Seconds(4), Batch(1), ExpectedCredits(476)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(595)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(1), ExpectedCredits(714)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(1), ExpectedCredits(833)),
      (Some(CommonResolution::FourK), Seconds(8), Batch(1), ExpectedCredits(952)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(1), ExpectedCredits(1071)),
      (Some(CommonResolution::FourK), Seconds(10), Batch(1), ExpectedCredits(1190)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(1), ExpectedCredits(1309)),
      (Some(CommonResolution::FourK), Seconds(12), Batch(1), ExpectedCredits(1428)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(1), ExpectedCredits(1547)),
      (Some(CommonResolution::FourK), Seconds(14), Batch(1), ExpectedCredits(1666)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(1), ExpectedCredits(1785)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p0BytePlusUltra, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// The BytePlus rate cards are flat below 4K: reference videos only change the 4K price (a 17.20 cents/s surcharge). Charges are asserted on the refunded ledger entry (the fixture media is unreachable).
  /// Every batch size 1-10 at every resolution (5s).
  /// Batches over the platform max of 4 downgrade to 4 (3 upgrades to 4); execution and billing agree.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_every_batch_size_at_every_resolution() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(51)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(2), ExpectedCredits(102)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(3), ExpectedCredits(153)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(4), ExpectedCredits(204)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(5), ExpectedCredits(204)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(6), ExpectedCredits(204)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(7), ExpectedCredits(204)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(8), ExpectedCredits(204)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(9), ExpectedCredits(204)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(10), ExpectedCredits(204)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(129)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(257)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(3), ExpectedCredits(386)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(4), ExpectedCredits(514)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(5), ExpectedCredits(514)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(6), ExpectedCredits(514)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(7), ExpectedCredits(514)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(514)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(9), ExpectedCredits(514)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(10), ExpectedCredits(514)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(289)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(2), ExpectedCredits(578)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(3), ExpectedCredits(867)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(4), ExpectedCredits(1156)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(5), ExpectedCredits(1156)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(6), ExpectedCredits(1156)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(7), ExpectedCredits(1156)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(8), ExpectedCredits(1156)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(9), ExpectedCredits(1156)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(10), ExpectedCredits(1156)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(595)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(2), ExpectedCredits(1190)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(3), ExpectedCredits(1785)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(4), ExpectedCredits(2380)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(5), ExpectedCredits(2380)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(6), ExpectedCredits(2380)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(7), ExpectedCredits(2380)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(8), ExpectedCredits(2380)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(9), ExpectedCredits(2380)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(10), ExpectedCredits(2380)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p0BytePlusUltra, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// The BytePlus rate cards are flat below 4K: reference videos only change the 4K price (a 17.20 cents/s surcharge). Charges are asserted on the refunded ledger entry (the fixture media is unreachable).
  /// Spot checks across duration x batch x resolution.
  /// References must be CHARGED more than the identical no-reference
  /// request, at every resolution and across durations.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_more_than_no_references() {
    let harness = TestHarness::create().await;

    for resolution in [CommonResolution::FourEightyP, CommonResolution::SevenTwentyP, CommonResolution::TenEightyP, CommonResolution::FourK] {
      for seconds in [5u16, 10, 15] {
        assert_references_charge_more(
          &harness, CommonVideoModel::Seedance2p0BytePlusUltra, Some(resolution), Seconds(seconds),
        ).await;
      }
    }
  }

  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_spot_checked_combinations() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(2), ExpectedCredits(123)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(3), ExpectedCredits(215)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(4), ExpectedCredits(368)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(5), ExpectedCredits(449)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(8), ExpectedCredits(531)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(10), ExpectedCredits(612)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(2), ExpectedCredits(309)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(3), ExpectedCredits(540)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(4), ExpectedCredits(926)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(5), ExpectedCredits(1131)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(8), ExpectedCredits(1337)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(10), ExpectedCredits(1542)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(2), ExpectedCredits(694)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(3), ExpectedCredits(1214)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(4), ExpectedCredits(2081)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(5), ExpectedCredits(2544)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(8), ExpectedCredits(3006)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(10), ExpectedCredits(3468)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(2), ExpectedCredits(1428)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(3), ExpectedCredits(2499)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(4), ExpectedCredits(4284)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(5), ExpectedCredits(5236)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(8), ExpectedCredits(6188)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(10), ExpectedCredits(7140)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p0BytePlusUltra, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }
}

// ── Seedance 2.0 Ultra (deprecated, unroutable) ──
mod seedance_2p0_u {
  use super::*;

  /// Seedance2p0Ultra is deprecated and has no execution route (its
  /// GmiCloud routing was removed). The request must fail cleanly BEFORE billing.
  /// If the route is ever re-enabled, this pin fails and pricing tests must be
  /// written for it.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  #[allow(deprecated)]
  async fn seedance_2p0_ultra_is_unroutable_and_charges_nothing() {
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
      // 4K premium: the base tier prices at 86.6 cents/s while the BytePlus
      // tiers price at 95.0 cents/s.
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(433), ExpectedCredits(475), CreditsDelta(42)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(4), ExpectedCredits(5196), ExpectedCredits(5700), CreditsDelta(504)),
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
      // 4K premium: the base tier prices at 86.6 cents/s while the BytePlus
      // tiers price at 95.0 cents/s.
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(433), ExpectedCredits(475), CreditsDelta(42)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(4), ExpectedCredits(5196), ExpectedCredits(5700), CreditsDelta(504)),
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
