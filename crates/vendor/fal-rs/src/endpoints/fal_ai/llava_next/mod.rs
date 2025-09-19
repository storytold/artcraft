#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct HTTPValidationError {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<Vec<Option<ValidationError>>>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct LLavaInput {
    /// URL of the image to be processed
    /// "https://llava-vl.github.io/static/images/monalisa.jpg"
    pub image_url: String,
    /// Maximum number of tokens to generate
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_tokens: Option<i64>,
    /// Prompt to be used for the image
    /// "Do you know who drew this painting?"
    pub prompt: String,
    /// Temperature for sampling
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temperature: Option<f64>,
    /// Top P for sampling
    #[serde(skip_serializing_if = "Option::is_none")]
    pub top_p: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LLavaOutput {
    /// Generated output
    /// "Leonardo da Vinci"
    pub output: String,
    /// Whether the output is partial
    #[serde(skip_serializing_if = "Option::is_none")]
    pub partial: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// LLaVA v1.6 34B
///
/// Category: vision
/// Machine Type: A100
/// License Type: research
pub fn llava_next(params: LLavaInput) -> FalRequest<LLavaInput, LLavaOutput> {
    FalRequest::new("fal-ai/llava-next", params)
}
