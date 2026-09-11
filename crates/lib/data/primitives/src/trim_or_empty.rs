
/// Trim the string. If it trims to empty, return None.
pub fn trim_or_empty(input: &str) -> Option<&str> {
  let trimmed = input.trim();
  if trimmed.is_empty() {
    None
  } else {
    Some(trimmed)
  }
}

#[cfg(test)]
mod tests {
  use crate::trim_or_empty::trim_or_empty;

  #[test]
  fn empty() {
    assert_eq!(trim_or_empty(""), None);
    assert_eq!(trim_or_empty("    "), None);
    assert_eq!(trim_or_empty("   \n\t   \t   "), None);
  }

  fn trimmed() {
    assert_eq!(trim_or_empty("hello"), Some("hello"));
    assert_eq!(trim_or_empty("    world    "), Some("world"));
    assert_eq!(trim_or_empty("   \n\tsuper\nmario\tbros\n\t   \n  "), Some("super\nmario\tbros"));
  }
}