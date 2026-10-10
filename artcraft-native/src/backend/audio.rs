//! Audio, one clip at a time (`audio-playback-controller`): reference cards play and stop on
//! click (the webapp's `DeckCard`), feed tracks pause, resume and seek (`WaveformAudioPlayer`).
//! Tracks also get waveforms, decoded off the UI thread. The output device opens on first use;
//! files download in the background.

use std::collections::HashMap;
use std::io::Cursor;
use std::sync::Arc;
use std::sync::mpsc::{Receiver, Sender, channel};
use std::time::Duration;

use log::warn;
use rodio::{Decoder, OutputStream, OutputStreamHandle, Sink, Source};
use tokio::sync::Semaphore;

/// The webapp's reference preview volume.
const PREVIEW_VOLUME: f32 = 0.2;
/// Peaks kept per waveform (resampled to however many bars are drawn).
const PEAK_COUNT: usize = 256;
/// Frames folded into one peak while decoding.
const WINDOW_FRAMES: usize = 1024;
/// Waveforms decoding at once (each downloads its whole file).
const MAX_CONCURRENT_WAVEFORMS: usize = 2;

pub struct AudioPlayer {
  rt: tokio::runtime::Handle,
  http: reqwest::Client,
  /// Opened on first play (and kept: closing it would stop the sound).
  output: Option<(OutputStream, OutputStreamHandle)>,
  sink: Option<Sink>,
  /// What's playing (or loading).
  current: Option<Clip>,
  tx: Sender<Loaded>,
  rx: Receiver<Loaded>,
  waveforms: HashMap<String, WaveformLookup>,
  limiter: Arc<Semaphore>,
  /// The tracks' volume slider, 0–1.
  track_volume: f32,
}

/// A track's shape: peaks (0–1, loudest = 1) and its length in seconds.
#[derive(Debug, PartialEq)]
pub struct Waveform {
  pub peaks: Vec<f32>,
  pub duration: f32,
}

/// What [`AudioPlayer::waveform`] knows about a track.
#[derive(Clone)]
pub enum WaveformLookup {
  Loading,
  Ready(Arc<Waveform>),
  Failed,
}

/// Where the current track is.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Playback {
  /// Still downloading.
  pub loading: bool,
  pub paused: bool,
  /// Seconds in.
  pub position: f32,
}

/// The clip that's playing, by the caller's key (a track's key is its URL).
struct Clip {
  key: String,
  track: bool,
  /// Where to start once it has downloaded (a seek before it loaded).
  start_at: f32,
}

enum Loaded {
  Clip { key: String, bytes: Result<Arc<[u8]>, String> },
  Waveform { url: String, waveform: Option<Waveform> },
}

impl AudioPlayer {
  pub fn new(rt: tokio::runtime::Handle, http: reqwest::Client) -> Self {
    let (tx, rx) = channel();
    Self { rt, http, output: None, sink: None, current: None, tx, rx, waveforms: HashMap::new(), limiter: Arc::new(Semaphore::new(MAX_CONCURRENT_WAVEFORMS)), track_volume: 1.0 }
  }

  /// Starts a reference clip under `key`, or stops it if it's what's playing.
  pub fn toggle(&mut self, ctx: &egui::Context, key: &str, url: &str) {
    if self.is_playing(key) {
      self.stop();
    } else {
      self.start(ctx, key, url, false, 0.0);
    }
  }

  /// Plays or pauses a feed track.
  pub fn toggle_track(&mut self, ctx: &egui::Context, url: &str) {
    match (&self.sink, self.is_playing(url)) {
      (Some(sink), true) if sink.is_paused() => sink.play(),
      (Some(sink), true) => sink.pause(),
      // Still downloading: a second click cancels.
      (None, true) => self.stop(),
      _ => self.start(ctx, url, url, true, 0.0),
    }
  }

  /// Jumps a feed track to `secs` (starting it there if it isn't the current one).
  pub fn seek_track(&mut self, ctx: &egui::Context, url: &str, secs: f32) {
    if !self.is_playing(url) {
      self.start(ctx, url, url, true, secs);
      return;
    }
    match &self.sink {
      Some(sink) => {
        if let Err(err) = sink.try_seek(Duration::from_secs_f32(secs.max(0.0))) {
          warn!("Audio seek failed: {err}");
        }
        sink.play();
      },
      None => {
        if let Some(clip) = &mut self.current {
          clip.start_at = secs;
        }
      },
    }
  }

  pub fn stop(&mut self) {
    if let Some(sink) = self.sink.take() {
      sink.stop();
    }
    self.current = None;
  }

  /// Whether `key` is playing, paused or about to play.
  pub fn is_playing(&self, key: &str) -> bool {
    self.current.as_ref().is_some_and(|c| c.key == key)
  }

  /// Where the track at `url` is, when it's the current one.
  pub fn track(&self, url: &str) -> Option<Playback> {
    let clip = self.current.as_ref().filter(|c| c.key == url)?;
    Some(match &self.sink {
      Some(sink) => Playback { loading: false, paused: sink.is_paused(), position: sink.get_pos().as_secs_f32() },
      None => Playback { loading: true, paused: false, position: clip.start_at },
    })
  }

  pub fn track_volume(&self) -> f32 {
    self.track_volume
  }

  pub fn set_track_volume(&mut self, volume: f32) {
    self.track_volume = volume.clamp(0.0, 1.0);
    if let (Some(sink), Some(clip)) = (&self.sink, &self.current) {
      if clip.track {
        sink.set_volume(self.track_volume);
      }
    }
  }

  /// The waveform of the track at `url`, downloading and decoding it the first time it's asked
  /// for.
  pub fn waveform(&mut self, ctx: &egui::Context, url: &str) -> WaveformLookup {
    if let Some(lookup) = self.waveforms.get(url) {
      return lookup.clone();
    }
    self.waveforms.insert(url.to_owned(), WaveformLookup::Loading);
    let (http, limiter, tx, ctx, url) = (self.http.clone(), self.limiter.clone(), self.tx.clone(), ctx.clone(), url.to_owned());
    self.rt.spawn(async move {
      let waveform = match limiter.acquire_owned().await {
        Ok(_permit) => match download(&http, &url).await {
          Ok(bytes) => tokio::task::spawn_blocking(move || decode_waveform(bytes)).await.ok().flatten(),
          Err(err) => {
            warn!("Waveform download failed for {url}: {err}");
            None
          },
        },
        Err(_) => None,
      };
      let _ = tx.send(Loaded::Waveform { url, waveform });
      ctx.request_repaint();
    });
    WaveformLookup::Loading
  }

  /// Starts downloads that finished and notices clips that ended. Call once per frame. Returns an
  /// error message when a clip couldn't play.
  pub fn poll(&mut self) -> Option<String> {
    let mut error = None;
    while let Ok(loaded) = self.rx.try_recv() {
      match loaded {
        Loaded::Waveform { url, waveform } => {
          self.waveforms.insert(url, waveform.map_or(WaveformLookup::Failed, |w| WaveformLookup::Ready(Arc::new(w))));
        },
        Loaded::Clip { key, bytes } => {
          // Superseded by another clip (or stopped) while downloading.
          let Some(clip) = self.current.as_ref().filter(|c| c.key == key) else {
            continue;
          };
          let (volume, start_at) = (if clip.track { self.track_volume } else { PREVIEW_VOLUME }, clip.start_at);
          if let Err(err) = bytes.and_then(|b| self.play_bytes(b, volume, start_at)) {
            warn!("Audio playback failed: {err}");
            self.current = None;
            error = Some(format!("Couldn't play the audio: {err}"));
          }
        },
      }
    }
    if self.sink.as_ref().is_some_and(Sink::empty) {
      self.sink = None;
      self.current = None;
    }
    error
  }

  fn start(&mut self, ctx: &egui::Context, key: &str, url: &str, track: bool, start_at: f32) {
    self.stop();
    self.current = Some(Clip { key: key.to_owned(), track, start_at });
    let (http, tx, ctx, key, url) = (self.http.clone(), self.tx.clone(), ctx.clone(), key.to_owned(), url.to_owned());
    self.rt.spawn(async move {
      let bytes = download(&http, &url).await;
      let _ = tx.send(Loaded::Clip { key, bytes });
      ctx.request_repaint();
    });
  }

  fn play_bytes(&mut self, bytes: Arc<[u8]>, volume: f32, start_at: f32) -> Result<(), String> {
    if self.output.is_none() {
      self.output = Some(OutputStream::try_default().map_err(|e| e.to_string())?);
    }
    let Some((_, handle)) = &self.output else {
      return Err("no audio output".to_owned());
    };
    let sink = Sink::try_new(handle).map_err(|e| e.to_string())?;
    let source = Decoder::new(Cursor::new(bytes)).map_err(|e| e.to_string())?;
    sink.set_volume(volume);
    sink.append(source);
    if start_at > 0.0 {
      if let Err(err) = sink.try_seek(Duration::from_secs_f32(start_at)) {
        warn!("Audio seek failed: {err}");
      }
    }
    self.sink = Some(sink);
    Ok(())
  }
}

async fn download(http: &reqwest::Client, url: &str) -> Result<Arc<[u8]>, String> {
  let response = http.get(url).send().await.and_then(|r| r.error_for_status()).map_err(|e| e.to_string())?;
  response.bytes().await.map(|b| Arc::from(b.as_ref())).map_err(|e| e.to_string())
}

/// Decodes a whole file into its waveform: the loudest sample of each window, folded down to
/// [`PEAK_COUNT`] peaks and scaled so the loudest is 1.
fn decode_waveform(bytes: Arc<[u8]>) -> Option<Waveform> {
  let decoder = match Decoder::new(Cursor::new(bytes)) {
    Ok(d) => d,
    Err(err) => {
      warn!("Waveform decode failed: {err}");
      return None;
    },
  };
  let (channels, rate) = (usize::from(decoder.channels().max(1)), decoder.sample_rate().max(1));
  let window = WINDOW_FRAMES * channels;
  let (mut windows, mut loudest, mut count) = (Vec::new(), 0_u16, 0_usize);
  for sample in decoder {
    loudest = loudest.max(sample.unsigned_abs());
    count += 1;
    if count % window == 0 {
      windows.push(f32::from(loudest));
      loudest = 0;
    }
  }
  if count % window != 0 {
    windows.push(f32::from(loudest));
  }
  if count == 0 {
    return None;
  }
  Some(Waveform { peaks: normalized(&resample(&windows, PEAK_COUNT)), duration: (count / channels) as f32 / rate as f32 })
}

/// `values` folded (by maximum) or stretched to exactly `count` entries.
pub fn resample(values: &[f32], count: usize) -> Vec<f32> {
  if values.is_empty() || count == 0 {
    return vec![0.0; count];
  }
  (0..count)
    .map(|i| {
      let start = i * values.len() / count;
      let end = ((i + 1) * values.len() / count).max(start + 1).min(values.len());
      values[start..end].iter().copied().fold(0.0, f32::max)
    })
    .collect()
}

fn normalized(values: &[f32]) -> Vec<f32> {
  let max = values.iter().copied().fold(0.0, f32::max);
  if max <= 0.0 {
    return values.to_vec();
  }
  values.iter().map(|v| v / max).collect()
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn resampling_keeps_the_loudest_of_each_span() {
    assert_eq!(resample(&[0.1, 0.9, 0.2, 0.4], 2), [0.9, 0.4]);
    assert_eq!(resample(&[0.5, 1.0], 4), [0.5, 0.5, 1.0, 1.0], "short inputs stretch");
    assert_eq!(resample(&[], 3), [0.0, 0.0, 0.0]);
    assert_eq!(normalized(&[0.0, 2.0, 1.0]), [0.0, 1.0, 0.5]);
  }

  #[test]
  fn decodes_a_wav_into_peaks_and_duration() {
    // One second of 8 kHz mono: silence, then a loud half.
    let rate = 8000_u32;
    let samples: Vec<i16> = (0..rate).map(|i| if i < rate / 2 { 0 } else { 16000 }).collect();
    let mut wav = Vec::new();
    wav.extend_from_slice(b"RIFF");
    wav.extend_from_slice(&(36 + samples.len() as u32 * 2).to_le_bytes());
    wav.extend_from_slice(b"WAVEfmt ");
    wav.extend_from_slice(&16_u32.to_le_bytes());
    wav.extend_from_slice(&1_u16.to_le_bytes());
    wav.extend_from_slice(&1_u16.to_le_bytes());
    wav.extend_from_slice(&rate.to_le_bytes());
    wav.extend_from_slice(&(rate * 2).to_le_bytes());
    wav.extend_from_slice(&2_u16.to_le_bytes());
    wav.extend_from_slice(&16_u16.to_le_bytes());
    wav.extend_from_slice(b"data");
    wav.extend_from_slice(&(samples.len() as u32 * 2).to_le_bytes());
    for s in &samples {
      wav.extend_from_slice(&s.to_le_bytes());
    }
    let waveform = decode_waveform(Arc::from(wav)).expect("decodes");
    assert!((waveform.duration - 1.0).abs() < 0.01, "duration {}", waveform.duration);
    assert_eq!(waveform.peaks.len(), PEAK_COUNT);
    assert_eq!(waveform.peaks[0], 0.0, "starts silent");
    assert_eq!(*waveform.peaks.last().unwrap(), 1.0, "ends loud");
  }
}
