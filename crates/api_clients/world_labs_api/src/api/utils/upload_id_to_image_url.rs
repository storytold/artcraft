use crate::api::api_types::upload_object_id::UploadObjectId;
use crate::api::api_types::upload_mime_type::UploadMimeType;

pub fn upload_id_to_image_url(upload_id: &UploadObjectId, upload_mime_type: UploadMimeType) -> String {
  let extension_without_period = match upload_mime_type {
    UploadMimeType::ImageJpeg => "jpg",
  };
  let upload_id_str = upload_id.as_str();
  format!("https://cdn.marble.worldlabs.ai/object/{upload_id_str}/asset.{extension_without_period}")
}

#[cfg(test)]
mod tests {
  use super::upload_id_to_image_url;
  use crate::api::api_types::upload_object_id::UploadObjectId;
  use crate::api::api_types::upload_mime_type::UploadMimeType;

  // llm tests... sigh
  #[test]
  fn builds_jpeg_url_with_jpg_extension() {
    let id = UploadObjectId("abc123".to_string());
    let url = upload_id_to_image_url(&id, UploadMimeType::ImageJpeg);
    assert_eq!(
      url,
      "https://cdn.marble.worldlabs.ai/object/abc123/asset.jpg"
    );
  }

  // llm tests... sigh
  #[test]
  fn preserves_exact_upload_id_in_url() {
    let raw_id = "550e8400-e29b-41d4-a716-446655440000";
    let id = UploadObjectId(raw_id.to_string());
    let url = upload_id_to_image_url(&id, UploadMimeType::ImageJpeg);
    assert!(url.contains(raw_id));
    assert!(url.ends_with("/asset.jpg"));
  }
}
