//! Midjourney websocket client.
//!
//! Midjourney streams job progress (and in-progress preview images) over a
//! websocket at `wss://ws.midjourney.com/ws`. Client-to-server frames are JSON
//! text; server-to-client frames are CBOR binary.
//!
//! Usage: open the socket with [`open_midjourney_websocket`], submit a job over
//! HTTP (see the `submit_job` endpoint), then read previews with
//! [`MidjourneyWebSocket::stream_job`] or the raw [`MidjourneyWebSocket::events`]
//! receiver.

pub mod job_progress;
pub mod midjourney_websocket;
pub mod midjourney_ws_event;
pub mod open_midjourney_websocket;
