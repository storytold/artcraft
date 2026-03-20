//! Only imported in tests

use serde::{Serialize, de::DeserializeOwned};

pub fn to_json<T: Serialize>(t: &T) -> String {
  serde_json::to_string(t)
      .expect("serialization error")
      .replace("\"", "") // JSON values are quoted, so we remove quotes
}

/// Assert that the Serialize is represented by the expected string value.
/// This is useful for ensuring stability of serialization.
pub fn assert_serialization<T: Serialize>(t: T, expected: &str) {
  assert_eq!(&to_json(&t), expected);
}

/// Assert that a JSON string deserializes to the expected value.
/// This is useful for ensuring stability of deserialization.
pub fn assert_deserialization<T: DeserializeOwned + PartialEq + std::fmt::Debug>(json_str: &str, expected: T) {
  let quoted = format!("\"{}\"", json_str);
  let actual: T = serde_json::from_str(&quoted)
      .unwrap_or_else(|e| panic!("failed to deserialize {:?}: {}", json_str, e));
  assert_eq!(actual, expected);
}
