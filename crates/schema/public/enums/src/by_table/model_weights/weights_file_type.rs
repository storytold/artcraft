use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

// TODO we will need to scan the checkpoints for malicious code.  We can't just trust the file extension.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize)]
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

impl_enum_display_and_debug_using_to_str!(WeightsFileType);
impl_mysql_enum_coders!(WeightsFileType);

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
    fn test_to_str() {
        assert_eq!(WeightsFileType::Checkpoint.to_str(), "checkpoint");
        assert_eq!(WeightsFileType::SafeTensors.to_str(), "safetensors");
    }

    #[test]
    fn test_from_str() {
        assert_eq!(WeightsFileType::from_str("checkpoint").unwrap(), WeightsFileType::Checkpoint);
        assert_eq!(WeightsFileType::from_str("safetensors").unwrap(), WeightsFileType::SafeTensors);
        assert!(WeightsFileType::from_str("invalid").is_err());
    }

    #[test]
    fn test_all_variants() {
        let variants = WeightsFileType::all_variants();
        assert_eq!(variants.len(), 2);
        assert!(variants.contains(&WeightsFileType::Checkpoint));
        assert!(variants.contains(&WeightsFileType::SafeTensors));
    }
}