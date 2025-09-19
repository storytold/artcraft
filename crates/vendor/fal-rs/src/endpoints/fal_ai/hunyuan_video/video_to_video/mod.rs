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
pub struct HunyuanT2VResponse {
    /// The seed used for generating the video.
    pub seed: i64,
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct HunyuanV2VRequest {
    /// The aspect ratio of the video to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    /// If set to true, the safety checker will be enabled.
    /// true
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checker: Option<bool>,
    /// The number of frames to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_frames: Option<String>,
    /// The number of inference steps to run. Lower gets faster results, higher gets better results.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// By default, generations are done with 35 steps. Pro mode does 55 steps which results in higher quality videos but will take more time and cost 2x more billing units.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pro_mode: Option<bool>,
    /// The prompt to generate the video from.
    /// "A stylish woman walks down a Tokyo street filled with warm glowing neon and animated city signage. She wears a dark blue leather jacket, a long pink dress, and bright yellow boots, and carries a black purse."
    pub prompt: String,
    /// The resolution of the video to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resolution: Option<String>,
    /// The seed to use for generating the video.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// Strength for Video-to-Video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub strength: Option<f64>,
    /// URL of the video input.
    /// "https://storage.googleapis.com/falserverless/hunyuan_video/hunyuan_v2v_input.mp4"
    pub video_url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct HunyuanVideoRequest {
    /// The aspect ratio of the video to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    /// If set to true, the safety checker will be enabled.
    /// true
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checker: Option<bool>,
    /// The number of frames to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_frames: Option<String>,
    /// The number of inference steps to run. Lower gets faster results, higher gets better results.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// By default, generations are done with 35 steps. Pro mode does 55 steps which results in higher quality videos but will take more time and cost 2x more billing units.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pro_mode: Option<bool>,
    /// The prompt to generate the video from.
    /// "A stylish woman walks down a Tokyo street filled with warm glowing neon and animated city signage. She wears a black leather jacket, a long red dress, and black boots, and carries a black purse."
    pub prompt: String,
    /// The resolution of the video to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resolution: Option<String>,
    /// The seed to use for generating the video.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct LoraWeight {
    /// URL or the path to the LoRA weights.
    pub path: String,
    /// The scale of the LoRA weight. This is used to scale the LoRA weight
    /// before merging it with the base model.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scale: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// Hunyuan Video
///
/// Category: text-to-video
/// Machine Type: H100
///
///
/// Hunyuan Video API for fast video generation. Text-to-video and video-to-video modes are supported.
pub fn video_to_video(
    params: HunyuanV2VRequest,
) -> FalRequest<HunyuanV2VRequest, HunyuanT2VResponse> {
    FalRequest::new("fal-ai/hunyuan-video/video-to-video", params)
}
