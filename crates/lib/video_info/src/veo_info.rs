//! Parse Google **Veo** (Google Generative AI video) provenance out of an MP4.
//!
//! Like Seedance, Veo embeds a [C2PA](https://c2pa.org/) manifest as a JUMBF box.
//! Unlike Seedance, the manifest does **not** carry an explicit model name —
//! origin is established by the Google C2PA signer chain (`pki.goog`), the
//! `encoder=Google` tag, and the `c2pa.created` action description
//! "Created by Google Generative AI." A second `c2pa.edited` action records the
//! "Applied imperceptible SynthID watermark." step (Google DeepMind's SynthID).
//!
//! So "the model is Veo" is an inference from "Google-generated video" — we
//! surface every Google/C2PA field we can and leave model name `None` because it
//! genuinely isn't in the metadata.

use std::fs;
use std::path::Path;

use crate::error::VideoInfoError;
use crate::scan::{
  find, find_cert_serial, find_encoder_tag, find_prefixed_uuid, read_der_string, text_after_key,
};

// ── Detection markers ──

/// The generative `c2pa.created` action description Google stamps.
const CREATED_BY_GOOGLE: &[u8] = b"Created by Google Generative AI";
/// Google's C2PA signer infrastructure (cert CN / ICA names).
const GOOGLE_C2PA_MARKER: &[u8] = b"Google C2PA";
/// The SynthID watermark edit description.
const SYNTHID_MARKER: &[u8] = b"SynthID watermark";
/// Prefix of the issuing intermediate-CA CN that signs Veo manifests.
const SIGNER_CA_PREFIX: &[u8] = b"Google C2PA Media Services";
/// Prefix of the RFC 3161 time-stamping CA CN.
const TIMESTAMP_CA_PREFIX: &[u8] = b"Google C2PA Core Time-Stamping";
/// The bare `©too` encoder value Google stamps on Veo/Flow exports — survives a
/// re-encode that strips the C2PA box, so it's a weaker fallback signal.
const GOOGLE_ENCODER: &str = "Google";

/// Provenance extracted from a Google Veo (Google Generative AI) video.
#[derive(Debug, Clone, PartialEq)]
pub struct VeoInfo {
  /// Always `"Google"` — the producer established by the signer chain + encoder.
  pub producer: String,

  /// Whether a full Google C2PA manifest is present. `false` means the video was
  /// recognized only by its `encoder=Google` tag (C2PA likely stripped by a
  /// re-encode) — all the C2PA fields below will be `None`.
  pub has_c2pa_manifest: bool,

  /// The `©too` encoder atom value, e.g. `"Google"`.
  pub encoder: Option<String>,

  /// The `c2pa.created` action description, e.g. `"Created by Google Generative AI."`.
  pub created_description: Option<String>,

  /// Whether a SynthID watermark edit action is present (Google DeepMind's
  /// imperceptible watermark — applied to all Veo output).
  pub has_synthid_watermark: bool,

  /// The SynthID edit description, e.g. `"Applied imperceptible SynthID watermark."`.
  pub synthid_description: Option<String>,

  /// IPTC digital source type URL — trained-algorithmic-media for these.
  pub digital_source_type: Option<String>,

  /// C2PA claim generator, e.g. `"Google C2PA Core Generator Library"`.
  pub claim_generator: Option<String>,

  /// C2PA claim generator version, e.g. `"929410399:929410399"`.
  pub claim_generator_version: Option<String>,

  /// The manifest URN, e.g. `"urn:c2pa:a6b2b914-8d34-c7f1-717f-4c622328d8f0"`.
  pub manifest_id: Option<String>,

  /// The per-asset instance id (bare UUID; Veo does not prefix it with `xmp:iid:`).
  pub instance_id: Option<String>,

  /// Hex serial number of the leaf signing certificate (Google's `pki.goog`),
  /// e.g. `"E2139E2DAA977AC13E775A1CBD006D32BF4ACB"`.
  pub cert_serial: Option<String>,

  /// Issuing intermediate-CA common name, e.g.
  /// `"Google C2PA Media Services 1P ICA G3"` — identifies Google's signing path.
  pub signer_ca: Option<String>,

  /// Whether the manifest carries an RFC 3161 trusted timestamp (a
  /// `Google C2PA Core Time-Stamping` authority is present in the chain).
  pub is_timestamped: bool,

  /// The time-stamping authority CN when present, e.g.
  /// `"Google C2PA Core Time-Stamping ICA G3"`.
  pub timestamp_authority: Option<String>,
}

impl VeoInfo {
  /// Parse Veo provenance from a video file on disk.
  pub fn from_path(path: impl AsRef<Path>) -> Result<VeoInfo, VideoInfoError> {
    let bytes = fs::read(path)?;
    Self::from_bytes(&bytes)
  }

  /// Parse Veo provenance from raw video bytes.
  ///
  /// Returns [`VideoInfoError::NotVeo`] if no Google generative C2PA manifest is
  /// present.
  pub fn from_bytes(data: &[u8]) -> Result<VeoInfo, VideoInfoError> {
    let has_c2pa_manifest =
      find(data, CREATED_BY_GOOGLE).is_some() || find(data, GOOGLE_C2PA_MARKER).is_some();
    let encoder = find_encoder_tag(data);
    let encoder_is_google = encoder.as_deref() == Some(GOOGLE_ENCODER);
    if !has_c2pa_manifest && !encoder_is_google {
      return Err(VideoInfoError::NotVeo);
    }

    // The created/edited descriptions follow the CBOR `description` key; there
    // are two `description` values (created, edited) and order can vary, so read
    // by matching the leading text rather than positional assumptions.
    let created_description = find_description_containing(data, b"Created by");
    let synthid_description = find_description_containing(data, b"SynthID");
    let has_synthid_watermark =
      synthid_description.is_some() || find(data, SYNTHID_MARKER).is_some();

    let claim_generator = text_after_key(data, b"claim_generator_info")
      .or_else(|| find(data, b"Google C2PA Core Generator Library").map(|_| {
        "Google C2PA Core Generator Library".to_string()
      }));
    let claim_generator_version = find(data, b"Google C2PA Core Generator Library")
      .and_then(|i| {
        crate::scan::text_after_key_from(data, b"version", i + "Google C2PA Core Generator Library".len())
      });

    Ok(VeoInfo {
      producer: "Google".to_string(),
      has_c2pa_manifest,
      encoder,
      created_description,
      has_synthid_watermark,
      synthid_description,
      digital_source_type: text_after_key(data, b"digitalSourceType"),
      claim_generator,
      claim_generator_version,
      manifest_id: find_prefixed_uuid(data, b"urn:c2pa:"),
      instance_id: text_after_key(data, b"instanceID"),
      cert_serial: find_cert_serial(data),
      signer_ca: read_der_string(data, SIGNER_CA_PREFIX),
      is_timestamped: find(data, TIMESTAMP_CA_PREFIX).is_some(),
      timestamp_authority: read_der_string(data, TIMESTAMP_CA_PREFIX),
    })
  }
}

/// Find a CBOR `description` value whose text begins with `needle`. There can be
/// several descriptions in the manifest (one per action); this returns the one
/// starting with the given text.
fn find_description_containing(data: &[u8], needle: &[u8]) -> Option<String> {
  let mut from = 0;
  while let Some(i) = crate::scan::find_from(data, b"description", from) {
    if let Some(text) = crate::scan::read_cbor_text(data, i + b"description".len()) {
      if text.as_bytes().windows(needle.len()).any(|w| w == needle) {
        return Some(text);
      }
    }
    from = i + b"description".len();
  }
  None
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::scan::push_cbor_text as push_text;

  fn synth_veo() -> Vec<u8> {
    let mut v = Vec::new();
    v.extend_from_slice(b"....ftypisom....moov....c2pa");
    // X.509 v3 serial prefix.
    v.extend_from_slice(&[0xA0, 0x03, 0x02, 0x01, 0x02, 0x02, 0x03, 0xE2, 0x13, 0x9E]);
    // DER length-prefixed issuer + time-stamping CA CNs (length byte precedes).
    let signer_ca = b"Google C2PA Media Services 1P ICA G3";
    v.push(signer_ca.len() as u8);
    v.extend_from_slice(signer_ca);
    let ts_ca = b"Google C2PA Core Time-Stamping ICA G3";
    v.push(ts_ca.len() as u8);
    v.extend_from_slice(ts_ca);
    v.extend_from_slice(b"urn:c2pa:a6b2b914-8d34-c7f1-717f-4c622328d8f0");
    v.extend_from_slice(b"c2pa.createdkdescription");
    push_text(&mut v, "Created by Google Generative AI.");
    v.extend_from_slice(b"qdigitalSourceType");
    push_text(&mut v, "http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia");
    v.extend_from_slice(b"c2pa.editedkdescription");
    push_text(&mut v, "Applied imperceptible SynthID watermark.");
    v.extend_from_slice(b"jinstanceID");
    push_text(&mut v, "e9738dbe-1dbb-9b61-516c-46a64daa7499");
    v.extend_from_slice(b"dnamex\"Google C2PA Core Generator Librarygversion");
    push_text(&mut v, "929410399:929410399");
    v
  }

  #[test]
  fn parses_veo_manifest() {
    let info = VeoInfo::from_bytes(&synth_veo()).expect("should parse");
    assert_eq!(info.producer, "Google");
    assert!(info.has_c2pa_manifest);
    assert_eq!(info.created_description.as_deref(), Some("Created by Google Generative AI."));
    assert!(info.has_synthid_watermark);
    assert_eq!(info.synthid_description.as_deref(), Some("Applied imperceptible SynthID watermark."));
    assert_eq!(info.claim_generator.as_deref(), Some("Google C2PA Core Generator Library"));
    assert_eq!(info.claim_generator_version.as_deref(), Some("929410399:929410399"));
    assert_eq!(info.manifest_id.as_deref(), Some("urn:c2pa:a6b2b914-8d34-c7f1-717f-4c622328d8f0"));
    assert_eq!(info.instance_id.as_deref(), Some("e9738dbe-1dbb-9b61-516c-46a64daa7499"));
    assert_eq!(info.cert_serial.as_deref(), Some("E2139E"));
    assert_eq!(info.signer_ca.as_deref(), Some("Google C2PA Media Services 1P ICA G3"));
    assert!(info.is_timestamped);
    assert_eq!(info.timestamp_authority.as_deref(), Some("Google C2PA Core Time-Stamping ICA G3"));
    assert!(info.digital_source_type.as_deref().unwrap().contains("trainedAlgorithmicMedia"));
  }

  #[test]
  fn detects_veo_by_encoder_tag_when_c2pa_stripped() {
    // A re-encoded Veo: no C2PA manifest, but the `©too` encoder atom is "Google".
    let mut v = Vec::new();
    v.extend_from_slice(b"....ftypisom....moov....udta....meta....ilst");
    v.extend_from_slice(&[0xA9, b't', b'o', b'o']);
    v.extend_from_slice(b"....data");
    v.extend_from_slice(&[0, 0, 0, 1, 0, 0, 0, 0]); // version/flags + reserved
    v.extend_from_slice(b"Google");
    let info = VeoInfo::from_bytes(&v).expect("should parse via encoder tag");
    assert_eq!(info.producer, "Google");
    assert!(!info.has_c2pa_manifest);
    assert_eq!(info.encoder.as_deref(), Some("Google"));
    assert_eq!(info.cert_serial, None);
    assert_eq!(info.signer_ca, None);
    assert!(!info.is_timestamped);
  }

  #[test]
  fn non_google_returns_not_veo() {
    let data = b"....ftypisom....Volcengine_Ark_CN doubao-seedance-2-0....";
    assert!(matches!(VeoInfo::from_bytes(data), Err(VideoInfoError::NotVeo)));
  }
}
