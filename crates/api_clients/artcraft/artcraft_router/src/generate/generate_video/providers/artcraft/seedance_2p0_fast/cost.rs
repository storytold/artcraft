use enums::common::generation::common_resolution::CommonResolution;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::artcraft::seedance_2p0_fast::request::ArtcraftSeedance2p0FastRequestState;

// -- Pricing constants --
//
// ArtCraft credits: 100 credits = $1.00. Credits always equal USD cents.
//
// The per-second USD price varies by resolution.

/// USD cents per second by resolution.
///
/// Kept as f64 because per-second rates are fractional; rounding happens
/// once at the end after multiplying by duration * batch.
const CENTS_PER_SECOND_480P: f64 = 6.40;
const CENTS_PER_SECOND_720P: f64 = 12.727;

/// USD cents per second, in hundredths of a cent, when one or more
/// reference videos are attached. Held as integer hundredths so the math is
/// exact; rounded up to whole cents once, after multiplying by
/// duration * batch.
const WITH_VIDEO_REFERENCE_CENTI_CENTS_PER_SECOND_480P: u64 = 841;
const WITH_VIDEO_REFERENCE_CENTI_CENTS_PER_SECOND_720P: u64 = 1_560;

pub struct ArtcraftSeedance2p0FastCostState {
  pub resolution: CommonResolution,
  pub duration_seconds: u16,
  pub batch_count: u16,
  pub has_video_reference: bool,
}

impl ArtcraftSeedance2p0FastCostState {
  pub fn from_request(request: &ArtcraftSeedance2p0FastRequestState) -> Self {
    let resolution = request.request.resolution
      .unwrap_or(CommonResolution::SevenTwentyP);
    let duration_seconds = request.request.duration_seconds.unwrap_or(5);
    let batch_count = request.request.video_batch_count.unwrap_or(1);
    let has_video_reference = request.request.reference_video_media_tokens
      .as_ref()
      .is_some_and(|tokens| !tokens.is_empty());

    Self { resolution, duration_seconds, batch_count, has_video_reference }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    if self.has_video_reference {
      let usd_cents = self.with_video_reference_usd_cents();
      return VideoGenerationCostEstimate {
        cost_in_credits: Some(usd_cents),
        cost_in_usd_cents: Some(usd_cents),
        is_free: false,
        is_unlimited: false,
        is_rate_limited: false,
        has_watermark: false,
        failures_are_refunded: None,
      };
    }

    let cents_per_second = match self.resolution {
      CommonResolution::FourEightyP => CENTS_PER_SECOND_480P,
      // Everything else (including 720p and unsupported resolutions) prices at 720p.
      _ => CENTS_PER_SECOND_720P,
    };

    let usd_cents = (self.duration_seconds as f64 * cents_per_second * self.batch_count as f64).round() as u64;

    // ArtCraft credits: 100 credits = $1.00, so credits = cents.
    VideoGenerationCostEstimate {
      cost_in_credits: Some(usd_cents),
      cost_in_usd_cents: Some(usd_cents),
      is_free: false,
      is_unlimited: false,
      is_rate_limited: false,
      has_watermark: false,
      failures_are_refunded: None,
    }
  }

  /// Price when one or more reference videos are attached.
  fn with_video_reference_usd_cents(&self) -> u64 {
    let centi_cents_per_second = match self.resolution {
      CommonResolution::FourEightyP => WITH_VIDEO_REFERENCE_CENTI_CENTS_PER_SECOND_480P,
      // Everything else (including 720p and unsupported resolutions) prices at 720p.
      _ => WITH_VIDEO_REFERENCE_CENTI_CENTS_PER_SECOND_720P,
    };

    let seconds = self.duration_seconds as u64 * self.batch_count as u64;

    // Round up to whole cents.
    (centi_cents_per_second * seconds).div_ceil(100)
  }
}

#[cfg(test)]
mod tests {
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::router_resolution::RouterResolution;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::router_provider::RouterProvider;
  use crate::api::video_list_ref::VideoListRef;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

  // -- 720p pricing --

  mod pricing_720p {
    use super::*;

    #[test]
    fn batch_1() {
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 4, 1), 51);
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 5, 1), 64);
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 10, 1), 127);
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 15, 1), 191);
    }

    #[test]
    fn batch_2() {
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 4, 2), 102);
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 5, 2), 127);
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 15, 2), 382);
    }

        #[test]
    fn batch_3() {
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 4, 3), 153);
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 5, 3), 191);
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 15, 3), 573);
    }

    #[test]
    fn batch_4() {
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 4, 4), 204);
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 5, 4), 255);
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 15, 4), 764);
    }

    #[test]
    fn none_defaults_to_720p() {
      assert_eq!(cost_cents(None, 5, 1), cost_cents(Some(RouterResolution::SevenTwentyP), 5, 1));
    }
  }

  // -- 480p pricing --

  mod pricing_480p {
    use super::*;

    #[test]
    fn batch_1() {
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 4, 1), 26);
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 5, 1), 32);
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 10, 1), 64);
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 15, 1), 96);
    }

    #[test]
    fn batch_2() {
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 5, 2), 64);
    }

        #[test]
    fn batch_3() {
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 5, 3), 96);
    }

    #[test]
    fn batch_4() {
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 5, 4), 128);
    }
  }

  // -- With-video-reference pricing --

  mod video_reference_pricing {
    use super::*;

    #[test]
    fn table_480p() {
      let expected = [34, 43, 51, 59, 68, 76, 85, 93, 101, 110, 118, 127];
      for (i, cents) in expected.iter().enumerate() {
        let duration = (i + 4) as u16;
        assert_eq!(
          cost_cents_with_video_ref(Some(RouterResolution::FourEightyP), duration, 1),
          *cents,
          "480p {duration}s",
        );
      }
    }

    #[test]
    fn table_720p() {
      let expected = [63, 78, 94, 110, 125, 141, 156, 172, 188, 203, 219, 234];
      for (i, cents) in expected.iter().enumerate() {
        let duration = (i + 4) as u16;
        assert_eq!(
          cost_cents_with_video_ref(Some(RouterResolution::SevenTwentyP), duration, 1),
          *cents,
          "720p {duration}s",
        );
      }
    }

    /// Batches price identically to the equivalent total seconds.
    #[test]
    fn batch_multiplies_total_seconds() {
      assert_eq!(
        cost_cents_with_video_ref(Some(RouterResolution::FourEightyP), 5, 2),
        cost_cents_with_video_ref(Some(RouterResolution::FourEightyP), 10, 1),
      );
      assert_eq!(
        cost_cents_with_video_ref(Some(RouterResolution::SevenTwentyP), 5, 2),
        cost_cents_with_video_ref(Some(RouterResolution::SevenTwentyP), 10, 1),
      );
    }

    /// Image and audio references do NOT trigger the with-reference pricing --
    /// only reference videos do. (The non-reference price is unchanged.)
    #[test]
    fn image_and_audio_references_price_as_no_reference() {
      use crate::api::audio_list_ref::AudioListRef;
      use crate::api::image_list_ref::ImageListRef;

      let builder = GenerateVideoRequestBuilder {
        model: RouterVideoModel::Seedance2p0Fast,
        provider: RouterProvider::Artcraft,
        resolution: Some(RouterResolution::SevenTwentyP),
        duration_seconds: Some(5),
        video_batch_count: Some(1),
        reference_images: Some(ImageListRef::MediaFileTokens(vec![
          MediaFileToken::new("mf_img".to_string()),
        ])),
        reference_audio: Some(AudioListRef::MediaFileTokens(vec![
          MediaFileToken::new("mf_audio".to_string()),
        ])),
        ..Default::default()
      };
      let cents = builder.build2()
        .expect("build2 should succeed")
        .estimate_cost()
        .expect("estimate_cost should succeed")
        .cost_in_usd_cents
        .unwrap();
      assert_eq!(cents, cost_cents(Some(RouterResolution::SevenTwentyP), 5, 1));
    }
  }

  // -- Relative pricing --

  mod relative_pricing_tests {
    use super::*;

    #[test]
    fn cost_480p_cheaper_than_720p() {
      let c480 = cost_cents(Some(RouterResolution::FourEightyP), 5, 1);
      let c720 = cost_cents(Some(RouterResolution::SevenTwentyP), 5, 1);
      assert!(c480 < c720, "480p ({}) should be cheaper than 720p ({})", c480, c720);
    }

    #[test]
    fn cost_scales_with_duration() {
      let c4 = cost_cents(Some(RouterResolution::SevenTwentyP), 4, 1);
      let c10 = cost_cents(Some(RouterResolution::SevenTwentyP), 10, 1);
      let c15 = cost_cents(Some(RouterResolution::SevenTwentyP), 15, 1);
      assert!(c4 < c10);
      assert!(c10 < c15);
    }

    #[test]
    fn cost_scales_with_batch() {
      let b1 = cost_cents(Some(RouterResolution::SevenTwentyP), 5, 1);
      let b2 = cost_cents(Some(RouterResolution::SevenTwentyP), 5, 2);
      let b4 = cost_cents(Some(RouterResolution::SevenTwentyP), 5, 4);
      assert!(b1 < b2);
      assert!(b2 < b4);
    }
  }

  // -- Credits equal cents --

  mod credits_tests {
    use super::*;

    #[test]
    fn credits_equal_usd_cents_all_combos() {
      let resolutions = [
        Some(RouterResolution::FourEightyP),
        Some(RouterResolution::SevenTwentyP),
        None,
      ];
      for res in resolutions {
        for dur in [4, 5, 10, 15] {
          for batch in [1, 2, 4] {
            let cost = build_cost(res, dur, batch);
            assert_eq!(
              cost.cost_in_credits, cost.cost_in_usd_cents,
              "credits should equal cents for res={:?} dur={}s batch={}",
              res, dur, batch,
            );
          }
        }
      }
    }
  }

  // -- Helpers --

  fn build_cost(
    resolution: Option<RouterResolution>,
    duration_seconds: u16,
    video_batch_count: u16,
  ) -> crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate {
    let builder = GenerateVideoRequestBuilder {
      model: RouterVideoModel::Seedance2p0Fast,
      provider: RouterProvider::Artcraft,
      resolution,
      duration_seconds: Some(duration_seconds),
      video_batch_count: Some(video_batch_count),
      ..Default::default()
    };
    builder.build2()
      .expect("build2 should succeed")
      .estimate_cost()
      .expect("estimate_cost should succeed")
  }

  fn cost_cents(
    resolution: Option<RouterResolution>,
    duration_seconds: u16,
    video_batch_count: u16,
  ) -> u64 {
    build_cost(resolution, duration_seconds, video_batch_count)
      .cost_in_usd_cents
      .unwrap()
  }

  /// Like [`cost_cents`], with one reference video attached.
  fn cost_cents_with_video_ref(
    resolution: Option<RouterResolution>,
    duration_seconds: u16,
    video_batch_count: u16,
  ) -> u64 {
    let builder = GenerateVideoRequestBuilder {
      model: RouterVideoModel::Seedance2p0Fast,
      provider: RouterProvider::Artcraft,
      resolution,
      duration_seconds: Some(duration_seconds),
      video_batch_count: Some(video_batch_count),
      reference_videos: Some(VideoListRef::MediaFileTokens(vec![
        MediaFileToken::new("mf_ref".to_string()),
      ])),
      ..Default::default()
    };
    builder.build2()
      .expect("build2 should succeed")
      .estimate_cost()
      .expect("estimate_cost should succeed")
      .cost_in_usd_cents
      .unwrap()
  }
}
