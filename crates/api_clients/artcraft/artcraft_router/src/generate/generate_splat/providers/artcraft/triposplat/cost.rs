use crate::generate::generate_splat::providers::artcraft::cost_common::artcraft_splat_cost_estimate;
use crate::generate::generate_splat::providers::artcraft::triposplat::request::ArtcraftTripoSplatRequestState;
use crate::generate::generate_splat::splat_generation_cost_estimate::SplatGenerationCostEstimate;

const FLAT_COST_IN_USD_CENTS: u64 = 7;

/// TripoSplat via Artcraft is flat priced: it takes a single input image and
/// no option affects the price.
#[derive(Clone, Debug)]
pub struct ArtcraftTripoSplatCostState {
  pub cost_in_usd_cents: u64,
}

impl ArtcraftTripoSplatCostState {
  pub fn from_request(_request: &ArtcraftTripoSplatRequestState) -> Self {
    Self { cost_in_usd_cents: FLAT_COST_IN_USD_CENTS }
  }

  pub fn estimate_cost(&self) -> SplatGenerationCostEstimate {
    artcraft_splat_cost_estimate(self.cost_in_usd_cents)
  }
}

#[cfg(test)]
mod tests {
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::image_list_ref::ImageListRef;
  use crate::api::router_provider::RouterProvider;
  use crate::api::router_splat_model::RouterSplatModel;
  use crate::generate::generate_splat::generate_splat_request_builder::GenerateSplatRequestBuilder;

  #[test]
  fn flat_seven_cents() {
    let builder = GenerateSplatRequestBuilder {
      model: RouterSplatModel::TripoSplat,
      provider: RouterProvider::Artcraft,
      reference_images: Some(ImageListRef::MediaFileTokens(vec![
        MediaFileToken::new("mf_test123".to_string()),
      ])),
      ..Default::default()
    };
    let cost = builder.build2()
      .expect("build should succeed")
      .estimate_cost()
      .expect("estimate should succeed")
      .cost_in_usd_cents
      .expect("cost should be present");
    assert_eq!(cost, 7);
  }
}
