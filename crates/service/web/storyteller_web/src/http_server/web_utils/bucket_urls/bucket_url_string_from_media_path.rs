use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;

/// An infallible version of `bucket_url_from_media_path` that returns a string.
pub fn bucket_url_string_from_media_path(
  bucket_path: &MediaFileBucketPath,
) -> String {
  let path = bucket_path.get_full_object_path_str();
  format!("https://cdn-2.fakeyou.com{}", path)
}

#[cfg(test)]
mod tests {
  use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;

  use crate::http_server::web_utils::bucket_urls::bucket_url_string_from_media_path::bucket_url_string_from_media_path;

  #[test]
  fn test() {
    let bucket_path = MediaFileBucketPath::from_object_hash("test", Some("pre_"), Some(".ext"));

    assert_eq!(&bucket_url_string_from_media_path(&bucket_path),
               "https://storage.googleapis.com/vocodes-public/media/t/e/s/test/pre_test.ext");
  }
}
