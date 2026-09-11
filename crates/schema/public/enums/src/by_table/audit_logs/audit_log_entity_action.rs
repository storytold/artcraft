use serde::Deserialize;
use serde::Serialize;
#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

/// Used in the `audit_logs` table in a `VARCHAR(32)` field named `entity_action`.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize)]
pub enum AuditLogEntityAction {
  /// Create action
  #[serde(rename = "create")]
  Create,

  /// Edit action
  #[serde(rename = "edit")]
  Edit,

  /// Edit features (eg. user feature flags)
  #[serde(rename = "edit_features")]
  EditFeatures,

  /// Delete action
  #[serde(rename = "delete")]
  Delete,

  /// Create featured item
  #[serde(rename = "featured_item_create")]
  FeaturedItemCreate,

  /// Delete featured item
  #[serde(rename = "featured_item_delete")]
  FeaturedItemDelete,
}

// TODO(bt, 2023-01-17): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(AuditLogEntityAction);
impl_mysql_enum_coders!(AuditLogEntityAction);

/// NB: Legacy API for older code.
impl AuditLogEntityAction {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Create => "create",
      Self::Edit => "edit",
      Self::EditFeatures => "edit_features",
      Self::Delete => "delete",
      Self::FeaturedItemCreate => "featured_item_create",
      Self::FeaturedItemDelete => "featured_item_delete",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "create" => Ok(Self::Create),
      "edit" => Ok(Self::Edit),
      "edit_features" => Ok(Self::EditFeatures),
      "delete" => Ok(Self::Delete),
      "featured_item_create" => Ok(Self::FeaturedItemCreate),
      "featured_item_delete" => Ok(Self::FeaturedItemDelete),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::audit_logs::audit_log_entity_action::AuditLogEntityAction;
  use crate::test_helpers::assert_serialization;

  mod serde {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(AuditLogEntityAction::Create, "create");
      assert_serialization(AuditLogEntityAction::Edit, "edit");
      assert_serialization(AuditLogEntityAction::EditFeatures, "edit_features");
      assert_serialization(AuditLogEntityAction::Delete, "delete");
      assert_serialization(AuditLogEntityAction::FeaturedItemCreate, "featured_item_create");
      assert_serialization(AuditLogEntityAction::FeaturedItemDelete, "featured_item_delete");
    }
  }

  mod impl_methods {
    use super::*;

    #[test]
    fn test_to_str() {
      assert_eq!(AuditLogEntityAction::Create.to_str(), "create");
      assert_eq!(AuditLogEntityAction::Edit.to_str(), "edit");
      assert_eq!(AuditLogEntityAction::EditFeatures.to_str(), "edit_features");
      assert_eq!(AuditLogEntityAction::Delete.to_str(), "delete");
      assert_eq!(AuditLogEntityAction::FeaturedItemCreate.to_str(), "featured_item_create");
      assert_eq!(AuditLogEntityAction::FeaturedItemDelete.to_str(), "featured_item_delete");
    }

    #[test]
    fn test_from_str() {
      assert_eq!(AuditLogEntityAction::from_str("create").unwrap(), AuditLogEntityAction::Create);
      assert_eq!(AuditLogEntityAction::from_str("edit").unwrap(), AuditLogEntityAction::Edit);
      assert_eq!(AuditLogEntityAction::from_str("edit_features").unwrap(), AuditLogEntityAction::EditFeatures);
      assert_eq!(AuditLogEntityAction::from_str("delete").unwrap(), AuditLogEntityAction::Delete);
      assert_eq!(AuditLogEntityAction::from_str("featured_item_create").unwrap(), AuditLogEntityAction::FeaturedItemCreate);
      assert_eq!(AuditLogEntityAction::from_str("featured_item_delete").unwrap(), AuditLogEntityAction::FeaturedItemDelete);
      assert!(AuditLogEntityAction::from_str("foo").is_err());
    }
  }
}
