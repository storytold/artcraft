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
pub struct Input {
    /// The context to generate an audio from.
    /// [{"audio_url":"https://huggingface.co/spaces/sesame/csm-1b/resolve/main/prompts/conversational_a.wav","prompt":"like revising for an exam I'd have to try and like keep up the momentum because I'd start really early I'd be like okay I'm gonna start revising now and then like you're revising for ages and then I just like start losing steam I didn't do that for the exam we had recently to be fair that was a more of a last minute scenario but like yeah I'm trying to like yeah I noticed this yesterday that like Mondays I sort of start the day with this not like a panic but like a","speaker_id":0},{"audio_url":"https://huggingface.co/spaces/sesame/csm-1b/resolve/main/prompts/conversational_b.wav","prompt":"like a super Mario level. Like it's very like high detail. And like, once you get into the park, it just like, everything looks like a computer game and they have all these, like, you know, if, if there's like a, you know, like in a Mario game, they will have like a question block. And if you like, you know, punch it, a coin will come out. So like everyone, when they come into the park, they get like this little bracelet and then you can go punching question blocks around.","speaker_id":1}]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context: Option<Vec<Option<Speaker>>>,
    /// The text to generate an audio from.
    /// [{"speaker_id":0,"text":"Hey how are you doing."},{"speaker_id":1,"text":"Pretty good, pretty good."},{"speaker_id":0,"text":"I'm great, so happy to be speaking to you."}]
    pub scene: Vec<Turn>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Output {
    /// The generated audio.
    pub audio: AudioProperty,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Speaker {
    pub audio_url: String,
    pub prompt: String,
    pub speaker_id: i64,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct Turn {
    pub speaker_id: i64,
    pub text: String,
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
pub enum AudioProperty {
    #[default]
    File(File),
    String(String),
}

/// CSM-1B
///
/// Category: text-to-audio
/// Machine Type: H100
/// License Type: research
pub fn csm_1b(params: Input) -> FalRequest<Input, Output> {
    FalRequest::new("fal-ai/csm-1b", params)
}
