use crate::credentials::grok_cookies::GrokCookies;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::requests::image_websocket::create_listen_websocket::{create_listen_websocket, CreateListenWebsocketArgs};
use crate::requests::image_websocket::grok_websocket::GrokWebsocket;
use crate::requests::image_websocket::messages::websocket_client_message::{ClientMessageAspectRatio, WebsocketClientMessage};
use log::{error, info};

pub struct PromptWebsocketImageWithRetryArgs<'a> {
  pub websocket: &'a mut GrokWebsocket,
  pub prompt: &'a str,
  pub aspect_ratio: ClientMessageAspectRatio,
  pub cookies: &'a GrokCookies,
}

pub struct PromptWebsocketImageWithRetryResult {
  pub maybe_new_websocket: Option<GrokWebsocket>,
}


pub async fn prompt_websocket_image_with_retry(args: PromptWebsocketImageWithRetryArgs<'_>) -> Result<PromptWebsocketImageWithRetryResult, GrokError>
{
  let mut maybe_new_websocket : Option<GrokWebsocket> = None;

  for i in 0..3 {
    info!("Starting Grok Websocket image generation (attempt {}) ...", (i+1));

    let message = WebsocketClientMessage::new_image_prompt(args.prompt, args.aspect_ratio);

    let result =
        if let Some(websocket) = maybe_new_websocket.as_mut() {
          websocket.send_serializable(&message).await
        } else {
          args.websocket.send_serializable(&message).await
        };

    match result {
      Ok(()) => {
        break;
      }
      Err(GrokError::Client(GrokClientError::WreqClientError(err))) => {
        error!("Error sending message to websocket (WreqClientError): {}", err);
      }
      Err(GrokError::Client(err)) => {
        error!("Error sending message to websocket (GrokClientError): {}", err);
      }
      Err(GrokError::ApiSpecific(err)) => {
        error!("Error sending message to websocket (GrokSpecificApiError): {}", err);
      }
      Err(GrokError::ApiGeneric(err)) => {
        error!("Error sending message to websocket (GrokGenericApiError): {}", err);
      }
    }

    let result = create_listen_websocket(CreateListenWebsocketArgs {
      cookies: args.cookies.as_str(),
    }).await?;

    maybe_new_websocket = Some(GrokWebsocket::new(result));
  }

  Ok(PromptWebsocketImageWithRetryResult {
    maybe_new_websocket,
  })
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
