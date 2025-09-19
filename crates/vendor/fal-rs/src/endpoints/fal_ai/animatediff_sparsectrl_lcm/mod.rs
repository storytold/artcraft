#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct AnimatediffLCMInput {
    /// The type of controlnet to use for generating the video. The controlnet determines how the video will be animated.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub controlnet_type: Option<String>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<i64>,
    /// The URL of the first keyframe to use for the generation.
    /// "https://storage.googleapis.com/falserverless/scribble2/scribble_2_1.png"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub keyframe_0_image_url: Option<String>,
    /// The frame index of the first keyframe to use for the generation.
    /// 0
    #[serde(skip_serializing_if = "Option::is_none")]
    pub keyframe_0_index: Option<i64>,
    /// The URL of the second keyframe to use for the generation.
    /// "https://storage.googleapis.com/falserverless/scribble2/scribble_2_2.png"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub keyframe_1_image_url: Option<String>,
    /// The frame index of the second keyframe to use for the generation.
    /// 8
    #[serde(skip_serializing_if = "Option::is_none")]
    pub keyframe_1_index: Option<i64>,
    /// The URL of the third keyframe to use for the generation.
    /// "https://storage.googleapis.com/falserverless/scribble2/scribble_2_3.png"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub keyframe_2_image_url: Option<String>,
    /// The frame index of the third keyframe to use for the generation.
    /// 15
    #[serde(skip_serializing_if = "Option::is_none")]
    pub keyframe_2_index: Option<i64>,
    /// The negative prompt to use. Use it to specify what you don't want.
    /// "blurry, low resolution, bad, ugly, low quality, pixelated, interpolated, compression artifacts, noisey, grainy"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// Increasing the amount of steps tells Stable Diffusion that it should take more steps to generate your final result which can increase the amount of detail in your image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The prompt to use for generating the image. Be as descriptive as possible for best results.
    /// "Drone footage, futuristic city at night, synthwave, vaporware, neon lights, highly detailed, masterpeice, high quality"
    pub prompt: String,
    /// The same seed and the same prompt given to the same version of Stable
    /// Diffusion will output the same image every time.
    /// 42
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AnimatediffLCMOutput {
    /// The seed used to generate the video.
    pub seed: i64,
    /// Generated video file.
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct File {
    /// The mime type of the file.
    /// "image/png"
    pub content_type: String,
    /// The name of the file. It will be auto-generated if not provided.
    /// "z9RV14K95DvU.png"
    pub file_name: String,
    /// The size of the file in bytes.
    /// 4404019
    pub file_size: i64,
    /// The URL where the file can be downloaded from.
    /// "https://url.to/generated/file/z9RV14K95DvU.png"
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

/// Animatediff SparseCtrl LCM
///
/// Category: text-to-video
/// Machine Type: A100
pub fn animatediff_sparsectrl_lcm(
    params: AnimatediffLCMInput,
) -> FalRequest<AnimatediffLCMInput, AnimatediffLCMOutput> {
    FalRequest::new("fal-ai/animatediff-sparsectrl-lcm", params)
}
