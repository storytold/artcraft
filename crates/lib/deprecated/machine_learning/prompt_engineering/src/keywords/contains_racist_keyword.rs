use std::collections::HashSet;

use once_cell::sync::Lazy;

const TERMS : &str = include_str!("../../../../../../../includes/binary_includes/safety/dictionary_racist_terms.txt");

pub (crate) fn contains_racist_keyword(prompt_tokens: &[String]) -> bool {
  static TERM_DICTIONARY : Lazy<HashSet<String>> = Lazy::new(|| {
    TERMS.lines()
        .map(|line| line.trim().to_lowercase())
        .filter(|line| !line.is_empty() && !line.starts_with("#"))
        .collect::<HashSet<String>>()
  });

  prompt_tokens.iter().any(|term| TERM_DICTIONARY.contains(term))
}
