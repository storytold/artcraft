use strum::EnumIter;
use utoipa::ToSchema;

/// NB: This will be used by a variety of tables (MySQL and sqlite)!
/// Keep the max length to 16 characters.
#[derive(Clone, Debug, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, EnumIter, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]

pub enum ArtcraftSubscriptionSlug {
  ArtcraftBasic,
  ArtcraftPro,
  ArtcraftMax,
}

#[cfg(test)]
mod tests {
  use super::ArtcraftSubscriptionSlug;
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn variants_count_check() {
      assert_eq!(ArtcraftSubscriptionSlug::iter().count(), 3);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in ArtcraftSubscriptionSlug::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: ArtcraftSubscriptionSlug = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
