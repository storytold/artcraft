use artcraft_api_defs::common::responses::media_links::MediaLinks;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use mysql_queries::queries::media_files::list::media_file_list_row::MediaFileListRow;
use server_environment::ServerEnvironment;

use crate::http_server::common_responses::media::media_domain::MediaDomain;
use crate::http_server::common_responses::media::media_file_cover_image_details::MediaFileCoverImageDetails;
use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;

/// Build the `MediaLinks` + `MediaFileCoverImageDetails` pair for one
/// media-file list row. Shared by every list endpoint that returns
/// media files (folders, tags, ...) so the CDN-link construction stays
/// in one place.
pub fn build_media_links_and_cover(
  row: &MediaFileListRow,
  media_domain: MediaDomain,
  server_environment: ServerEnvironment,
) -> (MediaLinks, MediaFileCoverImageDetails) {
  let bucket_path = MediaFileBucketPath::from_object_hash(
    &row.public_bucket_directory_hash,
    row.maybe_public_bucket_prefix.as_deref(),
    row.maybe_public_bucket_extension.as_deref(),
  );

  let media_links = MediaLinksBuilder::from_media_path_and_env(
    media_domain,
    server_environment,
    &bucket_path,
  );

  let cover_image = MediaFileCoverImageDetails::from_optional_db_fields(
    &row.media_file_token,
    media_domain,
    server_environment,
    row.maybe_cover_public_bucket_directory_hash.as_deref(),
    row.maybe_cover_public_bucket_prefix.as_deref(),
    row.maybe_cover_public_bucket_extension.as_deref(),
  );

  (media_links, cover_image)
}
