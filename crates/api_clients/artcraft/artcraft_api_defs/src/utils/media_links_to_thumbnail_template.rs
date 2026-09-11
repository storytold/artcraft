use crate::common::responses::media_links::MediaLinks;

/// Get the thumbnail template for either images or videos.
pub fn media_links_to_thumbnail_template(links: &MediaLinks) -> Option<&str> {
  // NB: We only populate video previews for video tasks.
  if let Some(video) = links.maybe_video_previews.as_ref() {
    return Some(&video.animated_thumbnail_template);
  }

  // Image case - use the image thumbnail template if it exists.
  links.maybe_thumbnail_template.as_deref()
}
