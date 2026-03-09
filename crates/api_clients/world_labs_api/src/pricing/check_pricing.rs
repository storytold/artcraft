use crate::api::api_types::world_labs_model::WorldLabsModel;

/// The type of input used to generate a world.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
#[cfg_attr(test, derive(strum::EnumIter, strum::Display))]
pub enum InputType {
  Text,
  ImageNonPanorama,
  ImagePanorama,
  MultiImage,
  Video,
}

/// Cost breakdown for a World Labs generation request.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct WorldLabsCost {
  pub worldlabs_credits: u32,
  pub us_dollar_cents: u32,
}

/// Calculate the cost of a World Labs generation request.
pub fn calculate_cost(model: WorldLabsModel, input_type: InputType) -> WorldLabsCost {
  let worldlabs_credits = credits_for(model, input_type);
  let us_dollar_cents = credits_to_us_dollar_cents(worldlabs_credits);
  WorldLabsCost { worldlabs_credits, us_dollar_cents }
}

/// Returns the credit cost for a given model and input type,
/// based on the official pricing table at https://docs.worldlabs.ai/api/pricing
fn credits_for(model: WorldLabsModel, input_type: InputType) -> u32 {
  match (model, input_type) {
    // Marble 0.1-mini
    (WorldLabsModel::Marble0p1Mini, InputType::ImagePanorama) => 150,
    (WorldLabsModel::Marble0p1Mini, InputType::Text) => 230,
    (WorldLabsModel::Marble0p1Mini, InputType::ImageNonPanorama) => 230,
    (WorldLabsModel::Marble0p1Mini, InputType::MultiImage) => 250,
    (WorldLabsModel::Marble0p1Mini, InputType::Video) => 250,

    // Marble 0.1-plus
    (WorldLabsModel::Marble0p1Plus, InputType::ImagePanorama) => 1500,
    (WorldLabsModel::Marble0p1Plus, InputType::Text) => 1580,
    (WorldLabsModel::Marble0p1Plus, InputType::ImageNonPanorama) => 1580,
    (WorldLabsModel::Marble0p1Plus, InputType::MultiImage) => 1600,
    (WorldLabsModel::Marble0p1Plus, InputType::Video) => 1600,
  }
}

/// Converts credits to US dollar cents.
/// Rate: $1.00 USD per 1,250 credits → 100 cents per 1,250 credits.
fn credits_to_us_dollar_cents(credits: u32) -> u32 {
  // (credits * 100) / 1250 = (credits * 4) / 50 = (credits * 2) / 25
  // Use u64 to avoid overflow on large values.
  ((credits as u64 * 100) / 1250) as u32
}


#[cfg(test)]
mod tests {
  use super::*;
  use strum::IntoEnumIterator;

  #[test]
  fn test_pricing_table() {
    let models = [
      WorldLabsModel::Marble0p1Mini,
      WorldLabsModel::Marble0p1Plus,
    ];

    println!("\n{:<20} {:<20} {:>10} {:>12}", "Model", "Input Type", "Credits", "USD Cents");
    println!("{}", "-".repeat(65));

    for model in &models {
      for input_type in InputType::iter() {
        let cost = calculate_cost(*model, input_type);
        println!(
          "{:<20} {:<20} {:>10} {:>12}",
          model.get_model_api_name_str(),
          input_type,
          cost.worldlabs_credits,
          cost.us_dollar_cents,
        );
      }
    }
  }

  #[test]
  fn test_mini_credits() {
    assert_eq!(calculate_cost(WorldLabsModel::Marble0p1Mini, InputType::Text).worldlabs_credits, 230);
    assert_eq!(calculate_cost(WorldLabsModel::Marble0p1Mini, InputType::ImageNonPanorama).worldlabs_credits, 230);
    assert_eq!(calculate_cost(WorldLabsModel::Marble0p1Mini, InputType::ImagePanorama).worldlabs_credits, 150);
    assert_eq!(calculate_cost(WorldLabsModel::Marble0p1Mini, InputType::MultiImage).worldlabs_credits, 250);
    assert_eq!(calculate_cost(WorldLabsModel::Marble0p1Mini, InputType::Video).worldlabs_credits, 250);
  }

  #[test]
  fn test_plus_credits() {
    assert_eq!(calculate_cost(WorldLabsModel::Marble0p1Plus, InputType::Text).worldlabs_credits, 1580);
    assert_eq!(calculate_cost(WorldLabsModel::Marble0p1Plus, InputType::ImageNonPanorama).worldlabs_credits, 1580);
    assert_eq!(calculate_cost(WorldLabsModel::Marble0p1Plus, InputType::ImagePanorama).worldlabs_credits, 1500);
    assert_eq!(calculate_cost(WorldLabsModel::Marble0p1Plus, InputType::MultiImage).worldlabs_credits, 1600);
    assert_eq!(calculate_cost(WorldLabsModel::Marble0p1Plus, InputType::Video).worldlabs_credits, 1600);
  }

  #[test]
  fn test_dollar_conversion() {
    // 1250 credits = $1.00 = 100 cents
    assert_eq!(credits_to_us_dollar_cents(1250), 100);
    // 150 credits = $0.12 = 12 cents
    assert_eq!(credits_to_us_dollar_cents(150), 12);
    // 230 credits = $0.184 = 18 cents (truncated)
    assert_eq!(credits_to_us_dollar_cents(230), 18);
    // 1580 credits = $1.264 = 126 cents (truncated)
    assert_eq!(credits_to_us_dollar_cents(1580), 126);
    // 1600 credits = $1.28 = 128 cents
    assert_eq!(credits_to_us_dollar_cents(1600), 128);
  }

  #[test]
  fn test_all_combinations_have_costs() {
    let models = [
      WorldLabsModel::Marble0p1Mini,
      WorldLabsModel::Marble0p1Plus,
    ];

    for model in &models {
      for input_type in InputType::iter() {
        let cost = calculate_cost(*model, input_type);
        assert!(cost.worldlabs_credits > 0, "credits should be > 0 for {:?} {:?}", model, input_type);
        assert!(cost.us_dollar_cents > 0, "dollar cents should be > 0 for {:?} {:?}", model, input_type);
      }
    }
  }
}
