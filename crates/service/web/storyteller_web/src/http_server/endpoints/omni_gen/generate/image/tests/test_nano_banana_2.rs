//! Tests for omni-gen against the Nano Banana 2 model.
//!
//! Like Nano Banana, this model is multi-function: text-to-image and
//! image-to-image (edit). It additionally supports a `resolution` parameter
//! (0.5K / 1K / 2K / 4K) that affects pricing — 4K outputs cost roughly 2×
//! the 1K/2K rate, and 0.5K is the discount tier.
//!
//! Artcraft-tier pricing (the rate the user is billed) is scaled off the 1K
//! base cost of $0.08:
//!   0.5K → $0.06 / image (0.75×)
//!   1K   → $0.08 / image (1×, default)
//!   2K   → $0.12 / image (1.5×)
//!   4K   → $0.16 / image (2×)
//! Same rates apply to both text-to-image and image-edit modes.

#[cfg(test)]
mod tests {
  use std::collections::HashMap;

  use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_image_cost_and_generate_request::OmniGenImageCostAndGenerateRequest;
  use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
  use enums::common::generation::common_image_model::CommonImageModel;
  use enums::common::generation::common_resolution::CommonResolution;
  use tokens::tokens::media_files::MediaFileToken;
  use url::Url;

  use crate::http_server::endpoints::omni_gen::generate::image::distill_image_request::{
    distill_image_request, DistilledImageRequest,
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  /// Build a minimal Nano Banana 2 omni request.
  fn make_request(
    prompt: Option<&str>,
    aspect_ratio: Option<CommonAspectRatio>,
    resolution: Option<CommonResolution>,
    image_batch_count: Option<u16>,
    image_media_tokens: Option<Vec<MediaFileToken>>,
  ) -> OmniGenImageCostAndGenerateRequest {
    OmniGenImageCostAndGenerateRequest {
      idempotency_token: Some("11111111-1111-1111-1111-111111111111".to_string()),
      model: Some(CommonImageModel::NanoBanana2),
      prompt: prompt.map(|s| s.to_string()),
      image_media_tokens,
      resolution,
      aspect_ratio,
      quality: None,
      image_batch_count,
      adjust_horizontal_angle: None,
      adjust_vertical_angle: None,
      adjust_zoom: None,
    }
  }

  /// Make `n` fake media tokens paired with fake URLs.
  fn fake_image_refs(n: usize) -> (Vec<MediaFileToken>, HashMap<MediaFileToken, Url>) {
    let mut tokens = Vec::with_capacity(n);
    let mut map = HashMap::with_capacity(n);
    for i in 0..n {
      let token = MediaFileToken::new_from_str(&format!("mf_test{:028}", i));
      let url = Url::parse(&format!("https://fake.example.com/img{}.png", i)).unwrap();
      map.insert(token.clone(), url);
      tokens.push(token);
    }
    (tokens, map)
  }

  /// Distill a text-to-image request (no image refs, empty hydration map).
  fn distill_text(request: &OmniGenImageCostAndGenerateRequest) -> DistilledImageRequest {
    let empty: HashMap<MediaFileToken, Url> = HashMap::new();
    distill_image_request(request, Some(&empty))
      .expect("distill_image_request should succeed for Nano Banana 2 (text)")
  }

  /// Distill an edit request, providing the hydration map.
  fn distill_edit(
    request: &OmniGenImageCostAndGenerateRequest,
    hydration: &HashMap<MediaFileToken, Url>,
  ) -> DistilledImageRequest {
    distill_image_request(request, Some(hydration))
      .expect("distill_image_request should succeed for Nano Banana 2 (edit)")
  }

  // ────────────────────────────────────────────────────────────────────────────
  //   COST
  // ────────────────────────────────────────────────────────────────────────────
  //
  // Pricing comes from `estimate_image_cost_artcraft_nano_banana_2`:
  //   0.5K → 6¢/image, 1K → 8¢/image (default), 2K → 12¢/image, 4K → 16¢/image.
  //
  // Same rates apply to both text-to-image and edit modes.
  mod cost {
    use super::*;

    mod text {
      use super::*;

      fn cost_for(
        resolution: Option<CommonResolution>,
        image_batch_count: Option<u16>,
      ) -> (Option<u64>, Option<u64>) {
        let request = make_request(Some("a happy puppy"), None, resolution, image_batch_count, None);
        let distilled = distill_text(&request);
        (
          distilled.cost.cost_in_credits,
          distilled.cost.cost_in_usd_cents,
        )
      }

      // ── Default resolution (None → 1K → 8¢/image) ──────────────────────────

      #[test]
      fn default_resolution_default_batch_costs_8_cents() {
        let (credits, cents) = cost_for(None, None);
        assert_eq!(credits, Some(8));
        assert_eq!(cents, Some(8));
      }

      #[test]
      fn default_resolution_batch_of_one_costs_8_cents() {
        let (_c, cents) = cost_for(None, Some(1));
        assert_eq!(cents, Some(8));
      }

      #[test]
      fn default_resolution_batch_of_two_costs_16_cents() {
        let (_c, cents) = cost_for(None, Some(2));
        assert_eq!(cents, Some(16));
      }

      #[test]
      fn default_resolution_batch_of_three_costs_24_cents() {
        let (_c, cents) = cost_for(None, Some(3));
        assert_eq!(cents, Some(24));
      }

      #[test]
      fn default_resolution_batch_of_four_costs_32_cents() {
        let (_c, cents) = cost_for(None, Some(4));
        assert_eq!(cents, Some(32));
      }

      #[test]
      fn default_resolution_batch_above_max_clamps_to_32_cents() {
        let (_c, cents) = cost_for(None, Some(7));
        assert_eq!(cents, Some(32));
      }

      // ── 0.5K resolution (6¢/image, 0.75× base) ─────────────────────────────

      #[test]
      fn half_k_batch_of_one_costs_6_cents() {
        let (_c, cents) = cost_for(Some(CommonResolution::HalfK), Some(1));
        assert_eq!(cents, Some(6));
      }

      #[test]
      fn half_k_batch_of_two_costs_12_cents() {
        let (_c, cents) = cost_for(Some(CommonResolution::HalfK), Some(2));
        assert_eq!(cents, Some(12));
      }

      #[test]
      fn half_k_batch_of_three_costs_18_cents() {
        let (_c, cents) = cost_for(Some(CommonResolution::HalfK), Some(3));
        assert_eq!(cents, Some(18));
      }

      #[test]
      fn half_k_batch_of_four_costs_24_cents() {
        let (_c, cents) = cost_for(Some(CommonResolution::HalfK), Some(4));
        assert_eq!(cents, Some(24));
      }

      #[test]
      fn half_k_batch_above_max_clamps_to_24_cents() {
        let (_c, cents) = cost_for(Some(CommonResolution::HalfK), Some(9));
        assert_eq!(cents, Some(24));
      }

      // ── 1K resolution (8¢/image, base) ─────────────────────────────────────

      #[test]
      fn one_k_batch_of_one_costs_8_cents() {
        let (_c, cents) = cost_for(Some(CommonResolution::OneK), Some(1));
        assert_eq!(cents, Some(8));
      }

      #[test]
      fn one_k_batch_of_two_costs_16_cents() {
        let (_c, cents) = cost_for(Some(CommonResolution::OneK), Some(2));
        assert_eq!(cents, Some(16));
      }

      #[test]
      fn one_k_batch_of_three_costs_24_cents() {
        let (_c, cents) = cost_for(Some(CommonResolution::OneK), Some(3));
        assert_eq!(cents, Some(24));
      }

      #[test]
      fn one_k_batch_of_four_costs_32_cents() {
        let (_c, cents) = cost_for(Some(CommonResolution::OneK), Some(4));
        assert_eq!(cents, Some(32));
      }

      #[test]
      fn one_k_batch_above_max_clamps_to_32_cents() {
        let (_c, cents) = cost_for(Some(CommonResolution::OneK), Some(9));
        assert_eq!(cents, Some(32));
      }

      // ── 2K resolution (12¢/image, 1.5× base) ───────────────────────────────

      #[test]
      fn two_k_batch_of_one_costs_12_cents() {
        let (_c, cents) = cost_for(Some(CommonResolution::TwoK), Some(1));
        assert_eq!(cents, Some(12));
      }

      #[test]
      fn two_k_batch_of_two_costs_24_cents() {
        let (_c, cents) = cost_for(Some(CommonResolution::TwoK), Some(2));
        assert_eq!(cents, Some(24));
      }

      #[test]
      fn two_k_batch_of_three_costs_36_cents() {
        let (_c, cents) = cost_for(Some(CommonResolution::TwoK), Some(3));
        assert_eq!(cents, Some(36));
      }

      #[test]
      fn two_k_batch_of_four_costs_48_cents() {
        let (_c, cents) = cost_for(Some(CommonResolution::TwoK), Some(4));
        assert_eq!(cents, Some(48));
      }

      #[test]
      fn two_k_batch_above_max_clamps_to_48_cents() {
        let (_c, cents) = cost_for(Some(CommonResolution::TwoK), Some(9));
        assert_eq!(cents, Some(48));
      }

      // ── 4K resolution (16¢/image, 2× base) ─────────────────────────────────

      #[test]
      fn four_k_batch_of_one_costs_16_cents() {
        let (_c, cents) = cost_for(Some(CommonResolution::FourK), Some(1));
        assert_eq!(cents, Some(16));
      }

      #[test]
      fn four_k_batch_of_two_costs_32_cents() {
        let (_c, cents) = cost_for(Some(CommonResolution::FourK), Some(2));
        assert_eq!(cents, Some(32));
      }

      #[test]
      fn four_k_batch_of_three_costs_48_cents() {
        let (_c, cents) = cost_for(Some(CommonResolution::FourK), Some(3));
        assert_eq!(cents, Some(48));
      }

      #[test]
      fn four_k_batch_of_four_costs_64_cents() {
        let (_c, cents) = cost_for(Some(CommonResolution::FourK), Some(4));
        assert_eq!(cents, Some(64));
      }

      #[test]
      fn four_k_batch_above_max_clamps_to_64_cents() {
        let (_c, cents) = cost_for(Some(CommonResolution::FourK), Some(9));
        assert_eq!(cents, Some(64));
      }

      // ── 3K (unsupported) falls back to 2K pricing (= 12¢/image) ────────────

      #[test]
      fn three_k_one_image_falls_back_to_two_k_pricing() {
        let (_c, cents) = cost_for(Some(CommonResolution::ThreeK), Some(1));
        assert_eq!(cents, Some(12));
      }

      #[test]
      fn three_k_four_images_falls_back_to_two_k_pricing() {
        let (_c, cents) = cost_for(Some(CommonResolution::ThreeK), Some(4));
        assert_eq!(cents, Some(48));
      }

      // ── Misc independence checks ───────────────────────────────────────────

      #[test]
      fn cost_is_independent_of_aspect_ratio() {
        let aspect_ratios = [
          None,
          Some(CommonAspectRatio::Square),
          Some(CommonAspectRatio::SquareHd),
          Some(CommonAspectRatio::WideSixteenByNine),
          Some(CommonAspectRatio::TallNineBySixteen),
          Some(CommonAspectRatio::Auto),
        ];
        for ar in aspect_ratios {
          let request = make_request(Some("p"), ar, None, Some(2), None);
          let distilled = distill_text(&request);
          assert_eq!(
            distilled.cost.cost_in_usd_cents,
            Some(16),
            "expected 16¢ regardless of aspect ratio (got {:?})",
            ar,
          );
        }
      }

      #[test]
      fn cost_is_independent_of_prompt() {
        let with_prompt = distill_text(&make_request(Some("a cat"), None, None, Some(3), None));
        let without_prompt = distill_text(&make_request(None, None, None, Some(3), None));
        assert_eq!(with_prompt.cost.cost_in_usd_cents, Some(24));
        assert_eq!(without_prompt.cost.cost_in_usd_cents, Some(24));
      }

      #[test]
      fn cost_metadata_flags_are_default() {
        let request = make_request(Some("p"), None, None, Some(1), None);
        let distilled = distill_text(&request);
        assert!(!distilled.cost.is_free);
        assert!(!distilled.cost.is_unlimited);
        assert!(!distilled.cost.is_rate_limited);
        assert!(!distilled.cost.has_watermark);
      }
    }

    mod edit {
      use super::*;

      fn cost_for(
        resolution: Option<CommonResolution>,
        image_batch_count: Option<u16>,
        num_image_refs: usize,
      ) -> (Option<u64>, Option<u64>) {
        let (tokens, hydration) = fake_image_refs(num_image_refs);
        let request = make_request(
          Some("make it pop"),
          None,
          resolution,
          image_batch_count,
          Some(tokens),
        );
        let distilled = distill_edit(&request, &hydration);
        (
          distilled.cost.cost_in_credits,
          distilled.cost.cost_in_usd_cents,
        )
      }

      // ── Default resolution (None → 1K → 8¢/image) ──────────────────────────

      #[test]
      fn default_resolution_default_batch_costs_8_cents() {
        let (credits, cents) = cost_for(None, None, 1);
        assert_eq!(credits, Some(8));
        assert_eq!(cents, Some(8));
      }

      #[test]
      fn default_resolution_batch_of_one_costs_8_cents() {
        let (_c, cents) = cost_for(None, Some(1), 1);
        assert_eq!(cents, Some(8));
      }

      #[test]
      fn default_resolution_batch_of_two_costs_16_cents() {
        let (_c, cents) = cost_for(None, Some(2), 1);
        assert_eq!(cents, Some(16));
      }

      #[test]
      fn default_resolution_batch_of_three_costs_24_cents() {
        let (_c, cents) = cost_for(None, Some(3), 1);
        assert_eq!(cents, Some(24));
      }

      #[test]
      fn default_resolution_batch_of_four_costs_32_cents() {
        let (_c, cents) = cost_for(None, Some(4), 1);
        assert_eq!(cents, Some(32));
      }

      #[test]
      fn default_resolution_batch_above_max_clamps_to_32_cents() {
        let (_c, cents) = cost_for(None, Some(9), 1);
        assert_eq!(cents, Some(32));
      }

      // ── 0.5K (6¢/image) ────────────────────────────────────────────────────

      #[test]
      fn half_k_batch_of_one_costs_6_cents() {
        let (_c, cents) = cost_for(Some(CommonResolution::HalfK), Some(1), 1);
        assert_eq!(cents, Some(6));
      }

      #[test]
      fn half_k_batch_of_two_costs_12_cents() {
        let (_c, cents) = cost_for(Some(CommonResolution::HalfK), Some(2), 1);
        assert_eq!(cents, Some(12));
      }

      #[test]
      fn half_k_batch_of_three_costs_18_cents() {
        let (_c, cents) = cost_for(Some(CommonResolution::HalfK), Some(3), 1);
        assert_eq!(cents, Some(18));
      }

      #[test]
      fn half_k_batch_of_four_costs_24_cents() {
        let (_c, cents) = cost_for(Some(CommonResolution::HalfK), Some(4), 1);
        assert_eq!(cents, Some(24));
      }

      // ── 1K (8¢/image, base) ────────────────────────────────────────────────

      #[test]
      fn one_k_batch_of_one_costs_8_cents() {
        let (_c, cents) = cost_for(Some(CommonResolution::OneK), Some(1), 1);
        assert_eq!(cents, Some(8));
      }

      #[test]
      fn one_k_batch_of_two_costs_16_cents() {
        let (_c, cents) = cost_for(Some(CommonResolution::OneK), Some(2), 1);
        assert_eq!(cents, Some(16));
      }

      #[test]
      fn one_k_batch_of_four_costs_32_cents() {
        let (_c, cents) = cost_for(Some(CommonResolution::OneK), Some(4), 1);
        assert_eq!(cents, Some(32));
      }

      // ── 2K (12¢/image, 1.5× base) ──────────────────────────────────────────

      #[test]
      fn two_k_batch_of_one_costs_12_cents() {
        let (_c, cents) = cost_for(Some(CommonResolution::TwoK), Some(1), 1);
        assert_eq!(cents, Some(12));
      }

      #[test]
      fn two_k_batch_of_two_costs_24_cents() {
        let (_c, cents) = cost_for(Some(CommonResolution::TwoK), Some(2), 1);
        assert_eq!(cents, Some(24));
      }

      #[test]
      fn two_k_batch_of_three_costs_36_cents() {
        let (_c, cents) = cost_for(Some(CommonResolution::TwoK), Some(3), 1);
        assert_eq!(cents, Some(36));
      }

      #[test]
      fn two_k_batch_of_four_costs_48_cents() {
        let (_c, cents) = cost_for(Some(CommonResolution::TwoK), Some(4), 1);
        assert_eq!(cents, Some(48));
      }

      // ── 4K (16¢/image, 2× base) ────────────────────────────────────────────

      #[test]
      fn four_k_batch_of_one_costs_16_cents() {
        let (_c, cents) = cost_for(Some(CommonResolution::FourK), Some(1), 1);
        assert_eq!(cents, Some(16));
      }

      #[test]
      fn four_k_batch_of_two_costs_32_cents() {
        let (_c, cents) = cost_for(Some(CommonResolution::FourK), Some(2), 1);
        assert_eq!(cents, Some(32));
      }

      #[test]
      fn four_k_batch_of_three_costs_48_cents() {
        let (_c, cents) = cost_for(Some(CommonResolution::FourK), Some(3), 1);
        assert_eq!(cents, Some(48));
      }

      #[test]
      fn four_k_batch_of_four_costs_64_cents() {
        let (_c, cents) = cost_for(Some(CommonResolution::FourK), Some(4), 1);
        assert_eq!(cents, Some(64));
      }

      // ── 3K (unsupported) falls back to 2K pricing ──────────────────────────

      #[test]
      fn three_k_one_image_falls_back_to_two_k_pricing() {
        let (_c, cents) = cost_for(Some(CommonResolution::ThreeK), Some(1), 1);
        assert_eq!(cents, Some(12));
      }

      #[test]
      fn three_k_four_images_falls_back_to_two_k_pricing() {
        let (_c, cents) = cost_for(Some(CommonResolution::ThreeK), Some(4), 1);
        assert_eq!(cents, Some(48));
      }

      #[test]
      fn cost_is_independent_of_image_ref_count() {
        for num_refs in [1usize, 2, 3, 5] {
          let (_c, cents) = cost_for(None, Some(2), num_refs);
          assert_eq!(
            cents,
            Some(16),
            "expected 16¢ regardless of {} image refs",
            num_refs,
          );
        }
      }

      #[test]
      fn cost_is_independent_of_aspect_ratio() {
        let aspect_ratios = [
          None,
          Some(CommonAspectRatio::Square),
          Some(CommonAspectRatio::Auto),
          Some(CommonAspectRatio::WideSixteenByNine),
          Some(CommonAspectRatio::TallNineBySixteen),
        ];
        for ar in aspect_ratios {
          let (tokens, hydration) = fake_image_refs(2);
          let request = make_request(Some("p"), ar, None, Some(2), Some(tokens));
          let distilled = distill_edit(&request, &hydration);
          assert_eq!(
            distilled.cost.cost_in_usd_cents,
            Some(16),
            "expected 16¢ regardless of aspect ratio (got {:?})",
            ar,
          );
        }
      }

      #[test]
      fn cost_metadata_flags_are_default() {
        let (tokens, hydration) = fake_image_refs(1);
        let request = make_request(Some("p"), None, None, Some(1), Some(tokens));
        let distilled = distill_edit(&request, &hydration);
        assert!(!distilled.cost.is_free);
        assert!(!distilled.cost.is_unlimited);
        assert!(!distilled.cost.is_rate_limited);
        assert!(!distilled.cost.has_watermark);
      }

      #[test]
      fn edit_and_text_cost_match_at_each_resolution() {
        // Both modes are billed at the same per-resolution rate.
        let resolutions = [
          None,
          Some(CommonResolution::HalfK),
          Some(CommonResolution::OneK),
          Some(CommonResolution::TwoK),
          Some(CommonResolution::FourK),
        ];
        for res in resolutions {
          for batch in [1u16, 2, 3, 4] {
            let text = distill_text(&make_request(Some("p"), None, res, Some(batch), None));
            let (tokens, hydration) = fake_image_refs(1);
            let edit = distill_edit(
              &make_request(Some("p"), None, res, Some(batch), Some(tokens)),
              &hydration,
            );
            assert_eq!(
              text.cost.cost_in_usd_cents,
              edit.cost.cost_in_usd_cents,
              "text/edit cost diverged at res={:?} batch={}",
              res,
              batch,
            );
          }
        }
      }
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  //   PLAN
  // ────────────────────────────────────────────────────────────────────────────
  //
  // The distilled plan is `ImageGenerationPlan::FalNanaBanana2(PlanFalNanaBanana2)`.
  // It carries:
  //   - prompt: passthrough
  //   - image_urls: empty in text mode, populated in edit mode
  //   - t2i_aspect_ratio / edit_aspect_ratio: pre-resolved per mode
  //   - resolution: shared between modes
  //   - num_images: 1..=4 (clamped under PayMoreUpgrade)
  //
  // The handler picks t2i vs edit based on whether image_urls is empty.
  mod plan {
    use super::*;

    use artcraft_router::generate::generate_image::image_generation_plan::ImageGenerationPlan;
    use artcraft_router::generate::generate_image::plan::fal::plan_generate_image_fal_nano_banana_2::{
      FalNb2NumImages, FalNb2Resolution, PlanFalNanaBanana2,
    };
    use fal_client::requests::webhook::image::edit::enqueue_nano_banana_2_edit_image_webhook::EnqueueNanoBanana2EditImageAspectRatio;
    use fal_client::requests::webhook::image::text::enqueue_nano_banana_2_text_to_image_webhook::EnqueueNanoBanana2TextToImageAspectRatio;

    fn with_text_plan<F: FnOnce(&PlanFalNanaBanana2<'_>)>(
      request: &OmniGenImageCostAndGenerateRequest,
      assertion: F,
    ) {
      let distilled = distill_text(request);
      match distilled.plan() {
        ImageGenerationPlan::FalNanaBanana2(plan) => assertion(plan),
        other => panic!("expected ImageGenerationPlan::FalNanaBanana2, got {:?}", other),
      }
    }

    fn with_edit_plan<F: FnOnce(&PlanFalNanaBanana2<'_>)>(
      request: &OmniGenImageCostAndGenerateRequest,
      hydration: &HashMap<MediaFileToken, Url>,
      assertion: F,
    ) {
      let distilled = distill_edit(request, hydration);
      match distilled.plan() {
        ImageGenerationPlan::FalNanaBanana2(plan) => assertion(plan),
        other => panic!("expected ImageGenerationPlan::FalNanaBanana2, got {:?}", other),
      }
    }

    mod text {
      use super::*;

      fn assert_t2i_for_aspect_ratio<F: FnOnce(&PlanFalNanaBanana2<'_>)>(
        ar: Option<CommonAspectRatio>,
        assertion: F,
      ) {
        with_text_plan(&make_request(Some("p"), ar, None, Some(1), None), assertion);
      }

      fn assert_t2i_for_batch<F: FnOnce(&PlanFalNanaBanana2<'_>)>(
        batch: Option<u16>,
        assertion: F,
      ) {
        with_text_plan(&make_request(Some("p"), None, None, batch, None), assertion);
      }

      fn assert_t2i_for_resolution<F: FnOnce(&PlanFalNanaBanana2<'_>)>(
        res: Option<CommonResolution>,
        assertion: F,
      ) {
        with_text_plan(&make_request(Some("p"), None, res, Some(1), None), assertion);
      }

      // ── Mode detection ────────────────────────────────────────────────────

      #[test]
      fn text_mode_has_empty_image_urls() {
        with_text_plan(&make_request(Some("p"), None, None, Some(1), None), |plan| {
          assert!(plan.image_urls.is_empty(), "text mode must have no image_urls");
        });
      }

      // ── Aspect ratio direct mappings ──────────────────────────────────────

      #[test]
      fn default_aspect_ratio_is_none() {
        assert_t2i_for_aspect_ratio(None, |plan| {
          assert!(plan.t2i_aspect_ratio.is_none());
        });
      }

      #[test]
      fn square_yields_one_by_one() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::Square), |plan| {
          assert!(matches!(
            plan.t2i_aspect_ratio,
            Some(EnqueueNanoBanana2TextToImageAspectRatio::OneByOne)
          ));
        });
      }

      #[test]
      fn square_hd_yields_one_by_one() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::SquareHd), |plan| {
          assert!(matches!(
            plan.t2i_aspect_ratio,
            Some(EnqueueNanoBanana2TextToImageAspectRatio::OneByOne)
          ));
        });
      }

      #[test]
      fn wide_5x4_yields_five_by_four() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::WideFiveByFour), |plan| {
          assert!(matches!(
            plan.t2i_aspect_ratio,
            Some(EnqueueNanoBanana2TextToImageAspectRatio::FiveByFour)
          ));
        });
      }

      #[test]
      fn wide_4x3_yields_four_by_three() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::WideFourByThree), |plan| {
          assert!(matches!(
            plan.t2i_aspect_ratio,
            Some(EnqueueNanoBanana2TextToImageAspectRatio::FourByThree)
          ));
        });
      }

      #[test]
      fn wide_3x2_yields_three_by_two() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::WideThreeByTwo), |plan| {
          assert!(matches!(
            plan.t2i_aspect_ratio,
            Some(EnqueueNanoBanana2TextToImageAspectRatio::ThreeByTwo)
          ));
        });
      }

      #[test]
      fn wide_16x9_yields_sixteen_by_nine() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::WideSixteenByNine), |plan| {
          assert!(matches!(
            plan.t2i_aspect_ratio,
            Some(EnqueueNanoBanana2TextToImageAspectRatio::SixteenByNine)
          ));
        });
      }

      #[test]
      fn wide_alias_yields_sixteen_by_nine() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::Wide), |plan| {
          assert!(matches!(
            plan.t2i_aspect_ratio,
            Some(EnqueueNanoBanana2TextToImageAspectRatio::SixteenByNine)
          ));
        });
      }

      #[test]
      fn wide_21x9_yields_twenty_one_by_nine() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::WideTwentyOneByNine), |plan| {
          assert!(matches!(
            plan.t2i_aspect_ratio,
            Some(EnqueueNanoBanana2TextToImageAspectRatio::TwentyOneByNine)
          ));
        });
      }

      #[test]
      fn tall_4x5_yields_four_by_five() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::TallFourByFive), |plan| {
          assert!(matches!(
            plan.t2i_aspect_ratio,
            Some(EnqueueNanoBanana2TextToImageAspectRatio::FourByFive)
          ));
        });
      }

      #[test]
      fn tall_3x4_yields_three_by_four() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::TallThreeByFour), |plan| {
          assert!(matches!(
            plan.t2i_aspect_ratio,
            Some(EnqueueNanoBanana2TextToImageAspectRatio::ThreeByFour)
          ));
        });
      }

      #[test]
      fn tall_2x3_yields_two_by_three() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::TallTwoByThree), |plan| {
          assert!(matches!(
            plan.t2i_aspect_ratio,
            Some(EnqueueNanoBanana2TextToImageAspectRatio::TwoByThree)
          ));
        });
      }

      #[test]
      fn tall_9x16_yields_nine_by_sixteen() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::TallNineBySixteen), |plan| {
          assert!(matches!(
            plan.t2i_aspect_ratio,
            Some(EnqueueNanoBanana2TextToImageAspectRatio::NineBySixteen)
          ));
        });
      }

      #[test]
      fn tall_alias_yields_nine_by_sixteen() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::Tall), |plan| {
          assert!(matches!(
            plan.t2i_aspect_ratio,
            Some(EnqueueNanoBanana2TextToImageAspectRatio::NineBySixteen)
          ));
        });
      }

      // ── Auto* maps to Auto in t2i for NB2 (unlike NB1) ────────────────────

      #[test]
      fn auto_yields_auto() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::Auto), |plan| {
          assert!(matches!(
            plan.t2i_aspect_ratio,
            Some(EnqueueNanoBanana2TextToImageAspectRatio::Auto)
          ));
        });
      }

      #[test]
      fn auto_2k_yields_auto() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::Auto2k), |plan| {
          assert!(matches!(
            plan.t2i_aspect_ratio,
            Some(EnqueueNanoBanana2TextToImageAspectRatio::Auto)
          ));
        });
      }

      #[test]
      fn auto_4k_yields_auto() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::Auto4k), |plan| {
          assert!(matches!(
            plan.t2i_aspect_ratio,
            Some(EnqueueNanoBanana2TextToImageAspectRatio::Auto)
          ));
        });
      }

      // ── Resolution mapping ────────────────────────────────────────────────

      #[test]
      fn default_resolution_is_none() {
        assert_t2i_for_resolution(None, |plan| {
          assert!(plan.resolution.is_none());
        });
      }

      #[test]
      fn half_k_yields_half_k() {
        assert_t2i_for_resolution(Some(CommonResolution::HalfK), |plan| {
          assert!(matches!(plan.resolution, Some(FalNb2Resolution::HalfK)));
        });
      }

      #[test]
      fn one_k_yields_one_k() {
        assert_t2i_for_resolution(Some(CommonResolution::OneK), |plan| {
          assert!(matches!(plan.resolution, Some(FalNb2Resolution::OneK)));
        });
      }

      #[test]
      fn two_k_yields_two_k() {
        assert_t2i_for_resolution(Some(CommonResolution::TwoK), |plan| {
          assert!(matches!(plan.resolution, Some(FalNb2Resolution::TwoK)));
        });
      }

      #[test]
      fn four_k_yields_four_k() {
        assert_t2i_for_resolution(Some(CommonResolution::FourK), |plan| {
          assert!(matches!(plan.resolution, Some(FalNb2Resolution::FourK)));
        });
      }

      #[test]
      fn three_k_falls_back_to_two_k() {
        assert_t2i_for_resolution(Some(CommonResolution::ThreeK), |plan| {
          assert!(matches!(plan.resolution, Some(FalNb2Resolution::TwoK)));
        });
      }

      // ── Num images mapping ────────────────────────────────────────────────

      #[test]
      fn default_batch_count_is_one() {
        assert_t2i_for_batch(None, |plan| {
          assert!(matches!(plan.num_images, FalNb2NumImages::One));
        });
      }

      #[test]
      fn batch_of_one_yields_one() {
        assert_t2i_for_batch(Some(1), |plan| {
          assert!(matches!(plan.num_images, FalNb2NumImages::One));
        });
      }

      #[test]
      fn batch_of_two_yields_two() {
        assert_t2i_for_batch(Some(2), |plan| {
          assert!(matches!(plan.num_images, FalNb2NumImages::Two));
        });
      }

      #[test]
      fn batch_of_three_yields_three() {
        assert_t2i_for_batch(Some(3), |plan| {
          assert!(matches!(plan.num_images, FalNb2NumImages::Three));
        });
      }

      #[test]
      fn batch_of_four_yields_four() {
        assert_t2i_for_batch(Some(4), |plan| {
          assert!(matches!(plan.num_images, FalNb2NumImages::Four));
        });
      }

      #[test]
      fn batch_above_four_clamps_to_four() {
        assert_t2i_for_batch(Some(9), |plan| {
          assert!(matches!(plan.num_images, FalNb2NumImages::Four));
        });
      }

      // ── Prompt passthrough ────────────────────────────────────────────────

      #[test]
      fn prompt_is_passed_through() {
        with_text_plan(&make_request(Some("a corgi in a hat"), None, None, Some(1), None), |plan| {
          assert_eq!(plan.prompt, Some("a corgi in a hat"));
        });
      }

      #[test]
      fn missing_prompt_is_none() {
        with_text_plan(&make_request(None, None, None, Some(1), None), |plan| {
          assert_eq!(plan.prompt, None);
        });
      }
    }

    mod edit {
      use super::*;

      fn assert_edit_for_aspect_ratio<F: FnOnce(&PlanFalNanaBanana2<'_>)>(
        ar: Option<CommonAspectRatio>,
        assertion: F,
      ) {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), ar, None, Some(1), Some(tokens)),
          &hydration,
          assertion,
        );
      }

      fn assert_edit_for_batch<F: FnOnce(&PlanFalNanaBanana2<'_>)>(
        batch: Option<u16>,
        assertion: F,
      ) {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), None, None, batch, Some(tokens)),
          &hydration,
          assertion,
        );
      }

      fn assert_edit_for_resolution<F: FnOnce(&PlanFalNanaBanana2<'_>)>(
        res: Option<CommonResolution>,
        assertion: F,
      ) {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), None, res, Some(1), Some(tokens)),
          &hydration,
          assertion,
        );
      }

      // ── Mode detection / image-url passthrough ────────────────────────────

      #[test]
      fn edit_mode_populates_image_urls() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), None, None, Some(1), Some(tokens)),
          &hydration,
          |plan| {
            assert_eq!(plan.image_urls.len(), 1);
            assert!(plan.image_urls[0].starts_with("https://fake.example.com/"));
          },
        );
      }

      #[test]
      fn edit_mode_with_two_image_refs() {
        let (tokens, hydration) = fake_image_refs(2);
        with_edit_plan(
          &make_request(Some("p"), None, None, Some(1), Some(tokens)),
          &hydration,
          |plan| {
            assert_eq!(plan.image_urls.len(), 2);
          },
        );
      }

      #[test]
      fn edit_mode_with_five_image_refs() {
        let (tokens, hydration) = fake_image_refs(5);
        with_edit_plan(
          &make_request(Some("p"), None, None, Some(1), Some(tokens)),
          &hydration,
          |plan| {
            assert_eq!(plan.image_urls.len(), 5);
          },
        );
      }

      #[test]
      fn edit_image_urls_are_hydrated_from_map() {
        let (tokens, hydration) = fake_image_refs(3);
        let expected: Vec<String> = tokens
          .iter()
          .map(|t| hydration.get(t).unwrap().to_string())
          .collect();
        with_edit_plan(
          &make_request(Some("p"), None, None, Some(1), Some(tokens.clone())),
          &hydration,
          |plan| {
            assert_eq!(plan.image_urls, expected);
          },
        );
      }

      // ── Aspect ratio direct mappings ──────────────────────────────────────

      #[test]
      fn default_aspect_ratio_is_none() {
        assert_edit_for_aspect_ratio(None, |plan| {
          assert!(plan.edit_aspect_ratio.is_none());
        });
      }

      #[test]
      fn square_yields_one_by_one() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::Square), |plan| {
          assert!(matches!(
            plan.edit_aspect_ratio,
            Some(EnqueueNanoBanana2EditImageAspectRatio::OneByOne)
          ));
        });
      }

      #[test]
      fn square_hd_yields_one_by_one() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::SquareHd), |plan| {
          assert!(matches!(
            plan.edit_aspect_ratio,
            Some(EnqueueNanoBanana2EditImageAspectRatio::OneByOne)
          ));
        });
      }

      #[test]
      fn wide_5x4_yields_five_by_four() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::WideFiveByFour), |plan| {
          assert!(matches!(
            plan.edit_aspect_ratio,
            Some(EnqueueNanoBanana2EditImageAspectRatio::FiveByFour)
          ));
        });
      }

      #[test]
      fn wide_4x3_yields_four_by_three() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::WideFourByThree), |plan| {
          assert!(matches!(
            plan.edit_aspect_ratio,
            Some(EnqueueNanoBanana2EditImageAspectRatio::FourByThree)
          ));
        });
      }

      #[test]
      fn wide_3x2_yields_three_by_two() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::WideThreeByTwo), |plan| {
          assert!(matches!(
            plan.edit_aspect_ratio,
            Some(EnqueueNanoBanana2EditImageAspectRatio::ThreeByTwo)
          ));
        });
      }

      #[test]
      fn wide_16x9_yields_sixteen_by_nine() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::WideSixteenByNine), |plan| {
          assert!(matches!(
            plan.edit_aspect_ratio,
            Some(EnqueueNanoBanana2EditImageAspectRatio::SixteenByNine)
          ));
        });
      }

      #[test]
      fn wide_alias_yields_sixteen_by_nine() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::Wide), |plan| {
          assert!(matches!(
            plan.edit_aspect_ratio,
            Some(EnqueueNanoBanana2EditImageAspectRatio::SixteenByNine)
          ));
        });
      }

      #[test]
      fn wide_21x9_yields_twenty_one_by_nine() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::WideTwentyOneByNine), |plan| {
          assert!(matches!(
            plan.edit_aspect_ratio,
            Some(EnqueueNanoBanana2EditImageAspectRatio::TwentyOneByNine)
          ));
        });
      }

      #[test]
      fn tall_4x5_yields_four_by_five() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::TallFourByFive), |plan| {
          assert!(matches!(
            plan.edit_aspect_ratio,
            Some(EnqueueNanoBanana2EditImageAspectRatio::FourByFive)
          ));
        });
      }

      #[test]
      fn tall_3x4_yields_three_by_four() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::TallThreeByFour), |plan| {
          assert!(matches!(
            plan.edit_aspect_ratio,
            Some(EnqueueNanoBanana2EditImageAspectRatio::ThreeByFour)
          ));
        });
      }

      #[test]
      fn tall_2x3_yields_two_by_three() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::TallTwoByThree), |plan| {
          assert!(matches!(
            plan.edit_aspect_ratio,
            Some(EnqueueNanoBanana2EditImageAspectRatio::TwoByThree)
          ));
        });
      }

      #[test]
      fn tall_9x16_yields_nine_by_sixteen() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::TallNineBySixteen), |plan| {
          assert!(matches!(
            plan.edit_aspect_ratio,
            Some(EnqueueNanoBanana2EditImageAspectRatio::NineBySixteen)
          ));
        });
      }

      #[test]
      fn tall_alias_yields_nine_by_sixteen() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::Tall), |plan| {
          assert!(matches!(
            plan.edit_aspect_ratio,
            Some(EnqueueNanoBanana2EditImageAspectRatio::NineBySixteen)
          ));
        });
      }

      // ── Auto* maps to Auto in edit mode ───────────────────────────────────

      #[test]
      fn auto_yields_auto() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::Auto), |plan| {
          assert!(matches!(
            plan.edit_aspect_ratio,
            Some(EnqueueNanoBanana2EditImageAspectRatio::Auto)
          ));
        });
      }

      #[test]
      fn auto_2k_yields_auto() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::Auto2k), |plan| {
          assert!(matches!(
            plan.edit_aspect_ratio,
            Some(EnqueueNanoBanana2EditImageAspectRatio::Auto)
          ));
        });
      }

      #[test]
      fn auto_4k_yields_auto() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::Auto4k), |plan| {
          assert!(matches!(
            plan.edit_aspect_ratio,
            Some(EnqueueNanoBanana2EditImageAspectRatio::Auto)
          ));
        });
      }

      // ── Resolution mapping ────────────────────────────────────────────────

      #[test]
      fn default_resolution_is_none() {
        assert_edit_for_resolution(None, |plan| {
          assert!(plan.resolution.is_none());
        });
      }

      #[test]
      fn half_k_yields_half_k() {
        assert_edit_for_resolution(Some(CommonResolution::HalfK), |plan| {
          assert!(matches!(plan.resolution, Some(FalNb2Resolution::HalfK)));
        });
      }

      #[test]
      fn one_k_yields_one_k() {
        assert_edit_for_resolution(Some(CommonResolution::OneK), |plan| {
          assert!(matches!(plan.resolution, Some(FalNb2Resolution::OneK)));
        });
      }

      #[test]
      fn two_k_yields_two_k() {
        assert_edit_for_resolution(Some(CommonResolution::TwoK), |plan| {
          assert!(matches!(plan.resolution, Some(FalNb2Resolution::TwoK)));
        });
      }

      #[test]
      fn four_k_yields_four_k() {
        assert_edit_for_resolution(Some(CommonResolution::FourK), |plan| {
          assert!(matches!(plan.resolution, Some(FalNb2Resolution::FourK)));
        });
      }

      #[test]
      fn three_k_falls_back_to_two_k() {
        assert_edit_for_resolution(Some(CommonResolution::ThreeK), |plan| {
          assert!(matches!(plan.resolution, Some(FalNb2Resolution::TwoK)));
        });
      }

      // ── Num images mapping ────────────────────────────────────────────────

      #[test]
      fn default_batch_count_is_one() {
        assert_edit_for_batch(None, |plan| {
          assert!(matches!(plan.num_images, FalNb2NumImages::One));
        });
      }

      #[test]
      fn batch_of_one_yields_one() {
        assert_edit_for_batch(Some(1), |plan| {
          assert!(matches!(plan.num_images, FalNb2NumImages::One));
        });
      }

      #[test]
      fn batch_of_two_yields_two() {
        assert_edit_for_batch(Some(2), |plan| {
          assert!(matches!(plan.num_images, FalNb2NumImages::Two));
        });
      }

      #[test]
      fn batch_of_three_yields_three() {
        assert_edit_for_batch(Some(3), |plan| {
          assert!(matches!(plan.num_images, FalNb2NumImages::Three));
        });
      }

      #[test]
      fn batch_of_four_yields_four() {
        assert_edit_for_batch(Some(4), |plan| {
          assert!(matches!(plan.num_images, FalNb2NumImages::Four));
        });
      }

      #[test]
      fn batch_above_four_clamps_to_four() {
        assert_edit_for_batch(Some(9), |plan| {
          assert!(matches!(plan.num_images, FalNb2NumImages::Four));
        });
      }

      // ── Prompt passthrough ────────────────────────────────────────────────

      #[test]
      fn prompt_is_passed_through() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("make it shiny"), None, None, Some(1), Some(tokens)),
          &hydration,
          |plan| {
            assert_eq!(plan.prompt, Some("make it shiny"));
          },
        );
      }

      #[test]
      fn missing_prompt_is_none() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(None, None, None, Some(1), Some(tokens)),
          &hydration,
          |plan| {
            assert_eq!(plan.prompt, None);
          },
        );
      }
    }
  }
}
