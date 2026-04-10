//! Tests for omni-gen against the Flux Pro 1.1 model.
//!
//! These exercise [`distill_image_request`] end-to-end without firing any
//! provider calls — both the cost estimate (Artcraft provider, what we bill
//! on) and the execution plan (Fal provider, what we'd send to fal.ai) are
//! computed synchronously from the request.
//!
//! Flux Pro 1.1 is text-to-image only, so no image refs are exercised.

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

  /// Build a minimal Flux Pro 1.1 omni request with only the fields we care
  /// about in tests filled in.
  fn make_request(
    prompt: Option<&str>,
    aspect_ratio: Option<CommonAspectRatio>,
    image_batch_count: Option<u16>,
  ) -> OmniGenImageCostAndGenerateRequest {
    OmniGenImageCostAndGenerateRequest {
      idempotency_token: Some("11111111-1111-1111-1111-111111111111".to_string()),
      model: Some(CommonImageModel::FluxPro11),
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
  /// Flux Pro 1.1 never uses image refs, so we always pass an empty hydration map.
  fn distill(request: &OmniGenImageCostAndGenerateRequest) -> DistilledImageRequest {
    let empty: HashMap<MediaFileToken, Url> = HashMap::new();
    distill_image_request(request, Some(&empty))
      .expect("distill_image_request should succeed for Flux Pro 1.1")
  }

  // ────────────────────────────────────────────────────────────────────────────
  //   COST
  // ────────────────────────────────────────────────────────────────────────────
  //
  // Pricing comes from `estimate_image_cost_artcraft_flux_pro_1p1`:
  //   $0.04 / image (4 credits per image; 1 credit == 1 USD cent)
  //
  // This matches what the legacy `generate_flux_pro_11_text_to_image_handler`
  // charges via `FluxPro11Args::calculate_cost_in_cents` (which is also $0.04
  // per image — Fal docs: "$0.04 per megapixel, billed by rounding up to the
  // nearest megapixel" at the default ~1MP image size).
  //
  // The artcraft cost path is what omni bills on.
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
    fn default_batch_costs_4_cents() {
      // No batch specified → defaults to 1 image → 4¢
      let (credits, cents) = cost_for_batch(None);
      assert_eq!(credits, Some(4));
      assert_eq!(cents, Some(4));
    }

    #[test]
    fn batch_of_one_costs_4_cents() {
      let (credits, cents) = cost_for_batch(Some(1));
      assert_eq!(credits, Some(4));
      assert_eq!(cents, Some(4));
    }

    #[test]
    fn batch_of_two_costs_8_cents() {
      let (credits, cents) = cost_for_batch(Some(2));
      assert_eq!(credits, Some(8));
      assert_eq!(cents, Some(8));
    }

    #[test]
    fn batch_of_three_costs_12_cents() {
      let (credits, cents) = cost_for_batch(Some(3));
      assert_eq!(credits, Some(12));
      assert_eq!(cents, Some(12));
    }

    #[test]
    fn batch_of_four_costs_16_cents() {
      let (credits, cents) = cost_for_batch(Some(4));
      assert_eq!(credits, Some(16));
      assert_eq!(cents, Some(16));
    }

    #[test]
    fn batch_above_max_clamps_and_costs_16_cents() {
      // PayMoreUpgrade strategy clamps batches >4 down to the max of 4.
      let (credits, cents) = cost_for_batch(Some(7));
      assert_eq!(credits, Some(16));
      assert_eq!(cents, Some(16));
    }

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
        let request = make_request(Some("p"), ar, Some(2));
        let distilled = distill(&request);
        assert_eq!(
          distilled.cost.cost_in_usd_cents,
          Some(8),
          "expected 8¢ regardless of aspect ratio (got {:?})",
          ar,
        );
      }
    }

    #[test]
    fn cost_is_independent_of_prompt() {
      let with_prompt = distill(&make_request(Some("a cat"), None, Some(3)));
      let without_prompt = distill(&make_request(None, None, Some(3)));
      assert_eq!(with_prompt.cost.cost_in_usd_cents, Some(12));
      assert_eq!(without_prompt.cost.cost_in_usd_cents, Some(12));
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
  // The distilled plan is the Fal-side `PlanFalFluxPro11`:
  //   - prompt: passthrough
  //   - aspect_ratio: mapped from CommonAspectRatio with sensible fallbacks
  //   - num_images: mapped from image_batch_count (default 1, clamped to 1..=4)
  //
  // (Flux Pro 1.1 has no image_url field — it's text-to-image only.)
  mod plan {
    use super::*;

    use artcraft_router::generate::generate_image::image_generation_plan::ImageGenerationPlan;
    use artcraft_router::generate::generate_image::plan::fal::plan_generate_image_fal_flux_pro_1p1::{
      FalFluxPro11NumImages, PlanFalFluxPro11,
    };
    use fal_client::requests::webhook::image::text::enqueue_flux_pro_11_text_to_image_webhook::FluxPro11AspectRatio;

    /// Distill and run an assertion against the inner FalFluxPro11 plan.
    ///
    /// We pass the plan by reference (rather than moving it out of `distilled`)
    /// because the plan's borrows are tied to data owned by `distilled` —
    /// moving it out would dangle those borrows.
    fn with_fal_plan<F: FnOnce(&PlanFalFluxPro11<'_>)>(
      request: &OmniGenImageCostAndGenerateRequest,
      assertion: F,
    ) {
      let distilled = distill(request);
      match distilled.plan() {
        ImageGenerationPlan::FalFluxPro11(plan) => assertion(plan),
        other => panic!("expected ImageGenerationPlan::FalFluxPro11, got {:?}", other),
      }
    }

    fn assert_plan_for_aspect_ratio<F: FnOnce(&PlanFalFluxPro11<'_>)>(
      ar: Option<CommonAspectRatio>,
      assertion: F,
    ) {
      with_fal_plan(&make_request(Some("p"), ar, Some(1)), assertion);
    }

    fn assert_plan_for_batch<F: FnOnce(&PlanFalFluxPro11<'_>)>(
      batch: Option<u16>,
      assertion: F,
    ) {
      with_fal_plan(&make_request(Some("p"), None, batch), assertion);
    }

    // ── Aspect ratio direct mappings ────────────────────────────────────────

    #[test]
    fn default_aspect_ratio_is_square() {
      assert_plan_for_aspect_ratio(None, |plan| {
        assert!(matches!(plan.aspect_ratio, FluxPro11AspectRatio::Square));
      });
    }

    #[test]
    fn square_input_yields_square() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::Square), |plan| {
        assert!(matches!(plan.aspect_ratio, FluxPro11AspectRatio::Square));
      });
    }

    #[test]
    fn square_hd_input_yields_square_hd() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::SquareHd), |plan| {
        assert!(matches!(plan.aspect_ratio, FluxPro11AspectRatio::SquareHd));
      });
    }

    #[test]
    fn wide_4x3_yields_landscape_4_3() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::WideFourByThree), |plan| {
        assert!(matches!(plan.aspect_ratio, FluxPro11AspectRatio::LandscapeFourByThree));
      });
    }

    #[test]
    fn wide_16x9_yields_landscape_16_9() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::WideSixteenByNine), |plan| {
        assert!(matches!(plan.aspect_ratio, FluxPro11AspectRatio::LandscapeSixteenByNine));
      });
    }

    #[test]
    fn wide_alias_yields_landscape_16_9() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::Wide), |plan| {
        assert!(matches!(plan.aspect_ratio, FluxPro11AspectRatio::LandscapeSixteenByNine));
      });
    }

    #[test]
    fn tall_3x4_yields_portrait_3_4() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::TallThreeByFour), |plan| {
        assert!(matches!(plan.aspect_ratio, FluxPro11AspectRatio::PortraitThreeByFour));
      });
    }

    #[test]
    fn tall_9x16_yields_portrait_9_16() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::TallNineBySixteen), |plan| {
        assert!(matches!(plan.aspect_ratio, FluxPro11AspectRatio::PortraitNineBySixteen));
      });
    }

    #[test]
    fn tall_alias_yields_portrait_9_16() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::Tall), |plan| {
        assert!(matches!(plan.aspect_ratio, FluxPro11AspectRatio::PortraitNineBySixteen));
      });
    }

    // ── Aspect ratio nearest-neighbour fallbacks ────────────────────────────
    //
    // Aspect ratios that Flux Pro 1.1 doesn't natively support get mapped to
    // the closest supported ratio under the PayMoreUpgrade mismatch strategy
    // that omni-gen uses.

    #[test]
    fn wide_5x4_falls_back_to_landscape_4_3() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::WideFiveByFour), |plan| {
        assert!(matches!(plan.aspect_ratio, FluxPro11AspectRatio::LandscapeFourByThree));
      });
    }

    #[test]
    fn wide_3x2_falls_back_to_landscape_4_3() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::WideThreeByTwo), |plan| {
        assert!(matches!(plan.aspect_ratio, FluxPro11AspectRatio::LandscapeFourByThree));
      });
    }

    #[test]
    fn wide_21x9_falls_back_to_landscape_16_9() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::WideTwentyOneByNine), |plan| {
        assert!(matches!(plan.aspect_ratio, FluxPro11AspectRatio::LandscapeSixteenByNine));
      });
    }

    #[test]
    fn tall_4x5_falls_back_to_portrait_3_4() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::TallFourByFive), |plan| {
        assert!(matches!(plan.aspect_ratio, FluxPro11AspectRatio::PortraitThreeByFour));
      });
    }

    #[test]
    fn tall_2x3_falls_back_to_portrait_3_4() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::TallTwoByThree), |plan| {
        assert!(matches!(plan.aspect_ratio, FluxPro11AspectRatio::PortraitThreeByFour));
      });
    }

    #[test]
    fn tall_9x21_falls_back_to_portrait_9_16() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::TallNineByTwentyOne), |plan| {
        assert!(matches!(plan.aspect_ratio, FluxPro11AspectRatio::PortraitNineBySixteen));
      });
    }

    // ── Auto* aspect ratios ─────────────────────────────────────────────────

    #[test]
    fn auto_yields_square() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::Auto), |plan| {
        assert!(matches!(plan.aspect_ratio, FluxPro11AspectRatio::Square));
      });
    }

    #[test]
    fn auto_2k_yields_square() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::Auto2k), |plan| {
        assert!(matches!(plan.aspect_ratio, FluxPro11AspectRatio::Square));
      });
    }

    #[test]
    fn auto_4k_yields_square() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::Auto4k), |plan| {
        assert!(matches!(plan.aspect_ratio, FluxPro11AspectRatio::Square));
      });
    }

    // ── Num images mapping ──────────────────────────────────────────────────

    #[test]
    fn default_batch_count_is_one() {
      assert_plan_for_batch(None, |plan| {
        assert!(matches!(plan.num_images, FalFluxPro11NumImages::One));
      });
    }

    #[test]
    fn batch_of_one_yields_one() {
      assert_plan_for_batch(Some(1), |plan| {
        assert!(matches!(plan.num_images, FalFluxPro11NumImages::One));
      });
    }

    #[test]
    fn batch_of_two_yields_two() {
      assert_plan_for_batch(Some(2), |plan| {
        assert!(matches!(plan.num_images, FalFluxPro11NumImages::Two));
      });
    }

    #[test]
    fn batch_of_three_yields_three() {
      assert_plan_for_batch(Some(3), |plan| {
        assert!(matches!(plan.num_images, FalFluxPro11NumImages::Three));
      });
    }

    #[test]
    fn batch_of_four_yields_four() {
      assert_plan_for_batch(Some(4), |plan| {
        assert!(matches!(plan.num_images, FalFluxPro11NumImages::Four));
      });
    }

    #[test]
    fn batch_above_four_clamps_to_four() {
      // PayMoreUpgrade strategy clamps over-large batches down to the max.
      assert_plan_for_batch(Some(9), |plan| {
        assert!(matches!(plan.num_images, FalFluxPro11NumImages::Four));
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
