use crate::client::websocket::job_progress::JobStepImage;
use ciborium::value::Value as CborValue;

/// A decoded server-to-client websocket event.
///
/// Midjourney sends these as CBOR binary frames. The variants cover the
/// handshake reply, job lifecycle notifications, and the streaming progress
/// frames that carry preview images.
#[derive(Clone, Debug)]
pub enum MidjourneyWsEvent {
  /// Reply to `subscribe_to_user`; the connection is now bound to this user.
  UserSuccess { user_id: String },

  /// A job was announced in the user's room (echo of `room_new_job`).
  RoomNewJob { job_id: Option<String> },

  /// Reply to `subscribe_to_job`; progress frames for it will now arrive.
  JobSuccess { job_id: String },

  /// A progress update. Carries preview images when the frame includes them.
  Progress(JobProgress),

  /// The job finished. The full-resolution result is fetched over HTTP.
  Completed { job_id: String, percentage_complete: f64 },

  /// A frame we recognized as CBOR but do not model. `maybe_kind` is its
  /// `type` field when present.
  Unknown { maybe_kind: Option<String> },
}

/// A single progress frame for a running job.
#[derive(Clone, Debug)]
pub struct JobProgress {
  pub job_id: String,
  pub maybe_user_id: Option<String>,

  /// e.g. `unqueue`, `start_stage`, `running`.
  pub current_status: String,

  pub percentage_complete: f64,

  /// Preview images included in this frame (may be empty).
  pub images: Vec<JobStepImage>,
}

impl MidjourneyWsEvent {
  /// The job this event concerns, if any. `UserSuccess` and unmodeled frames
  /// return `None`.
  pub fn job_id(&self) -> Option<&str> {
    match self {
      Self::UserSuccess { .. } | Self::Unknown { .. } => None,
      Self::RoomNewJob { job_id } => job_id.as_deref(),
      Self::JobSuccess { job_id } => Some(job_id),
      Self::Progress(progress) => Some(&progress.job_id),
      Self::Completed { job_id, .. } => Some(job_id),
    }
  }

  /// Whether this event marks the end of a job's progress stream.
  pub fn is_terminal(&self) -> bool {
    matches!(self, Self::Completed { .. })
  }

  /// Decode one binary websocket frame (CBOR) into an event.
  pub fn from_cbor_frame(bytes: &[u8]) -> Result<Self, MidjourneyWsDecodeError> {
    let value: CborValue = ciborium::from_reader(bytes).map_err(|err| MidjourneyWsDecodeError(err.to_string()))?;

    let entries = match &value {
      CborValue::Map(entries) => entries,
      _ => return Err(MidjourneyWsDecodeError("frame was not a CBOR map".to_string())),
    };

    let maybe_kind = get_str(entries, "type");

    if let Some(kind) = maybe_kind.as_deref() {
      match kind {
        "user_success" => {
          return Ok(Self::UserSuccess { user_id: get_str(entries, "user_id").unwrap_or_default() });
        },
        "room_new_job" => {
          return Ok(Self::RoomNewJob { job_id: get_str(entries, "job_id") });
        },
        "job_success" => {
          return Ok(Self::JobSuccess { job_id: get_str(entries, "job_id").unwrap_or_default() });
        },
        _ => {},
      }
    }

    // Progress frames have no `type`, but do carry `current_status`.
    if let Some(current_status) = get_str(entries, "current_status") {
      let job_id = get_str(entries, "job_id").unwrap_or_default();
      let percentage_complete = get_f64(entries, "percentage_complete").unwrap_or(0.0);

      if current_status == "completed" {
        return Ok(Self::Completed { job_id, percentage_complete });
      }

      return Ok(Self::Progress(JobProgress { job_id, maybe_user_id: get_str(entries, "user_id"), current_status, percentage_complete, images: extract_images(entries) }));
    }

    Ok(Self::Unknown { maybe_kind })
  }
}

/// The error returned when a websocket frame cannot be decoded as CBOR.
#[derive(Debug)]
pub struct MidjourneyWsDecodeError(pub String);

impl std::fmt::Display for MidjourneyWsDecodeError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "Failed to decode Midjourney websocket frame: {}", self.0)
  }
}

impl std::error::Error for MidjourneyWsDecodeError {}

fn extract_images(entries: &[(CborValue, CborValue)]) -> Vec<JobStepImage> {
  let files = match map_get(entries, "files") {
    Some(CborValue::Map(files)) => files,
    _ => return Vec::new(),
  };

  let mut images = Vec::new();
  for (key, value) in files {
    let (CborValue::Text(name), CborValue::Bytes(bytes)) = (key, value) else {
      continue;
    };
    if let Some(image) = JobStepImage::from_file_entry(name, bytes.clone()) {
      images.push(image);
    }
  }
  images.sort_by_key(|image| (image.step, image.image_index));
  images
}

fn map_get<'a>(entries: &'a [(CborValue, CborValue)], key: &str) -> Option<&'a CborValue> {
  entries.iter().find(|(k, _)| matches!(k, CborValue::Text(text) if text == key)).map(|(_, value)| value)
}

/// Read a string field, accepting both a plain text value and a CBOR
/// tag-37 (RFC 8949 UUID) 16-byte value, which Midjourney uses for some
/// `job_id` / `user_id` fields.
fn get_str(entries: &[(CborValue, CborValue)], key: &str) -> Option<String> {
  match map_get(entries, key)? {
    CborValue::Text(text) => Some(text.clone()),
    CborValue::Tag(37, inner) => match inner.as_ref() {
      CborValue::Bytes(bytes) if bytes.len() == 16 => Some(format_uuid(bytes)),
      CborValue::Text(text) => Some(text.clone()),
      _ => None,
    },
    _ => None,
  }
}

fn get_f64(entries: &[(CborValue, CborValue)], key: &str) -> Option<f64> {
  match map_get(entries, key)? {
    CborValue::Float(float) => Some(*float),
    CborValue::Integer(integer) => {
      let as_i128: i128 = (*integer).into();
      Some(as_i128 as f64)
    },
    _ => None,
  }
}

fn format_uuid(bytes: &[u8]) -> String {
  let hex: String = bytes.iter().map(|byte| format!("{:02x}", byte)).collect();
  format!("{}-{}-{}-{}-{}", &hex[0..8], &hex[8..12], &hex[12..16], &hex[16..20], &hex[20..32],)
}

#[cfg(test)]
mod tests {
  use super::*;

  fn encode(value: &CborValue) -> Vec<u8> {
    let mut buffer = Vec::new();
    ciborium::into_writer(value, &mut buffer).unwrap();
    buffer
  }

  fn text(value: &str) -> CborValue {
    CborValue::Text(value.to_string())
  }

  #[test]
  fn decodes_user_success() {
    let frame = encode(&CborValue::Map(vec![(text("type"), text("user_success")), (text("user_id"), text("26c9d38d-1f71-49c7-a356-b29dac58b54c"))]));

    let event = MidjourneyWsEvent::from_cbor_frame(&frame).unwrap();
    let MidjourneyWsEvent::UserSuccess { user_id } = event else {
      panic!("expected UserSuccess, got {event:?}");
    };
    assert_eq!(user_id, "26c9d38d-1f71-49c7-a356-b29dac58b54c");
  }

  #[test]
  fn decodes_tag37_uuid_job_id() {
    let uuid_bytes = vec![0x7d, 0xa8, 0xda, 0x16, 0x69, 0x64, 0x46, 0x5b, 0x92, 0x98, 0xa8, 0x45, 0xa7, 0xfe, 0xc1, 0xbb];
    let frame = encode(&CborValue::Map(vec![(text("job_id"), CborValue::Tag(37, Box::new(CborValue::Bytes(uuid_bytes)))), (text("current_status"), text("completed")), (text("percentage_complete"), CborValue::Integer(100.into()))]));

    let event = MidjourneyWsEvent::from_cbor_frame(&frame).unwrap();
    let MidjourneyWsEvent::Completed { job_id, percentage_complete } = event else {
      panic!("expected Completed, got {event:?}");
    };
    assert_eq!(job_id, "7da8da16-6964-465b-9298-a845a7fec1bb");
    assert_eq!(percentage_complete, 100.0);
  }

  #[test]
  fn decodes_progress_with_images() {
    let jpeg = vec![0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10];
    let frame = encode(&CborValue::Map(vec![(text("current_status"), text("running")), (text("percentage_complete"), CborValue::Float(5.0)), (text("job_id"), text("job-1")), (text("user_id"), text("user-1")), (text("files"), CborValue::Map(vec![(text("0_step_1.jpeg"), CborValue::Bytes(jpeg.clone())), (text("1_step_1.jpeg"), CborValue::Bytes(jpeg.clone()))]))]));

    let event = MidjourneyWsEvent::from_cbor_frame(&frame).unwrap();
    let MidjourneyWsEvent::Progress(progress) = event else {
      panic!("expected Progress, got {event:?}");
    };
    assert_eq!(progress.current_status, "running");
    assert_eq!(progress.percentage_complete, 5.0);
    assert_eq!(progress.images.len(), 2);
    assert_eq!(progress.images[0].image_index, 0);
    assert_eq!(progress.images[1].image_index, 1);
  }

  #[test]
  fn non_map_frame_errors() {
    let frame = encode(&text("nope"));
    assert!(MidjourneyWsEvent::from_cbor_frame(&frame).is_err());
  }
}
