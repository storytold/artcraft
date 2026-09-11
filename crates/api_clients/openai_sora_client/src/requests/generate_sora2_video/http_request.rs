use serde_derive::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "snake_case")]
pub (super) struct HttpCreateRequest {
  // eg. "video"
  pub kind: String,
  
  // User prompt
  pub prompt: String,
  
  // NB: sent as null
  pub title: Option<String>,
  
  // eg. "portrait"
  pub orientation: String,
  
  // eg. "small"
  pub size: String,
  
  // eg. 300
  pub n_frames: u16,
  
  // NB: sent as empty array
  pub inpaint_items: Vec<InpaintItem>,

  // NB: Sent as null
  pub cameo_ids: Option<String>,
  
  // NB: Sent as null
  pub cameo_replacements: Option<String>,
  
  // eg. "sy_8"
  pub model: String,
  
  // NB: Sent as null
  pub style_id: Option<String>,
  
  // NB: Sent as null
  pub audio_caption: Option<String>,

  // NB: Sent as null
  pub audio_transcript: Option<String>,

  // NB: Sent as null
  pub video_caption: Option<String>,

  // NB: Sent as null
  pub storyboard_id: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "snake_case")]
pub (super) struct InpaintItem {
  // eg. "upload"
  pub kind: String,
  
  // eg. "media_01abc..."
  pub upload_id: String,
}
