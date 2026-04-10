//! Tests for omni-gen against the Nano Banana model.
//!
//! Nano Banana is a multi-function model: it does both text-to-image and
//! image-to-image (edit). The omni-gen distillation routes the same model
//! through two different Fal endpoints depending on whether image refs are
//! supplied. We exercise both modes here.
//!
//! Pricing matches the legacy `nano_banana_multi_function_image_gen_handler`:
//!   $0.04 / image (4 credits per image; 1 credit == 1 USD cent)
//! for both text-to-image and image-edit modes — same as
//! `Gemini25FlashTextToImageArgs::calculate_cost_in_cents` and
//! `Gemini25FlashEditArgs::calculate_cost_in_cents`.

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

  /// Build a minimal Nano Banana omni request.
  fn make_request(
    prompt: Option<&str>,
    aspect_ratio: Option<CommonAspectRatio>,
    image_batch_count: Option<u16>,
    image_media_tokens: Option<Vec<MediaFileToken>>,
  ) -> OmniGenImageCostAndGenerateRequest {
    OmniGenImageCostAndGenerateRequest {
      idempotency_token: Some("11111111-1111-1111-1111-111111111111".to_string()),
      model: Some(CommonImageModel::NanoBanana),
      prompt: prompt.map(|s| s.to_string()),
      image_media_tokens,
      resolution: None,
      aspect_ratio,
      quality: None,
      image_batch_count,
      adjust_horizontal_angle: None,
      adjust_vertical_angle: None,
      adjust_zoom: None,
    }
  }

  /// Make `n` fake media tokens paired with fake URLs, returned as both a
  /// vec (for `image_media_tokens`) and a hydration map.
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
      .expect("distill_image_request should succeed for Nano Banana (text)")
  }

  /// Distill an edit request, providing the hydration map.
  fn distill_edit(
    request: &OmniGenImageCostAndGenerateRequest,
    hydration: &HashMap<MediaFileToken, Url>,
  ) -> DistilledImageRequest {
    distill_image_request(request, Some(hydration))
      .expect("distill_image_request should succeed for Nano Banana (edit)")
  }

  // ────────────────────────────────────────────────────────────────────────────
  //   COST
  // ────────────────────────────────────────────────────────────────────────────
  //
  // Pricing comes from `estimate_image_cost_artcraft_nano_banana`:
  //   $0.04 / image (4 credits per image), independent of mode.
  //
  // Matches the legacy handler's call to `calculate_cost_in_cents` on both
  // Gemini25FlashTextToImageArgs and Gemini25FlashEditArgs.
  mod cost {
    use super::*;

    mod text {
      use super::*;

      fn cost_for_batch(image_batch_count: Option<u16>) -> (Option<u64>, Option<u64>) {
        let request = make_request(Some("a happy puppy"), None, image_batch_count, None);
        let distilled = distill_text(&request);
        (
          distilled.cost.cost_in_credits,
          distilled.cost.cost_in_usd_cents,
        )
      }

      #[test]
      fn default_batch_costs_4_cents() {
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
        // PayMoreUpgrade clamps over-large batches to the max of 4.
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
          let request = make_request(Some("p"), ar, Some(2), None);
          let distilled = distill_text(&request);
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
        let with_prompt = distill_text(&make_request(Some("a cat"), None, Some(3), None));
        let without_prompt = distill_text(&make_request(None, None, Some(3), None));
        assert_eq!(with_prompt.cost.cost_in_usd_cents, Some(12));
        assert_eq!(without_prompt.cost.cost_in_usd_cents, Some(12));
      }

      #[test]
      fn cost_metadata_flags_are_default() {
        let request = make_request(Some("p"), None, Some(1), None);
        let distilled = distill_text(&request);
        assert!(!distilled.cost.is_free);
        assert!(!distilled.cost.is_unlimited);
        assert!(!distilled.cost.is_rate_limited);
        assert!(!distilled.cost.has_watermark);
      }
    }

    mod edit {
      use super::*;

      fn cost_for_batch_with_image_refs(
        image_batch_count: Option<u16>,
        num_image_refs: usize,
      ) -> (Option<u64>, Option<u64>) {
        let (tokens, hydration) = fake_image_refs(num_image_refs);
        let request = make_request(Some("make it pop"), None, image_batch_count, Some(tokens));
        let distilled = distill_edit(&request, &hydration);
        (
          distilled.cost.cost_in_credits,
          distilled.cost.cost_in_usd_cents,
        )
      }

      #[test]
      fn default_batch_costs_4_cents() {
        let (credits, cents) = cost_for_batch_with_image_refs(None, 1);
        assert_eq!(credits, Some(4));
        assert_eq!(cents, Some(4));
      }

      #[test]
      fn batch_of_one_costs_4_cents() {
        let (credits, cents) = cost_for_batch_with_image_refs(Some(1), 1);
        assert_eq!(credits, Some(4));
        assert_eq!(cents, Some(4));
      }

      #[test]
      fn batch_of_two_costs_8_cents() {
        let (credits, cents) = cost_for_batch_with_image_refs(Some(2), 1);
        assert_eq!(credits, Some(8));
        assert_eq!(cents, Some(8));
      }

      #[test]
      fn batch_of_three_costs_12_cents() {
        let (credits, cents) = cost_for_batch_with_image_refs(Some(3), 1);
        assert_eq!(credits, Some(12));
        assert_eq!(cents, Some(12));
      }

      #[test]
      fn batch_of_four_costs_16_cents() {
        let (credits, cents) = cost_for_batch_with_image_refs(Some(4), 1);
        assert_eq!(credits, Some(16));
        assert_eq!(cents, Some(16));
      }

      #[test]
      fn batch_above_max_clamps_and_costs_16_cents() {
        let (credits, cents) = cost_for_batch_with_image_refs(Some(9), 1);
        assert_eq!(credits, Some(16));
        assert_eq!(cents, Some(16));
      }

      #[test]
      fn cost_is_independent_of_image_ref_count() {
        // Whether the user attaches 1, 2, or 5 reference images, the price is
        // the same: $0.04 × num_output_images.
        for num_refs in [1usize, 2, 3, 5] {
          let (_credits, cents) = cost_for_batch_with_image_refs(Some(2), num_refs);
          assert_eq!(
            cents,
            Some(8),
            "expected 8¢ regardless of {} image refs",
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
          let request = make_request(Some("p"), ar, Some(2), Some(tokens));
          let distilled = distill_edit(&request, &hydration);
          assert_eq!(
            distilled.cost.cost_in_usd_cents,
            Some(8),
            "expected 8¢ regardless of aspect ratio (got {:?})",
            ar,
          );
        }
      }

      #[test]
      fn cost_metadata_flags_are_default() {
        let (tokens, hydration) = fake_image_refs(1);
        let request = make_request(Some("p"), None, Some(1), Some(tokens));
        let distilled = distill_edit(&request, &hydration);
        assert!(!distilled.cost.is_free);
        assert!(!distilled.cost.is_unlimited);
        assert!(!distilled.cost.is_rate_limited);
        assert!(!distilled.cost.has_watermark);
      }

      #[test]
      fn edit_and_text_cost_match_for_same_batch() {
        // Both modes are billed at the same $0.04/image rate.
        for batch in [1u16, 2, 3, 4] {
          let text = distill_text(&make_request(Some("p"), None, Some(batch), None));
          let (tokens, hydration) = fake_image_refs(1);
          let edit = distill_edit(
            &make_request(Some("p"), None, Some(batch), Some(tokens)),
            &hydration,
          );
          assert_eq!(
            text.cost.cost_in_usd_cents,
            edit.cost.cost_in_usd_cents,
            "text/edit cost diverged at batch={}",
            batch,
          );
        }
      }
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  //   PLAN
  // ────────────────────────────────────────────────────────────────────────────
  //
  // The distilled plan is `ImageGenerationPlan::FalNanoBanana(PlanFalNanoBanana)`.
  // This single plan struct carries both:
  //   - `t2i_aspect_ratio: Option<Gemini25FlashTextToImageAspectRatio>`
  //   - `edit_aspect_ratio: Option<Gemini25FlashEditAspectRatio>`
  //   - `image_urls: Vec<String>` — empty in text mode, populated in edit mode
  //   - `num_images: FalNbNumImages`
  //
  // The handler picks t2i vs edit based on whether `image_urls` is empty.
  mod plan {
    use super::*;

    use artcraft_router::generate::generate_image::image_generation_plan::ImageGenerationPlan;
    use artcraft_router::generate::generate_image::plan::fal::plan_generate_image_fal_nano_banana::{
      FalNbNumImages, PlanFalNanoBanana,
    };
    use fal_client::requests::webhook::image::edit::enqueue_gemini_25_flash_edit_webhook::Gemini25FlashEditAspectRatio;
    use fal_client::requests::webhook::image::text::enqueue_gemini_25_flash_text_to_image_webhook::Gemini25FlashTextToImageAspectRatio;

    /// Distill a text request and run an assertion against the inner plan.
    fn with_text_plan<F: FnOnce(&PlanFalNanoBanana<'_>)>(
      request: &OmniGenImageCostAndGenerateRequest,
      assertion: F,
    ) {
      let distilled = distill_text(request);
      match distilled.plan() {
        ImageGenerationPlan::FalNanoBanana(plan) => assertion(plan),
        other => panic!("expected ImageGenerationPlan::FalNanoBanana, got {:?}", other),
      }
    }

    /// Distill an edit request and run an assertion against the inner plan.
    fn with_edit_plan<F: FnOnce(&PlanFalNanoBanana<'_>)>(
      request: &OmniGenImageCostAndGenerateRequest,
      hydration: &HashMap<MediaFileToken, Url>,
      assertion: F,
    ) {
      let distilled = distill_edit(request, hydration);
      match distilled.plan() {
        ImageGenerationPlan::FalNanoBanana(plan) => assertion(plan),
        other => panic!("expected ImageGenerationPlan::FalNanoBanana, got {:?}", other),
      }
    }

    mod text {
      use super::*;

      fn assert_t2i_for_aspect_ratio<F: FnOnce(&PlanFalNanoBanana<'_>)>(
        ar: Option<CommonAspectRatio>,
        assertion: F,
      ) {
        with_text_plan(&make_request(Some("p"), ar, Some(1), None), assertion);
      }

      fn assert_t2i_for_batch<F: FnOnce(&PlanFalNanoBanana<'_>)>(
        batch: Option<u16>,
        assertion: F,
      ) {
        with_text_plan(&make_request(Some("p"), None, batch, None), assertion);
      }

      // ── Mode detection ────────────────────────────────────────────────────

      #[test]
      fn text_mode_has_empty_image_urls() {
        with_text_plan(&make_request(Some("p"), None, Some(1), None), |plan| {
          assert!(plan.image_urls.is_empty(), "text mode must have no image_urls");
        });
      }

      // ── Aspect ratio direct mappings ──────────────────────────────────────

      #[test]
      fn default_aspect_ratio_is_none() {
        // No aspect ratio specified → t2i_aspect_ratio is None.
        assert_t2i_for_aspect_ratio(None, |plan| {
          assert!(plan.t2i_aspect_ratio.is_none());
        });
      }

      #[test]
      fn square_yields_one_by_one() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::Square), |plan| {
          assert!(matches!(
            plan.t2i_aspect_ratio,
            Some(Gemini25FlashTextToImageAspectRatio::OneByOne)
          ));
        });
      }

      #[test]
      fn square_hd_yields_one_by_one() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::SquareHd), |plan| {
          assert!(matches!(
            plan.t2i_aspect_ratio,
            Some(Gemini25FlashTextToImageAspectRatio::OneByOne)
          ));
        });
      }

      #[test]
      fn wide_5x4_yields_five_by_four() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::WideFiveByFour), |plan| {
          assert!(matches!(
            plan.t2i_aspect_ratio,
            Some(Gemini25FlashTextToImageAspectRatio::FiveByFour)
          ));
        });
      }

      #[test]
      fn wide_4x3_yields_four_by_three() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::WideFourByThree), |plan| {
          assert!(matches!(
            plan.t2i_aspect_ratio,
            Some(Gemini25FlashTextToImageAspectRatio::FourByThree)
          ));
        });
      }

      #[test]
      fn wide_3x2_yields_three_by_two() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::WideThreeByTwo), |plan| {
          assert!(matches!(
            plan.t2i_aspect_ratio,
            Some(Gemini25FlashTextToImageAspectRatio::ThreeByTwo)
          ));
        });
      }

      #[test]
      fn wide_16x9_yields_sixteen_by_nine() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::WideSixteenByNine), |plan| {
          assert!(matches!(
            plan.t2i_aspect_ratio,
            Some(Gemini25FlashTextToImageAspectRatio::SixteenByNine)
          ));
        });
      }

      #[test]
      fn wide_alias_yields_sixteen_by_nine() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::Wide), |plan| {
          assert!(matches!(
            plan.t2i_aspect_ratio,
            Some(Gemini25FlashTextToImageAspectRatio::SixteenByNine)
          ));
        });
      }

      #[test]
      fn wide_21x9_yields_twenty_one_by_nine() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::WideTwentyOneByNine), |plan| {
          assert!(matches!(
            plan.t2i_aspect_ratio,
            Some(Gemini25FlashTextToImageAspectRatio::TwentyOneByNine)
          ));
        });
      }

      #[test]
      fn tall_4x5_yields_four_by_five() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::TallFourByFive), |plan| {
          assert!(matches!(
            plan.t2i_aspect_ratio,
            Some(Gemini25FlashTextToImageAspectRatio::FourByFive)
          ));
        });
      }

      #[test]
      fn tall_3x4_yields_three_by_four() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::TallThreeByFour), |plan| {
          assert!(matches!(
            plan.t2i_aspect_ratio,
            Some(Gemini25FlashTextToImageAspectRatio::ThreeByFour)
          ));
        });
      }

      #[test]
      fn tall_2x3_yields_two_by_three() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::TallTwoByThree), |plan| {
          assert!(matches!(
            plan.t2i_aspect_ratio,
            Some(Gemini25FlashTextToImageAspectRatio::TwoByThree)
          ));
        });
      }

      #[test]
      fn tall_9x16_yields_nine_by_sixteen() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::TallNineBySixteen), |plan| {
          assert!(matches!(
            plan.t2i_aspect_ratio,
            Some(Gemini25FlashTextToImageAspectRatio::NineBySixteen)
          ));
        });
      }

      #[test]
      fn tall_alias_yields_nine_by_sixteen() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::Tall), |plan| {
          assert!(matches!(
            plan.t2i_aspect_ratio,
            Some(Gemini25FlashTextToImageAspectRatio::NineBySixteen)
          ));
        });
      }

      // ── Auto* fallbacks (Auto is not valid for t2i; falls back to square)

      #[test]
      fn auto_yields_one_by_one() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::Auto), |plan| {
          assert!(matches!(
            plan.t2i_aspect_ratio,
            Some(Gemini25FlashTextToImageAspectRatio::OneByOne)
          ));
        });
      }

      #[test]
      fn auto_2k_yields_one_by_one() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::Auto2k), |plan| {
          assert!(matches!(
            plan.t2i_aspect_ratio,
            Some(Gemini25FlashTextToImageAspectRatio::OneByOne)
          ));
        });
      }

      #[test]
      fn auto_4k_yields_one_by_one() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::Auto4k), |plan| {
          assert!(matches!(
            plan.t2i_aspect_ratio,
            Some(Gemini25FlashTextToImageAspectRatio::OneByOne)
          ));
        });
      }

      // ── Num images mapping ────────────────────────────────────────────────

      #[test]
      fn default_batch_count_is_one() {
        assert_t2i_for_batch(None, |plan| {
          assert!(matches!(plan.num_images, FalNbNumImages::One));
        });
      }

      #[test]
      fn batch_of_one_yields_one() {
        assert_t2i_for_batch(Some(1), |plan| {
          assert!(matches!(plan.num_images, FalNbNumImages::One));
        });
      }

      #[test]
      fn batch_of_two_yields_two() {
        assert_t2i_for_batch(Some(2), |plan| {
          assert!(matches!(plan.num_images, FalNbNumImages::Two));
        });
      }

      #[test]
      fn batch_of_three_yields_three() {
        assert_t2i_for_batch(Some(3), |plan| {
          assert!(matches!(plan.num_images, FalNbNumImages::Three));
        });
      }

      #[test]
      fn batch_of_four_yields_four() {
        assert_t2i_for_batch(Some(4), |plan| {
          assert!(matches!(plan.num_images, FalNbNumImages::Four));
        });
      }

      #[test]
      fn batch_above_four_clamps_to_four() {
        assert_t2i_for_batch(Some(9), |plan| {
          assert!(matches!(plan.num_images, FalNbNumImages::Four));
        });
      }

      // ── Prompt passthrough ────────────────────────────────────────────────

      #[test]
      fn prompt_is_passed_through() {
        with_text_plan(&make_request(Some("a corgi in a hat"), None, Some(1), None), |plan| {
          assert_eq!(plan.prompt, Some("a corgi in a hat"));
        });
      }

      #[test]
      fn missing_prompt_is_none() {
        with_text_plan(&make_request(None, None, Some(1), None), |plan| {
          assert_eq!(plan.prompt, None);
        });
      }
    }

    mod edit {
      use super::*;

      fn assert_edit_for_aspect_ratio<F: FnOnce(&PlanFalNanoBanana<'_>)>(
        ar: Option<CommonAspectRatio>,
        assertion: F,
      ) {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), ar, Some(1), Some(tokens)),
          &hydration,
          assertion,
        );
      }

      fn assert_edit_for_batch<F: FnOnce(&PlanFalNanoBanana<'_>)>(
        batch: Option<u16>,
        assertion: F,
      ) {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), None, batch, Some(tokens)),
          &hydration,
          assertion,
        );
      }

      // ── Mode detection / image-url passthrough ────────────────────────────

      #[test]
      fn edit_mode_populates_image_urls() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), None, Some(1), Some(tokens)),
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
          &make_request(Some("p"), None, Some(1), Some(tokens)),
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
          &make_request(Some("p"), None, Some(1), Some(tokens)),
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
          &make_request(Some("p"), None, Some(1), Some(tokens.clone())),
          &hydration,
          |plan| {
            // Order should be preserved (token order in → URL order out).
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
            Some(Gemini25FlashEditAspectRatio::OneByOne)
          ));
        });
      }

      #[test]
      fn square_hd_yields_one_by_one() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::SquareHd), |plan| {
          assert!(matches!(
            plan.edit_aspect_ratio,
            Some(Gemini25FlashEditAspectRatio::OneByOne)
          ));
        });
      }

      #[test]
      fn wide_5x4_yields_five_by_four() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::WideFiveByFour), |plan| {
          assert!(matches!(
            plan.edit_aspect_ratio,
            Some(Gemini25FlashEditAspectRatio::FiveByFour)
          ));
        });
      }

      #[test]
      fn wide_4x3_yields_four_by_three() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::WideFourByThree), |plan| {
          assert!(matches!(
            plan.edit_aspect_ratio,
            Some(Gemini25FlashEditAspectRatio::FourByThree)
          ));
        });
      }

      #[test]
      fn wide_3x2_yields_three_by_two() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::WideThreeByTwo), |plan| {
          assert!(matches!(
            plan.edit_aspect_ratio,
            Some(Gemini25FlashEditAspectRatio::ThreeByTwo)
          ));
        });
      }

      #[test]
      fn wide_16x9_yields_sixteen_by_nine() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::WideSixteenByNine), |plan| {
          assert!(matches!(
            plan.edit_aspect_ratio,
            Some(Gemini25FlashEditAspectRatio::SixteenByNine)
          ));
        });
      }

      #[test]
      fn wide_alias_yields_sixteen_by_nine() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::Wide), |plan| {
          assert!(matches!(
            plan.edit_aspect_ratio,
            Some(Gemini25FlashEditAspectRatio::SixteenByNine)
          ));
        });
      }

      #[test]
      fn wide_21x9_yields_twenty_one_by_nine() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::WideTwentyOneByNine), |plan| {
          assert!(matches!(
            plan.edit_aspect_ratio,
            Some(Gemini25FlashEditAspectRatio::TwentyOneByNine)
          ));
        });
      }

      #[test]
      fn tall_4x5_yields_four_by_five() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::TallFourByFive), |plan| {
          assert!(matches!(
            plan.edit_aspect_ratio,
            Some(Gemini25FlashEditAspectRatio::FourByFive)
          ));
        });
      }

      #[test]
      fn tall_3x4_yields_three_by_four() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::TallThreeByFour), |plan| {
          assert!(matches!(
            plan.edit_aspect_ratio,
            Some(Gemini25FlashEditAspectRatio::ThreeByFour)
          ));
        });
      }

      #[test]
      fn tall_2x3_yields_two_by_three() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::TallTwoByThree), |plan| {
          assert!(matches!(
            plan.edit_aspect_ratio,
            Some(Gemini25FlashEditAspectRatio::TwoByThree)
          ));
        });
      }

      #[test]
      fn tall_9x16_yields_nine_by_sixteen() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::TallNineBySixteen), |plan| {
          assert!(matches!(
            plan.edit_aspect_ratio,
            Some(Gemini25FlashEditAspectRatio::NineBySixteen)
          ));
        });
      }

      #[test]
      fn tall_alias_yields_nine_by_sixteen() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::Tall), |plan| {
          assert!(matches!(
            plan.edit_aspect_ratio,
            Some(Gemini25FlashEditAspectRatio::NineBySixteen)
          ));
        });
      }

      // ── Auto* maps to Auto in edit mode (unlike t2i) ──────────────────────

      #[test]
      fn auto_yields_auto() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::Auto), |plan| {
          assert!(matches!(
            plan.edit_aspect_ratio,
            Some(Gemini25FlashEditAspectRatio::Auto)
          ));
        });
      }

      #[test]
      fn auto_2k_yields_auto() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::Auto2k), |plan| {
          assert!(matches!(
            plan.edit_aspect_ratio,
            Some(Gemini25FlashEditAspectRatio::Auto)
          ));
        });
      }

      #[test]
      fn auto_4k_yields_auto() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::Auto4k), |plan| {
          assert!(matches!(
            plan.edit_aspect_ratio,
            Some(Gemini25FlashEditAspectRatio::Auto)
          ));
        });
      }

      // ── Num images mapping ────────────────────────────────────────────────

      #[test]
      fn default_batch_count_is_one() {
        assert_edit_for_batch(None, |plan| {
          assert!(matches!(plan.num_images, FalNbNumImages::One));
        });
      }

      #[test]
      fn batch_of_one_yields_one() {
        assert_edit_for_batch(Some(1), |plan| {
          assert!(matches!(plan.num_images, FalNbNumImages::One));
        });
      }

      #[test]
      fn batch_of_two_yields_two() {
        assert_edit_for_batch(Some(2), |plan| {
          assert!(matches!(plan.num_images, FalNbNumImages::Two));
        });
      }

      #[test]
      fn batch_of_three_yields_three() {
        assert_edit_for_batch(Some(3), |plan| {
          assert!(matches!(plan.num_images, FalNbNumImages::Three));
        });
      }

      #[test]
      fn batch_of_four_yields_four() {
        assert_edit_for_batch(Some(4), |plan| {
          assert!(matches!(plan.num_images, FalNbNumImages::Four));
        });
      }

      #[test]
      fn batch_above_four_clamps_to_four() {
        assert_edit_for_batch(Some(9), |plan| {
          assert!(matches!(plan.num_images, FalNbNumImages::Four));
        });
      }

      // ── Prompt passthrough ────────────────────────────────────────────────

      #[test]
      fn prompt_is_passed_through() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("make it shiny"), None, Some(1), Some(tokens)),
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
          &make_request(None, None, Some(1), Some(tokens)),
          &hydration,
          |plan| {
            assert_eq!(plan.prompt, None);
          },
        );
      }
    }
  }
}
