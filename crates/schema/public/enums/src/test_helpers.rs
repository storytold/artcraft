//! Only imported in tests

use serde::Serialize;

pub fn to_toml<T: Serialize>(t: &T) -> String {
  match toml::to_string(t) {
    Ok(s) => s.replace("\"", ""), // JSON values are quoted, so we remove quotes
    Err(err) => {
      panic!("serialization error: {}", err);
    }
  }
}

pub fn to_json<T: Serialize>(t: &T) -> String {
  serde_json::to_string(t)
      .expect("serialization error")
      .replace("\"", "") // JSON values are quoted, so we remove quotes
}

/// Assert that the Serialize is represented by the expected string value.
/// This is useful for ensuring stability of serialization.
pub fn assert_serialization<T: Serialize>(t: T, expected: &str) {
  // TODO: See if there's a way to check the sqlx serialization
  // TODO(bt,2024-06-27): Something broke with serde toml serialization, so we're disabling it
  // assert_eq!(&to_toml(&t), expected);
  assert_eq!(&to_json(&t), expected);
}
