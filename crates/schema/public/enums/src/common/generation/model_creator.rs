use std::collections::BTreeSet;
use utoipa::ToSchema;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

/// The company or organization that created a model.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Serialize, Deserialize, ToSchema)]
pub enum ModelCreator {
  #[serde(rename = "alibaba")]
  Alibaba,
  #[serde(rename = "artcraft")]
  ArtCraft,
  #[serde(rename = "black_forest_labs")]
  BlackForestLabs,
  #[serde(rename = "bytedance")]
  Bytedance,
  #[serde(rename = "fal")]
  Fal,
  #[serde(rename = "google")]
  Google,
  #[serde(rename = "grok")]
  Grok,
  #[serde(rename = "hailuo")]
  Hailuo,
  #[serde(rename = "higgsfield")]
  Higgsfield,
  #[serde(rename = "kling")]
  Kling,
  #[serde(rename = "krea")]
  Krea,
  #[serde(rename = "midjourney")]
  Midjourney,
  #[serde(rename = "open_ai")]
  OpenAi,
  #[serde(rename = "open_art")]
  OpenArt,
  #[serde(rename = "recraft")]
  Recraft,
  #[serde(rename = "replicate")]
  Replicate,
  #[serde(rename = "runway")]
  Runway,
  #[serde(rename = "stability")]
  Stability,
  #[serde(rename = "tencent")]
  Tencent,
  #[serde(rename = "tensor_art")]
  TensorArt,
  #[serde(rename = "vidu")]
  Vidu,
  #[serde(rename = "world_labs")]
  WorldLabs,
}

impl ModelCreator {
  /// Returns the properly formatted human-readable name.
  pub fn get_name(&self) -> &'static str {
    match self {
      Self::Alibaba => "Alibaba",
      Self::ArtCraft => "ArtCraft",
      Self::BlackForestLabs => "Black Forest Labs",
      Self::Bytedance => "ByteDance",
      Self::Fal => "fal",
      Self::Google => "Google",
      Self::Grok => "Grok",
      Self::Hailuo => "Hailuo",
      Self::Higgsfield => "Higgsfield",
      Self::Kling => "Kling",
      Self::Krea => "Krea",
      Self::Midjourney => "Midjourney",
      Self::OpenAi => "OpenAI",
      Self::OpenArt => "OpenArt",
      Self::Recraft => "Recraft",
      Self::Replicate => "Replicate",
      Self::Runway => "Runway",
      Self::Stability => "Stability AI",
      Self::Tencent => "Tencent",
      Self::TensorArt => "TensorArt",
      Self::Vidu => "Vidu",
      Self::WorldLabs => "World Labs",
    }
  }

  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Alibaba => "alibaba",
      Self::ArtCraft => "artcraft",
      Self::BlackForestLabs => "black_forest_labs",
      Self::Bytedance => "bytedance",
      Self::Fal => "fal",
      Self::Google => "google",
      Self::Grok => "grok",
      Self::Hailuo => "hailuo",
      Self::Higgsfield => "higgsfield",
      Self::Kling => "kling",
      Self::Krea => "krea",
      Self::Midjourney => "midjourney",
      Self::OpenAi => "open_ai",
      Self::OpenArt => "open_art",
      Self::Recraft => "recraft",
      Self::Replicate => "replicate",
      Self::Runway => "runway",
      Self::Stability => "stability",
      Self::Tencent => "tencent",
      Self::TensorArt => "tensor_art",
      Self::Vidu => "vidu",
      Self::WorldLabs => "world_labs",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "alibaba" => Ok(Self::Alibaba),
      "artcraft" => Ok(Self::ArtCraft),
      "black_forest_labs" => Ok(Self::BlackForestLabs),
      "bytedance" => Ok(Self::Bytedance),
      "fal" => Ok(Self::Fal),
      "google" => Ok(Self::Google),
      "grok" => Ok(Self::Grok),
      "hailuo" => Ok(Self::Hailuo),
      "higgsfield" => Ok(Self::Higgsfield),
      "kling" => Ok(Self::Kling),
      "krea" => Ok(Self::Krea),
      "midjourney" => Ok(Self::Midjourney),
      "open_ai" => Ok(Self::OpenAi),
      "open_art" => Ok(Self::OpenArt),
      "recraft" => Ok(Self::Recraft),
      "replicate" => Ok(Self::Replicate),
      "runway" => Ok(Self::Runway),
      "stability" => Ok(Self::Stability),
      "tencent" => Ok(Self::Tencent),
      "tensor_art" => Ok(Self::TensorArt),
      "vidu" => Ok(Self::Vidu),
      "world_labs" => Ok(Self::WorldLabs),
      _ => Err(format!("invalid ModelCreator value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    BTreeSet::from([
      Self::Alibaba,
      Self::ArtCraft,
      Self::BlackForestLabs,
      Self::Bytedance,
      Self::Fal,
      Self::Google,
      Self::Grok,
      Self::Hailuo,
      Self::Higgsfield,
      Self::Kling,
      Self::Krea,
      Self::Midjourney,
      Self::OpenAi,
      Self::OpenArt,
      Self::Recraft,
      Self::Replicate,
      Self::Runway,
      Self::Stability,
      Self::Tencent,
      Self::TensorArt,
      Self::Vidu,
      Self::WorldLabs,
    ])
  }
}

impl_enum_display_and_debug_using_to_str!(ModelCreator);

#[cfg(test)]
mod tests {
  use crate::common::generation::model_creator::ModelCreator;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(ModelCreator::Alibaba, "alibaba");
      assert_serialization(ModelCreator::ArtCraft, "artcraft");
      assert_serialization(ModelCreator::BlackForestLabs, "black_forest_labs");
      assert_serialization(ModelCreator::Bytedance, "bytedance");
      assert_serialization(ModelCreator::Fal, "fal");
      assert_serialization(ModelCreator::Google, "google");
      assert_serialization(ModelCreator::Grok, "grok");
      assert_serialization(ModelCreator::Hailuo, "hailuo");
      assert_serialization(ModelCreator::Higgsfield, "higgsfield");
      assert_serialization(ModelCreator::Kling, "kling");
      assert_serialization(ModelCreator::Krea, "krea");
      assert_serialization(ModelCreator::Midjourney, "midjourney");
      assert_serialization(ModelCreator::OpenAi, "open_ai");
      assert_serialization(ModelCreator::OpenArt, "open_art");
      assert_serialization(ModelCreator::Recraft, "recraft");
      assert_serialization(ModelCreator::Replicate, "replicate");
      assert_serialization(ModelCreator::Runway, "runway");
      assert_serialization(ModelCreator::Stability, "stability");
      assert_serialization(ModelCreator::Tencent, "tencent");
      assert_serialization(ModelCreator::TensorArt, "tensor_art");
      assert_serialization(ModelCreator::Vidu, "vidu");
      assert_serialization(ModelCreator::WorldLabs, "world_labs");
    }

    #[test]
    fn to_str() {
      assert_eq!(ModelCreator::Alibaba.to_str(), "alibaba");
      assert_eq!(ModelCreator::ArtCraft.to_str(), "artcraft");
      assert_eq!(ModelCreator::BlackForestLabs.to_str(), "black_forest_labs");
      assert_eq!(ModelCreator::OpenAi.to_str(), "open_ai");
      assert_eq!(ModelCreator::WorldLabs.to_str(), "world_labs");
    }

    #[test]
    fn from_str() {
      assert_eq!(ModelCreator::from_str("alibaba").unwrap(), ModelCreator::Alibaba);
      assert_eq!(ModelCreator::from_str("artcraft").unwrap(), ModelCreator::ArtCraft);
      assert_eq!(ModelCreator::from_str("black_forest_labs").unwrap(), ModelCreator::BlackForestLabs);
      assert_eq!(ModelCreator::from_str("open_ai").unwrap(), ModelCreator::OpenAi);
      assert_eq!(ModelCreator::from_str("world_labs").unwrap(), ModelCreator::WorldLabs);
      assert!(ModelCreator::from_str("invalid").is_err());
    }

    #[test]
    fn get_name() {
      assert_eq!(ModelCreator::Alibaba.get_name(), "Alibaba");
      assert_eq!(ModelCreator::ArtCraft.get_name(), "ArtCraft");
      assert_eq!(ModelCreator::BlackForestLabs.get_name(), "Black Forest Labs");
      assert_eq!(ModelCreator::Bytedance.get_name(), "ByteDance");
      assert_eq!(ModelCreator::Fal.get_name(), "fal");
      assert_eq!(ModelCreator::Google.get_name(), "Google");
      assert_eq!(ModelCreator::OpenAi.get_name(), "OpenAI");
      assert_eq!(ModelCreator::Stability.get_name(), "Stability AI");
      assert_eq!(ModelCreator::WorldLabs.get_name(), "World Labs");
    }

    #[test]
    fn all_variants() {
      const EXPECTED_COUNT: usize = 22;
      assert_eq!(ModelCreator::all_variants().len(), EXPECTED_COUNT);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(ModelCreator::all_variants().len(), ModelCreator::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in ModelCreator::all_variants() {
        assert_eq!(variant, ModelCreator::from_str(variant.to_str()).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH: usize = 32;
      for variant in ModelCreator::all_variants() {
        let serialized = variant.to_str();
        assert!(!serialized.is_empty());
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long for VARCHAR({})", variant, MAX_LENGTH);
      }
    }

    #[test]
    fn every_variant_has_a_human_name() {
      for variant in ModelCreator::all_variants() {
        let name = variant.get_name();
        assert!(!name.is_empty(), "variant {:?} has empty name", variant);
      }
    }
  }
}
