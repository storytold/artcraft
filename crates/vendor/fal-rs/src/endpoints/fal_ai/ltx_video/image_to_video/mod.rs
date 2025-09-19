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
pub struct ImageToVideoInput {
    /// The guidance scale to use.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The URL of the image to generate the video from.
    /// "https://fal.media/files/kangaroo/4OePu2ifG7SKxTM__TQrQ_72929fec9fb74790bb8c8b760450c9b9.jpg"
    pub image_url: String,
    /// The negative prompt to generate the video from.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// The number of inference steps to take.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The prompt to generate the video from.
    /// "A lone astronaut in a white spacesuit with gold-tinted visor drifts weightlessly through a sleek, cylindrical corridor of a spaceship. Their movements are slow and graceful as they gently push off the metallic walls with their gloved hands, rotating slightly as they float from right to left across the frame. The corridor features brushed aluminum panels with blue LED strips running along the ceiling, casting a cool glow on the astronaut's suit. Various cables, pipes, and control panels line the walls. The camera follows the astronaut's movement in a handheld style, slightly swaying and adjusting focus, maintaining a medium shot that captures both the astronaut and the corridor's depth. Small particles of dust catch the light as they float in the zero-gravity environment. The scene appears cinematic, with lens flares occasionally reflecting off the metallic surfaces and the astronaut's visor."
    pub prompt: String,
    /// The seed to use for random number generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Output {
    /// The seed used for random number generation.
    pub seed: i64,
    /// The generated video.
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TextToVideoInput {
    /// The guidance scale to use.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guidance_scale: Option<f64>,
    /// The negative prompt to generate the video from.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// The number of inference steps to take.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The prompt to generate the video from.
    /// "A man stands waist-deep in a crystal-clear mountain pool, his back turned to a massive, thundering waterfall that cascades down jagged cliffs behind him. He wears a dark blue swimming shorts and his muscular back glistens with water droplets. The camera moves in a dynamic circular motion around him, starting from his right side and sweeping left, maintaining a slightly low angle that emphasizes the towering height of the waterfall. As the camera moves, the man slowly turns his head to follow its movement, his expression one of awe as he gazes up at the natural wonder. The waterfall creates a misty atmosphere, with sunlight filtering through the spray to create rainbow refractions. The water churns and ripples around him, reflecting the dramatic landscape. The handheld camera movement adds a subtle shake that enhances the raw, untamed energy of the scene. The lighting is natural and bright, with the sun positioned behind the waterfall, creating a backlit effect that silhouettes the falling water and illuminates the mist."
    pub prompt: String,
    /// The seed to use for random number generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// LTX Video (preview)
///
/// Category: text-to-video
/// Machine Type: H100
/// License Type: research
///
/// LTX Video - Image to Video generation
///
/// See examples for more inspiration. Use the `image_url` parameter to provide an image to generate the video from. Make sure it is 768x512.
///
/// ### Instructions
/// When writing prompts, focus on detailed, chronological descriptions of actions and scenes. Include specific movements,
/// appearances, camera angles, and environmental details - all in a single flowing paragraph. Start directly with the action,
/// and keep descriptions literal and precise. Think like a cinematographer describing a shot list. Keep within 200 words. For
/// best results, build your prompts using this structure:
/// * Start with main action in a single sentence
/// * Add specific details about movements and gestures
/// * Describe character/object appearances precisely
/// * Include background and environment details
/// * Specify camera angles and movements
/// * Describe lighting and colors
/// * Note any changes or sudden events
///
/// ### Parameter Guide
/// * Guidance Scale: Higher values (5-7) for accurate prompt following, lower values (3-5) for more creative freedom
/// * Inference Steps: More steps (40+) for quality, fewer steps (20-30) for speed
pub fn image_to_video(params: ImageToVideoInput) -> FalRequest<ImageToVideoInput, Output> {
    FalRequest::new("fal-ai/ltx-video/image-to-video", params)
}
