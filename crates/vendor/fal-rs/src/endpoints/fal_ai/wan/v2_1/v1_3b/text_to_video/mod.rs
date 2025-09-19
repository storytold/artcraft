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
pub struct WanT2VRequest {
    /// Aspect ratio of the generated video (16:9 or 9:16).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    /// Whether to enable prompt expansion.
    /// false
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_prompt_expansion: Option<bool>,
    /// If set to true, the safety checker will be enabled.
    /// true
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_safety_checker: Option<bool>,
    /// Classifier-free guidance scale. Controls prompt adherence vs. creativity
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The negative prompt to use. Use it to address details that you don't want
    /// in the image. This could be colors, objects, scenery and even the small
    /// details (e.g. moustache, blurry, low resolution).
    /// ""
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// Number of inference steps for sampling. Higher values give better quality but take longer.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The text prompt to guide video generation.
    /// "Two anthropomorphic cats in comfy boxing gear and bright gloves fight intensely on a spotlighted stage."
    pub prompt: String,
    /// The sampler to use for generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sampler: Option<String>,
    /// Random seed for reproducibility. If None, a random seed is chosen.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// Noise schedule shift parameter. Affects temporal dynamics.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub shift: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WanT2VResponse {
    /// The seed used for generation.
    pub seed: i64,
    /// The generated video file.
    /// {"url":"https://v3.fal.media/files/lion/mF2VjLzSNyI-KTAuDQExX_tmpvkubnfyc.mp4"}
    pub video: File,
}

/// Wan-2.1 1.3B Text-to-Video
///
/// Category: text-to-video
/// Machine Type: H100
///
///
/// WAN 1.3B model for fast text-to-video generation.
pub fn text_to_video(params: WanT2VRequest) -> FalRequest<WanT2VRequest, WanT2VResponse> {
    FalRequest::new("fal-ai/wan/v2.1/1.3b/text-to-video", params)
}
