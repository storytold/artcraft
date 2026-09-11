use crate::client::midjourney_hostname::MidjourneyHostname;
use crate::endpoints::submit_job::{submit_job, SubmitJobRequest};
use crate::error::midjourney_error::MidjourneyError;
use crate::recipes::channel_id::ChannelId;

pub struct TextToImageRequest<'a> {
  pub prompt: &'a str,
  pub channel_id: &'a ChannelId,
  pub hostname: MidjourneyHostname,
  pub cookie_header: String,
}

#[derive(Debug, Clone)]
pub struct TextToImageResponse {
  /// On success, the job ID is returned.
  pub maybe_job_id: Option<String>,

  /// On error, we have a list of error messages.
  pub maybe_errors: Option<Vec<TextToImageError>>,
}

#[derive(Debug, Clone)]
pub struct TextToImageError {
  pub error_type: Option<String>,
  pub message: Option<String>,
}

/// Slightly more ergonomic text-to-image API.
/// As we add more `submit_job()` cases, we'll keep this simple.
pub async fn text_to_image(req: TextToImageRequest<'_>) -> Result<TextToImageResponse, MidjourneyError> {
  let channel_id = req.channel_id.to_string();

  let response = submit_job(SubmitJobRequest {
    prompt: req.prompt,
    channel_id: &channel_id,
    hostname: req.hostname,
    cookie_header: req.cookie_header,
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
