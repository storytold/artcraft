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
    pub content_type: Option<ContentTypeProperty>,
    /// The name of the file. It will be auto-generated if not provided.
    /// "z9RV14K95DvU.png"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_name: Option<FileNameProperty>,
    /// The size of the file in bytes.
    /// 4404019
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_size: Option<FileSizeProperty>,
    /// The URL where the file can be downloaded from.
    pub url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct HTTPValidationError {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<Vec<Option<ValidationError>>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MusicOutput {
    /// The generated music
    /// {"url":"https://fal.media/files/elephant/N5UNLCwkC2y8v7a3LQLFE_output.mp3"}
    pub audio: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TextToMusicRequest {
    /// Lyrics with optional formatting. You can use a newline to separate each line of lyrics. You can use two newlines to add a pause between lines. You can use double hash marks (##) at the beginning and end of the lyrics to add accompaniment. Maximum 600 characters.
    /// "## Fast and Limitless   \n In the heart of the code, where dreams collide,   \n\nFAL's the name, taking tech for a ride.    \nGenerative media, blazing the trail,   \n\nFast inference power, we'll never fail.\n##"
    pub prompt: String,
    /// Reference song, should contain music and vocals. Must be a .wav or .mp3 file longer than 15 seconds.
    /// "https://fal.media/files/lion/OOTBTSlxKMH_E8H6hoSlb.mpga"
    pub reference_audio_url: String,
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
pub enum ContentTypeProperty {
    #[default]
    String(String),
    Null(serde_json::Value),
}

#[derive(Debug, Serialize, Deserialize, smart_default::SmartDefault)]
#[allow(non_camel_case_types)]
pub enum FileNameProperty {
    #[default]
    String(String),
    Null(serde_json::Value),
}

#[derive(Debug, Serialize, Deserialize, smart_default::SmartDefault)]
#[allow(non_camel_case_types)]
pub enum FileSizeProperty {
    #[default]
    Integer(i64),
    Null(serde_json::Value),
}

/// MiniMax (Hailuo AI) Music
///
/// Category: text-to-audio
///
/// License Type: commercial
pub fn minimax_music(params: TextToMusicRequest) -> FalRequest<TextToMusicRequest, MusicOutput> {
    FalRequest::new("fal-ai/minimax-music", params)
}
