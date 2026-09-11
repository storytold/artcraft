
/// Convert a boolean to a lower case string, with values of either "true" or "false".
pub fn bool_to_str(value: bool) -> &'static str {
  if value {
    "true"
  } else {
    "false"
  }
}

#[cfg(test)]
mod tests {
  use crate::bool_to_str::bool_to_str;

  #[test]
  fn test_true() {
    assert_eq!(bool_to_str(true), "true");
  }

  #[test]
  fn test_false() {
    assert_eq!(bool_to_str(false), "false");
  }
}
