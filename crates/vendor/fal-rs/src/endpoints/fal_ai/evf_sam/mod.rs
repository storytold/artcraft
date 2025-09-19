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
pub struct ImageInput {
    /// Apply Gaussian blur to the mask. Value determines kernel size (must be odd number)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub blur_mask: Option<i64>,
    /// Expand/dilate the mask by specified pixels
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expand_mask: Option<i64>,
    /// Fill holes in the mask using morphological operations
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fill_holes: Option<bool>,
    /// URL of the input image
    /// "https://storage.googleapis.com/falserverless/web-examples/evf-sam2/evfsam2-cat.png"
    pub image_url: String,
    /// Output only the binary mask instead of masked image
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mask_only: Option<bool>,
    /// Areas to exclude from segmentation (will be subtracted from prompt results)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// The prompt to generate segmentation from.
    /// "Cat in the middle of the image"
    pub prompt: String,
    /// Invert the mask (background becomes foreground and vice versa)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub revert_mask: Option<bool>,
    /// Enable semantic level segmentation for body parts, background or multi objects
    #[serde(skip_serializing_if = "Option::is_none")]
    pub semantic_type: Option<bool>,
    /// Use GroundingDINO instead of SAM for segmentation
    #[serde(skip_serializing_if = "Option::is_none")]
    pub use_grounding_dino: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImageOutput {
    /// The segmented output image
    pub image: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// EVF-SAM2 Segmentation
///
/// Category: image-to-image
pub fn evf_sam(params: ImageInput) -> FalRequest<ImageInput, ImageOutput> {
    FalRequest::new("fal-ai/evf-sam", params)
}
