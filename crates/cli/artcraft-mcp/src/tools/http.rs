use anyhow::{anyhow, Result};
use serde_json::Value;

pub async fn raw_json_get(
    url: &str,
    maybe_creds: Option<&artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet>,
) -> Result<Value> {
    let client = reqwest::Client::new();
    let mut request = client
        .get(url)
        .header("Accept", "application/json");

    if let Some(creds) = maybe_creds {
        if let Some(header) = creds.maybe_as_cookie_header() {
            request = request.header("Cookie", header);
        }
    }

    let response = request.send().await?;
    if !response.status().is_success() {
        return Err(anyhow!("HTTP error: {}", response.status()));
    }

    let json = response.json::<Value>().await?;
    Ok(json)
}

pub async fn raw_json_post(
    url: &str,
    body: Value,
    maybe_creds: Option<&artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet>,
) -> Result<Value> {
    let client = reqwest::Client::new();
    let mut request = client
        .post(url)
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .json(&body);

    if let Some(creds) = maybe_creds {
        if let Some(header) = creds.maybe_as_cookie_header() {
            request = request.header("Cookie", header);
        }
    }

    let response = request.send().await?;
    if !response.status().is_success() {
        return Err(anyhow!("HTTP error: {}", response.status()));
    }

    let json = response.json::<Value>().await?;
    Ok(json)
}
