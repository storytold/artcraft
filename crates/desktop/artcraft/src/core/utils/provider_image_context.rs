use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use anyhow::{ensure, Result};
use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use base64::Engine;
use serde::{Deserialize, Serialize};
use std::io::Write;
use std::path::PathBuf;
use tempfile::NamedTempFile;

#[derive(Clone, Serialize, Deserialize)]
pub struct ProviderImageContext {
  pub prompt: String,
  pub model_id: String,
  pub local_only: bool,
}

impl ProviderImageContext {
  pub fn prepare(&self, root: &AppDataRoot) -> Result<NamedTempFile> {
    let mut file = NamedTempFile::new_in(root.state_dir().path())?;
    file.write_all(&serde_json::to_vec(self)?)?;
    file.as_file().sync_all()?;
    Ok(file)
  }

  pub fn save_prepared(root: &AppDataRoot, job_id: &str, prepared: NamedTempFile) -> Result<()> {
    prepared.persist(path(root, job_id)?)?;
    Ok(())
  }

  pub fn load(root: &AppDataRoot, job_id: &str) -> Result<Option<Self>> {
    match std::fs::read(path(root, job_id)?) {
      Ok(bytes) => Ok(Some(serde_json::from_slice(&bytes)?)),
      Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(None),
      Err(error) => Err(error.into()),
    }
  }

  pub fn remove(root: &AppDataRoot, job_id: &str) -> Result<()> {
    match std::fs::remove_file(path(root, job_id)?) {
      Ok(()) => Ok(()),
      Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
      Err(error) => Err(error.into()),
    }
  }
}

fn path(root: &AppDataRoot, job_id: &str) -> Result<PathBuf> {
  ensure!(!job_id.is_empty() && job_id.len() <= 128, "Invalid provider job ID");
  let encoded = URL_SAFE_NO_PAD.encode(job_id);
  Ok(root.state_dir().path().join(format!("wavespeed_image_{encoded}.json")))
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn context_survives_restart_without_overwriting_frontend_payload() {
    let directory = tempfile::tempdir().unwrap();
    let root = AppDataRoot::create_existing(directory.path()).unwrap();
    let context = ProviderImageContext { prompt: "a small bird".into(), model_id: "nano_banana_pro".into(), local_only: true };
    let prepared = context.prepare(&root).unwrap();
    ProviderImageContext::save_prepared(&root, "job/one", prepared).unwrap();
    assert!(ProviderImageContext::load(&root, "job_one").unwrap().is_none());
    let saved = ProviderImageContext::load(&root, "job/one").unwrap().unwrap();
    assert_eq!(saved.prompt, context.prompt);
    assert!(saved.local_only);
    ProviderImageContext::remove(&root, "job/one").unwrap();
    assert!(ProviderImageContext::load(&root, "job/one").unwrap().is_none());
    let longest_job_id = "a".repeat(128);
    let prepared = context.prepare(&root).unwrap();
    ProviderImageContext::save_prepared(&root, &longest_job_id, prepared).unwrap();
    assert!(ProviderImageContext::load(&root, &longest_job_id).unwrap().is_some());
  }
}
