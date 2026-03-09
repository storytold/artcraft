/// The available World Labs generation models.
#[derive(Clone, Copy, Debug)]
pub enum WorldLabsModel {
  /// `Marble 0.1-mini` is good for quick drafts
  /// Generation time: 30-45 seconds
  /// Cost: 150-330 credits
  Marble0p1Mini,

  /// `Marble 0.1-plus` is best for final renders
  /// Generation time: ~5 minutes,
  /// Cost: 1500-1600 credits
  Marble0p1Plus,
}

impl WorldLabsModel {
  /// Returns the official API name string used in HTTP requests.
  pub fn get_model_api_name_str(&self) -> &'static str {
    match self {
      Self::Marble0p1Mini => "Marble 0.1-mini",
      Self::Marble0p1Plus => "Marble 0.1-plus",
    }
  }
}
