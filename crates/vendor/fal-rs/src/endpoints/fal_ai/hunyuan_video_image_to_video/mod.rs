#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct File {
    /// The mime type of the file.
    /// "image/png"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content_type: Option<String>,
    /// File data
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_data: Option<String>,
    /// The name of the file. It will be auto-generated if not provided.
    /// "z9RV14K95DvU.png"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_name: Option<String>,
    /// The size of the file in bytes.
    /// 4404019
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_size: Option<i64>,
    /// The URL where the file can be downloaded from.
    pub url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct HTTPValidationError {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<Vec<Option<ValidationError>>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HunyuanI2VResponse {
    /// The seed used for generating the video.
    pub seed: i64,
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct HunyuanVideoRequest {
    /// The aspect ratio of the video to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    /// Turning on I2V Stability reduces hallucination but also reduces motion.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub i2v_stability: Option<bool>,
    /// URL of the image input.
    /// "https://storage.googleapis.com/falserverless/example_inputs/hunyuan_i2v.jpg"
    pub image_url: String,
    /// The number of frames to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_frames: Option<String>,
    /// The prompt to generate the video from.
    /// "Two muscular cats boxing in a boxing ring."
    pub prompt: String,
    /// The resolution of the video to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resolution: Option<String>,
    /// The seed to use for generating the video.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// Hunyuan Video Image-to-Video Inference
///
/// Category: image-to-video
/// Machine Type: H100
pub fn hunyuan_video_image_to_video(
    params: HunyuanVideoRequest,
) -> FalRequest<HunyuanVideoRequest, HunyuanI2VResponse> {
    FalRequest::new("fal-ai/hunyuan-video-image-to-video", params)
}
