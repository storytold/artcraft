use once_cell::sync::Lazy;
use regex::RegexSet;

pub (crate) fn potential_minor_regex(text: &str) -> bool {
  let text = text.to_lowercase();

  // NB: Unfortunately Rust Regex does not support look-around, so our age matching is awkward
  // Matching digits "0" and "1" are tricky because they would match "19" and "0100".
  static AGE_REGEX: Lazy<RegexSet> = Lazy::new(|| {
    let patterns = [
      // English
      r"\b(teen(age(r)?)?s?)\b",
      r"\b(young|tiny|small|petite)\b(.{0,7})\b(girl|boy)s?\b",

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
      use crate::regexes::potential_minor_regex::potential_minor_regex;

      #[test]
      fn spot_check_matches() {
        assert!(potential_minor_regex("teen"));
        assert!(potential_minor_regex("teens"));
        assert!(potential_minor_regex("teenage"));
        assert!(potential_minor_regex("teenager"));
        assert!(potential_minor_regex("teenagers"));

        assert!(potential_minor_regex("tiny girl"));
        assert!(potential_minor_regex("tiny boy"));
        assert!(potential_minor_regex("small boy"));
        assert!(potential_minor_regex("small girl"));

        assert!(potential_minor_regex("tiny girls"));
        assert!(potential_minor_regex("tiny boys"));
        assert!(potential_minor_regex("small boys"));
        assert!(potential_minor_regex("small girls"));

        assert!(potential_minor_regex("young girl"));
        assert!(potential_minor_regex("young boy"));
        assert!(potential_minor_regex("young boy"));
        assert!(potential_minor_regex("young girl"));

        assert!(potential_minor_regex("petite girl"));
        assert!(potential_minor_regex("petite boy"));
        assert!(potential_minor_regex("petite boy"));
        assert!(potential_minor_regex("petite girl"));
      }
    }
  }
}
