#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[cfg(any(
    feature = "endpoints",
    feature = "endpoints_fal-ai",
    feature = "endpoints_fal-ai_ideogram"
))]
#[cfg_attr(
    docsrs,
    doc(cfg(any(
        feature = "endpoints",
        feature = "endpoints_fal-ai",
        feature = "endpoints_fal-ai_ideogram"
    )))
)]
pub mod edit;
#[cfg(any(
    feature = "endpoints",
    feature = "endpoints_fal-ai",
    feature = "endpoints_fal-ai_ideogram"
))]
#[cfg_attr(
    docsrs,
    doc(cfg(any(
        feature = "endpoints",
        feature = "endpoints_fal-ai",
        feature = "endpoints_fal-ai_ideogram"
    )))
)]
pub mod remix;
#[cfg(any(
    feature = "endpoints",
    feature = "endpoints_fal-ai",
    feature = "endpoints_fal-ai_ideogram"
))]
#[cfg_attr(
    docsrs,
    doc(cfg(any(
        feature = "endpoints",
        feature = "endpoints_fal-ai",
        feature = "endpoints_fal-ai_ideogram"
    )))
)]
pub mod turbo;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct EditImageInput {
    /// Whether to expand the prompt with MagicPrompt functionality.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expand_prompt: Option<bool>,
    /// The image URL to generate an image from. Needs to match the dimensions of the mask.
    /// "https://storage.googleapis.com/falserverless/flux-lora/example-images/knight.jpeg"
    pub image_url: String,
    /// The mask URL to inpaint the image. Needs to match the dimensions of the input image.
    /// "https://storage.googleapis.com/falserverless/flux-lora/example-images/mask_knight.jpeg"
    pub mask_url: String,
    /// The prompt to fill the masked part of the image.
    /// "A knight in shining armour holding a greatshield with \"FAL\" on it"
    pub prompt: String,
    /// Seed for the random number generator
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// The style of the generated image
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style: Option<String>,
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

#[derive(Debug, Serialize, Deserialize)]
pub struct Output {
    pub images: Vec<File>,
    /// Seed used for the random number generator
    /// 123456
    pub seed: i64,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct RemixImageInput {
    /// The aspect ratio of the generated image
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    /// Whether to expand the prompt with MagicPrompt functionality.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expand_prompt: Option<bool>,
    /// The image URL to remix
    /// "https://fal.media/files/lion/FHOx4y4a0ef7Sgmo-sOUR_image.png"
    pub image_url: String,
    /// The prompt to remix the image with
    /// "An ice field in north atlantic"
    pub prompt: String,
    /// Seed for the random number generator
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// Strength of the input image in the remix
    #[serde(skip_serializing_if = "Option::is_none")]
    pub strength: Option<f64>,
    /// The style of the generated image
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TextToImageInput {
    /// The aspect ratio of the generated image
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aspect_ratio: Option<String>,
    /// Whether to expand the prompt with MagicPrompt functionality.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expand_prompt: Option<bool>,
    /// A negative prompt to avoid in the generated image
    #[serde(skip_serializing_if = "Option::is_none")]
    pub negative_prompt: Option<String>,
    pub prompt: String,
    /// Seed for the random number generator
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
    /// The style of the generated image
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct UpscaleImageInput {
    /// The detail of the upscaled image
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<i64>,
    /// Whether to expand the prompt with MagicPrompt functionality.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expand_prompt: Option<bool>,
    /// The image URL to upscale
    /// "https://fal.media/files/monkey/e6RtJf_ue0vyWzeiEmTby.png"
    pub image_url: String,
    /// The prompt to upscale the image with
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt: Option<String>,
    /// The resemblance of the upscaled image to the original image
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resemblance: Option<i64>,
    /// Seed for the random number generator
    #[serde(skip_serializing_if = "Option::is_none")]
    pub seed: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct UpscaleOutput {
    pub images: Vec<File>,
    /// Seed used for the random number generator
    /// 123456
    pub seed: i64,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// Ideogram V2
///
/// Category: text-to-image
///
/// License Type: commercial
///
/// Ideogram's state-of-the-art image generation model. Can be used as an API directly from fal.
pub fn v2(params: TextToImageInput) -> FalRequest<TextToImageInput, Output> {
    FalRequest::new("fal-ai/ideogram/v2", params)
}
