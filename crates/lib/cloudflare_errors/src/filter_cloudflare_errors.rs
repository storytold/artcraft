use crate::cloudflare_error::CloudflareError;

/// This only filters out Cloudflare errors. Any other errors will be returned as `Ok(())`.
pub fn filter_cloudflare_errors(status_code: u16, body: &str) -> Result<(), CloudflareError> {
  if status_code >= 200 && status_code < 300 {
    return Ok(());
  }

  match status_code {
    403 => {
      if body.contains("challenge-platform")
          || body.contains("challenge-error-text")
          || body.contains("cType: 'managed'")
          || body.contains("Just a moment...") {
        return Err(CloudflareError::ChallengeInterstitial403);
      }
    }
    _ => {}, // Fall-through
  }

  // TODO: This is a really bad heuristic.
  let is_cloudflare = body.contains("cloudflare")
      || body.contains("Cloudflare");

  // let is_cloudflare = body.contains("cloudflare.com")
  //     || body.contains("Cloudflare Ray ID");

  if !is_cloudflare {
    return Ok(());
  }

  match status_code {
    301 => return Err(CloudflareError::MovedPermanently301), // TODO: Include location header.
    502 => return Err(CloudflareError::BadGateway502),
    504 => return Err(CloudflareError::GatewayTimeout504),
    524 => return Err(CloudflareError::TimeoutOccurred524),
    _ => {},
  }

  if body.contains("errorcode_504")
      || body.contains("Gateway time-out")
      || body.contains("Error code 504")
  {
    return Err(CloudflareError::GatewayTimeout504);
  }

  Ok(())
}

#[cfg(test)]
mod tests {
  use super::*;

  const CLOUDFLARE_PAGE: &str = "<html><body>Error from Cloudflare</body></html>";

  #[test]
  fn success_statuses_always_pass() {
    assert!(filter_cloudflare_errors(200, CLOUDFLARE_PAGE).is_ok());
    assert!(filter_cloudflare_errors(204, "").is_ok());
    assert!(filter_cloudflare_errors(299, "Just a moment...").is_ok());
  }

  #[test]
  fn a_403_with_a_challenge_page_is_a_challenge() {
    for body in ["x challenge-platform x", "challenge-error-text", "cType: 'managed'", "<title>Just a moment...</title>"] {
      assert!(matches!(filter_cloudflare_errors(403, body), Err(CloudflareError::ChallengeInterstitial403)), "{}", body);
    }
  }

  #[test]
  fn a_plain_403_is_not_a_cloudflare_error() {
    assert!(filter_cloudflare_errors(403, "forbidden").is_ok());
  }

  #[test]
  fn gateway_statuses_from_a_cloudflare_page_are_classified() {
    assert!(matches!(filter_cloudflare_errors(301, CLOUDFLARE_PAGE), Err(CloudflareError::MovedPermanently301)));
    assert!(matches!(filter_cloudflare_errors(502, CLOUDFLARE_PAGE), Err(CloudflareError::BadGateway502)));
    assert!(matches!(filter_cloudflare_errors(504, CLOUDFLARE_PAGE), Err(CloudflareError::GatewayTimeout504)));
    assert!(matches!(filter_cloudflare_errors(524, CLOUDFLARE_PAGE), Err(CloudflareError::TimeoutOccurred524)));
  }

  #[test]
  fn the_same_statuses_without_cloudflare_text_are_left_to_the_caller() {
    for status in [301, 502, 504, 524] {
      assert!(filter_cloudflare_errors(status, "upstream error").is_ok(), "{}", status);
    }
  }

  #[test]
  fn a_gateway_timeout_message_on_another_status_is_still_a_timeout() {
    assert!(matches!(
      filter_cloudflare_errors(500, "Cloudflare: Gateway time-out"),
      Err(CloudflareError::GatewayTimeout504)
    ));
    assert!(matches!(
      filter_cloudflare_errors(500, "cloudflare errorcode_504"),
      Err(CloudflareError::GatewayTimeout504)
    ));
  }

  #[test]
  fn other_cloudflare_statuses_pass_through() {
    assert!(filter_cloudflare_errors(404, CLOUDFLARE_PAGE).is_ok());
    assert!(filter_cloudflare_errors(500, CLOUDFLARE_PAGE).is_ok());
  }

  #[test]
  fn error_messages_name_the_status() {
    assert!(CloudflareError::BadGateway502.to_string().contains("502"));
    assert!(CloudflareError::GatewayTimeout504.to_string().contains("504"));
    assert!(CloudflareError::TimeoutOccurred524.to_string().contains("524"));
    assert!(CloudflareError::MovedPermanently301.to_string().contains("301"));
    assert!(CloudflareError::ChallengeInterstitial403.to_string().contains("403"));
  }
}
