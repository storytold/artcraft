use url::Url;

use errors::AnyhowResult;
use server_environment::ServerEnvironment;

use crate::http_server::common_responses::media::cdn_link;
use crate::http_server::common_responses::media::media_domain::MediaDomain;

pub fn bucket_url_from_str_path(
  bucket_path: &str,
  domain: MediaDomain,
  server_environment: ServerEnvironment,
) -> AnyhowResult<Url> {
  let host = cdn_link::get_cdn_host(domain, server_environment);
  let url = format!("{host}{bucket_path}");
  let url = Url::parse(&url)?;
  Ok(url)
}

#[cfg(test)]
mod tests {
  use url::Url;
  use server_environment::ServerEnvironment;

  use crate::http_server::common_responses::media::media_domain::MediaDomain;
  use crate::http_server::web_utils::bucket_urls::bucket_url_from_str_path::bucket_url_from_str_path;

  #[test]
  fn test_production() {
    assert_eq!(bucket_url_from_str_path("/foo/bar", MediaDomain::FakeYou, ServerEnvironment::Production).unwrap(),
               Url::parse("https://cdn-2.fakeyou.com/foo/bar").unwrap());
  }

  #[test]
  fn test_development() {
    assert_eq!(bucket_url_from_str_path("/foo/bar", MediaDomain::FakeYou, ServerEnvironment::Development).unwrap(),
               Url::parse("https://pub-c8a4a5bdbdb048f286b77bdf9f786ff2.r2.dev/foo/bar").unwrap());
  }
}