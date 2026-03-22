use strum::EnumCount;
use strum::EnumIter;

/// NB: This will be used by a variety of tables (MySQL and sqlite)!
/// Keep the max length to 16 characters.
#[derive(Clone, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize, EnumIter, EnumCount)]
#[serde(rename_all = "snake_case")]
pub enum PaymentsNamespace {
  #[serde(rename = "artcraft")]
  Artcraft,
  #[serde(rename = "fakeyou")]
  FakeYou,
}

impl_enum_display_and_debug_using_to_str!(PaymentsNamespace);
impl_mysql_enum_coders!(PaymentsNamespace);
impl_mysql_from_row!(PaymentsNamespace);

// NB: We can derive `sqlx::Type` instead of using `impl_mysql_enum_coders`

impl PaymentsNamespace {
  pub const fn to_str(&self) -> &'static str {
    match self {
      Self::Artcraft => "artcraft",
      Self::FakeYou => "fakeyou",
    }
  }

  pub fn from_str(s: &str) -> Result<Self, String> {
    match s {
      "artcraft" => Ok(Self::Artcraft),
      "fakeyou" => Ok(Self::FakeYou),
      _ => Err(format!("invalid subscription_namespace: {:?}", s)),
    }
  }

}

#[cfg(test)]
mod tests {
  use enums_shared::test_helpers::assert_serialization;
  use super::PaymentsNamespace;

  mod explicit_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(PaymentsNamespace::Artcraft, "artcraft");
      assert_serialization(PaymentsNamespace::FakeYou, "fakeyou");
    }

    #[test]
    fn to_str() {
      assert_eq!(PaymentsNamespace::Artcraft.to_str(), "artcraft");
      assert_eq!(PaymentsNamespace::FakeYou.to_str(), "fakeyou");
    }

    #[test]
    fn from_str() {
      assert_eq!(PaymentsNamespace::from_str("artcraft").unwrap(), PaymentsNamespace::Artcraft);
      assert_eq!(PaymentsNamespace::from_str("fakeyou").unwrap(), PaymentsNamespace::FakeYou);
    }

  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip() {
      use strum::IntoEnumIterator;
      for variant in PaymentsNamespace::iter() {
        // Test to_str(), from_str(), Display, and Debug.
        assert_eq!(variant, PaymentsNamespace::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, PaymentsNamespace::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, PaymentsNamespace::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      use strum::IntoEnumIterator;
      const MAX_LENGTH : usize = 16;
      for variant in PaymentsNamespace::iter() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
