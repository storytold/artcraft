use once_cell::sync::Lazy;
use regex::RegexSet;

pub (crate) fn nsfw_regex(text: &str) -> bool {
  let text = text.to_lowercase();

  // NB: Unfortunately Rust Regex does not support look-around, so our age matching is awkward
  // Matching digits "0" and "1" are tricky because they would match "19" and "0100".
  static AGE_REGEX: Lazy<RegexSet> = Lazy::new(|| {
    let patterns = [
      // English
      r"\b(no|without|missing)\b(.{0,7})\b(clothes|clothing|bra|panties|panty|clothing)s?\b",

    ];
    RegexSet::new(&patterns).expect("regex should be valid")
  });

  //println!("text: {:?}", text);

  AGE_REGEX.matches(&text).matched_any()
}

#[cfg(test)]
mod tests {

  mod english {

    mod positive_match {
      use crate::regexes::nsfw_regex::nsfw_regex;

      #[test]
      fn spot_check_matches() {
        assert!(nsfw_regex("no panties"));
        assert!(nsfw_regex("without panties"));
        assert!(nsfw_regex("no clothing"));
        assert!(nsfw_regex("missing clothing"));
      }
    }
  }
}
