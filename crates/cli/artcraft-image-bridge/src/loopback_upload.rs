//! Contract prototype for local fixture servers only. No live credentials or
//! production hosts are accepted. This is not yet connected to the MCP tools.
use anyhow::{bail, ensure, Context, Result};
use reqwest::{multipart, redirect::Policy, Client, Response};
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use std::{net::SocketAddr, time::Duration};
use uuid::Uuid;

const MAX_RESPONSE_BYTES: usize = 1024 * 1024;
const UPLOAD_ROUTE: &str = "/v1/media_files/upload/image";

pub struct LoopbackUploadClient {
  base: String,
  client: Client,
}

#[derive(Debug, Serialize)]
pub struct VerifiedUpload {
  pub request_id: Uuid,
  pub media_file_token: String,
  pub verification: &'static str,
  pub backend: &'static str,
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
}

impl LoopbackUploadClient {
  pub fn new(address: SocketAddr) -> Result<Self> {
    ensure!(
      address.ip().is_loopback(),
      "Only loopback fixture servers are supported"
    );
    Ok(Self {
      base: format!("http://{address}"),
      client: Client::builder()
        .no_proxy()
        .retry(reqwest::retry::never())
        .redirect(Policy::none())
        .timeout(Duration::from_secs(5))
        .build()?,
    })
  }

  /// The caller must validate and authorize these bytes. A stable request ID
  /// is sent as ArtCraft's existing multipart idempotency field, never regenerated.
  pub async fn upload_and_verify(
    &self,
    bytes: Vec<u8>,
    mime: &str,
    request_id: Uuid,
  ) -> Result<VerifiedUpload> {
    ensure!(
      bytes.len() <= 20 * 1024 * 1024,
      "Image exceeds 20 MiB limit"
    );
    let filename = match mime {
      "image/png" => "image.png",
      "image/jpeg" => "image.jpg",
      _ => bail!("Only PNG and JPEG are supported"),
    };
    let form = multipart::Form::new()
      .text("uuid_idempotency_token", request_id.to_string())
      .text("maybe_visibility", "private")
      .part(
        "file",
        multipart::Part::bytes(bytes)
          .file_name(filename)
          .mime_str(mime)?,
      );
    // Omit is_intermediate_system_file, matching the upstream visible-upload path.
    // No provider provenance, cookie, Authorization, or OpenAI credential is added.
    let response = self
      .client
      .post(format!("{}{UPLOAD_ROUTE}", self.base))
      .header("Accept", "application/json")
      .multipart(form)
      .send()
      .await
      .context("Upload transport failed; outcome may be unknown; retain the request ID")?;
    let uploaded: UploadResponse = read_json(response).await?;
    ensure!(uploaded.success, "Backend did not accept upload");
    let token = uploaded.media_file_token;
    ensure!(
      valid_token(&token),
      "Backend returned an invalid media token"
    );
    let response = self
      .client
      .get(format!("{}/v1/media_files/file/{token}", self.base))
      .header("Accept", "application/json")
      .send()
      .await
      .context("Upload accepted but metadata read-back failed; retain the request ID")?;
    let read: ReadResponse = read_json(response)
      .await
      .context("Upload accepted but metadata read-back failed; retain the request ID")?;
    ensure!(
      read.success
        && read.media_file.token == token
        && read.media_file.media_class == "image"
        && read.media_file.creator_set_visibility == "private",
      "Upload accepted but metadata did not verify the same image; retain the request ID"
    );
    Ok(VerifiedUpload {
      request_id,
      media_file_token: token,
      verification: "metadata_only",
      backend: "loopback_contract_fixture",
    })
  }
}

async fn read_json<T: DeserializeOwned>(mut response: Response) -> Result<T> {
  ensure!(
    response.status().is_success(),
    "ArtCraft-shaped fixture returned HTTP {}",
    response.status().as_u16()
  );
  if let Some(length) = response.content_length() {
    ensure!(
      length <= MAX_RESPONSE_BYTES as u64,
      "Response exceeds size limit"
    );
  }
  let mut bytes = Vec::new();
  while let Some(chunk) = response.chunk().await? {
    ensure!(
      bytes.len() + chunk.len() <= MAX_RESPONSE_BYTES,
      "Response exceeds size limit"
    );
    bytes.extend_from_slice(&chunk);
  }
  serde_json::from_slice(&bytes).context("Invalid backend JSON response")
}

fn valid_token(token: &str) -> bool {
  token.starts_with("m_")
    && token.len() > 2
    && token.len() <= 128
    && token
      .bytes()
      .all(|c| c.is_ascii_alphanumeric() || c == b'_')
}
