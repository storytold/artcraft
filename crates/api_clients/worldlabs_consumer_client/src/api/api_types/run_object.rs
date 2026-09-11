use std::collections::HashMap;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::Value;

const RUN_MIME_TYPE: &str = "application/run+json";

const RUN_VERSION : &str = "0.0.1";

/// World Labs' API is very frontend driven
/// They send whole objects back to the frontend that the frontend is in charge of mutatingbjects or PATCH them back to the server (yuck):
///   - request #1 - create run
///   - request #6 - patch run after image upload
/// Gotta go fast?
#[derive(Serialize, Deserialize, Clone)]
pub struct RunObject {
  /// The primary ID of the run.
  /// This won't exist until we post it to the server.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub id: Option<String>,

  pub metadata: RunObjectMetadata,
  pub mime_type: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct RunObjectMetadata {
  pub version: String,

  #[serde(rename = "createdAt")]
  pub created_at: u64,

  #[serde(rename = "updatedAt")]
  pub updated_at: u64,

  #[serde(rename = "usesAdvancedEditing")]
  pub uses_advanced_editing: bool,

  #[serde(rename = "draftMode")]
  pub draft_mode: bool,

  /// Polymorphic set of ID-to-object mappings.
  pub nodes: HashMap<String, Value>,
}

impl Default for RunObject {
  fn default() -> Self {
    let now = Utc::now();
    let now = now.timestamp().unsigned_abs() * 1000; // Millisecond resolution
    Self {
      id: None,
      metadata: RunObjectMetadata{
        version: RUN_VERSION.to_string(),
        created_at: now,
        updated_at: now,
        uses_advanced_editing: false,
        draft_mode: false,
        nodes: HashMap::new(),
      },
      mime_type: RUN_MIME_TYPE.to_string(),
    }
  }
}

#[cfg(test)]
mod tests {
  use crate::api::api_types::run_object::RunObject;

  #[test]
  fn default_runobject() {
    let object = RunObject::default();
    assert!(object.id.is_none());
    assert_eq!(&object.metadata.version, "0.0.1");
    assert!(object.metadata.created_at > 1705433415549);
    assert!(object.metadata.updated_at > 1705433415549);
    assert_eq!(&object.mime_type, "application/run+json");
  }
}

