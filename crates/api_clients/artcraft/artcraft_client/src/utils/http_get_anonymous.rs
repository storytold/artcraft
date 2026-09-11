use crate::error::api_error::ApiError;
use reqwest::Client;
const USER_AGENT: &str = "storyteller-client/1.0";

pub async fn http_get_anonymous(url: String) -> Result<reqwest::Response, ApiError> {
  let client = Client::builder()
      .gzip(true)
      .build()?;

  let response = client.get(url)
      .header("User-Agent", USER_AGENT)
      .header("Accept", "application/json")
      //.header("Accept-Encoding", "gzip, deflate, br")
      .send()
      .await?;

  Ok(response)
}
