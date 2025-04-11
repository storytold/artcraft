// Send a POST request to env variable SORA_SENTINEL_REFRESH_URL

use reqwest::Client;
use std::env;
use errors::AnyhowResult;


const SORA_SENTINEL_REFRESH_URL: &str = "http://oai-token-server/refresh_token";


// Refresh the Sora sentinel
// The response body does _not_ contain the new sentinel
// We should read it again from redis or generate a new one here
// For now we refresh in the server handler
pub async fn refresh_sentinel() -> AnyhowResult<String> {
    let client = Client::new();
    let url = env::var("SORA_SENTINEL_REFRESH_URL").unwrap_or(SORA_SENTINEL_REFRESH_URL.to_string());

    let response = client.post(url).send().await?;


    let body = response.text().await?;

    Ok(body)
}
