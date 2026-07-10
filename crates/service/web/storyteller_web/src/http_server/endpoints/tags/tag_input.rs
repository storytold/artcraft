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
    if trimmed.chars().count() > MAX_TAG_LENGTH_CHARS {
      return Err(CommonWebError::BadInputWithSimpleMessage(
        format!("tag is too long (max {} characters)", MAX_TAG_LENGTH_CHARS),
      ));
    }

    let lowercase = trimmed.to_lowercase();
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
