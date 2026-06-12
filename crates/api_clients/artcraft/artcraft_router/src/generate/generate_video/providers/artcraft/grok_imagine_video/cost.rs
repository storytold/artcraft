use enums::common::generation::common_resolution::CommonResolution;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::artcraft::grok_imagine_video::request::ArtcraftGrokImagineVideoRequestState;

// -- Pricing constants --
//
// ArtCraft credits: 100 credits = $1.00. Credits always equal USD cents.
//
// We keep these as f64 because per-second rates are fractional; rounding
// happens once at the end after multiplying by duration * batch.

const CENTS_PER_SECOND_480P: f64 = 6.5;
const CENTS_PER_SECOND_720P: f64 = 9.1;

// Per-source-image surcharge. Kept as a separate term so it doesn't get
// lost in rounding when the per-second video cost is small.
const CENTS_PER_INPUT_IMAGE: f64 = 0.26;

pub struct ArtcraftGrokImagineVideoCostState {
  pub resolution: CommonResolution,
  pub duration_seconds: u16,
  pub batch_count: u16,
  pub input_image_count: u64,
}

impl ArtcraftGrokImagineVideoCostState {
  pub fn from_request(request: &ArtcraftGrokImagineVideoRequestState) -> Self {
    // Default duration is 8s when omitted, matching the upstream model's
    // default — keeps cost estimates from reading 0 for under-specified
    // requests.
    let resolution = request.request.resolution.unwrap_or(CommonResolution::SevenTwentyP);
    let duration_seconds = request.request.duration_seconds.unwrap_or(8);
    let batch_count = request.request.video_batch_count.unwrap_or(1);

    // Mirror grok_api_client's input-image counting: start_frame + reference_images.
    let input_image_count = (request.request.start_frame_image_media_token.is_some() as u64)
      + (request.request.reference_image_media_tokens
        .as_ref()
        .map(|v| v.len() as u64)
        .unwrap_or(0));

    Self { resolution, duration_seconds, batch_count, input_image_count }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    let cents_per_second = match self.resolution {
      CommonResolution::FourEightyP => CENTS_PER_SECOND_480P,
      // Grok Imagine Video caps output at 720p; price anything else as 720p.
      _ => CENTS_PER_SECOND_720P,
    };

    let video_cents = self.duration_seconds as f64 * cents_per_second * self.batch_count as f64;
    // Input images are billed once, not per output in the batch.
    let input_cents = self.input_image_count as f64 * CENTS_PER_INPUT_IMAGE;

    let usd_cents = (video_cents + input_cents).ceil() as u64;

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
}

#[cfg(test)]
mod tests {
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::router_resolution::RouterResolution;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::image_list_ref::ImageListRef;
  use crate::api::image_ref::ImageRef;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

  // ── 720p pricing (9.1 ¢/s base × batch, ceil) ──

  mod pricing_720p {
    use super::*;

    #[test]
    fn batch_1() {
      // 9.1 × 5  =  45.5  → 46
      // 9.1 × 10 =  91.0  → 91
      // 9.1 × 15 = 136.5  → 137
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 5, 1), 46);
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 10, 1), 91);
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 15, 1), 137);
    }

    #[test]
    fn batch_2() {
      // 9.1 × 5 × 2 = 91 → 91
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 5, 2), 91);
      // 9.1 × 15 × 2 = 273 → 273
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 15, 2), 273);
    }

    #[test]
    fn batch_4() {
      // 9.1 × 5 × 4 = 182 → 182
      assert_eq!(cost_cents(Some(RouterResolution::SevenTwentyP), 5, 4), 182);
    }

    #[test]
    fn none_defaults_to_720p() {
      assert_eq!(
        cost_cents(None, 5, 1),
        cost_cents(Some(RouterResolution::SevenTwentyP), 5, 1),
      );
    }
  }

  // ── 480p pricing (6.5 ¢/s base × batch, ceil) ──

  mod pricing_480p {
    use super::*;

    #[test]
    fn batch_1() {
      // 6.5 × 5  =  32.5 → 33
      // 6.5 × 10 =  65.0 → 65
      // 6.5 × 15 =  97.5 → 98
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 5, 1), 33);
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 10, 1), 65);
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 15, 1), 98);
    }

    #[test]
    fn batch_2() {
      // 6.5 × 5 × 2 = 65 → 65
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 5, 2), 65);
    }

    #[test]
    fn batch_4() {
      // 6.5 × 5 × 4 = 130 → 130
      assert_eq!(cost_cents(Some(RouterResolution::FourEightyP), 5, 4), 130);
    }
  }

  // ── Input-image surcharge ──

  mod input_image_surcharge {
    use super::*;

    #[test]
    fn single_start_frame_adds_input_charge() {
      // 720p 5s batch 1 = 45.5 + 0.26 (one start_frame) = 45.76 → ceil 46
      // Identical to the no-image case (45.5 → 46) because of ceil rounding.
      let with_img = cost_cents_with_images(Some(RouterResolution::SevenTwentyP), 5, 1, true, 0);
      let no_img   = cost_cents_with_images(Some(RouterResolution::SevenTwentyP), 5, 1, false, 0);
      assert_eq!(with_img, 46);
      assert_eq!(no_img, 46);
    }

    #[test]
    fn many_reference_images_eventually_bump_a_cent() {
      // 480p 4s batch 1 = 6.5 × 4 = 26 + 0.26 × N
      // N=0 → 26
      // N=1 → 26.26 → 27
      // N=4 → 27.04 → 28
      assert_eq!(cost_cents_with_images(Some(RouterResolution::FourEightyP), 4, 1, false, 0), 26);
      assert_eq!(cost_cents_with_images(Some(RouterResolution::FourEightyP), 4, 1, false, 1), 27);
      assert_eq!(cost_cents_with_images(Some(RouterResolution::FourEightyP), 4, 1, false, 4), 28);
    }
  }

  // ── Relative pricing ──

  mod relative_pricing {
    use super::*;

    #[test]
    fn cost_480p_cheaper_than_720p() {
      let c480 = cost_cents(Some(RouterResolution::FourEightyP), 10, 1);
      let c720 = cost_cents(Some(RouterResolution::SevenTwentyP), 10, 1);
      assert!(c480 < c720, "480p ({c480}) should be cheaper than 720p ({c720})");
    }

    #[test]
    fn cost_scales_with_duration() {
      let c5  = cost_cents(Some(RouterResolution::SevenTwentyP), 5, 1);
      let c10 = cost_cents(Some(RouterResolution::SevenTwentyP), 10, 1);
      let c15 = cost_cents(Some(RouterResolution::SevenTwentyP), 15, 1);
      assert!(c5 < c10);
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

  // ── Credits equal cents ──

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

  // ── Helpers ──

  fn build_cost(
    resolution: Option<RouterResolution>,
    duration_seconds: u16,
    video_batch_count: u16,
  ) -> VideoGenerationCostEstimate {
    let builder = GenerateVideoRequestBuilder {
      model: RouterVideoModel::GrokImagineVideo,
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

  fn cost_cents_with_images(
    resolution: Option<RouterResolution>,
    duration_seconds: u16,
    video_batch_count: u16,
    has_start_frame: bool,
    extra_reference_images: usize,
  ) -> u64 {
    let start_frame = if has_start_frame {
      Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_start".to_string())))
    } else { None };
    let reference_images = if extra_reference_images > 0 {
      Some(ImageListRef::MediaFileTokens(
        (0..extra_reference_images)
          .map(|i| MediaFileToken::new(format!("mf_ref_{i}")))
          .collect(),
      ))
    } else { None };

    let builder = GenerateVideoRequestBuilder {
      model: RouterVideoModel::GrokImagineVideo,
      provider: RouterProvider::Artcraft,
      resolution,
      duration_seconds: Some(duration_seconds),
      video_batch_count: Some(video_batch_count),
      start_frame,
      reference_images,
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
