use serde_derive::{Deserialize, Serialize};

#[derive(Serialize, Debug)]
pub (super) struct BatchRequest {
  #[serde(rename = "0")]
  pub zero: BatchRequestInner,
}

#[derive(Serialize, Debug)]
pub (super) struct BatchRequestInner {
  pub json: BatchRequestJson,
}

#[derive(Serialize, Debug)]
pub (super) struct BatchRequestJson {
  #[serde(rename = "businessType")]
  pub business_type: &'static str,
  #[serde(rename = "apiParams")]
  pub api_params: ApiParams,
}

#[derive(Serialize, Debug)]
pub (super) struct ApiParams {
  pub prompt: String,
  /// Aspect ratio as pixel dimensions (e.g. "1280x720"). Most Kinovi
  /// models carry the aspect ratio here. None for models that use the
  /// `aspectRatio` field instead (Seedance 2.0 Mini).
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution: Option<String>,
  /// Aspect ratio as a ratio string (e.g. "16:9"). Used by Seedance 2.0
  /// Mini instead of `resolution`. None for models that use `resolution`.
  #[serde(rename = "aspectRatio", skip_serializing_if = "Option::is_none")]
  pub aspect_ratio: Option<&'static str>,
  #[serde(rename = "contentMode")]
  pub content_mode: &'static str,
  pub model: &'static str,
  pub duration: String,
  /// Generation mode ("keyframe" / "reference"). Omitted for models that use
  /// `happyhorseMode` instead (Happy Horse).
  #[serde(skip_serializing_if = "Option::is_none")]
  pub mode: Option<&'static str>,
  /// Happy Horse generation mode ("t2v" / "i2v"). Used instead of `mode` by
  /// Happy Horse; None for every other model.
  #[serde(rename = "happyhorseMode", skip_serializing_if = "Option::is_none")]
  pub happyhorse_mode: Option<&'static str>,
  #[serde(rename = "outputResolution", skip_serializing_if = "Option::is_none")]
  pub output_resolution: Option<&'static str>,
  #[serde(rename = "faceBlurMode", skip_serializing_if = "Option::is_none")]
  pub face_blur_mode: Option<&'static str>,
  #[serde(rename = "characterIds", skip_serializing_if = "Option::is_none")]
  pub character_ids: Option<Vec<String>>,
  #[serde(rename = "uploadedUrls", skip_serializing_if = "Option::is_none")]
  pub uploaded_urls: Option<Vec<String>>,
  #[serde(rename = "audioUrls", skip_serializing_if = "Option::is_none")]
  pub audio_urls: Option<Vec<String>>,
  #[serde(rename = "batchCount", skip_serializing_if = "Option::is_none")]
  pub batch_count: Option<u8>,
  #[serde(rename = "bitrate_mode", skip_serializing_if = "Option::is_none")]
  pub bitrate_mode: Option<&'static str>,
}

#[derive(Deserialize, Debug)]
pub (super) struct BatchResponseItem {
  pub result: BatchResponseResult,
}

#[derive(Deserialize, Debug)]
pub (super) struct BatchResponseResult {
  pub data: BatchResponseData,
}

#[derive(Deserialize, Debug)]
pub (super) struct BatchResponseData {
  pub json: TaskResponseJson,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub (super) struct TaskResponseJson {
  pub task_id: String,
  pub order_id: String,
  pub task_ids: Option<Vec<String>>,
  pub order_ids: Option<Vec<String>>,
  pub violation_warning: bool,
}
