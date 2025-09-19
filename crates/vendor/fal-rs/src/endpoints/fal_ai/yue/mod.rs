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
    /// {"content_type":"application/octet-stream","file_name":"cot_inspiring-female-uplifting-pop-airy-vocal-electronic-bright-vocal-vocal_tp0@93_T1@0_rp1@2_maxtk3000_mixed_8179e8da-5452-4cf6-9d6b-f69280feb7e8.mp3","file_size":480462,"url":"https://v3.fal.media/files/tiger/iAXHU3LtbJGeqPYWKkYMr_cot_inspiring-female-uplifting-pop-airy-vocal-electronic-bright-vocal-vocal_tp0%4093_T1%400_rp1%402_maxtk3000_mixed_74bcf408-eb99-4b88-b7bf-7d7212200cf1.mp3"}
    pub audio: File,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TextToMusicInput {
    /// The genres (separated by a space ' ') to guide the music generation.
    /// "inspiring female uplifting pop airy vocal electronic bright vocal vocal"
    /// "R&B male hiphop pop 80s vocal electronic dark vocal vocal"
    pub genres: String,
    /// The prompt to generate an image from. Must have two sections. Sections start with either [chorus] or a [verse].
    /// "[verse]\nStaring at the sunset, colors paint the sky\nThoughts of you keep swirling, can't deny\nI know I let you down, I made mistakes\nBut I'm here to mend the heart I didn't break\n\n[chorus]\nEvery road you take, I'll be one step behind\nEvery dream you chase, I'm reaching for the light\nYou can't fight this feeling now\nI won't back down\nYou know you can't deny it now\nI won't back down\n"
    pub lyrics: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct ValidationError {
    pub loc: Vec<serde_json::Value>,
    pub msg: String,
    #[serde(rename = "type")]
    pub ty: String,
}

/// YuE: Lyrics to Song
///
/// Category: text-to-audio
///
/// License Type: commercial
pub fn yue(params: TextToMusicInput) -> FalRequest<TextToMusicInput, Output> {
    FalRequest::new("fal-ai/yue", params)
}
