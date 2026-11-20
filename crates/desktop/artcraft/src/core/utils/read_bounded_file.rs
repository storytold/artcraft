use std::fs::File;
use std::io::{Error, ErrorKind, Read, Result};
use std::path::Path;

/// Reject nonregular or oversized metadata and cap bytes even if the file grows while reading.
pub fn read_bounded_file(path: &Path, maximum: u64) -> Result<Vec<u8>> {
  let file = File::open(path)?;
  if !file.metadata()?.is_file() || file.metadata()?.len() > maximum {
    return Err(Error::new(ErrorKind::InvalidData, "Stored metadata exceeds its size limit"));
  }
  let mut bytes = Vec::new();
  file.take(maximum + 1).read_to_end(&mut bytes)?;
  if bytes.len() as u64 > maximum {
    return Err(Error::new(ErrorKind::InvalidData, "Stored metadata exceeds its size limit"));
  }
  Ok(bytes)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn rejects_oversized_files_without_reading_their_contents() {
    let file = tempfile::NamedTempFile::new().unwrap();
    std::fs::write(file.path(), b"12345").unwrap();
    assert!(read_bounded_file(file.path(), 4).is_err());
    assert_eq!(read_bounded_file(file.path(), 5).unwrap(), b"12345");
  }
}
