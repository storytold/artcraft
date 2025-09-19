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

#[derive(Debug, Serialize, Deserialize)]
pub struct TryOnOutput {
    /// The output image.
    /// {"content_type":"image/png","file_name":"result.png","file_size":595094,"height":1024,"url":"https://v3.fal.media/files/panda/Hoy3zhimzVKi3F2uoGBnh_result.png","width":768}
    pub image: Image,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TryOnRequest {
    /// Url to the garment image.
    /// "https://storage.googleapis.com/falserverless/model_tests/leffa/tshirt_image.jpg"
    pub garment_image_url: String,
    /// Url for the human image.
    /// "https://storage.googleapis.com/falserverless/model_tests/leffa/person_image.jpg"
    pub human_image_url: String,
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

/// Kling Kolors Virtual TryOn v1.5
///
/// Category: image-to-image
/// Machine Type: A100
/// License Type: commercial
///
/// Kling Kolors Virtual Try-On
pub fn kolors_virtual_try_on(params: TryOnRequest) -> FalRequest<TryOnRequest, TryOnOutput> {
    FalRequest::new("fal-ai/kling/v1-5/kolors-virtual-try-on", params)
}
