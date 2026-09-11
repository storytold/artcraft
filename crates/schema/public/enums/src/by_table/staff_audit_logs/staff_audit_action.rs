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

  /// Staff added banked balance to a wallet.
  #[serde(rename = "add_wallet_banked_balance")]
  AddWalletBankedBalance,

  /// Staff sent a manual alert via the pager system.
  #[serde(rename = "send_alert")]
  SendAlert,

  /// Staff edited a user's feature flags.
  #[serde(rename = "edit_user_feature_flags")]
  EditUserFeatureFlags,

  /// Staff changed a user's email address.
  #[serde(rename = "change_user_email")]
  ChangeUserEmail,
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
      Self::AddWalletBankedBalance => "add_wallet_banked_balance",
      Self::SendAlert => "send_alert",
      Self::EditUserFeatureFlags => "edit_user_feature_flags",
      Self::ChangeUserEmail => "change_user_email",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "impersonate_user_request" => Ok(Self::ImpersonateUserRequest),
      "impersonate_user_redeem" => Ok(Self::ImpersonateUserRedeem),
      "ban_user" => Ok(Self::BanUser),
      "unban_user" => Ok(Self::UnbanUser),
      "add_wallet_banked_balance" => Ok(Self::AddWalletBankedBalance),
      "send_alert" => Ok(Self::SendAlert),
      "edit_user_feature_flags" => Ok(Self::EditUserFeatureFlags),
      "change_user_email" => Ok(Self::ChangeUserEmail),
      _ => Err(format!("invalid StaffAuditAction value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    BTreeSet::from([
      Self::ImpersonateUserRequest,
      Self::ImpersonateUserRedeem,
      Self::BanUser,
      Self::UnbanUser,
      Self::AddWalletBankedBalance,
      Self::SendAlert,
      Self::EditUserFeatureFlags,
      Self::ChangeUserEmail,
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
      assert_serialization(StaffAuditAction::AddWalletBankedBalance, "add_wallet_banked_balance");
      assert_serialization(StaffAuditAction::SendAlert, "send_alert");
      assert_serialization(StaffAuditAction::EditUserFeatureFlags, "edit_user_feature_flags");
      assert_serialization(StaffAuditAction::ChangeUserEmail, "change_user_email");
    }

    #[test]
    fn to_str() {
      assert_eq!(StaffAuditAction::ImpersonateUserRequest.to_str(), "impersonate_user_request");
      assert_eq!(StaffAuditAction::ImpersonateUserRedeem.to_str(), "impersonate_user_redeem");
      assert_eq!(StaffAuditAction::BanUser.to_str(), "ban_user");
      assert_eq!(StaffAuditAction::UnbanUser.to_str(), "unban_user");
      assert_eq!(StaffAuditAction::AddWalletBankedBalance.to_str(), "add_wallet_banked_balance");
      assert_eq!(StaffAuditAction::SendAlert.to_str(), "send_alert");
      assert_eq!(StaffAuditAction::EditUserFeatureFlags.to_str(), "edit_user_feature_flags");
      assert_eq!(StaffAuditAction::ChangeUserEmail.to_str(), "change_user_email");
    }

    #[test]
    fn from_str() {
      assert_eq!(StaffAuditAction::from_str("impersonate_user_request").unwrap(), StaffAuditAction::ImpersonateUserRequest);
      assert_eq!(StaffAuditAction::from_str("impersonate_user_redeem").unwrap(), StaffAuditAction::ImpersonateUserRedeem);
      assert_eq!(StaffAuditAction::from_str("ban_user").unwrap(), StaffAuditAction::BanUser);
      assert_eq!(StaffAuditAction::from_str("unban_user").unwrap(), StaffAuditAction::UnbanUser);
      assert_eq!(StaffAuditAction::from_str("add_wallet_banked_balance").unwrap(), StaffAuditAction::AddWalletBankedBalance);
      assert_eq!(StaffAuditAction::from_str("send_alert").unwrap(), StaffAuditAction::SendAlert);
      assert_eq!(StaffAuditAction::from_str("edit_user_feature_flags").unwrap(), StaffAuditAction::EditUserFeatureFlags);
      assert_eq!(StaffAuditAction::from_str("change_user_email").unwrap(), StaffAuditAction::ChangeUserEmail);
      assert!(StaffAuditAction::from_str("invalid").is_err());
    }

    #[test]
    fn all_variants() {
      const EXPECTED_COUNT: usize = 8;
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
