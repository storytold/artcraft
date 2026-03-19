use once_cell::sync::Lazy;
use regex::Regex;

use crate::keywords::contains_children_keyword::contains_children_keyword;
use crate::keywords::contains_potential_minor_keyword::contains_potential_minor_keyword;
use crate::keywords::contains_racist_keyword::contains_racist_keyword;
use crate::keywords::contains_sex_keyword::contains_sex_keyword;
use crate::regexes::minor_regex::lowercase_mentions_underage;
use crate::regexes::nsfw_regex::nsfw_regex;
use crate::regexes::potential_minor_regex::potential_minor_regex;

/// Classification of a text prompt
pub struct PromptClassification {
  pub prompt_references_children: bool,
  pub prompt_references_potential_minors: bool,
  pub prompt_references_sex: bool,
  pub prompt_references_racism: bool,
  pub prompt_references_violence: bool,
}

impl PromptClassification {
  pub fn is_abusive(&self) -> bool {
    self.prompt_references_racism || self.is_child_abuse()

  }

  pub fn is_child_abuse(&self) -> bool {
    self.prompt_references_children && ( self.prompt_references_sex || self.prompt_references_violence )
  }
}


pub fn classify_prompt(text_prompt: &str) -> PromptClassification  {
  let text_prompt = text_prompt.to_lowercase();

  let prompt_tokens_alpha = SPACES_REGEX.split(&text_prompt)
      .map(|term| term.trim().to_string())
      .map(|term| term.chars().filter(|c| c.is_alphanumeric()).collect::<String>())
      .collect::<Vec<String>>();

  let prompt_tokens_lower = SPACES_REGEX.split(&text_prompt)
      .map(|term| term.trim().to_string())
      .collect::<Vec<String>>();

  let mut prompt_tokens= Vec::with_capacity(prompt_tokens_alpha.len() + prompt_tokens_lower.len());

  prompt_tokens.extend(prompt_tokens_alpha);
  prompt_tokens.extend(prompt_tokens_lower);

  let prompt_references_children = contains_children_keyword(&prompt_tokens) ||  lowercase_mentions_underage(&text_prompt);
  let prompt_references_potential_minors = contains_potential_minor_keyword(&prompt_tokens) || potential_minor_regex(&text_prompt);
  let prompt_references_sex = contains_sex_keyword(&prompt_tokens) || nsfw_regex(&text_prompt);
  let prompt_references_racism = contains_racist_keyword(&prompt_tokens);
  let prompt_references_violence = false; // TODO

  PromptClassification {
    prompt_references_children,
    prompt_references_potential_minors,
    prompt_references_sex,
    prompt_references_racism,
    prompt_references_violence,
  }
}

static SPACES_REGEX : Lazy<Regex> = Lazy::new(|| {
  // NB: Includes non-ascii, such as "，".
  Regex::new(r"[\s,;，]+").expect("regex should be valid")
});


#[cfg(test)]
mod tests {
  use speculoos::asserting;

  use crate::classify_prompt::SPACES_REGEX;

  fn regex_split(text: &str) -> Vec<&str> {
    SPACES_REGEX.split(text).map(|s| s.trim()).collect()
  }

  #[test]
  fn test_regex() {
    asserting("regex works")
        .that(&regex_split("foo,bar,baz"))
        .is_equal_to(vec!["foo", "bar", "baz"]);

    asserting("regex works")
        .that(&regex_split("foo;bar;baz"))
        .is_equal_to(vec!["foo", "bar", "baz"]);

    asserting("regex works")
        .that(&regex_split("foo, bar, baz"))
        .is_equal_to(vec!["foo", "bar", "baz"]);

    asserting("regex works")
        .that(&regex_split("foo\n\nbar  baz"))
        .is_equal_to(vec!["foo", "bar", "baz"]);
  }

}
