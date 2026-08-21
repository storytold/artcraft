use serde_derive::{Deserialize, Serialize};

/// Forward-compatible, self-contained API-client copy of the server's `CommonQuality` enum.
///
/// Serialized as a string. Any value this client build does not recognize is preserved
/// verbatim in [`Unknown`], so newer server variants never break deserialization and
/// still round-trip back to the original string.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(from = "String", into = "String")]
pub enum ApiClientQuality {
  High,
  Medium,
  Low,
  /// A value not known to this client build (preserved as-is).
  Unknown(String),
}

impl From<String> for ApiClientQuality {
  fn from(value: String) -> Self {
    match value.as_str() {
      "high" => Self::High,
      "medium" => Self::Medium,
      "low" => Self::Low,
      _ => Self::Unknown(value),
    }
  }
}

impl From<ApiClientQuality> for String {
  fn from(value: ApiClientQuality) -> Self {
    match value {
      ApiClientQuality::High => "high".to_string(),
      ApiClientQuality::Medium => "medium".to_string(),
      ApiClientQuality::Low => "low".to_string(),
      ApiClientQuality::Unknown(other) => other,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn known_variant_round_trips() {
    let parsed: ApiClientQuality = serde_json::from_str("\"high\"").unwrap();
    assert_eq!(parsed, ApiClientQuality::High);
    assert_eq!(serde_json::to_string(&parsed).unwrap(), "\"high\"");
  }

  #[test]
  fn unknown_value_is_preserved_and_round_trips() {
    let parsed: ApiClientQuality = serde_json::from_str("\"zzz_not_a_real_value\"").unwrap();
    assert_eq!(parsed, ApiClientQuality::Unknown("zzz_not_a_real_value".to_string()));
    assert_eq!(serde_json::to_string(&parsed).unwrap(), "\"zzz_not_a_real_value\"");
  }

  #[test]
  fn every_known_variant_round_trips() {
    let all = [
      (ApiClientQuality::High, "high"),
      (ApiClientQuality::Medium, "medium"),
      (ApiClientQuality::Low, "low"),
    ];
    for (variant, s) in all {
      assert_eq!(String::from(variant.clone()), s, "serialize mismatch for {:?}", variant);
      let parsed: ApiClientQuality = serde_json::from_str(&format!("\"{}\"", s)).unwrap();
      assert_eq!(parsed, variant);
    }
  }
}
