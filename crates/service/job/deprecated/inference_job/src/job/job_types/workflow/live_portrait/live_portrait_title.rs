use primitives::trim_or_empty::trim_or_empty;

pub fn live_portrait_title(
  maybe_existing_portrait_title: Option<&str>,
  maybe_existing_driver_title: Option<&str>
) -> String {
  const FIELD_LENGTH : usize = 255;
  const TITLE_PREFIX : &str = "Live Portrait of ";

  let maybe_title_basis = maybe_existing_portrait_title
      .or(maybe_existing_driver_title)
      .map(|title| trim_or_empty(title))
      .flatten();

  match maybe_title_basis {
    None => "Live Portrait Video".to_string(),
    Some(title) => {
      let mut trimmed_title = title.to_string();
      trimmed_title.truncate(FIELD_LENGTH - TITLE_PREFIX.len());

      let mut full_title = TITLE_PREFIX.to_string();
      full_title.push_str(&trimmed_title);
      full_title
    },
  }
}

#[cfg(test)]
mod tests {
  use crate::job::job_types::workflow::live_portrait::live_portrait_title::live_portrait_title;

  #[test]
  fn test_title() {
    assert_eq!(live_portrait_title(None, None), "Live Portrait Video");
    assert_eq!(live_portrait_title(Some("Portrait"), None), "Live Portrait of Portrait");
    assert_eq!(live_portrait_title(None, Some("Driver")), "Live Portrait of Driver");
    assert_eq!(live_portrait_title(Some("Portrait"), Some("Driver")), "Live Portrait of Portrait");
  }
}
