//! Parse **Dreamina** (ByteDance / CapCut consumer app) provenance from an MP4.
//!
//! Unlike the Seedance API (which embeds a Volcengine/BytePlus C2PA manifest),
//! the Dreamina app stamps JSON metadata into the MP4's `moov/udta/meta/ilst`
//! atoms — e.g. `{"product":"dreamina","exportType":"generation",…}`,
//! `{"aigc_label_type":0,"source_info":"dreamina"}`, and a `vid:…` video id.
//! Some Dreamina exports additionally carry a Bytedance-signed C2PA box.
//!
//! Dreamina is ByteDance's consumer product built on the Seedance model family,
//! so this is a distinct provenance shape from [`crate::seedance_info`].

use std::fs;
use std::path::Path;

use crate::error::VideoInfoError;
use crate::scan::{find, find_cert_serial, find_org_identifier, json_int_field, json_str_field};

/// Provenance extracted from a Dreamina (ByteDance/CapCut) video export.
#[derive(Debug, Clone, PartialEq)]
pub struct DreaminaInfo {
  /// The product string, always `"dreamina"`.
  pub product: String,

  /// Export type, e.g. `"generation"`.
  pub export_type: Option<String>,

  /// OS the export was made on (often empty).
  pub os: Option<String>,

  /// `source_info`, e.g. `"dreamina"`.
  pub source_info: Option<String>,

  /// `aigc_label_type` — ByteDance's AIGC labeling flag (e.g. `0`).
  pub aigc_label_type: Option<i64>,

  /// Dreamina video id, e.g. `"v02870g10004d6jktf7og65h7ouce21g"` (the `vid:` tag).
  pub video_id: Option<String>,

  /// Whether the export also carries a (Bytedance-signed) C2PA manifest.
  pub has_c2pa: bool,

  /// Signing-cert organization identifier (when a C2PA box is present), e.g.
  /// `"NTRSG-201923456H"` (Bytedance Pte. Ltd.).
  pub signer_org_id: Option<String>,

  /// Country of the signing org (`"SG"`) when a C2PA box is present.
  pub signer_country: Option<String>,

  /// Leaf signing-cert hex serial when a C2PA box is present.
  pub cert_serial: Option<String>,
}

impl DreaminaInfo {
  /// Parse Dreamina provenance from a file on disk.
  pub fn from_path(path: impl AsRef<Path>) -> Result<DreaminaInfo, VideoInfoError> {
    let bytes = fs::read(path)?;
    Self::from_bytes(&bytes)
  }

  /// Parse Dreamina provenance from raw bytes. Returns
  /// [`VideoInfoError::NotDreamina`] if the Dreamina markers aren't present.
  pub fn from_bytes(data: &[u8]) -> Result<DreaminaInfo, VideoInfoError> {
    let product = json_str_field(data, "product");
    let source_info = json_str_field(data, "source_info");
    let is_dreamina = product.as_deref() == Some("dreamina")
      || source_info.as_deref() == Some("dreamina");
    if !is_dreamina {
      return Err(VideoInfoError::NotDreamina);
    }

    let has_c2pa = find(data, b"jumbf").is_some() || find(data, b"c2pa.claim").is_some();
    let (signer_org_id, signer_country) = if has_c2pa {
      match find_org_identifier(data) {
        Some((id, country)) => (Some(id), Some(country.to_string())),
        None => (None, None),
      }
    } else {
      (None, None)
    };

    Ok(DreaminaInfo {
      product: product.unwrap_or_else(|| "dreamina".to_string()),
      export_type: json_str_field(data, "exportType"),
      os: json_str_field(data, "os"),
      source_info,
      aigc_label_type: json_int_field(data, "aigc_label_type"),
      video_id: find_vid_token(data),
      has_c2pa,
      signer_org_id,
      signer_country,
      cert_serial: if has_c2pa { find_cert_serial(data) } else { None },
    })
  }
}

/// Read the `vid:<id>` token (id is lowercase-alphanumeric).
fn find_vid_token(data: &[u8]) -> Option<String> {
  const PREFIX: &[u8] = b"vid:";
  let i = find(data, PREFIX)?;
  let start = i + PREFIX.len();
  let end = (start..data.len())
    .take_while(|&j| data[j].is_ascii_alphanumeric())
    .last()
    .map(|j| j + 1)?;
  if end == start {
    return None;
  }
  std::str::from_utf8(&data[start..end]).ok().map(str::to_string)
}

#[cfg(test)]
mod tests {
  use super::*;

  fn synth(with_c2pa: bool) -> Vec<u8> {
    let mut v = Vec::new();
    v.extend_from_slice(b"....ftypisom....moov....udta....ilst");
    v.extend_from_slice(br#"{"data":{"os":"","product":"dreamina","exportType":"generation","videoId":"0"}}"#);
    v.extend_from_slice(br#"{"aigc_label_type":0,"source_info":"dreamina"}"#);
    v.extend_from_slice(b"vid:v02870g10004d6jktf7og65h7ouce21g");
    if with_c2pa {
      v.extend_from_slice(b"jumbfc2pa.claim");
      v.extend_from_slice(&[0xA0, 0x03, 0x02, 0x01, 0x02, 0x02, 0x03, 0xAB, 0xCD, 0xEF]);
      v.push(0x13);
      v.push(16);
      v.extend_from_slice(b"NTRSG-201923456H");
      v.push(0x31);
    }
    v
  }

  #[test]
  fn parses_dreamina_no_c2pa() {
    let info = DreaminaInfo::from_bytes(&synth(false)).expect("should parse");
    assert_eq!(info.product, "dreamina");
    assert_eq!(info.export_type.as_deref(), Some("generation"));
    assert_eq!(info.os.as_deref(), Some(""));
    assert_eq!(info.source_info.as_deref(), Some("dreamina"));
    assert_eq!(info.aigc_label_type, Some(0));
    assert_eq!(info.video_id.as_deref(), Some("v02870g10004d6jktf7og65h7ouce21g"));
    assert!(!info.has_c2pa);
    assert_eq!(info.cert_serial, None);
  }

  #[test]
  fn parses_dreamina_with_c2pa() {
    let info = DreaminaInfo::from_bytes(&synth(true)).expect("should parse");
    assert!(info.has_c2pa);
    assert_eq!(info.signer_org_id.as_deref(), Some("NTRSG-201923456H"));
    assert_eq!(info.signer_country.as_deref(), Some("SG"));
    assert_eq!(info.cert_serial.as_deref(), Some("ABCDEF"));
  }

  #[test]
  fn non_dreamina_returns_not_dreamina() {
    let data = b"....ftypisom....just an mp4....";
    assert!(matches!(DreaminaInfo::from_bytes(data), Err(VideoInfoError::NotDreamina)));
  }
}
