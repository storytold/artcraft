use crate::error::api_error::ApiError;
use crate::utils::api_host::ApiHost;
use crate::utils::storyteller_client_builder::storyteller_client_builder;

pub async fn http_get_anonymous(api_host: &ApiHost, url: String) -> Result<reqwest::Response, ApiError> {
  let client = storyteller_client_builder(api_host)
      .build()?;

  let response = client.get(url)
      .header("Accept", "application/json")
      //.header("Accept-Encoding", "gzip, deflate, br")
      .send()
      .await?;

  Ok(response)
}
