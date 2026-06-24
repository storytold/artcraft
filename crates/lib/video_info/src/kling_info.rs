//! Parse **Kling** (Kuaishou) provenance from an MP4.
//!
//! Kling stamps provenance two independent ways, and this parser reads both:
//!
//! 1. **Container AIGC label** — a JSON object in `moov/udta/meta` under the
//!    `AIGC` key, following China's AIGC content-labeling standard (GB 45438):
//!    `{"Label":"1","ContentProducer":"…","ProduceID":"KLingMuse_…",
//!      "ContentPropagator":"…","PropagateID":"KLingMuse_…",
//!      "ReservedCode1":null,"ReservedCode2":null}`.
//!    `Label:"1"` marks AI-generated content; the `001…C10100` codes are the
//!    provider's China registration code; `KLingMuse_…` is Kling's pipeline id.
//!
//! 2. **In-stream watermark** — an H.264 SEI `user_data_unregistered` NAL with a
//!    fixed UUID (`91ca60614aee385486142d5f73f4ae2e`) carrying the bytes
//!    `kling-ai\0`. This survives a re-encode that strips the container metadata,
//!    so a clip can be recognized as Kling from the watermark alone.
//!
//! Note on the **model version** (Kling 1.5 / 1.6 / 2.0 / 2.5 / 2.6, pro / std /
//! fast): it is **not** embedded in either signal. Re-encoded exports (all the
//! samples we have went through `Lavf`) zero the `mvhd` dates and drop any model
//! metadata, leaving only the AIGC label and the watermark — neither of which
//! encodes the version. [`KlingInfo::model_version`] holds it when a clean export
//! does carry a printable `kling-<version>` token, and is `None` otherwise.

use std::fs;
use std::path::Path;

use crate::error::VideoInfoError;
use crate::scan::{find, find_from, json_str_field};

/// The fixed UUID of Kling's SEI `user_data_unregistered` watermark NAL,
/// immediately followed by the ASCII marker `kling-ai`.
const WATERMARK_MARKER: &[u8] = b"kling-ai";

/// Provenance extracted from a Kling (Kuaishou) video.
#[derive(Debug, Clone, PartialEq)]
pub struct KlingInfo {
  /// Kling model version when a clean export embeds a printable `kling-<ver>`
  /// token (e.g. `"2.5-pro"`). `None` for re-encoded exports, which don't carry
  /// it — see the module docs.
  pub model_version: Option<String>,

  /// Whether the content is labeled AI-generated (`Label == "1"`, per GB 45438).
  pub is_ai_generated: bool,

  /// Raw `Label` value (`"1"` = AI-generated).
  pub label: Option<String>,

  /// Content producer registration code — the org/service code that generated it.
  pub content_producer: Option<String>,

  /// Per-generation produce id, e.g. `"KLingMuse_3d917354-4294-47ff-…"`.
  pub produce_id: Option<String>,

  /// Content propagator registration code (who distributed it; usually ==
  /// producer, but can differ — e.g. a `…C20100` distribution channel).
  pub content_propagator: Option<String>,

  /// Per-generation propagate id (usually equal to [`KlingInfo::produce_id`]).
  pub propagate_id: Option<String>,

  /// `ReservedCode1` — reserved by the standard; observed `null` so far.
  pub reserved_code_1: Option<String>,

  /// `ReservedCode2` — reserved by the standard; observed `null` so far.
  pub reserved_code_2: Option<String>,

  /// Whether the in-stream `kling-ai` SEI watermark is present.
  pub has_stream_watermark: bool,

  /// The 16-byte SEI watermark UUID (hex) when the watermark is present,
  /// e.g. `"91ca60614aee385486142d5f73f4ae2e"`.
  pub watermark_uuid: Option<String>,
}

impl KlingInfo {
  /// Parse Kling provenance from a file on disk.
  pub fn from_path(path: impl AsRef<Path>) -> Result<KlingInfo, VideoInfoError> {
    let bytes = fs::read(path)?;
    Self::from_bytes(&bytes)
  }

  /// Parse Kling provenance from raw bytes. Returns [`VideoInfoError::NotKling`]
  /// if neither the AIGC label nor the in-stream watermark is present.
  pub fn from_bytes(data: &[u8]) -> Result<KlingInfo, VideoInfoError> {
    let watermark_uuid = find_watermark_uuid(data);
    let has_stream_watermark = watermark_uuid.is_some() || find(data, WATERMARK_MARKER).is_some();

    let has_aigc_label = find(data, b"KLingMuse").is_some()
      || (find(data, b"\"ContentProducer\"").is_some() && find(data, b"\"Label\"").is_some());
    if !has_aigc_label && !has_stream_watermark {
      return Err(VideoInfoError::NotKling);
    }

    let label = json_str_field(data, "Label");
    Ok(KlingInfo {
      model_version: find_model_version(data),
      is_ai_generated: label.as_deref() == Some("1"),
      label,
      content_producer: json_str_field(data, "ContentProducer"),
      produce_id: json_str_field(data, "ProduceID"),
      content_propagator: json_str_field(data, "ContentPropagator"),
      propagate_id: json_str_field(data, "PropagateID"),
      reserved_code_1: json_str_field(data, "ReservedCode1"),
      reserved_code_2: json_str_field(data, "ReservedCode2"),
      has_stream_watermark,
      watermark_uuid,
    })
  }
}

/// Read the 16-byte UUID immediately preceding the `kling-ai` SEI marker (the
/// SEI `user_data_unregistered` payload is `<16-byte UUID><"kling-ai\0">`).
fn find_watermark_uuid(data: &[u8]) -> Option<String> {
  let i = find(data, WATERMARK_MARKER)?;
  let uuid = data.get(i.checked_sub(16)?..i)?;
  Some(uuid.iter().map(|b| format!("{:02x}", b)).collect())
}

/// Find a printable `kling[-_/ ]v?<major>.<minor>[-<tier>]` model-version token.
///
/// Conservative by design: it requires a real `<digit>.<digit>` after a `kling`
/// prefix, so the watermark marker (`kling-ai`) and the produce id (`KLingMuse_…`)
/// never match. Returns `None` when no such printable token exists.
fn find_model_version(data: &[u8]) -> Option<String> {
  const PREFIX: &[u8] = b"kling";
  const TIERS: [&[u8]; 5] = [b"pro", b"std", b"fast", b"master", b"turbo"];
  let mut from = 0;
  while let Some(i) = find_from(data, PREFIX, from) {
    from = i + PREFIX.len();
    let mut j = from;
    if matches!(data.get(j), Some(b'-' | b'_' | b'/' | b' ')) {
      j += 1;
    }
    if matches!(data.get(j), Some(b'v' | b'V')) {
      j += 1;
    }
    let num_start = j;
    while matches!(data.get(j), Some(c) if c.is_ascii_digit() || *c == b'.') {
      j += 1;
    }
    if j == num_start || !data[num_start..j].contains(&b'.') {
      continue;
    }
    let mut version = String::from_utf8_lossy(&data[num_start..j]).into_owned();
    // Optional `-<tier>` suffix (pro / std / fast / …).
    if data.get(j) == Some(&b'-') {
      for tier in TIERS {
        if data.get(j + 1..j + 1 + tier.len()) == Some(tier) {
          version.push('-');
          version.push_str(&String::from_utf8_lossy(tier));
          break;
        }
      }
    }
    return Some(version);
  }
  None
}

#[cfg(test)]
mod tests {
  use super::*;

  const AIGC_JSON: &[u8] = br#"{"Label":"1","ContentProducer":"001191110108335469089C10100","ProduceID":"KLingMuse_3d917354-4294-47ff-a48e-53f09b0ffee0","ReservedCode1":null,"ContentPropagator":"001191110108335469089C10100","PropagateID":"KLingMuse_3d917354-4294-47ff-a48e-53f09b0ffee0","ReservedCode2":null}"#;

  fn with_watermark() -> Vec<u8> {
    let mut v = Vec::new();
    v.extend_from_slice(b"....mdat....");
    // SEI: type 6, payload 5, len 0x19, 16-byte UUID, then "kling-ai\0".
    v.extend_from_slice(&[0x06, 0x05, 0x19]);
    v.extend_from_slice(&[
      0x91, 0xca, 0x60, 0x61, 0x4a, 0xee, 0x38, 0x54, 0x86, 0x14, 0x2d, 0x5f, 0x73, 0xf4, 0xae,
      0x2e,
    ]);
    v.extend_from_slice(b"kling-ai\0");
    v
  }

  #[test]
  fn parses_aigc_label() {
    let mut data = b"....ftypisom....moov....udta....ilst".to_vec();
    data.extend_from_slice(AIGC_JSON);
    let info = KlingInfo::from_bytes(&data).expect("should parse");
    assert!(info.is_ai_generated);
    assert_eq!(info.label.as_deref(), Some("1"));
    assert_eq!(info.content_producer.as_deref(), Some("001191110108335469089C10100"));
    assert_eq!(info.produce_id.as_deref(), Some("KLingMuse_3d917354-4294-47ff-a48e-53f09b0ffee0"));
    assert_eq!(info.content_propagator.as_deref(), Some("001191110108335469089C10100"));
    assert_eq!(info.propagate_id.as_deref(), Some("KLingMuse_3d917354-4294-47ff-a48e-53f09b0ffee0"));
    assert_eq!(info.reserved_code_1, None);
    assert_eq!(info.reserved_code_2, None);
    assert_eq!(info.model_version, None);
    assert!(!info.has_stream_watermark);
  }

  #[test]
  fn detects_watermark_when_aigc_stripped() {
    // A re-encoded Kling clip: no AIGC JSON, only the in-stream SEI watermark.
    let info = KlingInfo::from_bytes(&with_watermark()).expect("should parse via watermark");
    assert!(info.has_stream_watermark);
    assert_eq!(info.watermark_uuid.as_deref(), Some("91ca60614aee385486142d5f73f4ae2e"));
    assert_eq!(info.label, None);
    assert_eq!(info.produce_id, None);
    assert!(!info.is_ai_generated);
  }

  #[test]
  fn reads_both_signals_together() {
    let mut data = b"....ftypisom....ilst".to_vec();
    data.extend_from_slice(AIGC_JSON);
    data.extend_from_slice(&with_watermark());
    let info = KlingInfo::from_bytes(&data).expect("should parse");
    assert!(info.is_ai_generated);
    assert!(info.has_stream_watermark);
    assert_eq!(info.watermark_uuid.as_deref(), Some("91ca60614aee385486142d5f73f4ae2e"));
  }

  #[test]
  fn extracts_model_version_from_clean_token() {
    // A hypothetical clean export carrying a printable model token.
    let data = b"....moov....model:kling-2.5-pro....mdat....";
    let info = KlingInfo::from_bytes(data);
    // No AIGC/watermark here, so it won't classify as Kling, but the version
    // extractor itself should recognize the token.
    assert_eq!(find_model_version(data).as_deref(), Some("2.5-pro"));
    assert!(matches!(info, Err(VideoInfoError::NotKling)));
  }

  #[test]
  fn watermark_marker_is_not_a_version() {
    // `kling-ai` must not be misread as a version.
    assert_eq!(find_model_version(&with_watermark()), None);
  }

  #[test]
  fn non_kling_returns_not_kling() {
    let data = b"....ftypisom....just an mp4....";
    assert!(matches!(KlingInfo::from_bytes(data), Err(VideoInfoError::NotKling)));
  }
}
