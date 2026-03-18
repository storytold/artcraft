
pub struct JobResults {
  /// The token of the thing that got downloaded and saved.
  /// Can be a token corresponding to any of multiple different tables (vocoder_models, tts_models, etc.)
  pub entity_token: Option<String>,

  /// This may differ from `GenericDownloadType` if the download is polymorphic.
  pub entity_type: Option<String>,
}