use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// NB: This will be used by a variety of tables (MySQL and sqlite)!
/// Keep the max length to 16 characters.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize, ToSchema)]
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

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::Artcraft,
      Self::FakeYou,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::test_helpers::assert_serialization;
  use crate::common::payments_namespace::PaymentsNamespace;

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

    #[test]
    fn all_variants() {
      let mut variants = PaymentsNamespace::all_variants();
      assert_eq!(variants.len(), 2);
      assert_eq!(variants.pop_first(), Some(PaymentsNamespace::Artcraft));
      assert_eq!(variants.pop_first(), Some(PaymentsNamespace::FakeYou));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(PaymentsNamespace::all_variants().len(), PaymentsNamespace::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in PaymentsNamespace::all_variants() {
        // Test to_str(), from_str(), Display, and Debug.
        assert_eq!(variant, PaymentsNamespace::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, PaymentsNamespace::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, PaymentsNamespace::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH : usize = 16;
      for variant in PaymentsNamespace::all_variants() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
