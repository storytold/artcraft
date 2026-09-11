use crate::creds::sora_credential_set::SoraCredentialSet;
use crate::error::sora_error::SoraError;
use crate::recipes::utils::maybe_renew_sentinel_token::maybe_renew_sentinel_token;
use crate::recipes::utils::maybe_renew_session_jwt::maybe_renew_session_jwt;
use crate::requests::generate_sora2_video::generate_sora2_video::{generate_sora2_video, GenerateSora2VideoArgs, GenerateSora2VideoResponse};
use std::io::Write;

/// Generate Sora 2 video with session auto-renewal.
/// If a new sora credential is returned, replace the old one with the new one.
pub async fn generate_sora2_video_with_session_auto_renew(
  args: GenerateSora2VideoArgs<'_>,
) -> Result<(GenerateSora2VideoResponse, Option<SoraCredentialSet>), SoraError> {

  let mut maybe_new_creds = maybe_renew_session_jwt(&args.credentials).await?;

  let use_creds = maybe_new_creds.as_ref()
      .unwrap_or_else(|| &args.credentials);

  let mut maybe_new_creds = maybe_renew_sentinel_token(use_creds).await?;

  let use_creds = maybe_new_creds.as_ref()
      .unwrap_or_else(|| &args.credentials);

  let mut request = args.clone();
  request.credentials = use_creds;

  let result = generate_sora2_video(request).await;

  match result {
    Ok(response) => Ok((response, maybe_new_creds)),
    Err(err) => Err(err), // TODO: Should we retry?
  }
}

#[cfg(test)]
mod tests {
  use crate::recipes::generate_sora2_video::generate_sora2_video_with_session_auto_renew::generate_sora2_video_with_session_auto_renew;
  use crate::requests::generate_sora2_video::generate_sora2_video::{GenerateSora2VideoArgs, Orientation};
  use crate::test_utils::get_test_credentials::get_test_credentials;
  use errors::AnyhowResult;

  #[ignore] // You can manually run "ignore" tests in the IDE, but they won't run in CI.
  #[tokio::test]
  pub async fn manual_test() -> AnyhowResult<()> {
    let creds = get_test_credentials()?;

    let args = GenerateSora2VideoArgs {
      prompt: "a Golden Retriever playing basketball at Venice Beach during sunset",
      credentials: &creds,
      request_timeout: None,
      orientation: Orientation::Landscape,
      image_reference_media_ids: None,
    };

    let (result , creds) =
        generate_sora2_video_with_session_auto_renew(args).await?;

    println!("result: {:#?}", result);
    assert_eq!(1, 2);

    Ok(())
  }
}
