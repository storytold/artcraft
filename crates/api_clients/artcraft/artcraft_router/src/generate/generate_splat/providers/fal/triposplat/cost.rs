use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

use crate::generate::generate_splat::providers::fal::triposplat::request::FalTripoSplatRequestState;
use crate::generate::generate_splat::splat_generation_cost_estimate::SplatGenerationCostEstimate;

/// Cost math is owned by fal_client's `FalRequestCostCalculator` — the
/// router state just forwards the result so router cost ≡ fal_client cost
/// by construction. TripoSplat is flat 5¢.
#[derive(Clone, Debug)]
pub struct FalTripoSplatCostState {
  pub cost_in_usd_cents: u64,
}

impl FalTripoSplatCostState {
  pub fn from_request(request: &FalTripoSplatRequestState) -> Self {
    Self {
      cost_in_usd_cents: request.request.calculate_cost_in_cents(),
    }
  }

  pub fn estimate_cost(&self) -> SplatGenerationCostEstimate {
    SplatGenerationCostEstimate {
      cost_in_credits: Some(self.cost_in_usd_cents),
      cost_in_usd_cents: Some(self.cost_in_usd_cents),
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
  use crate::api::image_list_ref::ImageListRef;
  use crate::api::router_provider::RouterProvider;
  use crate::api::router_splat_model::RouterSplatModel;
  use crate::generate::generate_splat::generate_splat_request_builder::GenerateSplatRequestBuilder;

  #[test]
  fn flat_five_cents() {
    let builder = GenerateSplatRequestBuilder {
      model: RouterSplatModel::TripoSplat,
      provider: RouterProvider::Fal,
      reference_images: Some(ImageListRef::Urls(vec![
        "https://example.com/object.png".to_string(),
      ])),
      ..Default::default()
    };
    let cost = builder.build2()
      .expect("build should succeed")
      .estimate_cost()
      .expect("estimate should succeed")
      .cost_in_usd_cents
      .expect("cost should be present");
    assert_eq!(cost, 5);
  }
}
