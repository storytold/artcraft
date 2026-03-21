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
  use super::AuditLogEntityAction;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in AuditLogEntityAction::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: AuditLogEntityAction = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
