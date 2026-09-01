use serde_derive::{Deserialize, Serialize};

/// Forward-compatible, self-contained API-client copy of the server's `GenerationProvider` enum.
///
/// Serialized as a string. Any value this client build does not recognize is preserved
/// verbatim in [`Unknown`], so newer server variants never break deserialization and
/// still round-trip back to the original string.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(from = "String", into = "String")]
pub enum ApiClientGenerationProvider {
  Artcraft,
  Fal,
  Grok,
  Midjourney,
  Sora,
  WorldLabs,
  Higgsfield,
  Krea,
  Leonardo,
  Magnific,
  Openart,
  Picsart,
  Pixverse,
  Runway,
  /// A value not known to this client build (preserved as-is).
  Unknown(String),
}

impl From<String> for ApiClientGenerationProvider {
  fn from(value: String) -> Self {
    match value.as_str() {
      "artcraft" => Self::Artcraft,
      "fal" => Self::Fal,
      "grok" => Self::Grok,
      "midjourney" => Self::Midjourney,
      "sora" => Self::Sora,
      "world_labs" => Self::WorldLabs,
      "higgsfield" => Self::Higgsfield,
      "krea" => Self::Krea,
      "leonardo" => Self::Leonardo,
      "magnific" => Self::Magnific,
      "openart" => Self::Openart,
      "picsart" => Self::Picsart,
      "pixverse" => Self::Pixverse,
      "runway" => Self::Runway,
      _ => Self::Unknown(value),
    }
  }
}

impl From<ApiClientGenerationProvider> for String {
  fn from(value: ApiClientGenerationProvider) -> Self {
    match value {
      ApiClientGenerationProvider::Artcraft => "artcraft".to_string(),
      ApiClientGenerationProvider::Fal => "fal".to_string(),
      ApiClientGenerationProvider::Grok => "grok".to_string(),
      ApiClientGenerationProvider::Midjourney => "midjourney".to_string(),
      ApiClientGenerationProvider::Sora => "sora".to_string(),
      ApiClientGenerationProvider::WorldLabs => "world_labs".to_string(),
      ApiClientGenerationProvider::Higgsfield => "higgsfield".to_string(),
      ApiClientGenerationProvider::Krea => "krea".to_string(),
      ApiClientGenerationProvider::Leonardo => "leonardo".to_string(),
      ApiClientGenerationProvider::Magnific => "magnific".to_string(),
      ApiClientGenerationProvider::Openart => "openart".to_string(),
      ApiClientGenerationProvider::Picsart => "picsart".to_string(),
      ApiClientGenerationProvider::Pixverse => "pixverse".to_string(),
      ApiClientGenerationProvider::Runway => "runway".to_string(),
      ApiClientGenerationProvider::Unknown(other) => other,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn known_variant_round_trips() {
    let parsed: ApiClientGenerationProvider = serde_json::from_str("\"artcraft\"").unwrap();
    assert_eq!(parsed, ApiClientGenerationProvider::Artcraft);
    assert_eq!(serde_json::to_string(&parsed).unwrap(), "\"artcraft\"");
  }

  #[test]
  fn unknown_value_is_preserved_and_round_trips() {
    let parsed: ApiClientGenerationProvider = serde_json::from_str("\"zzz_not_a_real_value\"").unwrap();
    assert_eq!(parsed, ApiClientGenerationProvider::Unknown("zzz_not_a_real_value".to_string()));
    assert_eq!(serde_json::to_string(&parsed).unwrap(), "\"zzz_not_a_real_value\"");
  }

  #[test]
  fn every_known_variant_round_trips() {
    let all = [
      (ApiClientGenerationProvider::Artcraft, "artcraft"),
      (ApiClientGenerationProvider::Fal, "fal"),
      (ApiClientGenerationProvider::Grok, "grok"),
      (ApiClientGenerationProvider::Midjourney, "midjourney"),
      (ApiClientGenerationProvider::Sora, "sora"),
      (ApiClientGenerationProvider::WorldLabs, "world_labs"),
      (ApiClientGenerationProvider::Higgsfield, "higgsfield"),
      (ApiClientGenerationProvider::Krea, "krea"),
      (ApiClientGenerationProvider::Leonardo, "leonardo"),
      (ApiClientGenerationProvider::Magnific, "magnific"),
      (ApiClientGenerationProvider::Openart, "openart"),
      (ApiClientGenerationProvider::Picsart, "picsart"),
      (ApiClientGenerationProvider::Pixverse, "pixverse"),
      (ApiClientGenerationProvider::Runway, "runway"),
    ];
    for (variant, s) in all {
      assert_eq!(String::from(variant.clone()), s, "serialize mismatch for {:?}", variant);
      let parsed: ApiClientGenerationProvider = serde_json::from_str(&format!("\"{}\"", s)).unwrap();
      assert_eq!(parsed, variant);
    }
  }
}
