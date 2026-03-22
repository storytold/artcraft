use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `audit_logs` table in a `VARCHAR(32)` field named `entity_type`.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize, ToSchema, EnumIter, Debug)]

pub enum AuditLogEntityType {
  /// Comment system
  #[serde(rename = "comment")]
  Comment,

  /// Media file
  #[serde(rename = "media_file")]
  MediaFile,

  /// Model weight
  #[serde(rename = "model_weight")]
  ModelWeight,

  /// User
  #[serde(rename = "user")]
  User,
}

#[cfg(test)]
mod tests {
  use super::AuditLogEntityType;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(AuditLogEntityType::Comment, "comment");
      assert_serialization(AuditLogEntityType::MediaFile, "media_file");
      assert_serialization(AuditLogEntityType::ModelWeight, "model_weight");
      assert_serialization(AuditLogEntityType::User, "user");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("comment", AuditLogEntityType::Comment);
      assert_deserialization("media_file", AuditLogEntityType::MediaFile);
      assert_deserialization("model_weight", AuditLogEntityType::ModelWeight);
      assert_deserialization("user", AuditLogEntityType::User);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(AuditLogEntityType::iter().count(), 4);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in AuditLogEntityType::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: AuditLogEntityType = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
