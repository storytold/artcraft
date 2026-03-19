use crate::common::responses::cover_image_links::CoverImageLinks;
use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

// TODO(bt,2025-08-20): Replace the storyteller-web version of this.
//  We can't drop the old version just yet due to the `impl` (easy)
//  and a few differing fields.

/// Everything we need to create a cover image.
/// Cover images are small descriptive images that can be set for any media file.
/// If a cover image is set, this is the path to the asset.
#[derive(Serialize, Deserialize, ToSchema, Debug)]
pub struct MediaFileCoverImageDetails {
  // /// (DEPRECATED) URL path to the media file
  // #[deprecated(note="This field doesn't point to the full URL. Use media_links instead to leverage the CDN.")]
  // pub maybe_cover_image_public_bucket_path: Option<String>,

  // /// (DEPRECATED) Full URL to the media file
  // #[deprecated(note="This points to the bucket. Use media_links instead to leverage the CDN.")]
  // pub maybe_cover_image_public_bucket_url: Option<Url>,

  // NB(bt,2024-09-19): I accidentally rolled this field out to production.
  // I don't think this field is in use, but maybe ...
  // /// (DEPRECATED) Use maybe_links instead.
  // #[deprecated(note="Use `maybe_links` instead.")]
  // pub maybe_media_links: Option<MediaLinks>,

  /// Links to the cover image (CDN direct link, thumbnail template)
  /// If a cover image is set, this is the path to the asset.
  /// If a cover image is not set, use the information in `default_cover` instead.
  /// Rich CDN links to the media, including thumbnails, previews, and more.
  pub maybe_links: Option<CoverImageLinks>,

  /// For items without a cover image, we can use one of our own.
  pub default_cover: MediaFileDefaultCover,
}

/// The default cover is composed of an image and color pair that are
/// predefined by the frontend.
#[derive(Serialize, Deserialize, ToSchema, Debug)]
pub struct MediaFileDefaultCover {
  pub image_index: u8,
  pub color_index: u8,
}
