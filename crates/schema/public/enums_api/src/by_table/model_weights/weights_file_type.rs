use std::collections::BTreeSet;

use strum::EnumIter;
use utoipa::ToSchema;

// TODO we will need to scan the checkpoints for malicious code.  We can't just trust the file extension.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema, EnumIter, Debug)]
pub enum WeightsFileType {
    #[serde(rename = "checkpoint")]
    Checkpoint,
    #[serde(rename = "safetensors")]
    SafeTensors,
}

impl WeightsFileType {
    pub fn to_str(&self) -> &'static str {
        match self {
            Self::Checkpoint => "checkpoint",
            Self::SafeTensors => "safetensors",
        }
    }

    pub fn from_str(value: &str) -> Result<Self, String> {
        match value {
            "checkpoint" => Ok(Self::Checkpoint),
            "safetensors" => Ok(Self::SafeTensors),
            _ => Err(format!("invalid value: {:?}", value)),
        }
    }

    pub fn all_variants() -> BTreeSet<Self> {
        BTreeSet::from([
            Self::Checkpoint,
            Self::SafeTensors,
        ])
    }
}

#[cfg(test)]
mod tests {
  use super::WeightsFileType;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in WeightsFileType::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: WeightsFileType = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
