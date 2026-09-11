use serde_derive::{Deserialize, Serialize};

/// Forward-compatible, self-contained API-client copy of the server's `CommonBitrate` enum.
///
/// Serialized as a string. Any value this client build does not recognize is preserved
/// verbatim in [`Unknown`], so newer server variants never break deserialization and
/// still round-trip back to the original string.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(from = "String", into = "String")]
pub enum ApiClientBitrate {
  Normal,
  High,
  /// A value not known to this client build (preserved as-is).
  Unknown(String),
}

impl From<String> for ApiClientBitrate {
  fn from(value: String) -> Self {
    match value.as_str() {
      "normal" => Self::Normal,
      "high" => Self::High,
      _ => Self::Unknown(value),
    }
  }
}

impl From<ApiClientBitrate> for String {
  fn from(value: ApiClientBitrate) -> Self {
    match value {
      ApiClientBitrate::Normal => "normal".to_string(),
      ApiClientBitrate::High => "high".to_string(),
      ApiClientBitrate::Unknown(other) => other,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn known_variant_round_trips() {
    let parsed: ApiClientBitrate = serde_json::from_str("\"normal\"").unwrap();
    assert_eq!(parsed, ApiClientBitrate::Normal);
    assert_eq!(serde_json::to_string(&parsed).unwrap(), "\"normal\"");
  }

  #[test]
  fn unknown_value_is_preserved_and_round_trips() {
    let parsed: ApiClientBitrate = serde_json::from_str("\"zzz_not_a_real_value\"").unwrap();
    assert_eq!(parsed, ApiClientBitrate::Unknown("zzz_not_a_real_value".to_string()));
    assert_eq!(serde_json::to_string(&parsed).unwrap(), "\"zzz_not_a_real_value\"");
  }

  #[test]
  fn every_known_variant_round_trips() {
    let all = [
      (ApiClientBitrate::Normal, "normal"),
      (ApiClientBitrate::High, "high"),
    ];
    for (variant, s) in all {
      assert_eq!(String::from(variant.clone()), s, "serialize mismatch for {:?}", variant);
      let parsed: ApiClientBitrate = serde_json::from_str(&format!("\"{}\"", s)).unwrap();
      assert_eq!(parsed, variant);
    }
  }
}
