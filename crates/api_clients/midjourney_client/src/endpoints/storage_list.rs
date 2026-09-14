use crate::client::midjourney_hostname::MidjourneyHostname;
use crate::error::midjourney_api_error::MidjourneyApiError;
use crate::error::midjourney_client_error::MidjourneyClientError;
use crate::error::midjourney_error::MidjourneyError;
use browser_emulation::browser_profile::BrowserProfile;
use cloudflare_errors::filter_cloudflare_errors::filter_cloudflare_errors;
use log::error;
use serde::Deserialize;

/// Lists the user's storage (the paths contain the user id). Has no semantic
/// parameters — only transport concerns.
pub struct StorageListArgs<'a> {
  pub cookie_header: &'a str,
  /// Defaults to the standard hostname if absent.
  pub hostname: Option<&'a MidjourneyHostname>,
  /// Defaults to [`BrowserProfile::default`] if absent.
  pub browser: Option<BrowserProfile>,
}

#[derive(Debug)]
pub struct StorageItem {
  // NB: The path contains the user ID.
  pub bucket_pathname: Option<String>,

  // NB: Other fields aren't necessary for us right now.
}

pub async fn storage_list(args: StorageListArgs<'_>) -> Result<Vec<StorageItem>, MidjourneyError> {
  let default_hostname = MidjourneyHostname::Standard;
  let hostname = args.hostname.unwrap_or(&default_hostname);

  let referer = format!("https://{}", hostname.as_str());

  let url = format!("https://{}/api/storage-list", hostname.as_str());

  let client = args.browser.clone().unwrap_or_default()
      .build_client()
      .map_err(MidjourneyClientError::WreqError)?;

  let cookie_header = args.cookie_header.trim();

  if cookie_header.len() < 20 {
    error!("Cookie header is too short (len: {})", cookie_header.len());
    return Err(MidjourneyClientError::CookieTooShort.into());
  }

  // NB: Browser-identity headers come from the emulation on the client; only
  // request-context headers are set here.
  let http_request = client.get(url)
      .header("cookie", cookie_header)
      .header("Referer", &referer)
      .header("Referrer-Policy", "origin-when-cross-origin")
      .header("accept", "*/*")
      .header("accept-language", "en-US,en;q=0.8")
      .header("content-type", "application/json")
      .header("priority", "u=1, i")
      .header("sec-fetch-dest", "empty")
      .header("sec-fetch-mode", "cors")
      .header("sec-fetch-site", "same-origin")
      .header("x-csrf-protection", "1");

  let http_request  = http_request
      .build()
      .map_err(|err| MidjourneyClientError::WreqError(err))?;

  let response = client.execute(http_request)
      .await
      .map_err(|e| MidjourneyApiError::NetworkError(e.to_string()))?;

  let status = response.status();

  // if status == 301 {
  //   for (name, value) in response.headers().iter() {
  //     println!("- {}: {}", name.as_str(), value.to_str().unwrap());
  //   }
  // }

  let response_body = &response.text().await
      .map_err(|e| MidjourneyApiError::NetworkError(e.to_string()))?;

  if !status.is_success() {
    if let Err(err) = filter_cloudflare_errors(status.as_u16(), &response_body) {
      return Err(MidjourneyApiError::CloudflareError(err).into());
    }
  }

  /*
  [
      {
          "bucketPathname": "UUID/OTHER_HEX_ENTROPY.png",
          "shortUrl": null,
          "type": "image-prompt",
          "origin": "web",
          "timeCreated": TIMESTAMP,
          "hidden": false,
          "contentType": "image/png",
          "state": "loaded"
      }
  ]
  */

  #[derive(Deserialize, Debug)]
  #[allow(non_snake_case)]
  struct RawStorageItem {
    bucketPathname: Option<String>,
  }

  let response : Vec<RawStorageItem> = serde_json::from_str(response_body)
      .map_err(|err| MidjourneyApiError::deserialization(err, response_body.as_str()))?;

  let items = response
      .into_iter()
      .map(|r| StorageItem {
        bucket_pathname: r.bucketPathname,
      })
      .collect::<Vec<_>>();

  Ok(items)
}

#[cfg(test)]
mod tests {
  use errors::AnyhowResult;
  use filesys::read_to_trimmed_string::read_to_trimmed_string;
  use crate::endpoints::storage_list::{storage_list, StorageListArgs};

  #[ignore]
  #[tokio::test]
  async fn test() -> AnyhowResult<()> {
    let cookie_header = read_to_trimmed_string("/Users/bt/secrets/midjourney/cookie.txt")?;

    let result = storage_list(StorageListArgs {
      cookie_header: &cookie_header,
      hostname: None,
      browser: None,
    }).await?;

    println!("Response: {:?}\n\n", result);

    for provider in result {
      println!("Provider: {:?}", provider);
    }

    assert_eq!(1, 2);

    Ok(())
  }
}
