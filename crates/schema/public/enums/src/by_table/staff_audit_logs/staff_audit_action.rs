use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

/// Used in the `staff_audit_logs` table in `VARCHAR(32)` field `entity_action`.
///
/// The type of staff action that was performed.
///
/// YOU CAN ADD NEW VALUES, BUT DO NOT CHANGE EXISTING VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize)]
pub enum StaffAuditAction {
  /// Staff initiated an impersonation request for a user.
  #[serde(rename = "impersonate_user_request")]
  ImpersonateUserRequest,

  /// Staff redeemed an impersonation request, creating a session.
  #[serde(rename = "impersonate_user_redeem")]
  ImpersonateUserRedeem,

  /// Staff banned a user.
  #[serde(rename = "ban_user")]
  BanUser,

  /// Staff unbanned a user.
  #[serde(rename = "unban_user")]
  UnbanUser,
}

impl_enum_display_and_debug_using_to_str!(StaffAuditAction);
impl_mysql_enum_coders!(StaffAuditAction);
impl_mysql_from_row!(StaffAuditAction);

impl StaffAuditAction {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::ImpersonateUserRequest => "impersonate_user_request",
      Self::ImpersonateUserRedeem => "impersonate_user_redeem",
      Self::BanUser => "ban_user",
      Self::UnbanUser => "unban_user",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "impersonate_user_request" => Ok(Self::ImpersonateUserRequest),
      "impersonate_user_redeem" => Ok(Self::ImpersonateUserRedeem),
      "ban_user" => Ok(Self::BanUser),
      "unban_user" => Ok(Self::UnbanUser),
      _ => Err(format!("invalid StaffAuditAction value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    BTreeSet::from([
      Self::ImpersonateUserRequest,
      Self::ImpersonateUserRedeem,
      Self::BanUser,
      Self::UnbanUser,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::staff_audit_logs::staff_audit_action::StaffAuditAction;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(StaffAuditAction::ImpersonateUserRequest, "impersonate_user_request");
      assert_serialization(StaffAuditAction::ImpersonateUserRedeem, "impersonate_user_redeem");
      assert_serialization(StaffAuditAction::BanUser, "ban_user");
      assert_serialization(StaffAuditAction::UnbanUser, "unban_user");
    }

    #[test]
    fn to_str() {
      assert_eq!(StaffAuditAction::ImpersonateUserRequest.to_str(), "impersonate_user_request");
      assert_eq!(StaffAuditAction::ImpersonateUserRedeem.to_str(), "impersonate_user_redeem");
      assert_eq!(StaffAuditAction::BanUser.to_str(), "ban_user");
      assert_eq!(StaffAuditAction::UnbanUser.to_str(), "unban_user");
    }

    #[test]
    fn from_str() {
      assert_eq!(StaffAuditAction::from_str("impersonate_user_request").unwrap(), StaffAuditAction::ImpersonateUserRequest);
      assert_eq!(StaffAuditAction::from_str("impersonate_user_redeem").unwrap(), StaffAuditAction::ImpersonateUserRedeem);
      assert_eq!(StaffAuditAction::from_str("ban_user").unwrap(), StaffAuditAction::BanUser);
      assert_eq!(StaffAuditAction::from_str("unban_user").unwrap(), StaffAuditAction::UnbanUser);
      assert!(StaffAuditAction::from_str("invalid").is_err());
    }

    #[test]
    fn all_variants() {
      const EXPECTED_COUNT: usize = 4;
      assert_eq!(StaffAuditAction::all_variants().len(), EXPECTED_COUNT);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(StaffAuditAction::all_variants().len(), StaffAuditAction::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in StaffAuditAction::all_variants() {
        assert_eq!(variant, StaffAuditAction::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, StaffAuditAction::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, StaffAuditAction::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH: usize = 32;
      for variant in StaffAuditAction::all_variants() {
        let serialized = variant.to_str();
        assert!(!serialized.is_empty(), "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long for VARCHAR({})", variant, MAX_LENGTH);
      }
    }
  }
}
