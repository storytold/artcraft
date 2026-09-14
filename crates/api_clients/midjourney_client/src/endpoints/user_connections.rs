use crate::client::midjourney_hostname::MidjourneyHostname;
use crate::error::midjourney_api_error::MidjourneyApiError;
use crate::error::midjourney_client_error::MidjourneyClientError;
use crate::error::midjourney_error::MidjourneyError;
use browser_emulation::browser_profile::BrowserProfile;
use cloudflare_errors::filter_cloudflare_errors::filter_cloudflare_errors;
use log::error;
use serde::Deserialize;

/// Lists the user's linked auth providers. Has no semantic parameters — only
/// transport concerns.
pub struct UserConnectionsArgs<'a> {
  pub cookie_header: &'a str,
  /// Defaults to the standard hostname if absent.
  pub hostname: Option<&'a MidjourneyHostname>,
  /// Defaults to [`BrowserProfile::default`] if absent.
  pub browser: Option<BrowserProfile>,
}

#[derive(Debug)]
pub struct UserData {
  pub provider_id: String,
  pub display_name: Option<String>,
  pub email: Option<String>,
  pub user_id: Option<String>,
}

#[derive(Debug)]
pub struct Provider {
  pub provider_id: String,
  pub user_data: Option<UserData>,
  pub is_linked: bool,
}

pub async fn user_connections(args: UserConnectionsArgs<'_>) -> Result<Vec<Provider>, MidjourneyError> {
  let default_hostname = MidjourneyHostname::Standard;
  let hostname = args.hostname.unwrap_or(&default_hostname);

  let referer = format!("https://{}", hostname.as_str());

  let url = format!("https://{}/api/user-connections", hostname.as_str());

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
          "providerId": "google.com",
          "userData": {
              "providerId": "google.com",
              "displayName": "John Doe",
              "email": "john.doe@gmail.com",
              "userId": "123456789000000001",
          },
          "isLinked": true
      },
      {
          "providerId": "discord.com",
          "isLinked": false
      }
  ]
  */

  #[derive(Deserialize, Debug)]
  #[allow(non_snake_case)]
  struct RawProviderUserData {
    providerId: String,
    displayName: Option<String>,
    email: Option<String>,
    userId: Option<String>,
  }

  #[derive(Deserialize, Debug)]
  #[allow(non_snake_case)]
  struct RawProvider {
    providerId: String,
    userData: Option<RawProviderUserData>,
    isLinked: bool,
  }

  let response : Vec<RawProvider> = serde_json::from_str(response_body)
      .map_err(|err| MidjourneyApiError::deserialization(err, response_body.as_str()))?;

  let providers = response
      .into_iter()
      .map(|r| Provider {
        provider_id: r.providerId,
        user_data: r.userData.map(|u| UserData {
          provider_id: u.providerId,
          display_name: u.displayName,
          email: u.email,
          user_id: u.userId,
        }),
        is_linked: r.isLinked,
      })
      .collect::<Vec<_>>();

  Ok(providers)
}

#[cfg(test)]
mod tests {
  use crate::endpoints::user_connections::{user_connections, UserConnectionsArgs};
  use errors::AnyhowResult;
  use filesys::read_to_trimmed_string::read_to_trimmed_string;

  #[ignore]
  #[tokio::test]
  async fn test() -> AnyhowResult<()> {
    let cookie_header = read_to_trimmed_string("/Users/bt/secrets/midjourney/cookie.txt")?;

    let result = user_connections(UserConnectionsArgs {
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

