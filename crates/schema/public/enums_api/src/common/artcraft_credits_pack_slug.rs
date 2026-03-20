use strum::EnumIter;
use utoipa::ToSchema;

/// NB: This will be used by a variety of tables (MySQL and sqlite)!
/// Keep the max length to 16 characters.
#[derive(Clone, Debug, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, EnumIter, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]

pub enum ArtcraftCreditsPackSlug {
  #[serde(rename= "artcraft_1000")]
  Artcraft1000,
  #[serde(rename= "artcraft_2500")]
  Artcraft2500,
  #[serde(rename= "artcraft_5000")]
  Artcraft5000,
  #[serde(rename= "artcraft_10000")]
  Artcraft10000,
  #[serde(rename= "artcraft_25000")]
  Artcraft25000,
  #[serde(rename= "artcraft_50000")]
  Artcraft50000,
}

#[cfg(test)]
mod tests {
  use super::ArtcraftCreditsPackSlug;
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn variants_count_check() {
      assert_eq!(ArtcraftCreditsPackSlug::iter().count(), 6);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in ArtcraftCreditsPackSlug::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: ArtcraftCreditsPackSlug = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
