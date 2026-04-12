use serde_json::{Map, Value};

/// Extract the `model_mesh` key from a webhook success payload object.
/// Returns a clone of the value if the key exists.
pub fn extract_model_mesh(obj: &Map<String, Value>) -> Option<Value> {
  obj.get("model_mesh").cloned()
}
