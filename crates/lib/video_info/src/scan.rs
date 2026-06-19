//! Shared byte-scanning helpers for reading C2PA manifests embedded in MP4s.
//!
//! These avoid a full JUMBF + CBOR + X.509 stack: the values we want are small,
//! stably-encoded fields locatable by their key/marker. Used by both
//! [`crate::seedance_info`] and [`crate::veo_info`].

/// Find the first occurrence of `needle` in `haystack`.
pub(crate) fn find(haystack: &[u8], needle: &[u8]) -> Option<usize> {
  find_from(haystack, needle, 0)
}

/// Find `needle` at or after byte offset `start`.
pub(crate) fn find_from(haystack: &[u8], needle: &[u8], start: usize) -> Option<usize> {
  if needle.is_empty() || start >= haystack.len() || needle.len() > haystack.len() - start {
    return None;
  }
  haystack[start..]
    .windows(needle.len())
    .position(|w| w == needle)
    .map(|p| p + start)
}

/// Read a CBOR text string (major type 3) starting at `at`. Supports inline
/// length (0x60–0x77), 1-byte length (0x78), and 2-byte length (0x79).
pub(crate) fn read_cbor_text(data: &[u8], at: usize) -> Option<String> {
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
pub(crate) fn text_after_key(data: &[u8], key: &[u8]) -> Option<String> {
  let idx = find(data, key)?;
  read_cbor_text(data, idx + key.len())
}

/// Like [`text_after_key`] but only searches at/after `start`.
pub(crate) fn text_after_key_from(data: &[u8], key: &[u8], start: usize) -> Option<String> {
  let idx = find_from(data, key, start)?;
  read_cbor_text(data, idx + key.len())
}

/// First RFC 3339 `YYYY-MM-DDTHH:MM:SSZ` (20 chars) timestamp in the buffer.
pub(crate) fn find_rfc3339(data: &[u8]) -> Option<String> {
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

/// Find a `<prefix><uuid>` token (e.g. `urn:c2pa:…`, `xmp:iid:…`) and return the
/// full token including the prefix. The UUID is up to 36 hex/dash chars.
pub(crate) fn find_prefixed_uuid(data: &[u8], prefix: &[u8]) -> Option<String> {
  let i = find(data, prefix)?;
  let start = i + prefix.len();
  let end = (start..data.len().min(start + 36))
    .take_while(|&j| data[j].is_ascii_hexdigit() || data[j] == b'-')
    .last()
    .map(|j| j + 1)?;
  let uuid = std::str::from_utf8(&data[start..end]).ok()?;
  let mut out = String::with_capacity(prefix.len() + uuid.len());
  out.push_str(&String::from_utf8_lossy(prefix));
  out.push_str(uuid);
  Some(out)
}

/// Hex serial number of the leaf signing certificate.
///
/// X.509 v3 certs encode the TBS prefix as `A0 03 02 01 02` (the `[0] EXPLICIT`
/// version = v3) immediately followed by the serial `INTEGER` (`02 <len> <bytes>`).
/// That fixed prefix lets us read the serial without a full DER parser; the leaf
/// cert is the first such occurrence.
pub(crate) fn find_cert_serial(data: &[u8]) -> Option<String> {
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

/// Read a DER length-prefixed string that begins with `prefix` — the byte
/// immediately before `prefix` is its DER length (as in an X.509 subject/issuer
/// CN). Returns the full string, e.g. given `b"Google C2PA Media Services"`
/// returns `"Google C2PA Media Services 1P ICA G3"`.
pub(crate) fn read_der_string(data: &[u8], prefix: &[u8]) -> Option<String> {
  let i = find(data, prefix)?;
  let len = *data.get(i.checked_sub(1)?)? as usize;
  if len < prefix.len() || len > 128 {
    return None;
  }
  let bytes = data.get(i..i + len)?;
  if !bytes.iter().all(|b| b.is_ascii_graphic() || *b == b' ') {
    return None;
  }
  std::str::from_utf8(bytes).ok().map(str::to_string)
}

/// Minimal base64url (RFC 4648 §5) decoder — no external dependency. Ignores
/// `=` padding; returns `None` on any invalid character.
pub(crate) fn decode_base64url(input: &str) -> Option<Vec<u8>> {
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

/// The X.509 organization identifier (OID 2.5.4.97) from the signing cert, plus
/// the country implied by its registration scheme (`NTRSG-…` = SG, `NTRCN-…` = CN).
/// The value is a DER string whose length byte immediately precedes it.
pub(crate) fn find_org_identifier(data: &[u8]) -> Option<(String, &'static str)> {
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

/// Read the iTunes-style `©too` encoder atom's value (the `encoder` tag exposed
/// by ffprobe). Layout: `©too` → `data` sub-box → 4-byte version/flags + 4-byte
/// reserved → the ASCII value. Returns the printable value (e.g. `"Google"`,
/// `"Lavf60.16.100"`).
pub(crate) fn find_encoder_tag(data: &[u8]) -> Option<String> {
  const TOO: &[u8] = &[0xA9, b't', b'o', b'o'];
  let too = find(data, TOO)?;
  // The `data` sub-box header sits a few bytes after `©too`; its value begins 8
  // bytes past the `data` marker (4 version/flags + 4 reserved/locale).
  let data_marker = find_from(data, b"data", too)?;
  let start = data_marker + 4 + 8;
  let end = (start..data.len())
    .take_while(|&j| {
      let b = data[j];
      b.is_ascii_graphic() || b == b'.'
    })
    .last()
    .map(|j| j + 1)?;
  if end <= start {
    return None;
  }
  std::str::from_utf8(&data[start..end]).ok().map(str::to_string)
}

/// Extract a flat JSON string field value (`"key":"value"`) from raw bytes.
/// Assumes the value contains no escaped quotes (true for these manifests).
pub(crate) fn json_str_field(data: &[u8], key: &str) -> Option<String> {
  let pat = format!("\"{}\":\"", key);
  let i = find(data, pat.as_bytes())?;
  let start = i + pat.len();
  let rel_end = data[start..].iter().position(|&b| b == b'"')?;
  String::from_utf8(data[start..start + rel_end].to_vec()).ok()
}

/// Extract a flat JSON integer field value (`"key":<int>`) from raw bytes.
pub(crate) fn json_int_field(data: &[u8], key: &str) -> Option<i64> {
  let pat = format!("\"{}\":", key);
  let i = find(data, pat.as_bytes())?;
  let mut e = i + pat.len();
  let start = e;
  if data.get(e) == Some(&b'-') {
    e += 1;
  }
  while data.get(e).is_some_and(|b| b.is_ascii_digit()) {
    e += 1;
  }
  if e == start || (e == start + 1 && data[start] == b'-') {
    return None;
  }
  std::str::from_utf8(&data[start..e]).ok()?.parse().ok()
}

/// CBOR-encode a text string (major type 3) — test helper for building manifests.
#[cfg(test)]
pub(crate) fn push_cbor_text(buf: &mut Vec<u8>, s: &str) {
  let b = s.as_bytes();
  if b.len() <= 0x17 {
    buf.push(0x60 + b.len() as u8);
  } else {
    buf.push(0x78);
    buf.push(b.len() as u8);
  }
  buf.extend_from_slice(b);
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn cbor_text_reader_handles_length_encodings() {
    let mut inline = Vec::new();
    push_cbor_text(&mut inline, "doubao-seedance-2-0"); // 19 chars, inline
    assert_eq!(read_cbor_text(&inline, 0).as_deref(), Some("doubao-seedance-2-0"));

    let mut long = Vec::new();
    push_cbor_text(&mut long, "doubao-seedance-2-0-fast"); // 24 chars → 0x78
    assert_eq!(long[0], 0x78);
    assert_eq!(read_cbor_text(&long, 0).as_deref(), Some("doubao-seedance-2-0-fast"));
  }

  #[test]
  fn base64url_decodes_log_id() {
    // ATIAA7b8D_iKjF32GukAAAAA → 18 bytes, region byte 0x32 (Volcengine).
    let bytes = decode_base64url("ATIAA7b8D_iKjF32GukAAAAA").unwrap();
    let hex: String = bytes.iter().map(|b| format!("{:02x}", b)).collect();
    assert_eq!(hex, "01320003b6fc0ff88a8c5df61ae900000000");
  }

  #[test]
  fn cert_serial_reads_v3_prefix() {
    let mut data = vec![0xFF, 0x00];
    data.extend_from_slice(&[0xA0, 0x03, 0x02, 0x01, 0x02, 0x02, 0x03, 0xAB, 0xCD, 0xEF]);
    assert_eq!(find_cert_serial(&data).as_deref(), Some("ABCDEF"));
  }
}
