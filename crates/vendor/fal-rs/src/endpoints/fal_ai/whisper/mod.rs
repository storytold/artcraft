#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct DiarizationSegment {
    /// Speaker ID of the segment
    pub speaker: String,
    /// Start and end timestamp of the segment
    pub timestamp: Vec<serde_json::Value>,
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
pub struct WhisperChunk {
    /// Speaker ID of the chunk. Only present if diarization is enabled.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub speaker: Option<String>,
    /// Transcription of the chunk
    pub text: String,
    /// Start and end timestamp of the chunk
    pub timestamp: Vec<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct WhisperInput {
    /// URL of the audio file to transcribe. Supported formats: mp3, mp4, mpeg, mpga, m4a, wav or webm.
    /// "https://storage.googleapis.com/falserverless/model_tests/whisper/dinner_conversation.mp3"
    pub audio_url: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub batch_size: Option<i64>,
    /// Level of the chunks to return. Either segment or word.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub chunk_level: Option<String>,
    /// Whether to diarize the audio file. Defaults to false.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub diarize: Option<bool>,
    /// Language of the audio file. If set to null, the language will be
    /// automatically detected. Defaults to null.
    ///
    /// If translate is selected as the task, the audio will be translated to
    /// English, regardless of the language selected.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub language: Option<String>,
    /// Number of speakers in the audio file. Defaults to null.
    /// If not provided, the number of speakers will be automatically
    /// detected.
    /// null
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_speakers: Option<i64>,
    /// Prompt to use for generation. Defaults to an empty string.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt: Option<String>,
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
    #[serde(skip_serializing_if = "Option::is_none")]
    pub chunks: Option<Vec<Option<WhisperChunk>>>,
    /// Speaker diarization segments of the audio file. Only present if diarization is enabled.
    pub diarization_segments: Vec<DiarizationSegment>,
    /// List of languages that the audio file is inferred to be. Defaults to null.
    pub inferred_languages: Vec<String>,
    /// Transcription of the audio file
    pub text: String,
}

/// Whisper
///
/// Category: speech-to-text
/// Machine Type: A100
pub fn whisper(params: WhisperInput) -> FalRequest<WhisperInput, WhisperOutput> {
    FalRequest::new("fal-ai/whisper", params)
}
