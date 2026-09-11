use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;
use crate::error::grok_specific_api_error::GrokSpecificApiError;
use cloudflare_errors::filter_cloudflare_errors::filter_cloudflare_errors;
use wreq::StatusCode;

/// We know the response is an error at this point.
/// We're just turning it into the right error.
pub fn categorize_grok_http_error(status_code: StatusCode, maybe_body: Option<&str>) -> GrokError {

  if let Some(body) = maybe_body {
    if let Err(err) = filter_cloudflare_errors(status_code.as_u16(), body) {
      return GrokGenericApiError::CloudflareError(err).into();
    }

    let body = body.to_lowercase();
    let anti_bot = body.contains("anti-bot") || body.contains("rejected");

    if anti_bot {
      return GrokSpecificApiError::AutomationBlocked.into();
    }

    match status_code {
      StatusCode::TOO_MANY_REQUESTS => {
        return GrokSpecificApiError::TooManyVideos.into();
      }
      _ => {},
    }

    return GrokGenericApiError::UncategorizedBadResponseWithStatusAndBody {
      status_code,
      body: body.to_string(),
    }.into();
  }

  GrokGenericApiError::UncategorizedBadResponseWithStatus(status_code).into()
}
