use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use server_environment::ServerEnvironment;

use crate::http_server::common_responses::media::cdn_link;
use crate::http_server::common_responses::media::media_domain::MediaDomain;

/// An infallible version of `bucket_url_from_media_path` that returns a string.
pub fn bucket_url_string_from_media_path(
  bucket_path: &MediaFileBucketPath,
  domain: MediaDomain,
  server_environment: ServerEnvironment,
) -> String {
  let path = bucket_path.get_full_object_path_str();
  let host = cdn_link::get_cdn_host(domain, server_environment);
  format!("{host}{path}")
}

#[cfg(test)]
mod tests {
  use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
  use server_environment::ServerEnvironment;

  use crate::http_server::common_responses::media::media_domain::MediaDomain;
  use crate::http_server::web_utils::bucket_urls::bucket_url_string_from_media_path::bucket_url_string_from_media_path;

  #[test]
  fn test_production() {
    let bucket_path = MediaFileBucketPath::from_object_hash("test", Some("pre_"), Some(".ext"));

    assert_eq!(&bucket_url_string_from_media_path(&bucket_path, MediaDomain::FakeYou, ServerEnvironment::Production),
               "https://cdn-2.fakeyou.com/media/t/e/s/test/pre_test.ext");
  }

  #[test]
  fn test_development() {
    let bucket_path = MediaFileBucketPath::from_object_hash("test", Some("pre_"), Some(".ext"));

    assert_eq!(&bucket_url_string_from_media_path(&bucket_path, MediaDomain::FakeYou, ServerEnvironment::Development),
               "https://pub-c8a4a5bdbdb048f286b77bdf9f786ff2.r2.dev/media/t/e/s/test/pre_test.ext");
  }
}
