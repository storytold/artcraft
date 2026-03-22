use strum::EnumCount;
use strum::EnumIter;

// TODO we will need to scan the checkpoints for malicious code.  We can't just trust the file extension.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, EnumIter, EnumCount)]
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

}

impl_enum_display_and_debug_using_to_str!(WeightsFileType);
impl_mysql_enum_coders!(WeightsFileType);
impl_mysql_from_row!(WeightsFileType);

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

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip() {
      use strum::IntoEnumIterator;
      for variant in WeightsFileType::iter() {
        assert_eq!(variant, WeightsFileType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, WeightsFileType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, WeightsFileType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH: usize = 32; // TODO(bt): Confirm database column width, then remove this comment.
      use strum::IntoEnumIterator;
      for variant in WeightsFileType::iter() {
        let serialized = variant.to_str();
        assert!(!serialized.is_empty(), "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}