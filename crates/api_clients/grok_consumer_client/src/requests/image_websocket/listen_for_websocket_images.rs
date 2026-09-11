use crate::datatypes::api::request_id::RequestId;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::requests::image_websocket::grok_websocket::GrokWebsocket;
use crate::requests::image_websocket::grok_wrapped_websocket::GrokWrappedWebsocket;
use crate::requests::image_websocket::messages::message_image_data::MessageImageData;
use crate::utils::scrub_blobs_for_debug_logging::scrub_blobs_for_debug_logging;
use log::info;
use std::time::{Duration, Instant};
use wreq::ws::message::Message;

// Number of images we get per prompt by default
const DEFAULT_IMAGE_COUNT: usize = 6;

pub struct ListenForWebsocketImagesArgs<'a> {
  pub websocket: &'a mut GrokWebsocket,
  pub timeout: Duration,
}

#[derive(Clone, Debug)]
pub struct ImageResults {
  pub images: Vec<ImageData>,
}

#[derive(Clone, Debug)]
pub struct ImageData {
  /// The "task" that generated the image
  /// Multiple images have the same "task"
  pub request_id: RequestId,

  /// Url where we can download the image.
  pub url: String,

  /// The user-input prompt
  pub user_prompt: String,

  /// An X.ai-enriched prompt
  pub enriched_prompt: String,
}

pub async fn listen_for_websocket_images(args: ListenForWebsocketImagesArgs<'_>) -> Result<ImageResults, GrokError> {
  let start = Instant::now();
  let end_at = start.checked_add(args.timeout);
  let end_at = match end_at {
    Some(end_at) => end_at,
    None => return Err(GrokClientError::TimeoutMathBroken.into()),
  };

  let mut images = Vec::new();

  loop {
    if end_at < Instant::now() {
      break;
    }

    let maybe_message = args.websocket.try_next_timeout(Duration::from_millis(500)).await?;

    let maybe_message = match maybe_message {
      None => None,
      Some(Message::Text(text)) => Some(text.to_string()),
      Some(_) => {
        // Got a ping, pong, binary payload, etc.
        None
      },
    };

    let message = match maybe_message {
      Some(message) => message,
      None => continue,
    };

    let maybe_image_data = serde_json::from_str::<MessageImageData>(&message);

    let image_data = match maybe_image_data {
      Ok(image_data) => image_data,
      Err(_err) => {

        let message = scrub_blobs_for_debug_logging(&message);
        println!("Unknown message: {}", message);

        // NB: Might not have been a parse error, since we're parsing irrelevant message payloads too.
        // This is slightly dangerous to do this way as we might mask true parsing errors with image payloads.
        continue;
      }
    };

    match image_data.percentage_complete {
      None => continue,
      Some(percent) => {
        if percent < 100.0 {
          continue;
        }
      }
    }

    images.push(ImageData {
      request_id: RequestId(image_data.request_id),
      url : image_data.url,
      enriched_prompt: image_data.full_prompt,
      user_prompt: image_data.prompt,
    });

    if images.len() >= DEFAULT_IMAGE_COUNT {
      info!("{} images generated; we're done polling.", images.len());
      break;
    }
  }

  Ok(ImageResults {
    images,
  })
}


#[cfg(test)]
mod tests {
  use crate::requests::image_websocket::create_listen_websocket::{create_listen_websocket, CreateListenWebsocketArgs};
  use crate::requests::image_websocket::grok_websocket::GrokWebsocket;
  use crate::requests::image_websocket::listen_for_websocket_images::{listen_for_websocket_images, ListenForWebsocketImagesArgs};
  use crate::requests::image_websocket::messages::websocket_client_message::ClientMessageAspectRatio;
  use crate::requests::image_websocket::prompt_websocket_image::{prompt_websocket_image, PromptWebsocketImageArgs};
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use errors::AnyhowResult;
  use log::LevelFilter;
  use std::io::Write;
  use std::time::Duration;

  #[tokio::test]
  #[ignore] // manually test
  async fn prompt() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Info);

    let prompt = "A tornado hitting the stadium";

    let cookies = get_test_cookies()?;

    let websocket = create_listen_websocket(CreateListenWebsocketArgs {
      cookies: &cookies,
    }).await?;

    //let websocket = GrokWrappedWebsocket::new(websocket);
    let mut websocket = GrokWebsocket::new(websocket);

    println!("Sending...");
    std::io::stdout().flush()?;

    let _result = prompt_websocket_image(PromptWebsocketImageArgs {
      websocket: &mut websocket,
      prompt,
      aspect_ratio: ClientMessageAspectRatio::WideThreeByTwo,
    }).await?;

    println!("Reading...");
    std::io::stdout().flush()?;

    println!("Polling.");

    let images = listen_for_websocket_images(ListenForWebsocketImagesArgs {
      websocket: &mut websocket,
      timeout: Duration::from_millis(10_000),
    }).await?;

    println!("Done polling. Images: {}", images.images.len());

    for image in images.images {
      println!("Image: {:?}", image);
    }

    log::logger().flush();

    assert_eq!(1,2);

    Ok(())
  }
}
