use actix_web::HttpRequest;
use sqlx::pool::PoolConnection;
use sqlx::MySql;

use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_image_cost_and_generate_request::OmniGenImageCostAndGenerateRequest;
use server_environment::ServerEnvironment;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use crate::util::lookup::lookup_media_files_as_cdn_url_list_and_map::{
  lookup_media_files_as_cdn_url_list_and_map,
  MediaFilesAsCdnUrlListAndMap,
};

pub type ResolvedImageMedia = MediaFilesAsCdnUrlListAndMap;

/// Collect all media file tokens from the raw HTTP request, query them from the database,
/// and return resolved CDN URLs.
pub async fn resolve_media_tokens(
  omni_request: &OmniGenImageCostAndGenerateRequest,
  http_request: &HttpRequest,
  mysql_connection: &mut PoolConnection<MySql>,
  server_environment: ServerEnvironment,
) -> Result<ResolvedImageMedia, AdvancedCommonWebError> {
  let tokens = omni_request.image_media_tokens.as_deref()
    .unwrap_or(&[]);

  lookup_media_files_as_cdn_url_list_and_map(
    http_request,
    mysql_connection,
    server_environment,
    tokens,
  ).await
    .map_err(AdvancedCommonWebError::from)
}
