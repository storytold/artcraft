/// The available World Labs generation models.
#[derive(Clone, Copy, Debug)]
pub enum WorldLabsModel {
  /// `Marble 0.1-mini` is good for quick drafts
  /// Generation time: 30-45 seconds
  /// Cost: 150-330 credits
  #[deprecated(note="Marble 0.1-mini is deprecated. Use `marble-1.0-draft` instead.")]
  Marble0p1Mini,

  /// `Marble 0.1-plus` is best for final renders
  /// Generation time: ~5 minutes,
  /// Cost: 1500-1600 credits
  #[deprecated(note="Marble 0.1-plus is deprecated. Use `marble-1.0` instead.")]
  Marble0p1Plus,

  /// marble-1.0
  Marble1p0,

  /// marble-1.0-draft
  Marble1p0Draft,

  /// marble-1.1
  Marble1p1,

  /// marble-1.1-plus
  Marble1p1Plus,
}

impl WorldLabsModel {
  /// Returns the official API name string used in HTTP requests.
  pub fn get_model_api_name_str(&self) -> &'static str {
    match self {
      Self::Marble0p1Mini => "Marble 0.1-mini",
      Self::Marble0p1Plus => "Marble 0.1-plus",
      Self::Marble1p0 => "marble-1.0",
      Self::Marble1p0Draft => "marble-1.0-draft",
      Self::Marble1p1 => "marble-1.1",
      Self::Marble1p1Plus => "marble-1.1-plus",
    }
  }

  pub fn is_deprecated(&self) -> bool {
    match self {
      Self::Marble0p1Mini | Self::Marble0p1Plus => true,
      _ => false,
    }
  }

  pub fn to_new_value(self) -> Self {
    match self {
      Self::Marble0p1Mini => Self::Marble1p0Draft,
      Self::Marble0p1Plus => Self::Marble1p0,
      _ => self,
    }
  }
}
