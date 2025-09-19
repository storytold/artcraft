#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct BoundingBox {
    /// Height of the bounding box
    pub h: f64,
    /// Label of the bounding box
    pub label: String,
    /// Width of the bounding box
    pub w: f64,
    /// X-coordinate of the top-left corner
    pub x: f64,
    /// Y-coordinate of the top-left corner
    pub y: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BoundingBoxOutputWithLabels {
    /// Processed image
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image: Option<Option<Image>>,
    /// Results from the model
    pub results: BoundingBoxes,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct BoundingBoxes {
    /// List of bounding boxes
    pub bboxes: Vec<BoundingBox>,
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
pub struct ImageInput {
    /// The URL of the image to be processed.
    /// "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/transformers/tasks/car.jpg"
    /// "http://ecx.images-amazon.com/images/I/51UUzBDAMsL.jpg"
    pub image_url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ImageWithTextInput {
    /// The URL of the image to be processed.
    /// "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/transformers/tasks/car.jpg"
    /// "http://ecx.images-amazon.com/images/I/51UUzBDAMsL.jpg"
    pub image_url: String,
    /// Text input for the task
    pub text_input: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ImageWithUserCoordinatesInput {
    /// The URL of the image to be processed.
    /// "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/transformers/tasks/car.jpg"
    /// "http://ecx.images-amazon.com/images/I/51UUzBDAMsL.jpg"
    pub image_url: String,
    /// The user input coordinates
    /// {"x1":100,"x2":200,"y1":100,"y2":200}
    pub region: Region,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct OCRBoundingBox {
    /// List of quadrilateral boxes
    pub quad_boxes: Vec<OCRBoundingBoxSingle>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct OCRBoundingBoxOutputWithLabels {
    /// Processed image
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image: Option<Option<Image>>,
    /// Results from the model
    pub results: OCRBoundingBox,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct OCRBoundingBoxSingle {
    /// Height of the bounding box
    pub h: f64,
    /// Label of the bounding box
    pub label: String,
    /// Width of the bounding box
    pub w: f64,
    /// X-coordinate of the top-left corner
    pub x: f64,
    /// Y-coordinate of the top-left corner
    pub y: f64,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Polygon {
    /// Label of the polygon
    pub label: String,
    /// List of points
    pub points: Vec<HashMap<String, serde_json::Value>>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct PolygonOutput {
    /// List of polygons
    pub polygons: Vec<Polygon>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct PolygonOutputWithLabels {
    /// Processed image
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image: Option<Option<Image>>,
    /// Results from the model
    pub results: PolygonOutput,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Region {
    /// X-coordinate of the top-left corner
    pub x1: i64,
    /// X-coordinate of the bottom-right corner
    pub x2: i64,
    /// Y-coordinate of the top-left corner
    pub y1: i64,
    /// Y-coordinate of the bottom-right corner
    pub y2: i64,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TextOutput {
    /// Results from the model
    pub results: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// Florence-2 Large
///
/// Category: vision
/// Machine Type: A100
/// License Type: commercial
pub fn object_detection(params: ImageInput) -> FalRequest<ImageInput, BoundingBoxOutputWithLabels> {
    FalRequest::new("fal-ai/florence-2-large/object-detection", params)
}
