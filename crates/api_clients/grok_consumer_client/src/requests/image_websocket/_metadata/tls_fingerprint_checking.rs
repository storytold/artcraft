use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use std::time::Duration;
use wreq::header::{HeaderMap, USER_AGENT};
use wreq::{Client, Proxy};
use wreq_util::Emulation;

const FINGERPRINT_URL : &str = "https://tools.scrapfly.io/api/tls";

fn build_chrome_140_client() -> Result<Client, GrokError> {
  Ok(Client::builder()
      .emulation(Emulation::Chrome140)
      .connection_verbose(true)
      .connect_timeout(Duration::from_secs(10))
      .build()
      .map_err(|err| GrokClientError::WreqClientError(err))?)
}

fn build_firefox_139_client() -> Result<Client, GrokError> {
  Ok(Client::builder()
      .emulation(Emulation::Firefox139) // NB: THIS IS IDENTICAL IN FINGERPRINT TO REAL FIREFOX !!!
      .connection_verbose(true)
      .connect_timeout(Duration::from_secs(10))
      .build()
      .map_err(|err| GrokClientError::WreqClientError(err))?)
}

fn build_firefox_143_client() -> Result<Client, GrokError> {
  Ok(Client::builder()
      .emulation(Emulation::Firefox143) // NB: THIS IS IDENTICAL IN FINGERPRINT TO REAL FIREFOX !!!
      .connection_verbose(true)
      .connect_timeout(Duration::from_secs(10))
      .build()
      .map_err(|err| GrokClientError::WreqClientError(err))?)
}

fn build_raw_firefox_client_with_proxy() -> Result<Client, GrokError> {
  let proxy = Proxy::https("http://127.0.0.1:8080")
      .map_err(|err| GrokClientError::WreqClientError(err))?;
  Ok(Client::builder()
      .emulation(Emulation::Firefox143)
      .default_headers(HeaderMap::new())
      .proxy(proxy)
      .cert_verification(false)
      .connection_verbose(true)
      .connect_timeout(Duration::from_secs(10))
      .build()
      .map_err(|err| GrokClientError::WreqClientError(err))?)
}

async fn get_with_client(client: &Client) -> Result<String, GrokError> {
  let builder = client.get(FINGERPRINT_URL)
      .header("Accept", "application/json");

  let response = builder.send()
      .await
      .map_err(|err| GrokClientError::WreqClientError(err))?;


  let body = response.text()
      .await
      .map_err(|err| GrokClientError::WreqClientError(err))?;

  Ok(body)
}

#[cfg(test)]
mod tests {
  use errors::AnyhowResult;
  use super::*;

  #[tokio::test]
  #[ignore] // manually test
  async fn test() -> AnyhowResult<()> {
    let client = build_firefox_143_client()?;
    let body = get_with_client(&client).await?;
    println!("{}", body);
    assert_eq!(1, 2);
    Ok(())
  }
}
