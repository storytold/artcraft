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
pub struct Input {
    /// The URL to the image to generate the video from. The image must be 960x544 or it will get cropped and resized to that size.
    /// "https://d3phaj0sisr2ct.cloudfront.net/research/eugene.jpg"
    pub image_url: String,
    /// The prompt to generate the video from.
    /// "A low angle shot of a man walking down a street, illuminated by the neon signs of the bars around him"
    pub prompt: String,
    /// The seed to use for generating the video.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Output {
    /// The seed used for generating the video.
    pub seed: i64,
    /// The generated video
    /// {"content_type":"video/mp4","url":"https://storage.googleapis.com/falserverless/gallery/man-smiles.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// Hunyuan Video Image-to-Video LoRA Inference
///
/// Category: image-to-video
/// Machine Type: H100
///
///
/// Generate a video based on a prompt and an image URL.
/// This implementation downloads the image from the URL, replicates it to form a video,
/// encodes the prompt, uses video2video conditioning and sampling to produce new video latents,
/// decodes the latents to video frames, and saves the video to a temporary file.
pub fn hunyuan_video_img2vid_lora(params: Input) -> FalRequest<Input, Output> {
    FalRequest::new("fal-ai/hunyuan-video-img2vid-lora", params)
}
