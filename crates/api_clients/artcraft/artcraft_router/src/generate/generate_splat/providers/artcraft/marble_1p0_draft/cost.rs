use worldlabs_api_client::pricing::check_pricing::InputType;

use crate::generate::generate_splat::providers::artcraft::cost_common::{
  artcraft_splat_cost_estimate, derive_input_type_for_pricing, ArtcraftSplatPriceTable,
};
use crate::generate::generate_splat::providers::artcraft::marble_1p0_draft::request::ArtcraftMarble1p0DraftRequestState;
use crate::generate::generate_splat::splat_generation_cost_estimate::SplatGenerationCostEstimate;

const PRICES: ArtcraftSplatPriceTable = ArtcraftSplatPriceTable {
  image_panorama: 16,
  text: 24,
  image_non_panorama: 24,
  multi_image: 26,
  video: 26,
};

/// Marble 1.0 Draft via Artcraft is flat priced by input type.
#[derive(Clone, Debug)]
pub struct ArtcraftMarble1p0DraftCostState {
  pub input_type: InputType,
}

impl ArtcraftMarble1p0DraftCostState {
  pub fn from_request(request: &ArtcraftMarble1p0DraftRequestState) -> Self {
    Self { input_type: derive_input_type_for_pricing(&request.request) }
  }

  pub fn estimate_cost(&self) -> SplatGenerationCostEstimate {
    artcraft_splat_cost_estimate(PRICES.cost_in_usd_cents(self.input_type))
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
  fn text_is_24_cents() {
    assert_eq!(estimate_usd_cents(text_builder()), 24);
  }

  #[test]
  fn single_image_is_24_cents() {
    assert_eq!(estimate_usd_cents(single_image_builder(false)), 24);
  }

  #[test]
  fn panoramic_image_is_16_cents() {
    assert_eq!(estimate_usd_cents(single_image_builder(true)), 16);
  }

  #[test]
  fn multi_image_is_26_cents() {
    assert_eq!(estimate_usd_cents(multi_image_builder()), 26);
  }

  #[test]
  fn video_is_26_cents() {
    assert_eq!(estimate_usd_cents(video_builder()), 26);
  }

  // ── Helpers ──

  fn base_builder() -> GenerateSplatRequestBuilder {
    GenerateSplatRequestBuilder {
      model: RouterSplatModel::Marble1p0Draft,
      provider: RouterProvider::Artcraft,
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
