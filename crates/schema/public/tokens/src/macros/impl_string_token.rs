
// Default methods for string wrapper types.
macro_rules! impl_string_token {
  ($t:ident) => {
    // Constructors and accessors.
    impl $t {
      #[inline]
      pub fn new(value: String) -> Self {
        $t(value)
      }

      #[inline]
      pub fn new_from_str(value: &str) -> Self {
        $t(value.to_string())
      }

      #[inline]
      pub fn as_str(&self) -> &str {
        &self.0
      }
    }

    // Display trait.
    impl std::fmt::Display for $t {
      fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
      }
    }
  }
}
