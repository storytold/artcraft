use serde_json::{Map, Value};

use crate::webhook_payload::hydrated::hydrated_webhook_contents::ModelUrlsData;

/// Extract and deserialize the `model_urls` key from a webhook success
/// payload (e.g. Hunyuan 3D 3.0's per-format file map).
pub(crate) fn extract_model_urls(obj: &Map<String, Value>) -> Option<ModelUrlsData> {
  let value = obj.get("model_urls")?;
  serde_json::from_value(value.clone()).ok()
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::webhook_payload::hydrate_webhook_contents::hydrate_webhook_contents;
  use crate::webhook_payload::hydrated::hydrated_webhook_contents::HydratedWebhookContents;
  use crate::webhook_payload::raw::raw_webhook_payload::RawWebhookPayload;

  fn load_test_webhook(filename: &str) -> RawWebhookPayload {
    let path = format!("test_data/webhooks/{}", filename);
    let json = std::fs::read_to_string(&path)
      .unwrap_or_else(|e| panic!("Failed to read {}: {}", path, e));
    serde_json::from_str(&json)
      .unwrap_or_else(|e| panic!("Failed to parse {}: {}", path, e))
  }

  #[test]
  fn model_urls_from_hunyuan_3d_3p0_test_file() {
    let webhook = load_test_webhook("success/hunyuan_3d_3p0_model_urls_payload_1.json");
    let result = hydrate_webhook_contents(&webhook);

    let HydratedWebhookContents::Success(data) = result else {
      panic!("Expected Success, got {:?}", result);
    };

    let contents = data.extracted_contents
      .expect("extracted_contents should be Some");

    let glb = contents.model_glb.expect("model_glb should be Some");
    assert_eq!(glb.url.as_deref(), Some("https://v3b.fal.media/files/b/0aa1b969/k5FZWmTsKxHH71404bBR__model.glb"));
    assert_eq!(glb.content_type.as_deref(), Some("model/gltf-binary"));
    assert_eq!(glb.file_name.as_deref(), Some("model.glb"));
    assert_eq!(glb.file_size, Some(51001160));

    let model_urls = contents.model_urls.expect("model_urls should be Some");

    // The `glb` slot duplicates `model_glb` in this payload (same URL).
    let urls_glb = model_urls.glb.expect("model_urls.glb should be Some");
    assert_eq!(urls_glb.url.as_deref(), Some("https://v3b.fal.media/files/b/0aa1b969/k5FZWmTsKxHH71404bBR__model.glb"));

    let urls_obj = model_urls.obj.expect("model_urls.obj should be Some");
    assert_eq!(urls_obj.url.as_deref(), Some("https://v3b.fal.media/files/b/0aa1b968/xngvKxLugXUlNh89Fp0K4_model.obj"));
    assert_eq!(urls_obj.content_type.as_deref(), Some("text/plain"));
    assert_eq!(urls_obj.file_name.as_deref(), Some("model.obj"));
    assert_eq!(urls_obj.file_size, Some(41107268));

    assert!(model_urls.fbx.is_none());
    assert!(model_urls.mtl.is_none());
    assert!(model_urls.texture.is_none());
    assert!(model_urls.usdz.is_none());

    let thumbnail = contents.thumbnail.expect("thumbnail should be Some");
    assert_eq!(thumbnail.url.as_deref(), Some("https://v3b.fal.media/files/b/0aa1b969/EPgha8Kee7YZCAccjFUU7_preview.png"));
    assert_eq!(thumbnail.content_type.as_deref(), Some("image/png"));
    assert_eq!(thumbnail.file_name.as_deref(), Some("preview.png"));
    assert_eq!(thumbnail.file_size, Some(136476));

    assert!(contents.model_glb_pbr.is_none());
    assert!(contents.model_mesh.is_none());
    assert!(contents.preprocessed_image.is_none());
  }

  #[test]
  fn model_urls_and_thumbnail_from_hunyuan_3d_3p1_test_file() {
    let webhook = load_test_webhook("success/hunyuan_3d_3p1_model_urls_thumbnail_payload_1.json");
    let result = hydrate_webhook_contents(&webhook);

    let HydratedWebhookContents::Success(data) = result else {
      panic!("Expected Success, got {:?}", result);
    };

    let contents = data.extracted_contents
      .expect("extracted_contents should be Some");

    let glb = contents.model_glb.expect("model_glb should be Some");
    assert_eq!(glb.url.as_deref(), Some("https://v3b.fal.media/files/b/0aa1ba44/OdgIv8M9EkaBP_Mh4TVAB_model.glb"));
    assert_eq!(glb.content_type.as_deref(), Some("model/gltf-binary"));
    assert_eq!(glb.file_name.as_deref(), Some("model.glb"));
    assert_eq!(glb.file_size, Some(64261364));

    let model_urls = contents.model_urls.expect("model_urls should be Some");

    // The `glb` slot duplicates `model_glb` in this payload (same URL).
    let urls_glb = model_urls.glb.expect("model_urls.glb should be Some");
    assert_eq!(urls_glb.url.as_deref(), Some("https://v3b.fal.media/files/b/0aa1ba44/OdgIv8M9EkaBP_Mh4TVAB_model.glb"));

    let urls_obj = model_urls.obj.expect("model_urls.obj should be Some");
    assert_eq!(urls_obj.url.as_deref(), Some("https://v3b.fal.media/files/b/0aa1ba43/WxPMNbzsDxaGRCmGNgNAL_c3a871e997ecd5f889bf671630de23b4.obj"));
    assert_eq!(urls_obj.content_type.as_deref(), Some("model/obj"));
    assert_eq!(urls_obj.file_size, Some(34563830));

    // 3.1 additionally ships the OBJ's material and PBR texture files.
    let urls_mtl = model_urls.mtl.expect("model_urls.mtl should be Some");
    assert_eq!(urls_mtl.url.as_deref(), Some("https://v3b.fal.media/files/b/0aa1ba42/1T5VCp_xD0zCJlTLE96iK_material.mtl"));
    assert_eq!(urls_mtl.content_type.as_deref(), Some("text/plain"));
    assert_eq!(urls_mtl.file_name.as_deref(), Some("material.mtl"));
    assert_eq!(urls_mtl.file_size, Some(245));

    let urls_texture = model_urls.texture.expect("model_urls.texture should be Some");
    assert_eq!(urls_texture.url.as_deref(), Some("https://v3b.fal.media/files/b/0aa1ba43/aKp3mMB9nrhlKfV2KVf0S_texture_pbr_20250901.png"));
    assert_eq!(urls_texture.content_type.as_deref(), Some("image/png"));
    assert_eq!(urls_texture.file_name.as_deref(), Some("texture_pbr_20250901.png"));
    assert_eq!(urls_texture.file_size, Some(22794575));

    assert!(model_urls.fbx.is_none());
    assert!(model_urls.usdz.is_none());

    // The thumbnail is attached to the GLB as its cover image downstream.
    let thumbnail = contents.thumbnail.expect("thumbnail should be Some");
    assert_eq!(thumbnail.url.as_deref(), Some("https://v3b.fal.media/files/b/0aa1ba44/njq8zYhYahJNNQkGGiEZW_preview.png"));
    assert_eq!(thumbnail.content_type.as_deref(), Some("image/png"));
    assert_eq!(thumbnail.file_name.as_deref(), Some("preview.png"));
    assert_eq!(thumbnail.file_size, Some(141254));

    assert!(contents.model_glb_pbr.is_none());
    assert!(contents.model_mesh.is_none());
    assert!(contents.preprocessed_image.is_none());
  }

  #[test]
  fn synthetic_model_urls_payload_with_distinct_glb() {
    let obj: serde_json::Map<String, serde_json::Value> = serde_json::from_str(r#"{
      "model_urls": {
        "fbx": null,
        "glb": {
          "url": "https://cdn.example.com/model_alt.glb",
          "content_type": "model/gltf-binary",
          "file_name": "model_alt.glb",
          "file_size": 1234567
        },
        "obj": null,
        "usdz": null
      }
    }"#).unwrap();

    let model_urls = extract_model_urls(&obj).expect("should extract model_urls");
    let glb = model_urls.glb.expect("glb slot should be Some");
    assert_eq!(glb.url.as_deref(), Some("https://cdn.example.com/model_alt.glb"));
    assert_eq!(glb.file_size, Some(1234567));
    assert!(model_urls.fbx.is_none());
    assert!(model_urls.obj.is_none());
    assert!(model_urls.usdz.is_none());
  }

  #[test]
  fn missing_model_urls_key_returns_none() {
    let obj: serde_json::Map<String, serde_json::Value> = serde_json::from_str(r#"{
      "model_glb": {"url": "https://example.com/model.glb"}
    }"#).unwrap();

    assert!(extract_model_urls(&obj).is_none());
  }
}
