#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct GeminiImageOutput {
    /// Text description or response from Gemini
    pub description: String,
    /// The generated or edited image
    pub image: Image,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct GeminiImageRequest {
    /// Optional URL of an input image for editing. If not provided, generates a new image.
    /// "https://storage.googleapis.com/falserverless/web-examples/gemini-edit/input.png"
    pub image_url: String,
    /// The prompt for image generation or editing
    /// "Make the car black"
    pub prompt: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct GeminiMultiImageRequest {
    /// List of URLs of input images for editing
    /// ["https://storage.googleapis.com/falserverless/web-examples/gemini-edit/input.png"]
    pub input_image_urls: Vec<String>,
    /// The prompt for image generation or editing
    /// "Make the car black"
    pub prompt: String,
}

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

/// Gemini Flash Edit
///
/// Category: image-to-image
///
///
///
/// Generate or edit images using Gemini with multiple input images
pub fn multi(
    params: GeminiMultiImageRequest,
) -> FalRequest<GeminiMultiImageRequest, GeminiImageOutput> {
    FalRequest::new("fal-ai/gemini-flash-edit/multi", params)
}
