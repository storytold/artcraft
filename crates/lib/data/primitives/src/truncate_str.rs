
/// Truncate a string based on character length, not byte length.
/// Taken from https://stackoverflow.com/a/38461750
pub fn truncate_str(s: &str, max_chars: usize) -> &str {
  match s.char_indices().nth(max_chars) {
    None => s,
    Some((idx, _)) => &s[..idx],
  }
}

#[cfg(test)]
mod tests {
  use crate::truncate_str::truncate_str;

  #[test]
  fn truncate() {
    assert_eq!(truncate_str("hello", 0), "");
    assert_eq!(truncate_str("hello", 1), "h");
    assert_eq!(truncate_str("hello", 3), "hel");
    assert_eq!(truncate_str("hello", 5), "hello");
    assert_eq!(truncate_str("hello", 10), "hello");
    assert_eq!(truncate_str("hello", 10000), "hello");
  }

  #[test]
  fn truncate_preserves_utf8_boundaries() {
    let prefix = "a".repeat(254);
    let accented = format!("{}éz", prefix);
    let emoji = format!("{}😀z", prefix);

    assert_eq!(truncate_str(&accented, 255), format!("{}é", prefix));
    assert_eq!(truncate_str(&emoji, 255), format!("{}😀", prefix));
  }
}
