#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[cfg(any(
    feature = "endpoints",
    feature = "endpoints_fal-ai",
    feature = "endpoints_fal-ai_mini-cpm"
))]
#[cfg_attr(
    docsrs,
    doc(cfg(any(
        feature = "endpoints",
        feature = "endpoints_fal-ai",
        feature = "endpoints_fal-ai_mini-cpm"
    )))
)]
pub mod video;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct HTTPValidationError {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<Vec<Option<ValidationError>>>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct MiniCPMV26ImageInput {
    /// List of image URLs to be used for the image description
    /// ["https://llava-vl.github.io/static/images/monalisa.jpg"]
    pub image_urls: Vec<String>,
    /// Prompt to be used for the image description
    /// "Who is she? Who drew this?"
    pub prompt: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MiniCPMV26Output {
    /// Response from the model
    pub output: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct MiniCPMV26VideoInput {
    /// Prompt to be used for the video description
    /// "What is she doing? Describe it detailed way."
    pub prompt: String,
    /// URL of the video to be analyzed
    /// "https://storage.googleapis.com/falserverless/model_tests/musepose/dance.mp4"
    pub video_url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// MiniCPM-V 2.6
///
/// Category: vision
/// Machine Type: A100
/// License Type: commercial
pub fn mini_cpm(
    params: MiniCPMV26ImageInput,
) -> FalRequest<MiniCPMV26ImageInput, MiniCPMV26Output> {
    FalRequest::new("fal-ai/mini-cpm", params)
}
