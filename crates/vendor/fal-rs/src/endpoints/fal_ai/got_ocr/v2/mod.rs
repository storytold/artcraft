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

#[derive(Debug, Serialize, Deserialize)]
pub struct ImageChatOutput {
    /// Generated output
    pub outputs: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ImageInput {
    /// Generate the output in formatted mode.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub do_format: Option<bool>,
    /// URL of images.

    #[serde(skip_serializing_if = "Option::is_none")]
    pub input_image_urls: Option<Vec<Option<String>>>,
    /// Use provided images to generate a single output.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub multi_page: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// GOT OCR 2.0
///
/// Category: vision
/// Machine Type: A100
pub fn v2(params: ImageInput) -> FalRequest<ImageInput, ImageChatOutput> {
    FalRequest::new("fal-ai/got-ocr/v2", params)
}
