use worldlabs_api_client::api::api_types::world_labs_model::WorldLabsModel;
use worldlabs_api_client::pricing::check_pricing::{calculate_cost, InputType};

use crate::generate::generate_splat::providers::worldlabs::marble_1p1_plus::draft::WorldLabsMarble1p1PlusDraftState;
use crate::generate::generate_splat::providers::worldlabs::marble_1p1_plus::request::WorldLabsMarble1p1PlusRequestState;
use crate::generate::generate_splat::splat_generation_cost_estimate::SplatGenerationCostEstimate;

const MODEL: WorldLabsModel = WorldLabsModel::Marble1p1Plus;

/// Cost math is owned by worldlabs_api_client's pricing table — the router
/// just forwards the result so router cost ≡ provider cost by construction.
#[derive(Clone, Debug)]
pub struct WorldLabsMarble1p1PlusCostState {
  pub input_type: InputType,
}

impl WorldLabsMarble1p1PlusCostState {
  pub fn from_request(request: &WorldLabsMarble1p1PlusRequestState) -> Self {
    Self { input_type: request.request.input_type() }
  }

  pub fn from_draft(draft: &WorldLabsMarble1p1PlusDraftState) -> Self {
    Self { input_type: draft.draft.input_type() }
  }

  pub fn estimate_cost(&self) -> SplatGenerationCostEstimate {
    let cost = calculate_cost(MODEL, self.input_type);
    SplatGenerationCostEstimate {
      cost_in_credits: Some(cost.worldlabs_credits as u64),
      cost_in_usd_cents: Some(cost.us_dollar_cents as u64),
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

  use crate::api::image_list_ref::ImageListRef;
  use crate::api::router_provider::RouterProvider;
  use crate::api::router_splat_model::RouterSplatModel;
  use crate::api::video_ref::VideoRef;
  use crate::generate::generate_splat::generate_splat_request_builder::GenerateSplatRequestBuilder;

  #[test]
  fn text_is_246_cents() {
    assert_eq!(estimate_usd_cents(text_builder()), 246);
  }

  #[test]
  fn single_image_is_246_cents() {
    assert_eq!(estimate_usd_cents(single_image_builder(false)), 246);
  }

  #[test]
  fn panoramic_image_is_240_cents() {
    assert_eq!(estimate_usd_cents(single_image_builder(true)), 240);
  }

  #[test]
  fn multi_image_is_248_cents() {
    assert_eq!(estimate_usd_cents(multi_image_builder()), 248);
  }

  #[test]
  fn video_is_248_cents() {
    assert_eq!(estimate_usd_cents(video_builder()), 248);
  }

  #[test]
  fn credits_come_from_the_provider_pricing_table() {
    let estimate = text_builder().build2()
      .expect("build should succeed")
      .estimate_cost()
      .expect("estimate should succeed");
    assert_eq!(estimate.cost_in_credits, Some(3080));
  }

  // ── Helpers ──

  fn base_builder() -> GenerateSplatRequestBuilder {
    GenerateSplatRequestBuilder {
      model: RouterSplatModel::Marble1p1Plus,
      provider: RouterProvider::WorldLabs,
      ..Default::default()
    }
  }

  fn text_builder() -> GenerateSplatRequestBuilder {
    GenerateSplatRequestBuilder {
      prompt: Some("a cozy cabin in the snowy mountains".to_string()),
      ..base_builder()
    }
  }

  fn single_image_builder(is_panoramic: bool) -> GenerateSplatRequestBuilder {
    GenerateSplatRequestBuilder {
      reference_images: Some(ImageListRef::MediaFileTokens(vec![
        MediaFileToken::new("mf_image_1".to_string()),
      ])),
      is_panoramic: Some(is_panoramic),
      ..base_builder()
    }
  }

  fn multi_image_builder() -> GenerateSplatRequestBuilder {
    GenerateSplatRequestBuilder {
      reference_images: Some(ImageListRef::MediaFileTokens(vec![
        MediaFileToken::new("mf_image_1".to_string()),
        MediaFileToken::new("mf_image_2".to_string()),
      ])),
      ..base_builder()
    }
  }

  fn video_builder() -> GenerateSplatRequestBuilder {
    GenerateSplatRequestBuilder {
      reference_video: Some(VideoRef::MediaFileToken(MediaFileToken::new("mf_video".to_string()))),
      ..base_builder()
    }
  }

  fn estimate_usd_cents(builder: GenerateSplatRequestBuilder) -> u64 {
    builder.build2()
      .expect("build should succeed")
      .estimate_cost()
      .expect("estimate should succeed")
      .cost_in_usd_cents
      .expect("cost should be present")
  }
}
