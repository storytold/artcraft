#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct BatchedMoondreamInput {
    /// List of input prompts and image URLs
    /// [{"image_url":"https://github.com/vikhyat/moondream/raw/main/assets/demo-1.jpg","prompt":"What is the girl doing?"}]
    pub inputs: Vec<MoondreamInputParam>,
    /// Maximum number of new tokens to generate
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_tokens: Option<i64>,
    /// Model ID to use for inference
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model_id: Option<String>,
    /// Repetition penalty for sampling
    #[serde(skip_serializing_if = "Option::is_none")]
    pub repetition_penalty: Option<f64>,
    /// Temperature for sampling
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temperature: Option<f64>,
    /// Top P for sampling
    #[serde(skip_serializing_if = "Option::is_none")]
    pub top_p: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BatchedMoondreamOutput {
    /// Filenames of the images processed
    #[serde(skip_serializing_if = "Option::is_none")]
    pub filenames: Option<Vec<Option<String>>>,
    /// List of generated outputs
    pub outputs: Vec<String>,
    /// Whether the output is partial
    #[serde(skip_serializing_if = "Option::is_none")]
    pub partial: Option<bool>,
    /// Timings for different parts of the process
    pub timings: Timings,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct HTTPValidationError {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<Vec<Option<ValidationError>>>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct MoondreamInputParam {
    /// URL of the image to be processed
    /// "https://llava-vl.github.io/static/images/monalisa.jpg"
    pub image_url: String,
    /// Prompt to be used for the image
    /// "Do you know who drew this painting?"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt: Option<String>,
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

/// Moondream
///
/// Category: vision
/// Machine Type: A6000
pub fn batched(
    params: BatchedMoondreamInput,
) -> FalRequest<BatchedMoondreamInput, BatchedMoondreamOutput> {
    FalRequest::new("fal-ai/moondream/batched", params)
}
