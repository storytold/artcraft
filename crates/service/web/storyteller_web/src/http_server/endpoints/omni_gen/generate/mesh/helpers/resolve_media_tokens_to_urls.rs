use std::collections::HashMap;

use artcraft_router::api::image_list_ref::ImageListRef;
use artcraft_router::api::image_ref::ImageRef;
use artcraft_router::generate::generate_mesh::generate_mesh_request_builder::GenerateMeshRequestBuilder;
use tokens::tokens::media_files::MediaFileToken;

/// For providers that take URLs directly (Fal), swap
/// `MediaFileToken(s)` → `Url(s)` using the resolved map.
pub fn resolve_media_tokens_to_urls(
  builder: &mut GenerateMeshRequestBuilder,
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

  // multi-view side images
  resolve_image_ref(&mut builder.front_image, map);
  resolve_image_ref(&mut builder.back_image, map);
  resolve_image_ref(&mut builder.left_image, map);
  resolve_image_ref(&mut builder.right_image, map);
}

fn resolve_image_ref(
  image_ref: &mut Option<ImageRef>,
  map: &HashMap<MediaFileToken, String>,
) {
  if let Some(ImageRef::MediaFileToken(ref token)) = image_ref {
    if let Some(url) = map.get(token) {
      *image_ref = Some(ImageRef::Url(url.clone()));
    }
  }
}
