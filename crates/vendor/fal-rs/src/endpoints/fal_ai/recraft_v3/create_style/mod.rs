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
pub struct ImageSize {
    /// The height of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub height: Option<i64>,
    /// The width of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub width: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct RGBColor {
    /// Blue color value
    #[serde(skip_serializing_if = "Option::is_none")]
    pub b: Option<i64>,
    /// Green color value
    #[serde(skip_serializing_if = "Option::is_none")]
    pub g: Option<i64>,
    /// Red color value
    #[serde(skip_serializing_if = "Option::is_none")]
    pub r: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct StyleReferenceInput {
    /// The base style of the generated images, this topic is covered above.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base_style: Option<String>,
    /// URL to zip archive with images, use PNG format. Maximum 5 images are allowed.
    pub images_data_url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StyleReferenceOutput {
    /// The ID of the created style, this ID can be used to reference the style in the future.
    pub style_id: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TextToImageInput {
    /// An array of preferable colors
    #[serde(skip_serializing_if = "Option::is_none")]
    pub colors: Option<Vec<Option<RGBColor>>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_size: Option<ImageSizeProperty>,
    pub prompt: String,
    /// The style of the generated images. Vector images cost 2X as much.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style: Option<String>,
    /// The ID of the custom style reference (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TextToImageOutput {
    pub images: Vec<File>,
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
pub enum ImageSizeProperty {
    #[default]
    ImageSize(ImageSize),
    #[serde(rename = "square_hd")]
    SquareHd,
    #[serde(rename = "square")]
    Square,
    #[serde(rename = "portrait_4_3")]
    Portrait43,
    #[serde(rename = "portrait_16_9")]
    Portrait169,
    #[serde(rename = "landscape_4_3")]
    Landscape43,
    #[serde(rename = "landscape_16_9")]
    Landscape169,
}

/// Recraft V3
///
/// Category: text-to-image
/// Machine Type: A100
/// License Type: commercial
pub fn create_style(
    params: StyleReferenceInput,
) -> FalRequest<StyleReferenceInput, StyleReferenceOutput> {
    FalRequest::new("fal-ai/recraft-v3/create-style", params)
}
