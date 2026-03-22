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

#[cfg(test)]
mod tests {
  use super::WeightsFileType;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(WeightsFileType::Checkpoint, "checkpoint");
      assert_serialization(WeightsFileType::SafeTensors, "safetensors");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("checkpoint", WeightsFileType::Checkpoint);
      assert_deserialization("safetensors", WeightsFileType::SafeTensors);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(WeightsFileType::iter().count(), 2);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in WeightsFileType::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: WeightsFileType = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
