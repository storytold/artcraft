use std::collections::HashMap;

use artcraft_router::api::audio_list_ref::AudioListRef;
use artcraft_router::api::image_list_ref::ImageListRef;
use artcraft_router::generate::generate_audio::generate_audio_request_builder::GenerateAudioRequestBuilder;
use tokens::tokens::media_files::MediaFileToken;

/// For providers that take URLs directly (Fal), swap
/// `MediaFileTokens` → `Urls` using the resolved map.
pub fn resolve_media_tokens_to_urls(
  builder: &mut GenerateAudioRequestBuilder,
  url_map: Option<&HashMap<MediaFileToken, String>>,
) {
  let map = match url_map {
    Some(m) => m,
    None => return,
  };

  // audio_references
  if let Some(AudioListRef::MediaFileTokens(ref tokens)) = builder.audio_references {
    let urls: Vec<String> = tokens.iter()
      .filter_map(|t| map.get(t).cloned())
      .collect();
    if !urls.is_empty() {
      builder.audio_references = Some(AudioListRef::Urls(urls));
    }
  }

  // image_references
  if let Some(ImageListRef::MediaFileTokens(ref tokens)) = builder.image_references {
    let urls: Vec<String> = tokens.iter()
      .filter_map(|t| map.get(t).cloned())
      .collect();
    if !urls.is_empty() {
      builder.image_references = Some(ImageListRef::Urls(urls));
    }
  }
}
