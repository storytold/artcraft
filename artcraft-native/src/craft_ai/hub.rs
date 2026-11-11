//! The shared folder: the piece of the family's infrastructure every ArtCraft app reads and
//! none of them owns. A model saved here by one app is already there for the whole family —
//! the path is the same in every app, and each app's page lists what it finds in the folder,
//! whichever app put it there. A sidecar beside each file records which app did, and when: the
//! folder keeps its own story.
//!
//! The folder sits under the platform's own place for shared application data (`%APPDATA%` on
//! Windows, `~/Library/Application Support` on macOS, `$XDG_DATA_HOME` on Linux —
//! `$HOME/.local/share` when unset), beside the apps' own settings rather than inside any one
//! of them, because it belongs to the family, not to a member: removing one app leaves the
//! models for the others, and the folder's name is the family's.
//!
//! A download lands under a `.part` name and is renamed only when whole, so a broken download
//! never looks installed; a finished file is never fetched again. This is the half of "one
//! download serves every app" that needs no runtime at all — the other half is Ollama's own
//! store, which every app on the machine already shares.

use std::fs::File;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use serde_json::json;

use super::models::{self, ModelSpec};

/// The shared models folder, created if missing. `None` when the platform's data home cannot
/// be found (no `HOME`, no `APPDATA`).
pub fn models_dir() -> Option<PathBuf> {
  let dir = data_home()?.join("ArtCraft").join("Craft AI").join("models");
  std::fs::create_dir_all(&dir).ok()?;
  Some(dir)
}

/// The platform's place for shared application data.
fn data_home() -> Option<PathBuf> {
  if cfg!(target_os = "windows") {
    std::env::var_os("APPDATA").map(PathBuf::from)
  } else if cfg!(target_os = "macos") {
    std::env::var_os("HOME").map(|home| PathBuf::from(home).join("Library").join("Application Support"))
  } else {
    match std::env::var_os("XDG_DATA_HOME") {
      Some(xdg) if !xdg.is_empty() => Some(PathBuf::from(xdg)),
      _ => std::env::var_os("HOME").map(|home| PathBuf::from(home).join(".local").join("share")),
    }
  }
}

/// The models already sitting in the folder, by catalogue id, in catalogue order.
pub fn saved_ids() -> Vec<String> {
  let Some(dir) = models_dir() else { return Vec::new() };
  let mut ids: Vec<String> = models::MODELS.iter().map(|m| m.id.to_string()).collect();
  ids.retain(|id| {
    let Some(m) = models::MODELS.iter().find(|m| m.id == *id) else { return false };
    dir.join(m.file).is_file()
  });
  ids
}

/// Download the model's file into the shared folder, reporting how many of `total` bytes have
/// landed. An already-present file is left alone — that is the point of the folder.
pub fn save(spec: &ModelSpec, app: &str, progress: &mut dyn FnMut(u64, u64)) -> Result<(), String> {
  let dir = models_dir().ok_or_else(|| "the platform's data folder could not be found".to_string())?;
  let path = dir.join(spec.file);
  if path.is_file() {
    let _ = write_note(&dir, spec, app);
    return Ok(());
  }
  let tmp = dir.join(format!("{}.part", spec.file));
  let _ = std::fs::remove_file(&tmp); // a leftover part is a broken download; start it over

  let agent = ureq::AgentBuilder::new().timeout_connect(std::time::Duration::from_millis(2_000)).build();
  let reply = agent.get(&spec.url()).call().map_err(|e| format!("{}: {e}", spec.url()))?;
  let total = reply.header("Content-Length").and_then(|v| v.parse::<u64>().ok()).unwrap_or(spec.bytes);

  let mut reader = reply.into_reader();
  let mut file = File::create(&tmp).map_err(|e| format!("{}: {e}", tmp.display()))?;
  let mut buf = vec![0u8; 1 << 20];
  let mut done: u64 = 0;
  loop {
    let n = reader.read(&mut buf).map_err(|e| format!("the download broke: {e}"))?;
    if n == 0 {
      break;
    }
    file.write_all(&buf[..n]).map_err(|e| format!("{}: {e}", tmp.display()))?;
    done += n as u64;
    progress(done, total);
  }
  drop(file);
  if done != total {
    let _ = std::fs::remove_file(&tmp);
    return Err(format!("the download stopped early at {done} of {total} bytes"));
  }
  std::fs::rename(&tmp, &path).map_err(|e| format!("{}: {e}", path.display()))?;
  let _ = write_note(&dir, spec, app);
  Ok(())
}

/// Take the model's file, and its sidecar, out of the folder — the folder itself and every
/// other model stay.
pub fn remove(spec: &ModelSpec) -> Result<(), String> {
  let dir = models_dir().ok_or_else(|| "the platform's data folder could not be found".to_string())?;
  let path = dir.join(spec.file);
  if path.is_file() {
    std::fs::remove_file(&path).map_err(|e| format!("{}: {e}", path.display()))?;
  }
  let _ = std::fs::remove_file(note_path(&dir, spec));
  Ok(())
}

/// The sidecar's path for a model: `<file>.json` beside the file.
fn note_path(dir: &Path, spec: &ModelSpec) -> PathBuf {
  dir.join(format!("{}.json", spec.file))
}

/// Record which app downloaded the model, and when. Best-effort: the file is the record, the
/// note is its story.
pub fn write_note(dir: &Path, spec: &ModelSpec, app: &str) -> std::io::Result<()> {
  let at = SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_secs()).unwrap_or(0);
  let note = json!({
        "model": spec.id,
        "name": spec.name,
        "app": app,
        "at": at,
        "source": spec.repo,
    });
  std::fs::write(note_path(dir, spec), serde_json::to_string_pretty(&note).map_err(std::io::Error::other)?)
}

/// Read back which app downloaded the model, from its sidecar — `None` when there is no note
/// or it cannot be read.
#[cfg(test)]
pub fn downloaded_by(dir: &Path, spec: &ModelSpec) -> Option<String> {
  let note: serde_json::Value = serde_json::from_str(&std::fs::read_to_string(note_path(dir, spec)).ok()?).ok()?;
  note["app"].as_str().map(String::from)
}
