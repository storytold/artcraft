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
pub struct Image {
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
    /// The height of the image in pixels.
    /// 1024
    #[serde(skip_serializing_if = "Option::is_none")]
    pub height: Option<i64>,
    /// The URL where the file can be downloaded from.
    pub url: String,
    /// The width of the image in pixels.
    /// 1024
    #[serde(skip_serializing_if = "Option::is_none")]
    pub width: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Input {
    /// URL of the image to upscale.
    /// "https://fal.media/files/rabbit/JlBgYUyQRS3zxiBu_B4fM.png"
    /// "https://fal.media/files/monkey/e6RtJf_ue0vyWzeiEmTby.png"
    /// "https://fal.media/files/monkey/A6HGsigx4mmvs-hJVoOZX.png"
    pub image_url: String,
    /// Upscaling factor.
    /// 4
    #[serde(skip_serializing_if = "Option::is_none")]
    pub upscaling_factor: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Output {
    /// Upscaled image
    pub image: Image,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// DRCT-Super-Resolution
///
/// Category: image-to-image
/// Machine Type: A100
pub fn drct_super_resolution(params: Input) -> FalRequest<Input, Output> {
    FalRequest::new("fal-ai/drct-super-resolution", params)
}
