use crate::client::midjourney_hostname::MidjourneyHostname;
use crate::endpoints::submit_job::{submit_job, MidjourneySubmitErrorType, SubmitJobArgs, SubmitJobRequest};
use crate::error::midjourney_error::MidjourneyError;
use crate::recipes::channel_id::ChannelId;
use browser_emulation::browser_profile::BrowserProfile;

/// The semantic parameters of a text-to-image request.
pub struct TextToImageRequest<'a> {
  pub prompt: &'a str,
  pub channel_id: &'a ChannelId,
}

/// A text-to-image request plus its transport concerns.
pub struct TextToImageArgs<'a> {
  pub request: TextToImageRequest<'a>,
  pub cookie_header: &'a str,
  /// Defaults to the standard hostname if absent.
  pub hostname: Option<&'a MidjourneyHostname>,
  /// Defaults to [`BrowserProfile::default`] if absent.
  pub browser: Option<BrowserProfile>,
}

#[derive(Debug, Clone)]
pub struct TextToImageResponse {
  /// On success, the job ID is returned.
  pub maybe_job_id: Option<String>,

  /// On error, we have a list of error messages.
  pub maybe_errors: Option<Vec<TextToImageError>>,
}

impl TextToImageResponse {
  pub fn errors(&self) -> &[TextToImageError] {
    self.maybe_errors.as_deref().unwrap_or(&[])
  }

  /// Whether the request was rejected for lack of an active paid Midjourney
  /// subscription. See [`MidjourneySubmitErrorType::SubscriptionRequired`].
  pub fn is_subscription_required(&self) -> bool {
    self.errors()
        .iter()
        .any(|error| error.error_type == MidjourneySubmitErrorType::SubscriptionRequired)
  }
}

#[derive(Debug, Clone)]
pub struct TextToImageError {
  pub error_type: MidjourneySubmitErrorType,
  pub message: Option<String>,
}

/// Slightly more ergonomic text-to-image API.
/// As we add more `submit_job()` cases, we'll keep this simple.
pub async fn text_to_image(args: TextToImageArgs<'_>) -> Result<TextToImageResponse, MidjourneyError> {
  let channel_id = args.request.channel_id.to_string();

  let response = submit_job(SubmitJobArgs {
    request: SubmitJobRequest {
      prompt: args.request.prompt,
      channel_id: &channel_id,
    },
    cookie_header: args.cookie_header,
    hostname: args.hostname,
    browser: args.browser,
  }).await?;

  Ok(TextToImageResponse {
    maybe_job_id: response.maybe_job_id,
    maybe_errors: response.maybe_errors.map(|errs| {
      errs.into_iter().map(|e| TextToImageError {
        error_type: e.error_type,
        message: e.message,
      }).collect()
    }),
  })
}
