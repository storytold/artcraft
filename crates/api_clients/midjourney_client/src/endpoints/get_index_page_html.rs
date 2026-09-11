use crate::client::midjourney_hostname::MidjourneyHostname;
use crate::error::midjourney_api_error::MidjourneyApiError;
use crate::error::midjourney_client_error::MidjourneyClientError;
use crate::error::midjourney_error::MidjourneyError;
use cloudflare_errors::filter_cloudflare_errors::filter_cloudflare_errors;
use log::error;
use serde::Deserialize;
use wreq::Client;
use wreq_util::Emulation;

/// This grabs the pre-rendered HTML page, which contains the websocket token and other details.
pub struct GetIndexPageRequest {
  pub hostname: MidjourneyHostname,
  pub cookie_header: String,
}

pub async fn get_index_page_html(req: GetIndexPageRequest) -> Result<String, MidjourneyError> {
  let url = format!("https://{}/", req.hostname.as_str());

  let client = Client::builder()
      .emulation(Emulation::Firefox139)
      .build()
      .map_err(|err| MidjourneyClientError::WreqError(err))?;

  let cookie_header = req.cookie_header.trim();

  if cookie_header.len() < 20 {
    error!("Cookie header is too short (len: {}): {}", cookie_header.len(), cookie_header);
    return Err(MidjourneyClientError::CookieTooShort.into());
  }

  // NB: missing headers that were in the browser request:
  // -H 'sec-ch-ua-platform: "macOS"' \
  // -H 'sec-ch-ua: "Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"' \

  let mut http_request = client.get(url)
      .header("cookie", cookie_header)
      .header("Referrer-Policy", "origin-when-cross-origin")
      .header("accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7")
      .header("accept-language", "en-US,en;q=0.8")
      .header("content-type", "application/json")
      .header("priority", "u=0, i")
      .header("sec-ch-ua-mobile", "?0")
      .header("sec-fetch-dest", "document")
      .header("sec-fetch-mode", "navigate")
      .header("sec-fetch-site", "none")
      .header("sec-fetch-user", "?1")
      .header("upgrade-insecure-requests", "1");

  let http_request  = http_request
      .build()
      .map_err(|err| MidjourneyClientError::WreqError(err))?;

  let response = client.execute(http_request)
      .await
      .map_err(|e| MidjourneyApiError::NetworkError(e.to_string()))?;

  let status = response.status();

  let response_body = response.text().await
      .map_err(|e| MidjourneyApiError::NetworkError(e.to_string()))?;

  if !status.is_success() {
    if let Err(err) = filter_cloudflare_errors(status.as_u16(), &response_body) {
      return Err(MidjourneyApiError::CloudflareError(err).into());
    }
  }
  
  Ok(response_body)
}

#[cfg(test)]
mod tests {
  use crate::client::midjourney_hostname::MidjourneyHostname;
  use errors::AnyhowResult;
  use filesys::read_to_trimmed_string::read_to_trimmed_string;
  use crate::endpoints::get_index_page_html::{get_index_page_html, GetIndexPageRequest};

  #[ignore]
  #[tokio::test]
  async fn test() -> AnyhowResult<()> {
    let cookie_header = read_to_trimmed_string("/Users/bt/secrets/midjourney/cookie.txt")?;

    let result = get_index_page_html(GetIndexPageRequest {
      cookie_header,
      hostname: MidjourneyHostname::Standard,
    }).await?;

    println!("Response: {:?}\n\n", result);

    assert_eq!(1, 2);

    Ok(())
  }
}
