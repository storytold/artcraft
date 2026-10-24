//! Pull the well-known output fields out of a finished fal job's JSON.
//!
//! Every fal model returns differently shaped JSON, but most outputs contain one or more of a
//! handful of keys: `image`, `images`, `video`, `model_glb`, `thumbnail`. Each submodule below
//! reads one of those keys; `extract_contents_from_response` runs them all and bundles the
//! results. `poll_job_response` calls it. A key that is missing or the wrong shape simply
//! yields `None` (never an error), because the full raw JSON is kept alongside.

// One submodule per output key.
pub mod extract_image;
pub mod extract_images;
pub mod extract_model_glb;
pub mod extract_thumbnail;
pub mod extract_video;

use serde_json::Value;

use crate::polling::poll_job_response::success_case_extractors::extract_image::PollResponseSingleImageData;
use crate::polling::poll_job_response::success_case_extractors::extract_images::PollResponseImageEntry;
use crate::polling::poll_job_response::success_case_extractors::extract_model_glb::PollResponseModelGlbData;
use crate::polling::poll_job_response::success_case_extractors::extract_thumbnail::PollResponseThumbnailData;
use crate::polling::poll_job_response::success_case_extractors::extract_video::PollResponseVideoData;

/// Extracted content fields from a successful job response.
/// Multiple fields can be populated simultaneously (e.g. model_glb + thumbnail).
#[derive(Debug, Clone)]
pub struct PollResponseExtractedContents {
  /// Parsed from `payload.image` (single image result, e.g. background removal).
  pub image: Option<PollResponseSingleImageData>,
  /// Parsed from `payload.images` (batch image results).
  pub images: Option<Vec<PollResponseImageEntry>>,
  /// Parsed from `payload.video` (generated video file).
  pub video: Option<PollResponseVideoData>,
  /// Parsed from `payload.model_glb` (3D model in GLB format).
  pub model_glb: Option<PollResponseModelGlbData>,
  /// Parsed from `payload.thumbnail` (preview picture, e.g. for a 3D model).
  pub thumbnail: Option<PollResponseThumbnailData>,
}

/// Try to extract known content keys from a success response payload.
///
/// Returns `None` when none of the five keys is present (the caller should then fall back to
/// the raw JSON), otherwise a struct with whichever keys were found.
pub fn extract_contents_from_response(value: &Value) -> Option<PollResponseExtractedContents> {
  let image = extract_image::extract_image(value);
  let images = extract_images::extract_images(value);
  let video = extract_video::extract_video(value);
  let model_glb = extract_model_glb::extract_model_glb(value);
  let thumbnail = extract_thumbnail::extract_thumbnail(value);

  if image.is_none() && images.is_none() && video.is_none()
    && model_glb.is_none() && thumbnail.is_none()
  {
    return None;
  }

  Some(PollResponseExtractedContents {
    image,
    images,
    video,
    model_glb,
    thumbnail,
  })
}
