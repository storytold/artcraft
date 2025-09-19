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
pub struct MochiT2VInput {
    /// Whether to enable prompt expansion.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enable_prompt_expansion: Option<bool>,
    /// The negative prompt for the video.
    /// "Blurry, shaky footage"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// The prompt to generate a video from.
    /// "A dog running in a field."
    pub prompt: String,
    /// The seed to use for generating the video.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MochiT2VOutput {
    /// The generated video
    /// {"url":"https://fal.media/files/zebra/GScPi-7ma3Fn8r1O1on4z_output_1729631871.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// Mochi 1
///
/// Category: text-to-video
/// Machine Type: A100
pub fn mochi_v1(params: MochiT2VInput) -> FalRequest<MochiT2VInput, MochiT2VOutput> {
    FalRequest::new("fal-ai/mochi-v1", params)
}
