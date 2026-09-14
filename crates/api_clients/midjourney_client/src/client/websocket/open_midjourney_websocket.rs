use crate::client::midjourney_hostname::MidjourneyHostname;
use crate::client::websocket::midjourney_websocket::MidjourneyWebSocket;
use crate::client::websocket::midjourney_ws_event::MidjourneyWsEvent;
use crate::credentials::midjourney_user_id::MidjourneyUserId;
use crate::error::midjourney_client_error::MidjourneyClientError;
use crate::error::midjourney_error::MidjourneyError;
use browser_emulation::browser_profile::BrowserProfile;
use std::time::Duration;
use tokio::sync::broadcast;
use tokio::time::timeout;

/// Midjourney's websocket gateway. The host is fixed regardless of which
/// `www`/custom hostname the HTTP API is reached through.
const WEBSOCKET_URL_BASE: &str = "wss://ws.midjourney.com/ws";

/// Protocol version pinned by the web client's `?v=` query parameter.
const WEBSOCKET_PROTOCOL_VERSION: &str = "5";

/// How long to wait for the `user_success` reply before giving up.
const HANDSHAKE_TIMEOUT: Duration = Duration::from_secs(15);

pub struct OpenMidjourneyWebSocketRequest<'a> {
  /// The short-lived websocket token from the index page's `initialProps`
  /// (see `get_user_info`, which reads `websocketToken`).
  pub websocket_token: &'a str,

  /// The Midjourney user id this connection is for.
  pub user_id: MidjourneyUserId,

  /// Used only for the `Origin` header; the socket host is always
  /// `ws.midjourney.com`. Defaults to the standard hostname if absent.
  pub hostname: Option<&'a MidjourneyHostname>,

  /// Defaults to [`BrowserProfile::default`] if absent. Should match the
  /// browser whose cookies obtained the `websocket_token`.
  pub browser: Option<BrowserProfile>,
}

/// Open a Midjourney websocket, complete the `subscribe_to_user` handshake,
/// and return a live [`MidjourneyWebSocket`] handle.
///
/// The returned handle is already bound to the user and ready for
/// [`MidjourneyWebSocket::subscribe_to_job`] / [`MidjourneyWebSocket::stream_job`].
/// No cookies are needed — the websocket authenticates via `websocket_token`.
pub async fn open_midjourney_websocket(req: OpenMidjourneyWebSocketRequest<'_>) -> Result<MidjourneyWebSocket, MidjourneyError> {
  let client = req.browser.clone().unwrap_or_default().build_client().map_err(MidjourneyClientError::WreqError)?;

  let default_hostname = MidjourneyHostname::Standard;
  let hostname = req.hostname.unwrap_or(&default_hostname);
  let origin = format!("https://{}", hostname.as_str());
  let url = format!("{}?token={}&v={}", WEBSOCKET_URL_BASE, req.websocket_token, WEBSOCKET_PROTOCOL_VERSION,);

  let response = client.websocket(url).header("Origin", origin).send().await.map_err(|_| MidjourneyClientError::WebSocketUpgrade("Websocket upgrade failed".to_string()))?;

  let websocket = response.into_websocket().await.map_err(|_| MidjourneyClientError::WebSocketUpgrade("Websocket upgrade failed".to_string()))?;

  let handle = MidjourneyWebSocket::spawn(req.user_id, websocket);

  // Subscribe to the event stream BEFORE sending, so we cannot miss the reply.
  let mut events = handle.events();
  handle.subscribe_to_user()?;

  match timeout(HANDSHAKE_TIMEOUT, await_user_success(&mut events)).await {
    Ok(Ok(())) => Ok(handle),
    Ok(Err(err)) => Err(err.into()),
    Err(_) => Err(MidjourneyClientError::WebSocketHandshakeTimeout.into()),
  }
}

async fn await_user_success(events: &mut broadcast::Receiver<std::sync::Arc<MidjourneyWsEvent>>) -> Result<(), MidjourneyClientError> {
  loop {
    match events.recv().await {
      Ok(event) => {
        if matches!(event.as_ref(), MidjourneyWsEvent::UserSuccess { .. }) {
          return Ok(());
        }
      },
      Err(broadcast::error::RecvError::Lagged(_)) => continue,
      Err(broadcast::error::RecvError::Closed) => {
        return Err(MidjourneyClientError::WebSocketClosed);
      },
    }
  }
}

#[cfg(test)]
mod tests {
  use crate::client::websocket::midjourney_ws_event::MidjourneyWsEvent;
  use crate::client::websocket::open_midjourney_websocket::{open_midjourney_websocket, OpenMidjourneyWebSocketRequest};
  use crate::endpoints::submit_job::{submit_job, SubmitJobArgs, SubmitJobRequest};
  use crate::recipes::channel_id::ChannelId;
  use crate::recipes::get_user_info::{get_user_info, GetUserInfoArgs};
  use errors::AnyhowResult;
  use filesys::read_to_trimmed_string::read_to_trimmed_string;

  // Live end-to-end test. Requires a valid cookie header on disk. Run with:
  //   cargo test -p midjourney_client -- --ignored --exact \
  //     client::websocket::open_midjourney_websocket::tests::live_stream_job
  #[ignore]
  #[tokio::test]
  async fn live_stream_job() -> AnyhowResult<()> {
    let cookie_header = read_to_trimmed_string("/Users/bt/secrets/midjourney/cookie.txt")?;

    // 1. Read user id + websocket token from the index page.
    let user_info = get_user_info(GetUserInfoArgs { cookie_header: &cookie_header, hostname: None, browser: None }).await?;

    let user_id = user_info.user_id.expect("user id");
    let websocket_token = user_info.websocket_token.expect("websocket token");

    // 2. Open the websocket (does the subscribe_to_user handshake).
    let ws = open_midjourney_websocket(OpenMidjourneyWebSocketRequest { websocket_token: &websocket_token, user_id: user_id.clone(), hostname: None, browser: None }).await?;

    // 3. Submit a job over HTTP.
    let channel_id = ChannelId::UserId(user_id.clone()).to_string();
    let submit = submit_job(SubmitJobArgs { request: SubmitJobRequest { prompt: "pirate ship in the city --v 8.2", channel_id: &channel_id }, cookie_header: &cookie_header, hostname: None, browser: None }).await?;
    let job_id = submit.maybe_job_id.expect("job id");

    // 4. Stream previews until completion.
    let mut preview_frames = 0;
    ws.stream_job(&job_id, |event| {
      if let MidjourneyWsEvent::Progress(progress) = event {
        if !progress.images.is_empty() {
          preview_frames += 1;
        }
      }
    })
    .await?;

    assert!(preview_frames > 0, "expected at least one preview frame");
    Ok(())
  }
}
