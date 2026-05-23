use crate::credentials::grok_full_credentials::GrokFullCredentials;
use crate::datatypes::api::aspect_ratio::AspectRatio;
use crate::datatypes::api::file_id::FileId;
use crate::datatypes::api::post_id::PostId;
use crate::datatypes::api::video_generation_mode::VideoGenerationMode;
use crate::datatypes::file_upload_spec::FileUploadSpec;
use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;
use crate::requests::media_posts::create_media_post::grok_create_media_post::{GrokCreateMediaPost, MediaPostType};
use crate::requests::media_posts::like_media_post::grok_like_media::GrokLikeMediaPost;
use crate::requests::upload_file::grok_upload_file::GrokUploadFile;
use crate::requests::video_chat::grok_video_gen_chat_conversation::{GrokVideoGenChatConversationBuilder, VideoMediaPostType};
use crate::utils::user_and_file_id_to_image_url::user_and_file_id_to_image_url;
use crate::utils::user_and_file_id_to_video_url::user_and_file_id_to_video_url;
use log::{error, info};
use std::path::Path;
use std::time::Duration;

pub struct UploadImageAndGenerateVideo<'a, P: AsRef<Path>> {
  pub full_credentials: &'a GrokFullCredentials,

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

#[derive(Debug, Clone)]
pub struct ImageUploadAndGenerateVideoResult {
  /// The ID of the "post"
  /// This often is equivalent to the upload id / `image_file_id`,
  /// and this is in the user-facing URL for website navigation to the video.
  pub post_id: PostId,

  /// The ID of the file we uploaded
  pub image_file_id: FileId,

  /// The ID of the video we're generating, which may or may not exist yet.
  pub video_file_id: Option<FileId>,

  /// The URL for the video, which may or may not exist yet.
  pub video_url: Option<String>,

  /// Whether the video generation has already completed.
  /// Based on request `wait_for_generation`.
  pub generation_is_complete: bool,
}

pub async fn upload_image_and_generate_video<P: AsRef<Path>>(args: UploadImageAndGenerateVideo<'_, P>)
  -> Result<ImageUploadAndGenerateVideoResult, GrokError>
{

  info!("Uploading file to Grok...");

  let request = GrokUploadFile {
    file: args.file,
    cookie: args.full_credentials.cookies.to_string(),
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
    &args.full_credentials.client_secrets.user_id,
    &upload_file_id
  );

  info!("Uploaded URI: {:?}", url);

  info!("Creating media post...");

  let request = GrokCreateMediaPost {
    user_id: &args.full_credentials.client_secrets.user_id,
    file_id: &upload_file_id,
    media_type: MediaPostType::UserUploadedImage,
    cookie: args.full_credentials.cookies.as_str(),
    request_timeout: args.individual_request_timeout,
  };

  let post_result = request.send().await?;

  info!("Posted Image.");

  info!("Video prompt: {:?}", args.prompt);
  info!("Video aspect ratio: {:?}", args.aspect_ratio);

  info!("Generate video...");

  let request = GrokVideoGenChatConversationBuilder {
    user_id: &args.full_credentials.client_secrets.user_id,
    file_id: &upload_file_id,
    media_type: VideoMediaPostType::UserUploadedImage,
    cookie: args.full_credentials.cookies.as_str(),
    prompt: args.prompt,
    mode: args.mode,
    aspect_ratio: args.aspect_ratio,
    request_timeout: args.individual_request_timeout,
    baggage: &args.full_credentials.client_secrets.baggage,
    sentry_trace: &args.full_credentials.client_secrets.sentry_trace,
    verification_token: &args.full_credentials.client_secrets.verification_token,
    svg_data: &args.full_credentials.client_secrets.svg_path_data,
    numbers: &args.full_credentials.client_secrets.numbers,
  };

  let maybe_video_file_id;
  let generation_is_complete;

  if args.wait_for_generation {
    info!("Waiting for video generation...");
    let video_gen_result = request.wait_for_video().await?;
    maybe_video_file_id = video_gen_result.video_file_id;
    generation_is_complete = true;
  } else {
    info!("Streaming response partially...");
    let video_gen_result = request.stream_only_video_id().await?;
    maybe_video_file_id = video_gen_result.video_file_id;
    generation_is_complete = false;
  }

  let maybe_video_url = maybe_video_file_id
      .as_ref()
      .map(|file_id| {
        user_and_file_id_to_video_url(&args.full_credentials.client_secrets.user_id, file_id, false)
      });

  info!("Video Generation Enqueued");

  info!("Liking media...");

  let request = GrokLikeMediaPost {
    file_id: &upload_file_id,
    cookie: args.full_credentials.cookies.as_str(),
    request_timeout: args.individual_request_timeout,
    baggage: &args.full_credentials.client_secrets.baggage,
    sentry_trace: &args.full_credentials.client_secrets.sentry_trace,
    verification_token: &args.full_credentials.client_secrets.verification_token,
    svg_data: &args.full_credentials.client_secrets.svg_path_data,
    numbers: &args.full_credentials.client_secrets.numbers,
  };

  let _like_result = request.send().await?;

  info!("Media Liked");

  Ok(ImageUploadAndGenerateVideoResult {
    post_id: post_result.post_id,
    image_file_id: upload_file_id,
    video_file_id: maybe_video_file_id,
    video_url: maybe_video_url,
    generation_is_complete,
  })
}


#[cfg(test)]
mod tests {
  use crate::credentials::grok_full_credentials::GrokFullCredentials;
  use crate::datatypes::api::aspect_ratio::AspectRatio;
  use crate::datatypes::file_upload_spec::FileUploadSpec;
  use crate::recipes::request_client_secrets::{request_client_secrets, RequestClientSecretsArgs};
  use crate::recipes::upload_image_and_generate_video::{upload_image_and_generate_video, UploadImageAndGenerateVideo};
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
    let maybe_prompt = Some("an anime girl runs away from a giant t-rex");

    let cookies = get_typed_test_cookies()?;

    let secrets = request_client_secrets(RequestClientSecretsArgs {
      cookies: &cookies,
    }).await?;

    println!("[test] Verification Token: {:?}", secrets.verification_token);
    println!("[test] Sentry Trace: {:?}", secrets.sentry_trace);
    println!("[test] Numbers: {:?}", secrets.numbers);
    println!("[test] Svg Path: {:?}", secrets.svg_path_data);
    println!("[test] Baggage: {:?}", secrets.baggage);

    let credentials = GrokFullCredentials::from_cookies_and_client_secrets(cookies, secrets);

    let video_result = upload_image_and_generate_video(UploadImageAndGenerateVideo {
      full_credentials: &credentials,
      file: FileUploadSpec::Path(image_path),
      prompt: maybe_prompt,
      aspect_ratio: Some(AspectRatio::Square),
      mode: None,
      individual_request_timeout: None,
      wait_for_generation: false,
    }).await?;

    println!("[test] Post ID: {:?}", video_result.post_id);
    println!("[test] Image File ID: {:?}", video_result.image_file_id);
    println!("[test] Video File ID: {:?}", video_result.video_file_id);
    println!("[test] Video URL: {:?}", video_result.video_url);

    assert_eq!(1, 2);

    Ok(())
  }
}
