use artcraft_client::endpoints::media_files::get_media_file::get_media_file;
use artcraft_client::utils::api_host::ApiHost;
use log::info;
use tokens::tokens::media_files::MediaFileToken;

use crate::core::commands::enqueue::generate_error::GenerateError;

/// Resolve a list of media file tokens to their CDN URLs.
///
/// FAL (and other third-party providers) can fetch images by URL directly,
/// so we just need the CDN link — no need to download the bytes locally.
pub async fn map_media_file_tokens_to_cdn_urls(
  tokens: &[MediaFileToken],
  api_host: &ApiHost,
) -> Result<Vec<String>, GenerateError> {
  let mut urls = Vec::with_capacity(tokens.len());

  for token in tokens {
    info!("Resolving media file token {} to CDN URL...", token.as_str());
    let response = get_media_file(api_host, token).await?;
    let cdn_url = response.media_file.media_links.cdn_url.to_string();
    info!("Resolved {} -> {}", token.as_str(), &cdn_url);
    urls.push(cdn_url);
  }

  Ok(urls)
}
