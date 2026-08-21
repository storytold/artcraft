use std::collections::HashSet;

use mysql_queries::queries::tags::upsert_tags::NewTagValue;

use crate::http_server::common_responses::common_web_error::CommonWebError;

/// Cap on distinct tags in a single request (after dedupe).
pub const MAX_TAGS_PER_REQUEST: usize = 100;

/// `tags.tag_value` is a VARCHAR(255).
pub const MAX_TAG_LENGTH_CHARS: usize = 255;

/// Parse the "either a comma-separated string or a list" tag input shape
/// shared by the add/set endpoints. Exactly one of the two fields must be
/// set (400 otherwise). Each entry is trimmed; empty entries are dropped;
/// duplicates are deduped case-insensitively (first casing wins).
///
/// An empty RESULT is not an error here — "set to nothing" is a valid
/// clear operation. Endpoints where zero tags makes no sense (the adds)
/// should follow up with [`require_non_empty_tags`].
pub fn parse_tag_input(
  maybe_tags: Option<&str>,
  maybe_tags_list: Option<&[String]>,
) -> Result<Vec<NewTagValue>, CommonWebError> {
  let raw_values: Vec<&str> = match (maybe_tags, maybe_tags_list) {
    (Some(_), Some(_)) => {
      return Err(CommonWebError::BadInputWithSimpleMessage(
        "supply either maybe_tags or maybe_tags_list, not both".to_string(),
      ));
    }
    (None, None) => {
      return Err(CommonWebError::BadInputWithSimpleMessage(
        "supply one of maybe_tags or maybe_tags_list".to_string(),
      ));
    }
    (Some(csv), None) => csv.split(',').collect(),
    (None, Some(list)) => list.iter().map(|s| s.as_str()).collect(),
  };

  let mut seen_lowercase = HashSet::new();
  let mut new_tags = Vec::new();

  for raw_value in raw_values {
    let trimmed = raw_value.trim();
    if trimmed.is_empty() {
      continue;
    }
    // NB: the lowercased form must be length-checked too — Unicode
    // lowercasing can EXPAND a string (e.g. 'İ' U+0130 lowercases to
    // "i\u{307}", two chars), and both columns are VARCHAR(255).
    let lowercase = trimmed.to_lowercase();
    if trimmed.chars().count() > MAX_TAG_LENGTH_CHARS
      || lowercase.chars().count() > MAX_TAG_LENGTH_CHARS
    {
      return Err(CommonWebError::BadInputWithSimpleMessage(
        format!("tag is too long (max {} characters)", MAX_TAG_LENGTH_CHARS),
      ));
    }

    if !seen_lowercase.insert(lowercase.clone()) {
      continue;
    }

    new_tags.push(NewTagValue {
      tag_value: trimmed.to_string(),
      tag_value_lowercase: lowercase,
    });
  }

  if new_tags.len() > MAX_TAGS_PER_REQUEST {
    return Err(CommonWebError::BadInputWithSimpleMessage(
      format!("too many tags in one request (max {})", MAX_TAGS_PER_REQUEST),
    ));
  }

  Ok(new_tags)
}

/// 400 if sanitization produced zero tags. For the add endpoints, where
/// "add nothing" is a client bug rather than a clear operation.
pub fn require_non_empty_tags(new_tags: &[NewTagValue]) -> Result<(), CommonWebError> {
  if new_tags.is_empty() {
    return Err(CommonWebError::BadInputWithSimpleMessage(
      "no tags supplied after trimming".to_string(),
    ));
  }
  Ok(())
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn parses_csv_with_trimming_and_case_insensitive_dedupe() {
    let tags = parse_tag_input(Some(" Cats , sci-fi ,Wallpaper,, cats "), None).unwrap();
    let values: Vec<&str> = tags.iter().map(|t| t.tag_value.as_str()).collect();
    assert_eq!(values, vec!["Cats", "sci-fi", "Wallpaper"]);
    assert_eq!(tags[0].tag_value_lowercase, "cats");
  }

  #[test]
  fn rejects_both_or_neither_input() {
    assert!(parse_tag_input(Some("a"), Some(&["b".to_string()])).is_err());
    assert!(parse_tag_input(None, None).is_err());
  }

  #[test]
  fn rejects_tag_whose_lowercase_form_expands_past_the_limit() {
    // 'İ' (U+0130) is one char but lowercases to two ("i\u{307}"), so
    // 255 of them pass a naive check while the lowercase form is 510
    // chars — over the VARCHAR(255) limit.
    let dotted_capital_i = "İ".repeat(MAX_TAG_LENGTH_CHARS);
    assert_eq!(dotted_capital_i.chars().count(), MAX_TAG_LENGTH_CHARS);
    assert!(parse_tag_input(Some(&dotted_capital_i), None).is_err());
  }

  #[test]
  fn accepts_tag_at_exactly_the_length_limit() {
    let max_length_tag = "a".repeat(MAX_TAG_LENGTH_CHARS);
    let tags = parse_tag_input(Some(&max_length_tag), None).unwrap();
    assert_eq!(tags.len(), 1);
  }
}
