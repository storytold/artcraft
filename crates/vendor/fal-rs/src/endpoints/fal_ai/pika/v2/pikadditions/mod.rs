#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct CollectionToVideoOutput {
    /// The generated video
    /// {"url":"https://v3.fal.media/files/zebra/z5PDhXAkkIaiRlXARpOeY_output.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct CollectionToVideoRequest {
    /// The aspect ratio of the generated video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    /// The duration of the generated video in seconds
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<i64>,
    /// List of images to use for video generation
    /// [{"image_url":"https://fal.media/files/panda/dfbC7oH6IASN3LFOfZ9VV.jpeg"}]
    pub images: Vec<PikaImage>,
    /// Mode for integrating multiple images
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ingredients_mode: Option<String>,
    /// A negative prompt to guide the model
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    pub prompt: String,
    /// The resolution of the generated video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resolution: Option<String>,
    /// The seed for the random number generator
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
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
pub struct ImageToVideoOutput {
    /// The generated video
    /// {"url":"https://v3.fal.media/files/zebra/nQRJbbJ_p_a9zCnyJaTbg_output.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ImageToVideoRequest {
    /// The duration of the generated video in seconds
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<i64>,
    /// URL of the image to use as the first frame
    /// "https://v3.fal.media/files/elephant/dJjBQXNHRbGJn4aUv4-g9_hearth.jpg"
    pub image_url: String,
    /// A negative prompt to guide the model
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    pub prompt: String,
    /// The resolution of the generated video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resolution: Option<String>,
    /// The seed for the random number generator
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Pika22ImageToVideoOutput {
    /// The generated video
    /// {"url":"https://storage.googleapis.com/falserverless/web-examples/pika/pika%202.2/pika22_output.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Pika22ImageToVideoRequest {
    /// The duration of the generated video in seconds
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<i64>,
    /// URL of the image to use as the first frame
    /// "https://storage.googleapis.com/falserverless/web-examples/pika/pika%202.2/pika_input.png"
    pub image_url: String,
    /// A negative prompt to guide the model
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    pub prompt: String,
    /// The resolution of the generated video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resolution: Option<String>,
    /// The seed for the random number generator
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Pika22TextToVideoOutput {
    /// The generated video
    /// {"url":"https://storage.googleapis.com/falserverless/web-examples/pika/pika%202.2/text-to-video-output.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Pika22TextToVideoRequest {
    /// The aspect ratio of the generated video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    /// The duration of the generated video in seconds
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<i64>,
    /// A negative prompt to guide the model
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    pub prompt: String,
    /// The resolution of the generated video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resolution: Option<String>,
    /// The seed for the random number generator
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct PikaImage {
    pub image_url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PikadditionsOutput {
    /// The generated video with added objects/images
    /// {"url":"https://v3.fal.media/files/lion/sbM48rVVi7y0yh5EuMtoC_output.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct PikadditionsRequest {
    /// URL of the image to add
    /// "https://fal.media/files/zebra/V3_Kpw_eqbVoOAIpNKb3Z_c0f2425a9d224d8b9b8d9b800612b782.jpg"
    pub image_url: String,
    /// Negative prompt to guide the model
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// Text prompt describing what to add
    /// "A parrot in the shoulder of the person picking up cookies"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt: Option<String>,
    /// The seed for the random number generator
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// URL of the input video
    /// "https://v3.fal.media/files/monkey/vXi5n_oq0Qpnbs7Eb2k-b_output.mp4"
    pub video_url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct PikaffectsOutput {
    /// The generated video with applied effect
    /// {"url":"https://v3.fal.media/files/panda/9_LHZlRfLunxkX1ENiiBM_output.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct PikaffectsRequest {
    /// URL of the input image
    /// "https://fal.media/files/zebra/2Ro7MtV3BGarwQXPtdK6B_148325d4459c4e34917e8eb5c25877d4.jpg"
    pub image_url: String,
    /// Negative prompt to guide the model
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// The Pikaffect to apply
    /// "Crush"
    pub pikaffect: String,
    /// Text prompt to guide the effect
    /// "A duck getting crushed"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt: Option<String>,
    /// The seed for the random number generator
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct PikaswapsOutput {
    /// The generated video with swapped regions
    /// {"url":"https://v3.fal.media/files/koala/fGsPStNbAYW55sfinbDEL_output.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct PikaswapsRequest {
    /// URL of the image to swap with
    /// "https://fal.media/files/lion/2-ckrSp9r067aApfxXIrh_80a8a57bec50432e9918c87ae35004ed.jpg"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_url: Option<String>,
    /// Plaintext description of the object/region to modify
    /// "the cookie jars"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub modify_region: Option<String>,
    /// Negative prompt to guide the model
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    /// Text prompt describing the modification
    /// "Replace the background with a jelly jar"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt: Option<String>,
    /// The seed for the random number generator
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// URL of the input video
    /// "https://v3.fal.media/files/monkey/vXi5n_oq0Qpnbs7Eb2k-b_output.mp4"
    pub video_url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TextToVideoOutput {
    /// The generated video
    /// {"url":"https://v3.fal.media/files/panda/eLhWXM2p3aJzXg7t_0F0D_output.mp4"}
    pub video: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TextToVideoRequest {
    /// The aspect ratio of the generated video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    /// The duration of the generated video in seconds
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<i64>,
    /// A negative prompt to guide the model
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    pub prompt: String,
    /// The resolution of the generated video
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resolution: Option<String>,
    /// The seed for the random number generator
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

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct VideoOutput {
    /// The generated video
    /// {"url":"https://v3.fal.media/files/zebra/nQRJbbJ_p_a9zCnyJaTbg_output.mp4"}
    pub video: File,
}

/// Pika Effects (v1.5)
///
/// Category: image-to-video
///
///
///
/// Pika Pikadditions Generation.
///
/// Add any object or image into your video. Upload a video and specify what
/// you'd like to add to create a seamlessly integrated result.
pub fn pikadditions(
    params: PikadditionsRequest,
) -> FalRequest<PikadditionsRequest, PikadditionsOutput> {
    FalRequest::new("fal-ai/pika/v2/pikadditions", params)
}
