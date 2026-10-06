use crate::error::ark_error_body::ArkErrorBody;
use serde_derive::{Deserialize, Serialize};

// ── Request ──

/// Body of `POST /contents/generations/tasks` (Seedance).
#[derive(Clone, Debug, Serialize)]
pub struct CreateVideoTaskRequest {
  /// Dated model id (eg. `dreamina-seedance-2-0-260128`) or an endpoint id (`ep-...`).
  pub model: String,

  /// The prompt plus optional images: one first frame, first + last frame, or references.
  pub content: Vec<VideoContentItem>,

  /// `480p` / `720p` / `1080p`.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub resolution: Option<String>,

  /// `16:9`, `9:16`, `1:1`, `adaptive`, ...
  #[serde(skip_serializing_if = "Option::is_none")]
  pub ratio: Option<String>,

  /// Seconds.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub duration: Option<i32>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub generate_audio: Option<bool>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub seed: Option<i64>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub camera_fixed: Option<bool>,

  /// Seedance 2.5: `true` makes a 480p preview (resolution must be `480p`). Its task id then
  /// renders the final video through a `draft_task` content item.
  #[serde(skip_serializing_if = "Option::is_none")]
  pub draft: Option<bool>,

  pub watermark: bool,
}

#[derive(Clone, Debug, Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum VideoContentItem {
  Text {
    text: String,
  },
  ImageUrl {
    image_url: MediaUrl,
    #[serde(skip_serializing_if = "Option::is_none")]
    role: Option<ImageRole>,
  },
  /// Seedance 2.x only. The URL must be publicly downloadable (base64 isn't accepted).
  VideoUrl {
    video_url: MediaUrl,
    role: VideoRole,
  },
  /// Seedance 2.x only. Takes a URL or a base64 data URL (clips are small).
  AudioUrl {
    audio_url: MediaUrl,
    role: AudioRole,
  },
  /// Renders the final video of a draft (Seedance 2.5). It must be the only item: the draft's
  /// prompt, references, duration, ratio and audio setting are reused, and sending them again
  /// is an error.
  DraftTask {
    draft_task: DraftTaskRef,
  },
}

/// The id of a finished draft task, valid for 7 days after it was created.
#[derive(Clone, Debug, Serialize)]
pub struct DraftTaskRef {
  pub id: String,
}

/// A URL or a `data:image/<format>;base64,...` string.
#[derive(Clone, Debug, Serialize)]
pub struct MediaUrl {
  pub url: String,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum VideoRole {
  /// A video to edit, extend or take motion, camera work or pacing from.
  ReferenceVideo,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum AudioRole {
  /// A clip whose voice, timbre or music the video should follow.
  ReferenceAudio,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum ImageRole {
  FirstFrame,
  LastFrame,
  ReferenceImage,
}

// ── Responses ──

#[derive(Debug, Deserialize)]
pub struct CreateVideoTaskResponse {
  pub id: String,
}

/// Body of `GET /contents/generations/tasks/{id}`. Seedance and 3D (Hyper3D, Hitem3D) tasks share
/// this shape; they differ only in which `content` link is set.
#[derive(Debug, Deserialize)]
pub struct VideoTask {
  pub id: String,
  pub model: Option<String>,
  pub status: VideoTaskStatus,
  pub content: Option<VideoTaskContent>,
  pub error: Option<ArkErrorBody>,
}

#[derive(Debug, Deserialize)]
pub struct VideoTaskContent {
  /// Download link for the finished video; expires after 24 hours.
  pub video_url: Option<String>,
  pub last_frame_url: Option<String>,
  /// Download link for a finished 3D model (GLB, or a zipped OBJ from Hitem3D by default);
  /// expires after 24 hours.
  pub file_url: Option<String>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum VideoTaskStatus {
  Queued,
  Running,
  Succeeded,
  Failed,
  #[serde(alias = "canceled")]
  Cancelled,
  Expired,
  /// A status this client doesn't know yet; keep polling rather than failing.
  #[serde(other)]
  Unknown,
}

impl VideoTaskStatus {
  /// True once the task will never change again.
  pub fn is_terminal(self) -> bool {
    matches!(self, Self::Succeeded | Self::Failed | Self::Cancelled | Self::Expired)
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn create_request_serializes_text_and_first_frame() {
    let request = CreateVideoTaskRequest {
      model: "dreamina-seedance-2-0-fast-260128".to_string(),
      content: vec![
        VideoContentItem::Text { text: "The mug slowly rotates".to_string() },
        VideoContentItem::ImageUrl {
          image_url: MediaUrl { url: "data:image/png;base64,iVBOR".to_string() },
          role: Some(ImageRole::FirstFrame),
        },
      ],
      resolution: Some("720p".to_string()),
      ratio: Some("adaptive".to_string()),
      duration: Some(5),
      generate_audio: Some(true),
      seed: None,
      camera_fixed: None,
      draft: None,
      watermark: false,
    };
    let json = serde_json::to_value(&request).unwrap();
    assert_eq!(json, serde_json::json!({
      "model": "dreamina-seedance-2-0-fast-260128",
      "content": [
        {"type": "text", "text": "The mug slowly rotates"},
        {"type": "image_url", "image_url": {"url": "data:image/png;base64,iVBOR"}, "role": "first_frame"}
      ],
      "resolution": "720p",
      "ratio": "adaptive",
      "duration": 5,
      "generate_audio": true,
      "watermark": false,
    }));
  }

  #[test]
  fn reference_videos_serialize_with_their_role() {
    let item = VideoContentItem::VideoUrl {
      video_url: MediaUrl { url: "https://example.com/clip.mp4".to_string() },
      role: VideoRole::ReferenceVideo,
    };
    assert_eq!(
      serde_json::to_value(&item).unwrap(),
      serde_json::json!({"type": "video_url", "video_url": {"url": "https://example.com/clip.mp4"}, "role": "reference_video"}),
    );
  }

  mod draft_mode {
    use super::*;

    #[test]
    fn a_draft_request_asks_for_a_480p_preview() {
      let request = CreateVideoTaskRequest {
        model: "dreamina-seedance-2-5-260628".to_string(),
        content: vec![VideoContentItem::Text { text: "A girl holds a fox".to_string() }],
        resolution: Some("480p".to_string()),
        ratio: Some("adaptive".to_string()),
        duration: Some(5),
        generate_audio: None,
        seed: None,
        camera_fixed: None,
        draft: Some(true),
        watermark: false,
      };
      let json = serde_json::to_value(&request).unwrap();
      assert_eq!(json["draft"], serde_json::json!(true));
      assert_eq!(json["resolution"], serde_json::json!("480p"));
    }

    #[test]
    fn the_final_render_sends_only_the_draft_task() {
      let request = CreateVideoTaskRequest {
        model: "dreamina-seedance-2-5-260628".to_string(),
        content: vec![VideoContentItem::DraftTask { draft_task: DraftTaskRef { id: "cgt-2026-draft".to_string() } }],
        resolution: Some("1080p".to_string()),
        ratio: None,
        duration: None,
        generate_audio: None,
        seed: None,
        camera_fixed: None,
        draft: None,
        watermark: false,
      };
      assert_eq!(serde_json::to_value(&request).unwrap(), serde_json::json!({
        "model": "dreamina-seedance-2-5-260628",
        "content": [{"type": "draft_task", "draft_task": {"id": "cgt-2026-draft"}}],
        "resolution": "1080p",
        "watermark": false,
      }));
    }
  }

  mod task_parsing {
    use super::*;

    #[test]
    fn succeeded_task_has_video_url() {
      let body = r#"{"id":"cgt-123","model":"dreamina-seedance-2-0-260128","status":"succeeded",
        "content":{"video_url":"https://example.com/v.mp4"},"duration":5,"usage":{"total_tokens":108000}}"#;
      let task: VideoTask = serde_json::from_str(body).unwrap();
      assert_eq!(task.status, VideoTaskStatus::Succeeded);
      assert_eq!(task.content.unwrap().video_url.as_deref(), Some("https://example.com/v.mp4"));
    }

    #[test]
    fn failed_task_has_error() {
      let body = r#"{"id":"cgt-456","status":"failed","error":{"code":"InputImageSensitiveContentDetected","message":"blocked"}}"#;
      let task: VideoTask = serde_json::from_str(body).unwrap();
      assert_eq!(task.status, VideoTaskStatus::Failed);
      assert_eq!(task.error.unwrap().code.as_deref(), Some("InputImageSensitiveContentDetected"));
    }

    #[test]
    fn succeeded_3d_task_has_file_url() {
      // Shape returned by a live Hyper3D task on 2026-09-15.
      let body = r#"{"id":"cgt-789","model":"hyper3d-gen2-260112","status":"succeeded",
        "content":{"file_url":"https://example.com/model.glb"},
        "usage":{"completion_tokens":30000,"total_tokens":30000},"execution_expires_after":172800}"#;
      let task: VideoTask = serde_json::from_str(body).unwrap();
      let content = task.content.unwrap();
      assert_eq!(content.file_url.as_deref(), Some("https://example.com/model.glb"));
      assert!(content.video_url.is_none());
    }

    #[test]
    fn status_spellings_and_unknown_values() {
      let parse = |s: &str| serde_json::from_str::<VideoTaskStatus>(&format!("\"{}\"", s)).unwrap();
      assert_eq!(parse("canceled"), VideoTaskStatus::Cancelled);
      assert_eq!(parse("cancelled"), VideoTaskStatus::Cancelled);
      assert_eq!(parse("paused"), VideoTaskStatus::Unknown);
      assert!(parse("expired").is_terminal());
      assert!(!parse("running").is_terminal());
      assert!(!parse("paused").is_terminal());
    }
  }
}
