//! Parse **Kling** (Kuaishou) provenance from an MP4.
//!
//! Kling exports carry no C2PA manifest; instead they stamp a Chinese-AIGC-label
//! JSON object into the MP4's `moov/udta/meta/ilst` atoms, e.g.:
//! `{"Label":"1","ContentProducer":"001191110108335469089C10100",
//!   "ProduceID":"KLingMuse_3d917354-…","ContentPropagator":"…",
//!   "PropagateID":"KLingMuse_…"}`.
//!
//! The `Label`/`Producer`/`Propagator` shape follows China's AIGC content-labeling
//! standard (GB 45438-2025); `KLingMuse_…` marks it as Kling's pipeline.

use std::fs;
use std::path::Path;

use crate::error::VideoInfoError;
use crate::scan::{find, json_str_field};

/// Provenance extracted from a Kling (Kuaishou) video export.
#[derive(Debug, Clone, PartialEq)]
pub struct KlingInfo {
  /// AIGC label flag (`"1"` = AI-generated, per China's labeling standard).
  pub label: Option<String>,

  /// Content producer identifier — the org/service code that generated the video.
  pub content_producer: Option<String>,

  /// Per-generation produce id, e.g. `"KLingMuse_3d917354-4294-47ff-…"`.
  pub produce_id: Option<String>,

  /// Content propagator identifier (who distributed it; often == producer).
  pub content_propagator: Option<String>,

  /// Per-generation propagate id, e.g. `"KLingMuse_3d917354-…"`.
  pub propagate_id: Option<String>,
}

impl KlingInfo {
  /// Parse Kling provenance from a file on disk.
  pub fn from_path(path: impl AsRef<Path>) -> Result<KlingInfo, VideoInfoError> {
    let bytes = fs::read(path)?;
    Self::from_bytes(&bytes)
  }

  /// Parse Kling provenance from raw bytes. Returns [`VideoInfoError::NotKling`]
  /// if the Kling markers aren't present.
  pub fn from_bytes(data: &[u8]) -> Result<KlingInfo, VideoInfoError> {
    let produce_id = json_str_field(data, "ProduceID");
    let propagate_id = json_str_field(data, "PropagateID");
    let is_kling = find(data, b"KLingMuse").is_some()
      || (find(data, b"\"ContentProducer\"").is_some() && find(data, b"\"Label\"").is_some());
    if !is_kling {
      return Err(VideoInfoError::NotKling);
    }

    Ok(KlingInfo {
      label: json_str_field(data, "Label"),
      content_producer: json_str_field(data, "ContentProducer"),
      produce_id,
      content_propagator: json_str_field(data, "ContentPropagator"),
      propagate_id,
    })
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn synth() -> Vec<u8> {
    let mut v = Vec::new();
    v.extend_from_slice(b"....ftypisom....moov....udta....ilst");
    v.extend_from_slice(
      br#"{"Label":"1","ContentProducer":"001191110108335469089C10100","ProduceID":"KLingMuse_3d917354-4294-47ff-a48e-53f09b0ffee0","ReservedCode1":null,"ContentPropagator":"001191110108335469089C10100","PropagateID":"KLingMuse_3d917354-4294-47ff-a48e-53f09b0ffee0","ReservedCode2":null}"#,
    );
    v
  }

  #[test]
  fn parses_kling() {
    let info = KlingInfo::from_bytes(&synth()).expect("should parse");
    assert_eq!(info.label.as_deref(), Some("1"));
    assert_eq!(info.content_producer.as_deref(), Some("001191110108335469089C10100"));
    assert_eq!(info.produce_id.as_deref(), Some("KLingMuse_3d917354-4294-47ff-a48e-53f09b0ffee0"));
    assert_eq!(info.content_propagator.as_deref(), Some("001191110108335469089C10100"));
    assert_eq!(info.propagate_id.as_deref(), Some("KLingMuse_3d917354-4294-47ff-a48e-53f09b0ffee0"));
  }

  #[test]
  fn non_kling_returns_not_kling() {
    let data = b"....ftypisom....just an mp4....";
    assert!(matches!(KlingInfo::from_bytes(data), Err(VideoInfoError::NotKling)));
  }
}
