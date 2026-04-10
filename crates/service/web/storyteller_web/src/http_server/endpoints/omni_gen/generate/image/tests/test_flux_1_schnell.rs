//! Tests for omni-gen against the Flux 1 Schnell model.
//!
//! These exercise [`distill_image_request`] end-to-end without firing any
//! provider calls — both the cost estimate (Artcraft provider, what we'd
//! bill on) and the execution plan (Fal provider, what we'd send to fal.ai)
//! are computed synchronously from the request.
//!
//! Flux 1 Schnell is text-to-image only, so no image refs are exercised.
//! It's also currently free / unlimited — we don't charge anything for it.

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

  /// Build a minimal Flux 1 Schnell omni request with only the fields we care
  /// about in tests filled in.
  fn make_request(
    prompt: Option<&str>,
    aspect_ratio: Option<CommonAspectRatio>,
    image_batch_count: Option<u16>,
  ) -> OmniGenImageCostAndGenerateRequest {
    OmniGenImageCostAndGenerateRequest {
      idempotency_token: Some("11111111-1111-1111-1111-111111111111".to_string()),
      model: Some(CommonImageModel::Flux1Schnell),
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
  /// Flux 1 Schnell never uses image refs, so we always pass an empty hydration map.
  fn distill(request: &OmniGenImageCostAndGenerateRequest) -> DistilledImageRequest {
    let empty: HashMap<MediaFileToken, Url> = HashMap::new();
    distill_image_request(request, Some(&empty))
      .expect("distill_image_request should succeed for Flux 1 Schnell")
  }

  // ────────────────────────────────────────────────────────────────────────────
  //   COST
  // ────────────────────────────────────────────────────────────────────────────
  //
  // Pricing comes from `estimate_image_cost_artcraft_flux_1_schnell`:
  //   Flux 1 Schnell is currently FREE / UNLIMITED — we don't charge for it.
  //   - cost_in_credits: None
  //   - cost_in_usd_cents: None
  //   - is_free: true
  //   - is_unlimited: true
  //
  // The artcraft cost path is what omni would bill on.
  mod cost {
    use super::*;

    fn distilled_for(image_batch_count: Option<u16>) -> DistilledImageRequest {
      distill(&make_request(Some("a happy puppy"), None, image_batch_count))
    }

    #[test]
    fn default_batch_is_free() {
      let distilled = distilled_for(None);
      assert_eq!(distilled.cost.cost_in_credits, None);
      assert_eq!(distilled.cost.cost_in_usd_cents, None);
      assert!(distilled.cost.is_free);
      assert!(distilled.cost.is_unlimited);
    }

    #[test]
    fn batch_of_one_is_free() {
      let distilled = distilled_for(Some(1));
      assert_eq!(distilled.cost.cost_in_credits, None);
      assert_eq!(distilled.cost.cost_in_usd_cents, None);
      assert!(distilled.cost.is_free);
      assert!(distilled.cost.is_unlimited);
    }

    #[test]
    fn batch_of_two_is_free() {
      let distilled = distilled_for(Some(2));
      assert_eq!(distilled.cost.cost_in_credits, None);
      assert_eq!(distilled.cost.cost_in_usd_cents, None);
      assert!(distilled.cost.is_free);
      assert!(distilled.cost.is_unlimited);
    }

    #[test]
    fn batch_of_three_is_free() {
      let distilled = distilled_for(Some(3));
      assert_eq!(distilled.cost.cost_in_credits, None);
      assert_eq!(distilled.cost.cost_in_usd_cents, None);
      assert!(distilled.cost.is_free);
      assert!(distilled.cost.is_unlimited);
    }

    #[test]
    fn batch_of_four_is_free() {
      let distilled = distilled_for(Some(4));
      assert_eq!(distilled.cost.cost_in_credits, None);
      assert_eq!(distilled.cost.cost_in_usd_cents, None);
      assert!(distilled.cost.is_free);
      assert!(distilled.cost.is_unlimited);
    }

    #[test]
    fn batch_above_max_is_still_free() {
      // PayMoreUpgrade strategy clamps batches >4 down to the max of 4 — and
      // 4-of-free is still free.
      let distilled = distilled_for(Some(7));
      assert_eq!(distilled.cost.cost_in_credits, None);
      assert_eq!(distilled.cost.cost_in_usd_cents, None);
      assert!(distilled.cost.is_free);
      assert!(distilled.cost.is_unlimited);
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
          distilled.cost.cost_in_usd_cents, None,
          "expected free regardless of aspect ratio (got {:?})", ar,
        );
        assert!(distilled.cost.is_free);
        assert!(distilled.cost.is_unlimited);
      }
    }

    #[test]
    fn cost_is_independent_of_prompt() {
      let with_prompt = distill(&make_request(Some("a cat"), None, Some(3)));
      let without_prompt = distill(&make_request(None, None, Some(3)));

      assert_eq!(with_prompt.cost.cost_in_usd_cents, None);
      assert_eq!(without_prompt.cost.cost_in_usd_cents, None);
      assert!(with_prompt.cost.is_free);
      assert!(without_prompt.cost.is_free);
    }

    #[test]
    fn cost_metadata_flags() {
      let request = make_request(Some("p"), None, Some(1));
      let distilled = distill(&request);
      assert!(distilled.cost.is_free);
      assert!(distilled.cost.is_unlimited);
      // Free / unlimited but not rate-limited and no watermark.
      assert!(!distilled.cost.is_rate_limited);
      assert!(!distilled.cost.has_watermark);
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  //   PLAN
  // ────────────────────────────────────────────────────────────────────────────
  //
  // The distilled plan is the Fal-side `PlanFalFlux1Schnell`:
  //   - prompt: passthrough
  //   - maybe_image_url: always None (Flux 1 Schnell never gets image refs in tests)
  //   - t2i_aspect_ratio: text-to-image aspect ratio (always set; defaults to Square)
  //   - edit_image_size: image-edit size (only populated when caller passes an
  //     aspect ratio; None when no aspect ratio was supplied)
  //   - num_images: mapped from image_batch_count (default 1, clamped to 1..=4)
  mod plan {
    use super::*;

    use artcraft_router::generate::generate_image::image_generation_plan::ImageGenerationPlan;
    use artcraft_router::generate::generate_image::plan::fal::plan_generate_image_fal_flux_1_schnell::{
      FalFlux1SchnellNumImages, PlanFalFlux1Schnell,
    };
    use fal_client::requests::webhook::image::edit::enqueue_flux_1_schnell_edit_image_webhook::Flux1SchnellEditImageSize;
    use fal_client::requests::webhook::image::text::enqueue_flux_1_schnell_text_to_image_webhook::Flux1SchnellAspectRatio;

    /// Distill and run an assertion against the inner FalFlux1Schnell plan.
    ///
    /// We pass the plan by reference (rather than moving it out of `distilled`)
    /// because the plan's borrows are tied to data owned by `distilled` —
    /// moving it out would dangle those borrows.
    fn with_fal_plan<F: FnOnce(&PlanFalFlux1Schnell<'_>)>(
      request: &OmniGenImageCostAndGenerateRequest,
      assertion: F,
    ) {
      let distilled = distill(request);
      match distilled.plan() {
        ImageGenerationPlan::FalFlux1Schnell(plan) => assertion(plan),
        other => panic!("expected ImageGenerationPlan::FalFlux1Schnell, got {:?}", other),
      }
    }

    fn assert_plan_for_aspect_ratio<F: FnOnce(&PlanFalFlux1Schnell<'_>)>(
      ar: Option<CommonAspectRatio>,
      assertion: F,
    ) {
      with_fal_plan(&make_request(Some("p"), ar, Some(1)), assertion);
    }

    fn assert_plan_for_batch<F: FnOnce(&PlanFalFlux1Schnell<'_>)>(
      batch: Option<u16>,
      assertion: F,
    ) {
      with_fal_plan(&make_request(Some("p"), None, batch), assertion);
    }

    // ── t2i_aspect_ratio direct mapping ─────────────────────────────────────

    #[test]
    fn default_t2i_aspect_ratio_is_square() {
      assert_plan_for_aspect_ratio(None, |plan| {
        assert!(matches!(plan.t2i_aspect_ratio, Flux1SchnellAspectRatio::Square));
      });
    }

    #[test]
    fn square_input_yields_square() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::Square), |plan| {
        assert!(matches!(plan.t2i_aspect_ratio, Flux1SchnellAspectRatio::Square));
      });
    }

    #[test]
    fn square_hd_input_yields_square_hd() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::SquareHd), |plan| {
        assert!(matches!(plan.t2i_aspect_ratio, Flux1SchnellAspectRatio::SquareHd));
      });
    }

    #[test]
    fn wide_4x3_yields_landscape_4_3() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::WideFourByThree), |plan| {
        assert!(matches!(plan.t2i_aspect_ratio, Flux1SchnellAspectRatio::LandscapeFourByThree));
      });
    }

    #[test]
    fn wide_16x9_yields_landscape_16_9() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::WideSixteenByNine), |plan| {
        assert!(matches!(plan.t2i_aspect_ratio, Flux1SchnellAspectRatio::LandscapeSixteenByNine));
      });
    }

    #[test]
    fn wide_alias_yields_landscape_16_9() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::Wide), |plan| {
        assert!(matches!(plan.t2i_aspect_ratio, Flux1SchnellAspectRatio::LandscapeSixteenByNine));
      });
    }

    #[test]
    fn tall_3x4_yields_portrait_3_4() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::TallThreeByFour), |plan| {
        assert!(matches!(plan.t2i_aspect_ratio, Flux1SchnellAspectRatio::PortraitThreeByFour));
      });
    }

    #[test]
    fn tall_9x16_yields_portrait_9_16() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::TallNineBySixteen), |plan| {
        assert!(matches!(plan.t2i_aspect_ratio, Flux1SchnellAspectRatio::PortraitNineBySixteen));
      });
    }

    #[test]
    fn tall_alias_yields_portrait_9_16() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::Tall), |plan| {
        assert!(matches!(plan.t2i_aspect_ratio, Flux1SchnellAspectRatio::PortraitNineBySixteen));
      });
    }

    // ── t2i_aspect_ratio nearest-neighbour fallbacks ────────────────────────
    //
    // Aspect ratios that Flux 1 Schnell doesn't natively support get mapped to
    // the closest supported ratio under the PayMoreUpgrade mismatch strategy
    // that omni-gen uses.

    #[test]
    fn wide_5x4_falls_back_to_landscape_4_3() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::WideFiveByFour), |plan| {
        assert!(matches!(plan.t2i_aspect_ratio, Flux1SchnellAspectRatio::LandscapeFourByThree));
      });
    }

    #[test]
    fn wide_3x2_falls_back_to_landscape_4_3() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::WideThreeByTwo), |plan| {
        assert!(matches!(plan.t2i_aspect_ratio, Flux1SchnellAspectRatio::LandscapeFourByThree));
      });
    }

    #[test]
    fn wide_21x9_falls_back_to_landscape_16_9() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::WideTwentyOneByNine), |plan| {
        assert!(matches!(plan.t2i_aspect_ratio, Flux1SchnellAspectRatio::LandscapeSixteenByNine));
      });
    }

    #[test]
    fn tall_4x5_falls_back_to_portrait_3_4() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::TallFourByFive), |plan| {
        assert!(matches!(plan.t2i_aspect_ratio, Flux1SchnellAspectRatio::PortraitThreeByFour));
      });
    }

    #[test]
    fn tall_2x3_falls_back_to_portrait_3_4() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::TallTwoByThree), |plan| {
        assert!(matches!(plan.t2i_aspect_ratio, Flux1SchnellAspectRatio::PortraitThreeByFour));
      });
    }

    #[test]
    fn tall_9x21_falls_back_to_portrait_9_16() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::TallNineByTwentyOne), |plan| {
        assert!(matches!(plan.t2i_aspect_ratio, Flux1SchnellAspectRatio::PortraitNineBySixteen));
      });
    }

    // ── Auto* aspect ratios collapse to Square (text-to-image) ──────────────

    #[test]
    fn auto_yields_square() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::Auto), |plan| {
        assert!(matches!(plan.t2i_aspect_ratio, Flux1SchnellAspectRatio::Square));
      });
    }

    #[test]
    fn auto_2k_yields_square() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::Auto2k), |plan| {
        assert!(matches!(plan.t2i_aspect_ratio, Flux1SchnellAspectRatio::Square));
      });
    }

    #[test]
    fn auto_4k_yields_square() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::Auto4k), |plan| {
        assert!(matches!(plan.t2i_aspect_ratio, Flux1SchnellAspectRatio::Square));
      });
    }

    // ── edit_image_size mapping ─────────────────────────────────────────────
    //
    // The plan also computes an `edit_image_size` from the same aspect ratio
    // input. It's None when no aspect ratio was supplied, and otherwise mirrors
    // the t2i mapping (with a Square fallback for unsupported variants).

    #[test]
    fn no_aspect_ratio_yields_no_edit_image_size() {
      assert_plan_for_aspect_ratio(None, |plan| {
        assert!(plan.edit_image_size.is_none());
      });
    }

    #[test]
    fn square_yields_edit_image_size_square() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::Square), |plan| {
        assert!(matches!(plan.edit_image_size, Some(Flux1SchnellEditImageSize::Square)));
      });
    }

    #[test]
    fn square_hd_yields_edit_image_size_square_hd() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::SquareHd), |plan| {
        assert!(matches!(plan.edit_image_size, Some(Flux1SchnellEditImageSize::SquareHd)));
      });
    }

    #[test]
    fn wide_4x3_yields_edit_image_size_landscape_4_3() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::WideFourByThree), |plan| {
        assert!(matches!(plan.edit_image_size, Some(Flux1SchnellEditImageSize::LandscapeFourByThree)));
      });
    }

    #[test]
    fn wide_16x9_yields_edit_image_size_landscape_16_9() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::WideSixteenByNine), |plan| {
        assert!(matches!(plan.edit_image_size, Some(Flux1SchnellEditImageSize::LandscapeSixteenByNine)));
      });
    }

    #[test]
    fn wide_alias_yields_edit_image_size_landscape_16_9() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::Wide), |plan| {
        assert!(matches!(plan.edit_image_size, Some(Flux1SchnellEditImageSize::LandscapeSixteenByNine)));
      });
    }

    #[test]
    fn tall_3x4_yields_edit_image_size_portrait_3_4() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::TallThreeByFour), |plan| {
        assert!(matches!(plan.edit_image_size, Some(Flux1SchnellEditImageSize::PortraitThreeByFour)));
      });
    }

    #[test]
    fn tall_9x16_yields_edit_image_size_portrait_9_16() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::TallNineBySixteen), |plan| {
        assert!(matches!(plan.edit_image_size, Some(Flux1SchnellEditImageSize::PortraitNineBySixteen)));
      });
    }

    #[test]
    fn tall_alias_yields_edit_image_size_portrait_9_16() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::Tall), |plan| {
        assert!(matches!(plan.edit_image_size, Some(Flux1SchnellEditImageSize::PortraitNineBySixteen)));
      });
    }

    /// Aspect ratios that don't have a direct edit-image-size mapping (Auto,
    /// the Wide5x4 / Wide3x2 / Wide21x9 family, the Tall4x5 / Tall2x3 /
    /// Tall9x21 family) all collapse to `Some(Square)` per the plan's catch-all.
    #[test]
    fn auto_yields_edit_image_size_square() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::Auto), |plan| {
        assert!(matches!(plan.edit_image_size, Some(Flux1SchnellEditImageSize::Square)));
      });
    }

    #[test]
    fn wide_5x4_yields_edit_image_size_square() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::WideFiveByFour), |plan| {
        assert!(matches!(plan.edit_image_size, Some(Flux1SchnellEditImageSize::Square)));
      });
    }

    #[test]
    fn tall_2x3_yields_edit_image_size_square() {
      assert_plan_for_aspect_ratio(Some(CommonAspectRatio::TallTwoByThree), |plan| {
        assert!(matches!(plan.edit_image_size, Some(Flux1SchnellEditImageSize::Square)));
      });
    }

    // ── Num images mapping ──────────────────────────────────────────────────

    #[test]
    fn default_batch_count_is_one() {
      assert_plan_for_batch(None, |plan| {
        assert!(matches!(plan.num_images, FalFlux1SchnellNumImages::One));
      });
    }

    #[test]
    fn batch_of_one_yields_one() {
      assert_plan_for_batch(Some(1), |plan| {
        assert!(matches!(plan.num_images, FalFlux1SchnellNumImages::One));
      });
    }

    #[test]
    fn batch_of_two_yields_two() {
      assert_plan_for_batch(Some(2), |plan| {
        assert!(matches!(plan.num_images, FalFlux1SchnellNumImages::Two));
      });
    }

    #[test]
    fn batch_of_three_yields_three() {
      assert_plan_for_batch(Some(3), |plan| {
        assert!(matches!(plan.num_images, FalFlux1SchnellNumImages::Three));
      });
    }

    #[test]
    fn batch_of_four_yields_four() {
      assert_plan_for_batch(Some(4), |plan| {
        assert!(matches!(plan.num_images, FalFlux1SchnellNumImages::Four));
      });
    }

    #[test]
    fn batch_above_four_clamps_to_four() {
      // PayMoreUpgrade strategy clamps over-large batches down to the max.
      assert_plan_for_batch(Some(9), |plan| {
        assert!(matches!(plan.num_images, FalFlux1SchnellNumImages::Four));
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

    // ── Image refs (Flux 1 Schnell never has them) ──────────────────────────

    #[test]
    fn image_url_is_always_none() {
      // Flux 1 Schnell is text-to-image only — `maybe_image_url` is always
      // None because we never pass image_media_tokens.
      with_fal_plan(&make_request(Some("p"), None, Some(1)), |plan| {
        assert!(plan.maybe_image_url.is_none());
      });
    }
  }
}
