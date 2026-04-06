use std::collections::HashMap;

use actix_web::HttpRequest;
use log::info;
use sqlx::pool::PoolConnection;
use sqlx::MySql;

use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_image_cost_and_generate_request::OmniGenImageCostAndGenerateRequest;
use artcraft_router::api::image_list_ref::ImageListRef;
use artcraft_router::generate::generate_image::generate_image_request::GenerateImageRequest;
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::util::lookup::lookup_image_urls_as_map::lookup_image_urls_as_map;
use server_environment::ServerEnvironment;

/// Resolved media URLs that can be referenced by a GenerateImageRequest.
/// The owned Vecs here outlive the request so the GenerateImageRequest can borrow them.
pub struct ResolvedImageMedia {
  pub url_map: HashMap<MediaFileToken, String>,
  pub image_input_urls: Vec<String>,
}

/// Collect all media file tokens from the raw HTTP request, query them from the database,
/// and return resolved CDN URLs.
pub async fn resolve_media_tokens(
  omni_request: &OmniGenImageCostAndGenerateRequest,
  http_request: &HttpRequest,
  mysql_connection: &mut PoolConnection<MySql>,
  server_environment: ServerEnvironment,
) -> Result<ResolvedImageMedia, AdvancedCommonWebError> {
  let mut all_tokens: Vec<MediaFileToken> = Vec::new();

  if let Some(tokens) = &omni_request.image_media_tokens {
    all_tokens.extend(tokens.iter().cloned());
  }

  if all_tokens.is_empty() {
    return Ok(ResolvedImageMedia {
      url_map: HashMap::new(),
      image_input_urls: Vec::new(),
    });
  }

  info!("Resolving {} media file tokens to CDN URLs", all_tokens.len());

  let url_map = lookup_image_urls_as_map(
    http_request,
    mysql_connection,
    server_environment,
    &all_tokens,
  ).await?;

  let image_input_urls = omni_request.image_media_tokens.as_ref()
    .map(|tokens| tokens.iter().filter_map(|t| url_map.get(t).cloned()).collect())
    .unwrap_or_default();

  Ok(ResolvedImageMedia {
    url_map,
    image_input_urls,
  })
}

/// Apply resolved media URLs to a GenerateImageRequest, replacing MediaFileToken refs with URL refs.
pub fn apply_resolved_media<'a>(
  request: &mut GenerateImageRequest<'a>,
  resolved: &'a ResolvedImageMedia,
) {
  if !resolved.image_input_urls.is_empty() {
    request.image_inputs = Some(ImageListRef::Urls(&resolved.image_input_urls));
  } else {
    request.image_inputs = None;
  }
}
