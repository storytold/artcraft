#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct BoxPrompt {
    /// The frame index to interact with.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub frame_index: Option<i64>,
    /// X Max Coordinate of the prompt
    #[serde(skip_serializing_if = "Option::is_none")]
    pub x_max: Option<i64>,
    /// X Min Coordinate of the box
    #[serde(skip_serializing_if = "Option::is_none")]
    pub x_min: Option<i64>,
    /// Y Max Coordinate of the prompt
    #[serde(skip_serializing_if = "Option::is_none")]
    pub y_max: Option<i64>,
    /// Y Min Coordinate of the box
    #[serde(skip_serializing_if = "Option::is_none")]
    pub y_min: Option<i64>,
}

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
pub struct PointPrompt {
    /// The frame index to interact with.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub frame_index: Option<i64>,
    /// Label of the prompt. 1 for foreground, 0 for background
    #[serde(skip_serializing_if = "Option::is_none")]
    pub label: Option<i64>,
    /// X Coordinate of the prompt
    #[serde(skip_serializing_if = "Option::is_none")]
    pub x: Option<i64>,
    /// Y Coordinate of the prompt
    #[serde(skip_serializing_if = "Option::is_none")]
    pub y: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct SAM2AutomaticSegmentationInput {
    /// URL of the image to be automatically segmented
    /// "https://raw.githubusercontent.com/facebookresearch/segment-anything-2/main/notebooks/images/truck.jpg"
    pub image_url: String,
    /// Minimum area of a mask region.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub min_mask_region_area: Option<i64>,
    /// The format of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_format: Option<String>,
    /// Number of points to sample along each side of the image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub points_per_side: Option<i64>,
    /// Threshold for predicted IOU score.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pred_iou_thresh: Option<f64>,
    /// Threshold for stability score.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stability_score_thresh: Option<f64>,
    /// If set to true, the function will wait for the image to be generated and uploaded
    /// before returning the response. This will increase the latency of the function but
    /// it allows you to get the image directly in the response without going through the CDN.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync_mode: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SAM2AutomaticSegmentationOutput {
    /// Combined segmentation mask.
    pub combined_mask: Image,
    /// Individual segmentation masks.
    pub individual_masks: Vec<Image>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct SAM2ImageInput {
    /// Coordinates for boxes
    /// [{"x_max":700,"x_min":425,"y_max":875,"y_min":600}]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub box_prompts: Option<Vec<Option<BoxPrompt>>>,
    /// URL of the image to be segmented
    /// "https://raw.githubusercontent.com/facebookresearch/segment-anything-2/main/notebooks/images/truck.jpg"
    pub image_url: String,
    /// The format of the generated image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_format: Option<String>,
    /// List of prompts to segment the image
    /// [{"label":1,"x":500,"y":375}]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompts: Option<Vec<Option<PointPrompt>>>,
    /// If set to true, the function will wait for the image to be generated and uploaded
    /// before returning the response. This will increase the latency of the function but
    /// it allows you to get the image directly in the response without going through the CDN.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sync_mode: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct SAM2ImageOutput {
    /// Segmented image.
    pub image: Image,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct SAM2RLEOutput {
    /// Run Length Encoding of the mask.
    pub rle: RleProperty,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct SAM2VideoOutput {
    /// The segmented video.
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct SAM2VideoRLEInput {
    /// Apply the mask on the video.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub apply_mask: Option<bool>,
    /// Coordinates for boxes
    /// [{"frame_index":0,"x_max":500,"x_min":300,"y_max":400,"y_min":0}]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub box_prompts: Option<Vec<Option<BoxPrompt>>>,
    /// The URL of the mask to be applied initially.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mask_url: Option<String>,
    /// List of prompts to segment the video
    /// [{"frame_index":0,"label":1,"x":210,"y":350},{"frame_index":0,"label":1,"x":250,"y":220}]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompts: Option<Vec<Option<PointPrompt>>>,
    /// The URL of the video to be segmented.
    /// "https://drive.google.com/uc?id=1iOFYbNITYwrebBBp9kaEGhBndFSRLz8k"
    pub video_url: String,
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
pub enum RleProperty {
    #[default]
    String(String),
    Array(Vec<String>),
}

/// Segment Anything Model 2
///
/// Category: image-to-image
/// Machine Type: A100
pub fn auto_segment(
    params: SAM2AutomaticSegmentationInput,
) -> FalRequest<SAM2AutomaticSegmentationInput, SAM2AutomaticSegmentationOutput> {
    FalRequest::new("fal-ai/sam2/auto-segment", params)
}
