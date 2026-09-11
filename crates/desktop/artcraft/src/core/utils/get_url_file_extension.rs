use reqwest::Url;
use std::path::Path;

pub fn get_url_file_extension(url: &Url) -> Option<&str> {
  Path::new(url.path())
    .extension()
    .filter(|ext| !ext.is_empty())
    .and_then(|ext| ext.to_str())
}

#[cfg(test)]
mod tests {
  use reqwest::Url;

  #[test]
  fn extension_exists() {
    let url = Url::parse("https://example.com/image.png").unwrap();
    let extension = super::get_url_file_extension(&url);
    assert_eq!(extension, Some("png"));
  }

  #[test]
  fn extension_does_not_exist() {
    let url = Url::parse("https://example.com/foo").unwrap();
    let extension = super::get_url_file_extension(&url);
    assert_eq!(extension, None);
  }

  #[test]
  fn period_not_in_path() {
    let url = Url::parse("https://example.com/invalid.period/foo").unwrap();
    let extension = super::get_url_file_extension(&url);
    assert_eq!(extension, None);
  }
}