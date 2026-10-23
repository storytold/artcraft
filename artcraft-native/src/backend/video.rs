//! In-app video playback through FFmpeg (when it's installed): `ffprobe` reads the clip's size,
//! rate and length, one `ffmpeg` streams RGBA frames into a texture and another streams PCM into
//! rodio. Pausing and seeking restart both at the new position. Without FFmpeg the lightbox opens
//! videos in the system player instead.

use std::collections::VecDeque;
use std::io::Read;
use std::process::{Child, Command, Stdio};
use std::sync::mpsc::{Receiver, Sender, SyncSender, TryRecvError, channel, sync_channel};
use std::sync::OnceLock;
use std::time::{Duration, Instant};

use egui::{Align2, Color32, ColorImage, FontId, Rect, Sense, TextureHandle, TextureOptions, Ui, pos2, vec2};
use log::warn;
use rodio::{OutputStream, OutputStreamHandle, Sink, Source};

use crate::theme;
use crate::ui::icons::{self, Icon};

/// Frames are scaled down to at most this width (the lightbox never shows them larger).
const MAX_WIDTH: u32 = 1280;
const AUDIO_RATE: u32 = 44_100;
/// Decoded frames buffered ahead of the clock (back-pressure on `ffmpeg`).
const FRAME_QUEUE: usize = 4;
/// Four 8 KiB PCM chunks (about 186 ms), plus the currently playing chunk.
const AUDIO_QUEUE: usize = 4;
const PROBE_TIMEOUT: Duration = Duration::from_secs(30);
const CONTROLS_HEIGHT: f32 = 40.0;

/// Whether `ffmpeg` and `ffprobe` are on the PATH (checked once).
pub fn ffmpeg_available() -> bool {
  static AVAILABLE: OnceLock<bool> = OnceLock::new();
  *AVAILABLE.get_or_init(|| ["ffmpeg", "ffprobe"].iter().all(|tool| command(tool).arg("-version").stdout(Stdio::null()).stderr(Stdio::null()).status().is_ok_and(|s| s.success())))
}

#[derive(Clone, Copy, Debug)]
struct VideoInfo {
  width: u32,
  height: u32,
  fps: f64,
  duration: f64,
}

pub struct VideoPlayer {
  url: String,
  probe: Option<PendingProbe>,
  info: Option<VideoInfo>,
  stream: Option<Stream>,
  texture: Option<TextureHandle>,
  /// Media time of the frame on screen.
  position: f64,
  muted: bool,
  error: Option<String>,
  output: Option<(OutputStream, OutputStreamHandle)>,
}

/// One run of the decoders from a start position.
struct Stream {
  start: f64,
  started: Instant,
  frames: Receiver<(ColorImage, f64)>,
  next: Option<(ColorImage, f64)>,
  ended: bool,
  received_frames: bool,
  children: Vec<Child>,
  sink: Option<Sink>,
}

struct PendingProbe {
  result: Receiver<Result<VideoInfo, String>>,
  cancel: Sender<()>,
}

impl PendingProbe {
  fn new(url: &str) -> Self {
    let (tx, result) = channel();
    let (cancel, cancel_rx) = channel();
    let url = url.to_owned();
    std::thread::spawn(move || { let _ = tx.send(probe(&url, &cancel_rx)); });
    Self { result, cancel }
  }
}

impl Drop for PendingProbe {
  fn drop(&mut self) { let _ = self.cancel.send(()); }
}

struct ProbeChild(Child);

impl Drop for ProbeChild {
  fn drop(&mut self) {
    let _ = self.0.kill();
    let _ = self.0.wait();
  }
}

impl Drop for Stream {
  fn drop(&mut self) {
    if let Some(sink) = self.sink.take() { sink.stop(); }
    for child in &mut self.children {
      let _ = child.kill();
      let _ = child.wait();
    }
  }
}

impl VideoPlayer {
  /// Starts probing `url`; playback begins as soon as its size is known.
  pub fn new(url: &str) -> Self {
    Self { url: url.to_owned(), probe: Some(PendingProbe::new(url)), info: None, stream: None, texture: None, position: 0.0, muted: false, error: None, output: None }
  }

  pub fn url(&self) -> &str {
    &self.url
  }

  /// Draws the video fitted inside `rect` with its controls; `poster` (the still frame) shows
  /// until the first decoded frame arrives.
  pub fn ui(&mut self, ui: &mut Ui, rect: Rect, poster: Option<&TextureHandle>) {
    self.poll_probe();
    let ctx = ui.ctx().clone();
    self.advance(&ctx);
    ui.painter().rect_filled(rect, 0.0, Color32::BLACK);
    let video_area = Rect::from_min_max(rect.min, pos2(rect.right(), rect.bottom() - CONTROLS_HEIGHT));
    match (&self.texture, &self.error) {
      (_, Some(err)) => {
        ui.painter().text(video_area.center(), Align2::CENTER_CENTER, format!("Couldn't play this video: {err}"), FontId::new(13.0, egui::FontFamily::Proportional), theme::BAD);
      },
      (Some(texture), None) => {
        let fit = crate::overlays::lightbox::fit_inside(texture.size_vec2(), video_area.shrink(4.0).size());
        egui::Image::new(texture).paint_at(ui, Rect::from_center_size(video_area.center(), fit));
      },
      (None, None) => {
        if let Some(poster) = poster {
          let fit = crate::overlays::lightbox::fit_inside(poster.size_vec2(), video_area.shrink(4.0).size());
          egui::Image::new(poster).tint(Color32::from_gray(150)).paint_at(ui, Rect::from_center_size(video_area.center(), fit));
        }
        icons::paint_spinner(ui, Rect::from_center_size(video_area.center(), vec2(32.0, 32.0)), Color32::WHITE);
      },
    }
    // Clicking the picture toggles play/pause.
    let click = ui.interact(video_area, ui.id().with(("video-surface", &self.url)), Sense::click());
    if click.clicked() {
      self.toggle_pause();
    }
    self.controls(ui, Rect::from_min_max(pos2(rect.left(), rect.bottom() - CONTROLS_HEIGHT), rect.max));
    if self.stream.is_some() || self.probe.is_some() {
      ctx.request_repaint_after(Duration::from_millis(10));
    }
  }

  fn controls(&mut self, ui: &mut Ui, bar: Rect) {
    let p = ui.painter().clone();
    p.rect_filled(bar, 0.0, theme::fade(theme::PANEL, 0.95));
    let playing = self.stream.is_some();
    let button = Rect::from_center_size(pos2(bar.left() + 22.0, bar.center().y), vec2(28.0, 28.0));
    let resp = ui.interact(button, ui.id().with(("video-play", &self.url)), Sense::click()).on_hover_text(if playing { "Pause" } else { "Play" }).on_hover_cursor(egui::CursorIcon::PointingHand);
    if playing {
      for dx in [-3.5, 3.5] {
        p.rect_filled(Rect::from_center_size(button.center() + vec2(dx, 0.0), vec2(3.0, 12.0)), 0.0, theme::INK);
      }
    } else {
      icons::paint(&p, button.shrink(7.0), Icon::Play, theme::INK);
    }
    if resp.clicked() {
      self.toggle_pause();
    }
    let duration = self.info.map_or(0.0, |i| i.duration);
    let time = format!("{} / {}", clock(self.position), clock(duration));
    let label = p.text(pos2(button.right() + 8.0, bar.center().y), Align2::LEFT_CENTER, time, FontId::new(11.5, egui::FontFamily::Monospace), theme::MUTED);
    let mute = Rect::from_center_size(pos2(bar.right() - 22.0, bar.center().y), vec2(28.0, 28.0));
    let mute_resp = ui.interact(mute, ui.id().with(("video-mute", &self.url)), Sense::click()).on_hover_text(if self.muted { "Unmute" } else { "Mute" }).on_hover_cursor(egui::CursorIcon::PointingHand);
    icons::paint(&p, mute.shrink(7.0), if self.muted { Icon::VolumeOff } else { Icon::Volume }, theme::INK);
    if mute_resp.clicked() {
      self.muted = !self.muted;
      if let Some(sink) = self.stream.as_ref().and_then(|s| s.sink.as_ref()) {
        sink.set_volume(if self.muted { 0.0 } else { 1.0 });
      }
    }
    // The scrubber: click or drag to seek.
    let track = Rect::from_min_max(pos2(label.right() + 14.0, bar.center().y - 8.0), pos2(mute.left() - 12.0, bar.center().y + 8.0));
    let scrub = ui.interact(track, ui.id().with(("video-scrub", &self.url)), Sense::click_and_drag()).on_hover_cursor(egui::CursorIcon::PointingHand);
    let line = Rect::from_center_size(track.center(), vec2(track.width(), 4.0));
    p.rect_filled(line, egui::CornerRadius::same(2), theme::WASH_HOVER);
    let fraction = if duration > 0.0 { (self.position / duration).clamp(0.0, 1.0) as f32 } else { 0.0 };
    p.rect_filled(Rect::from_min_size(line.min, vec2(line.width() * fraction, line.height())), egui::CornerRadius::same(2), theme::ACCENT_400);
    if (scrub.clicked() || scrub.drag_stopped()) && duration > 0.0 {
      if let Some(pos) = scrub.interact_pointer_pos() {
        let t = (((pos.x - line.left()) / line.width()).clamp(0.0, 1.0) as f64) * duration;
        self.seek(t);
      }
    }
  }

  fn poll_probe(&mut self) {
    let Some(rx) = &self.probe else {
      return;
    };
    match rx.result.try_recv() {
      Ok(Ok(info)) => {
        self.info = Some(info);
        self.probe = None;
        self.play_from(0.0);
      },
      Ok(Err(err)) => {
        self.error = Some(err);
        self.probe = None;
      },
      Err(TryRecvError::Disconnected) => {
        self.error = Some("Video probe stopped unexpectedly".into());
        self.probe = None;
      },
      Err(TryRecvError::Empty) => {},
    }
  }

  /// Shows the newest frame that's due; loops at the end.
  fn advance(&mut self, ctx: &egui::Context) {
    let Some(stream) = &mut self.stream else {
      return;
    };
    let now = stream.start + stream.started.elapsed().as_secs_f64();
    let mut shown = None;
    loop {
      if stream.next.is_none() {
        match stream.frames.try_recv() {
          Ok(frame) => { stream.received_frames = true; stream.next = Some(frame); },
          Err(TryRecvError::Disconnected) => {
            stream.ended = true;
            break;
          },
          Err(TryRecvError::Empty) => break,
        }
      }
      match &stream.next {
        Some((_, pts)) if *pts <= now => shown = stream.next.take(),
        _ => break,
      }
    }
    if let Some((image, pts)) = shown {
      self.position = pts;
      match &mut self.texture {
        Some(t) => t.set(image, TextureOptions::LINEAR),
        None => self.texture = Some(ctx.load_texture(format!("video:{}", self.url), image, TextureOptions::LINEAR)),
      }
    }
    if stream.ended && stream.next.is_none() {
      // A closed pipe also means decode failure. Only loop a clean decoder
      // exit that produced frames; otherwise a bad URL respawns every UI frame.
      match stream.children[0].try_wait() {
        Ok(None) => {},
        Ok(Some(status)) if status.success() && stream.received_frames => self.play_from(0.0),
        Ok(Some(status)) => {
          self.error = Some(format!("Video decoder stopped without completing playback ({status})"));
          self.stream = None;
        },
        Err(err) => {
          self.error = Some(format!("Video decoder: {err}"));
          self.stream = None;
        },
      }
    }
  }

  fn toggle_pause(&mut self) {
    if self.stream.take().is_none() && self.info.is_some() {
      self.play_from(self.position);
    }
  }

  fn seek(&mut self, t: f64) {
    self.position = t;
    self.play_from(t);
  }

  fn play_from(&mut self, start: f64) {
    self.stream = None;
    let Some(info) = self.info else {
      return;
    };
    self.error = None;
    match self.spawn(info, start) {
      Ok(stream) => self.stream = Some(stream),
      Err(err) => self.error = Some(err),
    }
  }

  fn spawn(&mut self, info: VideoInfo, start: f64) -> Result<Stream, String> {
    let (w, h) = output_size(info);
    let mut video = command("ffmpeg").args(["-nostdin", "-loglevel", "error", "-ss", &format!("{start:.3}"), "-i", &self.url, "-an", "-vf", &format!("scale={w}:{h}"), "-f", "rawvideo", "-pix_fmt", "rgba", "-"]).stdout(Stdio::piped()).stderr(Stdio::null()).spawn().map_err(|e| format!("ffmpeg: {e}"))?;
    let stdout = video.stdout.take().ok_or("ffmpeg has no output")?;
    let (frame_tx, frame_rx) = sync_channel(FRAME_QUEUE);
    let fps = info.fps.max(1.0);
    std::thread::spawn(move || read_frames(stdout, w, h, start, fps, frame_tx));
    let mut children = vec![video];
    let sink = self.spawn_audio(start, &mut children);
    Ok(Stream { start, started: Instant::now(), frames: frame_rx, next: None, ended: false, received_frames: false, children, sink })
  }

  /// The soundtrack as PCM into rodio (silently skipped when the clip has none).
  fn spawn_audio(&mut self, start: f64, children: &mut Vec<Child>) -> Option<Sink> {
    if self.output.is_none() {
      self.output = OutputStream::try_default().map_err(|e| warn!("No audio output: {e}")).ok();
    }
    let (_, handle) = self.output.as_ref()?;
    let sink = Sink::try_new(handle).ok()?;
    let mut audio = command("ffmpeg").args(["-nostdin", "-loglevel", "error", "-ss", &format!("{start:.3}"), "-i", &self.url, "-vn", "-ac", "2", "-ar", &AUDIO_RATE.to_string(), "-f", "s16le", "-"]).stdout(Stdio::piped()).stderr(Stdio::null()).spawn().ok()?;
    let mut stdout = audio.stdout.take()?;
    children.push(audio);
    let (tx, rx) = pcm_channel();
    std::thread::spawn(move || {
      let mut buf = vec![0u8; 8192];
      while let Ok(n) = stdout.read(&mut buf) {
        if n == 0 || tx.send(buf[..n - n % 2].chunks_exact(2).map(|b| i16::from_le_bytes([b[0], b[1]])).collect()).is_err() {
          break;
        }
      }
    });
    sink.set_volume(if self.muted { 0.0 } else { 1.0 });
    sink.append(PcmStream { rx, buf: VecDeque::new() });
    Some(sink)
  }
}

/// Reads fixed-size RGBA frames from `ffmpeg` and stamps them with their media time.
fn read_frames(mut stdout: impl Read, w: u32, h: u32, start: f64, fps: f64, tx: SyncSender<(ColorImage, f64)>) {
  let mut buf = vec![0u8; (w * h * 4) as usize];
  let mut n = 0u64;
  while stdout.read_exact(&mut buf).is_ok() {
    let image = ColorImage::from_rgba_unmultiplied([w as usize, h as usize], &buf);
    if tx.send((image, start + n as f64 / fps)).is_err() {
      break;
    }
    n += 1;
  }
}

fn pcm_channel() -> (SyncSender<Vec<i16>>, Receiver<Vec<i16>>) {
  sync_channel(AUDIO_QUEUE)
}

/// Live PCM from a channel; silence while it waits, the end when the sender's gone.
struct PcmStream {
  rx: Receiver<Vec<i16>>,
  buf: VecDeque<i16>,
}

impl Iterator for PcmStream {
  type Item = i16;

  fn next(&mut self) -> Option<i16> {
    if self.buf.is_empty() {
      match self.rx.try_recv() {
        Ok(chunk) => self.buf.extend(chunk),
        Err(TryRecvError::Empty) => return Some(0),
        Err(TryRecvError::Disconnected) => return None,
      }
    }
    self.buf.pop_front().or(Some(0))
  }
}

impl Source for PcmStream {
  fn current_frame_len(&self) -> Option<usize> {
    None
  }

  fn channels(&self) -> u16 {
    2
  }

  fn sample_rate(&self) -> u32 {
    AUDIO_RATE
  }

  fn total_duration(&self) -> Option<Duration> {
    None
  }
}

/// Reads the clip's size, rate and length. A small probe keeps this ~2 s on CDN files instead of
/// ~14 s (ffprobe otherwise scans much of the file over HTTP).
fn probe(url: &str, cancel: &Receiver<()>) -> Result<VideoInfo, String> {
  #[derive(serde::Deserialize, Default)]
  #[serde(default)]
  struct Probe {
    streams: Vec<ProbeStream>,
    format: ProbeFormat,
  }
  #[derive(serde::Deserialize, Default)]
  #[serde(default)]
  struct ProbeStream {
    width: u32,
    height: u32,
    avg_frame_rate: String,
  }
  #[derive(serde::Deserialize, Default)]
  #[serde(default)]
  struct ProbeFormat {
    duration: String,
  }
  let child = command("ffprobe").args(["-v", "error", "-probesize", "65536", "-analyzeduration", "0", "-select_streams", "v:0", "-show_entries", "stream=width,height,avg_frame_rate:format=duration", "-of", "json", url]).stdout(Stdio::piped()).stderr(Stdio::null()).spawn().map_err(|e| format!("ffprobe: {e}"))?;
  let output = probe_output(child, cancel, PROBE_TIMEOUT)?;
  let probe: Probe = serde_json::from_slice(&output).map_err(|e| format!("ffprobe: {e}"))?;
  let stream = probe.streams.first().ok_or("no video stream")?;
  let fps = match stream.avg_frame_rate.split_once('/') {
    Some((n, d)) => n.parse::<f64>().unwrap_or(24.0) / d.parse::<f64>().unwrap_or(1.0).max(1.0),
    None => stream.avg_frame_rate.parse().unwrap_or(24.0),
  };
  Ok(VideoInfo { width: stream.width.max(2), height: stream.height.max(2), fps: if fps.is_finite() && fps > 0.0 { fps } else { 24.0 }, duration: probe.format.duration.parse().unwrap_or(0.0) })
}

/// The selected stream's small JSON output fits in the pipe. Waiting with a
/// cancellation channel lets closing the lightbox kill and reap a stuck probe.
fn probe_output(child: Child, cancel: &Receiver<()>, timeout: Duration) -> Result<Vec<u8>, String> {
  let mut child = ProbeChild(child);
  let started = Instant::now();
  loop {
    match cancel.try_recv() {
      Ok(()) | Err(TryRecvError::Disconnected) => return Err("Video probe cancelled".into()),
      Err(TryRecvError::Empty) => {},
    }
    if started.elapsed() >= timeout { return Err("Video probe timed out".into()); }
    match child.0.try_wait().map_err(|e| format!("ffprobe: {e}"))? {
      Some(status) if status.success() => {
        let mut output = Vec::new();
        child.0.stdout.take().ok_or("ffprobe has no output")?.read_to_end(&mut output).map_err(|e| format!("ffprobe: {e}"))?;
        return Ok(output);
      },
      Some(status) => return Err(format!("ffprobe failed ({status})")),
      None => {},
    }
    // A drop/cancel wakes this wait immediately; the next iteration reaps.
    match cancel.recv_timeout(Duration::from_millis(20)) {
      Ok(()) | Err(std::sync::mpsc::RecvTimeoutError::Disconnected) => return Err("Video probe cancelled".into()),
      Err(std::sync::mpsc::RecvTimeoutError::Timeout) => {},
    }
  }
}

/// The decoded size: at most `MAX_WIDTH` wide, both sides even (as `scale` requires).
fn output_size(info: VideoInfo) -> (u32, u32) {
  let w = info.width.min(MAX_WIDTH) & !1;
  let h = ((info.height as f64 * w as f64 / info.width as f64).round() as u32).max(2) & !1;
  (w, h)
}

/// `m:ss`.
fn clock(secs: f64) -> String {
  let s = secs.max(0.0) as u64;
  format!("{}:{:02}", s / 60, s % 60)
}

/// A command that doesn't flash a console window on Windows.
fn command(program: &str) -> Command {
  #[allow(unused_mut)]
  let mut cmd = Command::new(program);
  #[cfg(windows)]
  {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x0800_0000;
    cmd.creation_flags(CREATE_NO_WINDOW);
  }
  cmd
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn output_sizes_are_even_and_capped() {
    let info = |width, height| VideoInfo { width, height, fps: 24.0, duration: 5.0 };
    assert_eq!(output_size(info(1920, 1080)), (1280, 720));
    assert_eq!(output_size(info(721, 1281)), (720, 1278));
    assert_eq!(clock(65.9), "1:05");
  }

  /// Needs FFmpeg on the PATH: `cargo test -p artcraft_native -- --ignored`.
  #[test]
  #[ignore]
  fn probes_and_decodes_a_generated_clip() {
    let dir = std::env::temp_dir().join("artcraft-native-video-test");
    std::fs::create_dir_all(&dir).unwrap();
    let clip = dir.join("clip.mp4");
    let status = command("ffmpeg").args(["-y", "-loglevel", "error", "-f", "lavfi", "-i", "testsrc=duration=2:size=640x360:rate=24", "-f", "lavfi", "-i", "sine=duration=2", "-shortest", "-pix_fmt", "yuv420p"]).arg(&clip).status().unwrap();
    assert!(status.success());
    let url = clip.to_string_lossy().into_owned();
    let (_cancel_tx, cancel_rx) = channel();
    let info = probe(&url, &cancel_rx).unwrap();
    assert_eq!((info.width, info.height), (640, 360));
    assert!((info.fps - 24.0).abs() < 0.01 && (info.duration - 2.0).abs() < 0.2);

    let mut player = VideoPlayer { url: url.clone(), probe: None, info: Some(info), stream: None, texture: None, position: 0.0, muted: true, error: None, output: None };
    let stream = player.spawn(info, 1.0).unwrap();
    let (frame, pts) = stream.frames.recv_timeout(Duration::from_secs(10)).unwrap();
    assert_eq!(frame.size, [640, 360]);
    assert!((pts - 1.0).abs() < 1e-9, "frames are stamped from the start position");
    let count = 1 + stream.frames.iter().count();
    assert!((20..=28).contains(&count), "about a second of frames at 24 fps, got {count}");
  }
}

#[cfg(test)]
mod lifecycle_tests {
  use super::*;

  #[test]
  fn pcm_queue_applies_backpressure_and_disconnects_when_playback_stops() {
    let (tx, rx) = pcm_channel();
    for _ in 0..AUDIO_QUEUE { tx.try_send(vec![7; 4096]).unwrap(); }
    assert!(matches!(tx.try_send(vec![8]), Err(std::sync::mpsc::TrySendError::Full(_))));
    let mut source = PcmStream { rx, buf: VecDeque::new() };
    assert_eq!(source.next(), Some(7));
    tx.try_send(vec![8]).unwrap();
    drop(source);
    assert!(matches!(tx.send(vec![9]), Err(_)));
  }

  #[cfg(unix)]
  #[test]
  fn cancelled_and_timed_out_probes_are_reaped() {
    for cancelled in [true, false] {
      let child = command("sleep").arg("60").stdout(Stdio::piped()).spawn().unwrap();
      let pid = child.id();
      let (tx, rx) = channel();
      if cancelled { tx.send(()).unwrap(); }
      let started = Instant::now();
      let result = probe_output(child, &rx, Duration::from_millis(30));
      assert!(result.unwrap_err().contains(if cancelled { "cancelled" } else { "timed out" }));
      assert!(started.elapsed() < Duration::from_secs(2));
      assert!(!command("kill").args(["-0", &pid.to_string()]).stderr(Stdio::null()).status().unwrap().success());
    }
  }

  #[cfg(unix)]
  #[test]
  fn failed_or_empty_decoder_does_not_restart() {
    for code in [0, 1] {
      let mut child = command("sh").args(["-c", &format!("exit {code}")]).spawn().unwrap();
      child.wait().unwrap();
      let (tx, frames) = sync_channel(FRAME_QUEUE);
      drop(tx);
      let stream = Stream { start: 0.0, started: Instant::now(), frames, next: None, ended: false, received_frames: false, children: vec![child], sink: None };
      let mut player = VideoPlayer { url: "invalid".into(), probe: None, info: Some(VideoInfo { width: 2, height: 2, fps: 24.0, duration: 1.0 }), stream: Some(stream), texture: None, position: 0.0, muted: true, error: None, output: None };
      player.advance(&egui::Context::default());
      assert!(player.stream.is_none());
      assert!(player.error.is_some());
    }
  }
}
