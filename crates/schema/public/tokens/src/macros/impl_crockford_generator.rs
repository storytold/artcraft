
// TODO(bt, 2023-11-01): Don't generate slurs or dangerous terms in the token generator
//  see: https://news.ycombinator.com/item?id=35337210
//  see: https://www.reddit.com/r/ProgrammerHumor/comments/3ov56n/randomly_generating_ids_can_be_dangerous/
//  see: https://stackoverflow.com/a/36294356
macro_rules! impl_crockford_generator {
  ($t:ident, $total_string_length:literal, $variant:path, $character_case:ident) => {
    impl $t {
      /// Constructor for a new token.
      #[inline]
      pub fn generate() -> Self {
        use rand::Rng;

        let mut rng = rand::thread_rng();

        let charset = Self::token_character_set();
        let entropy_length = Self::entropic_character_len();

        let mut entropy_part: String = (0..entropy_length)
          .map(|_| {
            let idx = rng.gen_range(0..charset.len());
            charset[idx] as char
          })
          .collect();

        let mut i = 0;
        while !crate::safe_entropy::entropy_is_safe(&entropy_part) && i < 10 {
          i += 1;
          entropy_part = (0..entropy_length)
            .map(|_| {
              let idx = rng.gen_range(0..charset.len());
              charset[idx] as char
            })
            .collect();
        }

        let token_prefix = Self::token_prefix();

        let token = format!("{}{}", token_prefix, entropy_part);

        $t(token)
      }

      /// Constructor for a new token to be used **DETERMINISTICALLY** in tests and seeding.
      /// This will not use a real RNG, so do not use in production code!
      /// Once called, it will output the same random numbers in sequence.
      pub fn reset_rng_for_testing_and_dev_seeding_never_use_in_production_seriously(state: u64) {
        let deterministic = crate::deterministic_rng::DeterministicRng::get_instance().expect("tests should not fail due to mutex");
        deterministic.reset_rng(state);
      }

      /// Constructor for a new token to be used **DETERMINISTICALLY** in tests and seeding.
      /// This will not use a real RNG, so do not use in production code!
      /// Once called, it will output the same random numbers in sequence.
      pub fn generate_for_testing_and_dev_seeding_never_use_in_production_seriously() -> Self {
        use rand::Rng;

        // FIXME(bt,2023-12-14): This is bad error handling. (Maybe panic if lock is poisoned?)
        let deterministic = crate::deterministic_rng::DeterministicRng::get_instance().expect("tests should not fail due to mutex");
        let mut rng = deterministic.get_rng().expect("tests should not fail due to mutex");

        let charset = Self::token_character_set();
        let entropy_length = Self::entropic_character_len();

        let mut entropy_part: String = (0..entropy_length)
          .map(|_| {
            let idx = rng.gen_range(0..charset.len());
            charset[idx] as char
          })
          .collect();

        let mut i = 0;
        while !crate::safe_entropy::entropy_is_safe(&entropy_part) && i < 10 {
          i += 1;
          entropy_part = (0..entropy_length)
            .map(|_| {
              let idx = rng.gen_range(0..charset.len());
              charset[idx] as char
            })
            .collect();
        }

        let token_prefix = Self::token_prefix();

        let token = format!("{}{}", token_prefix, entropy_part);

        $t(token)
      }

      #[inline]
      pub fn entropy_suffix(&self) -> &str {
        use crate::prefixes::PrefixGenerator;

        &self.0
          .strip_prefix($variant.prefix())
          .unwrap_or(&self.0)
      }

      #[inline]
      pub fn entropic_character_len() -> usize {
        let token_prefix = Self::token_prefix();
        $total_string_length.saturating_sub(token_prefix.len())
      }

      #[inline]
      pub fn token_prefix() -> &'static str {
        use crate::prefixes::PrefixGenerator;

        $variant.prefix()
      }

      #[inline]
      pub fn token_character_set() -> &'static [u8] {
        match crate::TokenCharacterSet::$character_case {
          crate::TokenCharacterSet::CrockfordUpper => crate::CROCKFORD_UPPERCASE_CHARSET,
          crate::TokenCharacterSet::CrockfordLower => crate::CROCKFORD_LOWERCASE_CHARSET,
          crate::TokenCharacterSet::CrockfordMixed => crate::CROCKFORD_MIXED_CASE_CHARSET,
        }
      }
    }

    #[cfg(test)]
    #[test]
    fn test_entropy_is_sufficient() {
      assert!($t::entropic_character_len() > crate::MINIMUM_CHARACTER_ENTROPY);
    }

    #[cfg(test)]
    #[test]
    fn test_token_length() {
      assert_eq!($t::generate().as_str().len(), $total_string_length);
    }

    #[cfg(test)]
    #[test]
    fn test_tokens_are_random() {
      let mut tokens = std::collections::HashSet::new();
      for _ in 0..100 {
        tokens.insert($t::generate().to_string());
      }
      assert_eq!(tokens.len(), 100);
    }

    #[cfg(test)]
    #[test]
    fn test_character_set() {
      let token_string = $t::generate().to_string();
      let prefix = $t::token_prefix();
      let random_part = token_string.replace(prefix, "");

      assert!(random_part.len() > crate::MINIMUM_CHARACTER_ENTROPY);

      match crate::TokenCharacterSet::$character_case {
        crate::TokenCharacterSet::CrockfordUpper => assert!(random_part.chars().all(|c| c.is_numeric() || c.is_uppercase())),
        crate::TokenCharacterSet::CrockfordLower => assert!(random_part.chars().all(|c| c.is_numeric() || c.is_lowercase())),
        crate::TokenCharacterSet::CrockfordMixed => assert!(random_part.chars().all(|c| c.is_numeric() || c.is_uppercase() || c.is_lowercase())),
      }
    }

    #[cfg(test)]
    #[test]
    fn test_prefix_ends_with_separator() {
      let prefix = $t::token_prefix();
      assert!(prefix.ends_with(":") || prefix.ends_with("_"));

      let token_string = $t::generate().to_string();
      assert!(token_string.contains(":") || token_string.contains("_"));
    }

    #[cfg(test)]
    #[test]
    fn test_token_begins_with_prefix() {
      let prefix = $t::token_prefix();
      let token_string = $t::generate().to_string();
      assert!(token_string.starts_with(prefix));
    }
  }
}
