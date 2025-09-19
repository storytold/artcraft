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
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ZonosInput {
    /// The content generated using cloned voice.
    /// "Fal is the fastest solution for your image generation."
    pub prompt: String,
    /// The reference audio.
    /// "https://storage.googleapis.com/falserverless/model_tests/zonos/demo_voice_zonos.wav"
    pub reference_audio_url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ZonosOutput {
    /// The generated audio
    pub audio: File,
}

/// Zonos-Audio-Clone
///
/// Category: text-to-audio
/// Machine Type: A100
pub fn zonos(params: ZonosInput) -> FalRequest<ZonosInput, ZonosOutput> {
    FalRequest::new("fal-ai/zonos", params)
}
