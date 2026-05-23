use crate::datatypes::api::request_id::RequestId;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::requests::image_websocket::grok_websocket::GrokWebsocket;
use crate::requests::image_websocket::messages::message_request_id::MessageRequestId;
use std::time::{Duration, Instant};
use wreq::ws::message::Message;

pub struct ListenForWebsocketRequestIdArgs<'a> {
  pub websocket: &'a mut GrokWebsocket,
  pub timeout: Duration,
}

#[derive(Clone, Debug)]
pub struct RequestIdResult {
  pub request_id: Option<RequestId>,
}

pub async fn listen_for_websocket_request_id(args: ListenForWebsocketRequestIdArgs<'_>) -> Result<RequestIdResult, GrokError> {
  let start = Instant::now();
  let end_at = start.checked_add(args.timeout);
  let end_at = match end_at {
    Some(end_at) => end_at,
    None => return Err(GrokClientError::TimeoutMathBroken.into()),
  };

  let mut request_id = None;

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

    let maybe_parsed = serde_json::from_str::<MessageRequestId>(&message);

    let parsed = match maybe_parsed {
      Ok(parsed) => parsed,
      Err(_err) => {
        // NB: Might not have been a parse error, since we're parsing irrelevant message payloads too.
        // This is slightly dangerous to do this way as we might mask true parsing errors with image payloads.
        continue;
      }
    };

    request_id = Some(RequestId(parsed.request_id));
    break;
  }

  Ok(RequestIdResult {
    request_id,
  })
}


#[cfg(test)]
mod tests {
  use crate::requests::image_websocket::create_listen_websocket::{create_listen_websocket, CreateListenWebsocketArgs};
  use crate::requests::image_websocket::grok_websocket::GrokWebsocket;
  use crate::requests::image_websocket::listen_for_websocket_request_id::{listen_for_websocket_request_id, ListenForWebsocketRequestIdArgs};
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

    let prompt = "A tiny tornado on a desk";

    let cookies = get_test_cookies()?;

    let mut websocket = create_listen_websocket(CreateListenWebsocketArgs {
      cookies: &cookies,
    }).await?;

    //let websocket = GrokWrappedWebsocket::new(websocket);
    let mut websocket = GrokWebsocket::new(websocket);

    println!("Sending...");
    std::io::stdout().flush()?;

    let _result = prompt_websocket_image(PromptWebsocketImageArgs {
      websocket: &mut websocket,
      prompt,
      aspect_ratio: ClientMessageAspectRatio::Square,
    }).await?;

    println!("Reading...");
    std::io::stdout().flush()?;

    println!("Polling.");

    let request_data = listen_for_websocket_request_id(ListenForWebsocketRequestIdArgs {
      websocket: &mut websocket,
      timeout: Duration::from_millis(10_000),
    }).await?;

    println!("Done polling. Request Data: {:?}", request_data);
    log::logger().flush();

    assert_eq!(1,2);

    Ok(())
  }
}
