use crate::creds::ark_api_key::ArkApiKey;
use crate::error::ark_error::ArkError;
use crate::requests::ark_host::ARK_AP_SOUTHEAST_BASE_URL;
use crate::requests::http::send_json;
use reqwest::Method;
use std::time::Duration;

const VALIDATE_TIMEOUT: Duration = Duration::from_secs(20);

/// Checks an API key with a free, read-only call (lists at most one video task).
/// `Ok` means ModelArk accepted the key; it doesn't prove any model is activated.
pub async fn validate_api_key(api_key: &ArkApiKey) -> Result<(), ArkError> {
  let url = format!("{}/contents/generations/tasks?page_size=1", ARK_AP_SOUTHEAST_BASE_URL);
  let _listing: serde_json::Value =
      send_json::<(), _>(api_key, Method::GET, &url, None, VALIDATE_TIMEOUT).await?;
  Ok(())
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::error::ark_api_error::ArkApiErrorKind;

  const API_KEY_ENV_VAR: &str = "BYTEPLUS_API_KEY";

  // Live tests call ModelArk (no generation, no cost). Run with:
  //   BYTEPLUS_API_KEY=... cargo test -p byteplus_ark_client -- --ignored
  mod live {
    use super::*;

    #[tokio::test]
    #[ignore]
    async fn accepts_a_real_key() {
      let key = std::env::var(API_KEY_ENV_VAR).expect("set BYTEPLUS_API_KEY for live tests");
      validate_api_key(&ArkApiKey::new(&key)).await.unwrap();
    }

    #[tokio::test]
    #[ignore]
    async fn rejects_a_made_up_key() {
      let err = validate_api_key(&ArkApiKey::new("not-a-real-key")).await.unwrap_err();
      match err {
        ArkError::Api(api_err) => assert_eq!(api_err.kind, ArkApiErrorKind::InvalidApiKey),
        other => panic!("expected an API error, got {:?}", other),
      }
    }
  }
}
