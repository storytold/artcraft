use std::collections::HashMap;

use artcraft_router::api::image_list_ref::ImageListRef;
use artcraft_router::api::video_ref::VideoRef;
use artcraft_router::generate::generate_splat::generate_splat_request_builder::GenerateSplatRequestBuilder;
use tokens::tokens::media_files::MediaFileToken;

/// For providers that take URLs directly (Fal), swap
/// `MediaFileToken(s)` → `Url(s)` using the resolved map.
///
/// NB: World Labs requests must keep their tokens — their draft/finalize
/// step maps tokens to URLs itself — so only call this on the Fal path.
pub fn resolve_media_tokens_to_urls(
  builder: &mut GenerateSplatRequestBuilder,
  url_map: Option<&HashMap<MediaFileToken, String>>,
) {
  let map = match url_map {
    Some(m) => m,
    None => return,
  };

  // reference_images
  if let Some(ImageListRef::MediaFileTokens(ref tokens)) = builder.reference_images {
    let urls: Vec<String> = tokens.iter()
      .filter_map(|t| map.get(t).cloned())
      .collect();
    if !urls.is_empty() {
      builder.reference_images = Some(ImageListRef::Urls(urls));
    }
  }

  // reference_video
  if let Some(VideoRef::MediaFileToken(ref token)) = builder.reference_video {
    if let Some(url) = map.get(token) {
      builder.reference_video = Some(VideoRef::Url(url.clone()));
    }
  }
}
