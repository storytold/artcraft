
/// Converts the first letter of a string to uppercase.
/// eg, "foobar" is converted to "Foobar".
/// From https://stackoverflow.com/a/53570840
pub fn first_letter_uppercase(s: &str) -> String {
  let mut c = s.chars();
  match c.next() {
    None => String::new(),
    Some(f) => f.to_uppercase().collect::<String>() + c.as_str(),
  }
}

#[cfg(test)]
mod tests {
  use crate::str::first_letter_uppercase::first_letter_uppercase;

  #[test]
  fn empty() {
    assert_eq!(first_letter_uppercase(""), "");
  }

  #[test]
  fn lowercase() {
    assert_eq!(first_letter_uppercase("f"), "F");
    assert_eq!(first_letter_uppercase("foo"), "Foo");
    assert_eq!(first_letter_uppercase("fOO"), "FOO");
    assert_eq!(first_letter_uppercase("asdf"), "Asdf");
  }

  #[test]
  fn uppercase() {
    assert_eq!(first_letter_uppercase("F"), "F");
    assert_eq!(first_letter_uppercase("Foo"), "Foo");
    assert_eq!(first_letter_uppercase("FOO"), "FOO");
    assert_eq!(first_letter_uppercase("ASDF"), "ASDF");
  }
}
