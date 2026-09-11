use utoipa::ToSchema;

/// Musical keys available for audio generation (eg. Suno Sounds).
///
/// NB: There are intentionally no E keys, per product spec.
#[derive(Copy, Clone, Debug, Eq, PartialEq, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum CommonMusicalKey {
  /// Let the model pick the key.
  #[serde(rename = "auto")]
  Auto,

  #[serde(rename = "c_major")]
  CMajor,

  #[serde(rename = "c_minor")]
  CMinor,

  #[serde(rename = "d_major")]
  DMajor,

  #[serde(rename = "d_minor")]
  DMinor,

  #[serde(rename = "f_major")]
  FMajor,

  #[serde(rename = "f_minor")]
  FMinor,

  #[serde(rename = "g_major")]
  GMajor,

  #[serde(rename = "g_minor")]
  GMinor,

  #[serde(rename = "a_major")]
  AMajor,

  #[serde(rename = "a_minor")]
  AMinor,

  #[serde(rename = "b_major")]
  BMajor,

  #[serde(rename = "b_minor")]
  BMinor,
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::test_helpers::assert_serialization;

  #[test]
  fn test_serialization() {
    assert_serialization(CommonMusicalKey::Auto, "auto");
    assert_serialization(CommonMusicalKey::CMajor, "c_major");
    assert_serialization(CommonMusicalKey::CMinor, "c_minor");
    assert_serialization(CommonMusicalKey::DMajor, "d_major");
    assert_serialization(CommonMusicalKey::DMinor, "d_minor");
    assert_serialization(CommonMusicalKey::FMajor, "f_major");
    assert_serialization(CommonMusicalKey::FMinor, "f_minor");
    assert_serialization(CommonMusicalKey::GMajor, "g_major");
    assert_serialization(CommonMusicalKey::GMinor, "g_minor");
    assert_serialization(CommonMusicalKey::AMajor, "a_major");
    assert_serialization(CommonMusicalKey::AMinor, "a_minor");
    assert_serialization(CommonMusicalKey::BMajor, "b_major");
    assert_serialization(CommonMusicalKey::BMinor, "b_minor");
  }

  #[test]
  fn test_deserialization() {
    let cases = [
      ("auto", CommonMusicalKey::Auto),
      ("c_major", CommonMusicalKey::CMajor),
      ("c_minor", CommonMusicalKey::CMinor),
      ("d_major", CommonMusicalKey::DMajor),
      ("d_minor", CommonMusicalKey::DMinor),
      ("f_major", CommonMusicalKey::FMajor),
      ("f_minor", CommonMusicalKey::FMinor),
      ("g_major", CommonMusicalKey::GMajor),
      ("g_minor", CommonMusicalKey::GMinor),
      ("a_major", CommonMusicalKey::AMajor),
      ("a_minor", CommonMusicalKey::AMinor),
      ("b_major", CommonMusicalKey::BMajor),
      ("b_minor", CommonMusicalKey::BMinor),
    ];
    for (json_str, expected) in cases {
      let json = format!("\"{}\"", json_str);
      let deserialized: CommonMusicalKey = serde_json::from_str(&json)
        .unwrap_or_else(|e| panic!("Failed to deserialize {:?}: {}", json_str, e));
      assert_eq!(deserialized, expected, "Failed for {:?}", json_str);
    }
  }

  #[test]
  fn test_round_trip() {
    let all = [
      CommonMusicalKey::Auto,
      CommonMusicalKey::CMajor,
      CommonMusicalKey::CMinor,
      CommonMusicalKey::DMajor,
      CommonMusicalKey::DMinor,
      CommonMusicalKey::FMajor,
      CommonMusicalKey::FMinor,
      CommonMusicalKey::GMajor,
      CommonMusicalKey::GMinor,
      CommonMusicalKey::AMajor,
      CommonMusicalKey::AMinor,
      CommonMusicalKey::BMajor,
      CommonMusicalKey::BMinor,
    ];
    for variant in all {
      let json = serde_json::to_string(&variant).unwrap();
      let deserialized: CommonMusicalKey = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, deserialized, "Round-trip failed for {:?}", variant);
    }
  }
}
