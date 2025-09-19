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
pub struct MirrorInput {
    /// User's face image to face swap FROM
    /// "https://images.easelai.com/mirror_fal/faces/dr.webp"
    /// "https://images.easelai.com/mirror_fal/faces/ew.jpg"
    /// "https://images.easelai.com/mirror_fal/faces/me.jpg"
    /// "https://images.easelai.com/mirror_fal/faces/chani.png"
    pub face_image_0: Image,
    /// (Optional) The Second face image to face swap FROM
    /// "https://images.easelai.com/mirror_fal/faces/chani.png"
    /// "https://images.easelai.com/mirror_fal/faces/ew.jpg"
    /// "https://images.easelai.com/mirror_fal/faces/me.jpg"
    /// "https://images.easelai.com/mirror_fal/faces/dr.webp"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub face_image_1: Option<Option<Image>>,
    /// The gender of the person in the face image.
    pub gender_0: String,
    /// The gender of the person in the second face image.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub gender_1: Option<String>,
    /// The target image to face swap TO
    /// "https://images.easelai.com/mirror_fal/men_single_player/tg.jpg"
    /// "https://images.easelai.com/mirror_fal/men_single_player/bh.png"
    /// "https://images.easelai.com/mirror_fal/men_single_player/rip.jpg"
    /// "https://images.easelai.com/mirror_fal/men_single_player/th.jpg"
    /// "https://images.easelai.com/mirror_fal/women_single_player/themark.jpg"
    /// "https://images.easelai.com/mirror_fal/women_single_player/yellow.jpg"
    /// "https://images.easelai.com/mirror_fal/women_single_player/diamond.jpg"
    /// "https://images.easelai.com/mirror_fal/women_single_player/barbie.png"
    /// "https://images.easelai.com/mirror_fal/multiplayer/bf.jpg"
    /// "https://images.easelai.com/mirror_fal/multiplayer/hm.png"
    /// "https://images.easelai.com/mirror_fal/multiplayer/tr.jpg"
    /// "https://images.easelai.com/mirror_fal/multiplayer/mc.jpg"
    /// "https://images.easelai.com/mirror_fal/multiplayer/sb.jpg"
    /// "https://images.easelai.com/mirror_fal/multiplayer/wf.webp"
    pub target_image: Image,
    /// Apply 2x upscale and boost quality. Upscaling will refine the image and make the subjects brighter.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub upscale: Option<bool>,
    /// The type of face swap workflow. target_hair = preserve target's hair. user_hair = preserve user's hair.
    pub workflow_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MirrorOutput {
    /// The mirrored image.
    pub image: Image,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// Easel AI Advanced Face Swap
///
/// Category: image-to-image
/// Machine Type: H100
/// License Type: commercial
pub fn advanced_face_swap(params: MirrorInput) -> FalRequest<MirrorInput, MirrorOutput> {
    FalRequest::new("easel-ai/advanced-face-swap", params)
}
