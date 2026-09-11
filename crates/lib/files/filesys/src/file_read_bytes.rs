use std::fs::File;
use std::io;
use std::io::{BufReader, Read};
use std::path::Path;

/// Read a file into a byte buffer
pub fn file_read_bytes<P: AsRef<Path>>(file_path: P) -> io::Result<Vec<u8>> {
  let f = File::open(file_path)?;
  let mut reader = BufReader::new(f);
  let mut buffer = Vec::new();

  // Read file into vector.
  reader.read_to_end(&mut buffer)?;

  Ok(buffer)
}
