use serde_derive::{Deserialize, Serialize};

/// Forward-compatible, self-contained API-client copy of the server's `ModelCreator` enum.
///
/// Serialized as a string. Any value this client build does not recognize is preserved
/// verbatim in [`Unknown`], so newer server variants never break deserialization and
/// still round-trip back to the original string.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(from = "String", into = "String")]
pub enum ApiClientModelCreator {
  Alibaba,
  ArtCraft,
  BlackForestLabs,
  Bytedance,
  Fal,
  Google,
  Grok,
  Hailuo,
  Higgsfield,
  Kling,
  Krea,
  Midjourney,
  OpenAi,
  OpenArt,
  Recraft,
  Replicate,
  Runway,
  Stability,
  Tencent,
  TensorArt,
  Vidu,
  WorldLabs,
  /// A value not known to this client build (preserved as-is).
  Unknown(String),
}

impl From<String> for ApiClientModelCreator {
  fn from(value: String) -> Self {
    match value.as_str() {
      "alibaba" => Self::Alibaba,
      "artcraft" => Self::ArtCraft,
      "black_forest_labs" => Self::BlackForestLabs,
      "bytedance" => Self::Bytedance,
      "fal" => Self::Fal,
      "google" => Self::Google,
      "grok" => Self::Grok,
      "hailuo" => Self::Hailuo,
      "higgsfield" => Self::Higgsfield,
      "kling" => Self::Kling,
      "krea" => Self::Krea,
      "midjourney" => Self::Midjourney,
      "open_ai" => Self::OpenAi,
      "open_art" => Self::OpenArt,
      "recraft" => Self::Recraft,
      "replicate" => Self::Replicate,
      "runway" => Self::Runway,
      "stability" => Self::Stability,
      "tencent" => Self::Tencent,
      "tensor_art" => Self::TensorArt,
      "vidu" => Self::Vidu,
      "world_labs" => Self::WorldLabs,
      _ => Self::Unknown(value),
    }
  }
}

impl From<ApiClientModelCreator> for String {
  fn from(value: ApiClientModelCreator) -> Self {
    match value {
      ApiClientModelCreator::Alibaba => "alibaba".to_string(),
      ApiClientModelCreator::ArtCraft => "artcraft".to_string(),
      ApiClientModelCreator::BlackForestLabs => "black_forest_labs".to_string(),
      ApiClientModelCreator::Bytedance => "bytedance".to_string(),
      ApiClientModelCreator::Fal => "fal".to_string(),
      ApiClientModelCreator::Google => "google".to_string(),
      ApiClientModelCreator::Grok => "grok".to_string(),
      ApiClientModelCreator::Hailuo => "hailuo".to_string(),
      ApiClientModelCreator::Higgsfield => "higgsfield".to_string(),
      ApiClientModelCreator::Kling => "kling".to_string(),
      ApiClientModelCreator::Krea => "krea".to_string(),
      ApiClientModelCreator::Midjourney => "midjourney".to_string(),
      ApiClientModelCreator::OpenAi => "open_ai".to_string(),
      ApiClientModelCreator::OpenArt => "open_art".to_string(),
      ApiClientModelCreator::Recraft => "recraft".to_string(),
      ApiClientModelCreator::Replicate => "replicate".to_string(),
      ApiClientModelCreator::Runway => "runway".to_string(),
      ApiClientModelCreator::Stability => "stability".to_string(),
      ApiClientModelCreator::Tencent => "tencent".to_string(),
      ApiClientModelCreator::TensorArt => "tensor_art".to_string(),
      ApiClientModelCreator::Vidu => "vidu".to_string(),
      ApiClientModelCreator::WorldLabs => "world_labs".to_string(),
      ApiClientModelCreator::Unknown(other) => other,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn known_variant_round_trips() {
    let parsed: ApiClientModelCreator = serde_json::from_str("\"alibaba\"").unwrap();
    assert_eq!(parsed, ApiClientModelCreator::Alibaba);
    assert_eq!(serde_json::to_string(&parsed).unwrap(), "\"alibaba\"");
  }

  #[test]
  fn unknown_value_is_preserved_and_round_trips() {
    let parsed: ApiClientModelCreator = serde_json::from_str("\"zzz_not_a_real_value\"").unwrap();
    assert_eq!(parsed, ApiClientModelCreator::Unknown("zzz_not_a_real_value".to_string()));
    assert_eq!(serde_json::to_string(&parsed).unwrap(), "\"zzz_not_a_real_value\"");
  }

  #[test]
  fn every_known_variant_round_trips() {
    let all = [
      (ApiClientModelCreator::Alibaba, "alibaba"),
      (ApiClientModelCreator::ArtCraft, "artcraft"),
      (ApiClientModelCreator::BlackForestLabs, "black_forest_labs"),
      (ApiClientModelCreator::Bytedance, "bytedance"),
      (ApiClientModelCreator::Fal, "fal"),
      (ApiClientModelCreator::Google, "google"),
      (ApiClientModelCreator::Grok, "grok"),
      (ApiClientModelCreator::Hailuo, "hailuo"),
      (ApiClientModelCreator::Higgsfield, "higgsfield"),
      (ApiClientModelCreator::Kling, "kling"),
      (ApiClientModelCreator::Krea, "krea"),
      (ApiClientModelCreator::Midjourney, "midjourney"),
      (ApiClientModelCreator::OpenAi, "open_ai"),
      (ApiClientModelCreator::OpenArt, "open_art"),
      (ApiClientModelCreator::Recraft, "recraft"),
      (ApiClientModelCreator::Replicate, "replicate"),
      (ApiClientModelCreator::Runway, "runway"),
      (ApiClientModelCreator::Stability, "stability"),
      (ApiClientModelCreator::Tencent, "tencent"),
      (ApiClientModelCreator::TensorArt, "tensor_art"),
      (ApiClientModelCreator::Vidu, "vidu"),
      (ApiClientModelCreator::WorldLabs, "world_labs"),
    ];
    for (variant, s) in all {
      assert_eq!(String::from(variant.clone()), s, "serialize mismatch for {:?}", variant);
      let parsed: ApiClientModelCreator = serde_json::from_str(&format!("\"{}\"", s)).unwrap();
      assert_eq!(parsed, variant);
    }
  }
}
