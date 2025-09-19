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
    pub content_type: Option<ContentTypeProperty>,
    /// The name of the file. It will be auto-generated if not provided.
    /// "z9RV14K95DvU.png"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_name: Option<FileNameProperty>,
    /// The size of the file in bytes.
    /// 4404019
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_size: Option<FileSizeProperty>,
    /// The height of the image in pixels.
    /// 1024
    #[serde(skip_serializing_if = "Option::is_none")]
    pub height: Option<HeightProperty>,
    /// The URL where the file can be downloaded from.
    pub url: String,
    /// The width of the image in pixels.
    /// 1024
    #[serde(skip_serializing_if = "Option::is_none")]
    pub width: Option<WidthProperty>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct UpscaleInput {
    /// Upscaling a face
    #[serde(skip_serializing_if = "Option::is_none")]
    pub face: Option<bool>,
    /// Url to input image
    /// "https://storage.googleapis.com/falserverless/model_tests/remove_background/elephant.jpg"
    /// "https://storage.googleapis.com/falserverless/gallery/blue-bird.jpeg"
    /// "https://storage.googleapis.com/falserverless/model_tests/upscale/image%20(8).png"
    pub image_url: String,
    /// Model to use for upscaling
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
    /// Output image format (png or jpeg)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_format: Option<String>,
    /// Rescaling factor
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scale: Option<f64>,
    /// Tile size. Default is 0, that is no tile. When encountering the out-of-GPU-memory issue, please specify it, e.g., 400 or 200
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tile: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpscaleOutput {
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

#[derive(Debug, Serialize, Deserialize, smart_default::SmartDefault)]
#[allow(non_camel_case_types)]
pub enum ContentTypeProperty {
    #[default]
    String(String),
    Null(serde_json::Value),
}

#[derive(Debug, Serialize, Deserialize, smart_default::SmartDefault)]
#[allow(non_camel_case_types)]
pub enum FileNameProperty {
    #[default]
    String(String),
    Null(serde_json::Value),
}

#[derive(Debug, Serialize, Deserialize, smart_default::SmartDefault)]
#[allow(non_camel_case_types)]
pub enum FileSizeProperty {
    #[default]
    Integer(i64),
    Null(serde_json::Value),
}

#[derive(Debug, Serialize, Deserialize, smart_default::SmartDefault)]
#[allow(non_camel_case_types)]
pub enum HeightProperty {
    #[default]
    Integer(i64),
    Null(serde_json::Value),
}

#[derive(Debug, Serialize, Deserialize, smart_default::SmartDefault)]
#[allow(non_camel_case_types)]
pub enum WidthProperty {
    #[default]
    Integer(i64),
    Null(serde_json::Value),
}

/// Upscale Images
///
/// Category: image-to-image
/// Machine Type: A6000
pub fn esrgan(params: UpscaleInput) -> FalRequest<UpscaleInput, UpscaleOutput> {
    FalRequest::new("fal-ai/esrgan", params)
}
