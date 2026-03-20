use strum::EnumIter;
use utoipa::ToSchema;

/// This enum is not backed by a particular database table.
/// This is used to determine the video generation size.
#[derive(Clone, Debug, Copy, Eq, PartialEq, Ord, PartialOrd, Hash, Deserialize, Serialize, EnumIter, ToSchema)]
#[serde(rename_all = "snake_case")]

pub enum VideoDimensions {
  Landscape,
  Portrait,
  Square,
}

#[cfg(test)]
mod tests {
  use super::VideoDimensions;
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn variants_count_check() {
      assert_eq!(VideoDimensions::iter().count(), 3);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in VideoDimensions::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: VideoDimensions = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
