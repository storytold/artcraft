use crate::error::ark_error_body::ArkErrorBody;
use std::error::Error;
use std::fmt::{Display, Formatter};

/// An error reported by ModelArk, classified so callers can tell the user what to fix.
#[derive(Clone, Debug, PartialEq)]
pub struct ArkApiError {
  pub kind: ArkApiErrorKind,
  /// HTTP status, or `None` for errors reported inside a 2xx payload (failed tasks/images).
  pub maybe_status_code: Option<u16>,
  pub maybe_code: Option<String>,
  pub maybe_message: Option<String>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ArkApiErrorKind {
  InvalidApiKey,
  /// The access key (AK/SK or temporary STS credentials) was rejected or has expired.
  InvalidAccessKey,
  /// The access key works but isn't allowed to do this (IAM policy or account rights).
  AccessDenied,
  ModelNotActivated,
  ModelNotFound,
  EndpointRequired,
  AccountOverdue,
  RateLimited,
  ContentModeration,
  BadRequest,
  ServerError,
  Other,
}

impl ArkApiError {
  /// Classifies an error object that arrived inside a successful response, such as a
  /// failed Seedance task or a single rejected Seedream image.
  pub fn from_error_body(body: &ArkErrorBody) -> Self {
    Self {
      kind: classify_error_kind(None, body.code.as_deref()),
      maybe_status_code: None,
      maybe_code: body.code.clone(),
      maybe_message: body.message.clone(),
    }
  }

  pub fn user_message(&self) -> String {
    match self.kind {
      ArkApiErrorKind::InvalidApiKey => {
        "BytePlus rejected the API key. Check it in Settings → API Keys & Accounts.".to_string()
      }
      ArkApiErrorKind::InvalidAccessKey => {
        "BytePlus rejected your access key, or it has expired. Check it in Settings → API Keys & Accounts.".to_string()
      }
      ArkApiErrorKind::AccessDenied => {
        "Your BytePlus access key isn't allowed to manage the asset library. Ask your BytePlus admin for ModelArk and TOS permissions.".to_string()
      }
      ArkApiErrorKind::ModelNotActivated => {
        "This model isn't activated on your BytePlus account. Activate it in the ModelArk console.".to_string()
      }
      ArkApiErrorKind::ModelNotFound => {
        "This model isn't available to your BytePlus account. Activate it in the ModelArk console, or pick another model.".to_string()
      }
      ArkApiErrorKind::EndpointRequired => {
        "Your BytePlus account requires an endpoint ID (ep-...) instead of a model ID.".to_string()
      }
      ArkApiErrorKind::AccountOverdue => {
        "Your BytePlus account has an overdue balance. Top up in the BytePlus console.".to_string()
      }
      ArkApiErrorKind::RateLimited => {
        "BytePlus is busy or rate limiting requests. Wait a moment and try again.".to_string()
      }
      ArkApiErrorKind::ContentModeration => moderation_message(self.maybe_code.as_deref()),
      ArkApiErrorKind::BadRequest => match &self.maybe_message {
        // Seedance's floor for reference clips is about 480p (409,600 pixels a frame).
        Some(message) if message.contains("video pixel count") => {
          "The reference video is too small for Seedance: it needs about 480p or more. Scale it up first, with Upscale video in Flows or on Re-light and Video Angles, which do it for you.".to_string()
        }
        // An edit takes a clip of 4 to 30 s; its length is in the message ("is 2.4 seconds").
        Some(message) if message.contains("identified your task as video editing") => {
          let length = message.rsplit(" is ").next()
              .and_then(|rest| rest.split(" seconds").next())
              .filter(|seconds| seconds.parse::<f64>().is_ok())
              .map(|seconds| format!(" (yours is {} s)", seconds))
              .unwrap_or_default();
          format!("Seedance read this as an edit of your clip, and edits need a clip of 4 to 30 seconds{}. Use a longer clip, or describe a new video instead of a change to this one.", length)
        }
        Some(message) => format!("BytePlus rejected the request: {}", message),
        None => "BytePlus rejected the request.".to_string(),
      },
      ArkApiErrorKind::ServerError => "BytePlus had a server error. Try again shortly.".to_string(),
      ArkApiErrorKind::Other => match (&self.maybe_code, self.maybe_status_code) {
        (Some(code), _) => format!("BytePlus returned an error ({}).", code),
        (None, Some(status)) => format!("BytePlus returned an error (HTTP {}).", status),
        (None, None) => "BytePlus returned an error.".to_string(),
      },
    }
  }
}

/// Maps ModelArk error codes (preferred) and HTTP status codes to an error kind.
pub(crate) fn classify_error_kind(maybe_status_code: Option<u16>, maybe_code: Option<&str>) -> ArkApiErrorKind {
  let code = maybe_code.unwrap_or("");

  if code == "AuthenticationError" {
    return ArkApiErrorKind::InvalidApiKey;
  }
  if code.starts_with("ModelNotOpen") {
    return ArkApiErrorKind::ModelNotActivated;
  }
  if code == "InvalidEndpointOrModel.ModelIDAccessDisabled" {
    return ArkApiErrorKind::EndpointRequired;
  }
  if code.starts_with("InvalidEndpointOrModel") {
    return ArkApiErrorKind::ModelNotFound;
  }
  if code.starts_with("AccountOverdue") {
    return ArkApiErrorKind::AccountOverdue;
  }
  if code.contains("SensitiveContentDetected") {
    return ArkApiErrorKind::ContentModeration;
  }
  // Failed tasks carry no HTTP status; their parameter errors still say what to fix.
  if code.starts_with("InvalidParameter") {
    return ArkApiErrorKind::BadRequest;
  }
  if code.contains("RateLimit")
      || code.starts_with("QuotaExceeded")
      || code == "ServerOverloaded"
      || code == "RequestBurstTooFast" {
    return ArkApiErrorKind::RateLimited;
  }

  match maybe_status_code {
    Some(401) => ArkApiErrorKind::InvalidApiKey,
    Some(429) => ArkApiErrorKind::RateLimited,
    Some(400) | Some(422) => ArkApiErrorKind::BadRequest,
    Some(500..=599) => ArkApiErrorKind::ServerError,
    _ => ArkApiErrorKind::Other,
  }
}

/// Says what BytePlus blocked, from codes like `OutputAudioSensitiveContentDetected.PolicyViolation`
/// or `InputImageSensitiveContentDetected.PrivacyInformation`, so the user (and the Creative
/// Agent) know what to change.
fn moderation_message(maybe_code: Option<&str>) -> String {
  const GENERIC: &str = "BytePlus blocked this request for content policy reasons.";
  let Some(code) = maybe_code else { return GENERIC.to_string() };
  let is_input = code.starts_with("Input");
  let reason = code.split('.').nth(1).unwrap_or_default();
  let medium = if code.contains("Audio") { "audio" }
      else if code.contains("Image") { "image" }
      else if code.contains("Video") { "video" }
      else if code.contains("Text") { "prompt" }
      else { "" };

  match (is_input, medium, reason) {
    (false, "audio", _) => "BytePlus blocked the sound it generated for this clip (it may resemble copyrighted audio). Try again without generated audio, or change the prompt.".to_string(),
    (true, "image", "PrivacyInformation") => "BytePlus blocked an input image because it may show a real person. Use a character from your library (trusted asset) instead.".to_string(),
    (true, "image", _) => "BytePlus blocked one of the input images for content policy reasons. Try another image.".to_string(),
    // Seedance accepts people only from its own recent output for the same account; a copy that
    // was trimmed, re-exported or recompressed no longer counts as one.
    (true, "video", "PrivacyInformation") => "BytePlus blocked an input video because it may show a real person. Seedance only accepts people from clips it made for your account in the last 30 days, as they came out: use one of those (a trimmed, re-exported or recompressed copy no longer counts).".to_string(),
    (true, "video", _) => "BytePlus blocked one of the input videos for content policy reasons. Try another video.".to_string(),
    (true, "audio", _) => "BytePlus blocked one of the input audio files for content policy reasons. Try another audio file.".to_string(),
    (true, "prompt", _) => "BytePlus blocked the prompt for content policy reasons. Rephrase it.".to_string(),
    (false, "image", _) | (false, "video", _) => format!("BytePlus blocked the generated {} for content policy reasons. Change the prompt and try again.", medium),
    _ => GENERIC.to_string(),
  }
}

impl Error for ArkApiError {}

impl Display for ArkApiError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn failed_task_error_body_is_classified_by_code() {
    let body = ArkErrorBody {
      code: Some("OutputVideoSensitiveContentDetected".to_string()),
      message: Some("blocked".to_string()),
    };
    let err = ArkApiError::from_error_body(&body);
    assert_eq!(err.kind, ArkApiErrorKind::ContentModeration);
    assert_eq!(err.maybe_status_code, None);
  }

  mod moderation_tests {
    use super::*;

    fn message_for(code: &str) -> String {
      ArkApiError::from_error_body(&ArkErrorBody { code: Some(code.to_string()), message: None }).user_message()
    }

    #[test]
    fn generated_audio_is_named() {
      assert!(message_for("OutputAudioSensitiveContentDetected.PolicyViolation").contains("sound it generated"));
    }

    #[test]
    fn real_people_in_input_images_point_to_the_character_library() {
      assert!(message_for("InputImageSensitiveContentDetected.PrivacyInformation").contains("real person"));
    }

    #[test]
    fn a_reference_clip_below_seedances_minimum_says_so() {
      let err = ArkApiError {
        kind: ArkApiErrorKind::BadRequest,
        maybe_status_code: Some(400),
        maybe_code: Some("InvalidParameter".to_string()),
        maybe_message: Some("The parameter `content[1]` specified in the request is not valid: the parameter video pixel count specified in the request must be greater than or equal to 407696 for model dreamina-seedance-2-5 in r2v.".to_string()),
      };
      assert!(err.user_message().starts_with("The reference video is too small for Seedance"));
    }

    #[test]
    fn an_edit_of_a_short_clip_says_how_long_it_must_be() {
      let body = ArkErrorBody {
        code: Some("InvalidParameter.TaskTypeConstraint".to_string()),
        message: Some("The parameter `content[1].video_url` specified in the request is not valid. Seedance identified your task as video editing based on your prompt. For this task type, the output ratio and duration follow the input video selected by the model for editing, and the video selected must satisfy the duration requirement of 4 to 30 seconds. Issues: [0] `content[1].video_url` is 2.4 seconds. Request id: 0217".to_string()),
      };
      let message = ArkApiError::from_error_body(&body).user_message();
      assert!(message.starts_with("Seedance read this as an edit of your clip"));
      assert!(message.contains("(yours is 2.4 s)"));
    }

    #[test]
    fn real_people_in_input_videos_point_to_recent_seedance_clips() {
      let message = message_for("InputVideoSensitiveContentDetected.PrivacyInformation");
      assert!(message.contains("real person"));
      assert!(message.contains("clips it made for your account in the last 30 days"));
      assert!(message_for("InputVideoSensitiveContentDetected.PolicyViolation").contains("Try another video"));
    }

    #[test]
    fn prompts_and_generated_video_are_named() {
      assert!(message_for("InputTextSensitiveContentDetected").contains("prompt"));
      assert!(message_for("OutputVideoSensitiveContentDetected").contains("generated video"));
    }
  }

  #[test]
  fn bad_request_message_includes_upstream_reason() {
    let err = ArkApiError {
      kind: ArkApiErrorKind::BadRequest,
      maybe_status_code: Some(400),
      maybe_code: Some("InvalidParameter".to_string()),
      maybe_message: Some("size is too small".to_string()),
    };
    assert_eq!(err.user_message(), "BytePlus rejected the request: size is too small");
  }
}
