use crate::client::websocket::midjourney_ws_event::MidjourneyWsEvent;
use crate::credentials::midjourney_user_id::MidjourneyUserId;
use crate::error::midjourney_client_error::MidjourneyClientError;
use log::{debug, warn};
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use tokio::sync::{broadcast, mpsc};
use wreq::ws::WebSocket;
use wreq::ws::message::Message;

/// How many events the broadcast channel buffers. A single job emits ~30
/// frames; this holds many concurrent jobs before a slow consumer lags.
const EVENT_CHANNEL_CAPACITY: usize = 2048;

/// A live, thread-safe handle to an open Midjourney websocket.
///
/// The connection is driven by a background task that owns the raw socket;
/// this handle only talks to it over channels, so it is cheap to `clone` and
/// share across threads. Cloned handles observe the same connection.
///
/// Reading images:
///
/// ```ignore
/// let ws = open_midjourney_websocket(/* ... */).await?;
/// // Submit the job over HTTP, then stream its previews:
/// ws.stream_job(&job_id, |event| {
///   if let MidjourneyWsEvent::Progress(progress) = event {
///     for image in &progress.images {
///       // image.bytes is a JPEG preview for image.image_index at image.step
///     }
///   }
/// }).await?;
/// ```
///
/// For finer control, call [`Self::events`] to get a raw receiver and
/// [`Self::subscribe_to_job`] / [`Self::send_json`] to drive the protocol
/// yourself.
///
/// Dropping the last handle ends the background task and closes the socket.
#[derive(Clone)]
pub struct MidjourneyWebSocket {
  inner: Arc<WebSocketInner>,
}

struct WebSocketInner {
  user_id: MidjourneyUserId,
  outbound: mpsc::UnboundedSender<Message>,
  events: broadcast::Sender<Arc<MidjourneyWsEvent>>,
  connected: Arc<AtomicBool>,
}

impl MidjourneyWebSocket {
  /// Take ownership of a freshly upgraded socket, spawn its driver task, and
  /// return a handle. The caller is responsible for the `subscribe_to_user`
  /// handshake (see `open_midjourney_websocket`).
  pub(crate) fn spawn(user_id: MidjourneyUserId, websocket: WebSocket) -> Self {
    let (outbound_tx, outbound_rx) = mpsc::unbounded_channel::<Message>();
    let (events_tx, _events_rx) = broadcast::channel::<Arc<MidjourneyWsEvent>>(EVENT_CHANNEL_CAPACITY);
    let connected = Arc::new(AtomicBool::new(true));

    tokio::spawn(run_websocket_loop(websocket, outbound_rx, events_tx.clone(), connected.clone()));

    Self { inner: Arc::new(WebSocketInner { user_id, outbound: outbound_tx, events: events_tx, connected }) }
  }

  /// The user this connection is bound to.
  pub fn user_id(&self) -> &MidjourneyUserId {
    &self.inner.user_id
  }

  /// Whether the background task is still running.
  pub fn is_connected(&self) -> bool {
    self.inner.connected.load(Ordering::SeqCst)
  }

  /// A new receiver over the decoded event stream. Each call yields an
  /// independent receiver that sees events sent *after* it was created, so
  /// subscribe before sending the request whose events you want.
  pub fn events(&self) -> broadcast::Receiver<Arc<MidjourneyWsEvent>> {
    self.inner.events.subscribe()
  }

  /// Bind this connection to the user (the opening handshake). Normally done
  /// for you by `open_midjourney_websocket`.
  pub fn subscribe_to_user(&self) -> Result<(), MidjourneyClientError> {
    self.send_json(&serde_json::json!({ "type": "subscribe_to_user" }))
  }

  /// Ask the server to stream progress for a job (after it was submitted over
  /// HTTP). Progress frames, including preview images, follow.
  pub fn subscribe_to_job(&self, job_id: &str) -> Result<(), MidjourneyClientError> {
    self.send_json(&serde_json::json!({ "type": "subscribe_to_job", "job_id": job_id }))
  }

  /// Send an arbitrary JSON command frame. The escape hatch for protocol
  /// messages this handle does not model directly (e.g. `room_new_job`).
  pub fn send_json(&self, value: &serde_json::Value) -> Result<(), MidjourneyClientError> {
    let text = serde_json::to_string(value)?;
    self.send_message(Message::text(text))
  }

  /// Subscribe to a job and invoke `on_event` for every event belonging to it,
  /// returning once the job completes (or erroring if the socket closes first).
  ///
  /// This is the ergonomic path for reading images: each `Progress` event
  /// carries the preview `images` for the current step, and the call returns
  /// when the `Completed` event arrives.
  pub async fn stream_job<F>(&self, job_id: &str, mut on_event: F) -> Result<(), MidjourneyClientError>
  where
    F: FnMut(&MidjourneyWsEvent),
  {
    let mut receiver = self.events();
    self.subscribe_to_job(job_id)?;

    loop {
      match receiver.recv().await {
        Ok(event) => {
          if event.job_id() != Some(job_id) {
            continue;
          }
          on_event(&event);
          if event.is_terminal() {
            return Ok(());
          }
        },
        Err(broadcast::error::RecvError::Lagged(skipped)) => {
          warn!("Midjourney websocket consumer lagged, skipped {} events", skipped);
        },
        Err(broadcast::error::RecvError::Closed) => {
          return Err(MidjourneyClientError::WebSocketClosed);
        },
      }
    }
  }

  /// Politely close the connection. The background task forwards the close
  /// frame and then stops. Dropping the last handle does the same implicitly.
  pub fn close(&self) {
    let _ = self.send_message(Message::Close(None));
  }

  fn send_message(&self, message: Message) -> Result<(), MidjourneyClientError> {
    self.inner.outbound.send(message).map_err(|_| MidjourneyClientError::WebSocketClosed)
  }
}

/// Owns the raw socket: forwards outbound command frames and decodes inbound
/// CBOR frames into events. Ends when the socket closes or all handles drop.
async fn run_websocket_loop(mut websocket: WebSocket, mut outbound_rx: mpsc::UnboundedReceiver<Message>, events_tx: broadcast::Sender<Arc<MidjourneyWsEvent>>, connected: Arc<AtomicBool>) {
  loop {
    tokio::select! {
      maybe_outbound = outbound_rx.recv() => {
        match maybe_outbound {
          Some(message) => {
            if let Err(err) = websocket.send(message).await {
              warn!("Midjourney websocket send failed: {}", err);
              break;
            }
          }
          // All handles dropped; nothing more will be sent.
          None => break,
        }
      }
      maybe_incoming = websocket.recv() => {
        match maybe_incoming {
          Some(Ok(Message::Binary(bytes))) => {
            match MidjourneyWsEvent::from_cbor_frame(&bytes) {
              // A send error just means there are no live receivers; that's fine.
              Ok(event) => { let _ = events_tx.send(Arc::new(event)); }
              Err(err) => warn!("Midjourney websocket frame decode failed: {}", err),
            }
          }
          Some(Ok(Message::Text(text))) => {
            debug!("Unexpected text frame from Midjourney websocket: {}", text.as_str());
          }
          // Ping/Pong are handled by wreq; ignore anything else non-terminal.
          Some(Ok(Message::Close(_))) | None => break,
          Some(Ok(_)) => {}
          Some(Err(err)) => {
            warn!("Midjourney websocket receive error: {}", err);
            break;
          }
        }
      }
    }
  }

  connected.store(false, Ordering::SeqCst);
  debug!("Midjourney websocket loop ended.");
}
