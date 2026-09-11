use crate::error::midjourney_api_error::MidjourneyApiError;
use crate::error::midjourney_client_error::MidjourneyClientError;
use crate::error::midjourney_error::MidjourneyError;
use crate::utils::get_image_url::get_image_url;
use cloudflare_errors::filter_cloudflare_errors::filter_cloudflare_errors;
use wreq::Client;
use wreq_util::Emulation;

#[derive(Clone)]
pub struct ImageDownloaderClient {
  client: Client,
}

impl ImageDownloaderClient {
  pub fn create() -> Result<Self, MidjourneyClientError> {
    Ok(Self {
      client: Client::builder()
          .emulation(Emulation::Firefox139)
          .build()
          .map_err(|err| MidjourneyClientError::WreqError(err))?
    })
  }

  pub async fn download_image(&self, job_id: &str, image_index: u8) -> anyhow::Result<Vec<u8>, MidjourneyError> {
    let url = get_image_url(job_id, image_index)?;

    // TODO: Cookies
    // TODO: Cache control headers?
    let mut http_request = self.client.get(url)
        //.header("Referrer-Policy", "origin-when-cross-origin")
        //.header("content-type", "application/json")
        //.header("sec-fetch-user", "?1")
        //.header("upgrade-insecure-requests", "1");
        .header("Referrer", "https://www.midjourney.com/")
        .header("accept", "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8")
        .header("accept-language", "en-US,en;q=0.8")
        .header("priority", "i")
        .header("sec-ch-ua-mobile", "?0")
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
