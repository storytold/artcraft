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
pub struct InputModel {
    /// Camera direction
    #[serde(skip_serializing_if = "Option::is_none")]
    pub camera_direction: Option<String>,
    /// Camera movement style
    #[serde(skip_serializing_if = "Option::is_none")]
    pub camera_style: Option<String>,
    /// Custom technical elements (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub custom_elements: Option<String>,
    /// URL of an image to analyze and incorporate into the video prompt (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_url: Option<String>,
    /// Core concept or thematic input for the video prompt
    /// "A futuristic city at dusk"
    pub input_concept: String,
    /// Model to use
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
    /// Pacing rhythm
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pacing: Option<String>,
    /// Length of the prompt
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt_length: Option<String>,
    /// Special effects approach
    #[serde(skip_serializing_if = "Option::is_none")]
    pub special_effects: Option<String>,
    /// Style of the video prompt
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OutputModel {
    /// Generated video prompt
    /// "A futuristic city glows softly at dusk, captured with smooth gimbal movements and a slow burn pacing, enhanced by subtle holographic overlays."
    pub prompt: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// Video Prompt Generator
///
/// Category: llm
pub fn video_prompt_generator(params: InputModel) -> FalRequest<InputModel, OutputModel> {
    FalRequest::new("fal-ai/video-prompt-generator", params)
}
