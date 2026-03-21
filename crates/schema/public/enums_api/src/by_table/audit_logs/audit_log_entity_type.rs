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
  use super::AuditLogEntityType;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in AuditLogEntityType::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: AuditLogEntityType = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
