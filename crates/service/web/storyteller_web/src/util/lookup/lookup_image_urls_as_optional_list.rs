use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;
use actix_web::HttpRequest;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use log::{error, warn};
use mysql_queries::queries::media_files::get::batch_get_media_files_by_tokens::batch_get_media_files_by_tokens_with_connection;
use server_environment::ServerEnvironment;
use sqlx::pool::PoolConnection;
use sqlx::MySql;
use std::collections::HashSet;
use std::iter::FromIterator;
use tokens::tokens::media_files::MediaFileToken;

#[deprecated(note="I don't think we should be returning Option<T> based on an empty() check at the end. This is weird.")]
pub async fn lookup_image_urls_as_optional_list(
  http_request: &HttpRequest,
  mysql_connection: &mut PoolConnection<MySql>,
  server_environment: ServerEnvironment,
  tokens: &[MediaFileToken],
) -> Result<Option<Vec<String>>, CommonWebError> {
  const CAN_SEE_DELETED: bool = false;

  let result = batch_get_media_files_by_tokens_with_connection(
    mysql_connection,
    tokens,
    CAN_SEE_DELETED,
  ).await;

  let media_files = match result {
    Ok(files) => files,
    Err(err) => {
      error!("Error getting media files by tokens: {:?}", err);
      return Err(CommonWebError::ServerError);
    }
  };

  if media_files.len() != tokens.len() {
    warn!("Wrong number of media files returned for tokens: {} found for {} tokens", media_files.len(), tokens.len());

    let requested : HashSet<&MediaFileToken> = HashSet::from_iter(tokens.iter());
    let returned : HashSet<&MediaFileToken> = HashSet::from_iter(media_files.iter().map(|m| &m.token));

    let diff = requested.difference(&returned)
        .cloned()
        .collect::<Vec<&MediaFileToken>>();

    return Err(CommonWebError::BadInputWithSimpleMessage(
      format!("Not all media files could be found. Media files found: {}, tokens provided: {}, in original: {:?}, req {:?}, ret {:?}",
        media_files.len(), tokens.len(), diff, requested, returned)));
  }

  let media_domain = get_media_domain(&http_request);

  let image_urls = media_files.iter()
      .map(|file| {
        let public_bucket_path = MediaFileBucketPath::from_object_hash(
          &file.public_bucket_directory_hash,
          file.maybe_public_bucket_prefix.as_deref(),
          file.maybe_public_bucket_extension.as_deref());

        let media_links = MediaLinksBuilder::from_media_path_and_env(
          media_domain,
          server_environment,
          &public_bucket_path);

        media_links.cdn_url.to_string()
      })
      .collect::<Vec<_>>();

  if image_urls.is_empty() {
    return Ok(None)
  }

  Ok(Some(image_urls))
}
