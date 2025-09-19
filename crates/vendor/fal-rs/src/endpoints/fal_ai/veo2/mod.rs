#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[cfg(any(
    feature = "endpoints",
    feature = "endpoints_fal-ai",
    feature = "endpoints_fal-ai_veo2"
))]
#[cfg_attr(
    docsrs,
    doc(cfg(any(
        feature = "endpoints",
        feature = "endpoints_fal-ai",
        feature = "endpoints_fal-ai_veo2"
    )))
)]
pub mod image_to_video;

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
pub struct ImageToVideoInput {
    /// The aspect ratio of the generated video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    /// The duration of the generated video in seconds
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<String>,
    /// URL of the input image to animate. Should be 720p or higher resolution.
    /// "https://fal.media/files/elephant/6fq8JDSjb1osE_c3J_F2H.png"
    pub image_url: String,
    /// The text prompt describing how the image should be animated
    /// "A lego chef cooking eggs"
    pub prompt: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ImageToVideoOutput {
    /// The generated video
    /// {"url":"https://v3.fal.media/files/zebra/uNu-1qkbNt8be8iHA1hiB_output.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TextToVideoInput {
    /// The aspect ratio of the generated video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    /// The duration of the generated video in seconds
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<String>,
    /// The text prompt describing the video you want to generate
    /// "The camera floats gently through rows of pastel-painted wooden beehives, buzzing honeybees gliding in and out of frame. The motion settles on the refined farmer standing at the center, his pristine white beekeeping suit gleaming in the golden afternoon light. He lifts a jar of honey, tilting it slightly to catch the light. Behind him, tall sunflowers sway rhythmically in the breeze, their petals glowing in the warm sunlight. The camera tilts upward to reveal a retro farmhouse with mint-green shutters, its walls dappled with shadows from swaying trees. Shot with a 35mm lens on Kodak Portra 400 film, the golden light creates rich textures on the farmer's gloves, marmalade jar, and weathered wood of the beehives."
    pub prompt: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TextToVideoOutput {
    /// The generated video
    /// {"url":"https://v3.fal.media/files/tiger/83-YzufmOlsnhqq5ed382_output.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// Veo 2 (Image to Video)
///
/// Category: image-to-video
///
///
///
/// Generate videos using Google's [Veo 2 text-to-video model](https://blog.google/technology/google-labs/video-image-generation-update-december-2024/).
///
/// For best results, prompts should be descriptive and clear. Include:
/// - Subject: What you want in the video (object, person, animal, scenery)
/// - Context: The background/setting
/// - Action: What the subject is doing
/// - Style: Film style keywords (horror, noir, cartoon etc.)
/// - Camera motion (optional): aerial view, tracking shot etc.
/// - Composition (optional): wide shot, close-up etc.
/// - Ambiance (optional): Color and lighting details
///
/// More details are available in our [prompting guide](https://blog.fal.ai/mastering-video-generation-with-veo-2-a-comprehensive-guide/).
///
/// The model supports:
/// - 720p resolution videos
/// - 5-8 second duration at 24 FPS
/// - Both 16:9 (landscape) and 9:16 (portrait) aspect ratios
///
/// Safety filters prevent generation of inappropriate content.
pub fn veo2(params: TextToVideoInput) -> FalRequest<TextToVideoInput, TextToVideoOutput> {
    FalRequest::new("fal-ai/veo2", params)
}
