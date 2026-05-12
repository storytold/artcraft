pub mod extract_images;
pub mod extract_model_glb;
pub mod extract_thumbnail;
pub mod extract_video;

use serde_json::Value;

use crate::polling::poll_job_response::success_case_extractors::extract_images::PollResponseImageEntry;
use crate::polling::poll_job_response::success_case_extractors::extract_model_glb::PollResponseModelGlbData;
use crate::polling::poll_job_response::success_case_extractors::extract_thumbnail::PollResponseThumbnailData;
use crate::polling::poll_job_response::success_case_extractors::extract_video::PollResponseVideoData;

/// Extracted content fields from a successful job response.
/// Multiple fields can be populated simultaneously (e.g. model_glb + thumbnail).
#[derive(Debug, Clone)]
pub struct PollResponseExtractedContents {
  pub images: Option<Vec<PollResponseImageEntry>>,
  pub video: Option<PollResponseVideoData>,
  pub model_glb: Option<PollResponseModelGlbData>,
  pub thumbnail: Option<PollResponseThumbnailData>,
}

/// Try to extract known content keys from a success response payload.
pub fn extract_contents_from_response(value: &Value) -> Option<PollResponseExtractedContents> {
  let images = extract_images::extract_images(value);
  let video = extract_video::extract_video(value);
  let model_glb = extract_model_glb::extract_model_glb(value);
  let thumbnail = extract_thumbnail::extract_thumbnail(value);

  if images.is_none() && video.is_none() && model_glb.is_none() && thumbnail.is_none() {
    return None;
  }

  Some(PollResponseExtractedContents {
    images,
    video,
    model_glb,
    thumbnail,
  })
}
