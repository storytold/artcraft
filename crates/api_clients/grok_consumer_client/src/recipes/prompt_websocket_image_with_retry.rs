use crate::credentials::grok_cookies::GrokCookies;
use crate::error::grok_error::GrokError;
use crate::requests::image_websocket::create_listen_websocket::{create_listen_websocket, CreateListenWebsocketArgs};
use crate::requests::image_websocket::grok_websocket::GrokWebsocket;
use crate::requests::image_websocket::messages::websocket_client_message::{ClientMessageAspectRatio, WebsocketClientMessage};
use log::{error, info};
use std::fmt::Display;

pub struct PromptWebsocketImageWithRetryArgs<'a> {
  pub websocket: &'a mut GrokWebsocket,
  pub prompt: &'a str,
  pub aspect_ratio: ClientMessageAspectRatio,
  pub cookies: &'a GrokCookies,
}

pub struct PromptWebsocketImageWithRetryResult {
  pub maybe_new_websocket: Option<GrokWebsocket>,
}


/// How many times the prompt is sent before giving up.
const MAX_ATTEMPTS: usize = 3;

pub async fn prompt_websocket_image_with_retry(args: PromptWebsocketImageWithRetryArgs<'_>) -> Result<PromptWebsocketImageWithRetryResult, GrokError>
{
  let message = WebsocketClientMessage::new_image_prompt(args.prompt, args.aspect_ratio);
  let cookies = args.cookies;

  let maybe_new_websocket = send_with_reconnect(
    args.websocket,
    MAX_ATTEMPTS,
    async |websocket: &mut GrokWebsocket| websocket.send_serializable(&message).await,
    async || {
      let websocket = create_listen_websocket(CreateListenWebsocketArgs {
        cookies: cookies.as_str(),
      }).await?;
      Ok(GrokWebsocket::new(websocket))
    },
  ).await?;

  Ok(PromptWebsocketImageWithRetryResult {
    maybe_new_websocket,
  })
}

/// Sends with `send` on `first`, and after each failure reconnects with `reconnect` and sends on the
/// new connection, up to `attempts` sends. Returns the replacement connection when one was needed.
/// The last failure is returned as an error: a prompt that was never sent must not look sent.
async fn send_with_reconnect<W, E: Display>(
  first: &mut W,
  attempts: usize,
  mut send: impl AsyncFnMut(&mut W) -> Result<(), E>,
  mut reconnect: impl AsyncFnMut() -> Result<W, E>,
) -> Result<Option<W>, E> {
  let mut maybe_new : Option<W> = None;

  for i in 0..attempts {
    info!("Starting Grok Websocket image generation (attempt {}) ...", (i+1));

    let result = match maybe_new.as_mut() {
      Some(websocket) => send(websocket).await,
      None => send(first).await,
    };

    match result {
      Ok(()) => return Ok(maybe_new),
      Err(err) => {
        error!("Error sending message to websocket: {}", err);
        // Out of attempts: report the failure instead of reconnecting for a send that never comes.
        if i + 1 == attempts {
          return Err(err);
        }
      }
    }

    maybe_new = Some(reconnect().await?);
  }

  // Only reachable with zero attempts.
  Ok(maybe_new)
}

#[cfg(test)]
mod tests {
  use crate::recipes::prompt_websocket_image_with_retry::{prompt_websocket_image_with_retry, PromptWebsocketImageWithRetryArgs};
  use crate::requests::image_websocket::create_listen_websocket::{create_listen_websocket, CreateListenWebsocketArgs};
  use crate::requests::image_websocket::grok_websocket::GrokWebsocket;
  use crate::requests::image_websocket::grok_wrapped_websocket::GrokWrappedWebsocket;
  use crate::requests::image_websocket::messages::websocket_client_message::ClientMessageAspectRatio;
  use crate::requests::image_websocket::messages::websocket_server_message::WebsocketServerMessage;
  use crate::requests::image_websocket::prompt_websocket_image::{prompt_websocket_image, PromptWebsocketImageArgs};
  use crate::test_utils::get_test_cookies::{get_test_cookies, get_typed_test_cookies};
  use errors::AnyhowResult;
  use futures::SinkExt;
  use log::warn;
  use std::io::Write;
  use std::time::Duration;
  use wreq::ws::message::{CloseCode, Message, Utf8Bytes};
  use super::send_with_reconnect;

  #[tokio::test]
  async fn a_prompt_that_fails_every_attempt_is_an_error_not_a_success() {
    let mut first = 0_u32;
    let mut sends = 0;
    let mut reconnects = 0;

    let result = send_with_reconnect(
      &mut first,
      3,
      async |_: &mut u32| { sends += 1; Err::<(), String>("closed".to_string()) },
      async || { reconnects += 1; Ok::<u32, String>(1) },
    ).await;

    assert_eq!(result, Err("closed".to_string()));
    assert_eq!(sends, 3);
    // No reconnect after the final failed send.
    assert_eq!(reconnects, 2);
  }

  #[tokio::test]
  async fn a_send_that_works_after_a_reconnect_returns_the_new_connection() {
    let mut first = 0_u32;
    let mut sends = 0;

    let result = send_with_reconnect(
      &mut first,
      3,
      async |websocket: &mut u32| {
        sends += 1;
        if *websocket == 0 { Err("closed".to_string()) } else { Ok(()) }
      },
      async || Ok::<u32, String>(7),
    ).await;

    assert_eq!(result, Ok(Some(7)));
    assert_eq!(sends, 2);
  }

  #[tokio::test]
  async fn a_first_send_that_works_keeps_the_connection() {
    let mut first = 0_u32;

    let result = send_with_reconnect(
      &mut first,
      3,
      async |_: &mut u32| Ok::<(), String>(()),
      async || Ok::<u32, String>(7),
    ).await;

    assert_eq!(result, Ok(None));
  }

  #[tokio::test]
  #[ignore] // manually test
  async fn prompt() -> AnyhowResult<()> {
    //setup_test_logging(LevelFilter::Trace);

    let cookies = get_typed_test_cookies()?;

    let websocket = create_listen_websocket(CreateListenWebsocketArgs {
      cookies: cookies.as_str(),
    }).await?;

    let prompt = "A dinosaur on stilts walking on the beach";

    //let websocket = GrokWrappedWebsocket::new(websocket);
    let mut websocket = GrokWebsocket::new(websocket);

    //println!("Sending...");
    //std::io::stdout().flush()?;

    //println!("For our test, we'll close the websocket and retry...");
    //websocket.websocket
    //    .close(CloseCode::NORMAL, Utf8Bytes::try_from(Vec::new())?).await?;

    //let mut websocket = GrokWebsocket::new(websocket.websocket);

    let result = prompt_websocket_image_with_retry(PromptWebsocketImageWithRetryArgs {
      websocket: &mut websocket,
      prompt,
      aspect_ratio: ClientMessageAspectRatio::WideThreeByTwo,
      cookies: &cookies,
    }).await?;

    println!("Reading...");
    std::io::stdout().flush()?;

    let mut count = 0;

    println!("Polling.");

    loop {
      //let maybe_message =
      //    websocket.get_response_with_timeout(Duration::from_millis(1000)).await?;

      let maybe_message =
          websocket.try_next_timeout(Duration::from_millis(1000)).await?;

      let mut maybe_raw_text : Option<String> = None;

      let maybe_message = match maybe_message {
        None => None,
        Some(Message::Text(text)) => {
          let maybe_message = WebsocketServerMessage::from_json_str(text.as_str())?;
          let mut text = text.as_str().to_string();
          text.truncate(100);
          //println!("Received message: {}", text);
          maybe_raw_text = Some(text);
          Some(maybe_message)
        },
        Some(_) => {
          warn!("Received non-text websocket message.");
          None
        },
      };

      match maybe_message {
        None => {
          println!("No message received within timeout.");
          count = count + 1;
        }
        Some(message) => {
          match message {
            WebsocketServerMessage::Image(image) => {
              println!("IMAGE: {:?}", image.percentage_complete);
              if let Some(percent) = image.percentage_complete {
                if percent > 90.0 {
                  println!("Image: {:?}", image);
                }
              }
            }
            WebsocketServerMessage::Json(json) => {
              println!("JSON : {:?}", json.percentage_complete);
              if let Some(percent) = json.percentage_complete {
                if percent > 90.0 {
                  println!("Image: {:?}", json);
                }
              }
            }
            WebsocketServerMessage::Unknown(unknown) => {
              //let typ = unknown.get("type");
              let unknown_string = unknown.as_str();
              println!("[UNKNOWN] websocket message: {:?}", maybe_raw_text);
            }
          }
          count = 0;
        }
      }

      // TODO: Make sure we capture all the events for images
      // TODO: Explore the other APIs
      // TODO understand the IDs
      // TODO: Video websocket APIs
      // TODO: Upload APIs

      if count > 5 {
        println!("No messages after 5 seconds");
        break;
      }
    }

    println!("Done polling.");

    log::logger().flush();

    assert_eq!(1,2);

    Ok(())
  }
}
