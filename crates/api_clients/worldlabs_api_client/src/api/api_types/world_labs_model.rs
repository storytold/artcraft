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

#[cfg(test)]
mod tests {
  use super::*;

  mod api_name {
    use super::*;

    #[allow(deprecated)]
    #[test]
    fn marble_0p1_mini() {
      assert_eq!(WorldLabsModel::Marble0p1Mini.get_model_api_name_str(), "Marble 0.1-mini");
    }

    #[allow(deprecated)]
    #[test]
    fn marble_0p1_plus() {
      assert_eq!(WorldLabsModel::Marble0p1Plus.get_model_api_name_str(), "Marble 0.1-plus");
    }

    #[test]
    fn marble_1p0() {
      assert_eq!(WorldLabsModel::Marble1p0.get_model_api_name_str(), "marble-1.0");
    }

    #[test]
    fn marble_1p0_draft() {
      assert_eq!(WorldLabsModel::Marble1p0Draft.get_model_api_name_str(), "marble-1.0-draft");
    }

    #[test]
    fn marble_1p1() {
      assert_eq!(WorldLabsModel::Marble1p1.get_model_api_name_str(), "marble-1.1");
    }

    #[test]
    fn marble_1p1_plus() {
      assert_eq!(WorldLabsModel::Marble1p1Plus.get_model_api_name_str(), "marble-1.1-plus");
    }
  }

  mod is_deprecated {
    use super::*;

    #[allow(deprecated)]
    #[test]
    fn marble_0p1_mini_is_deprecated() {
      assert!(WorldLabsModel::Marble0p1Mini.is_deprecated());
    }

    #[allow(deprecated)]
    #[test]
    fn marble_0p1_plus_is_deprecated() {
      assert!(WorldLabsModel::Marble0p1Plus.is_deprecated());
    }

    #[test]
    fn marble_1p0_is_not_deprecated() {
      assert!(!WorldLabsModel::Marble1p0.is_deprecated());
    }

    #[test]
    fn marble_1p0_draft_is_not_deprecated() {
      assert!(!WorldLabsModel::Marble1p0Draft.is_deprecated());
    }

    #[test]
    fn marble_1p1_is_not_deprecated() {
      assert!(!WorldLabsModel::Marble1p1.is_deprecated());
    }

    #[test]
    fn marble_1p1_plus_is_not_deprecated() {
      assert!(!WorldLabsModel::Marble1p1Plus.is_deprecated());
    }
  }

  mod to_new_value {
    use super::*;

    #[allow(deprecated)]
    #[test]
    fn marble_0p1_mini_maps_to_1p0_draft() {
      let new = WorldLabsModel::Marble0p1Mini.to_new_value();
      assert_eq!(new.get_model_api_name_str(), "marble-1.0-draft");
      assert!(!new.is_deprecated());
    }

    #[allow(deprecated)]
    #[test]
    fn marble_0p1_plus_maps_to_1p0() {
      let new = WorldLabsModel::Marble0p1Plus.to_new_value();
      assert_eq!(new.get_model_api_name_str(), "marble-1.0");
      assert!(!new.is_deprecated());
    }

    #[test]
    fn marble_1p0_stays_as_1p0() {
      let new = WorldLabsModel::Marble1p0.to_new_value();
      assert_eq!(new.get_model_api_name_str(), "marble-1.0");
    }

    #[test]
    fn marble_1p0_draft_stays_as_1p0_draft() {
      let new = WorldLabsModel::Marble1p0Draft.to_new_value();
      assert_eq!(new.get_model_api_name_str(), "marble-1.0-draft");
    }

    #[test]
    fn marble_1p1_stays_as_1p1() {
      let new = WorldLabsModel::Marble1p1.to_new_value();
      assert_eq!(new.get_model_api_name_str(), "marble-1.1");
    }

    #[test]
    fn marble_1p1_plus_stays_as_1p1_plus() {
      let new = WorldLabsModel::Marble1p1Plus.to_new_value();
      assert_eq!(new.get_model_api_name_str(), "marble-1.1-plus");
    }

    #[test]
    fn new_models_are_not_deprecated_after_conversion() {
      for model in [
        WorldLabsModel::Marble1p0,
        WorldLabsModel::Marble1p0Draft,
        WorldLabsModel::Marble1p1,
        WorldLabsModel::Marble1p1Plus,
      ] {
        let new = model.to_new_value();
        assert!(!new.is_deprecated(), "{:?} should not be deprecated after to_new_value", model);
      }
    }
  }
}
