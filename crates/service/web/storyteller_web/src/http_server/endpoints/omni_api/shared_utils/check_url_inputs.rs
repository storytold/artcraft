use crate::http_server::common_responses::common_web_error::CommonWebError;

/// Reject a request where a media-token field and its paired URL field are both
/// set. Exactly one of the two may be provided.
pub fn check_mutually_exclusive(
  media_token_field_name: &str,
  media_token_is_set: bool,
  url_field_name: &str,
  url_is_set: bool,
) -> Result<(), CommonWebError> {
  if media_token_is_set && url_is_set {
    return Err(CommonWebError::BadInputWithSimpleMessage(format!(
      "Either {} or {} must be set, not both",
      media_token_field_name, url_field_name,
    )));
  }
  Ok(())
}

/// Reject any URL that does not start with `http://` or `https://`.
pub fn check_url_format(urls: Option<&[String]>) -> Result<(), CommonWebError> {
  for url in urls.unwrap_or(&[]) {
    check_single_url_format(url)?;
  }
  Ok(())
}

/// Single-URL variant of [`check_url_format`] for non-list fields.
pub fn check_single_url_format(url: &str) -> Result<(), CommonWebError> {
  if !url.starts_with("http://") && !url.starts_with("https://") {
    return Err(CommonWebError::BadInputWithSimpleMessage(format!(
      "URL must start with http:// or https://, bad URL: {}",
      url,
    )));
  }
  Ok(())
}
