use crate::error::midjourney_api_error::MidjourneyApiError;
use crate::error::midjourney_client_error::MidjourneyClientError;
use crate::error::midjourney_error::MidjourneyError;
use crate::utils::get_image_url::get_image_url;
use browser_emulation::browser_profile::BrowserProfile;
use cloudflare_errors::filter_cloudflare_errors::filter_cloudflare_errors;
use wreq::Client;

#[derive(Clone)]
pub struct ImageDownloaderClient {
  client: Client,
}

impl ImageDownloaderClient {
  /// Build a downloader. `maybe_browser` defaults to [`BrowserProfile::default`].
  pub fn create(maybe_browser: Option<BrowserProfile>) -> Result<Self, MidjourneyClientError> {
    Ok(Self {
      client: maybe_browser.unwrap_or_default()
          .build_client()
          .map_err(MidjourneyClientError::WreqError)?,
    })
  }

  pub async fn download_image(&self, job_id: &str, image_index: u8) -> anyhow::Result<Vec<u8>, MidjourneyError> {
    let url = get_image_url(job_id, image_index)?;

    // TODO: Cookies
    // TODO: Cache control headers?
    // NB: Browser-identity headers come from the emulation on the client; only
    // request-context headers are set here.
    let http_request = self.client.get(url)
        .header("Referrer", "https://www.midjourney.com/")
        .header("accept", "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8")
        .header("accept-language", "en-US,en;q=0.8")
        .header("priority", "i")
        .header("sec-fetch-dest", "image")
        .header("sec-fetch-mode", "no-cors")
        .header("sec-fetch-site", "same-site");

    let http_request  = http_request
        .build()
        .map_err(|err| MidjourneyClientError::WreqError(err))?;

    let response = self.client.execute(http_request)
        .await
        .map_err(|e| MidjourneyApiError::NetworkError(e.to_string()))?;

    let status = response.status();

    let response_bytes = response.bytes().await
        .map_err(|e| MidjourneyApiError::NetworkError(e.to_string()))?;

    if !status.is_success() {
      let response_body = String::from_utf8_lossy(&response_bytes).to_string();
      if let Err(err) = filter_cloudflare_errors(status.as_u16(), &response_body) {
        return Err(MidjourneyApiError::CloudflareError(err).into());
      }

      return Err(MidjourneyApiError::UnknownHttpFailure {
        status_code: status.as_u16(),
        body: response_body,
      }.into());
    }

    Ok(response_bytes.to_vec())
  }
}
