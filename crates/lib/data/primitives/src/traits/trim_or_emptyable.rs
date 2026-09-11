/// Something that can be trimmed
pub trait TrimOrEmptyable {
  /// Trim the string. If it trims to empty, return None.
  fn trim_or_empty(&self) -> Option<&str>;

  /// Trim the string. If it trims to empty, return None.
  fn new_string_trim_or_empty(&self) -> Option<String> {
    self.trim_or_empty().map(|s| s.to_string())
  }
}

// TODO: Can't create this due to conflicting implementations
// impl<T> TrimOrEmptyable for T
//   where T: AsRef<str>
// {
//   fn trim_or_empty(&self) -> Option<&str> {
//     self.as_ref().trim_or_empty()
//   }
// }

impl TrimOrEmptyable for Option<&str> {
  fn trim_or_empty(&self) -> Option<&str> {
    self.map(|s| s.trim())
        .filter(|s| !s.is_empty())
  }
}

impl TrimOrEmptyable for Option<String> {
  fn trim_or_empty(&self) -> Option<&str> {
    self.as_deref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
  }
}

impl TrimOrEmptyable for &str {
  fn trim_or_empty(&self) -> Option<&str> {
    match self.trim() {
      "" => None,
      s => Some(s),
    }
  }
}

impl TrimOrEmptyable for String {
  fn trim_or_empty(&self) -> Option<&str> {
    match self.trim() {
      "" => None,
      s => Some(s),
    }
  }
}

#[cfg(test)]
mod tests {
  use crate::traits::trim_or_emptyable::TrimOrEmptyable;

  mod str_primitive {
    use super::*;

    #[test]
    fn empty() {
      assert_eq!("".trim_or_empty(), None);
      assert_eq!("    ".trim_or_empty(), None);
      assert_eq!("   \n\t   \t   ".trim_or_empty(), None);
    }

    #[test]
    fn trimmed() {
      assert_eq!("hello".trim_or_empty(), Some("hello"));
      assert_eq!("    world    ".trim_or_empty(), Some("world"));
      assert_eq!("   \n\tsuper\nmario\tbros\n\t   \n  ".trim_or_empty(), Some("super\nmario\tbros"));
    }
  }

  mod string_primitive {
    use super::*;

    #[test]
    fn empty() {
      assert_eq!("".to_string().trim_or_empty(), None);
      assert_eq!("    ".to_string().trim_or_empty(), None);
      assert_eq!("   \n\t   \t   ".to_string().trim_or_empty(), None);
    }

    #[test]
    fn trimmed() {
      assert_eq!("hello".to_string().trim_or_empty(), Some("hello"));
      assert_eq!("    world    ".to_string().trim_or_empty(), Some("world"));
      assert_eq!("   \n\tsuper\nmario\tbros\n\t   \n  ".to_string().trim_or_empty(), Some("super\nmario\tbros"));
    }
  }

  mod option_str_primitive {
    use super::*;

    #[test]
    fn empty() {
      assert_eq!(Some("").trim_or_empty(), None);
      assert_eq!(Some("    ").trim_or_empty(), None);
      assert_eq!(Some("   \n\t   \t   ").trim_or_empty(), None);
      assert_eq!(None::<&str>.trim_or_empty(), None);

    }

    #[test]
    fn trimmed() {
      assert_eq!(Some("hello").trim_or_empty(), Some("hello"));
      assert_eq!(Some("    world    ").trim_or_empty(), Some("world"));
      assert_eq!(Some("   \n\tsuper\nmario\tbros\n\t   \n  ").trim_or_empty(), Some("super\nmario\tbros"));
    }
  }

  mod option_string_primitive {
    use super::*;
    #[test]
    fn empty() {
      assert_eq!(Some("".to_string()).trim_or_empty(), None);
      assert_eq!(Some("    ".to_string()).trim_or_empty(), None);
      assert_eq!(Some("   \n\t   \t   ".to_string()).trim_or_empty(), None);
      assert_eq!(None::<String>.trim_or_empty(), None);
    }

    #[test]
    fn trimmed() {
      assert_eq!(Some("hello".to_string()).trim_or_empty(), Some("hello"));
      assert_eq!(Some("    world    ".to_string()).trim_or_empty(), Some("world"));
      assert_eq!(Some("   \n\tsuper\nmario\tbros\n\t   \n  ".to_string()).trim_or_empty(), Some("super\nmario\tbros"));
    }
  }
}
