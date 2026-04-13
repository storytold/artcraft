use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

/// Used in the `staff_audit_logs` table in `VARCHAR(32)` field `entity_type`.
///
/// The type of entity that a staff action was performed on.
///
/// YOU CAN ADD NEW VALUES, BUT DO NOT CHANGE EXISTING VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize)]
pub enum StaffAuditEntityType {
  /// A user account.
  #[serde(rename = "user")]
  User,
}

impl_enum_display_and_debug_using_to_str!(StaffAuditEntityType);
impl_mysql_enum_coders!(StaffAuditEntityType);
impl_mysql_from_row!(StaffAuditEntityType);

impl StaffAuditEntityType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::User => "user",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "user" => Ok(Self::User),
      _ => Err(format!("invalid StaffAuditEntityType value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    BTreeSet::from([
      Self::User,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::staff_audit_logs::staff_audit_entity_type::StaffAuditEntityType;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(StaffAuditEntityType::User, "user");
    }

    #[test]
    fn to_str() {
      assert_eq!(StaffAuditEntityType::User.to_str(), "user");
    }

    #[test]
    fn from_str() {
      assert_eq!(StaffAuditEntityType::from_str("user").unwrap(), StaffAuditEntityType::User);
      assert!(StaffAuditEntityType::from_str("invalid").is_err());
    }

    #[test]
    fn all_variants() {
      const EXPECTED_COUNT: usize = 1;
      assert_eq!(StaffAuditEntityType::all_variants().len(), EXPECTED_COUNT);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(StaffAuditEntityType::all_variants().len(), StaffAuditEntityType::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in StaffAuditEntityType::all_variants() {
        assert_eq!(variant, StaffAuditEntityType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, StaffAuditEntityType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, StaffAuditEntityType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH: usize = 32;
      for variant in StaffAuditEntityType::all_variants() {
        let serialized = variant.to_str();
        assert!(!serialized.is_empty(), "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long for VARCHAR({})", variant, MAX_LENGTH);
      }
    }
  }
}
