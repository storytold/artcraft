#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct CaptionInput {
    /// Size of text in generated captions.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub font_size: Option<i64>,
    /// Left-to-right alignment of the text. Can be a string ('left', 'center', 'right') or a float (0.0-1.0)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub left_align: Option<LeftAlignProperty>,
    /// Number of seconds the captions should stay on screen. A higher number will also result in more text being displayed at once.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub refresh_interval: Option<f64>,
    /// Width of the text strokes in pixels
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stroke_width: Option<i64>,
    /// Top-to-bottom alignment of the text. Can be a string ('top', 'center', 'bottom') or a float (0.0-1.0)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub top_align: Option<TopAlignProperty>,
    /// Colour of the text. Can be a RGB tuple, a color name, or an hexadecimal notation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub txt_color: Option<String>,
    /// Font for generated captions. Choose one in 'Arial','Standard','Garamond', 'Times New Roman','Georgia', or pass a url to a .ttf file
    #[serde(skip_serializing_if = "Option::is_none")]
    pub txt_font: Option<String>,
    /// URL to the .mp4 video with audio. Only videos of size <100MB are allowed.
    pub video_url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct HTTPValidationError {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<Vec<Option<ValidationError>>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Output {
    /// URL to the caption .mp4 video.
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
pub enum LeftAlignProperty {
    #[default]
    String(String),
    Number(f64),
}

#[derive(Debug, Serialize, Deserialize, smart_default::SmartDefault)]
#[allow(non_camel_case_types)]
pub enum TopAlignProperty {
    #[default]
    String(String),
    Number(f64),
}

/// Auto-Captioner
///
/// Category: video-to-video
pub fn auto_caption(params: CaptionInput) -> FalRequest<CaptionInput, Output> {
    FalRequest::new("fal-ai/auto-caption", params)
}
