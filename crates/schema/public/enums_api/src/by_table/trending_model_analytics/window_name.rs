use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `window_name` table in a `VARCHAR` field.
///
/// Contrary to most of this crate and unlike most "enum"-types
/// that are inflexible, new window names can be added/removed
/// without breaking too much.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize, ToSchema, EnumIter, Debug)]

pub enum WindowName {
  /// Analytics over the last three hours
  #[serde(rename = "last_3_hours")]
  Last3Hours,

  /// Analytics over the last three hours
  #[serde(rename = "last_3_days")]
  Last3Days,

  /// Analytics over all historical records
  #[serde(rename = "all_time")]
  AllTime,
}

#[cfg(test)]
mod tests {
  use super::WindowName;
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn variants_count_check() {
      assert_eq!(WindowName::iter().count(), 3);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in WindowName::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: WindowName = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
