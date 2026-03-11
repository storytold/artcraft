use url::Url;

use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use server_environment::ServerEnvironment;

use crate::http_server::common_responses::media::media_domain::MediaDomain;
use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;

#[deprecated(note="this is better than bucket_url_from_media_path, but still refrain from using it")]
pub fn bucket_url_from_media_path_updated(
  media_domain: MediaDomain,
  server_environment: ServerEnvironment,
  bucket_path: &MediaFileBucketPath,
) -> Url {
  let media_links = MediaLinksBuilder::from_media_path_and_env(media_domain, server_environment, bucket_path);
  media_links.cdn_url
}
