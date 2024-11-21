use url::Url;

use errors::AnyhowResult;

pub fn bucket_url_from_str_path(
  bucket_path: &str,
) -> AnyhowResult<Url> {
  let url = format!("https://cdn-2.fakeyou.com{}", bucket_path);
  let url = Url::parse(&url)?;
  Ok(url)
}

#[cfg(test)]
mod tests {
  use url::Url;

  use crate::http_server::web_utils::bucket_urls::bucket_url_from_str_path::bucket_url_from_str_path;

  #[test]
  fn test() {
    assert_eq!(bucket_url_from_str_path("/foo/bar").unwrap(),
               Url::parse("https://storage.googleapis.com/vocodes-public/foo/bar").unwrap());
  }
}