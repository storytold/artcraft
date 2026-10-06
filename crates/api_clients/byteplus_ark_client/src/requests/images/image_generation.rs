use crate::creds::ark_api_key::ArkApiKey;
use crate::error::ark_error::ArkError;
use crate::error::ark_error_body::ArkErrorBody;
use crate::requests::ark_host::ARK_AP_SOUTHEAST_BASE_URL;
use crate::requests::http::send_json;
use reqwest::Method;
use serde_derive::{Deserialize, Serialize};
use std::time::Duration;

/// Seedream renders synchronously; large batches at 4K can take minutes.
const IMAGE_GENERATION_TIMEOUT: Duration = Duration::from_secs(300);
/// Layer decomposition thinks first and returns a PNG per layer: a busy picture (a set with a
/// dozen screens, windows and lights) can take longer than a plain generation.
const LAYER_DECOMPOSITION_TIMEOUT: Duration = Duration::from_secs(600);

/// `POST /images/generations` (Seedream). Returns once the images are ready.
pub async fn generate_images(
  api_key: &ArkApiKey,
  request: &ImageGenerationRequest,
) -> Result<ImageGenerationResponse, ArkError> {
  let url = format!("{}/images/generations", ARK_AP_SOUTHEAST_BASE_URL);
  send_json(api_key, Method::POST, &url, Some(request), timeout_for(request)).await
}

fn timeout_for(request: &ImageGenerationRequest) -> Duration {
  if request.layer_decomposition { LAYER_DECOMPOSITION_TIMEOUT } else { IMAGE_GENERATION_TIMEOUT }
}

// ── Request ──

#[derive(Clone, Debug, Serialize)]
pub struct ImageGenerationRequest {
  /// Dated model id (eg. `seedream-4-5-251128`) or an endpoint id (`ep-...`).
  pub model: String,

  /// Omitted when empty: layer decomposition can pick the elements on its own.
  #[serde(skip_serializing_if = "String::is_empty")]
  pub prompt: String,

  /// Reference images as URLs or `data:image/<format>;base64,...` strings. Layer decomposition
  /// takes exactly one.
  #[serde(skip_serializing_if = "Vec::is_empty")]
  pub image: Vec<String>,

  /// `1K` / `2K` / `4K` (model dependent) or `"<width>x<height>"`. Layer decomposition only takes
  /// `1K` / `1.5K` / `2K` / `auto`.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub size: Option<String>,

  /// `auto` lets Seedream return a set of related images, up to `max_images`.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub sequential_image_generation: Option<SequentialImageGeneration>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub sequential_image_generation_options: Option<SequentialImageGenerationOptions>,

  /// Seedream 5.0 pro only: split the input image into a base image and up to 16 transparent
  /// PNG layers (subjects, text, decorations) instead of generating a new image.
  #[serde(skip_serializing_if = "is_false")]
  pub layer_decomposition: bool,

  /// File format of generated images (of the base image for layer decomposition; layers are
  /// always PNG). The model's default applies when unset.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub output_format: Option<ImageOutputFormat>,

  /// Seedream 5.0 pro: a transparent background keeps the alpha channel (needs PNG output).
  #[serde(skip_serializing_if = "Option::is_none")]
  pub background: Option<ImageBackground>,

  pub response_format: ImageResponseFormat,

  /// ModelArk adds a visible "AI generated" mark unless this is false.
  pub watermark: bool,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum ImageBackground {
  Transparent,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum SequentialImageGeneration {
  Auto,
  Disabled,
}

#[derive(Clone, Debug, Serialize)]
pub struct SequentialImageGenerationOptions {
  pub max_images: u32,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum ImageOutputFormat {
  Png,
  Jpeg,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum ImageResponseFormat {
  /// A download link that expires after 24 hours.
  Url,
  /// The image bytes, base64 encoded, inline in the response.
  B64Json,
}

// ── Response ──

#[derive(Debug, Deserialize)]
pub struct ImageGenerationResponse {
  pub model: Option<String>,
  #[serde(default)]
  pub data: Vec<GeneratedImage>,
  pub usage: Option<ImageGenerationUsage>,
}

/// One generated image. When a single image in a batch fails (eg. moderation), it carries an
/// `error` instead of image data.
#[derive(Debug, Deserialize)]
pub struct GeneratedImage {
  pub url: Option<String>,
  pub b64_json: Option<String>,
  pub size: Option<String>,
  pub output_format: Option<String>,
  pub error: Option<ArkErrorBody>,

  /// Layer decomposition: 0 for the base image, 1.. for layers in stacking order.
  pub z_index: Option<u32>,
  /// Layer decomposition: where the layer sits in the base image. Absent for the base image.
  pub bounding_box: Option<LayerBoundingBox>,
  /// Layer decomposition: short name of the layer's content, eg. "Ceramic coffee mug".
  pub name: Option<String>,
  pub description: Option<String>,
}

/// `[left, top, right, bottom]` of a decomposed layer.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Deserialize)]
pub struct LayerBoundingBox {
  /// Pixels in the returned base image.
  pub absolute: [u32; 4],
  /// Thousandths (0-1000) of the base image's width and height.
  pub normalized: [u32; 4],
}

#[derive(Debug, Deserialize)]
pub struct ImageGenerationUsage {
  pub generated_images: Option<u32>,
  pub output_tokens: Option<u64>,
  pub total_tokens: Option<u64>,
}

fn is_false(value: &bool) -> bool {
  !*value
}

#[cfg(test)]
mod tests {
  use super::*;

  mod requests {
    use super::*;

    #[test]
    fn serializes_only_the_fields_that_are_set() {
      let request = ImageGenerationRequest {
        model: "seedream-4-5-251128".to_string(),
        prompt: "Product shot of a ceramic mug".to_string(),
        image: vec![],
        size: Some("2K".to_string()),
        sequential_image_generation: None,
        sequential_image_generation_options: None,
        layer_decomposition: false,
        output_format: None,
        background: None,
        response_format: ImageResponseFormat::B64Json,
        watermark: false,
      };
      let json = serde_json::to_value(&request).unwrap();
      assert_eq!(json, serde_json::json!({
        "model": "seedream-4-5-251128",
        "prompt": "Product shot of a ceramic mug",
        "size": "2K",
        "response_format": "b64_json",
        "watermark": false,
      }));
    }

    #[test]
    fn with_references_and_a_batch() {
      let request = ImageGenerationRequest {
        model: "seedream-5-0-260128".to_string(),
        prompt: "Four matching icons".to_string(),
        image: vec!["data:image/png;base64,iVBOR".to_string()],
        size: None,
        sequential_image_generation: Some(SequentialImageGeneration::Auto),
        sequential_image_generation_options: Some(SequentialImageGenerationOptions { max_images: 4 }),
        layer_decomposition: false,
        output_format: None,
        background: None,
        response_format: ImageResponseFormat::Url,
        watermark: true,
      };
      let json = serde_json::to_value(&request).unwrap();
      assert_eq!(json["image"], serde_json::json!(["data:image/png;base64,iVBOR"]));
      assert_eq!(json["sequential_image_generation"], "auto");
      assert_eq!(json["sequential_image_generation_options"]["max_images"], 4);
      assert_eq!(json["response_format"], "url");
    }

    #[test]
    fn layer_decomposition_gets_longer_to_answer() {
      let mut request = ImageGenerationRequest {
        model: "dola-seedream-5-0-pro-260628".to_string(),
        prompt: String::new(),
        image: vec![],
        size: None,
        sequential_image_generation: None,
        sequential_image_generation_options: None,
        layer_decomposition: false,
        output_format: None,
        background: None,
        response_format: ImageResponseFormat::Url,
        watermark: false,
      };
      assert_eq!(timeout_for(&request), IMAGE_GENERATION_TIMEOUT);
      request.layer_decomposition = true;
      assert_eq!(timeout_for(&request), LAYER_DECOMPOSITION_TIMEOUT);
    }

    #[test]
    fn layer_decomposition_without_a_prompt() {
      let request = ImageGenerationRequest {
        model: "dola-seedream-5-0-pro-260628".to_string(),
        prompt: String::new(),
        image: vec!["data:image/jpeg;base64,/9j/".to_string()],
        size: Some("1.5K".to_string()),
        sequential_image_generation: None,
        sequential_image_generation_options: None,
        layer_decomposition: true,
        output_format: Some(ImageOutputFormat::Png),
        background: None,
        response_format: ImageResponseFormat::B64Json,
        watermark: false,
      };
      let json = serde_json::to_value(&request).unwrap();
      assert_eq!(json, serde_json::json!({
        "model": "dola-seedream-5-0-pro-260628",
        "image": ["data:image/jpeg;base64,/9j/"],
        "size": "1.5K",
        "layer_decomposition": true,
        "output_format": "png",
        "response_format": "b64_json",
        "watermark": false,
      }));
    }
  }

  mod responses {
    use super::*;

    #[test]
    fn parses_images_usage_and_per_image_errors() {
      let body = r#"{
        "model": "seedream-4-5-251128",
        "created": 1757900000,
        "data": [
          {"url": "https://example.com/a.png", "size": "2048x2048"},
          {"error": {"code": "OutputImageSensitiveContentDetected", "message": "blocked"}}
        ],
        "usage": {"generated_images": 1, "output_tokens": 16384, "total_tokens": 16384}
      }"#;
      let response: ImageGenerationResponse = serde_json::from_str(body).unwrap();
      assert_eq!(response.data.len(), 2);
      assert_eq!(response.data[0].url.as_deref(), Some("https://example.com/a.png"));
      assert_eq!(response.data[1].error.as_ref().unwrap().code.as_deref(), Some("OutputImageSensitiveContentDetected"));
      assert_eq!(response.usage.unwrap().generated_images, Some(1));
    }

    #[test]
    fn parses_a_layer_decomposition() {
      // Shape returned by a live Seedream 5.0 pro decomposition on 2026-09-15 (image data elided).
      let body = r#"{
        "model": "dola-seedream-5-0-pro-260628",
        "created": 1789487900,
        "data": [
          {"b64_json": "iVBOR", "size": "1424x800", "output_format": "png", "z_index": 0},
          {"b64_json": "iVBOR", "size": "799x654", "output_format": "png", "z_index": 1,
           "bounding_box": {"absolute": [351, 218, 922, 685], "normalized": [246, 273, 647, 855]},
           "name": "Ceramic coffee mug", "description": "The mug with its handle and the coffee inside"}
        ],
        "usage": {"input_images": 1, "generated_images": 2, "output_tokens": 8462, "total_tokens": 8462}
      }"#;
      let response: ImageGenerationResponse = serde_json::from_str(body).unwrap();
      let base = &response.data[0];
      assert_eq!(base.z_index, Some(0));
      assert!(base.bounding_box.is_none());

      let layer = &response.data[1];
      assert_eq!(layer.z_index, Some(1));
      assert_eq!(layer.name.as_deref(), Some("Ceramic coffee mug"));
      assert_eq!(layer.bounding_box, Some(LayerBoundingBox { absolute: [351, 218, 922, 685], normalized: [246, 273, 647, 855] }));
    }
  }

  // Generates ONE paid Seedream image. Runs only when explicitly opted in:
  //   BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_GENERATION=1 [BYTEPLUS_LIVE_OUTPUT_DIR=/tmp/x] \
  //     cargo test -p byteplus_ark_client generates_one_seedream_image -- --ignored
  mod live {
    use super::*;
    use base64::Engine;
    use base64::engine::general_purpose::STANDARD;

    #[tokio::test]
    #[ignore]
    async fn generates_one_seedream_image() {
      if std::env::var("BYTEPLUS_LIVE_GENERATION").as_deref() != Ok("1") {
        return;
      }
      let key = std::env::var("BYTEPLUS_API_KEY").expect("set BYTEPLUS_API_KEY for live tests");

      let request = ImageGenerationRequest {
        model: "seedream-4-5-251128".to_string(),
        prompt: "A ceramic coffee mug on a wooden desk, soft morning light, product photo".to_string(),
        image: vec![],
        size: Some("2560x1440".to_string()),
        sequential_image_generation: None,
        sequential_image_generation_options: None,
        layer_decomposition: false,
        output_format: None,
        background: None,
        response_format: ImageResponseFormat::B64Json,
        watermark: false,
      };

      let response = generate_images(&ArkApiKey::new(&key), &request).await.unwrap();
      assert_eq!(response.data.len(), 1, "expected exactly one image");

      let image = &response.data[0];
      assert!(image.error.is_none(), "image error: {:?}", image.error);
      let bytes = STANDARD.decode(image.b64_json.as_deref().expect("image data")).unwrap();
      let is_png = bytes.starts_with(&[0x89, b'P', b'N', b'G']);
      let is_jpeg = bytes.starts_with(&[0xFF, 0xD8, 0xFF]);
      assert!(is_png || is_jpeg, "unexpected image format");

      println!("live seedream: model={:?} size={:?} bytes={} format={} usage={:?}",
        response.model, image.size, bytes.len(), if is_png { "png" } else { "jpeg" }, response.usage.as_ref().map(|u| (u.generated_images, u.total_tokens)));

      if let Ok(dir) = std::env::var("BYTEPLUS_LIVE_OUTPUT_DIR") {
        let path = std::path::Path::new(&dir).join(if is_png { "live_seedream.png" } else { "live_seedream.jpg" });
        std::fs::write(&path, &bytes).unwrap();
        println!("live seedream saved to {}", path.display());
      }
    }
  }
}
