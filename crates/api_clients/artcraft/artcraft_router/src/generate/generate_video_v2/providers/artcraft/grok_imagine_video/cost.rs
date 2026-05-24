use enums::common::generation::common_resolution::CommonResolution;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::artcraft::grok_imagine_video::request::ArtcraftGrokImagineVideoRequestState;

// -- Pricing constants --
//
// Derived from xAI's published Grok Imagine Video rates (see
// grok_api_client::api::requests::videos::video_generation::cost) plus a 30%
// ArtCraft markup.
//
//   xAI base:   480p = $0.05/sec   720p = $0.07/sec
//   +30%:       480p = $0.065/sec  720p = $0.091/sec
//
// ArtCraft credits: 100 credits = $1.00. Credits always equal USD cents.
//
// We keep these as f64 because per-second rates are fractional; rounding
// happens once at the end after multiplying by duration * batch.

const MARKUP_MULTIPLIER: f64 = 1.30;

const XAI_CENTS_PER_SECOND_480P: f64 = 5.0;
const XAI_CENTS_PER_SECOND_720P: f64 = 7.0;

const CENTS_PER_SECOND_480P: f64 = XAI_CENTS_PER_SECOND_480P * MARKUP_MULTIPLIER; // 6.5
const CENTS_PER_SECOND_720P: f64 = XAI_CENTS_PER_SECOND_720P * MARKUP_MULTIPLIER; // 9.1

// xAI also bills $0.002 (=0.2¢) per source image; with markup that's 0.26¢
// per image. We keep this as a separate term so it doesn't get lost in
// rounding when the per-second cost is small.
const XAI_CENTS_PER_INPUT_IMAGE: f64 = 0.2;
const CENTS_PER_INPUT_IMAGE: f64 = XAI_CENTS_PER_INPUT_IMAGE * MARKUP_MULTIPLIER; // 0.26

pub struct ArtcraftGrokImagineVideoCostState {
  pub resolution: CommonResolution,
  pub duration_seconds: u16,
  pub batch_count: u16,
  pub input_image_count: u64,
}

impl ArtcraftGrokImagineVideoCostState {
  pub fn from_request(request: &ArtcraftGrokImagineVideoRequestState) -> Self {
    // Default duration matches the upstream Grok client (xAI's default is 8s
    // for video_generation; we use that here so cost estimates don't read 0
    // when duration is omitted).
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
    // Input images are billed once (not per output in the batch — xAI bills
    // input separately from rendered output).
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

  use crate::api::common_resolution::CommonResolution;
  use crate::api::common_video_model::CommonVideoModel;
  use crate::api::image_list_ref::ImageListRef;
  use crate::api::image_ref::ImageRef;
  use crate::api::provider::Provider;
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
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 5, 1), 46);
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 10, 1), 91);
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 15, 1), 137);
    }

    #[test]
    fn batch_2() {
      // 9.1 × 5 × 2 = 91 → 91
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 5, 2), 91);
      // 9.1 × 15 × 2 = 273 → 273
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 15, 2), 273);
    }

    #[test]
    fn batch_4() {
      // 9.1 × 5 × 4 = 182 → 182
      assert_eq!(cost_cents(Some(CommonResolution::SevenTwentyP), 5, 4), 182);
    }

    #[test]
    fn none_defaults_to_720p() {
      assert_eq!(
        cost_cents(None, 5, 1),
        cost_cents(Some(CommonResolution::SevenTwentyP), 5, 1),
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
      assert_eq!(cost_cents(Some(CommonResolution::FourEightyP), 5, 1), 33);
      assert_eq!(cost_cents(Some(CommonResolution::FourEightyP), 10, 1), 65);
      assert_eq!(cost_cents(Some(CommonResolution::FourEightyP), 15, 1), 98);
    }

    #[test]
    fn batch_2() {
      // 6.5 × 5 × 2 = 65 → 65
      assert_eq!(cost_cents(Some(CommonResolution::FourEightyP), 5, 2), 65);
    }

    #[test]
    fn batch_4() {
      // 6.5 × 5 × 4 = 130 → 130
      assert_eq!(cost_cents(Some(CommonResolution::FourEightyP), 5, 4), 130);
    }
  }

  // ── Input-image surcharge ──

  mod input_image_surcharge {
    use super::*;

    #[test]
    fn single_start_frame_adds_input_charge() {
      // 720p 5s batch 1 = 45.5 + 0.26 (one start_frame) = 45.76 → ceil 46
      // Identical to the no-image case (45.5 → 46) because of ceil rounding.
      let with_img = cost_cents_with_images(Some(CommonResolution::SevenTwentyP), 5, 1, true, 0);
      let no_img   = cost_cents_with_images(Some(CommonResolution::SevenTwentyP), 5, 1, false, 0);
      assert_eq!(with_img, 46);
      assert_eq!(no_img, 46);
    }

    #[test]
    fn many_reference_images_eventually_bump_a_cent() {
      // 480p 4s batch 1 = 6.5 × 4 = 26 + 0.26 × N
      // N=0 → 26
      // N=1 → 26.26 → 27
      // N=4 → 27.04 → 28
      assert_eq!(cost_cents_with_images(Some(CommonResolution::FourEightyP), 4, 1, false, 0), 26);
      assert_eq!(cost_cents_with_images(Some(CommonResolution::FourEightyP), 4, 1, false, 1), 27);
      assert_eq!(cost_cents_with_images(Some(CommonResolution::FourEightyP), 4, 1, false, 4), 28);
    }
  }

  // ── Relative pricing & markup verification ──

  mod relative_pricing {
    use super::*;

    #[test]
    fn cost_480p_cheaper_than_720p() {
      let c480 = cost_cents(Some(CommonResolution::FourEightyP), 10, 1);
      let c720 = cost_cents(Some(CommonResolution::SevenTwentyP), 10, 1);
      assert!(c480 < c720, "480p ({c480}) should be cheaper than 720p ({c720})");
    }

    #[test]
    fn cost_scales_with_duration() {
      let c5  = cost_cents(Some(CommonResolution::SevenTwentyP), 5, 1);
      let c10 = cost_cents(Some(CommonResolution::SevenTwentyP), 10, 1);
      let c15 = cost_cents(Some(CommonResolution::SevenTwentyP), 15, 1);
      assert!(c5 < c10);
      assert!(c10 < c15);
    }

    #[test]
    fn cost_scales_with_batch() {
      let b1 = cost_cents(Some(CommonResolution::SevenTwentyP), 5, 1);
      let b2 = cost_cents(Some(CommonResolution::SevenTwentyP), 5, 2);
      let b4 = cost_cents(Some(CommonResolution::SevenTwentyP), 5, 4);
      assert!(b1 < b2);
      assert!(b2 < b4);
    }

    #[test]
    fn cost_is_roughly_30_percent_above_grok_direct() {
      // ArtCraft cost ≈ 1.30 × Grok-direct cost for the same shape.
      // 10s @ 720p, batch 1, no input images:
      //   Grok direct: 70 mills/s × 10 = 700 mills = 70¢
      //   ArtCraft:    9.1 ¢/s × 10 = 91¢
      //   Ratio: 91/70 = 1.30 ✓
      let artcraft_720p_10s = cost_cents(Some(CommonResolution::SevenTwentyP), 10, 1);
      assert_eq!(artcraft_720p_10s, 91);

      // 5s @ 480p, batch 1:
      //   Grok direct: 50 mills/s × 5 = 250 mills = 25¢
      //   ArtCraft:    6.5 ¢/s × 5 = 32.5 → 33¢
      //   Ratio: 33/25 = 1.32 (rounding effect, ~30%) ✓
      let artcraft_480p_5s = cost_cents(Some(CommonResolution::FourEightyP), 5, 1);
      assert_eq!(artcraft_480p_5s, 33);
    }
  }

  // ── Credits equal cents ──

  mod credits_tests {
    use super::*;

    #[test]
    fn credits_equal_usd_cents_all_combos() {
      let resolutions = [
        Some(CommonResolution::FourEightyP),
        Some(CommonResolution::SevenTwentyP),
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
    resolution: Option<CommonResolution>,
    duration_seconds: u16,
    video_batch_count: u16,
  ) -> VideoGenerationCostEstimate {
    let builder = GenerateVideoRequestBuilder {
      model: CommonVideoModel::GrokImagineVideo,
      provider: Provider::Artcraft,
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
    resolution: Option<CommonResolution>,
    duration_seconds: u16,
    video_batch_count: u16,
  ) -> u64 {
    build_cost(resolution, duration_seconds, video_batch_count)
      .cost_in_usd_cents
      .unwrap()
  }

  fn cost_cents_with_images(
    resolution: Option<CommonResolution>,
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
      model: CommonVideoModel::GrokImagineVideo,
      provider: Provider::Artcraft,
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
