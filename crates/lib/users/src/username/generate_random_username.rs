use crate::username::constants::USERNAME_MAX_LENGTH;
use collections::random_from_array::random_from_array;
use once_cell::sync::Lazy;
use primitives::iterators::iterate_trimmed_lines_without_comments::iterate_trimmed_lines_without_comments;
use primitives::str::first_letter_uppercase::first_letter_uppercase;
use rand::distr::{Distribution, StandardUniform};
use rand::Rng;
use std::collections::HashSet;

pub const ADJECTIVES : &str = include_str!("../../../../../includes/binary_includes/usernames/atoms/username_adjectives.txt");
pub const NOUNS : &str = include_str!("../../../../../includes/binary_includes/usernames/atoms/username_nouns.txt");
pub const NOUNS_ANIMALS: &str = include_str!("../../../../../includes/binary_includes/usernames/atoms/username_nouns_animals.txt");

static ALL_NOUNS : Lazy<Vec<&'static str>> = Lazy::new(|| {
  iterate_trimmed_lines_without_comments(NOUNS.lines())
      .chain(iterate_trimmed_lines_without_comments(NOUNS_ANIMALS.lines()))
      .collect::<HashSet<&'static str>>()
      .into_iter()
      .collect()
});

static ALL_ADJECTIVES : Lazy<Vec<&'static str>> = Lazy::new(|| {
  iterate_trimmed_lines_without_comments(ADJECTIVES.lines())
      .collect::<HashSet<&'static str>>()
      .into_iter()
      .collect::<Vec<&'static str>>()
});

/// Generate a random username for onboarding purposes.
/// This function is infallible and will always return a possible username.
pub fn generate_random_username() -> String {
  for _ in 0..100 {
    if let Some(username) = generate_candidate_username() {
      if username.len() > USERNAME_MAX_LENGTH {
        continue;
      }
      return username;
    }
  }

  "random_username".to_string()
}

enum UsernameFormat {
  CamelCase,
  KebabCase,
  SnakeCase,
  CamelKebabCase,
  CamelSnakeCase,
  ScreamingSnakeCase,
}

impl Distribution<UsernameFormat> for StandardUniform {
  fn sample<R: Rng + ?Sized>(&self, rng: &mut R) -> UsernameFormat {
    match rng.gen_range(0..=5) {
      0 => UsernameFormat::CamelCase,
      1 => UsernameFormat::KebabCase,
      2 => UsernameFormat::SnakeCase,
      3 => UsernameFormat::CamelKebabCase,
      4 => UsernameFormat::CamelSnakeCase,
      _ => UsernameFormat::ScreamingSnakeCase,
    }
  }
}
fn generate_candidate_username() -> Option<String> {
  let adjective = random_from_array(&ALL_ADJECTIVES)?;
  let noun = random_from_array(&ALL_NOUNS)?;

  let format : UsernameFormat = rand::random();
  let mut candidate_username = match format {
    UsernameFormat::CamelCase => format!("{}{}", first_letter_uppercase(adjective), first_letter_uppercase(noun)),
    UsernameFormat::KebabCase => format!("{}-{}", adjective, noun),
    UsernameFormat::SnakeCase => format!("{}_{}", adjective, noun),
    UsernameFormat::CamelKebabCase => format!("{}-{}", first_letter_uppercase(adjective), first_letter_uppercase(noun)),
    UsernameFormat::CamelSnakeCase => format!("{}_{}", first_letter_uppercase(adjective), first_letter_uppercase(noun)),
    UsernameFormat::ScreamingSnakeCase => format!("{}_{}", adjective.to_uppercase(), noun.to_uppercase()),
  };

  let digit = random_digit_probably_safe();

  candidate_username = match format {
    UsernameFormat::CamelCase => format!("{}{}", candidate_username, digit),
    UsernameFormat::KebabCase
    | UsernameFormat::CamelKebabCase => format!("{}-{}", candidate_username, digit),
    UsernameFormat::SnakeCase
    | UsernameFormat::CamelSnakeCase
    | UsernameFormat::ScreamingSnakeCase => format!("{}_{}", candidate_username, digit),
  };

  Some(candidate_username)
}

fn random_digit_probably_safe() -> u32 {
  for _ in 0..100 {
    if let Some(digit) = maybe_safe_random_digit() {
      return digit;
    }
  }
  random_digit()
}

/// Don't return potentially offensive numbers
fn maybe_safe_random_digit() -> Option<u32> {
  match random_digit() {
    69 => None,
    420 => None,
    666 => None,
    8008 => None,
    80085 => None,
    8008135 => None,
    digit => Some(digit),
  }
}

fn random_digit() -> u32 {
  // Non-uniform probability for the number of digits
  let num_digits = rand::thread_rng().gen_range(0..100);
  match num_digits {
    0..5 => rand::thread_rng().gen_range(0..10), // 5%
    5..25 => rand::thread_rng().gen_range(10..100), // 20%
    25..60 => rand::thread_rng().gen_range(100..1000), // 35%
    60..90 => rand::thread_rng().gen_range(1000..10000), // 30%
    _ => rand::thread_rng().gen_range(10000..100000), // 10%
  }
}

#[cfg(test)]
mod tests {
  use std::collections::HashSet;
  use crate::username::generate_random_username::maybe_safe_random_digit;
  use crate::username::generate_random_username::generate_random_username;

  mod usernames {
    use super::*;

    #[test]
    fn test_base_case_success() {
      assert!(generate_random_username().len() > 0);
    }

    #[test]
    fn generate_lots() {
      let mut collection = HashSet::new();
      for _ in 0..100 {
        collection.insert(generate_random_username());
      }
      assert!(collection.len() > 95); // NB: Should be an easy bar to hit
    }
  }

  mod random_numbers {
    use super::*;

    #[test]
    fn generate_lots_of_numbers() {
      let mut collection = HashSet::new();
      for _ in 0..10000 {
        collection.insert(maybe_safe_random_digit());
      }
      assert!(collection.len() > 1000);
    }
  }
}
