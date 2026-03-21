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

/// NB: Legacy API for older code.
impl WindowName {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Last3Hours => "last_3_hours",
      Self::Last3Days => "last_3_days",
      Self::AllTime => "all_time",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "last_3_hours" => Ok(Self::Last3Hours),
      "last_3_days" => Ok(Self::Last3Days),
      "all_time" => Ok(Self::AllTime),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }
}

#[cfg(test)]
mod tests {
  use super::WindowName;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in WindowName::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: WindowName = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
