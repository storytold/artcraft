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

#[derive(Debug, Serialize, Deserialize)]
pub struct Output {
    /// Generated music file.
    /// {"content_type":"application/octet-stream","file_name":"output.wav","file_size":33554520,"url":"https://v3.fal.media/files/elephant/VV4wtKXBpZL1bNv6en36t_output.wav"}
    pub audio: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TextToMusicInput {
    /// The CFG strength to use for the music generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cfg_strength: Option<f64>,
    /// The prompt to generate the song from. Must have two sections. Sections start with either [chorus] or a [verse].
    /// "[00:10.00]Moonlight spills through broken blinds\n[00:13.20]Your shadow dances on the dashboard shrine\n[00:16.85]Neon ghosts in gasoline rain\n[00:20.40]I hear your laughter down the midnight train\n[00:24.15]Static whispers through frayed wires\n[00:27.65]Guitar strings hum our cathedral choirs\n[00:31.30]Flicker screens show reruns of June\n[00:34.90]I'm drowning in this mercury lagoon\n[00:38.55]Electric veins pulse through concrete skies\n[00:42.10]Your name echoes in the hollow where my heartbeat lies\n[00:45.75]We're satellites trapped in parallel light\n[00:49.25]Burning through the atmosphere of endless night\n[01:00.00]Dusty vinyl spins reverse\n[01:03.45]Our polaroid timeline bleeds through the verse\n[01:07.10]Telescope aimed at dead stars\n[01:10.65]Still tracing constellations through prison bars\n[01:14.30]Electric veins pulse through concrete skies\n[01:17.85]Your name echoes in the hollow where my heartbeat lies\n[01:21.50]We're satellites trapped in parallel light\n[01:25.05]Burning through the atmosphere of endless night\n[02:10.00]Clockwork gears grind moonbeams to rust\n[02:13.50]Our fingerprint smudged by interstellar dust\n[02:17.15]Velvet thunder rolls through my veins\n[02:20.70]Chasing phantom trains through solar plane\n[02:24.35]Electric veins pulse through concrete skies\n[02:27.90]Your name echoes in the hollow where my heartbeat lies\n"
    pub lyrics: String,
    /// The duration of the music to generate.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub music_duration: Option<String>,
    /// The number of inference steps to use for the music generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_inference_steps: Option<i64>,
    /// The URL of the reference audio to use for the music generation.
    /// "https://storage.googleapis.com/falserverless/model_tests/diffrythm/rock_en.wav"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reference_audio_url: Option<String>,
    /// The scheduler to use for the music generation.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scheduler: Option<String>,
    /// The style prompt to use for the music generation.
    /// "pop"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style_prompt: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// DiffRhythm: Lyrics to Song
///
/// Category: text-to-audio
///
/// License Type: commercial
pub fn diffrhythm(params: TextToMusicInput) -> FalRequest<TextToMusicInput, Output> {
    FalRequest::new("fal-ai/diffrhythm", params)
}
