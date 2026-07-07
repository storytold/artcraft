use utoipa::ToSchema;

/// Splat models available for generation.
#[derive(Copy, Clone, Debug, Eq, PartialEq, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum CommonSplatModel {
  #[serde(rename = "marble_0p1_mini")]
  Marble0p1Mini,

  #[serde(rename = "marble_0p1_plus")]
  Marble0p1Plus,

  #[serde(rename = "marble_1p0")]
  Marble1p0,

  #[serde(rename = "marble_1p0_draft")]
  Marble1p0Draft,

  #[serde(rename = "marble_1p1")]
  Marble1p1,

  #[serde(rename = "marble_1p1_plus")]
  Marble1p1Plus,
}

impl CommonSplatModel {
  pub fn to_common_model_type(&self) -> crate::common::generation::common_model_type::CommonModelType {
    use crate::common::generation::common_model_type::CommonModelType;
    match self {
      Self::Marble0p1Mini => CommonModelType::Marble0p1Mini,
      Self::Marble0p1Plus => CommonModelType::Marble0p1Plus,
      Self::Marble1p0 => CommonModelType::Marble1p0,
      Self::Marble1p0Draft => CommonModelType::Marble1p0Draft,
      Self::Marble1p1 => CommonModelType::Marble1p1,
      Self::Marble1p1Plus => CommonModelType::Marble1p1Plus,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::common::generation::common_model_type::CommonModelType;
  use crate::test_helpers::assert_serialization;

  #[test]
  fn test_serialization() {
    assert_serialization(CommonSplatModel::Marble0p1Mini, "marble_0p1_mini");
    assert_serialization(CommonSplatModel::Marble0p1Plus, "marble_0p1_plus");
    assert_serialization(CommonSplatModel::Marble1p0, "marble_1p0");
    assert_serialization(CommonSplatModel::Marble1p0Draft, "marble_1p0_draft");
    assert_serialization(CommonSplatModel::Marble1p1, "marble_1p1");
    assert_serialization(CommonSplatModel::Marble1p1Plus, "marble_1p1_plus");
  }

  #[test]
  fn test_deserialization() {
    let cases = [
      ("marble_0p1_mini", CommonSplatModel::Marble0p1Mini),
      ("marble_0p1_plus", CommonSplatModel::Marble0p1Plus),
      ("marble_1p0", CommonSplatModel::Marble1p0),
      ("marble_1p0_draft", CommonSplatModel::Marble1p0Draft),
      ("marble_1p1", CommonSplatModel::Marble1p1),
      ("marble_1p1_plus", CommonSplatModel::Marble1p1Plus),
    ];
    for (json_str, expected) in cases {
      let json = format!("\"{}\"", json_str);
      let deserialized: CommonSplatModel = serde_json::from_str(&json)
        .unwrap_or_else(|e| panic!("Failed to deserialize {:?}: {}", json_str, e));
      assert_eq!(deserialized, expected, "Failed for {:?}", json_str);
    }
  }

  #[test]
  fn test_round_trip() {
    let all = [
      CommonSplatModel::Marble0p1Mini,
      CommonSplatModel::Marble0p1Plus,
      CommonSplatModel::Marble1p0,
      CommonSplatModel::Marble1p0Draft,
      CommonSplatModel::Marble1p1,
      CommonSplatModel::Marble1p1Plus,
    ];
    for variant in all {
      let json = serde_json::to_string(&variant).unwrap();
      let deserialized: CommonSplatModel = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, deserialized, "Round-trip failed for {:?}", variant);
    }
  }

  #[test]
  fn all_splat_models_convert_to_common_model_type() {
    let models = [
      (CommonSplatModel::Marble0p1Mini, CommonModelType::Marble0p1Mini),
      (CommonSplatModel::Marble0p1Plus, CommonModelType::Marble0p1Plus),
      (CommonSplatModel::Marble1p0, CommonModelType::Marble1p0),
      (CommonSplatModel::Marble1p0Draft, CommonModelType::Marble1p0Draft),
      (CommonSplatModel::Marble1p1, CommonModelType::Marble1p1),
      (CommonSplatModel::Marble1p1Plus, CommonModelType::Marble1p1Plus),
    ];
    for (splat_model, expected) in models {
      assert_eq!(splat_model.to_common_model_type(), expected);
    }
  }
}
