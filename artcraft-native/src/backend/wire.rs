//! Lenient shapes for the API responses the app reads itself. Enums stay strings and every field
//! has a default, so a new server-side value can't break decoding (the typed client structs use
//! closed enums).

use serde::Deserialize;

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct MediaLinks {
  pub cdn_url: String,
  pub maybe_thumbnail_template: Option<String>,
  pub maybe_video_previews: Option<VideoPreviews>,
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct VideoPreviews {
  pub still: String,
  pub animated: String,
  pub still_thumbnail_template: String,
  pub animated_thumbnail_template: String,
}

impl MediaLinks {
  /// A still thumbnail `width` pixels wide: the video still frame, the resized image, or the
  /// original (`thumbnail-utils.ts`).
  pub fn thumbnail(&self, width: u32) -> Option<String> {
    let w = width.to_string();
    if let Some(previews) = &self.maybe_video_previews {
      if !previews.still_thumbnail_template.is_empty() {
        return Some(previews.still_thumbnail_template.replace("{WIDTH}", &w));
      }
      if !previews.still.is_empty() {
        return Some(previews.still.clone());
      }
    }
    match &self.maybe_thumbnail_template {
      Some(template) if !template.is_empty() => Some(template.replace("{WIDTH}", &w)),
      _ if !self.cdn_url.is_empty() && self.maybe_video_previews.is_none() => Some(self.cdn_url.clone()),
      _ => None,
    }
  }
}

impl MediaLinks {
  /// A video's animated preview, `width` pixels wide where the CDN can resize.
  pub fn animated_preview(&self, width: u32) -> Option<String> {
    let previews = self.maybe_video_previews.as_ref()?;
    if !previews.animated_thumbnail_template.is_empty() {
      return Some(previews.animated_thumbnail_template.replace("{WIDTH}", &width.to_string()));
    }
    (!previews.animated.is_empty()).then(|| previews.animated.clone())
  }
}

/// `GET /v1/media_files/list/user/{username}`.
#[derive(Debug, Default, Deserialize)]
#[serde(default)]
pub struct UserMediaList {
  pub success: bool,
  pub results: Vec<MediaFile>,
  pub pagination: Option<Pagination>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(default)]
pub struct Pagination {
  pub current: u32,
  pub total_page_count: u32,
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct MediaFile {
  pub token: String,
  pub media_class: Option<String>,
  pub media_type: String,
  pub origin_category: String,
  pub maybe_batch_token: Option<String>,
  pub maybe_prompt_token: Option<String>,
  pub maybe_model_type: Option<String>,
  pub maybe_origin_model_type: Option<String>,
  pub maybe_duration_millis: Option<u64>,
  pub maybe_title: Option<String>,
  pub media_links: MediaLinks,
  pub created_at: String,
}

impl MediaFile {
  /// The file's still thumbnail; audio files have none (their CDN link is the audio itself).
  pub fn thumbnail(&self, width: u32) -> Option<String> {
    if self.media_class.as_deref() == Some("audio") {
      return None;
    }
    self.media_links.thumbnail(width)
  }
}

/// `GET /v1/omni_gen/models/audio`. The client has no binding for it (and the API's type only
/// serializes), so it's read here; capability flags are left out when false.
#[derive(Debug, Default, Deserialize)]
#[serde(default)]
pub struct AudioModels {
  pub success: bool,
  pub models: Vec<AudioModel>,
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct AudioModel {
  pub model: String,
  pub model_creator: Option<String>,
  pub full_name: Option<String>,
  pub extra_info_short: Option<String>,
  pub text_prompt_supported: Option<bool>,
  pub style_prompt_supported: bool,
  pub audio_references_supported: bool,
  pub audio_references_max: Option<u16>,
  pub image_references_supported: bool,
  pub image_references_max: Option<u16>,
  pub keep_lyrics_supported: bool,
  pub instrumental_toggle_supported: bool,
  pub loopable_toggle_supported: bool,
  pub bpm_supported: bool,
  pub musical_key_supported: bool,
  pub sample_rate_hz_options: Vec<u32>,
  pub sample_rate_hz_default: Option<u32>,
  pub speed_supported: bool,
  pub volume_supported: bool,
  pub pitch_supported: bool,
  pub is_disabled: bool,
}

/// `GET /v1/media_files/batch_gen_redux/{token}`.
#[derive(Debug, Default, Deserialize)]
#[serde(default)]
pub struct BatchMedia {
  pub success: bool,
  pub media_files: Vec<MediaFile>,
}

/// `GET /v1/jobs/session`.
#[derive(Debug, Default, Deserialize)]
#[serde(default)]
pub struct SessionJobs {
  pub success: bool,
  pub jobs: Vec<Job>,
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Job {
  pub job_token: String,
  pub request: JobRequest,
  pub status: JobStatus,
  pub maybe_result: Option<JobResult>,
  pub created_at: String,
  pub updated_at: String,
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct JobRequest {
  pub inference_category: String,
  pub maybe_prompt_token: Option<String>,
  pub maybe_model_type: Option<String>,
  pub maybe_raw_inference_text: Option<String>,
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct JobStatus {
  pub status: String,
  pub maybe_extra_status_description: Option<String>,
  pub maybe_failure_category_updated: Option<String>,
  pub maybe_failure_message: Option<String>,
  pub progress_percentage: u8,
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct JobResult {
  pub entity_token: String,
  pub maybe_batch_token: Option<String>,
  pub media_links: MediaLinks,
}

/// Where a job is in its life.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum JobPhase {
  Running,
  Succeeded,
  Failed,
}

impl JobStatus {
  pub fn phase(&self) -> JobPhase {
    match self.status.as_str() {
      "pending" | "started" => JobPhase::Running,
      "complete_success" => JobPhase::Succeeded,
      _ => JobPhase::Failed,
    }
  }

  /// The user-facing failure reason (`FAILURE_REASON_LABEL`).
  pub fn failure_reason(&self) -> String {
    let label = match self.maybe_failure_category_updated.as_deref().unwrap_or("") {
      "rule_bans_user_image" => "Image violates content policy",
      "rule_bans_user_image_with_faces" => "Images with faces are not allowed",
      "rule_bans_user_text_prompt" => "Text prompt violates content policy",
      "rule_bans_user_content" => "Content violates content policy",
      "rule_bans_generated_video" => "Generated video flagged by content policy",
      "rule_bans_generated_audio" => "Generated audio flagged by content policy",
      "rule_bans_generated_content" => "Generated content flagged by content policy",
      "unknown" => "An unknown error occurred",
      _ if self.status.starts_with("cancelled") => "Cancelled",
      _ => "Generation failed",
    };
    label.to_owned()
  }
}

/// `GET /v1/prompts/{token}`.
#[derive(Debug, Default, Deserialize)]
#[serde(default)]
pub struct PromptResponse {
  pub success: bool,
  pub prompt: Prompt,
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Prompt {
  pub token: String,
  pub maybe_positive_prompt: Option<String>,
  pub maybe_negative_prompt: Option<String>,
  pub maybe_model_type: Option<String>,
  pub maybe_aspect_ratio: Option<String>,
  pub maybe_resolution: Option<String>,
  pub maybe_duration_seconds: Option<u16>,
  pub maybe_generate_audio: Option<bool>,
  pub maybe_batch_count: Option<u16>,
  pub maybe_context_images: Option<Vec<ContextImage>>,
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct ContextImage {
  pub media_token: String,
  pub semantic: String,
  pub media_links: MediaLinks,
}

/// A saved character (`GET /v1/characters/session`).
#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct Character {
  pub token: String,
  pub name: String,
  pub maybe_description: Option<String>,
  pub maybe_avatar: Option<MediaLinks>,
  pub maybe_full_image: Option<MediaLinks>,
  pub models: Vec<String>,
}

impl Character {
  pub fn avatar_url(&self) -> Option<String> {
    self.maybe_avatar.as_ref().or(self.maybe_full_image.as_ref()).and_then(|l| l.thumbnail(256))
  }

  pub fn full_url(&self) -> Option<String> {
    self.maybe_full_image.as_ref().or(self.maybe_avatar.as_ref()).map(|l| l.cdn_url.clone()).filter(|u| !u.is_empty())
  }
}

#[derive(Debug, Default, Deserialize)]
#[serde(default)]
pub struct CharactersPage {
  pub success: bool,
  pub characters: Vec<Character>,
  pub next_cursor: Option<i64>,
}

/// `GET /v1/session` (only the parts the app shows).
#[derive(Debug, Default, Deserialize)]
#[serde(default)]
pub struct SessionInfo {
  pub success: bool,
  pub logged_in: bool,
  pub user: Option<SessionUser>,
}

#[derive(Clone, Debug, Default, Deserialize)]
#[serde(default)]
pub struct SessionUser {
  pub username: String,
  pub display_name: String,
  pub email_gravatar_hash: String,
}

/// The generic `{success, media_file_token}` upload reply.
#[derive(Debug, Default, Deserialize)]
#[serde(default)]
pub struct UploadResponse {
  pub success: bool,
  pub media_file_token: String,
}

/// Parses an RFC 3339 timestamp into unix seconds (0 when absent or malformed).
pub fn unix_secs(timestamp: &str) -> i64 {
  chrono::DateTime::parse_from_rfc3339(timestamp).map(|t| t.timestamp()).unwrap_or(0)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn thumbnails_prefer_the_video_still_then_the_resized_image() {
    let video: MediaLinks = serde_json::from_value(serde_json::json!({
      "cdn_url": "https://cdn/v.mp4",
      "maybe_video_previews": { "still": "https://cdn/s.jpg", "animated": "https://cdn/a.webp", "still_thumbnail_template": "https://cdn/w={WIDTH}/s.jpg", "animated_thumbnail_template": "" }
    }))
    .unwrap();
    assert_eq!(video.thumbnail(512).as_deref(), Some("https://cdn/w=512/s.jpg"));
    let image: MediaLinks = serde_json::from_value(serde_json::json!({ "cdn_url": "https://cdn/i.png", "maybe_thumbnail_template": null })).unwrap();
    assert_eq!(image.thumbnail(512).as_deref(), Some("https://cdn/i.png"));
  }

  #[test]
  fn unknown_statuses_and_fields_still_decode() {
    let job: Job = serde_json::from_value(serde_json::json!({ "job_token": "j", "status": { "status": "something_new" }, "brand_new_field": 1 })).unwrap();
    assert_eq!(job.status.phase(), JobPhase::Failed);
    assert_eq!(job.status.failure_reason(), "Generation failed");
  }
}
