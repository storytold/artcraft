use seedance2pro_client::generate::image::generate_midjourney_v7::{
  GenerateMidjourneyV7AspectRatio, GenerateMidjourneyV7Request, KinoviMidjourneyBatchCount,
};

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::providers::kinovi::midjourney_7::draft::KinoviMidjourney7DraftState;
use crate::generate::generate_image::providers::kinovi::midjourney_7::request::KinoviMidjourney7RequestState;

/// Midjourney v7 (via Kinovi) cost state. Only `batch_count` matters for
/// pricing — Midjourney pricing is flat per task regardless of aspect
/// ratio, quality, or whether reference images were supplied.
pub struct KinoviMidjourney7CostState {
  pub batch_count: KinoviMidjourneyBatchCount,
}

impl KinoviMidjourney7CostState {
  pub fn from_request(request: &KinoviMidjourney7RequestState) -> Self {
    Self { batch_count: request.request.batch_count }
  }

  pub fn from_draft(draft: &KinoviMidjourney7DraftState) -> Self {
    Self { batch_count: draft.batch_count }
  }

  pub fn estimate_cost(&self) -> ImageGenerationCostEstimate {
    let pricing_request = GenerateMidjourneyV7Request {
      batch_count: self.batch_count,
      // Cost-irrelevant placeholders below — only `batch_count` matters.
      prompt: String::new(),
      aspect_ratio: GenerateMidjourneyV7AspectRatio::Square1x1,
      negative_prompt: None,
      stylize: None,
      weird: None,
      chaos: None,
      quality: None,
      raw_mode: false,
      reference_image_urls: None,
    };

    let costs = pricing_request.calculate_costs();
    let cost_in_credits = costs.kinovi_credits;
    let cost_in_usd_cents = costs.usd_cents_rounded_up;

    ImageGenerationCostEstimate {
      cost_in_credits: Some(cost_in_credits),
      cost_in_usd_cents: Some(cost_in_usd_cents),
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
  use super::*;
  use crate::api::image_list_ref::ImageListRef;
  use crate::api::router_image_model::RouterImageModel;
  use crate::api::router_provider::RouterProvider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
  use crate::generate::generate_image::image_generation_draft::ImageGenerationDraftRequest;
  use crate::generate::generate_image::image_generation_draft_or_request::ImageGenerationDraftOrRequest;
  use crate::generate::generate_image::image_generation_request::ImageGenerationRequest;

  // ── Credit pricing (12 per task × batch) ──

  mod credits {
    use super::*;

    #[test]
    fn batch_one_is_twelve_credits() {
      assert_eq!(credits_for(KinoviMidjourneyBatchCount::One), 12);
    }

    #[test]
    fn batch_two_is_twentyfour_credits() {
      assert_eq!(credits_for(KinoviMidjourneyBatchCount::Two), 24);
    }

    #[test]
    fn batch_four_is_fortyeight_credits() {
      assert_eq!(credits_for(KinoviMidjourneyBatchCount::Four), 48);
    }
  }

  // ── USD pricing (243 credits per dollar; rounded up) ──

  mod usd {
    use super::*;

    #[test]
    fn batch_one_is_five_cents() {
      // 12/243 × 100 = 4.94 → 5¢
      assert_eq!(usd_cents_for(KinoviMidjourneyBatchCount::One), 5); // rounds UP
    }

    #[test]
    fn batch_two_is_ten_cents() {
      // 24/243 × 100 = 9.88 → 10¢
      assert_eq!(usd_cents_for(KinoviMidjourneyBatchCount::Two), 10); // rounds UP
    }

    #[test]
    fn batch_four_is_twenty_cents() {
      // 48/243 × 100 = 19.75 → 20¢
      assert_eq!(usd_cents_for(KinoviMidjourneyBatchCount::Four), 20);
    }
  }

  // ── Flags ──

  #[test]
  fn flags_are_correct() {
    let cost = KinoviMidjourney7CostState { batch_count: KinoviMidjourneyBatchCount::One }
      .estimate_cost();
    assert!(!cost.is_free);
    assert!(!cost.is_unlimited);
    assert!(!cost.is_rate_limited);
    assert!(!cost.has_watermark);
    assert_eq!(cost.failures_are_refunded, None);
  }

  // ── from_request / from_draft ──

  mod source_state_round_trip {
    use super::*;

    #[test]
    fn from_request_picks_up_batch_count() {
      let req = build_request_no_image_inputs(2);
      let state = KinoviMidjourney7CostState::from_request(&req);
      assert_eq!(state.batch_count, KinoviMidjourneyBatchCount::Two);
      assert_eq!(state.estimate_cost().cost_in_credits, Some(24));
    }

    #[test]
    fn from_draft_picks_up_batch_count() {
      let draft = build_draft_with_image_inputs(4);
      let state = KinoviMidjourney7CostState::from_draft(&draft);
      assert_eq!(state.batch_count, KinoviMidjourneyBatchCount::Four);
      assert_eq!(state.estimate_cost().cost_in_credits, Some(48));
    }

    #[test]
    fn draft_and_request_produce_same_cost() {
      // Same batch count → same cost, regardless of draft vs request path.
      let req_cost = KinoviMidjourney7CostState::from_request(&build_request_no_image_inputs(2))
        .estimate_cost();
      let draft_cost = KinoviMidjourney7CostState::from_draft(&build_draft_with_image_inputs(2))
        .estimate_cost();
      assert_eq!(req_cost.cost_in_credits, draft_cost.cost_in_credits);
      assert_eq!(req_cost.cost_in_usd_cents, draft_cost.cost_in_usd_cents);
    }
  }

  // ── Helpers ──

  fn credits_for(batch: KinoviMidjourneyBatchCount) -> u64 {
    KinoviMidjourney7CostState { batch_count: batch }
      .estimate_cost().cost_in_credits.unwrap()
  }

  fn usd_cents_for(batch: KinoviMidjourneyBatchCount) -> u64 {
    KinoviMidjourney7CostState { batch_count: batch }
      .estimate_cost().cost_in_usd_cents.unwrap()
  }

  fn base_builder() -> GenerateImageRequestBuilder {
    GenerateImageRequestBuilder {
      model: RouterImageModel::Midjourney7,
      provider: RouterProvider::Seedance2Pro,
      prompt: Some("test".to_string()),
      image_inputs: None,
      resolution: None,
      aspect_ratio: None,
      quality: None,
      image_batch_count: None,
      horizontal_angle: None,
      vertical_angle: None,
      zoom: None,
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      generation_mode_mismatch_strategy: None,
      idempotency_token: None,
    }
  }

  fn build_request_no_image_inputs(batch_count: u16) -> KinoviMidjourney7RequestState {
    let builder = GenerateImageRequestBuilder {
      image_batch_count: Some(batch_count),
      ..base_builder()
    };
    match builder.build2().expect("build2") {
      ImageGenerationDraftOrRequest::Request(ImageGenerationRequest::KinoviMidjourney7(r)) => r,
      _ => panic!("expected Request"),
    }
  }

  fn build_draft_with_image_inputs(batch_count: u16) -> KinoviMidjourney7DraftState {
    let builder = GenerateImageRequestBuilder {
      image_batch_count: Some(batch_count),
      image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/ref.png".to_string()])),
      ..base_builder()
    };
    match builder.build2().expect("build2") {
      ImageGenerationDraftOrRequest::Draft(ImageGenerationDraftRequest::KinoviMidjourney7(d)) => d,
      _ => panic!("expected Draft"),
    }
  }
}
