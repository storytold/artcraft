use crate::credentials::grok_client_secrets::GrokClientSecrets;
use crate::credentials::grok_full_credentials::GrokFullCredentials;
use crate::datatypes::api::aspect_ratio::AspectRatio;
use crate::datatypes::api::video_generation_mode::VideoGenerationMode;
use crate::datatypes::file_upload_spec::FileUploadSpec;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;
use crate::error::grok_specific_api_error::GrokSpecificApiError;
use crate::recipes::request_client_secrets::{request_client_secrets, RequestClientSecretsArgs};
use crate::recipes::upload_image_and_generate_video::{ImageUploadAndGenerateVideoResult, UploadImageAndGenerateVideo};
use crate::requests::media_posts::create_media_post::grok_create_media_post::{GrokCreateMediaPost, MediaPostType};
use crate::requests::media_posts::like_media_post::grok_like_media::GrokLikeMediaPost;
use crate::requests::upload_file::grok_upload_file::GrokUploadFile;
use crate::requests::video_chat::grok_video_gen_chat_conversation::{GrokVideoGenChatConversationBuilder, VideoMediaPostType};
use crate::utils::user_and_file_id_to_image_url::user_and_file_id_to_image_url;
use crate::utils::user_and_file_id_to_video_url::user_and_file_id_to_video_url;
use log::{error, info};
use std::path::Path;
use std::time::Duration;

pub struct UploadImageAndGenerateVideoWithRetry<'a, P: AsRef<Path>> {
  pub credentials: &'a GrokFullCredentials,

  // NB: Must be owned.
  pub file: FileUploadSpec<P>,

  /// Video generation prompt
  pub prompt: Option<&'a str>,

  /// Aspect ratio for the video.
  pub aspect_ratio: Option<AspectRatio>,

  /// Mode to generate the video: normal, fun, spicy, etc.
  pub mode: Option<VideoGenerationMode>,

  /// Wait for the full video to be generated before returning
  /// By default, the endpoint stays open for 30-ish seconds while
  /// the video generates and streams back JSON progress updates.
  /// If we set this to false, we'll wait for the video ID and exit
  /// the request early, before the video is finished asynchronously
  /// generating.
  pub wait_for_generation: bool,

  pub individual_request_timeout: Option<Duration>,
}

#[derive(Clone)]
pub struct ImageUploadAndGenerateVideoWithRetryResult {
  /// If new secrets were generated, they're stored here.
  pub maybe_new_client_secrets: Option<GrokClientSecrets>,

  /// The video generation result.
  pub upload_result: ImageUploadAndGenerateVideoResult,
}

pub async fn upload_image_and_generate_video_with_retry<P: AsRef<Path>>(
  args: UploadImageAndGenerateVideoWithRetry<'_, P>
) -> Result<ImageUploadAndGenerateVideoWithRetryResult, GrokError> {

  let mut current_full_credentials_ref = args.credentials;
  let mut maybe_new_credentials = None;

  info!("Uploading file to Grok...");

  let request = GrokUploadFile {
    file: args.file,
    cookie: current_full_credentials_ref.cookies.to_string(),
    request_timeout: args.individual_request_timeout,
  };

  let upload_result = request.upload().await?;

  info!("File URI: {:?}", upload_result.file_uri);
  info!("File Metadata ID: {:?}", upload_result.file_id);

  let upload_file_id = match upload_result.file_id {
    Some(id) => id,
    None => {
      error!("Previous file upload failed. Cannot continue.");
      return Err(GrokGenericApiError::UploadFailed.into());
    }
  };

  let url = user_and_file_id_to_image_url(
    &current_full_credentials_ref.client_secrets.user_id,
    &upload_file_id
  );

  info!("Uploaded URI: {:?}", url);

  info!("Creating media post...");

  let request = GrokCreateMediaPost {
    user_id: &current_full_credentials_ref.client_secrets.user_id,
    file_id: &upload_file_id,
    media_type: MediaPostType::UserUploadedImage,
    cookie: current_full_credentials_ref.cookies.as_str(),
    request_timeout: args.individual_request_timeout,
  };

  let post_result = request.send().await?;

  info!("Posted Image.");

  info!("Video prompt: {:?}", args.prompt);
  info!("Video aspect ratio: {:?}", args.aspect_ratio);

  let mut video_enqueued_successfully = false;
  let mut generation_is_complete= false;
  let mut maybe_video_file_id = None;
  let mut last_error = None;

  for i in 0..3 {
    info!("Generate video... attempt {}", (i+1));

    let request = GrokVideoGenChatConversationBuilder {
      user_id: &current_full_credentials_ref.client_secrets.user_id,
      file_id: &upload_file_id,
      media_type: VideoMediaPostType::UserUploadedImage,
      cookie: current_full_credentials_ref.cookies.as_str(),
      prompt: args.prompt,
      mode: args.mode,
      aspect_ratio: args.aspect_ratio,
      request_timeout: args.individual_request_timeout,
      baggage: &current_full_credentials_ref.client_secrets.baggage,
      sentry_trace: &current_full_credentials_ref.client_secrets.sentry_trace,
      verification_token: &current_full_credentials_ref.client_secrets.verification_token,
      svg_data: &current_full_credentials_ref.client_secrets.svg_path_data,
      numbers: &current_full_credentials_ref.client_secrets.numbers,
    };

    let video_gen_result =
      if args.wait_for_generation {
        request.wait_for_video()
            .await
            .map(|res| res.video_file_id)
      } else {
        request.stream_only_video_id()
            .await
            .map(|res| res.video_file_id)
      };

    match video_gen_result {
      Ok(res) => {
        info!("Video Generation Enqueued!");
        video_enqueued_successfully = true;
        generation_is_complete = args.wait_for_generation; // If we synchronously waited, it'll be complete.
        maybe_video_file_id = res;
        break;
      }
      Err(GrokError::ApiSpecific(GrokSpecificApiError::AutomationBlocked)) => {
        info!("Grok automation blocked; renewing credentials.");
        last_error = Some(GrokError::ApiSpecific(GrokSpecificApiError::AutomationBlocked));
      }
      Err(err) => {
        info!("Grok error; renewing credentials. Error = {:?}", err);
        last_error = Some(err);
      }
    }

    info!("Refreshing Grok client secrets...");

    let secrets = request_client_secrets(RequestClientSecretsArgs {
      cookies: &current_full_credentials_ref.cookies,
    }).await?;

    // NB: This is just to appease the borrow checker. It doesn't like that we're borrowing `maybe_new_credentials`
    // in a loop and replacing it while borrowed, hence this hack.
    current_full_credentials_ref = args.credentials;

    maybe_new_credentials = Some(GrokFullCredentials::from_cookies_and_client_secrets(
      current_full_credentials_ref.cookies.clone(),
      secrets,
    ));

    if let Some(creds) = maybe_new_credentials.as_ref() {
      current_full_credentials_ref = creds;
    }
  }

  if !video_enqueued_successfully {
    if let Some(err) = last_error {
      return Err(err);
    } else {
      // NB: This branch should be impossible as we should always set last_error.
      return Err(GrokError::Client(GrokClientError::ErrorGeneratingVideo))
    }
  }

  let mut video_liked_successfully = false;
  let mut last_error = None;

  for i in 0..3 {
    info!("Liking media ... attempt {}", (i+1));

    let request = GrokLikeMediaPost {
      file_id: &upload_file_id,
      cookie: current_full_credentials_ref.cookies.as_str(),
      request_timeout: args.individual_request_timeout,
      baggage: &current_full_credentials_ref.client_secrets.baggage,
      sentry_trace: &current_full_credentials_ref.client_secrets.sentry_trace,
      verification_token: &current_full_credentials_ref.client_secrets.verification_token,
      svg_data: &current_full_credentials_ref.client_secrets.svg_path_data,
      numbers: &current_full_credentials_ref.client_secrets.numbers,
    };

    let like_result = request.send().await;

    match like_result {
      Ok(_) => {
        info!("Media Liked");
        video_liked_successfully = true;
        break;
      }
      Err(GrokError::ApiSpecific(GrokSpecificApiError::AutomationBlocked)) => {
        info!("Grok automation blocked liking media; renewing credentials.");
        last_error = Some(GrokError::ApiSpecific(GrokSpecificApiError::AutomationBlocked));
      }
      Err(err) => {
        info!("Grok error liking media; renewing credentials. Error = {:?}", err);
        last_error = Some(err);
      }
    }

    info!("Refreshing Grok client secrets...");

    let secrets = request_client_secrets(RequestClientSecretsArgs {
      cookies: &current_full_credentials_ref.cookies,
    }).await?;

    // NB: This is just to appease the borrow checker. It doesn't like that we're borrowing `maybe_new_credentials`
    // in a loop and replacing it while borrowed, hence this hack.
    current_full_credentials_ref = args.credentials;

    maybe_new_credentials = Some(GrokFullCredentials::from_cookies_and_client_secrets(
      current_full_credentials_ref.cookies.clone(),
      secrets,
    ));

    if let Some(creds) = maybe_new_credentials.as_ref() {
      current_full_credentials_ref = creds;
    }
  }

  if !video_liked_successfully {
    if let Some(err) = last_error {
      return Err(err);
    } else {
      // NB: This branch should be impossible as we should always set last_error.
      return Err(GrokError::Client(GrokClientError::ErrorGeneratingVideo))
    }
  }

  let maybe_video_url = maybe_video_file_id
      .as_ref()
      .map(|file_id| {
        user_and_file_id_to_video_url(&current_full_credentials_ref.client_secrets.user_id, file_id, false)
      });

  Ok(ImageUploadAndGenerateVideoWithRetryResult {
    maybe_new_client_secrets: maybe_new_credentials
        .map(|secrets| secrets.client_secrets),
    upload_result: ImageUploadAndGenerateVideoResult {
      post_id: post_result.post_id,
      image_file_id: upload_file_id,
      video_file_id: maybe_video_file_id,
      video_url: maybe_video_url,
      generation_is_complete,
    }
  })
}


#[cfg(test)]
mod tests {
  use crate::credentials::grok_full_credentials::GrokFullCredentials;
  use crate::datatypes::api::aspect_ratio::AspectRatio;
  use crate::datatypes::api::video_generation_mode::VideoGenerationMode;
  use crate::datatypes::file_upload_spec::FileUploadSpec;
  use crate::recipes::request_client_secrets::{request_client_secrets, RequestClientSecretsArgs};
  use crate::recipes::upload_image_and_generate_video_with_retry::{upload_image_and_generate_video_with_retry, UploadImageAndGenerateVideoWithRetry};
  use crate::test_utils::get_test_cookies::get_typed_test_cookies;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use errors::AnyhowResult;
  use log::LevelFilter;

  // Result: GrokUploadFileResponse { file_metadata_id:
  // Some("acdee48f-9d6f-4bc6-9d06-fcc97dd4418a"), file_uri:
  // Some("users/85980643-ffab-4984-a3de-59a608c47d7f/acdee48f-9d6f-4bc6-9d06-fcc97dd4418a/content") }

  #[tokio::test]
  #[ignore] // Client side tests only
  async fn test_upload_image_and_generate_video() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Info);

    //let image_path = "/Users/bt/Pictures/Zelda 64 Art/FCgYX6tWEAEhpsy.jpg";
    //let prompt = "our hero link plunges the sword into the pedestal, the temple is glowing with a blue aura";

    let image_path = "/Users/bt/Pictures/Midjourney/hipster_girl.png";
    let maybe_prompt = Some("an anime girl turns and high fives a giant t-rex");

    let cookies = get_typed_test_cookies()?;

    let mut bad_secrets = request_client_secrets(RequestClientSecretsArgs {
      cookies: &cookies,
    }).await?;

    // NB: We're purposely messing these up to trigger "retry".
    bad_secrets.numbers.numbers = Vec::new();
    bad_secrets.sentry_trace.0 = "".to_string();

    let credentials = GrokFullCredentials::from_cookies_and_client_secrets(cookies, bad_secrets);

    let result = upload_image_and_generate_video_with_retry(UploadImageAndGenerateVideoWithRetry {
      credentials: &credentials,
      file: FileUploadSpec::Path(image_path),
      prompt: maybe_prompt,
      mode: Some(VideoGenerationMode::Custom),
      aspect_ratio: Some(AspectRatio::TallTwoByThree),
      individual_request_timeout: None,
      wait_for_generation: false,
    }).await?;

    let new_secrets = result.maybe_new_client_secrets;

    println!("[test] New secrets ? : {:?}", new_secrets.is_some());

    if let Some(secrets) = new_secrets {
      println!("[test] Verification Token: {:?}", secrets.verification_token);
      println!("[test] Sentry Trace: {:?}", secrets.sentry_trace);
      println!("[test] Numbers: {:?}", secrets.numbers);
      println!("[test] Svg Path: {:?}", secrets.svg_path_data);
      println!("[test] Baggage: {:?}", secrets.baggage);
    }

    let video_result = result.upload_result;

    println!("[test] Post ID: {:?}", video_result.post_id);
    println!("[test] Image File ID: {:?}", video_result.image_file_id);
    println!("[test] Video File ID: {:?}", video_result.video_file_id);
    println!("[test] Video URL: {:?}", video_result.video_url);

    assert_eq!(1, 2);

    Ok(())
  }
}
