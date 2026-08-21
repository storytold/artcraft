use std::collections::{HashMap, HashSet};
use std::iter::FromIterator;

use actix_web::HttpRequest;
use bucket_paths::legacy::typified_paths::public::media_files::bucket_file_path::MediaFileBucketPath;
use log::{error, warn};
use mysql_queries::queries::media_files::get::batch_get_media_files_by_tokens::batch_get_media_files_by_tokens_with_connection;
use server_environment::ServerEnvironment;
use sqlx::pool::PoolConnection;
use sqlx::MySql;
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::common_responses::media::media_links_builder::MediaLinksBuilder;
use crate::http_server::endpoints::media_files::helpers::get_media_domain::get_media_domain;

pub struct MediaFilesAsCdnUrlListAndMap {
  /// This is an in-order list of all the media files as their asset URLs.
  /// This is in the order they were requested.
  pub ordered_url_list: Vec<String>,

  /// This is an unordered map of media file token to asset URL.
  pub token_to_url_map: HashMap<MediaFileToken, String>,
}

pub async fn lookup_media_files_as_cdn_url_list_and_map(
  http_request: &HttpRequest,
  mysql_connection: &mut PoolConnection<MySql>,
  server_environment: ServerEnvironment,
  maybe_media_cdn_override_url: Option<&str>,
  tokens: &[MediaFileToken],
) -> Result<MediaFilesAsCdnUrlListAndMap, CommonWebError> {
  const CAN_SEE_DELETED: bool = false;

  if tokens.is_empty() {
    return Ok(MediaFilesAsCdnUrlListAndMap {
      ordered_url_list: Vec::new(),
      token_to_url_map: HashMap::new(),
    });
  }

  // The same media file can be referenced more than once in a request (e.g.
  // the same video as @video1 and @video2), so fetch each unique token once
  // and expand back over the requested order below.
  let mut unique_tokens: Vec<MediaFileToken> = Vec::new();
  for token in tokens {
    if !unique_tokens.contains(token) {
      unique_tokens.push(token.clone());
    }
  }

  let result = batch_get_media_files_by_tokens_with_connection(
    mysql_connection,
    &unique_tokens,
    CAN_SEE_DELETED,
  ).await;

  let media_files = match result {
    Ok(files) => files,
    Err(err) => {
      error!("Error getting media files by tokens: {:?}", err);
      return Err(CommonWebError::from_anyhow_error(err));
    }
  };

  if media_files.len() != unique_tokens.len() {
    warn!("Wrong number of media files returned for tokens: {} found for {} unique tokens", media_files.len(), unique_tokens.len());

    let requested: HashSet<&MediaFileToken> = HashSet::from_iter(unique_tokens.iter());
    let returned: HashSet<&MediaFileToken> = HashSet::from_iter(media_files.iter().map(|m| &m.token));

    let diff = requested.difference(&returned)
        .cloned()
        .collect::<Vec<&MediaFileToken>>();

    return Err(CommonWebError::BadInputWithSimpleMessage(
      format!("Not all media files could be found. Media files found: {}, unique tokens provided: {}, in original: {:?}, req {:?}, ret {:?}",
        media_files.len(), unique_tokens.len(), diff, requested, returned)));
  }

  let media_domain = get_media_domain(http_request);

  let mut token_to_url_map = HashMap::with_capacity(media_files.len());

  for file in media_files {
    let public_bucket_path = MediaFileBucketPath::from_object_hash(
      &file.public_bucket_directory_hash,
      file.maybe_public_bucket_prefix.as_deref(),
      file.maybe_public_bucket_extension.as_deref());

    let media_links = MediaLinksBuilder::from_media_path_and_env(
      media_domain,
      server_environment,
      &public_bucket_path);

    token_to_url_map.insert(
      file.token,
      apply_media_cdn_override(&media_links.cdn_url, maybe_media_cdn_override_url),
    );
  }

  // In requested order, with duplicates preserved.
  let ordered_url_list = tokens
      .iter()
      .filter_map(|token| token_to_url_map.get(token).cloned())
      .collect();

  Ok(MediaFilesAsCdnUrlListAndMap {
    ordered_url_list,
    token_to_url_map,
  })
}

/// Rewrite a CDN URL onto the override base (keeping the path) when an
/// override is configured; otherwise pass the URL through unchanged.
pub fn apply_media_cdn_override(cdn_url: &url::Url, maybe_override_base: Option<&str>) -> String {
  match maybe_override_base {
    Some(base) => format!("{}{}", base.trim_end_matches('/'), cdn_url.path()),
    None => cdn_url.to_string(),
  }
}

#[cfg(test)]
mod tests {
  use super::apply_media_cdn_override;

  #[test]
  fn no_override_passes_the_url_through() {
    let url = url::Url::parse("https://cdn.example/media/a/b.mp4").unwrap();
    assert_eq!(apply_media_cdn_override(&url, None), "https://cdn.example/media/a/b.mp4");
  }

  #[test]
  fn override_replaces_scheme_and_host_and_keeps_the_path() {
    let url = url::Url::parse("https://cdn.example/media/a/b.mp4").unwrap();
    assert_eq!(
      apply_media_cdn_override(&url, Some("http://127.0.0.1:5555")),
      "http://127.0.0.1:5555/media/a/b.mp4",
    );
    assert_eq!(
      apply_media_cdn_override(&url, Some("http://127.0.0.1:5555/")),
      "http://127.0.0.1:5555/media/a/b.mp4",
    );
  }
}
