use crate::client::midjourney_hostname::MidjourneyHostname;
use crate::error::midjourney_api_error::MidjourneyApiError;
use crate::error::midjourney_client_error::MidjourneyClientError;
use crate::error::midjourney_error::MidjourneyError;
use browser_emulation::browser_profile::BrowserProfile;
use cloudflare_errors::filter_cloudflare_errors::filter_cloudflare_errors;
use log::error;

/// Fetches the pre-rendered index HTML (which contains the websocket token and
/// other details). Has no semantic parameters — only transport concerns.
pub struct GetIndexPageArgs<'a> {
  pub cookie_header: &'a str,
  /// Defaults to the standard hostname if absent.
  pub hostname: Option<&'a MidjourneyHostname>,
  /// Defaults to [`BrowserProfile::default`] if absent.
  pub browser: Option<BrowserProfile>,
}

pub async fn get_index_page_html(args: GetIndexPageArgs<'_>) -> Result<String, MidjourneyError> {
  let default_hostname = MidjourneyHostname::Standard;
  let hostname = args.hostname.unwrap_or(&default_hostname);

  let url = format!("https://{}/", hostname.as_str());

  let client = args.browser.clone().unwrap_or_default()
      .build_client()
      .map_err(MidjourneyClientError::WreqError)?;

  let cookie_header = args.cookie_header.trim();

  if cookie_header.len() < 20 {
    error!("Cookie header is too short (len: {})", cookie_header.len());
    return Err(MidjourneyClientError::CookieTooShort.into());
  }

  // NB: Browser-identity headers (user-agent, sec-ch-ua*, accept-encoding) come
  // from the emulation on the client; only request-context headers are set here.
  let http_request = client.get(url)
      .header("cookie", cookie_header)
      .header("Referrer-Policy", "origin-when-cross-origin")
      .header("accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7")
      .header("accept-language", "en-US,en;q=0.8")
      .header("priority", "u=0, i")
      .header("sec-fetch-dest", "document")
      .header("sec-fetch-mode", "navigate")
      .header("sec-fetch-site", "none")
      .header("sec-fetch-user", "?1")
      .header("upgrade-insecure-requests", "1");

  let http_request = http_request
      .build()
      .map_err(MidjourneyClientError::WreqError)?;

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
  use crate::endpoints::get_index_page_html::{get_index_page_html, GetIndexPageArgs};
  use errors::AnyhowResult;
  use filesys::read_to_trimmed_string::read_to_trimmed_string;

  #[ignore]
  #[tokio::test]
  async fn test() -> AnyhowResult<()> {
    let cookie_header = read_to_trimmed_string("/Users/bt/secrets/midjourney/cookie.txt")?;

    let result = get_index_page_html(GetIndexPageArgs {
      cookie_header: &cookie_header,
      hostname: None,
      browser: None,
    }).await?;

    println!("Response: {:?}\n\n", result);

    assert_eq!(1, 2);

    Ok(())
  }
}
