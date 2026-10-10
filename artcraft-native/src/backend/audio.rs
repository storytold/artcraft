//! Playing one audio clip at a time (reference cards play and stop on click, like the webapp's
//! `DeckCard`). The output device opens on first use; files download in the background.

use std::io::Cursor;
use std::sync::mpsc::{Receiver, Sender, channel};

use log::warn;
use rodio::{Decoder, OutputStream, OutputStreamHandle, Sink};

/// The webapp's preview volume.
const PREVIEW_VOLUME: f32 = 0.2;

pub struct AudioPlayer {
  rt: tokio::runtime::Handle,
  http: reqwest::Client,
  /// Opened on first play (and kept: closing it would stop the sound).
  output: Option<(OutputStream, OutputStreamHandle)>,
  sink: Option<Sink>,
  /// What's playing (or loading), by the caller's key.
  current: Option<String>,
  tx: Sender<(String, Result<Vec<u8>, String>)>,
  rx: Receiver<(String, Result<Vec<u8>, String>)>,
}

impl AudioPlayer {
  pub fn new(rt: tokio::runtime::Handle, http: reqwest::Client) -> Self {
    let (tx, rx) = channel();
    Self { rt, http, output: None, sink: None, current: None, tx, rx }
  }

  /// Starts `url` under `key`, or stops it if it's what's playing.
  pub fn toggle(&mut self, ctx: &egui::Context, key: &str, url: &str) {
    if self.is_playing(key) {
      self.stop();
      return;
    }
    self.stop();
    self.current = Some(key.to_owned());
    let (http, tx, ctx, key, url) = (self.http.clone(), self.tx.clone(), ctx.clone(), key.to_owned(), url.to_owned());
    self.rt.spawn(async move {
      let bytes = async {
        let response = http.get(&url).send().await.and_then(|r| r.error_for_status()).map_err(|e| e.to_string())?;
        response.bytes().await.map(|b| b.to_vec()).map_err(|e| e.to_string())
      }
      .await;
      let _ = tx.send((key, bytes));
      ctx.request_repaint();
    });
  }

  pub fn stop(&mut self) {
    if let Some(sink) = self.sink.take() {
      sink.stop();
    }
    self.current = None;
  }

  /// Whether `key` is playing or about to.
  pub fn is_playing(&self, key: &str) -> bool {
    self.current.as_deref() == Some(key)
  }

  /// Starts downloads that finished; notices clips that ended. Call once per frame. Returns an
  /// error message when a clip couldn't play.
  pub fn poll(&mut self) -> Option<String> {
    let mut error = None;
    while let Ok((key, bytes)) = self.rx.try_recv() {
      // Superseded by another clip (or stopped) while downloading.
      if self.current.as_deref() != Some(key.as_str()) {
        continue;
      }
      match bytes.and_then(|b| self.play_bytes(b)) {
        Ok(()) => {},
        Err(err) => {
          warn!("Audio preview failed: {err}");
          self.current = None;
          error = Some(format!("Couldn't play the audio: {err}"));
        },
      }
    }
    if self.sink.as_ref().is_some_and(Sink::empty) {
      self.sink = None;
      self.current = None;
    }
    error
  }

  fn play_bytes(&mut self, bytes: Vec<u8>) -> Result<(), String> {
    if self.output.is_none() {
      self.output = Some(OutputStream::try_default().map_err(|e| e.to_string())?);
    }
    let Some((_, handle)) = &self.output else {
      return Err("no audio output".to_owned());
    };
    let sink = Sink::try_new(handle).map_err(|e| e.to_string())?;
    let source = Decoder::new(Cursor::new(bytes)).map_err(|e| e.to_string())?;
    sink.set_volume(PREVIEW_VOLUME);
    sink.append(source);
    self.sink = Some(sink);
    Ok(())
  }
}
