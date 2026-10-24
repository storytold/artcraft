use crate::core::state::data_dir::app_data_root::AppDataRoot;
use errors::AnyhowResult;
use std::io::Write;
use tempfile::NamedTempFile;
use url::Url;

pub async fn download_url_to_temp_dir(url: &str, app_data_root: &AppDataRoot) -> AnyhowResult<NamedTempFile> {
  let url = Url::parse(&url)?;

  // WHY: without error_for_status, a 404/500 error body would be written to the temp file as if it were the media.
  let response = reqwest::get(url.clone()).await?.error_for_status()?;
  let response_bytes = response.bytes().await?;

  let ext = extension_from_url_path(url.path());

  let mut temp_file = app_data_root.temp_dir().new_named_temp_file_with_extension(ext)?;

  temp_file.write_all(&response_bytes)?;

  Ok(temp_file)
}

/// Pick a safe file extension from a URL path, defaulting to "png".
/// WHY: the old `path.split(".").last()` returned the whole path (e.g. "/media/abc") when
/// there was no dot, producing an invalid temp-file extension containing slashes.
fn extension_from_url_path(path: &str) -> &str {
  let last_segment = path.rsplit('/').next().unwrap_or("");
  match last_segment.rsplit_once('.') {
    Some((_, ext)) if !ext.is_empty() && ext.len() <= 8 && ext.chars().all(|c| c.is_ascii_alphanumeric()) => ext,
    _ => "png",
  }
}

#[cfg(test)]
mod tests {
  use super::extension_from_url_path;

  #[test]
  fn uses_real_extension() {
    assert_eq!(extension_from_url_path("/a/b/photo.jpg"), "jpg");
  }

  #[test]
  fn defaults_when_no_dot_in_last_segment() {
    assert_eq!(extension_from_url_path("/media/abc"), "png");
    assert_eq!(extension_from_url_path("/v1.2/abc"), "png");
    assert_eq!(extension_from_url_path(""), "png");
    assert_eq!(extension_from_url_path("/a/b."), "png");
  }
}
