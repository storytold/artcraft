use std::collections::HashMap;

use seedance2pro_client::creds::seedance2pro_session::Seedance2ProSession;
use tokens::tokens::media_files::MediaFileToken;

use crate::api::image_list_ref::ImageListRef;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_image::providers::kinovi::upload::upload_to_seedance2pro;

/// Resolve an [`ImageListRef`] to a list of public Seedance2Pro CDN URLs,
/// uploading each image one at a time. Preserves order.
///
/// Returns `Ok(None)` when the input is `None` or an empty list — the
/// caller can then omit the field from the wire request entirely. (The
/// downstream Midjourney API rejects empty arrays.)
pub(crate) async fn resolve_and_upload_image_list(
  session: &Seedance2ProSession,
  list: Option<ImageListRef>,
  maybe_map: Option<&HashMap<MediaFileToken, String>>,
) -> Result<Option<Vec<String>>, ArtcraftRouterError> {
  let source_urls = match list {
    None => return Ok(None),
    Some(ImageListRef::Urls(urls)) if urls.is_empty() => return Ok(None),
    Some(ImageListRef::Urls(urls)) => urls,
    Some(ImageListRef::MediaFileTokens(tokens)) if tokens.is_empty() => return Ok(None),
    Some(ImageListRef::MediaFileTokens(tokens)) => resolve_tokens(maybe_map, &tokens)?,
  };

  let mut uploaded = Vec::with_capacity(source_urls.len());
  for url in &source_urls {
    uploaded.push(upload_to_seedance2pro(session, url).await?);
  }
  Ok(Some(uploaded))
}

fn resolve_tokens(
  maybe_map: Option<&HashMap<MediaFileToken, String>>,
  tokens: &[MediaFileToken],
) -> Result<Vec<String>, ArtcraftRouterError> {
  let map = maybe_map.ok_or(ArtcraftRouterError::Client(ClientError::MediaFileToUrlMapNotProvided))?;
  tokens.iter()
    .map(|token| {
      map.get(token).cloned().ok_or_else(|| {
        ArtcraftRouterError::Client(ClientError::MediaFileTokenNotFoundInMap {
          token: token.clone(),
        })
      })
    })
    .collect()
}
