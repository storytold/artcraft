pub mod extract_image_payload;
pub mod extract_images_payload;
pub mod extract_video_payload;
pub mod extract_model_glb_payload;
pub mod extract_model_mesh_payload;
pub mod extract_thumbnail_payload;

use serde_json::Value;

use crate::webhook_payload::hydrated::hydrated_webhook_contents::ExtractedContents;

/// Try to extract known content keys from a success payload.
///
/// Checks the payload (as a JSON object) for any of: `image`, `images`,
/// `video`, `model_glb`, `model_mesh`. If at least one is found, returns
/// `Some(ExtractedContents)` with copies of the relevant values. Multiple
/// keys can be populated simultaneously. Returns `None` if the payload is
/// not an object or none of the known keys are present.
pub fn extract_contents_from_payload(payload: &Value) -> Option<ExtractedContents> {
  let obj = payload.as_object()?;

  let image = extract_image_payload::extract_image(obj);
  let images = extract_images_payload::extract_images(obj);
  let video = extract_video_payload::extract_video(obj);
  let model_glb = extract_model_glb_payload::extract_model_glb(obj);
  let model_mesh = extract_model_mesh_payload::extract_model_mesh(obj);
  let thumbnail = extract_thumbnail_payload::extract_thumbnail(obj);

  if image.is_none() && images.is_none() && video.is_none()
    && model_glb.is_none() && model_mesh.is_none() && thumbnail.is_none()
  {
    return None;
  }

  Some(ExtractedContents {
    image,
    images,
    video,
    model_glb,
    model_mesh,
    thumbnail,
  })
}
