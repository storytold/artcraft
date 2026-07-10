use serde::Deserialize;
use serde_json::Value;

use crate::webhook_payload::raw::webhook_error_type::WebhookErrorType;

/// The parsed inner payload of a FAL webhook.
#[derive(Debug)]
pub enum HydratedWebhookContents {
  /// The webhook reported success and has a payload.
  Success(WebhookSuccessData),

  /// The webhook reported an error (status=ERROR) with optional detail info.
  Error(ErrorData),

  /// The webhook reported as "success" but (1) had no payload and (2) had a payload_error.
  /// In rare instances of an "OK" response, there may be an error on Fal's end with encoding
  /// the payload. If that happens, the "payload_error" field may be set, and this enum variant
  /// represents that failure case.
  PayloadError(PayloadErrorData),
}

#[derive(Debug)]
pub struct WebhookSuccessData {
  /// The success data is polymorphic, so we're returning a JSON `Value` for now.
  /// This will allow for downstream handlers to parse the payload as needed.
  /// This is the entire raw success payload.
  pub payload: Value,

  /// If there are any extracted sub-payload contents, such as "images" or "video",
  /// then they are included here. This may not be fully inclusive of future
  /// payload types.
  pub extracted_contents: Option<ExtractedContents>,
}

#[derive(Debug)]
pub struct ExtractedContents {
  /// Parsed from `payload.image` (single image result).
  pub image: Option<ImageData>,

  /// Parsed from `payload.images` (batch image results).
  pub images: Option<Vec<ImagesData>>,

  /// Parsed from `payload.video`.
  pub video: Option<VideoData>,

  /// Parsed from `payload.model_glb`.
  pub model_glb: Option<ModelGlbData>,

  /// Parsed from `payload.model_glb_pbr` (e.g. Hunyuan 3D 2.1's PBR-textured
  /// GLB variant, sent alongside `model_glb`).
  pub model_glb_pbr: Option<ModelGlbData>,

  /// Parsed from `payload.model_urls` (e.g. Hunyuan 3D 3.0's per-format file
  /// map, sent alongside `model_glb`).
  pub model_urls: Option<ModelUrlsData>,

  /// Parsed from `payload.model_mesh`.
  /// NB: `triposplat` ply gaussian splat files also arrive via this payload handler.
  ///     These are decidedly *not* "mesh" files!
  pub model_mesh: Option<ModelMeshData>,

  /// Parsed from `payload.model_obj` (e.g. Hunyuan 3D v3.1 Rapid's OBJ output).
  pub model_obj: Option<ModelObjData>,

  /// Parsed from `payload.result_files` (e.g. Hunyuan 3D v3.1 Part's FBX part files).
  pub result_files: Option<Vec<ResultFileData>>,

  /// Parsed from `payload.thumbnail`.
  pub thumbnail: Option<ThumbnailData>,

  /// Parsed from `payload.preprocessed_image` (e.g. TripoSplat's segmented
  /// input image, usable as a cover image for the splat result).
  pub preprocessed_image: Option<PreprocessedImageData>,
}

/// Data under `payload.image`:
#[derive(Debug, Deserialize)]
pub struct ImageData {
  pub url: Option<String>,
  pub content_type: Option<String>,
  pub file_name: Option<String>,
  pub file_size: Option<u64>,
  pub height: Option<u64>,
  pub width: Option<u64>,
}

/// Data under `payload.images` (a list of these):
#[derive(Debug, Deserialize)]
pub struct ImagesData {
  pub url: Option<String>,
  pub content_type: Option<String>,
  pub file_name: Option<String>,
  pub file_size: Option<u64>,
  pub height: Option<u64>,
  pub width: Option<u64>,
}

/// Data under `payload.video`:
#[derive(Debug, Deserialize)]
pub struct VideoData {
  pub url: Option<String>,
  pub content_type: Option<String>,
  pub file_name: Option<String>,
  pub file_size: Option<u64>,
}

/// Data under `payload.model_glb` (there may be other sibling keys too).
/// Also used for `payload.model_glb_pbr`, which has the same shape.
#[derive(Debug, Deserialize)]
pub struct ModelGlbData {
  pub content_type: Option<String>,
  pub file_name: Option<String>,
  pub file_size: Option<usize>,
  pub url: Option<String>,
}

/// Data under `payload.model_mesh` (there may be other sibling keys too)
/// NB: `triposplat` ply gaussian splat files also arrive via this payload.
///     These are decidedly *not* "mesh" files!
#[derive(Debug, Deserialize)]
pub struct ModelMeshData {
  pub content_type: Option<String>,
  pub file_name: Option<String>,
  pub file_size: Option<usize>,
  pub url: Option<String>,
}

/// Data under `payload.model_urls` (e.g. Hunyuan 3D 3.0): a map of the
/// generation's output files by format. Any slot may be null. The `glb`
/// entry frequently duplicates `payload.model_glb` (same URL), but may
/// point to a different file.
#[derive(Debug, Deserialize)]
pub struct ModelUrlsData {
  pub fbx: Option<ModelGlbData>,
  pub glb: Option<ModelGlbData>,
  pub obj: Option<ModelGlbData>,
  pub usdz: Option<ModelGlbData>,
}

/// Data under `payload.model_obj` (there may be other sibling keys too).
/// Some endpoints (e.g. Hunyuan 3D v3.1 Rapid text-to-3d) return an OBJ
/// model instead of (or alongside) a GLB.
#[derive(Debug, Deserialize)]
pub struct ModelObjData {
  pub content_type: Option<String>,
  pub file_name: Option<String>,
  pub file_size: Option<usize>,
  pub url: Option<String>,
}

/// An entry under `payload.result_files` (a list of these).
/// Used by endpoints returning multiple output files, e.g. Hunyuan 3D v3.1
/// Part's per-part FBX files.
#[derive(Debug, Deserialize)]
pub struct ResultFileData {
  pub content_type: Option<String>,
  pub file_name: Option<String>,
  pub file_size: Option<usize>,
  pub url: Option<String>,
}

/// Data under `payload.thumbnail` (there may be other sibling keys too)
/// Frequently seen together with `model_glb`.
#[derive(Debug, Deserialize)]
pub struct ThumbnailData {
  pub content_type: Option<String>,
  pub file_name: Option<String>,
  pub file_size: Option<usize>,
  pub url: Option<String>,
}

/// Data under `payload.preprocessed_image` (there may be other sibling keys too).
/// Seen together with `model_mesh` in TripoSplat results: the segmented input
/// image, which we use as a cover image for the splat.
#[derive(Debug, Deserialize)]
pub struct PreprocessedImageData {
  pub content_type: Option<String>,
  pub file_name: Option<String>,
  pub file_size: Option<usize>,
  pub height: Option<u64>,
  pub url: Option<String>,
  pub width: Option<u64>,
}

#[derive(Debug)]
pub struct ErrorData {
  /// The first human-readable message from `payload.detail[].msg`, if any.
  pub message: Option<String>,

  /// The first machine-readable error type from `payload.detail[].type`, if any.
  pub error_type: Option<WebhookErrorType>,
}

#[derive(Debug)]
pub struct PayloadErrorData {
  pub payload_error: String,
}
