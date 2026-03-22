use enums_db::by_table::audit_logs::audit_log_entity_type::AuditLogEntityType;
use tokens::tokens::comments::CommentToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;
use tokens::tokens::users::UserToken;

// TODO(bt, 2024-01-16): A ref type with <'a> lifetime of inner data instead of ownership?
pub enum AuditLogEntity {
  Comment(CommentToken),
  MediaFile(MediaFileToken),
  ModelWeight(ModelWeightToken),
  User(UserToken),
}

// TODO(bt, 2024-01-16): Codegen? Make traits for these? Maybe overkill.
impl AuditLogEntity {
  pub fn get_entity_type(&self) -> AuditLogEntityType {
    match self {
      Self::Comment(_) => AuditLogEntityType::Comment,
      Self::MediaFile(_) => AuditLogEntityType::MediaFile,
      Self::ModelWeight(_) => AuditLogEntityType::ModelWeight,
      Self::User(_) => AuditLogEntityType::User,
    }
  }

  pub fn get_entity_token_str(&self) -> &str {
    match self {
      Self::Comment(token) => token.as_str(),
      Self::MediaFile(token) => token.as_str(),
      Self::ModelWeight(token) => token.as_str(),
      Self::User(token) => token.as_str(),
    }
  }

  pub fn get_composite_keys(&self) -> (AuditLogEntityType, &str) {
    match self {
      Self::Comment(token) => (AuditLogEntityType::Comment, token.as_str()),
      Self::MediaFile(token) => (AuditLogEntityType::MediaFile, token.as_str()),
      Self::ModelWeight(token) => (AuditLogEntityType::ModelWeight, token.as_str()),
      Self::User(token) => (AuditLogEntityType::User, token.as_str()),
    }
  }
}
