use std::sync::OnceLock;
use std::time::Duration;

use anyhow::{anyhow, bail, Result};
use serde_json::Value;

use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;

const REQUEST_TIMEOUT: Duration = Duration::from_secs(30);
const CONNECT_TIMEOUT: Duration = Duration::from_secs(5);
const MAX_RESPONSE_BYTES: usize = 8 * 1024 * 1024;
const MAX_ERROR_BODY_BYTES: usize = 4096;

static SHARED_CLIENT: OnceLock<reqwest::Client> = OnceLock::new();

/// One pooled client for all API requests: connection reuse plus hard
/// total/connect timeouts so a stalled request cannot hang the stdio loop.
pub fn shared_client() -> &'static reqwest::Client {
    SHARED_CLIENT.get_or_init(|| {
        reqwest::Client::builder()
            .timeout(REQUEST_TIMEOUT)
            .connect_timeout(CONNECT_TIMEOUT)
            .build()
            .unwrap_or_else(|_| reqwest::Client::new())
    })
}

fn with_auth(
    request: reqwest::RequestBuilder,
    maybe_creds: Option<&StorytellerCredentialSet>,
) -> reqwest::RequestBuilder {
    if let Some(header) = maybe_creds.and_then(|c| c.maybe_as_cookie_header()) {
        request.header("Cookie", header)
    } else {
        request
    }
}

async fn read_body_limited(response: &mut reqwest::Response, max: usize) -> Result<Vec<u8>> {
    let mut buf = Vec::new();
    while let Some(chunk) = response.chunk().await? {
        if buf.len() + chunk.len() > max {
            bail!("response body exceeded {} byte limit", max);
        }
        buf.extend_from_slice(&chunk);
    }
    Ok(buf)
}

async fn parse_json_response(mut response: reqwest::Response, url_desc: &str) -> Result<Value> {
    let status = response.status();
    let body = read_body_limited(&mut response, MAX_RESPONSE_BYTES).await?;

    if !status.is_success() {
        let snippet_len = body.len().min(MAX_ERROR_BODY_BYTES);
        let snippet = String::from_utf8_lossy(&body[..snippet_len]);
        return Err(anyhow!(
            "HTTP {} from {}: {}",
            status,
            url_desc,
            snippet.trim()
        ));
    }

    Ok(serde_json::from_slice(&body)
        .map_err(|e| anyhow!("invalid JSON from {}: {}", url_desc, e))?)
}

async fn raw_json_request(
    method: reqwest::Method,
    url: &str,
    body: Option<Value>,
    maybe_creds: Option<&StorytellerCredentialSet>,
) -> Result<Value> {
    let mut request = shared_client()
        .request(method, url)
        .header("Accept", "application/json");

    if let Some(b) = body {
        request = request.header("Content-Type", "application/json").json(&b);
    }

    let request = with_auth(request, maybe_creds);
    let response = request.send().await?;
    parse_json_response(response, url).await
}

pub async fn raw_json_get(
    url: &str,
    maybe_creds: Option<&StorytellerCredentialSet>,
) -> Result<Value> {
    raw_json_request(reqwest::Method::GET, url, None, maybe_creds).await
}

pub async fn raw_json_post(
    url: &str,
    body: Value,
    maybe_creds: Option<&StorytellerCredentialSet>,
) -> Result<Value> {
    raw_json_request(reqwest::Method::POST, url, Some(body), maybe_creds).await
}

pub async fn raw_json_delete(
    url: &str,
    maybe_creds: Option<&StorytellerCredentialSet>,
) -> Result<Value> {
    raw_json_request(reqwest::Method::DELETE, url, None, maybe_creds).await
}

/// Multipart form upload (mirrors the frontend MediaUploadApi Upload helper):
/// `uuid_idempotency_token`, extra text fields, then the file bytes.
pub async fn raw_multipart_upload(
    url: &str,
    file_bytes: Vec<u8>,
    file_name: String,
    extra_fields: Vec<(String, String)>,
    maybe_creds: Option<&StorytellerCredentialSet>,
) -> Result<Value> {
    let mut form = reqwest::multipart::Form::new()
        .text("uuid_idempotency_token", uuid::Uuid::new_v4().to_string());
    for (k, v) in extra_fields {
        form = form.text(k, v);
    }
    let part = reqwest::multipart::Part::bytes(file_bytes).file_name(file_name);
    form = form.part("file", part);

    let request = with_auth(
        shared_client().post(url).multipart(form),
        maybe_creds,
    );
    let response = request.send().await?;
    parse_json_response(response, url).await
}
