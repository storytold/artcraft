use crate::generate::generate_splat::plan::artcraft::plan_generate_splat_artcraft_marble_0p1_mini::PlanArtcraftMarble0p1Mini;
use crate::generate::generate_splat::splat_generation_cost_estimate::SplatGenerationCostEstimate;
use world_labs_api::api::api_types::world_labs_model::WorldLabsModel;
use world_labs_api::pricing::check_pricing::{calculate_cost, InputType};

pub(crate) fn estimate_splat_cost_artcraft_marble_0p1_mini(
  plan: &PlanArtcraftMarble0p1Mini<'_>,
) -> SplatGenerationCostEstimate {
  let input_type = if plan.reference_image.is_some() {
    InputType::ImageNonPanorama
  } else {
    InputType::Text
  };

  let cost = calculate_cost(WorldLabsModel::Marble0p1Mini, input_type);
  let cost_in_usd_cents = cost.us_dollar_cents as u64;

  SplatGenerationCostEstimate {
    cost_in_credits: Some(cost_in_usd_cents),
    cost_in_usd_cents: Some(cost_in_usd_cents),
    is_free: false,
    is_unlimited: false,
    is_rate_limited: false,
    has_watermark: false,
  }
}

#[cfg(test)]
mod tests {
  use crate::api::common_splat_model::CommonSplatModel;
  use crate::api::provider::Provider;
  use crate::generate::generate_splat::generate_splat_request::GenerateSplatRequest;

  use tokens::tokens::media_files::MediaFileToken;

  fn estimate_usd_cents(prompt: Option<&str>, image_tokens: Option<&Vec<MediaFileToken>>) -> u64 {
    let request = GenerateSplatRequest {
      model: CommonSplatModel::Marble0p1Mini,
      provider: Provider::Artcraft,
      prompt,
      reference_images: image_tokens.map(crate::api::image_list_ref::ImageListRef::MediaFileTokens),
      idempotency_token: None,
    };
    request.build()
      .expect("build should succeed")
      .estimate_costs()
      .cost_in_usd_cents
      .expect("cost_in_usd_cents should be present")
  }

  #[test]
  fn test_estimate_cost_text_only() {
    let cost = estimate_usd_cents(Some("a room"), None);
    assert_eq!(cost, 18); // 230 credits → 18 cents
  }

  #[test]
  fn test_estimate_cost_no_image_no_prompt() {
    let cost = estimate_usd_cents(None, None);
    assert_eq!(cost, 18);
  }

  #[test]
  fn test_estimate_cost_image() {
    let tokens = vec![MediaFileToken("test_token".to_string())];
    let cost = estimate_usd_cents(None, Some(&tokens));
    assert_eq!(cost, 18); // 230 credits → 18 cents (same as text for mini)
  }

  #[test]
  fn test_estimate_cost_image_with_prompt() {
    let tokens = vec![MediaFileToken("test_token".to_string())];
    let cost = estimate_usd_cents(Some("a cozy room"), Some(&tokens));
    assert_eq!(cost, 18); // 230 credits → 18 cents
  }
}
