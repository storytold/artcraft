#[allow(unused_imports)]
use crate::prelude::*;
#[allow(unused_imports)]
use serde::{Deserialize, Serialize};
#[allow(unused_imports)]
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct AudioFile {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_name: Option<String>,
    /// The size of the file in bytes.
    /// 4404019
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_size: Option<FileSizeProperty>,
    pub url: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct HTTPValidationError {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<Vec<Option<ValidationError>>>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TTSInput {
    /// The text to be converted to speech.
    /// "I don't really care what you call me. I've been a silent spectator, watching species evolve, empires rise and fall. But always remember, I am mighty and enduring. Respect me and I'll nurture you; ignore me and you shall face the consequences."
    pub gen_text: String,
    /// The name of the model to be used for TTS.
    pub model_type: String,
    /// The URL of the reference audio file.
    /// "https://github.com/SWivid/F5-TTS/raw/21900ba97d5020a5a70bcc9a0575dc7dec5021cb/tests/ref_audio/test_en_1_ref_short.wav"
    pub ref_audio_url: String,
    /// The reference text to be used for TTS. If not provided, an ASR (Automatic Speech Recognition) model will be used to generate the reference text.
    /// "Some call me nature, others call me mother nature."
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ref_text: Option<String>,
    /// Whether to remove the silence from the audio file.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub remove_silence: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TTSOutput {
    /// The audio file containing the generated speech.
    pub audio_url: AudioFile,
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
pub enum FileSizeProperty {
    #[default]
    Integer(i64),
    Null(serde_json::Value),
}

/// F5 TTS
///
/// Category: text-to-audio
/// Machine Type: A100
pub fn f5_tts(params: TTSInput) -> FalRequest<TTSInput, TTSOutput> {
    FalRequest::new("fal-ai/f5-tts", params)
}
