//! Parse Seedance (ByteDance) generation provenance out of an MP4.
//!
//! Seedance videos carry a [C2PA](https://c2pa.org/) manifest embedded as a
//! JUMBF box. Inside is a CBOR `c2pa.created` action whose `softwareAgent`
//! identifies the generating platform (Volcengine vs BytePlus), the model, the
//! generation timestamp, and an opaque generation `log_id`.
//!
//! Rather than fully decode JUMBF + CBOR (which would require pulling in a C2PA
//! stack), we scan for the small, stable set of CBOR text fields we care about.
//! The values are CBOR text strings (major type 3) immediately following their
//! key, so each is recovered by locating the key and reading the text string.

use std::fs;
use std::path::Path;

use chrono::{DateTime, Utc};

use crate::error::VideoInfoError;

// ── Markers in the embedded C2PA manifest ──

const VENDOR_VOLCENGINE: &[u8] = b"Volcengine_Ark_CN";
const VENDOR_BYTEPLUS: &[u8] = b"BytePlus_ModelArk";

/// The platform that produced a Seedance generation. The two share the same
/// underlying model family but are operated as separate products / regions
/// (Volcengine = ByteDance China "Doubao"/Ark; BytePlus = international "Dreamina").
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SeedancePlatform {
  /// `Volcengine_Ark_CN`, signed by `…@volcengine.com`.
  Volcengine,
  /// `BytePlus_ModelArk`, signed by `Byteplus Pte. Ltd.` (`…@byteplus.com`).
  BytePlus,
}

impl SeedancePlatform {
  pub fn as_str(&self) -> &'static str {
    match self {
      Self::Volcengine => "volcengine",
      Self::BytePlus => "byteplus",
    }
  }
}

/// Provenance extracted from a Seedance video's embedded C2PA manifest.
#[derive(Debug, Clone, PartialEq)]
pub struct SeedanceInfo {
  /// Volcengine vs BytePlus.
  pub platform: SeedancePlatform,

  /// The C2PA `softwareAgent` name, e.g. `"Volcengine_Ark_CN"` / `"BytePlus_ModelArk"`.
  pub software_agent: String,

  /// The `softwareAgent` version, e.g. `"1.0.0"`.
  pub software_agent_version: Option<String>,

  /// Full model identifier, e.g. `"doubao-seedance-2-0-fast"`,
  /// `"doubao-seedance-2-0"`, `"dreamina-seedance-2-0"`.
  pub model_name: String,

  /// Brand prefix of the model, e.g. `"doubao"` (Volcengine) / `"dreamina"` (BytePlus).
  pub model_brand: Option<String>,

  /// Model version parsed from the name, e.g. `"2.0"` (from `…-2-0`).
  pub model_version: Option<String>,

  /// Whether this is the `-fast` variant of the model.
  pub is_fast: bool,

  /// Raw generation timestamp string (RFC 3339, e.g. `"2026-06-19T01:32:58Z"`).
  pub generated_at: String,

  /// Parsed [`generated_at`](Self::generated_at), when it is valid RFC 3339.
  pub generated_at_utc: Option<DateTime<Utc>>,

  /// Per-generation log / request id, base64url-encoded
  /// (e.g. `"ATIAA7b8D_iKjF32GukAAAAA"`).
  pub log_id: Option<String>,

  /// [`log_id`](Self::log_id) base64url-decoded to hex (18 bytes). It is a
  /// structured id: byte 0 = version (`01`), byte 1 = region/platform
  /// (`0x32` = Volcengine, `0x33` = BytePlus), bytes 2–3 constant (`0003`),
  /// bytes 4–13 a per-generation value, bytes 14–17 zero padding. The region
  /// byte independently corroborates [`platform`](Self::platform).
  pub log_id_decoded_hex: Option<String>,

  /// IPTC digital source type URL — always trained-algorithmic-media for these.
  pub digital_source_type: Option<String>,

  /// C2PA claim generator, e.g. `"c2pa-rs"`.
  pub claim_generator: Option<String>,

  /// C2PA claim generator version, e.g. `"0.78.4"`.
  pub claim_generator_version: Option<String>,

  /// The manifest URN, e.g. `"urn:c2pa:40a5f6fe-b88a-4a2c-ae72-f76a1e5a6012"`.
  /// Identifies the manifest; not a stable per-asset identity.
  pub manifest_id: Option<String>,

  /// The XMP asset instance id, e.g. `"xmp:iid:95a3ac67-cb28-4a0d-ac54-911f1787b7de"`.
  /// Unique per generated asset (distinct from [`manifest_id`](Self::manifest_id)).
  pub instance_id: Option<String>,

  /// Signing certificate email, e.g. `"certificate_center@volcengine.com"`.
  pub signer_email: Option<String>,

  /// Signing certificate organization identifier (X.509 OID 2.5.4.97), e.g.
  /// `"NTRSG-202024632W"` (Byteplus Pte. Ltd., Singapore) or
  /// `"NTRCN-91110108MA01R70K8D"` (Beijing Volcano Engine, China). The `NTRxx`
  /// scheme prefix is itself a strong jurisdiction signal.
  pub signer_org_id: Option<String>,

  /// Two-letter country of the signing organization, derived from the org
  /// identifier scheme (`"SG"` for BytePlus, `"CN"` for Volcengine).
  pub signer_country: Option<String>,

  /// Hex serial number of the leaf signing certificate, e.g.
  /// `"3687D48590A2FD5101AB0316"`. Stable per signing certificate (Volcengine
  /// and BytePlus each reuse one), so it identifies the signer across assets —
  /// useful for grouping/auditing, not as a per-asset id.
  pub cert_serial: Option<String>,
}

impl SeedanceInfo {
  /// Parse Seedance provenance from a video file on disk.
  pub fn from_path(path: impl AsRef<Path>) -> Result<SeedanceInfo, VideoInfoError> {
    let bytes = fs::read(path)?;
    Self::from_bytes(&bytes)
  }

  /// Parse Seedance provenance from raw video bytes.
  ///
  /// Returns [`VideoInfoError::NotSeedance`] if no Seedance/C2PA generative
  /// manifest is present, or [`VideoInfoError::MalformedManifest`] if the
  /// manifest is present but a required field can't be read.
  pub fn from_bytes(data: &[u8]) -> Result<SeedanceInfo, VideoInfoError> {
    let (platform, vendor_marker) = if let Some(_) = find(data, VENDOR_VOLCENGINE) {
      (SeedancePlatform::Volcengine, VENDOR_VOLCENGINE)
    } else if let Some(_) = find(data, VENDOR_BYTEPLUS) {
      (SeedancePlatform::BytePlus, VENDOR_BYTEPLUS)
    } else {
      return Err(VideoInfoError::NotSeedance);
    };

    let software_agent = String::from_utf8_lossy(vendor_marker).into_owned();
    let vendor_end = find(data, vendor_marker).map(|i| i + vendor_marker.len()).unwrap_or(0);

    // model_name is required for a meaningful Seedance manifest.
    let model_name = text_after_key(data, b"model_name")
      .ok_or_else(|| VideoInfoError::MalformedManifest("missing model_name".to_string()))?;

    if !model_name.contains("seedance") {
      // The vendor marker is present but the model isn't Seedance — treat as
      // "not a Seedance generation" rather than a parse failure.
      return Err(VideoInfoError::NotSeedance);
    }

    let generated_at = find_rfc3339(data)
      .ok_or_else(|| VideoInfoError::MalformedManifest("missing generation timestamp".to_string()))?;
    let generated_at_utc = DateTime::parse_from_rfc3339(&generated_at)
      .ok()
      .map(|dt| dt.with_timezone(&Utc));

    let (model_brand, model_version, is_fast) = parse_model_name(&model_name);

    let log_id = text_after_key(data, b"log_id");
    let log_id_decoded_hex = log_id
      .as_deref()
      .and_then(decode_base64url)
      .map(|bytes| bytes.iter().map(|b| format!("{:02x}", b)).collect::<String>());

    let software_agent_version = text_after_key_from(data, b"version", vendor_end);

    let claim_generator = find(data, b"c2pa-rs").map(|_| "c2pa-rs".to_string());
    let claim_generator_version = find(data, b"c2pa-rs")
      .and_then(|i| text_after_key_from(data, b"version", i + b"c2pa-rs".len()));

    let (signer_org_id, signer_country) = match find_org_identifier(data) {
      Some((org_id, country)) => (Some(org_id), Some(country.to_string())),
      None => (None, None),
    };

    Ok(SeedanceInfo {
      platform,
      software_agent,
      software_agent_version,
      model_name,
      model_brand,
      model_version,
      is_fast,
      generated_at,
      generated_at_utc,
      log_id,
      log_id_decoded_hex,
      digital_source_type: text_after_key(data, b"digitalSourceType"),
      claim_generator,
      claim_generator_version,
      manifest_id: find_manifest_urn(data),
      instance_id: find_xmp_iid(data),
      signer_email: find_signer_email(data),
      signer_org_id,
      signer_country,
      cert_serial: find_cert_serial(data),
    })
  }
}

// ── Model name parsing ──

/// Split `"{brand}-seedance-{maj}-{min}[-fast]"` into (brand, version, is_fast).
/// e.g. `"doubao-seedance-2-0-fast"` → (`"doubao"`, `"2.0"`, `true`).
fn parse_model_name(model_name: &str) -> (Option<String>, Option<String>, bool) {
  let is_fast = model_name.ends_with("-fast");
  let core = model_name.strip_suffix("-fast").unwrap_or(model_name);

  let brand = core.split("-seedance").next()
    .filter(|s| !s.is_empty() && *s != core)
    .map(|s| s.to_string());

  let version = core.split("seedance-").nth(1)
    .filter(|v| !v.is_empty())
    // "2-0" → "2.0"
    .map(|v| v.replace('-', "."));

  (brand, version, is_fast)
}

// ── CBOR text-string extraction ──

/// Read a CBOR text string (major type 3) starting at `at`. Supports inline
/// length (0x60–0x77), 1-byte length (0x78), and 2-byte length (0x79).
fn read_cbor_text(data: &[u8], at: usize) -> Option<String> {
  let first = *data.get(at)?;
  let (len, value_offset) = match first {
    0x60..=0x77 => ((first - 0x60) as usize, 1),
    0x78 => (*data.get(at + 1)? as usize, 2),
    0x79 => {
      let hi = *data.get(at + 1)? as usize;
      let lo = *data.get(at + 2)? as usize;
      ((hi << 8) | lo, 3)
    }
    _ => return None,
  };
  let start = at + value_offset;
  let bytes = data.get(start..start + len)?;
  String::from_utf8(bytes.to_vec()).ok()
}

/// Find `key` and read the CBOR text string immediately following it.
fn text_after_key(data: &[u8], key: &[u8]) -> Option<String> {
  let idx = find(data, key)?;
  read_cbor_text(data, idx + key.len())
}

/// Like [`text_after_key`] but only searches at/after `start`.
fn text_after_key_from(data: &[u8], key: &[u8], start: usize) -> Option<String> {
  let idx = find_from(data, key, start)?;
  read_cbor_text(data, idx + key.len())
}

// ── Targeted scanners ──

/// First RFC 3339 `YYYY-MM-DDTHH:MM:SSZ` (20 chars) timestamp in the buffer.
fn find_rfc3339(data: &[u8]) -> Option<String> {
  const LEN: usize = 20;
  data.windows(LEN).find(|w| is_rfc3339(w)).map(|w| String::from_utf8_lossy(w).into_owned())
}

fn is_rfc3339(w: &[u8]) -> bool {
  // YYYY-MM-DDTHH:MM:SSZ
  let d = |i: usize| w[i].is_ascii_digit();
  w.len() == 20
    && d(0) && d(1) && d(2) && d(3) && w[4] == b'-'
    && d(5) && d(6) && w[7] == b'-'
    && d(8) && d(9) && w[10] == b'T'
    && d(11) && d(12) && w[13] == b':'
    && d(14) && d(15) && w[16] == b':'
    && d(17) && d(18) && w[19] == b'Z'
}

/// `urn:c2pa:<uuid>` — the manifest identifier.
fn find_manifest_urn(data: &[u8]) -> Option<String> {
  const PREFIX: &[u8] = b"urn:c2pa:";
  let i = find(data, PREFIX)?;
  let start = i + PREFIX.len();
  // UUID is 36 chars of hex + dashes.
  let end = (start..data.len().min(start + 36))
    .take_while(|&j| data[j].is_ascii_hexdigit() || data[j] == b'-')
    .last()
    .map(|j| j + 1)?;
  let uuid = std::str::from_utf8(&data[start..end]).ok()?;
  Some(format!("urn:c2pa:{}", uuid))
}

/// `xmp:iid:<uuid>` — the per-asset instance identifier.
fn find_xmp_iid(data: &[u8]) -> Option<String> {
  const PREFIX: &[u8] = b"xmp:iid:";
  let i = find(data, PREFIX)?;
  let start = i + PREFIX.len();
  let end = (start..data.len().min(start + 36))
    .take_while(|&j| data[j].is_ascii_hexdigit() || data[j] == b'-')
    .last()
    .map(|j| j + 1)?;
  let uuid = std::str::from_utf8(&data[start..end]).ok()?;
  Some(format!("xmp:iid:{}", uuid))
}

/// Signing certificate email (`…@volcengine.com` / `…@byteplus.com`), recovered
/// by finding the domain and walking back over the local part.
fn find_signer_email(data: &[u8]) -> Option<String> {
  for domain in [b"@volcengine.com".as_slice(), b"@byteplus.com".as_slice()] {
    if let Some(at) = find(data, domain) {
      let mut start = at;
      while start > 0 {
        let c = data[start - 1];
        if c.is_ascii_alphanumeric() || matches!(c, b'.' | b'_' | b'%' | b'+' | b'-') {
          start -= 1;
        } else {
          break;
        }
      }
      let end = at + domain.len();
      if let Ok(email) = std::str::from_utf8(&data[start..end]) {
        if email.starts_with(|c: char| c.is_ascii_alphanumeric()) {
          return Some(email.to_string());
        }
      }
    }
  }
  None
}

/// The X.509 organization identifier (OID 2.5.4.97) from the signing cert, plus
/// the country implied by its registration scheme. The value is a DER string
/// whose length byte immediately precedes it, so we read exactly that many bytes
/// (avoids running past the value into the next DER element).
fn find_org_identifier(data: &[u8]) -> Option<(String, &'static str)> {
  for (prefix, country) in [(b"NTRSG-".as_slice(), "SG"), (b"NTRCN-".as_slice(), "CN")] {
    let Some(start) = find(data, prefix) else { continue };
    if start == 0 {
      continue;
    }
    let len = data[start - 1] as usize;
    if len < prefix.len() || len > 40 {
      continue;
    }
    let Some(bytes) = data.get(start..start + len) else { continue };
    if bytes.iter().all(|b| b.is_ascii_graphic()) {
      if let Ok(value) = std::str::from_utf8(bytes) {
        return Some((value.to_string(), country));
      }
    }
  }
  None
}

/// Hex serial number of the leaf signing certificate.
///
/// X.509 v3 certs encode the TBS prefix as `A0 03 02 01 02` (the `[0] EXPLICIT`
/// version = v3) immediately followed by the serial `INTEGER` (`02 <len> <bytes>`).
/// That fixed prefix lets us read the serial without a full DER parser; the leaf
/// cert is the first such occurrence.
fn find_cert_serial(data: &[u8]) -> Option<String> {
  const TBS_VERSION_PREFIX: &[u8] = &[0xA0, 0x03, 0x02, 0x01, 0x02, 0x02];
  let i = find(data, TBS_VERSION_PREFIX)?;
  let len_pos = i + TBS_VERSION_PREFIX.len();
  let len = *data.get(len_pos)? as usize;
  if len == 0 || len > 40 {
    return None;
  }
  let start = len_pos + 1;
  let bytes = data.get(start..start + len)?;
  Some(bytes.iter().map(|b| format!("{:02X}", b)).collect())
}

/// Minimal base64url (RFC 4648 §5) decoder — no external dependency. Ignores
/// `=` padding; returns `None` on any invalid character.
fn decode_base64url(input: &str) -> Option<Vec<u8>> {
  fn sextet(c: u8) -> Option<u8> {
    match c {
      b'A'..=b'Z' => Some(c - b'A'),
      b'a'..=b'z' => Some(c - b'a' + 26),
      b'0'..=b'9' => Some(c - b'0' + 52),
      b'-' => Some(62),
      b'_' => Some(63),
      _ => None,
    }
  }
  let chars: Vec<u8> = input.bytes().filter(|&b| b != b'=').collect();
  let mut out = Vec::with_capacity(chars.len() * 3 / 4);
  for chunk in chars.chunks(4) {
    let mut buf = [0u8; 4];
    for (i, &c) in chunk.iter().enumerate() {
      buf[i] = sextet(c)?;
    }
    out.push((buf[0] << 2) | (buf[1] >> 4));
    if chunk.len() >= 3 {
      out.push((buf[1] << 4) | (buf[2] >> 2));
    }
    if chunk.len() >= 4 {
      out.push((buf[2] << 6) | buf[3]);
    }
  }
  Some(out)
}

// ── Byte search ──

fn find(haystack: &[u8], needle: &[u8]) -> Option<usize> {
  find_from(haystack, needle, 0)
}

fn find_from(haystack: &[u8], needle: &[u8], start: usize) -> Option<usize> {
  if needle.is_empty() || start >= haystack.len() || needle.len() > haystack.len() - start {
    return None;
  }
  haystack[start..]
    .windows(needle.len())
    .position(|w| w == needle)
    .map(|p| p + start)
}

#[cfg(test)]
mod tests {
  use super::*;

  // ── Helpers to synthesize a minimal C2PA-like manifest ──

  fn push_text(buf: &mut Vec<u8>, s: &str) {
    let b = s.as_bytes();
    if b.len() <= 0x17 {
      buf.push(0x60 + b.len() as u8);
    } else {
      buf.push(0x78);
      buf.push(b.len() as u8);
    }
    buf.extend_from_slice(b);
  }

  fn synth_manifest(vendor: &str, model: &str, time: &str, log_id: &str, signer: &str, org_id: &str) -> Vec<u8> {
    let mut v = Vec::new();
    v.extend_from_slice(b"....ftypisom....moov....c2pa");
    // X.509 v3 TBS prefix + serial INTEGER (02 <len> <bytes>) for serial 3687D485…
    v.extend_from_slice(&[0xA0, 0x03, 0x02, 0x01, 0x02, 0x02, 0x0C]);
    v.extend_from_slice(&[0x36, 0x87, 0xD4, 0x85, 0x90, 0xA2, 0xFD, 0x51, 0x01, 0xAB, 0x03, 0x16]);
    v.extend_from_slice(b"urn:c2pa:40a5f6fe-b88a-4a2c-ae72-f76a1e5a6012");
    v.extend_from_slice(b"c2pa.createddwhen");
    push_text(&mut v, time);
    v.extend_from_slice(b"msoftwareAgentdname");
    push_text(&mut v, vendor);
    v.extend_from_slice(b"gversion");
    push_text(&mut v, "1.0.0");
    v.extend_from_slice(b"jparametersflog_id");
    push_text(&mut v, log_id);
    v.extend_from_slice(b"dtime");
    push_text(&mut v, time);
    v.extend_from_slice(b"jmodel_name");
    push_text(&mut v, model);
    v.extend_from_slice(b"qdigitalSourceType");
    push_text(&mut v, "http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia");
    v.extend_from_slice(b"jinstanceID");
    push_text(&mut v, "xmp:iid:95a3ac67-cb28-4a0d-ac54-911f1787b7de");
    v.extend_from_slice(b"tclaim_generator_infodname");
    push_text(&mut v, "c2pa-rs");
    v.extend_from_slice(b"gversion");
    push_text(&mut v, "0.78.4");
    // In a real file the signing cert's email is preceded by binary DER bytes;
    // emulate that boundary so the email local-part walk-back terminates here.
    v.push(0x00);
    v.extend_from_slice(signer.as_bytes());
    // Org identifier (2.5.4.97) preceded by its DER length byte, as in a real cert.
    v.push(0x31); // a DER tag byte before the length, like a real subject RDN
    v.push(org_id.len() as u8);
    v.extend_from_slice(org_id.as_bytes());
    v.push(0x31); // trailing DER byte after the value
    v
  }

  #[test]
  fn parses_volcengine_fast() {
    let data = synth_manifest(
      "Volcengine_Ark_CN", "doubao-seedance-2-0-fast",
      "2026-06-19T01:32:58Z", "ATIAA7b8D_iKjF32GukAAAAA",
      "certificate_center@volcengine.com", "NTRCN-91110108MA01R70K8D",
    );
    let info = SeedanceInfo::from_bytes(&data).expect("should parse");
    assert_eq!(info.platform, SeedancePlatform::Volcengine);
    assert_eq!(info.signer_org_id.as_deref(), Some("NTRCN-91110108MA01R70K8D"));
    assert_eq!(info.signer_country.as_deref(), Some("CN"));
    assert_eq!(info.cert_serial.as_deref(), Some("3687D48590A2FD5101AB0316"));
    assert_eq!(info.software_agent, "Volcengine_Ark_CN");
    assert_eq!(info.software_agent_version.as_deref(), Some("1.0.0"));
    assert_eq!(info.model_name, "doubao-seedance-2-0-fast");
    assert_eq!(info.model_brand.as_deref(), Some("doubao"));
    assert_eq!(info.model_version.as_deref(), Some("2.0"));
    assert!(info.is_fast);
    assert_eq!(info.generated_at, "2026-06-19T01:32:58Z");
    assert!(info.generated_at_utc.is_some());
    assert_eq!(info.log_id.as_deref(), Some("ATIAA7b8D_iKjF32GukAAAAA"));
    assert_eq!(info.log_id_decoded_hex.as_deref(), Some("01320003b6fc0ff88a8c5df61ae900000000"));
    assert_eq!(info.claim_generator.as_deref(), Some("c2pa-rs"));
    assert_eq!(info.claim_generator_version.as_deref(), Some("0.78.4"));
    assert_eq!(info.manifest_id.as_deref(), Some("urn:c2pa:40a5f6fe-b88a-4a2c-ae72-f76a1e5a6012"));
    assert_eq!(info.instance_id.as_deref(), Some("xmp:iid:95a3ac67-cb28-4a0d-ac54-911f1787b7de"));
    assert_eq!(info.signer_email.as_deref(), Some("certificate_center@volcengine.com"));
    assert!(info.digital_source_type.as_deref().unwrap().contains("trainedAlgorithmicMedia"));
  }

  #[test]
  fn parses_byteplus_non_fast() {
    let data = synth_manifest(
      "BytePlus_ModelArk", "dreamina-seedance-2-0",
      "2026-06-19T01:27:48Z", "ATMAA7b36J8cLZO2iUkAAAAA",
      "certificate@byteplus.com", "NTRSG-202024632W",
    );
    let info = SeedanceInfo::from_bytes(&data).expect("should parse");
    assert_eq!(info.platform, SeedancePlatform::BytePlus);
    assert_eq!(info.model_brand.as_deref(), Some("dreamina"));
    assert_eq!(info.model_version.as_deref(), Some("2.0"));
    assert!(!info.is_fast);
    assert_eq!(info.signer_email.as_deref(), Some("certificate@byteplus.com"));
    assert_eq!(info.signer_org_id.as_deref(), Some("NTRSG-202024632W"));
    assert_eq!(info.signer_country.as_deref(), Some("SG"));
    // BytePlus region byte is 0x33 (vs 0x32 for Volcengine).
    assert_eq!(info.log_id_decoded_hex.as_deref(), Some("01330003b6f7e89f1c2d93b6894900000000"));
  }

  #[test]
  fn non_seedance_returns_not_seedance() {
    let data = b"....ftypisom....just a normal mp4 with no provenance....";
    match SeedanceInfo::from_bytes(data) {
      Err(VideoInfoError::NotSeedance) => {}
      other => panic!("expected NotSeedance, got {:?}", other),
    }
  }

  #[test]
  fn vendor_without_model_is_malformed() {
    // Vendor marker present, but no model_name key.
    let mut data = Vec::new();
    data.extend_from_slice(b"....Volcengine_Ark_CN....2026-06-19T01:32:58Z....");
    match SeedanceInfo::from_bytes(&data) {
      Err(VideoInfoError::MalformedManifest(_)) => {}
      other => panic!("expected MalformedManifest, got {:?}", other),
    }
  }

  #[test]
  fn cbor_text_reader_handles_length_encodings() {
    // inline (0x73 = len 19)
    let mut inline = Vec::new();
    push_text(&mut inline, "doubao-seedance-2-0");
    assert_eq!(read_cbor_text(&inline, 0).as_deref(), Some("doubao-seedance-2-0"));
    // 1-byte length (0x78)
    let mut long = Vec::new();
    push_text(&mut long, "doubao-seedance-2-0-fast"); // 24 chars
    assert_eq!(long[0], 0x78);
    assert_eq!(read_cbor_text(&long, 0).as_deref(), Some("doubao-seedance-2-0-fast"));
  }
}
