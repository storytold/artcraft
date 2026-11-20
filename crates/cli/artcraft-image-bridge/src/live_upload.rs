//! Explicit opt-in ArtCraft upload. Private metadata does not enforce link privacy.
use anyhow::{ensure, Context, Result};
use reqwest::{
  header::{HeaderMap, HeaderValue, AUTHORIZATION},
  multipart, Client,
};
use serde::Deserialize;
use std::{path::Path, time::Duration};
use uuid::Uuid;

const BASE: &str = "https://api.storyteller.ai";

#[derive(Clone)]
pub struct LiveUploadClient {
  client: Client,
}

#[derive(Deserialize)]
struct UploadResponse {
  success: bool,
  media_file_token: String,
}
#[derive(Deserialize)]
struct ReadResponse {
  success: bool,
  media_file: MediaInfo,
}
#[derive(Deserialize)]
struct MediaInfo {
  token: String,
  media_class: String,
  creator_set_visibility: String,
  #[serde(rename = "media_links")]
  maybe_media_links: Option<MediaLinks>,
}

#[derive(Deserialize)]
struct MediaLinks {
  cdn_url: String,
}

impl LiveUploadClient {
  /// The encrypted key must be explicitly supplied; never discover host credentials.
  pub async fn from_dpapi_file(path: &Path) -> Result<Self> {
    let key = read_dpapi_key(path).await?;
    let mut header = HeaderValue::from_str(&format!("Bearer {}", key.trim()))
      .context("Invalid credential format")?;
    header.set_sensitive(true);
    let mut headers = HeaderMap::new();
    headers.insert(AUTHORIZATION, header);
    Ok(Self {
      client: Client::builder()
        .default_headers(headers)
        .user_agent("ArtCraft-Bridge-Assessment/0.1")
        .no_proxy()
        .redirect(reqwest::redirect::Policy::none())
        .retry(reqwest::retry::never())
        .timeout(Duration::from_secs(60))
        .https_only(true)
        .build()?,
    })
  }

  pub async fn upload(&self, bytes: Vec<u8>, mime: &str, id: Uuid) -> Result<String> {
    let name = match mime {
      "image/png" => "image.png",
      "image/jpeg" => "image.jpg",
      _ => anyhow::bail!("Unsupported image format"),
    };
    ensure!(bytes.len() <= 20 * 1024 * 1024, "Image exceeds limit");
    let form = multipart::Form::new()
      .text("uuid_idempotency_token", id.to_string())
      .text("maybe_visibility", "private")
      .part(
        "file",
        multipart::Part::bytes(bytes)
          .file_name(name)
          .mime_str(mime)?,
      );
    let response = self
      .client
      .post(format!("{BASE}/v1/media_files/upload/image"))
      .multipart(form)
      .send()
      .await
      .map_err(|_| {
        anyhow::anyhow!("Upload outcome unknown; do not resubmit with a new request ID")
      })?;
    let uploaded: UploadResponse = read_json(response).await?;
    ensure!(
      uploaded.success && valid_token(&uploaded.media_file_token),
      "Upload response unverified; do not retry"
    );
    Ok(uploaded.media_file_token)
  }

  pub async fn verify_metadata(&self, token: &str) -> Result<()> {
    ensure!(valid_token(token), "Invalid media token");
    let response = self
      .client
      .get(format!("{BASE}/v1/media_files/file/{token}"))
      .send()
      .await
      .map_err(|_| anyhow::anyhow!("Metadata unavailable; upload may already exist"))?;
    let read: ReadResponse = read_json(response).await?;
    ensure!(
      read.success
        && read.media_file.token == token
        && read.media_file.media_class == "image"
        && read.media_file.creator_set_visibility == "private",
      "Uploaded image metadata mismatch"
    );
    Ok(())
  }

  /// Authenticated metadata lookup, followed by a separate credential-free CDN GET.
  /// The stored upload record is never updated by this check.
  pub async fn verify_original(&self, record: &crate::ImportRecord) -> Result<serde_json::Value> {
    ensure!(
      record.backend == "artcraft_live",
      "Remote verification requires a live import record"
    );
    let token = record
      .maybe_media_file_token
      .as_deref()
      .context("No accepted asset token; reconcile the uncertain upload first")?;
    ensure!(valid_token(token), "Invalid media token");
    let response = self
      .client
      .get(format!("{BASE}/v1/media_files/file/{token}"))
      .send()
      .await
      .map_err(|_| {
        anyhow::anyhow!("Remote metadata unavailable; saved upload state is unchanged")
      })?;
    let read: ReadResponse = read_json(response).await?;
    ensure!(
      read.success && read.media_file.token == token && read.media_file.media_class == "image",
      "Remote asset metadata mismatch"
    );
    let link = read
      .media_file
      .maybe_media_links
      .context("Original CDN link unavailable")?;
    let url = crate::remote_verify::validate_original_url(&link.cdn_url)?;
    // Never forward ArtCraft's Authorization header to storage or follow redirects.
    let public_client = Client::builder()
      .no_proxy()
      .https_only(true)
      .redirect(reqwest::redirect::Policy::none())
      .retry(reqwest::retry::never())
      .timeout(Duration::from_secs(60))
      .build()?;
    let response = public_client.get(url).send().await.map_err(|_| {
      anyhow::anyhow!("Original download unavailable; saved upload state is unchanged")
    })?;
    crate::remote_verify::compare_original(response, &record.image).await?;
    Ok(serde_json::json!({
      "request_id": record.request_id, "media_file_token": token,
      "status": "remote_original_bytes_match", "sha256": record.image.sha256,
      "byte_size": record.image.byte_size, "state_changed": false,
      "warning": "Original bytes match the hash recorded at import. This does not prove account ownership, confidential storage, or that a current local file is unchanged. The CDN request carried no ArtCraft credentials."
    }))
  }
}

fn valid_token(token: &str) -> bool {
  token.starts_with("m_")
    && token.len() > 2
    && token.len() <= 128
    && token
      .bytes()
      .all(|c| c.is_ascii_alphanumeric() || c == b'_')
}

async fn read_json<T: serde::de::DeserializeOwned>(mut response: reqwest::Response) -> Result<T> {
  check_status(response.status())?;
  let mut bytes = Vec::new();
  while let Some(chunk) = response
    .chunk()
    .await
    .map_err(|_| anyhow::anyhow!("Incomplete response"))?
  {
    ensure!(
      bytes.len() + chunk.len() <= 1024 * 1024,
      "Response exceeds limit"
    );
    bytes.extend_from_slice(&chunk);
  }
  serde_json::from_slice(&bytes).map_err(|_| anyhow::anyhow!("Invalid ArtCraft response"))
}

fn check_status(status: reqwest::StatusCode) -> Result<()> {
  if status == reqwest::StatusCode::UNAUTHORIZED || status == reqwest::StatusCode::FORBIDDEN {
    anyhow::bail!("ArtCraft rejected access (HTTP {}). Check the ArtCraft key and account permissions, save the key with setup-bridge-key.ps1, then restart the bridge. No automatic retry; preserve the request ID and reconcile any unknown upload before another POST.", status.as_u16());
  }
  ensure!(
    status.is_success(),
    "ArtCraft returned HTTP {}; no automatic retry. Preserve the request ID; reconcile an unknown upload before another POST",
    status.as_u16()
  );
  Ok(())
}

#[cfg(windows)]
async fn read_dpapi_key(path: &Path) -> Result<String> {
  use std::process::Stdio;
  ensure!(
    path.is_absolute() && path.is_file(),
    "Explicit encrypted credential file required"
  );
  ensure!(
    std::fs::metadata(path)?.len() <= 64 * 1024,
    "Encrypted credential file exceeds limit"
  );
  let system_root = std::env::var_os("SystemRoot")
    .context("Windows SystemRoot is unavailable; cannot locate the credential helper")?;
  let shell = Path::new(&system_root).join(r"System32\WindowsPowerShell\v1.0\powershell.exe");
  ensure!(
    shell.is_absolute() && shell.is_file(),
    "Windows PowerShell is unavailable under SystemRoot"
  );
  // File path travels as data, never interpolated into PowerShell source. Only
  // the child process receives it; the parent environment is unchanged.
  let script = r#"$ErrorActionPreference='Stop'; Import-Module (Join-Path $PSHOME 'Modules\Microsoft.PowerShell.Security\Microsoft.PowerShell.Security.psd1'); $s=ConvertTo-SecureString ([IO.File]::ReadAllText($env:ARTCRAFT_BRIDGE_KEY_FILE).Trim()); if ($s.Length -lt 16 -or $s.Length -gt 4096) {$s.Dispose(); exit 1}; $p=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($s); try {[Console]::Out.Write([Runtime.InteropServices.Marshal]::PtrToStringBSTR($p))} finally {[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($p); $s.Dispose()}"#;
  let mut command = tokio::process::Command::new(shell);
  command
    .args(["-NoProfile", "-NonInteractive", "-Command", script])
    .env("ARTCRAFT_BRIDGE_KEY_FILE", path)
    .stdin(Stdio::null())
    .stderr(Stdio::null())
    .creation_flags(0x08000000)
    .kill_on_drop(true);
  let output = run_credential_helper(&mut command, Duration::from_secs(10)).await?;
  ensure!(
    output.status.success(),
    "Encrypted credential could not be opened by this Windows account. Run setup-bridge-key.ps1 under the account that will run Codex, then restart the bridge"
  );
  let key = String::from_utf8(output.stdout).context("Credential is not UTF-8")?;
  ensure!(
    key.trim().len() >= 16 && key.len() <= 4096,
    "Invalid credential length"
  );
  Ok(key)
}

#[cfg(not(windows))]
async fn read_dpapi_key(_path: &Path) -> Result<String> {
  anyhow::bail!("This credential bootstrap currently requires Windows DPAPI")
}

#[cfg(windows)]
async fn run_credential_helper(
  command: &mut tokio::process::Command,
  timeout: Duration,
) -> Result<std::process::Output> {
  tokio::time::timeout(timeout, command.output())
    .await
    .context("Credential helper timed out; no upload attempt was recorded")?
    .context("Credential helper could not start; no upload attempt was recorded")
}

#[cfg(test)]
mod tests {
  use super::check_status;
  use reqwest::StatusCode;

  #[test]
  fn auth_errors_offer_recovery_without_resetting_upload_identity() {
    for status in [StatusCode::UNAUTHORIZED, StatusCode::FORBIDDEN] {
      let error = check_status(status).unwrap_err().to_string();
      assert!(error.contains("setup-bridge-key.ps1"));
      assert!(error.contains("preserve the request ID"));
      assert!(error.contains("No automatic retry"));
    }
  }

  #[test]
  fn redirects_throttling_and_server_errors_remain_failures() {
    for status in [
      StatusCode::FOUND,
      StatusCode::TOO_MANY_REQUESTS,
      StatusCode::SERVICE_UNAVAILABLE,
    ] {
      assert!(check_status(status).is_err());
    }
    assert!(check_status(StatusCode::OK).is_ok());
  }

  #[cfg(windows)]
  #[tokio::test]
  async fn dpapi_fixture_opens_without_contacting_artcraft() -> anyhow::Result<()> {
    let temp = tempfile::tempdir()?;
    let key = temp.path().join("fixture.dpapi");
    let shell = std::path::PathBuf::from(std::env::var_os("SystemRoot").unwrap())
      .join(r"System32\WindowsPowerShell\v1.0\powershell.exe");
    let script = r#"$ErrorActionPreference='Stop'; Import-Module (Join-Path $PSHOME 'Modules\Microsoft.PowerShell.Security\Microsoft.PowerShell.Security.psd1'); $s=ConvertTo-SecureString 'offline-test-key-not-a-real-credential' -AsPlainText -Force; try {[IO.File]::WriteAllText($env:ARTCRAFT_TEST_KEY_FILE,(ConvertFrom-SecureString $s))} finally {$s.Dispose()}"#;
    let mut command = tokio::process::Command::new(shell);
    command
      .args(["-NoProfile", "-NonInteractive", "-Command", script])
      .env("ARTCRAFT_TEST_KEY_FILE", &key)
      .creation_flags(0x08000000)
      .kill_on_drop(true);
    let output =
      super::run_credential_helper(&mut command, std::time::Duration::from_secs(10)).await?;
    assert!(output.status.success());
    // Constructing the authenticated client must not send any HTTP request.
    let _client = super::LiveUploadClient::from_dpapi_file(&key).await?;
    Ok(())
  }

  #[cfg(windows)]
  #[tokio::test]
  async fn slow_credential_helper_is_bounded() -> anyhow::Result<()> {
    let shell = std::path::PathBuf::from(std::env::var_os("SystemRoot").unwrap())
      .join(r"System32\WindowsPowerShell\v1.0\powershell.exe");
    let mut command = tokio::process::Command::new(shell);
    command
      .args([
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        "Start-Sleep -Seconds 30",
      ])
      .creation_flags(0x08000000)
      .kill_on_drop(true);
    let started = std::time::Instant::now();
    let error = super::run_credential_helper(&mut command, std::time::Duration::from_millis(100))
      .await
      .unwrap_err();
    assert!(error.to_string().contains("timed out"));
    assert!(started.elapsed() < std::time::Duration::from_secs(5));
    Ok(())
  }
}
