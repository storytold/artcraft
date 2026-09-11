
/// Convert string values to bool.
/// Empty, "0", "false", "False", and "FALSE" are considered false
pub fn str_to_bool(input: &str) -> bool {
  match input {
    "" | "0" | "false" | "False" | "FALSE" => false,
    _ => true,
  }
}

#[cfg(test)]
mod tests {
  use crate::str_to_bool::str_to_bool;

  #[test]
  fn false_values() {
    assert!(!str_to_bool(""));
    assert!(!str_to_bool("0"));
    assert!(!str_to_bool("false"));
    assert!(!str_to_bool("False"));
    assert!(!str_to_bool("FALSE"));
  }

  #[test]
  fn true_values() {
    assert!(str_to_bool("    "));
    assert!(str_to_bool("true"));
    assert!(str_to_bool("TRUE"));
    assert!(str_to_bool("whatever"));
  }
}
