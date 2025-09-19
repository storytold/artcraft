#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct FlowEditInput {
    /// URL of image to be used for relighting
    /// "https://storage.googleapis.com/falserverless/model_tests/FlowEdit/lighthouse.png"
    pub image_url: String,
    /// Average step count
    #[serde(skip_serializing_if = "Option::is_none")]
    pub n_avg: Option<i64>,
    /// Control the strength of the edit
    #[serde(skip_serializing_if = "Option::is_none")]
    pub n_max: Option<i64>,
    /// Minimum step for improved style edits
    #[serde(skip_serializing_if = "Option::is_none")]
    pub n_min: Option<i64>,
    /// Steps for which the model should run.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// Random seed for reproducible generation. If set none, a random seed will be used.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// Prompt of the image to be used.
    /// "The image features a tall white lighthouse standing prominently\n      on a hill, with a beautiful blue sky in the background. The lighthouse is illuminated\n      by a bright light, making it a prominent landmark in the scene."
    pub source_prompt: String,
    /// Guidance scale for the source.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub src_guidance_scale: Option<i64>,
    /// Guidance scale for target.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tar_guidance_scale: Option<i64>,
    /// Prompt of the image to be made.
    /// "The image features Big ben clock tower standing prominently\n      on a hill, with a beautiful blue sky in the background. The Big ben clock tower is illuminated\n      by a bright light, making it a prominent landmark in the scene."
    pub target_prompt: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FlowEditOutput {
    /// The generated image file info.
    /// {"content_type":"image/png","file_name":"36d3ca4791a647678b2ff01a35c87f5a.png","file_size":423052,"height":1024,"url":"https://storage.googleapis.com/falserverless/model_tests/FlowEdit/aa5c3d028ad04800a54f70f928198d91.png","width":1024}
    pub image: Image,
    /// Seed of the generated Image. It will be the same value of the one passed in the
    /// input or the randomly generated that was used in case none was passed.
    pub seed: i64,
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
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// Flow-Edit
///
/// Category: text-to-image
/// Machine Type: A6000
pub fn flowedit(params: FlowEditInput) -> FalRequest<FlowEditInput, FlowEditOutput> {
    FalRequest::new("fal-ai/flowedit", params)
}
