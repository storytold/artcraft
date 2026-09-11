use serde_derive::Deserialize;

#[derive(Deserialize)]
pub (super) struct HttpDraftsResponse {
  pub items: Vec<PartialItem>,

  // NB: This is nullable.
  // It's null in my tests, so I don't know if this is a string or integer yet. Probably an opaque string?
  //pub cursor: Option<String>,
}

#[derive(Deserialize)]
pub (super) struct PartialItem {
  /// The generation id, eg. "gen_01abc..."
  pub id: String,

  /// The parent task id, eg "task_01abc..."
  pub task_id: String,

  //pub generation_id: String, // it looks like this matches "id" for now

  /// The kind of draft
  pub kind: DraftKind,

  // The text prompt
  pub prompt: String,

  /// URL to the generation
  /// This will not be present if the request failed, eg. for content reasons.
  pub url: Option<String>,

  /// "downloadable" URL to the generation
  /// it looks like this matches "url" for now
  /// This will not be present if the request failed, eg. for content reasons.
  pub downloadable_url: Option<String>,

  /// If there was a content violation, this will describe why.
  pub reason_str: Option<String>,

  // There are other things that might be interesting: "encodings", "width", "height", etc.
}


#[derive(Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DraftKind {
  /// Generated video
  SoraDraft,

  /// Video was blocked due to content
  /// These failures will have different "reason_str" reasons.
  SoraContentViolation,

  /// Unknown type.
  #[serde(untagged)]
  Unknown(String),
}
