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

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct WanI2VRequest {
    /// Aspect ratio of the generated video. If 'auto', the aspect ratio will be determined automatically based on the input image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    /// Whether to enable prompt expansion.
    /// true
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_prompt_expansion: Option<bool>,
    /// If set to true, the safety checker will be enabled.
    /// true
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checker: Option<bool>,
    /// Frames per second of the generated video. Must be between 5 to 24.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub frames_per_second: Option<i64>,
    /// Classifier-free guidance scale. Higher values give better adherence to the prompt but may decrease quality.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guide_scale: Option<f64>,
    /// URL of the input image.
    /// "https://storage.googleapis.com/falserverless/gallery/car_720p.png"
    pub image_url: String,
    /// Negative prompt for video generation.
    /// "bright colors, overexposed, static, blurred details, subtitles, style, artwork, painting, picture, still, overall gray, worst quality, low quality, JPEG compression residue, ugly, incomplete, extra fingers, poorly drawn hands, poorly drawn faces, deformed, disfigured, malformed limbs, fused fingers, still picture, cluttered background, three legs, many people in the background, walking backwards"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// Number of frames to generate. Must be between 81 to 100 (inclusive). If the number of frames is greater than 81, the video will be generated with 1.25x more billing units.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_frames: Option<i64>,
    /// Number of inference steps for sampling. Higher values give better quality but take longer.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The text prompt to guide video generation.
    /// "Cars racing in slow motion"
    pub prompt: String,
    /// Resolution of the generated video (480p or 720p). 480p is 0.5 billing units, and 720p is 1 billing unit.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resolution: Option<String>,
    /// Random seed for reproducibility. If None, a random seed is chosen.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// Shift parameter for video generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub shift: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WanI2VResponse {
    /// The seed used for generation.
    pub seed: i64,
    /// The generated video file.
    /// {"url":"https://storage.googleapis.com/falserverless/gallery/wan-i2v-example.mp4"}
    pub video: File,
}

/// Wan-2.1 Image-to-Video
///
/// Category: image-to-video
/// Machine Type: H100
///
///
/// Generate a video from an image and prompt.
pub fn wan_i2v(params: WanI2VRequest) -> FalRequest<WanI2VRequest, WanI2VResponse> {
    FalRequest::new("fal-ai/wan-i2v", params)
}
