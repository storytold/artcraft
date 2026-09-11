use serde::Deserialize;
use serde::Serialize;
use url::Url;
use utoipa::ToSchema;

/// Links to media file locations (bucket, CDN, etc.)
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Eq, PartialEq)]
pub struct MediaLinks {
  /// Primary link to the asset via the CDN.
  pub cdn_url: Url,

  /// Template to construct thumbnail URLs.
  /// Replace the string `{WIDTH}` with the desired width.
  /// Only relevant for image media files. (Video media files instead have
  /// video previews, which, in turn, have their own thumbnail templates.)
  pub maybe_thumbnail_template: Option<String>,

  /// Video preview images (still and animated gif) for mp4 video files.
  /// These are only set for video media files.
  /// These are not set for "cover images" that are gif or webms, but rather video files.
  pub maybe_video_previews: Option<VideoPreviews>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Eq, PartialEq)]
pub struct VideoPreviews {
  /// A static single frame preview image of the video.
  pub still: Url,
  
  /// An animated gif preview of the video.
  pub animated: Url,
  
  /// A template used to construct the still thumbnail URL.
  /// Replace the string `{WIDTH}` with the desired width.
  pub still_thumbnail_template: String,
  
  /// A template used to construct the animated thumbnail URL.
  /// Replace the string `{WIDTH}` with the desired width.
  pub animated_thumbnail_template: String,
}
