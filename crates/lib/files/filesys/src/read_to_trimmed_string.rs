use std::fs::read_to_string;
use std::io;
use std::path::Path;

pub fn read_to_trimmed_string<P: AsRef<Path>>(path: P) -> io::Result<String> {
  let content = read_to_string(path)?;
  Ok(content.trim().to_string())
}
