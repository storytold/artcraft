#![cfg(test)]

use std::fs::read_to_string;
use std::path::{Path, PathBuf};

/// Reads the Datadog API key from `secrets/datadog_key.txt` (relative to
/// the workspace root). Used only by `#[ignore]`d smoke tests that hit the
/// real API.
pub(crate) fn get_test_api_key() -> Result<String, String> {
  let candidates = candidate_paths();
  for path in &candidates {
    if let Ok(contents) = read_to_string(path) {
      let trimmed = contents.trim().to_string();
      if trimmed.is_empty() {
        return Err(format!("{} is empty", path.display()));
      }
      return Ok(trimmed);
    }
  }
  Err(format!(
    "Could not locate Datadog API key. Tried: {}",
    candidates.iter().map(|p| p.display().to_string()).collect::<Vec<_>>().join(", "),
  ))
}

/// Walk upward from the test's CWD looking for the key. Tests run from
/// the crate dir (`crates/api_clients/datadog_client`), so we need to
/// climb a few levels to reach the workspace root. We try the new
/// `secrets/datadog_key.txt` location first and fall back to the older
/// root-level `datadog_key.txt` for any stale checkouts.
fn candidate_paths() -> Vec<PathBuf> {
  let mut out = Vec::new();
  let mut current: PathBuf = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
  for _ in 0..6 {
    out.push(current.join("secrets/datadog_key.txt"));
    out.push(current.join("datadog_key.txt"));
    if !current.pop() {
      break;
    }
  }
  // Last-resort hardcoded paths matching this repo's known layout.
  out.push(Path::new("/Users/bt/dev/storyteller/artcraft/secrets/datadog_key.txt").to_path_buf());
  out.push(Path::new("/Users/bt/dev/storyteller/artcraft/datadog_key.txt").to_path_buf());
  out
}
