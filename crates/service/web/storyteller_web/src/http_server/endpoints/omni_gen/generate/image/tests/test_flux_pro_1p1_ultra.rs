//! Tests for omni-gen against the Flux Pro 1.1 Ultra model.
//!
//! These exercise [`distill_image_request`] end-to-end without firing any
//! provider calls — both the cost estimate (Artcraft provider, what we bill
//! on) and the execution plan (Fal provider, what we'd send to fal.ai) are
//! computed synchronously from the request.
//!
//! Flux Pro 1.1 Ultra is text-to-image only, so no image refs are exercised.

#[cfg(test)]
mod tests {
  use std::collections::HashMap;

  use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_image_cost_and_generate_request::OmniGenImageCostAndGenerateRequest;
  use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
  use enums::common::generation::common_image_model::CommonImageModel;
  use tokens::tokens::media_files::MediaFileToken;
  use url::Url;

  use crate::http_server::endpoints::omni_gen::generate::image::distill_image_request::{
    distill_image_request, DistilledImageRequest,
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  /// Build a minimal Flux Pro 1.1 Ultra omni request with only the fields we
  /// care about in tests filled in.
  fn make_request(
    prompt: Option<&str>,
    aspect_ratio: Option<CommonAspectRatio>,
    image_batch_count: Option<u16>,
  ) -> OmniGenImageCostAndGenerateRequest {
    OmniGenImageCostAndGenerateRequest {
      idempotency_token: Some("11111111-1111-1111-1111-111111111111".to_string()),
      model: Some(CommonImageModel::FluxPro11Ultra),
      prompt: prompt.map(|s| s.to_string()),
      image_media_tokens: None,
      resolution: None,
      aspect_ratio,
      quality: None,
      image_batch_count,
      adjust_horizontal_angle: None,
      adjust_vertical_angle: None,
      adjust_zoom: None,
    }
  }

  /// Distill a request and panic with a descriptive message on failure.
  /// Flux Pro 1.1 Ultra never uses image refs, so we always pass an empty
  /// hydration map.
  fn distill(request: &OmniGenImageCostAndGenerateRequest) -> DistilledImageRequest {
    let empty: HashMap<MediaFileToken, Url> = HashMap::new();
    distill_image_request(request, Some(&empty))
      .expect("distill_image_request should succeed for Flux Pro 1.1 Ultra")
  }

  // ────────────────────────────────────────────────────────────────────────────
  //   COST
  // ────────────────────────────────────────────────────────────────────────────
  //
  // Pricing comes from `estimate_image_cost_artcraft_flux_pro_1p1_ultra`:
  //   $0.06 / image (6 credits per image; 1 credit == 1 USD cent)
  //
  // This matches what the legacy
  // `generate_flux_pro_11_ultra_text_to_image_handler` charges via
  // `FluxPro11UltraArgs::calculate_cost_in_cents` (Fal docs:
  // "$0.06 per image", flat).
  mod cost {
    use super::*;

    fn cost_for_batch(image_batch_count: Option<u16>) -> (Option<u64>, Option<u64>) {
      let request = make_request(Some("a happy puppy"), None, image_batch_count);
      let distilled = distill(&request);
      (
        distilled.cost.cost_in_credits,
        distilled.cost.cost_in_usd_cents,
      )
    }

    #[test]
    fn default_batch_costs_6_cents() {
      // No batch specified → defaults to 1 image → 6¢
      let (credits, cents) = cost_for_batch(None);
      assert_eq!(credits, Some(6));
      assert_eq!(cents, Some(6));
    }

    #[test]
    fn batch_of_one_costs_6_cents() {
      let (credits, cents) = cost_for_batch(Some(1));
      assert_eq!(credits, Some(6));
      assert_eq!(cents, Some(6));
    }

    #[test]
    fn batch_of_two_costs_12_cents() {
      let (credits, cents) = cost_for_batch(Some(2));
      assert_eq!(credits, Some(12));
      assert_eq!(cents, Some(12));
    }

    #[test]
    fn batch_of_three_costs_18_cents() {
      let (credits, cents) = cost_for_batch(Some(3));
      assert_eq!(credits, Some(18));
      assert_eq!(cents, Some(18));
    }

    #[test]
    fn batch_of_four_costs_24_cents() {
      let (credits, cents) = cost_for_batch(Some(4));
      assert_eq!(credits, Some(24));
      assert_eq!(cents, Some(24));
    }

    #[test]
    fn batch_above_max_clamps_and_costs_24_cents() {
      // PayMoreUpgrade strategy clamps batches >4 down to the max of 4.
      let (credits, cents) = cost_for_batch(Some(7));
      assert_eq!(credits, Some(24));
      assert_eq!(cents, Some(24));
    }

    #[test]
    fn cost_is_independent_of_aspect_ratio() {
      let aspect_ratios = [
        None,
        Some(CommonAspectRatio::Square),
        Some(CommonAspectRatio::SquareHd),
        Some(CommonAspectRatio::WideSixteenByNine),
        Some(CommonAspectRatio::WideTwentyOneByNine),
        Some(CommonAspectRatio::TallNineBySixteen),
        Some(CommonAspectRatio::TallNineByTwentyOne),
        Some(CommonAspectRatio::Auto),
      ];
      for ar in aspect_ratios {
        let request = make_request(Some("p"), ar, Some(2));
        let distilled = distill(&request);
        assert_eq!(
          distilled.cost.cost_in_usd_cents,
          Some(12),
          "expected 12¢ regardless of aspect ratio (got {:?})",
          ar,
        );
      }
    }

    #[test]
    fn cost_is_independent_of_prompt() {
      let with_prompt = distill(&make_request(Some("a cat"), None, Some(3)));
      let without_prompt = distill(&make_request(None, None, Some(3)));
      assert_eq!(with_prompt.cost.cost_in_usd_cents, Some(18));
      assert_eq!(without_prompt.cost.cost_in_usd_cents, Some(18));
    }

    #[test]
    fn cost_metadata_flags_are_default() {
      let request = make_request(Some("p"), None, Some(1));
      let distilled = distill(&request);
      assert!(!distilled.cost.is_free);
      assert!(!distilled.cost.is_unlimited);
      assert!(!distilled.cost.is_rate_limited);
      assert!(!distilled.cost.has_watermark);
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  //   PLAN
  // ────────────────────────────────────────────────────────────────────────────
  //
  // The distilled plan is the Fal-side `PlanFalFluxPro11Ultra`:
  //   - prompt: passthrough
  //   - aspect_ratio: mapped from CommonAspectRatio (Ultra has more native
  //     ratios than 1.1, including 21:9, 3:2, 9:21, 2:3)
  //   - num_images: mapped from image_batch_count (default 1, clamped to 1..=4)
  //
  // (Flux Pro 1.1 Ultra has no image_url field — text-to-image only.)
  mod plan {
    use super::*;

    use artcraft_router::generate::generate_image::image_generation_plan::ImageGenerationPlan;
    use artcraft_router::generate::generate_image::plan::fal::plan_generate_image_fal_flux_pro_1p1_ultra::{
      FalFluxPro11UltraNumImages, PlanFalFluxPro11Ultra,
    };
    use fal_client::requests::webhook::image::text::enqueue_flux_pro_11_ultra_text_to_image_webhook::FluxPro11UltraAspectRatio;

    /// Distill and run an assertion against the inner FalFluxPro11Ultra plan.
    ///
    /// We pass the plan by reference (rather than moving it out of `distilled`)
    /// because the plan's borrows are tied to data owned by `distilled` —
    /// moving it out would dangle those borrows.
    fn with_fal_plan<F: FnOnce(&PlanFalFluxPro11Ultra<'_>)>(
      request: &OmniGenImageCostAndGenerateRequest,
      assertion: F,
    ) {
      let distilled = distill(request);
      match distilled.plan() {
        ImageGenerationPlan::FalFluxPro11Ultra(plan) => assertion(plan),
        other => panic!("expected ImageGenerationPlan::FalFluxPro11Ultra, got {:?}", other),
      }
    }

    fn assert_plan_for_aspect_ratio<F: FnOnce(&PlanFalFluxPro11Ultra<'_>)>(
      ar: Option<CommonAspectRatio>,
      assertion: F,
    ) {
      with_fal_plan(&make_request(Some("p"), ar, Some(1)), assertion);
    }

    fn assert_plan_for_batch<F: FnOnce(&PlanFalFluxPro11Ultra<'_>)>(
      batch: Option<u16>,
      assertion: F,
    ) {
      with_fal_plan(&make_request(Some("p"), None, batch), assertion);
    }

    // ── Aspect ratio direct mappings ────────────────────────────────────────

    #[test]
    fn default_aspect_ratio_is_square() {
      assert_plan_for_aspect_ratio(None, |plan| {
        assert!(matches!(plan.aspect_ratio, FluxPro11UltraAspectRatio::Square));
      });
    }

    #[test]
    fn square_input_yields_square() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::Square), |plan| {
        assert!(matches!(plan.aspect_ratio, FluxPro11UltraAspectRatio::Square));
      });
    }

    #[test]
    fn square_hd_yields_square() {
      // Ultra collapses SquareHd back to plain Square.
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::SquareHd), |plan| {
        assert!(matches!(plan.aspect_ratio, FluxPro11UltraAspectRatio::Square));
      });
    }

    #[test]
    fn wide_4x3_yields_landscape_4_3() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::WideFourByThree), |plan| {
        assert!(matches!(plan.aspect_ratio, FluxPro11UltraAspectRatio::LandscapeFourByThree));
      });
    }

    #[test]
    fn wide_3x2_yields_landscape_3_2() {
      // Ultra-only direct mapping (1.1 doesn't have this).
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::WideThreeByTwo), |plan| {
        assert!(matches!(plan.aspect_ratio, FluxPro11UltraAspectRatio::LandscapeThreeByTwo));
      });
    }

    #[test]
    fn wide_16x9_yields_landscape_16_9() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::WideSixteenByNine), |plan| {
        assert!(matches!(plan.aspect_ratio, FluxPro11UltraAspectRatio::LandscapeSixteenByNine));
      });
    }

    #[test]
    fn wide_alias_yields_landscape_16_9() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::Wide), |plan| {
        assert!(matches!(plan.aspect_ratio, FluxPro11UltraAspectRatio::LandscapeSixteenByNine));
      });
    }

    #[test]
    fn wide_21x9_yields_landscape_21_9() {
      // Ultra-only direct mapping (1.1 falls back to 16:9).
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::WideTwentyOneByNine), |plan| {
        assert!(matches!(plan.aspect_ratio, FluxPro11UltraAspectRatio::LandscapeTwentyOneByNine));
      });
    }

    #[test]
    fn tall_3x4_yields_portrait_3_4() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::TallThreeByFour), |plan| {
        assert!(matches!(plan.aspect_ratio, FluxPro11UltraAspectRatio::PortraitThreeByFour));
      });
    }

    #[test]
    fn tall_2x3_yields_portrait_2_3() {
      // Ultra-only direct mapping (1.1 falls back to 3:4).
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::TallTwoByThree), |plan| {
        assert!(matches!(plan.aspect_ratio, FluxPro11UltraAspectRatio::PortraitTwoByThree));
      });
    }

    #[test]
    fn tall_9x16_yields_portrait_9_16() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::TallNineBySixteen), |plan| {
        assert!(matches!(plan.aspect_ratio, FluxPro11UltraAspectRatio::PortraitNineBySixteen));
      });
    }

    #[test]
    fn tall_alias_yields_portrait_9_16() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::Tall), |plan| {
        assert!(matches!(plan.aspect_ratio, FluxPro11UltraAspectRatio::PortraitNineBySixteen));
      });
    }

    #[test]
    fn tall_9x21_yields_portrait_9_21() {
      // Ultra-only direct mapping (1.1 falls back to 9:16).
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::TallNineByTwentyOne), |plan| {
        assert!(matches!(plan.aspect_ratio, FluxPro11UltraAspectRatio::PortraitNineByTwentyOne));
      });
    }

    // ── Aspect ratio nearest-neighbour fallbacks ────────────────────────────
    //
    // Ultra natively supports almost everything; only 5:4 and 4:5 fall back.

    #[test]
    fn wide_5x4_falls_back_to_landscape_4_3() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::WideFiveByFour), |plan| {
        assert!(matches!(plan.aspect_ratio, FluxPro11UltraAspectRatio::LandscapeFourByThree));
      });
    }

    #[test]
    fn tall_4x5_falls_back_to_portrait_3_4() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::TallFourByFive), |plan| {
        assert!(matches!(plan.aspect_ratio, FluxPro11UltraAspectRatio::PortraitThreeByFour));
      });
    }

    // ── Auto* aspect ratios ─────────────────────────────────────────────────

    #[test]
    fn auto_yields_square() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::Auto), |plan| {
        assert!(matches!(plan.aspect_ratio, FluxPro11UltraAspectRatio::Square));
      });
    }

    #[test]
    fn auto_2k_yields_square() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::Auto2k), |plan| {
        assert!(matches!(plan.aspect_ratio, FluxPro11UltraAspectRatio::Square));
      });
    }

    #[test]
    fn auto_4k_yields_square() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::Auto4k), |plan| {
        assert!(matches!(plan.aspect_ratio, FluxPro11UltraAspectRatio::Square));
      });
    }

    // ── Num images mapping ──────────────────────────────────────────────────

    #[test]
    fn default_batch_count_is_one() {
      assert_plan_for_batch(None, |plan| {
        assert!(matches!(plan.num_images, FalFluxPro11UltraNumImages::One));
      });
    }

    #[test]
    fn batch_of_one_yields_one() {
      assert_plan_for_batch(Some(1), |plan| {
        assert!(matches!(plan.num_images, FalFluxPro11UltraNumImages::One));
      });
    }

    #[test]
    fn batch_of_two_yields_two() {
      assert_plan_for_batch(Some(2), |plan| {
        assert!(matches!(plan.num_images, FalFluxPro11UltraNumImages::Two));
      });
    }

    #[test]
    fn batch_of_three_yields_three() {
      assert_plan_for_batch(Some(3), |plan| {
        assert!(matches!(plan.num_images, FalFluxPro11UltraNumImages::Three));
      });
    }

    #[test]
    fn batch_of_four_yields_four() {
      assert_plan_for_batch(Some(4), |plan| {
        assert!(matches!(plan.num_images, FalFluxPro11UltraNumImages::Four));
      });
    }

    #[test]
    fn batch_above_four_clamps_to_four() {
      // PayMoreUpgrade strategy clamps over-large batches down to the max.
      assert_plan_for_batch(Some(9), |plan| {
        assert!(matches!(plan.num_images, FalFluxPro11UltraNumImages::Four));
      });
    }

    // ── Prompt passthrough ──────────────────────────────────────────────────

    #[test]
    fn prompt_is_passed_through() {
      with_fal_plan(&make_request(Some("a corgi in a hat"), None, Some(1)), |plan| {
        assert_eq!(plan.prompt, Some("a corgi in a hat"));
      });
    }

    #[test]
    fn missing_prompt_is_none() {
      with_fal_plan(&make_request(None, None, Some(1)), |plan| {
        assert_eq!(plan.prompt, None);
      });
    }
  }
}
