use crate::error::grok_error::GrokError;
use crate::requests::image_websocket::grok_websocket::GrokWebsocket;
use crate::requests::image_websocket::messages::websocket_client_message::{ClientMessageAspectRatio, WebsocketClientMessage};

pub struct PromptWebsocketImageArgs<'a> {
  pub websocket: &'a mut GrokWebsocket,
  pub prompt: &'a str,
  pub aspect_ratio: ClientMessageAspectRatio,
}


pub async fn prompt_websocket_image(args: PromptWebsocketImageArgs<'_>) -> Result<(), GrokError> {
  let message = WebsocketClientMessage::new_image_prompt(args.prompt, args.aspect_ratio);

  args.websocket.send_serializable(&message).await?;

  Ok(())
}

#[cfg(test)]
mod tests {
  use crate::requests::image_websocket::create_listen_websocket::{create_listen_websocket, CreateListenWebsocketArgs};
  use crate::requests::image_websocket::grok_websocket::GrokWebsocket;
  use crate::requests::image_websocket::grok_wrapped_websocket::GrokWrappedWebsocket;
  use crate::requests::image_websocket::messages::websocket_client_message::ClientMessageAspectRatio;
  use crate::requests::image_websocket::messages::websocket_server_message::WebsocketServerMessage;
  use crate::requests::image_websocket::prompt_websocket_image::{prompt_websocket_image, PromptWebsocketImageArgs};
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use errors::AnyhowResult;
  use log::warn;
  use std::io::Write;
  use std::time::Duration;
  use wreq::ws::message::Message;

  #[tokio::test]
  #[ignore] // manually test
  async fn prompt() -> AnyhowResult<()> {
    //setup_test_logging(LevelFilter::Trace);

    let cookies = get_test_cookies()?;

    let websocket = create_listen_websocket(CreateListenWebsocketArgs {
      cookies: &cookies,
    }).await?;

    //let websocket = GrokWrappedWebsocket::new(websocket);
    let mut websocket = GrokWebsocket::new(websocket);

    println!("Sending...");
    std::io::stdout().flush()?;

    let result = prompt_websocket_image(PromptWebsocketImageArgs {
      websocket: &mut websocket,
      prompt: "a dog riding a motorcycle",
      aspect_ratio: ClientMessageAspectRatio::WideThreeByTwo,
    }).await?;

    println!("Reading...");
    std::io::stdout().flush()?;

    let mut count = 0;

    println!("Polling.");

    //while let Some(message) = websocket.try_next().await? {
    //  println!("[{count}] Received websocket message: {:?}", message);
    //  count = count + 1;
    //  tokio::time::sleep(Duration::from_millis(1000)).await;
    //  if count > 1000 {
    //    break;
    //  }
    //}

    //loop {
    //  count = count + 1;
    //  let bounds = websocket.size_hint()?;
    //  println!("Websocket size hint: {:?}", bounds);
    //  tokio::time::sleep(Duration::from_millis(1000)).await;
    //  if count > 30 {
    //    break;
    //  }
    //}

    //loop {
    //  let maybe_message =
    //      websocket.try_next_timeout(Duration::from_millis(1000)).await?;
    //  match maybe_message {
    //    None => {
    //      println!("No message received within timeout.");
    //      count = count + 1;
    //    }
    //    Some(message) => {
    //      println!("[{count}] Received websocket message!");//: {:?}", message);
    //      count = 0;
    //    }
    //  }
    //  if count > 5 {
    //    println!("No messages after 5 seconds");
    //    break;
    //  }
    //}

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
            }
            WebsocketServerMessage::Json(json) => {
              println!("JSON : {:?}", json.percentage_complete);
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