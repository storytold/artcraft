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
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct WhisperChunk {
    /// Transcription of the chunk
    pub text: String,
    /// Start and end timestamp of the chunk
    pub timestamp: Vec<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct WhisperInput {
    /// URL of the audio file to transcribe. Supported formats: mp3, mp4, mpeg, mpga, m4a, wav or webm.
    /// "https://ihlhivqvotguuqycfcvj.supabase.co/storage/v1/object/public/public-text-to-speech/scratch-testing/earth-history-19mins.mp3"
    pub audio_url: String,
    /// Level of the chunks to return.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub chunk_level: Option<String>,
    /// Language of the audio file.
    /// If translate is selected as the task, the audio will be translated to
    /// English, regardless of the language selected.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub language: Option<String>,
    /// Task to perform on the audio file. Either transcribe or translate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub task: Option<String>,
    /// Version of the model to use. All of the models are the Whisper large variant.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WhisperOutput {
    /// Timestamp chunks of the audio file
    pub chunks: Vec<WhisperChunk>,
    /// Transcription of the audio file
    pub text: String,
}

/// Wizper (Whisper v3 -- fal.ai edition)
///
/// Category: speech-to-text
/// Machine Type: A100
///
///
/// Transcribe an audio file using the Whisper model.
pub fn wizper(params: WhisperInput) -> FalRequest<WhisperInput, WhisperOutput> {
    FalRequest::new("fal-ai/wizper", params)
}
