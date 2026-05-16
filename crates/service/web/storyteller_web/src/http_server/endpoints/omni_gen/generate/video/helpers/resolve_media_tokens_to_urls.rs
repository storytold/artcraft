use std::collections::HashMap;

use artcraft_router::api::audio_list_ref::AudioListRef;
use artcraft_router::api::image_list_ref::ImageListRef;
use artcraft_router::api::image_ref::ImageRef;
use artcraft_router::api::video_list_ref::VideoListRef;
use artcraft_router::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use tokens::tokens::media_files::MediaFileToken;

/// For providers that take URLs directly (GmiCloud, Fal), swap
/// `ImageRef::MediaFileToken` → `ImageRef::Url` using the resolved map.
pub fn resolve_media_tokens_to_urls(
  builder: &mut GenerateVideoRequestBuilder,
  url_map: Option<&HashMap<MediaFileToken, String>>,
) {
  let map = match url_map {
    Some(m) => m,
    None => return,
  };

  // start_frame
  if let Some(ImageRef::MediaFileToken(ref token)) = builder.start_frame {
    if let Some(url) = map.get(token) {
      builder.start_frame = Some(ImageRef::Url(url.clone()));
    }
  }

  // end_frame
  if let Some(ImageRef::MediaFileToken(ref token)) = builder.end_frame {
    if let Some(url) = map.get(token) {
      builder.end_frame = Some(ImageRef::Url(url.clone()));
    }
  }

  // reference_images
  if let Some(ImageListRef::MediaFileTokens(ref tokens)) = builder.reference_images {
    let urls: Vec<String> = tokens.iter()
      .filter_map(|t| map.get(t).cloned())
      .collect();
    if !urls.is_empty() {
      builder.reference_images = Some(ImageListRef::Urls(urls));
    }
  }

  // reference_videos
  if let Some(VideoListRef::MediaFileTokens(ref tokens)) = builder.reference_videos {
    let urls: Vec<String> = tokens.iter()
      .filter_map(|t| map.get(t).cloned())
      .collect();
    if !urls.is_empty() {
      builder.reference_videos = Some(VideoListRef::Urls(urls));
    }
  }

  // reference_audio
  if let Some(AudioListRef::MediaFileTokens(ref tokens)) = builder.reference_audio {
    let urls: Vec<String> = tokens.iter()
      .filter_map(|t| map.get(t).cloned())
      .collect();
    if !urls.is_empty() {
      builder.reference_audio = Some(AudioListRef::Urls(urls));
    }
  }
}
