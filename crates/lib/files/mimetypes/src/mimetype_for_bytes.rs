
const DEFAULT_BINARY_MIMETYPE : &str = "application/octet-stream";

pub fn get_mimetype_for_bytes(bytes: &[u8]) -> Option<&'static str> {
  infer::get(bytes)
      .map(|typ| typ.mime_type())
}

pub fn get_mimetype_for_bytes_or_default(bytes: &[u8]) -> &'static str {
  infer::get(bytes)
      .map(|typ| typ.mime_type())
      .unwrap_or(DEFAULT_BINARY_MIMETYPE)
}

#[cfg(test)]
mod tests {
  use crate::mimetype_for_bytes::{get_mimetype_for_bytes, get_mimetype_for_bytes_or_default};

  #[test]
  fn test_mimetype_png() {
    // NB: From "Hanashi Mask.png"
    let bytes : Vec<u8> = vec![
      137, 80, 78, 71, 13, 10, 26, 10,
      0, 0, 0, 13, 73, 72, 68, 82,
      0, 0, 20, 193, 0, 0, 15, 239,
      8, 6, 0, 0, 0, 163, 131, 119,
      122, 0, 0, 0,
    ];

    assert_eq!(get_mimetype_for_bytes(&bytes), Some("image/png"));
    assert_eq!(get_mimetype_for_bytes_or_default(&bytes), "image/png");
  }

  #[test]
  fn test_mimetype_unknown() {
    let bytes : Vec<u8> = vec![];

    assert_eq!(get_mimetype_for_bytes(&bytes), None);
    assert_eq!(get_mimetype_for_bytes_or_default(&bytes), "application/octet-stream");
  }
}
