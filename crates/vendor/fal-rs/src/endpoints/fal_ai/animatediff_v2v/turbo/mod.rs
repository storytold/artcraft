#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct AnimateDiffV2VInput {
    /// Base model to use for animation generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base_model: Option<String>,
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The list of LoRA weights to use.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub loras: Option<Vec<Option<LoraWeight>>>,
    /// The negative prompt to use. Use it to address details that you don't want
    /// in the image. This could be colors, objects, scenery and even the small details
    /// (e.g. moustache, blurry, low resolution).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// Increasing the amount of steps tells Stable Diffusion that it should take more steps
    /// to generate your final result which can increase the amount of detail in your image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The prompt to use for generating the image. Be as descriptive as possible for best results.
    /// "masterpiece, best quality, rocket in space, galaxies in the background"
    pub prompt: String,
    /// The same seed and the same prompt given to the same version of Stable Diffusion
    /// will output the same image every time.
    /// 537306
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// Select every Nth frame from the video.
    /// This can be used to reduce the number of frames to process, which can reduce the time and the cost.
    /// However, it can also reduce the quality of the final video.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub select_every_nth_frame: Option<i64>,
    /// URL of the video.
    /// "https://storage.googleapis.com/falserverless/model_tests/animatediff_v2v/rocket.mp4"
    pub video_url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct AnimateDiffV2VOutput {
    /// Seed used for generating the video.
    pub seed: i64,
    pub timings: Timings,
    /// Generated video file.
    /// {"content_type":"video/mp4","url":"https://storage.googleapis.com/falserverless/model_tests/animatediff_v2v/turbo-rocket-output.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct AnimateDiffV2VTurboInput {
    /// The CFG (Classifier Free Guidance) scale is a measure of how close you want
    /// the model to stick to your prompt when looking for a related image to show you.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The list of LoRA weights to use.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub loras: Option<Vec<Option<LoraWeight>>>,
    /// The negative prompt to use. Use it to address details that you don't want
    /// in the image. This could be colors, objects, scenery and even the small details
    /// (e.g. moustache, blurry, low resolution).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// Increasing the amount of steps tells Stable Diffusion that it should take more steps
    /// to generate your final result which can increase the amount of detail in your image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The prompt to use for generating the image. Be as descriptive as possible for best results.
    /// "masterpiece, best quality, rocket in space, galaxies in the background"
    pub prompt: String,
    /// The same seed and the same prompt given to the same version of Stable Diffusion
    /// will output the same image every time.
    /// 537306
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// Select every Nth frame from the video.
    /// This can be used to reduce the number of frames to process, which can reduce the time and the cost.
    /// However, it can also reduce the quality of the final video.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub select_every_nth_frame: Option<i64>,
    /// URL of the video.
    /// "https://storage.googleapis.com/falserverless/model_tests/animatediff_v2v/rocket.mp4"
    pub video_url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AnimateDiffV2VTurboOutput {
    /// Seed used for generating the video.
    pub seed: i64,
    pub timings: Timings,
    /// Generated video file.
    /// {"content_type":"video/mp4","url":"https://storage.googleapis.com/falserverless/model_tests/animatediff_v2v/rocket-output.mp4"}
    pub video: File,
}

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
pub struct LoraWeight {
    /// URL or the path to the LoRA weights. Or HF model name.
    /// "https://civitai.com/api/download/models/135931"
    /// "https://filebin.net/3chfqasxpqu21y8n/my-custom-lora-v1.safetensors"
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

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Timings {
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "type")]
    pub ty: Option<serde_json::Value>,
}

/// AnimateDiff Video-to-Video Evolved
///
/// Category: video-to-video
/// Machine Type: A100
pub fn turbo(
    params: AnimateDiffV2VTurboInput,
) -> FalRequest<AnimateDiffV2VTurboInput, AnimateDiffV2VTurboOutput> {
    FalRequest::new("fal-ai/animatediff-v2v/turbo", params)
}
