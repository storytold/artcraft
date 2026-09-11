
/// Implement `Display` and `Debug` for enums that have a `.to_str()` method.
/// This ensures that the casing follows whatever `.to_str()` specifies.
macro_rules! impl_enum_display_and_debug_using_to_str {
  ($t:ident) => {

    // Debug trait.
    // Requires that the type has `.to_str()`.
    impl std::fmt::Debug for $t {
      fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.to_str())
      }
    }

    // Display trait.
    // Requires that the type has `.to_str()`.
    impl std::fmt::Display for $t {
      fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.to_str())
      }
    }

    // NB: This test requires `strum::{EnumIter}` on the enum
    #[cfg(test)]
    #[test]
    fn test_display_trait_matches_to_str() {
      use strum::IntoEnumIterator;
      for variant in $t::iter() {
        assert_eq!(format!("{}", variant), variant.to_str());
      }
    }

    // NB: This test requires `strum::{EnumIter}` on the enum
    #[cfg(test)]
    #[test]
    fn test_debug_trait_matches_to_str() {
      use strum::IntoEnumIterator;
      for variant in $t::iter() {
        assert_eq!(format!("{:?}", variant), variant.to_str());
      }
    }
  }
}

