//! Seedance 2.5 family pricing tests: 2.5 and 2.5 Ultra through the real
//! generate endpoint against the test database, asserting exact wallet
//! debits — including the reference-video input-seconds dimension.
//!
//! Rate cards (ceil-rounded once):
//! - Seedance 2.5:       480p 11.76954733 ¢/s, 720p 26.70781893 ¢/s;
//!   with video refs 480p 7.24279835 ¢/s, 720p 15.84362140 ¢/s over
//!   (output + input) seconds
//! - Seedance 2.5 Ultra: 480p 13.90946502 ¢/s, 720p 31.56378601 ¢/s;
//!   with video refs 480p 8.55967078 ¢/s, 720p 18.72427984 ¢/s
//!
//! Only 480p and 720p are offered (1080p/4K downgrade to 720p), durations
//! run 4-30s, and every request generates a single video regardless of the
//! requested batch size.

use enums::common::generation::common_resolution::CommonResolution;
use enums::common::generation::common_video_model::CommonVideoModel;

use crate::http_server::endpoints::omni_gen::generate::video::tests::support::{
  assert_real_input_videos_charge, assert_reference_video_charge_then_refund,
  assert_successful_generation_charges, assert_variant_charges_premium, Batch, CreditsDelta,
  ExpectedCredits, Seconds, TestHarness,
};

// ── Seedance 2.5 ──
mod seedance_2p5 {
  use super::*;

  /// Every duration 4-30s at every resolution, single video.
  /// Seedance 2.5 offers 480p and 720p; 1080p and 4K downgrade to 720p (and price accordingly).
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn charges_every_duration_at_every_resolution() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(4), Batch(1), ExpectedCredits(48)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(59)),
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(1), ExpectedCredits(71)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(1), ExpectedCredits(83)),
      (Some(CommonResolution::FourEightyP), Seconds(8), Batch(1), ExpectedCredits(95)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(1), ExpectedCredits(106)),
      (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(118)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(1), ExpectedCredits(130)),
      (Some(CommonResolution::FourEightyP), Seconds(12), Batch(1), ExpectedCredits(142)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(1), ExpectedCredits(154)),
      (Some(CommonResolution::FourEightyP), Seconds(14), Batch(1), ExpectedCredits(165)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(1), ExpectedCredits(177)),
      (Some(CommonResolution::FourEightyP), Seconds(16), Batch(1), ExpectedCredits(189)),
      (Some(CommonResolution::FourEightyP), Seconds(17), Batch(1), ExpectedCredits(201)),
      (Some(CommonResolution::FourEightyP), Seconds(18), Batch(1), ExpectedCredits(212)),
      (Some(CommonResolution::FourEightyP), Seconds(19), Batch(1), ExpectedCredits(224)),
      (Some(CommonResolution::FourEightyP), Seconds(20), Batch(1), ExpectedCredits(236)),
      (Some(CommonResolution::FourEightyP), Seconds(21), Batch(1), ExpectedCredits(248)),
      (Some(CommonResolution::FourEightyP), Seconds(22), Batch(1), ExpectedCredits(259)),
      (Some(CommonResolution::FourEightyP), Seconds(23), Batch(1), ExpectedCredits(271)),
      (Some(CommonResolution::FourEightyP), Seconds(24), Batch(1), ExpectedCredits(283)),
      (Some(CommonResolution::FourEightyP), Seconds(25), Batch(1), ExpectedCredits(295)),
      (Some(CommonResolution::FourEightyP), Seconds(26), Batch(1), ExpectedCredits(307)),
      (Some(CommonResolution::FourEightyP), Seconds(27), Batch(1), ExpectedCredits(318)),
      (Some(CommonResolution::FourEightyP), Seconds(28), Batch(1), ExpectedCredits(330)),
      (Some(CommonResolution::FourEightyP), Seconds(29), Batch(1), ExpectedCredits(342)),
      (Some(CommonResolution::FourEightyP), Seconds(30), Batch(1), ExpectedCredits(354)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(1), ExpectedCredits(107)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(134)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(1), ExpectedCredits(161)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(1), ExpectedCredits(187)),
      (Some(CommonResolution::SevenTwentyP), Seconds(8), Batch(1), ExpectedCredits(214)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(1), ExpectedCredits(241)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(268)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(1), ExpectedCredits(294)),
      (Some(CommonResolution::SevenTwentyP), Seconds(12), Batch(1), ExpectedCredits(321)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(1), ExpectedCredits(348)),
      (Some(CommonResolution::SevenTwentyP), Seconds(14), Batch(1), ExpectedCredits(374)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(401)),
      (Some(CommonResolution::SevenTwentyP), Seconds(16), Batch(1), ExpectedCredits(428)),
      (Some(CommonResolution::SevenTwentyP), Seconds(17), Batch(1), ExpectedCredits(455)),
      (Some(CommonResolution::SevenTwentyP), Seconds(18), Batch(1), ExpectedCredits(481)),
      (Some(CommonResolution::SevenTwentyP), Seconds(19), Batch(1), ExpectedCredits(508)),
      (Some(CommonResolution::SevenTwentyP), Seconds(20), Batch(1), ExpectedCredits(535)),
      (Some(CommonResolution::SevenTwentyP), Seconds(21), Batch(1), ExpectedCredits(561)),
      (Some(CommonResolution::SevenTwentyP), Seconds(22), Batch(1), ExpectedCredits(588)),
      (Some(CommonResolution::SevenTwentyP), Seconds(23), Batch(1), ExpectedCredits(615)),
      (Some(CommonResolution::SevenTwentyP), Seconds(24), Batch(1), ExpectedCredits(641)),
      (Some(CommonResolution::SevenTwentyP), Seconds(25), Batch(1), ExpectedCredits(668)),
      (Some(CommonResolution::SevenTwentyP), Seconds(26), Batch(1), ExpectedCredits(695)),
      (Some(CommonResolution::SevenTwentyP), Seconds(27), Batch(1), ExpectedCredits(722)),
      (Some(CommonResolution::SevenTwentyP), Seconds(28), Batch(1), ExpectedCredits(748)),
      (Some(CommonResolution::SevenTwentyP), Seconds(29), Batch(1), ExpectedCredits(775)),
      (Some(CommonResolution::SevenTwentyP), Seconds(30), Batch(1), ExpectedCredits(802)),
      (Some(CommonResolution::TenEightyP), Seconds(4), Batch(1), ExpectedCredits(107)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(134)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(1), ExpectedCredits(161)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(1), ExpectedCredits(187)),
      (Some(CommonResolution::TenEightyP), Seconds(8), Batch(1), ExpectedCredits(214)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(1), ExpectedCredits(241)),
      (Some(CommonResolution::TenEightyP), Seconds(10), Batch(1), ExpectedCredits(268)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(1), ExpectedCredits(294)),
      (Some(CommonResolution::TenEightyP), Seconds(12), Batch(1), ExpectedCredits(321)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(1), ExpectedCredits(348)),
      (Some(CommonResolution::TenEightyP), Seconds(14), Batch(1), ExpectedCredits(374)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(1), ExpectedCredits(401)),
      (Some(CommonResolution::TenEightyP), Seconds(16), Batch(1), ExpectedCredits(428)),
      (Some(CommonResolution::TenEightyP), Seconds(17), Batch(1), ExpectedCredits(455)),
      (Some(CommonResolution::TenEightyP), Seconds(18), Batch(1), ExpectedCredits(481)),
      (Some(CommonResolution::TenEightyP), Seconds(19), Batch(1), ExpectedCredits(508)),
      (Some(CommonResolution::TenEightyP), Seconds(20), Batch(1), ExpectedCredits(535)),
      (Some(CommonResolution::TenEightyP), Seconds(21), Batch(1), ExpectedCredits(561)),
      (Some(CommonResolution::TenEightyP), Seconds(22), Batch(1), ExpectedCredits(588)),
      (Some(CommonResolution::TenEightyP), Seconds(23), Batch(1), ExpectedCredits(615)),
      (Some(CommonResolution::TenEightyP), Seconds(24), Batch(1), ExpectedCredits(641)),
      (Some(CommonResolution::TenEightyP), Seconds(25), Batch(1), ExpectedCredits(668)),
      (Some(CommonResolution::TenEightyP), Seconds(26), Batch(1), ExpectedCredits(695)),
      (Some(CommonResolution::TenEightyP), Seconds(27), Batch(1), ExpectedCredits(722)),
      (Some(CommonResolution::TenEightyP), Seconds(28), Batch(1), ExpectedCredits(748)),
      (Some(CommonResolution::TenEightyP), Seconds(29), Batch(1), ExpectedCredits(775)),
      (Some(CommonResolution::TenEightyP), Seconds(30), Batch(1), ExpectedCredits(802)),
      (Some(CommonResolution::FourK), Seconds(4), Batch(1), ExpectedCredits(107)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(134)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(1), ExpectedCredits(161)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(1), ExpectedCredits(187)),
      (Some(CommonResolution::FourK), Seconds(8), Batch(1), ExpectedCredits(214)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(1), ExpectedCredits(241)),
      (Some(CommonResolution::FourK), Seconds(10), Batch(1), ExpectedCredits(268)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(1), ExpectedCredits(294)),
      (Some(CommonResolution::FourK), Seconds(12), Batch(1), ExpectedCredits(321)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(1), ExpectedCredits(348)),
      (Some(CommonResolution::FourK), Seconds(14), Batch(1), ExpectedCredits(374)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(1), ExpectedCredits(401)),
      (Some(CommonResolution::FourK), Seconds(16), Batch(1), ExpectedCredits(428)),
      (Some(CommonResolution::FourK), Seconds(17), Batch(1), ExpectedCredits(455)),
      (Some(CommonResolution::FourK), Seconds(18), Batch(1), ExpectedCredits(481)),
      (Some(CommonResolution::FourK), Seconds(19), Batch(1), ExpectedCredits(508)),
      (Some(CommonResolution::FourK), Seconds(20), Batch(1), ExpectedCredits(535)),
      (Some(CommonResolution::FourK), Seconds(21), Batch(1), ExpectedCredits(561)),
      (Some(CommonResolution::FourK), Seconds(22), Batch(1), ExpectedCredits(588)),
      (Some(CommonResolution::FourK), Seconds(23), Batch(1), ExpectedCredits(615)),
      (Some(CommonResolution::FourK), Seconds(24), Batch(1), ExpectedCredits(641)),
      (Some(CommonResolution::FourK), Seconds(25), Batch(1), ExpectedCredits(668)),
      (Some(CommonResolution::FourK), Seconds(26), Batch(1), ExpectedCredits(695)),
      (Some(CommonResolution::FourK), Seconds(27), Batch(1), ExpectedCredits(722)),
      (Some(CommonResolution::FourK), Seconds(28), Batch(1), ExpectedCredits(748)),
      (Some(CommonResolution::FourK), Seconds(29), Batch(1), ExpectedCredits(775)),
      (Some(CommonResolution::FourK), Seconds(30), Batch(1), ExpectedCredits(802)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p5, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// Every batch size 1-10 at every resolution (5s).
  /// Seedance 2.5 generates a single video per request: every requested batch size 1-10 bills exactly one video.
  /// Seedance 2.5 offers 480p and 720p; 1080p and 4K downgrade to 720p (and price accordingly).
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn charges_every_batch_size_at_every_resolution() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(59)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(2), ExpectedCredits(59)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(3), ExpectedCredits(59)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(4), ExpectedCredits(59)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(5), ExpectedCredits(59)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(6), ExpectedCredits(59)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(7), ExpectedCredits(59)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(8), ExpectedCredits(59)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(9), ExpectedCredits(59)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(10), ExpectedCredits(59)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(134)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(134)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(3), ExpectedCredits(134)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(4), ExpectedCredits(134)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(5), ExpectedCredits(134)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(6), ExpectedCredits(134)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(7), ExpectedCredits(134)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(134)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(9), ExpectedCredits(134)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(10), ExpectedCredits(134)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(134)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(2), ExpectedCredits(134)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(3), ExpectedCredits(134)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(4), ExpectedCredits(134)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(5), ExpectedCredits(134)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(6), ExpectedCredits(134)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(7), ExpectedCredits(134)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(8), ExpectedCredits(134)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(9), ExpectedCredits(134)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(10), ExpectedCredits(134)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(134)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(2), ExpectedCredits(134)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(3), ExpectedCredits(134)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(4), ExpectedCredits(134)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(5), ExpectedCredits(134)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(6), ExpectedCredits(134)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(7), ExpectedCredits(134)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(8), ExpectedCredits(134)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(9), ExpectedCredits(134)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(10), ExpectedCredits(134)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p5, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// Spot checks across duration x batch x resolution (batch always bills as one video).
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn charges_spot_checked_combinations() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(2), ExpectedCredits(71)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(3), ExpectedCredits(83)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(4), ExpectedCredits(106)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(5), ExpectedCredits(130)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(8), ExpectedCredits(154)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(10), ExpectedCredits(177)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(2), ExpectedCredits(161)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(3), ExpectedCredits(187)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(4), ExpectedCredits(241)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(5), ExpectedCredits(294)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(8), ExpectedCredits(348)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(10), ExpectedCredits(401)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(2), ExpectedCredits(161)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(3), ExpectedCredits(187)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(4), ExpectedCredits(241)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(5), ExpectedCredits(294)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(8), ExpectedCredits(348)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(10), ExpectedCredits(401)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(2), ExpectedCredits(161)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(3), ExpectedCredits(187)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(4), ExpectedCredits(241)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(5), ExpectedCredits(294)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(8), ExpectedCredits(348)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(10), ExpectedCredits(401)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p5, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// With video references the per-second rate drops but billed seconds = output duration + probed input seconds. The fixture media is unreachable, so the probe fails open to the worst-case 30 input seconds, the upload then fails, and the exact charge is asserted on the refunded ledger entry.
  /// Every duration 4-30s at every resolution.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_every_duration_at_every_resolution() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(4), Batch(1), ExpectedCredits(247)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(254)),
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(1), ExpectedCredits(261)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(1), ExpectedCredits(268)),
      (Some(CommonResolution::FourEightyP), Seconds(8), Batch(1), ExpectedCredits(276)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(1), ExpectedCredits(283)),
      (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(290)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(1), ExpectedCredits(297)),
      (Some(CommonResolution::FourEightyP), Seconds(12), Batch(1), ExpectedCredits(305)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(1), ExpectedCredits(312)),
      (Some(CommonResolution::FourEightyP), Seconds(14), Batch(1), ExpectedCredits(319)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(1), ExpectedCredits(326)),
      (Some(CommonResolution::FourEightyP), Seconds(16), Batch(1), ExpectedCredits(334)),
      (Some(CommonResolution::FourEightyP), Seconds(17), Batch(1), ExpectedCredits(341)),
      (Some(CommonResolution::FourEightyP), Seconds(18), Batch(1), ExpectedCredits(348)),
      (Some(CommonResolution::FourEightyP), Seconds(19), Batch(1), ExpectedCredits(355)),
      (Some(CommonResolution::FourEightyP), Seconds(20), Batch(1), ExpectedCredits(363)),
      (Some(CommonResolution::FourEightyP), Seconds(21), Batch(1), ExpectedCredits(370)),
      (Some(CommonResolution::FourEightyP), Seconds(22), Batch(1), ExpectedCredits(377)),
      (Some(CommonResolution::FourEightyP), Seconds(23), Batch(1), ExpectedCredits(384)),
      (Some(CommonResolution::FourEightyP), Seconds(24), Batch(1), ExpectedCredits(392)),
      (Some(CommonResolution::FourEightyP), Seconds(25), Batch(1), ExpectedCredits(399)),
      (Some(CommonResolution::FourEightyP), Seconds(26), Batch(1), ExpectedCredits(406)),
      (Some(CommonResolution::FourEightyP), Seconds(27), Batch(1), ExpectedCredits(413)),
      (Some(CommonResolution::FourEightyP), Seconds(28), Batch(1), ExpectedCredits(421)),
      (Some(CommonResolution::FourEightyP), Seconds(29), Batch(1), ExpectedCredits(428)),
      (Some(CommonResolution::FourEightyP), Seconds(30), Batch(1), ExpectedCredits(435)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(1), ExpectedCredits(539)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(555)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(1), ExpectedCredits(571)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(1), ExpectedCredits(587)),
      (Some(CommonResolution::SevenTwentyP), Seconds(8), Batch(1), ExpectedCredits(603)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(1), ExpectedCredits(618)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(634)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(1), ExpectedCredits(650)),
      (Some(CommonResolution::SevenTwentyP), Seconds(12), Batch(1), ExpectedCredits(666)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(1), ExpectedCredits(682)),
      (Some(CommonResolution::SevenTwentyP), Seconds(14), Batch(1), ExpectedCredits(698)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(713)),
      (Some(CommonResolution::SevenTwentyP), Seconds(16), Batch(1), ExpectedCredits(729)),
      (Some(CommonResolution::SevenTwentyP), Seconds(17), Batch(1), ExpectedCredits(745)),
      (Some(CommonResolution::SevenTwentyP), Seconds(18), Batch(1), ExpectedCredits(761)),
      (Some(CommonResolution::SevenTwentyP), Seconds(19), Batch(1), ExpectedCredits(777)),
      (Some(CommonResolution::SevenTwentyP), Seconds(20), Batch(1), ExpectedCredits(793)),
      (Some(CommonResolution::SevenTwentyP), Seconds(21), Batch(1), ExpectedCredits(809)),
      (Some(CommonResolution::SevenTwentyP), Seconds(22), Batch(1), ExpectedCredits(824)),
      (Some(CommonResolution::SevenTwentyP), Seconds(23), Batch(1), ExpectedCredits(840)),
      (Some(CommonResolution::SevenTwentyP), Seconds(24), Batch(1), ExpectedCredits(856)),
      (Some(CommonResolution::SevenTwentyP), Seconds(25), Batch(1), ExpectedCredits(872)),
      (Some(CommonResolution::SevenTwentyP), Seconds(26), Batch(1), ExpectedCredits(888)),
      (Some(CommonResolution::SevenTwentyP), Seconds(27), Batch(1), ExpectedCredits(904)),
      (Some(CommonResolution::SevenTwentyP), Seconds(28), Batch(1), ExpectedCredits(919)),
      (Some(CommonResolution::SevenTwentyP), Seconds(29), Batch(1), ExpectedCredits(935)),
      (Some(CommonResolution::SevenTwentyP), Seconds(30), Batch(1), ExpectedCredits(951)),
      (Some(CommonResolution::TenEightyP), Seconds(4), Batch(1), ExpectedCredits(539)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(555)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(1), ExpectedCredits(571)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(1), ExpectedCredits(587)),
      (Some(CommonResolution::TenEightyP), Seconds(8), Batch(1), ExpectedCredits(603)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(1), ExpectedCredits(618)),
      (Some(CommonResolution::TenEightyP), Seconds(10), Batch(1), ExpectedCredits(634)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(1), ExpectedCredits(650)),
      (Some(CommonResolution::TenEightyP), Seconds(12), Batch(1), ExpectedCredits(666)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(1), ExpectedCredits(682)),
      (Some(CommonResolution::TenEightyP), Seconds(14), Batch(1), ExpectedCredits(698)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(1), ExpectedCredits(713)),
      (Some(CommonResolution::TenEightyP), Seconds(16), Batch(1), ExpectedCredits(729)),
      (Some(CommonResolution::TenEightyP), Seconds(17), Batch(1), ExpectedCredits(745)),
      (Some(CommonResolution::TenEightyP), Seconds(18), Batch(1), ExpectedCredits(761)),
      (Some(CommonResolution::TenEightyP), Seconds(19), Batch(1), ExpectedCredits(777)),
      (Some(CommonResolution::TenEightyP), Seconds(20), Batch(1), ExpectedCredits(793)),
      (Some(CommonResolution::TenEightyP), Seconds(21), Batch(1), ExpectedCredits(809)),
      (Some(CommonResolution::TenEightyP), Seconds(22), Batch(1), ExpectedCredits(824)),
      (Some(CommonResolution::TenEightyP), Seconds(23), Batch(1), ExpectedCredits(840)),
      (Some(CommonResolution::TenEightyP), Seconds(24), Batch(1), ExpectedCredits(856)),
      (Some(CommonResolution::TenEightyP), Seconds(25), Batch(1), ExpectedCredits(872)),
      (Some(CommonResolution::TenEightyP), Seconds(26), Batch(1), ExpectedCredits(888)),
      (Some(CommonResolution::TenEightyP), Seconds(27), Batch(1), ExpectedCredits(904)),
      (Some(CommonResolution::TenEightyP), Seconds(28), Batch(1), ExpectedCredits(919)),
      (Some(CommonResolution::TenEightyP), Seconds(29), Batch(1), ExpectedCredits(935)),
      (Some(CommonResolution::TenEightyP), Seconds(30), Batch(1), ExpectedCredits(951)),
      (Some(CommonResolution::FourK), Seconds(4), Batch(1), ExpectedCredits(539)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(555)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(1), ExpectedCredits(571)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(1), ExpectedCredits(587)),
      (Some(CommonResolution::FourK), Seconds(8), Batch(1), ExpectedCredits(603)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(1), ExpectedCredits(618)),
      (Some(CommonResolution::FourK), Seconds(10), Batch(1), ExpectedCredits(634)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(1), ExpectedCredits(650)),
      (Some(CommonResolution::FourK), Seconds(12), Batch(1), ExpectedCredits(666)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(1), ExpectedCredits(682)),
      (Some(CommonResolution::FourK), Seconds(14), Batch(1), ExpectedCredits(698)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(1), ExpectedCredits(713)),
      (Some(CommonResolution::FourK), Seconds(16), Batch(1), ExpectedCredits(729)),
      (Some(CommonResolution::FourK), Seconds(17), Batch(1), ExpectedCredits(745)),
      (Some(CommonResolution::FourK), Seconds(18), Batch(1), ExpectedCredits(761)),
      (Some(CommonResolution::FourK), Seconds(19), Batch(1), ExpectedCredits(777)),
      (Some(CommonResolution::FourK), Seconds(20), Batch(1), ExpectedCredits(793)),
      (Some(CommonResolution::FourK), Seconds(21), Batch(1), ExpectedCredits(809)),
      (Some(CommonResolution::FourK), Seconds(22), Batch(1), ExpectedCredits(824)),
      (Some(CommonResolution::FourK), Seconds(23), Batch(1), ExpectedCredits(840)),
      (Some(CommonResolution::FourK), Seconds(24), Batch(1), ExpectedCredits(856)),
      (Some(CommonResolution::FourK), Seconds(25), Batch(1), ExpectedCredits(872)),
      (Some(CommonResolution::FourK), Seconds(26), Batch(1), ExpectedCredits(888)),
      (Some(CommonResolution::FourK), Seconds(27), Batch(1), ExpectedCredits(904)),
      (Some(CommonResolution::FourK), Seconds(28), Batch(1), ExpectedCredits(919)),
      (Some(CommonResolution::FourK), Seconds(29), Batch(1), ExpectedCredits(935)),
      (Some(CommonResolution::FourK), Seconds(30), Batch(1), ExpectedCredits(951)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p5, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// With video references the per-second rate drops but billed seconds = output duration + probed input seconds. The fixture media is unreachable, so the probe fails open to the worst-case 30 input seconds, the upload then fails, and the exact charge is asserted on the refunded ledger entry.
  /// Every batch size 1-10 at every resolution (5s).
  /// Seedance 2.5 generates a single video per request: every requested batch size 1-10 bills exactly one video.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_every_batch_size_at_every_resolution() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(254)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(2), ExpectedCredits(254)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(3), ExpectedCredits(254)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(4), ExpectedCredits(254)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(5), ExpectedCredits(254)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(6), ExpectedCredits(254)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(7), ExpectedCredits(254)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(8), ExpectedCredits(254)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(9), ExpectedCredits(254)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(10), ExpectedCredits(254)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(555)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(555)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(3), ExpectedCredits(555)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(4), ExpectedCredits(555)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(5), ExpectedCredits(555)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(6), ExpectedCredits(555)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(7), ExpectedCredits(555)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(555)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(9), ExpectedCredits(555)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(10), ExpectedCredits(555)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(555)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(2), ExpectedCredits(555)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(3), ExpectedCredits(555)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(4), ExpectedCredits(555)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(5), ExpectedCredits(555)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(6), ExpectedCredits(555)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(7), ExpectedCredits(555)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(8), ExpectedCredits(555)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(9), ExpectedCredits(555)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(10), ExpectedCredits(555)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(555)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(2), ExpectedCredits(555)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(3), ExpectedCredits(555)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(4), ExpectedCredits(555)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(5), ExpectedCredits(555)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(6), ExpectedCredits(555)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(7), ExpectedCredits(555)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(8), ExpectedCredits(555)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(9), ExpectedCredits(555)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(10), ExpectedCredits(555)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p5, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// With video references the per-second rate drops but billed seconds = output duration + probed input seconds. The fixture media is unreachable, so the probe fails open to the worst-case 30 input seconds, the upload then fails, and the exact charge is asserted on the refunded ledger entry.
  /// Spot checks across duration x batch x resolution.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_spot_checked_combinations() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(2), ExpectedCredits(261)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(3), ExpectedCredits(268)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(4), ExpectedCredits(283)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(5), ExpectedCredits(297)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(8), ExpectedCredits(312)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(10), ExpectedCredits(326)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(2), ExpectedCredits(571)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(3), ExpectedCredits(587)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(4), ExpectedCredits(618)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(5), ExpectedCredits(650)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(8), ExpectedCredits(682)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(10), ExpectedCredits(713)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(2), ExpectedCredits(571)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(3), ExpectedCredits(587)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(4), ExpectedCredits(618)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(5), ExpectedCredits(650)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(8), ExpectedCredits(682)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(10), ExpectedCredits(713)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(2), ExpectedCredits(571)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(3), ExpectedCredits(587)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(4), ExpectedCredits(618)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(5), ExpectedCredits(650)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(8), ExpectedCredits(682)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(10), ExpectedCredits(713)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p5, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }
}

// ── Seedance 2.5 Ultra ──
// Fulfilled by Seedance 2.5 (same execution request), priced as itself and
// routed to a different provider account. If the pipeline ever collapses
// the model before billing, every row here fails with the regular 2.5
// numbers.
mod seedance_2p5_u {
  use super::*;

  /// Every duration 4-30s at every resolution, single video.
  /// Seedance 2.5 offers 480p and 720p; 1080p and 4K downgrade to 720p (and price accordingly).
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn charges_every_duration_at_every_resolution() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(4), Batch(1), ExpectedCredits(56)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(70)),
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(1), ExpectedCredits(84)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(1), ExpectedCredits(98)),
      (Some(CommonResolution::FourEightyP), Seconds(8), Batch(1), ExpectedCredits(112)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(1), ExpectedCredits(126)),
      (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(140)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(1), ExpectedCredits(154)),
      (Some(CommonResolution::FourEightyP), Seconds(12), Batch(1), ExpectedCredits(167)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(1), ExpectedCredits(181)),
      (Some(CommonResolution::FourEightyP), Seconds(14), Batch(1), ExpectedCredits(195)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(1), ExpectedCredits(209)),
      (Some(CommonResolution::FourEightyP), Seconds(16), Batch(1), ExpectedCredits(223)),
      (Some(CommonResolution::FourEightyP), Seconds(17), Batch(1), ExpectedCredits(237)),
      (Some(CommonResolution::FourEightyP), Seconds(18), Batch(1), ExpectedCredits(251)),
      (Some(CommonResolution::FourEightyP), Seconds(19), Batch(1), ExpectedCredits(265)),
      (Some(CommonResolution::FourEightyP), Seconds(20), Batch(1), ExpectedCredits(279)),
      (Some(CommonResolution::FourEightyP), Seconds(21), Batch(1), ExpectedCredits(293)),
      (Some(CommonResolution::FourEightyP), Seconds(22), Batch(1), ExpectedCredits(307)),
      (Some(CommonResolution::FourEightyP), Seconds(23), Batch(1), ExpectedCredits(320)),
      (Some(CommonResolution::FourEightyP), Seconds(24), Batch(1), ExpectedCredits(334)),
      (Some(CommonResolution::FourEightyP), Seconds(25), Batch(1), ExpectedCredits(348)),
      (Some(CommonResolution::FourEightyP), Seconds(26), Batch(1), ExpectedCredits(362)),
      (Some(CommonResolution::FourEightyP), Seconds(27), Batch(1), ExpectedCredits(376)),
      (Some(CommonResolution::FourEightyP), Seconds(28), Batch(1), ExpectedCredits(390)),
      (Some(CommonResolution::FourEightyP), Seconds(29), Batch(1), ExpectedCredits(404)),
      (Some(CommonResolution::FourEightyP), Seconds(30), Batch(1), ExpectedCredits(418)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(1), ExpectedCredits(127)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(158)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(1), ExpectedCredits(190)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(1), ExpectedCredits(221)),
      (Some(CommonResolution::SevenTwentyP), Seconds(8), Batch(1), ExpectedCredits(253)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(1), ExpectedCredits(285)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(316)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(1), ExpectedCredits(348)),
      (Some(CommonResolution::SevenTwentyP), Seconds(12), Batch(1), ExpectedCredits(379)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(1), ExpectedCredits(411)),
      (Some(CommonResolution::SevenTwentyP), Seconds(14), Batch(1), ExpectedCredits(442)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(474)),
      (Some(CommonResolution::SevenTwentyP), Seconds(16), Batch(1), ExpectedCredits(506)),
      (Some(CommonResolution::SevenTwentyP), Seconds(17), Batch(1), ExpectedCredits(537)),
      (Some(CommonResolution::SevenTwentyP), Seconds(18), Batch(1), ExpectedCredits(569)),
      (Some(CommonResolution::SevenTwentyP), Seconds(19), Batch(1), ExpectedCredits(600)),
      (Some(CommonResolution::SevenTwentyP), Seconds(20), Batch(1), ExpectedCredits(632)),
      (Some(CommonResolution::SevenTwentyP), Seconds(21), Batch(1), ExpectedCredits(663)),
      (Some(CommonResolution::SevenTwentyP), Seconds(22), Batch(1), ExpectedCredits(695)),
      (Some(CommonResolution::SevenTwentyP), Seconds(23), Batch(1), ExpectedCredits(726)),
      (Some(CommonResolution::SevenTwentyP), Seconds(24), Batch(1), ExpectedCredits(758)),
      (Some(CommonResolution::SevenTwentyP), Seconds(25), Batch(1), ExpectedCredits(790)),
      (Some(CommonResolution::SevenTwentyP), Seconds(26), Batch(1), ExpectedCredits(821)),
      (Some(CommonResolution::SevenTwentyP), Seconds(27), Batch(1), ExpectedCredits(853)),
      (Some(CommonResolution::SevenTwentyP), Seconds(28), Batch(1), ExpectedCredits(884)),
      (Some(CommonResolution::SevenTwentyP), Seconds(29), Batch(1), ExpectedCredits(916)),
      (Some(CommonResolution::SevenTwentyP), Seconds(30), Batch(1), ExpectedCredits(947)),
      (Some(CommonResolution::TenEightyP), Seconds(4), Batch(1), ExpectedCredits(127)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(158)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(1), ExpectedCredits(190)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(1), ExpectedCredits(221)),
      (Some(CommonResolution::TenEightyP), Seconds(8), Batch(1), ExpectedCredits(253)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(1), ExpectedCredits(285)),
      (Some(CommonResolution::TenEightyP), Seconds(10), Batch(1), ExpectedCredits(316)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(1), ExpectedCredits(348)),
      (Some(CommonResolution::TenEightyP), Seconds(12), Batch(1), ExpectedCredits(379)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(1), ExpectedCredits(411)),
      (Some(CommonResolution::TenEightyP), Seconds(14), Batch(1), ExpectedCredits(442)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(1), ExpectedCredits(474)),
      (Some(CommonResolution::TenEightyP), Seconds(16), Batch(1), ExpectedCredits(506)),
      (Some(CommonResolution::TenEightyP), Seconds(17), Batch(1), ExpectedCredits(537)),
      (Some(CommonResolution::TenEightyP), Seconds(18), Batch(1), ExpectedCredits(569)),
      (Some(CommonResolution::TenEightyP), Seconds(19), Batch(1), ExpectedCredits(600)),
      (Some(CommonResolution::TenEightyP), Seconds(20), Batch(1), ExpectedCredits(632)),
      (Some(CommonResolution::TenEightyP), Seconds(21), Batch(1), ExpectedCredits(663)),
      (Some(CommonResolution::TenEightyP), Seconds(22), Batch(1), ExpectedCredits(695)),
      (Some(CommonResolution::TenEightyP), Seconds(23), Batch(1), ExpectedCredits(726)),
      (Some(CommonResolution::TenEightyP), Seconds(24), Batch(1), ExpectedCredits(758)),
      (Some(CommonResolution::TenEightyP), Seconds(25), Batch(1), ExpectedCredits(790)),
      (Some(CommonResolution::TenEightyP), Seconds(26), Batch(1), ExpectedCredits(821)),
      (Some(CommonResolution::TenEightyP), Seconds(27), Batch(1), ExpectedCredits(853)),
      (Some(CommonResolution::TenEightyP), Seconds(28), Batch(1), ExpectedCredits(884)),
      (Some(CommonResolution::TenEightyP), Seconds(29), Batch(1), ExpectedCredits(916)),
      (Some(CommonResolution::TenEightyP), Seconds(30), Batch(1), ExpectedCredits(947)),
      (Some(CommonResolution::FourK), Seconds(4), Batch(1), ExpectedCredits(127)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(158)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(1), ExpectedCredits(190)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(1), ExpectedCredits(221)),
      (Some(CommonResolution::FourK), Seconds(8), Batch(1), ExpectedCredits(253)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(1), ExpectedCredits(285)),
      (Some(CommonResolution::FourK), Seconds(10), Batch(1), ExpectedCredits(316)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(1), ExpectedCredits(348)),
      (Some(CommonResolution::FourK), Seconds(12), Batch(1), ExpectedCredits(379)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(1), ExpectedCredits(411)),
      (Some(CommonResolution::FourK), Seconds(14), Batch(1), ExpectedCredits(442)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(1), ExpectedCredits(474)),
      (Some(CommonResolution::FourK), Seconds(16), Batch(1), ExpectedCredits(506)),
      (Some(CommonResolution::FourK), Seconds(17), Batch(1), ExpectedCredits(537)),
      (Some(CommonResolution::FourK), Seconds(18), Batch(1), ExpectedCredits(569)),
      (Some(CommonResolution::FourK), Seconds(19), Batch(1), ExpectedCredits(600)),
      (Some(CommonResolution::FourK), Seconds(20), Batch(1), ExpectedCredits(632)),
      (Some(CommonResolution::FourK), Seconds(21), Batch(1), ExpectedCredits(663)),
      (Some(CommonResolution::FourK), Seconds(22), Batch(1), ExpectedCredits(695)),
      (Some(CommonResolution::FourK), Seconds(23), Batch(1), ExpectedCredits(726)),
      (Some(CommonResolution::FourK), Seconds(24), Batch(1), ExpectedCredits(758)),
      (Some(CommonResolution::FourK), Seconds(25), Batch(1), ExpectedCredits(790)),
      (Some(CommonResolution::FourK), Seconds(26), Batch(1), ExpectedCredits(821)),
      (Some(CommonResolution::FourK), Seconds(27), Batch(1), ExpectedCredits(853)),
      (Some(CommonResolution::FourK), Seconds(28), Batch(1), ExpectedCredits(884)),
      (Some(CommonResolution::FourK), Seconds(29), Batch(1), ExpectedCredits(916)),
      (Some(CommonResolution::FourK), Seconds(30), Batch(1), ExpectedCredits(947)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p5Ultra, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// Every batch size 1-10 at every resolution (5s).
  /// Seedance 2.5 generates a single video per request: every requested batch size 1-10 bills exactly one video.
  /// Seedance 2.5 offers 480p and 720p; 1080p and 4K downgrade to 720p (and price accordingly).
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn charges_every_batch_size_at_every_resolution() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(70)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(2), ExpectedCredits(70)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(3), ExpectedCredits(70)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(4), ExpectedCredits(70)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(5), ExpectedCredits(70)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(6), ExpectedCredits(70)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(7), ExpectedCredits(70)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(8), ExpectedCredits(70)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(9), ExpectedCredits(70)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(10), ExpectedCredits(70)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(158)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(158)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(3), ExpectedCredits(158)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(4), ExpectedCredits(158)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(5), ExpectedCredits(158)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(6), ExpectedCredits(158)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(7), ExpectedCredits(158)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(158)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(9), ExpectedCredits(158)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(10), ExpectedCredits(158)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(158)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(2), ExpectedCredits(158)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(3), ExpectedCredits(158)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(4), ExpectedCredits(158)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(5), ExpectedCredits(158)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(6), ExpectedCredits(158)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(7), ExpectedCredits(158)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(8), ExpectedCredits(158)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(9), ExpectedCredits(158)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(10), ExpectedCredits(158)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(158)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(2), ExpectedCredits(158)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(3), ExpectedCredits(158)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(4), ExpectedCredits(158)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(5), ExpectedCredits(158)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(6), ExpectedCredits(158)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(7), ExpectedCredits(158)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(8), ExpectedCredits(158)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(9), ExpectedCredits(158)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(10), ExpectedCredits(158)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p5Ultra, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// Spot checks across duration x batch x resolution (batch always bills as one video).
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn charges_spot_checked_combinations() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(2), ExpectedCredits(84)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(3), ExpectedCredits(98)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(4), ExpectedCredits(126)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(5), ExpectedCredits(154)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(8), ExpectedCredits(181)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(10), ExpectedCredits(209)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(2), ExpectedCredits(190)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(3), ExpectedCredits(221)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(4), ExpectedCredits(285)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(5), ExpectedCredits(348)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(8), ExpectedCredits(411)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(10), ExpectedCredits(474)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(2), ExpectedCredits(190)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(3), ExpectedCredits(221)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(4), ExpectedCredits(285)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(5), ExpectedCredits(348)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(8), ExpectedCredits(411)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(10), ExpectedCredits(474)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(2), ExpectedCredits(190)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(3), ExpectedCredits(221)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(4), ExpectedCredits(285)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(5), ExpectedCredits(348)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(8), ExpectedCredits(411)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(10), ExpectedCredits(474)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_successful_generation_charges(
        &harness, CommonVideoModel::Seedance2p5Ultra, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// With video references the per-second rate drops but billed seconds = output duration + probed input seconds. The fixture media is unreachable, so the probe fails open to the worst-case 30 input seconds, the upload then fails, and the exact charge is asserted on the refunded ledger entry.
  /// Every duration 4-30s at every resolution.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_every_duration_at_every_resolution() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(4), Batch(1), ExpectedCredits(292)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(300)),
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(1), ExpectedCredits(309)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(1), ExpectedCredits(317)),
      (Some(CommonResolution::FourEightyP), Seconds(8), Batch(1), ExpectedCredits(326)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(1), ExpectedCredits(334)),
      (Some(CommonResolution::FourEightyP), Seconds(10), Batch(1), ExpectedCredits(343)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(1), ExpectedCredits(351)),
      (Some(CommonResolution::FourEightyP), Seconds(12), Batch(1), ExpectedCredits(360)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(1), ExpectedCredits(369)),
      (Some(CommonResolution::FourEightyP), Seconds(14), Batch(1), ExpectedCredits(377)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(1), ExpectedCredits(386)),
      (Some(CommonResolution::FourEightyP), Seconds(16), Batch(1), ExpectedCredits(394)),
      (Some(CommonResolution::FourEightyP), Seconds(17), Batch(1), ExpectedCredits(403)),
      (Some(CommonResolution::FourEightyP), Seconds(18), Batch(1), ExpectedCredits(411)),
      (Some(CommonResolution::FourEightyP), Seconds(19), Batch(1), ExpectedCredits(420)),
      (Some(CommonResolution::FourEightyP), Seconds(20), Batch(1), ExpectedCredits(428)),
      (Some(CommonResolution::FourEightyP), Seconds(21), Batch(1), ExpectedCredits(437)),
      (Some(CommonResolution::FourEightyP), Seconds(22), Batch(1), ExpectedCredits(446)),
      (Some(CommonResolution::FourEightyP), Seconds(23), Batch(1), ExpectedCredits(454)),
      (Some(CommonResolution::FourEightyP), Seconds(24), Batch(1), ExpectedCredits(463)),
      (Some(CommonResolution::FourEightyP), Seconds(25), Batch(1), ExpectedCredits(471)),
      (Some(CommonResolution::FourEightyP), Seconds(26), Batch(1), ExpectedCredits(480)),
      (Some(CommonResolution::FourEightyP), Seconds(27), Batch(1), ExpectedCredits(488)),
      (Some(CommonResolution::FourEightyP), Seconds(28), Batch(1), ExpectedCredits(497)),
      (Some(CommonResolution::FourEightyP), Seconds(29), Batch(1), ExpectedCredits(506)),
      (Some(CommonResolution::FourEightyP), Seconds(30), Batch(1), ExpectedCredits(514)),
      (Some(CommonResolution::SevenTwentyP), Seconds(4), Batch(1), ExpectedCredits(637)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(656)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(1), ExpectedCredits(675)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(1), ExpectedCredits(693)),
      (Some(CommonResolution::SevenTwentyP), Seconds(8), Batch(1), ExpectedCredits(712)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(1), ExpectedCredits(731)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(749)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(1), ExpectedCredits(768)),
      (Some(CommonResolution::SevenTwentyP), Seconds(12), Batch(1), ExpectedCredits(787)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(1), ExpectedCredits(806)),
      (Some(CommonResolution::SevenTwentyP), Seconds(14), Batch(1), ExpectedCredits(824)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(843)),
      (Some(CommonResolution::SevenTwentyP), Seconds(16), Batch(1), ExpectedCredits(862)),
      (Some(CommonResolution::SevenTwentyP), Seconds(17), Batch(1), ExpectedCredits(881)),
      (Some(CommonResolution::SevenTwentyP), Seconds(18), Batch(1), ExpectedCredits(899)),
      (Some(CommonResolution::SevenTwentyP), Seconds(19), Batch(1), ExpectedCredits(918)),
      (Some(CommonResolution::SevenTwentyP), Seconds(20), Batch(1), ExpectedCredits(937)),
      (Some(CommonResolution::SevenTwentyP), Seconds(21), Batch(1), ExpectedCredits(955)),
      (Some(CommonResolution::SevenTwentyP), Seconds(22), Batch(1), ExpectedCredits(974)),
      (Some(CommonResolution::SevenTwentyP), Seconds(23), Batch(1), ExpectedCredits(993)),
      (Some(CommonResolution::SevenTwentyP), Seconds(24), Batch(1), ExpectedCredits(1012)),
      (Some(CommonResolution::SevenTwentyP), Seconds(25), Batch(1), ExpectedCredits(1030)),
      (Some(CommonResolution::SevenTwentyP), Seconds(26), Batch(1), ExpectedCredits(1049)),
      (Some(CommonResolution::SevenTwentyP), Seconds(27), Batch(1), ExpectedCredits(1068)),
      (Some(CommonResolution::SevenTwentyP), Seconds(28), Batch(1), ExpectedCredits(1087)),
      (Some(CommonResolution::SevenTwentyP), Seconds(29), Batch(1), ExpectedCredits(1105)),
      (Some(CommonResolution::SevenTwentyP), Seconds(30), Batch(1), ExpectedCredits(1124)),
      (Some(CommonResolution::TenEightyP), Seconds(4), Batch(1), ExpectedCredits(637)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(656)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(1), ExpectedCredits(675)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(1), ExpectedCredits(693)),
      (Some(CommonResolution::TenEightyP), Seconds(8), Batch(1), ExpectedCredits(712)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(1), ExpectedCredits(731)),
      (Some(CommonResolution::TenEightyP), Seconds(10), Batch(1), ExpectedCredits(749)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(1), ExpectedCredits(768)),
      (Some(CommonResolution::TenEightyP), Seconds(12), Batch(1), ExpectedCredits(787)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(1), ExpectedCredits(806)),
      (Some(CommonResolution::TenEightyP), Seconds(14), Batch(1), ExpectedCredits(824)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(1), ExpectedCredits(843)),
      (Some(CommonResolution::TenEightyP), Seconds(16), Batch(1), ExpectedCredits(862)),
      (Some(CommonResolution::TenEightyP), Seconds(17), Batch(1), ExpectedCredits(881)),
      (Some(CommonResolution::TenEightyP), Seconds(18), Batch(1), ExpectedCredits(899)),
      (Some(CommonResolution::TenEightyP), Seconds(19), Batch(1), ExpectedCredits(918)),
      (Some(CommonResolution::TenEightyP), Seconds(20), Batch(1), ExpectedCredits(937)),
      (Some(CommonResolution::TenEightyP), Seconds(21), Batch(1), ExpectedCredits(955)),
      (Some(CommonResolution::TenEightyP), Seconds(22), Batch(1), ExpectedCredits(974)),
      (Some(CommonResolution::TenEightyP), Seconds(23), Batch(1), ExpectedCredits(993)),
      (Some(CommonResolution::TenEightyP), Seconds(24), Batch(1), ExpectedCredits(1012)),
      (Some(CommonResolution::TenEightyP), Seconds(25), Batch(1), ExpectedCredits(1030)),
      (Some(CommonResolution::TenEightyP), Seconds(26), Batch(1), ExpectedCredits(1049)),
      (Some(CommonResolution::TenEightyP), Seconds(27), Batch(1), ExpectedCredits(1068)),
      (Some(CommonResolution::TenEightyP), Seconds(28), Batch(1), ExpectedCredits(1087)),
      (Some(CommonResolution::TenEightyP), Seconds(29), Batch(1), ExpectedCredits(1105)),
      (Some(CommonResolution::TenEightyP), Seconds(30), Batch(1), ExpectedCredits(1124)),
      (Some(CommonResolution::FourK), Seconds(4), Batch(1), ExpectedCredits(637)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(656)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(1), ExpectedCredits(675)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(1), ExpectedCredits(693)),
      (Some(CommonResolution::FourK), Seconds(8), Batch(1), ExpectedCredits(712)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(1), ExpectedCredits(731)),
      (Some(CommonResolution::FourK), Seconds(10), Batch(1), ExpectedCredits(749)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(1), ExpectedCredits(768)),
      (Some(CommonResolution::FourK), Seconds(12), Batch(1), ExpectedCredits(787)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(1), ExpectedCredits(806)),
      (Some(CommonResolution::FourK), Seconds(14), Batch(1), ExpectedCredits(824)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(1), ExpectedCredits(843)),
      (Some(CommonResolution::FourK), Seconds(16), Batch(1), ExpectedCredits(862)),
      (Some(CommonResolution::FourK), Seconds(17), Batch(1), ExpectedCredits(881)),
      (Some(CommonResolution::FourK), Seconds(18), Batch(1), ExpectedCredits(899)),
      (Some(CommonResolution::FourK), Seconds(19), Batch(1), ExpectedCredits(918)),
      (Some(CommonResolution::FourK), Seconds(20), Batch(1), ExpectedCredits(937)),
      (Some(CommonResolution::FourK), Seconds(21), Batch(1), ExpectedCredits(955)),
      (Some(CommonResolution::FourK), Seconds(22), Batch(1), ExpectedCredits(974)),
      (Some(CommonResolution::FourK), Seconds(23), Batch(1), ExpectedCredits(993)),
      (Some(CommonResolution::FourK), Seconds(24), Batch(1), ExpectedCredits(1012)),
      (Some(CommonResolution::FourK), Seconds(25), Batch(1), ExpectedCredits(1030)),
      (Some(CommonResolution::FourK), Seconds(26), Batch(1), ExpectedCredits(1049)),
      (Some(CommonResolution::FourK), Seconds(27), Batch(1), ExpectedCredits(1068)),
      (Some(CommonResolution::FourK), Seconds(28), Batch(1), ExpectedCredits(1087)),
      (Some(CommonResolution::FourK), Seconds(29), Batch(1), ExpectedCredits(1105)),
      (Some(CommonResolution::FourK), Seconds(30), Batch(1), ExpectedCredits(1124)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p5Ultra, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// With video references the per-second rate drops but billed seconds = output duration + probed input seconds. The fixture media is unreachable, so the probe fails open to the worst-case 30 input seconds, the upload then fails, and the exact charge is asserted on the refunded ledger entry.
  /// Every batch size 1-10 at every resolution (5s).
  /// Seedance 2.5 generates a single video per request: every requested batch size 1-10 bills exactly one video.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_every_batch_size_at_every_resolution() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(300)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(2), ExpectedCredits(300)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(3), ExpectedCredits(300)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(4), ExpectedCredits(300)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(5), ExpectedCredits(300)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(6), ExpectedCredits(300)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(7), ExpectedCredits(300)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(8), ExpectedCredits(300)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(9), ExpectedCredits(300)),
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(10), ExpectedCredits(300)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(656)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(2), ExpectedCredits(656)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(3), ExpectedCredits(656)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(4), ExpectedCredits(656)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(5), ExpectedCredits(656)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(6), ExpectedCredits(656)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(7), ExpectedCredits(656)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(8), ExpectedCredits(656)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(9), ExpectedCredits(656)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(10), ExpectedCredits(656)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(656)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(2), ExpectedCredits(656)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(3), ExpectedCredits(656)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(4), ExpectedCredits(656)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(5), ExpectedCredits(656)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(6), ExpectedCredits(656)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(7), ExpectedCredits(656)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(8), ExpectedCredits(656)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(9), ExpectedCredits(656)),
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(10), ExpectedCredits(656)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(656)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(2), ExpectedCredits(656)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(3), ExpectedCredits(656)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(4), ExpectedCredits(656)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(5), ExpectedCredits(656)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(6), ExpectedCredits(656)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(7), ExpectedCredits(656)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(8), ExpectedCredits(656)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(9), ExpectedCredits(656)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(10), ExpectedCredits(656)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p5Ultra, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }

  /// With video references the per-second rate drops but billed seconds = output duration + probed input seconds. The fixture media is unreachable, so the probe fails open to the worst-case 30 input seconds, the upload then fails, and the exact charge is asserted on the refunded ledger entry.
  /// Spot checks across duration x batch x resolution.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn video_references_charge_spot_checked_combinations() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(6), Batch(2), ExpectedCredits(309)),
      (Some(CommonResolution::FourEightyP), Seconds(7), Batch(3), ExpectedCredits(317)),
      (Some(CommonResolution::FourEightyP), Seconds(9), Batch(4), ExpectedCredits(334)),
      (Some(CommonResolution::FourEightyP), Seconds(11), Batch(5), ExpectedCredits(351)),
      (Some(CommonResolution::FourEightyP), Seconds(13), Batch(8), ExpectedCredits(369)),
      (Some(CommonResolution::FourEightyP), Seconds(15), Batch(10), ExpectedCredits(386)),
      (Some(CommonResolution::SevenTwentyP), Seconds(6), Batch(2), ExpectedCredits(675)),
      (Some(CommonResolution::SevenTwentyP), Seconds(7), Batch(3), ExpectedCredits(693)),
      (Some(CommonResolution::SevenTwentyP), Seconds(9), Batch(4), ExpectedCredits(731)),
      (Some(CommonResolution::SevenTwentyP), Seconds(11), Batch(5), ExpectedCredits(768)),
      (Some(CommonResolution::SevenTwentyP), Seconds(13), Batch(8), ExpectedCredits(806)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(10), ExpectedCredits(843)),
      (Some(CommonResolution::TenEightyP), Seconds(6), Batch(2), ExpectedCredits(675)),
      (Some(CommonResolution::TenEightyP), Seconds(7), Batch(3), ExpectedCredits(693)),
      (Some(CommonResolution::TenEightyP), Seconds(9), Batch(4), ExpectedCredits(731)),
      (Some(CommonResolution::TenEightyP), Seconds(11), Batch(5), ExpectedCredits(768)),
      (Some(CommonResolution::TenEightyP), Seconds(13), Batch(8), ExpectedCredits(806)),
      (Some(CommonResolution::TenEightyP), Seconds(15), Batch(10), ExpectedCredits(843)),
      (Some(CommonResolution::FourK), Seconds(6), Batch(2), ExpectedCredits(675)),
      (Some(CommonResolution::FourK), Seconds(7), Batch(3), ExpectedCredits(693)),
      (Some(CommonResolution::FourK), Seconds(9), Batch(4), ExpectedCredits(731)),
      (Some(CommonResolution::FourK), Seconds(11), Batch(5), ExpectedCredits(768)),
      (Some(CommonResolution::FourK), Seconds(13), Batch(8), ExpectedCredits(806)),
      (Some(CommonResolution::FourK), Seconds(15), Batch(10), ExpectedCredits(843)),
    ];

    for (resolution, seconds, batch, expected) in cases {
      assert_reference_video_charge_then_refund(
        &harness, CommonVideoModel::Seedance2p5Ultra, *resolution, *seconds, *batch, *expected,
      ).await;
    }
  }
}


// ── Input-video DURATION billing (real probed durations) ──
// The stub media CDN serves REAL generated videos with exact durations, so
// these run the full pipeline: download → ffprobe → billing → upload →
// generate. Billed input seconds per video = ceil(duration) clamped to a
// minimum of 4 (input durations run 1-30s; under 4s bills as 4s); the TOTAL
// across videos is capped at 30. Billed seconds = output + total input.
mod input_video_duration_billing {
  use super::*;

  /// 1.5s and 3.9s inputs both bill the 4-second minimum: identical price.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn input_videos_under_four_seconds_clamp_to_four_seconds() {
    let harness = TestHarness::create().await;

    // 30s output + 4s clamped input = 34 billed × 7.24279835 ¢/s → 247.
    assert_real_input_videos_charge(
      &harness, CommonVideoModel::Seedance2p5, Some(CommonResolution::FourEightyP),
      Seconds(30), &[1_500], ExpectedCredits(247),
    ).await;
    assert_real_input_videos_charge(
      &harness, CommonVideoModel::Seedance2p5, Some(CommonResolution::FourEightyP),
      Seconds(30), &[3_900], ExpectedCredits(247),
    ).await;
  }

  /// Above the 4-second floor, each input bills its ceil-rounded duration.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn input_video_durations_bill_their_ceil_rounded_seconds() {
    let harness = TestHarness::create().await;

    // (resolution, input millis, expected credits) at 30s output:
    //   4.5s → 5  → 35 billed × 7.24279835 = 253.50 → 254
    //   6.5s → 7  → 37 billed × 7.24279835 = 267.98 → 268
    //  10.5s → 11 → 41 billed × 7.24279835 = 296.95 → 297
    //   6.5s → 7  → 37 billed × 15.84362140 = 586.21 → 587 (720p)
    assert_real_input_videos_charge(
      &harness, CommonVideoModel::Seedance2p5, Some(CommonResolution::FourEightyP),
      Seconds(30), &[4_500], ExpectedCredits(254),
    ).await;
    assert_real_input_videos_charge(
      &harness, CommonVideoModel::Seedance2p5, Some(CommonResolution::FourEightyP),
      Seconds(30), &[6_500], ExpectedCredits(268),
    ).await;
    assert_real_input_videos_charge(
      &harness, CommonVideoModel::Seedance2p5, Some(CommonResolution::FourEightyP),
      Seconds(30), &[10_500], ExpectedCredits(297),
    ).await;
    assert_real_input_videos_charge(
      &harness, CommonVideoModel::Seedance2p5, Some(CommonResolution::SevenTwentyP),
      Seconds(30), &[6_500], ExpectedCredits(587),
    ).await;
  }

  /// The 4-second minimum applies PER VIDEO, before summing: a 2.5s + 6.5s
  /// pair bills 4 + 7 = 11 input seconds — the same as a single 10.5s video,
  /// and one more than a total-duration clamp (9s → 10) would produce.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn the_per_video_minimum_applies_before_summing() {
    let harness = TestHarness::create().await;

    // 30s output + 11 input = 41 billed × 7.24279835 = 296.95 → 297.
    assert_real_input_videos_charge(
      &harness, CommonVideoModel::Seedance2p5, Some(CommonResolution::FourEightyP),
      Seconds(30), &[2_500, 6_500], ExpectedCredits(297),
    ).await;
  }

  /// Total input seconds cap at 30: a 29.5s video (→ 30) and a pair of 20s
  /// videos (40 → capped 30) price identically to the worst case.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn total_input_seconds_cap_at_thirty() {
    let harness = TestHarness::create().await;

    // 30s output + 30 input = 60 billed × 7.24279835 = 434.57 → 435.
    assert_real_input_videos_charge(
      &harness, CommonVideoModel::Seedance2p5, Some(CommonResolution::FourEightyP),
      Seconds(30), &[29_500], ExpectedCredits(435),
    ).await;
    assert_real_input_videos_charge(
      &harness, CommonVideoModel::Seedance2p5, Some(CommonResolution::FourEightyP),
      Seconds(30), &[20_000, 20_000], ExpectedCredits(435),
    ).await;
  }

  /// Ultra applies the same input-second rules at its own rates.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn ultra_bills_the_same_input_second_rules_at_its_rates() {
    let harness = TestHarness::create().await;

    // 30s output, ultra with-refs 480p 8.55967078 ¢/s / 720p 18.72427984 ¢/s:
    //   2.5s → 4 (clamp) → 34 billed → 291.03 → 292
    //  10.5s → 11        → 41 billed → 350.95 → 351
    //  2.5s + 6.5s → 11  → 41 billed → 351 (per-video clamp, same as 10.5s)
    //   6.5s → 7 → 37 billed × 18.72427984 = 692.80 → 693 (720p)
    assert_real_input_videos_charge(
      &harness, CommonVideoModel::Seedance2p5Ultra, Some(CommonResolution::FourEightyP),
      Seconds(30), &[2_500], ExpectedCredits(292),
    ).await;
    assert_real_input_videos_charge(
      &harness, CommonVideoModel::Seedance2p5Ultra, Some(CommonResolution::FourEightyP),
      Seconds(30), &[10_500], ExpectedCredits(351),
    ).await;
    assert_real_input_videos_charge(
      &harness, CommonVideoModel::Seedance2p5Ultra, Some(CommonResolution::FourEightyP),
      Seconds(30), &[2_500, 6_500], ExpectedCredits(351),
    ).await;
    assert_real_input_videos_charge(
      &harness, CommonVideoModel::Seedance2p5Ultra, Some(CommonResolution::SevenTwentyP),
      Seconds(30), &[6_500], ExpectedCredits(693),
    ).await;
  }
}

// ── Revenue premium: Ultra over the base model ──
// Both prices and the delta are encoded so a change to EITHER rate card
// shows up here, not just a flipped ordering.
mod premium {
  use super::*;

  /// Seedance 2.5 Ultra is fulfilled by Seedance 2.5 but has its own (higher)
  /// price. Same shape as the 2.0 collapse-bug pins: if the pipeline ever
  /// collapses Ultra before billing, these fail with the regular 2.5 numbers.
  #[tokio::test]
  #[cfg_attr(feature = "skip_database_tests", ignore)]
  async fn seedance_2p5_ultra_charges_a_premium_over_the_base_model() {
    let harness = TestHarness::create().await;

    let cases: &[(Option<CommonResolution>, Seconds, Batch, ExpectedCredits, ExpectedCredits, CreditsDelta)] = &[
      (Some(CommonResolution::FourEightyP), Seconds(5), Batch(1), ExpectedCredits(59), ExpectedCredits(70), CreditsDelta(11)),
      (Some(CommonResolution::FourEightyP), Seconds(30), Batch(1), ExpectedCredits(354), ExpectedCredits(418), CreditsDelta(64)),
      (Some(CommonResolution::SevenTwentyP), Seconds(5), Batch(1), ExpectedCredits(134), ExpectedCredits(158), CreditsDelta(24)),
      (Some(CommonResolution::SevenTwentyP), Seconds(10), Batch(1), ExpectedCredits(268), ExpectedCredits(316), CreditsDelta(48)),
      (Some(CommonResolution::SevenTwentyP), Seconds(15), Batch(1), ExpectedCredits(401), ExpectedCredits(474), CreditsDelta(73)),
      (Some(CommonResolution::SevenTwentyP), Seconds(30), Batch(1), ExpectedCredits(802), ExpectedCredits(947), CreditsDelta(145)),
      // 1080p and 4K downgrade to 720p, so the premium matches 720p.
      (Some(CommonResolution::TenEightyP), Seconds(5), Batch(1), ExpectedCredits(134), ExpectedCredits(158), CreditsDelta(24)),
      (Some(CommonResolution::FourK), Seconds(5), Batch(1), ExpectedCredits(134), ExpectedCredits(158), CreditsDelta(24)),
    ];

    for (resolution, seconds, batch, base, variant, delta) in cases {
      assert_variant_charges_premium(
        &harness,
        CommonVideoModel::Seedance2p5,
        CommonVideoModel::Seedance2p5Ultra,
        *resolution, *seconds, *batch, *base, *variant, *delta,
      ).await;
    }
  }
}
