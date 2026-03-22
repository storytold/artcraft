use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `audit_logs` table in a `VARCHAR(32)` field named `entity_action`.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize, ToSchema, EnumIter, Debug)]

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

#[cfg(test)]
mod tests {
  use super::AuditLogEntityAction;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
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

    #[test]
    fn test_deserialization() {
      assert_deserialization("create", AuditLogEntityAction::Create);
      assert_deserialization("edit", AuditLogEntityAction::Edit);
      assert_deserialization("edit_features", AuditLogEntityAction::EditFeatures);
      assert_deserialization("delete", AuditLogEntityAction::Delete);
      assert_deserialization("featured_item_create", AuditLogEntityAction::FeaturedItemCreate);
      assert_deserialization("featured_item_delete", AuditLogEntityAction::FeaturedItemDelete);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(AuditLogEntityAction::iter().count(), 6);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in AuditLogEntityAction::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: AuditLogEntityAction = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
