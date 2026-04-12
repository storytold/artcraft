use serde_json::{Map, Value};

/// Extract the `model_glb` key from a webhook success payload object.
/// Returns a clone of the value if the key exists.
pub fn extract_model_glb(obj: &Map<String, Value>) -> Option<Value> {
  obj.get("model_glb").cloned()
}
