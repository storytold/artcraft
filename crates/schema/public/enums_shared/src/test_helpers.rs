//! Only imported in tests

use serde::Serialize;

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
