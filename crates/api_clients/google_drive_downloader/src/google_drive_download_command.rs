use std::process::Command;

use anyhow::anyhow;
use log::info;
use tempdir::TempDir;

use crockford::random_crockford_token;
use errors::AnyhowResult;
use subprocess_common::docker_options::DockerOptions;

/// This is a Python script that uses the `gdown` package to download from Google Drive.
/// We're using this because it's a hack that gets around OAuth gateways. All the Rust
/// crates require OAuth permissions. Ugh.
///
/// This script lives here: https://github.com/storytold/web-downloader
///
/// Filename: `download_internet_file.py`
/// Arguments:
///   --url (google drive, web, or youtube url)
///   --output_filename (local download filename)
#[derive(Clone)]
pub struct GoogleDriveDownloadCommand {
  /// The python downloader script.
  download_script: String,

  /// If present, change to this directory before doing anything.
  maybe_change_to_directory: Option<String>,

  /// If a virtual environment is necessary, this is the name of the activation script (which will be sourced.)
  maybe_venv_activation_script: Option<String>,

  /// If this is run under Docker (eg. in development), these are the options for Docker (GPU, mount, etc.)
  maybe_docker_options: Option<DockerOptions>,
}

impl GoogleDriveDownloadCommand {
  pub fn new(
    download_script: &str,
    maybe_change_to_directory: Option<&str>,
    maybe_venv_activation_script: Option<&str>,
    maybe_docker_options: Option<DockerOptions>
  ) -> Self {
    Self {
      download_script: download_script.to_string(),
      maybe_change_to_directory: maybe_change_to_directory.map(|s| s.to_string()),
      maybe_venv_activation_script: maybe_venv_activation_script.map(|s| s.to_string()),
      maybe_docker_options,
    }
  }

  pub fn new_production(download_script: &str) -> Self {
    Self {
      download_script: download_script.to_string(),
      maybe_change_to_directory: None,
      maybe_venv_activation_script: None,
      maybe_docker_options: None,
    }
  }

  pub async fn download_file_with_file_name(&self,
                             download_url: &str,
                             temp_dir: &TempDir,
                             file_name:&str) -> AnyhowResult<String>
  {
    let temp_dir_path = temp_dir.path()
        .to_str()
        .unwrap_or("/tmp")
        .to_string();

    let temp_filename = format!("{}/{}", temp_dir_path, file_name);

    info!("Downloading {} to: {}", download_url, temp_filename);

    let mut command = format!("{} --url \"{}\" --output_filename {}",
                              &self.download_script,
                              download_url,
                              &temp_filename);

    if let Some(venv_activation_script) = self.maybe_venv_activation_script.as_deref() {
      // NB: "." is source for non-bash shells
      command = format!(". {} && {}",
                        venv_activation_script,
                        &command);
    }

    if let Some(change_to_directory) = self.maybe_change_to_directory.as_deref() {
      command = format!("cd {} && {}",
                        change_to_directory,
                        &command);
    }

    if let Some(docker_options) = self.maybe_docker_options.as_ref() {
      command = docker_options.to_command_string(&command);
    }

    info!("Running command: {}", command);

    let result = Command::new("sh")
        .arg("-c")
        .arg(command)
        .output()?;

    info!("Downloader Result: {:?}", result);

    if !result.status.success() {
      let reason = String::from_utf8(result.stderr).unwrap_or("UNKNOWN".to_string());
      return Err(anyhow!("Failure to execute command: {:?}", reason))
    }

    Ok(temp_filename)
  }

  /// Download file from Google Drive into the `TempDir`.
  /// Return the local filesystem filename.
  pub async fn download_file(&self,
                         download_url: &str,
                         temp_dir: &TempDir) -> AnyhowResult<String>
  {
    let temp_dir_path = temp_dir.path()
      .to_str()
      .unwrap_or("/tmp")
      .to_string();

    let temp_filename = random_crockford_token(10);
    let temp_filename = format!("{}/{}.bin", temp_dir_path, temp_filename);

    info!("Downloading {} to: {}", download_url, temp_filename);

    let mut command = format!("{} --url \"{}\" --output_filename {}",
                          &self.download_script,
                          download_url,
                          &temp_filename);

    if let Some(venv_activation_script) = self.maybe_venv_activation_script.as_deref() {
      // NB: "." is source for non-bash shells
      command = format!(". {} && {}",
                        venv_activation_script,
                        &command);
    }

    if let Some(change_to_directory) = self.maybe_change_to_directory.as_deref() {
      command = format!("cd {} && {}",
                        change_to_directory,
                        &command);
    }

    if let Some(docker_options) = self.maybe_docker_options.as_ref() {
      command = docker_options.to_command_string(&command);
    }

    info!("Running command: {}", command);

    let result = Command::new("sh")
      .arg("-c")
      .arg(command)
      .output()?;

    info!("Downloader Result: {:?}", result);

    if !result.status.success() {
      let reason = String::from_utf8(result.stderr).unwrap_or("UNKNOWN".to_string());
      return Err(anyhow!("Failure to execute command: {:?}", reason))
    }

    Ok(temp_filename)
  }
}
