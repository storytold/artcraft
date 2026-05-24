use enums::common::generation::common_resolution::CommonResolution;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::artcraft::grok_imagine_video::request::ArtcraftGrokImagineVideoRequestState;

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

  // ── Relative pricing ──

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

  // ── Cross-provider margin: ArtCraft is consistently ~30% above GrokApi ──

  mod small_margin {
    use super::*;
    use crate::api::common_aspect_ratio::CommonAspectRatio;

    #[test]
    fn small_margin() {
      let resolutions = [
        None,
        Some(CommonResolution::FourEightyP),
        Some(CommonResolution::SevenTwentyP),
        Some(CommonResolution::TenEightyP), // clamps to 720p on both sides
      ];
      let durations: &[u16] = &[1, 4, 5, 8, 10, 12, 15];
      let aspect_ratios = [
        None,
        Some(CommonAspectRatio::Auto),
        Some(CommonAspectRatio::Square),
        Some(CommonAspectRatio::WideSixteenByNine),
        Some(CommonAspectRatio::TallNineBySixteen),
        Some(CommonAspectRatio::WideFourByThree),
        Some(CommonAspectRatio::TallThreeByFour),
        Some(CommonAspectRatio::WideThreeByTwo),
        Some(CommonAspectRatio::TallTwoByThree),
      ];
      // (has_start_frame, num_reference_images). At most one of the two is
      // non-default — start_frame and reference_images are mutually exclusive
      // on the GrokApi wire (image-to-video vs reference-to-video), so we
      // don't mix them here to keep the comparison apples-to-apples.
      let image_combos: &[(bool, usize)] = &[
        (false, 0),  // text-to-video
        (true,  0),  // image-to-video, 1 source image
        (false, 1),  // reference-to-video, 1 ref image
        (false, 2),
        (false, 3),
      ];

      let mut total_cases = 0;
      let mut failures = Vec::new();

      for &res in &resolutions {
        for &dur in durations {
          for &ar in &aspect_ratios {
            for &(has_start, num_refs) in image_combos {
              total_cases += 1;
              let artcraft = artcraft_cents(res, dur, ar, has_start, num_refs);
              let grokapi  = grokapi_cents(res, dur, ar, has_start, num_refs);

              // Margin requirement: artcraft / max(grokapi - 1, 1) >= 1.29.
              // The (-1, 1) floor accounts for one cent of GrokApi-side
              // ceiling-rounding noise (see test doc comment above).
              let grokapi_compare = grokapi.saturating_sub(1).max(1);
              let lhs = artcraft.saturating_mul(100);
              let rhs = grokapi_compare.saturating_mul(129);

              if lhs < rhs {
                let pct = if grokapi == 0 { 0.0 }
                  else { (artcraft as f64 / grokapi as f64 - 1.0) * 100.0 };
                failures.push(format!(
                  "res={:?} dur={}s ar={:?} start={} refs={} → \
                   artcraft={}¢ vs grokapi={}¢ (margin {:.1}%, want ≥ 29% after 1¢ tolerance)",
                  res, dur, ar, has_start, num_refs, artcraft, grokapi, pct,
                ));
              }

              // Defense in depth: ArtCraft must always cost at least as
              // much as GrokApi, regardless of rounding noise.
              assert!(
                artcraft >= grokapi,
                "ArtCraft ({artcraft}¢) cheaper than GrokApi ({grokapi}¢) for \
                 res={res:?} dur={dur}s ar={ar:?} start={has_start} refs={num_refs}",
              );
            }
          }
        }
      }

      if !failures.is_empty() {
        let summary = failures.iter().take(10).cloned().collect::<Vec<_>>().join("\n  ");
        panic!(
          "{} / {} (res × duration × aspect × image_combo) tuples failed \
           the ≥29% (with 1¢ tolerance) margin check.\nFirst 10:\n  {}",
          failures.len(), total_cases, summary,
        );
      }
    }

    // ── Cross-provider helpers ──

    fn artcraft_cents(
      resolution: Option<CommonResolution>,
      duration_seconds: u16,
      aspect_ratio: Option<CommonAspectRatio>,
      has_start_frame: bool,
      num_reference_images: usize,
    ) -> u64 {
      let start_frame = if has_start_frame {
        // ArtCraft's omni endpoint takes MediaFileTokens for image refs.
        Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_start".to_string())))
      } else { None };
      let reference_images = if num_reference_images > 0 {
        Some(ImageListRef::MediaFileTokens(
          (0..num_reference_images)
            .map(|i| MediaFileToken::new(format!("mf_ref_{i}")))
            .collect(),
        ))
      } else { None };

      let builder = GenerateVideoRequestBuilder {
        model: CommonVideoModel::GrokImagineVideo,
        provider: Provider::Artcraft,
        resolution,
        aspect_ratio,
        duration_seconds: Some(duration_seconds),
        // Batch is fixed at 1 because GrokApi's per-request cost calculator
        // doesn't multiply by batch (Grok returns one video per call); the
        // markup test would compare apples to oranges otherwise.
        video_batch_count: Some(1),
        start_frame,
        reference_images,
        ..Default::default()
      };
      builder.build2()
        .expect("build2 (artcraft) should succeed")
        .estimate_cost()
        .expect("estimate_cost (artcraft) should succeed")
        .cost_in_usd_cents
        .unwrap()
    }

    fn grokapi_cents(
      resolution: Option<CommonResolution>,
      duration_seconds: u16,
      aspect_ratio: Option<CommonAspectRatio>,
      has_start_frame: bool,
      num_reference_images: usize,
    ) -> u64 {
      let start_frame = if has_start_frame {
        // GrokApi (direct xAI) takes URLs for image refs.
        Some(ImageRef::Url("https://example.com/start.png".to_string()))
      } else { None };
      let reference_images = if num_reference_images > 0 {
        Some(ImageListRef::Urls(
          (0..num_reference_images)
            .map(|i| format!("https://example.com/ref_{i}.png"))
            .collect(),
        ))
      } else { None };

      let builder = GenerateVideoRequestBuilder {
        model: CommonVideoModel::GrokImagineVideo,
        provider: Provider::GrokApi,
        resolution,
        aspect_ratio,
        duration_seconds: Some(duration_seconds),
        video_batch_count: Some(1),
        start_frame,
        reference_images,
        ..Default::default()
      };
      builder.build2()
        .expect("build2 (grokapi) should succeed")
        .estimate_cost()
        .expect("estimate_cost (grokapi) should succeed")
        .cost_in_usd_cents
        .unwrap()
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
