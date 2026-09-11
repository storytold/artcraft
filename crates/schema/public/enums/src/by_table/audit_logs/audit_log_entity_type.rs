use serde::Deserialize;
use serde::Serialize;
#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

/// Used in the `audit_logs` table in a `VARCHAR(32)` field named `entity_type`.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Deserialize, Serialize)]
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

// TODO(bt, 2023-01-17): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(AuditLogEntityType);
impl_mysql_enum_coders!(AuditLogEntityType);

/// NB: Legacy API for older code.
impl AuditLogEntityType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Comment => "comment",
      Self::MediaFile => "media_file",
      Self::ModelWeight => "model_weight",
      Self::User => "user",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "comment" => Ok(Self::Comment),
      "media_file" => Ok(Self::MediaFile),
      "model_weight" => Ok(Self::ModelWeight),
      "user" => Ok(Self::User),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::audit_logs::audit_log_entity_type::AuditLogEntityType;
  use crate::test_helpers::assert_serialization;

  mod serde {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(AuditLogEntityType::Comment, "comment");
      assert_serialization(AuditLogEntityType::MediaFile, "media_file");
      assert_serialization(AuditLogEntityType::ModelWeight, "model_weight");
      assert_serialization(AuditLogEntityType::User, "user");
    }
  }

  mod impl_methods {
    use super::*;

    #[test]
    fn test_to_str() {
      assert_eq!(AuditLogEntityType::Comment.to_str(), "comment");
      assert_eq!(AuditLogEntityType::MediaFile.to_str(), "media_file");
      assert_eq!(AuditLogEntityType::ModelWeight.to_str(), "model_weight");
      assert_eq!(AuditLogEntityType::User.to_str(), "user");
    }

    #[test]
    fn test_from_str() {
      assert_eq!(AuditLogEntityType::from_str("comment").unwrap(), AuditLogEntityType::Comment);
      assert_eq!(AuditLogEntityType::from_str("media_file").unwrap(), AuditLogEntityType::MediaFile);
      assert_eq!(AuditLogEntityType::from_str("model_weight").unwrap(), AuditLogEntityType::ModelWeight);
      assert_eq!(AuditLogEntityType::from_str("user").unwrap(), AuditLogEntityType::User);
      assert!(AuditLogEntityType::from_str("foo").is_err());
    }
  }
}
