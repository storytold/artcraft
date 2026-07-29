use serde_derive::{Deserialize, Serialize};

/// Forward-compatible, self-contained API-client copy of the server's `CommonResolution` enum.
///
/// Serialized as a string. Any value this client build does not recognize is preserved
/// verbatim in [`Unknown`], so newer server variants never break deserialization and
/// still round-trip back to the original string.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(from = "String", into = "String")]
pub enum ApiClientResolution {
  OneK,
  TwoK,
  ThreeK,
  FourK,
  HalfK,
  FourEightyP,
  SevenTwentyP,
  TenEightyP,
  /// A value not known to this client build (preserved as-is).
  Unknown(String),
}

impl From<String> for ApiClientResolution {
  fn from(value: String) -> Self {
    match value.as_str() {
      "one_k" => Self::OneK,
      "two_k" => Self::TwoK,
      "three_k" => Self::ThreeK,
      "four_k" => Self::FourK,
      "half_k" => Self::HalfK,
      "four_eighty_p" => Self::FourEightyP,
      "seven_twenty_p" => Self::SevenTwentyP,
      "ten_eighty_p" => Self::TenEightyP,
      _ => Self::Unknown(value),
    }
  }
}

impl From<ApiClientResolution> for String {
  fn from(value: ApiClientResolution) -> Self {
    match value {
      ApiClientResolution::OneK => "one_k".to_string(),
      ApiClientResolution::TwoK => "two_k".to_string(),
      ApiClientResolution::ThreeK => "three_k".to_string(),
      ApiClientResolution::FourK => "four_k".to_string(),
      ApiClientResolution::HalfK => "half_k".to_string(),
      ApiClientResolution::FourEightyP => "four_eighty_p".to_string(),
      ApiClientResolution::SevenTwentyP => "seven_twenty_p".to_string(),
      ApiClientResolution::TenEightyP => "ten_eighty_p".to_string(),
      ApiClientResolution::Unknown(other) => other,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn known_variant_round_trips() {
    let parsed: ApiClientResolution = serde_json::from_str("\"one_k\"").unwrap();
    assert_eq!(parsed, ApiClientResolution::OneK);
    assert_eq!(serde_json::to_string(&parsed).unwrap(), "\"one_k\"");
  }

  #[test]
  fn unknown_value_is_preserved_and_round_trips() {
    let parsed: ApiClientResolution = serde_json::from_str("\"zzz_not_a_real_value\"").unwrap();
    assert_eq!(parsed, ApiClientResolution::Unknown("zzz_not_a_real_value".to_string()));
    assert_eq!(serde_json::to_string(&parsed).unwrap(), "\"zzz_not_a_real_value\"");
  }

  #[test]
  fn every_known_variant_round_trips() {
    let all = [
      (ApiClientResolution::OneK, "one_k"),
      (ApiClientResolution::TwoK, "two_k"),
      (ApiClientResolution::ThreeK, "three_k"),
      (ApiClientResolution::FourK, "four_k"),
      (ApiClientResolution::HalfK, "half_k"),
      (ApiClientResolution::FourEightyP, "four_eighty_p"),
      (ApiClientResolution::SevenTwentyP, "seven_twenty_p"),
      (ApiClientResolution::TenEightyP, "ten_eighty_p"),
    ];
    for (variant, s) in all {
      assert_eq!(String::from(variant.clone()), s, "serialize mismatch for {:?}", variant);
      let parsed: ApiClientResolution = serde_json::from_str(&format!("\"{}\"", s)).unwrap();
      assert_eq!(parsed, variant);
    }
  }
}
