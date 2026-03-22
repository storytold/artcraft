use enums_db::by_table::batch_generations::batch_generation_entity_type::BatchGenerationEntityType;
use tokens::tokens::media_files::MediaFileToken;

// TODO(bt, 2024-01-16): A ref type with <'a> lifetime of inner data instead of ownership?
pub enum BatchGenerationEntity {
  MediaFile(MediaFileToken),
}

// TODO(bt, 2024-01-16): Codegen? Make traits for these? Maybe overkill.
impl BatchGenerationEntity {
  pub fn get_entity_type(&self) -> BatchGenerationEntityType {
    match self {
      Self::MediaFile(_) => BatchGenerationEntityType::MediaFile,
    }
  }

  pub fn get_entity_token_str(&self) -> &str {
    match self {
      Self::MediaFile(token) => token.as_str(),
    }
  }

  pub fn get_composite_keys(&self) -> (BatchGenerationEntityType, &str) {
    match self {
      Self::MediaFile(token) => (BatchGenerationEntityType::MediaFile, token.as_str()),
    }
  }
}
