use crate::core::artcraft_error::ArtcraftError;
use crate::core::state::app_preferences::app_preferences::AppPreferences;
use crate::core::state::app_preferences::preferred_download_filename::{model_slug_from_model_type_str, DownloadFilenameParts, PreferredDownloadFilename};
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::utils::local_generations::local_generation_path;
use anyhow::anyhow;
use errors::AnyhowResult;
use log::{error, info};
use chrono::{DateTime, Local};
use std::path::{Path, PathBuf};
use std::time::Duration;
use tempfile::NamedTempFile;
use tokio::io::AsyncWriteExt;
use url::Url;

pub async fn download_url_to_user_download_dir(
  url: &Url,
  app_data_root: &AppDataRoot,
  app_prefs: &AppPreferences,
) -> Result<PathBuf, ArtcraftError> {
  let filename = suggested_download_filename(url, app_prefs, None, None, Local::now());
  let download_directory = app_prefs
      .preferred_download_directory
      .download_directory(app_data_root);
  download_url_with_filename(url, &download_directory, &filename).await
}

pub fn suggested_download_filename(
  url: &Url,
  prefs: &AppPreferences,
  maybe_model: Option<&str>,
  maybe_batch_index: Option<usize>,
  download_time: DateTime<Local>,
) -> String {
  let extension = Path::new(url.path()).extension().and_then(|ext| ext.to_str()).unwrap_or("bin");
  let model_slug = model_slug_from_model_type_str(maybe_model.unwrap_or("artcraft"));
  prefs.preferred_download_filename.build_filename(&DownloadFilenameParts {
    model_slug: &model_slug,
    download_time,
    maybe_batch_index,
    extension,
  })
}

/// Stream to a temporary file in the destination directory, then publish the
/// complete file atomically. Never overwrite another download, even if two
/// generations finish in the same second or use the same custom name.
pub async fn download_url_with_filename(url: &Url, directory: &Path, filename: &str) -> Result<PathBuf, ArtcraftError> {
  check_url_file_name_for_downloadability(filename)?;
  let temporary = fetch_to_temporary(url, directory).await?;
  let path = persist_download(temporary, directory, filename)?;
  info!("Downloaded generation to {:?}", path);
  Ok(path)
}

/// Saves to exactly `directory/filename`, replacing what's there: the user picked this name (and
/// confirmed any overwrite) in a save dialog. Only checks the name is a single file name.
pub async fn save_url_as(url: &Url, directory: &Path, filename: &str) -> Result<PathBuf, ArtcraftError> {
  check_single_file_name(filename)?;
  refuse_executable_filename(filename)?;
  let temporary = fetch_to_temporary(url, directory).await?;
  let path = directory.join(filename);
  temporary.persist(&path).map_err(|err| err.error)?;
  info!("Saved generation as {:?}", path);
  Ok(path)
}

/// Copies a local generation, or streams a remote one, into a temporary file in `directory`, so
/// it's published atomically.
async fn fetch_to_temporary(url: &Url, directory: &Path) -> Result<NamedTempFile, ArtcraftError> {
  tokio::fs::create_dir_all(directory).await?;
  let temporary = NamedTempFile::new_in(directory)?;
  if let Some(source) = local_generation_path(url) {
    tokio::fs::copy(&source, temporary.path()).await?;
    return Ok(temporary);
  }
  let mut file = tokio::fs::File::from_std(temporary.reopen()?);
  let client = reqwest::Client::builder().connect_timeout(Duration::from_secs(30)).timeout(Duration::from_secs(600)).build()?;
  let mut response = client.get(url.clone()).send().await?.error_for_status()?;
  while let Some(chunk) = response.chunk().await? {
    file.write_all(&chunk).await?;
  }
  file.flush().await?;
  file.sync_all().await?;
  drop(file);
  Ok(temporary)
}

fn persist_download(mut file: NamedTempFile, directory: &Path, filename: &str) -> Result<PathBuf, ArtcraftError> {
  let stem = Path::new(filename).file_stem().and_then(|stem| stem.to_str()).unwrap_or("artcraft");
  let extension = Path::new(filename).extension().and_then(|ext| ext.to_str()).unwrap_or("bin");
  for suffix in 0..10_000 {
    let name = if suffix == 0 { filename.to_string() } else { format!("{stem}_{suffix}.{extension}") };
    let path = directory.join(name);
    match file.persist_noclobber(&path) {
      Ok(_) => return Ok(path),
      Err(err) if err.error.kind() == std::io::ErrorKind::AlreadyExists => file = err.file,
      Err(err) => return Err(err.error.into()),
    }
  }
  Err(anyhow!("Too many downloads with the same filename").into())
}

// TODO: This likely needs more protections.
fn check_url_file_name_for_downloadability(filename: &str) -> Result<(), ArtcraftError> {
  if filename.trim().is_empty() {
    error!("Download filename is empty!");
    return Err(ArtcraftError::BadDownloadFilename { path: "".into() }.into());
  }

  PreferredDownloadFilename::validate_custom_format(filename).map_err(|err| anyhow!(err))?;

  if filename.contains("/")
      || filename.contains("..")
      || filename.contains("\\")
  {
    error!("Cannot download filename that has relative path components: {:?}", filename);
    return Err(ArtcraftError::BadDownloadFilename { path: filename.into() }.into());
  }

  if filename.contains("'")
      || filename.contains("\"")
      || filename.contains("%")
      || filename.contains("<")
      || filename.contains(">")
      || filename.contains("|")
  {
    error!("Download filename has dangerous path components: {:?}", filename);
    return Err(ArtcraftError::BadDownloadFilename { path: filename.into() }.into());
  }

  let filename_lower = filename.to_ascii_lowercase();
  let filename = filename_lower.as_str();
  if filename.ends_with(".apk")
      || filename.ends_with(".app")
      || filename.ends_with(".bat")
      || filename.ends_with(".cmd")
      || filename.ends_with(".com")
      || filename.ends_with(".ps1")
      || filename.ends_with(".sh")
      || filename.ends_with(".so")
      || filename.ends_with("dll") // Don't even risk the '.'
      || filename.ends_with("exe") // Don't even risk the '.'
  {
    error!("Cannot download filename that resembles executable: {:?}", filename);
    return Err(ArtcraftError::BadDownloadFilename { path: filename.into() }.into());
  }

  Ok(())
}


fn refuse_executable_filename(filename: &str) -> Result<(), ArtcraftError> {
  let filename = filename.to_ascii_lowercase();
  let filename = filename.as_str();
  if filename.ends_with(".apk")
      || filename.ends_with(".app")
      || filename.ends_with(".bat")
      || filename.ends_with(".cmd")
      || filename.ends_with(".com")
      || filename.ends_with(".ps1")
      || filename.ends_with(".sh")
      || filename.ends_with(".so")
      || filename.ends_with("dll")
      || filename.ends_with("exe")
  {
    error!("Cannot download filename that resembles executable: {:?}", filename);
    return Err(ArtcraftError::BadDownloadFilename { path: filename.into() }.into());
  }
  Ok(())
}

fn check_single_file_name(filename: &str) -> Result<(), ArtcraftError> {
  let is_single = !filename.is_empty()
    && filename != "."
    && filename != ".."
    && !filename.contains('/')
    && !filename.contains('\\');
  if !is_single {
    error!("Save-as filename isn't a single file name: {:?}", filename);
    return Err(ArtcraftError::BadDownloadFilename { path: filename.into() });
  }
  Ok(())
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::core::utils::local_generations::asset_url;

  #[tokio::test]
  async fn saving_as_a_chosen_name_overwrites_exactly_that_file() {
    let dir = tempfile::tempdir().unwrap();
    let source = local_image(dir.path(), b"new");
    let target_dir = dir.path().join("Pictures");
    std::fs::create_dir_all(&target_dir).unwrap();
    std::fs::write(target_dir.join("Ada's fox.png"), b"old").unwrap();
    let saved = save_url_as(&asset_url(&source).unwrap(), &target_dir, "Ada's fox.png").await.unwrap();
    assert_eq!(saved, target_dir.join("Ada's fox.png"));
    assert_eq!(std::fs::read(&saved).unwrap(), b"new", "the file the user confirmed is replaced");
    assert_eq!(std::fs::read_dir(&target_dir).unwrap().count(), 1, "no Ada's fox_1.png beside it");
  }

  #[tokio::test]
  async fn chosen_names_must_not_look_like_executables() {
    let dir = tempfile::tempdir().unwrap();
    let url = asset_url(&local_image(dir.path(), b"new")).unwrap();
    assert!(save_url_as(&url, dir.path(), "x.bat").await.is_err());
    assert!(save_url_as(&url, dir.path(), "run.exe").await.is_err());
  }

  #[tokio::test]
  async fn chosen_names_must_be_a_single_file_name() {
    let dir = tempfile::tempdir().unwrap();
    let url = asset_url(&local_image(dir.path(), b"new")).unwrap();
    for name in ["", ".", "..", "a/b.png", "a\\b.png", "/fox.png"] {
      assert!(save_url_as(&url, dir.path(), name).await.is_err(), "{name:?}");
    }
  }

  fn local_image(root: &Path, bytes: &[u8]) -> PathBuf {
    let folder = root.join("data").join("local_generations");
    std::fs::create_dir_all(&folder).unwrap();
    let path = folder.join("local_file_abc.png");
    std::fs::write(&path, bytes).unwrap();
    path
  }
}
