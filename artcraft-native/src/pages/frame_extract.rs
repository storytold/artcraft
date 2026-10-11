//! Frame Extract: pull stills from a local video. Works offline; FFmpeg on the PATH does the
//! decoding (the same tools in-app playback already uses).

use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::mpsc::{Receiver, TryRecvError, channel};
use std::thread;

use egui::{Align2, Color32, ColorImage, FontId, Rect, Sense, TextureHandle, TextureOptions, Ui, pos2, vec2};
use log::warn;

use crate::backend::video::{self, VideoPlayer};
use crate::theme;
use crate::ui::icons::{self, Icon};
use crate::ui::widgets;

pub const MIN_COUNT: u32 = 1;
pub const MAX_COUNT: u32 = 50;
pub const DEFAULT_COUNT: u32 = 10;
pub const MIN_DISTANCE_MS: u32 = 1;
pub const MAX_DISTANCE_MS: u32 = 10_000;
pub const DEFAULT_DISTANCE_MS: u32 = 100;

const VIDEO_EXTS: &[&str] = &["mp4", "mov", "webm", "mkv", "m4v", "avi"];

/// Size, rate and length of a local clip, from `ffprobe`.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct ClipInfo {
  pub width: u32,
  pub height: u32,
  pub fps: f64,
  pub duration: f64,
}

/// One still written to disk (and shown in the grid once its texture is ready).
struct ExtractedFrame {
  timestamp: f64,
  path: PathBuf,
  texture: Option<TextureHandle>,
}

enum ExtractEvent {
  Frame { timestamp: f64, path: PathBuf },
  Failed(String),
  Done,
}

struct OpenClip {
  path: PathBuf,
  info: Option<ClipInfo>,
  probe: Option<Receiver<Result<ClipInfo, String>>>,
  player: Option<VideoPlayer>,
  probe_error: Option<String>,
}

/// The Studio › Frame Extract page.
pub struct FrameExtractPage {
  count: u32,
  distance_ms: u32,
  start: f64,
  clip: Option<OpenClip>,
  frames: Vec<ExtractedFrame>,
  extracting: bool,
  extract_rx: Option<Receiver<ExtractEvent>>,
  notice: Option<String>,
}

impl Default for FrameExtractPage {
  fn default() -> Self {
    Self { count: DEFAULT_COUNT, distance_ms: DEFAULT_DISTANCE_MS, start: 0.0, clip: None, frames: Vec::new(), extracting: false, extract_rx: None, notice: None }
  }
}

impl FrameExtractPage {
  pub fn new() -> Self {
    let mut page = Self::default();
    if let Some(path) = std::env::var_os("ARTCRAFT_OPEN_VIDEO").map(PathBuf::from) {
      if path.is_file() {
        page.open(path);
      }
    }
    page
  }

  pub fn ui(&mut self, ui: &mut Ui) {
    self.poll();
    self.load_textures(ui.ctx());
    if self.extracting || self.clip.as_ref().is_some_and(|c| c.probe.is_some()) {
      ui.ctx().request_repaint();
    }
    if let Some(path) = dropped_video(ui) {
      self.open(path);
    }
    let area = ui.max_rect();
    match self.clip.as_ref() {
      None => self.empty(ui, area),
      Some(_) => {
        let mut child = ui.new_child(egui::UiBuilder::new().max_rect(area));
        egui::ScrollArea::vertical().id_salt("frame-extract-scroll").auto_shrink([false, false]).show(&mut child, |ui| {
          ui.set_width(ui.available_width());
          self.loaded(ui);
        });
      },
    }
  }

  fn empty(&mut self, ui: &mut Ui, area: Rect) {
    let width = (area.width() - 64.0).min(768.0);
    let section = Rect::from_center_size(area.center(), vec2(width, 260.0));
    ui.painter().rect(section, 0.0, Color32::from_rgba_unmultiplied(242, 241, 238, 4), egui::Stroke::new(1.0, Color32::from_rgba_unmultiplied(242, 241, 238, 51)), egui::StrokeKind::Inside);
    widgets::corner_marks(ui.painter(), section);
    let mut child = ui.new_child(egui::UiBuilder::new().max_rect(section.shrink2(vec2(40.0, 36.0))));
    child.label(widgets::heading("Frame Extract", 44.0));
    child.add_space(10.0);
    child.label(egui::RichText::new("Open a video on this computer and pull stills at a start time, count and spacing you choose. Nothing is uploaded.").size(15.0).color(theme::MUTED));
    child.add_space(18.0);
    if widgets::button(&mut child, Some(Icon::Upload), "Select Video", widgets::Kind::Primary, 0.0, 40.0).clicked() {
      self.pick();
    }
    if !video::ffmpeg_available() {
      child.add_space(12.0);
      child.label(egui::RichText::new("FFmpeg is not on the PATH, so this page cannot read videos yet. Install ffmpeg and ffprobe, then reopen the app.").size(13.0).color(theme::BAD));
    }
  }

  fn loaded(&mut self, ui: &mut Ui) {
    let width = (ui.available_width() - 48.0).min(960.0);
    ui.add_space(16.0);
    ui.horizontal(|ui| {
      ui.add_space(((ui.available_width() - width).max(0.0)) / 2.0);
      ui.vertical(|ui| {
        ui.set_width(width);
        self.preview(ui, width);
        if self.clip.is_none() {
          return;
        }
        ui.add_space(16.0);
        self.settings(ui, width);
        ui.add_space(16.0);
        ui.vertical_centered(|ui| {
          let ready = self.clip.as_ref().is_some_and(|c| c.info.is_some()) && video::ffmpeg_available() && !self.extracting;
          let label = if self.extracting { "Extracting\u{2026}" } else { "Extract Frames" };
          ui.add_enabled_ui(ready, |ui| {
            if widgets::button(ui, Some(Icon::Sparkles), label, widgets::Kind::Primary, 0.0, 44.0).clicked() {
              self.start_extract();
            }
          });
        });
        if let Some(notice) = &self.notice {
          ui.add_space(10.0);
          ui.label(egui::RichText::new(notice).size(13.0).color(theme::BAD));
        }
        if !self.frames.is_empty() {
          ui.add_space(20.0);
          self.grid(ui, width);
        }
        ui.add_space(32.0);
      });
    });
  }

  fn preview(&mut self, ui: &mut Ui, width: f32) {
    let height = (width * 9.0 / 16.0).clamp(200.0, 480.0);
    let (rect, _) = ui.allocate_exact_size(vec2(width, height), Sense::hover());
    ui.painter().rect_filled(rect, 0.0, Color32::BLACK);
    if let Some(clip) = self.clip.as_mut() {
      if let Some(player) = clip.player.as_mut() {
        player.ui(ui, rect, None);
      } else if let Some(err) = &clip.probe_error {
        ui.painter().text(rect.center(), Align2::CENTER_CENTER, err, FontId::new(13.0, egui::FontFamily::Proportional), theme::BAD);
      } else if clip.info.is_none() {
        icons::paint_spinner(ui, Rect::from_center_size(rect.center(), vec2(32.0, 32.0)), Color32::WHITE);
      }
    }
    let switch = Rect::from_min_size(pos2(rect.right() - 132.0, rect.top() + 12.0), vec2(120.0, 32.0));
    let mut overlay = ui.new_child(egui::UiBuilder::new().max_rect(switch));
    if widgets::button(&mut overlay, Some(Icon::RotateCw), "Switch Video", widgets::Kind::Danger, 120.0, 32.0).clicked() {
      self.clear_clip();
    }
  }

  fn settings(&mut self, ui: &mut Ui, width: f32) {
    let gap = 16.0;
    let col_w = (width - gap) / 2.0;
    ui.horizontal(|ui| {
      ui.spacing_mut().item_spacing.x = gap;
      panel(ui, col_w, |ui| {
        widgets::hud(ui, "Start Time", theme::FAINT);
        ui.add_space(6.0);
        ui.label(egui::RichText::new(format_time_precise(self.start)).size(28.0).family(theme::mono()).color(theme::ACCENT_INK));
        ui.add_space(10.0);
        let duration = self.clip.as_ref().and_then(|c| c.info).map(|i| i.duration).unwrap_or(0.0);
        if duration > 0.0 {
          ui.add(egui::Slider::new(&mut self.start, 0.0..=duration).show_value(false).trailing_fill(true));
          ui.add_space(6.0);
          ui.label(egui::RichText::new("Drag to choose where the first still is taken.").size(12.5).color(theme::MUTED));
        }
        ui.add_space(16.0);
        widgets::hud(ui, "Video Information", theme::FAINT);
        ui.add_space(8.0);
        if let Some(clip) = self.clip.as_ref() {
          kv(ui, "File", &file_stem(&clip.path));
          match clip.info {
            Some(info) => {
              kv(ui, "Duration", &format_time_precise(info.duration));
              kv(ui, "Resolution", &format!("{} \u{00d7} {}", info.width, info.height));
            },
            None => kv(ui, "Status", clip.probe_error.as_deref().unwrap_or("Reading\u{2026}")),
          }
        }
      });
      panel(ui, col_w, |ui| {
        widgets::hud(ui, "Extraction Settings", theme::FAINT);
        ui.add_space(12.0);
        number_field(ui, "Number of Frames", &mut self.count, MIN_COUNT..=MAX_COUNT);
        ui.add_space(12.0);
        number_field(ui, "Distance (ms)", &mut self.distance_ms, MIN_DISTANCE_MS..=MAX_DISTANCE_MS);
        ui.add_space(10.0);
        let duration = self.clip.as_ref().and_then(|c| c.info).map(|i| i.duration).unwrap_or(0.0);
        let planned = timestamps(self.start, self.count, self.distance_ms, duration);
        ui.label(egui::RichText::new(format!("{} stills from {} to {}", planned.len(), format_time_precise(planned.first().copied().unwrap_or(self.start)), format_time_precise(planned.last().copied().unwrap_or(self.start)))).size(12.5).color(theme::MUTED));
      });
    });
  }

  fn grid(&mut self, ui: &mut Ui, width: f32) {
    ui.horizontal(|ui| {
      ui.label(egui::RichText::new("Extracted Frames").size(16.0).family(theme::medium()).color(theme::INK));
      ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
        ui.label(egui::RichText::new(format!("{} {}", self.frames.len(), if self.frames.len() == 1 { "Frame" } else { "Frames" })).size(12.0).family(theme::mono()).color(theme::MUTED));
        if widgets::button(ui, Some(Icon::Download), "Save All", widgets::Kind::Secondary, 0.0, 32.0).clicked() {
          self.save_all();
        }
      });
    });
    ui.add_space(10.0);
    let cols = 2;
    let gap = 12.0;
    let cell_w = (width - gap * (cols as f32 - 1.0)) / cols as f32;
    let mut i = 0;
    while i < self.frames.len() {
      ui.horizontal(|ui| {
        ui.spacing_mut().item_spacing.x = gap;
        for _ in 0..cols {
          if i >= self.frames.len() {
            break;
          }
          self.frame_card(ui, i, cell_w);
          i += 1;
        }
      });
      ui.add_space(gap);
    }
  }

  fn frame_card(&mut self, ui: &mut Ui, index: usize, width: f32) {
    let height = width * 9.0 / 16.0 + 72.0;
    let (rect, _) = ui.allocate_exact_size(vec2(width, height), Sense::hover());
    ui.painter().rect(rect, 0.0, theme::WASH, theme::hairline(), egui::StrokeKind::Inside);
    let image = Rect::from_min_size(rect.min, vec2(width, width * 9.0 / 16.0));
    ui.painter().rect_filled(image, 0.0, Color32::BLACK);
    if let Some(tex) = self.frames.get(index).and_then(|f| f.texture.as_ref()) {
      let fit = crate::overlays::lightbox::fit_inside(tex.size_vec2(), image.shrink(4.0).size());
      egui::Image::new(tex).paint_at(ui, Rect::from_center_size(image.center(), fit));
    }
    let meta = Rect::from_min_max(pos2(rect.left() + 12.0, image.bottom() + 8.0), pos2(rect.right() - 12.0, rect.bottom() - 10.0));
    let mut inner = ui.new_child(egui::UiBuilder::new().max_rect(meta));
    inner.horizontal(|ui| {
      ui.label(egui::RichText::new(format!("#{}", index + 1)).size(11.0).family(theme::mono()).color(theme::MUTED));
      ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
        if let Some(frame) = self.frames.get(index) {
          ui.label(egui::RichText::new(format_time_precise(frame.timestamp)).size(12.0).family(theme::mono()).color(theme::INK));
        }
      });
    });
    inner.add_space(6.0);
    let save_w = inner.available_width();
    if widgets::button(&mut inner, Some(Icon::Download), "Save", widgets::Kind::Secondary, save_w, 28.0).clicked() {
      self.save_one(index);
    }
  }

  fn pick(&mut self) {
    let dialog = rfd::FileDialog::new().add_filter("Videos", VIDEO_EXTS);
    if let Some(path) = dialog.pick_file() {
      self.open(path);
    }
  }

  fn open(&mut self, path: PathBuf) {
    self.clear_clip();
    let (tx, rx) = channel();
    let probe_path = path.clone();
    thread::spawn(move || {
      let _ = tx.send(probe(&probe_path));
    });
    let player = video::ffmpeg_available().then(|| VideoPlayer::new(&path.to_string_lossy()));
    self.clip = Some(OpenClip { path, info: None, probe: Some(rx), player, probe_error: None });
  }

  fn clear_clip(&mut self) {
    self.clip = None;
    self.frames.clear();
    self.extracting = false;
    self.extract_rx = None;
    self.notice = None;
    self.start = 0.0;
  }

  fn poll(&mut self) {
    let mut info_ready = None;
    if let Some(clip) = self.clip.as_mut() {
      if let Some(rx) = clip.probe.as_mut() {
        match rx.try_recv() {
          Ok(Ok(info)) => {
            clip.info = Some(info);
            clip.probe = None;
            info_ready = Some(info);
          },
          Ok(Err(err)) => {
            clip.probe_error = Some(err);
            clip.probe = None;
          },
          Err(TryRecvError::Empty) => {},
          Err(TryRecvError::Disconnected) => clip.probe = None,
        }
      }
    }
    if let Some(info) = info_ready {
      self.start = self.start.clamp(0.0, info.duration);
      if std::env::var_os("ARTCRAFT_EXTRACT").is_some() && !self.extracting && self.frames.is_empty() {
        self.start_extract();
      }
    }
    let mut incoming = Vec::new();
    if let Some(rx) = self.extract_rx.as_mut() {
      loop {
        match rx.try_recv() {
          Ok(event) => incoming.push(event),
          Err(TryRecvError::Empty) => break,
          Err(TryRecvError::Disconnected) => {
            self.extracting = false;
            self.extract_rx = None;
            break;
          },
        }
      }
    }
    for event in incoming {
      match event {
        ExtractEvent::Frame { timestamp, path } => self.frames.push(ExtractedFrame { timestamp, path, texture: None }),
        ExtractEvent::Failed(message) => {
          self.notice = Some(message);
          self.extracting = false;
          self.extract_rx = None;
        },
        ExtractEvent::Done => {
          self.extracting = false;
          self.extract_rx = None;
        },
      }
    }
  }

  fn start_extract(&mut self) {
    let Some(clip) = self.clip.as_ref() else {
      return;
    };
    let Some(info) = clip.info else {
      return;
    };
    if self.extracting {
      return;
    }
    let times = timestamps(self.start, self.count, self.distance_ms, info.duration);
    if times.is_empty() {
      self.notice = Some("Nothing to extract at this start time.".into());
      return;
    }
    let dest = std::env::temp_dir().join("artcraft-native-frames").join(uuid::Uuid::new_v4().to_string());
    if let Err(err) = std::fs::create_dir_all(&dest) {
      self.notice = Some(format!("Couldn't create a temp folder: {err}"));
      return;
    }
    self.frames.clear();
    self.notice = None;
    self.extracting = true;
    let (tx, rx) = channel();
    self.extract_rx = Some(rx);
    let input = clip.path.clone();
    thread::spawn(move || {
      for (i, t) in times.iter().enumerate() {
        let out = dest.join(frame_file_name(i as u32, *t));
        match extract_frame(&input, *t, &out) {
          Ok(()) => {
            if tx.send(ExtractEvent::Frame { timestamp: *t, path: out }).is_err() {
              return;
            }
          },
          Err(err) => {
            let _ = tx.send(ExtractEvent::Failed(err));
            return;
          },
        }
      }
      let _ = tx.send(ExtractEvent::Done);
    });
  }

  fn save_one(&self, index: usize) {
    let Some(frame) = self.frames.get(index) else {
      return;
    };
    let name = frame.path.file_name().and_then(|n| n.to_str()).unwrap_or("frame.png");
    if let Some(dest) = rfd::FileDialog::new().set_file_name(name).save_file() {
      if let Err(err) = std::fs::copy(&frame.path, &dest) {
        warn!("Couldn't save frame: {err}");
      }
    }
  }

  fn save_all(&self) {
    let Some(dir) = rfd::FileDialog::new().pick_folder() else {
      return;
    };
    for frame in &self.frames {
      if let Some(name) = frame.path.file_name() {
        if let Err(err) = std::fs::copy(&frame.path, dir.join(name)) {
          warn!("Couldn't save {}: {err}", name.to_string_lossy());
        }
      }
    }
  }

  /// Loads PNG textures for stills that have arrived from the worker.
  pub fn load_textures(&mut self, ctx: &egui::Context) {
    for (i, frame) in self.frames.iter_mut().enumerate() {
      if frame.texture.is_none() {
        frame.texture = load_png(ctx, format!("extract-frame-{i}"), &frame.path);
      }
    }
  }
}

/// Timestamps for `count` stills, `distance_ms` apart, starting at `start`, clipped to `duration`.
pub fn timestamps(start: f64, count: u32, distance_ms: u32, duration: f64) -> Vec<f64> {
  if duration < 0.0 {
    return Vec::new();
  }
  let start = start.clamp(0.0, duration);
  let count = count.clamp(MIN_COUNT, MAX_COUNT);
  let step = f64::from(distance_ms.clamp(MIN_DISTANCE_MS, MAX_DISTANCE_MS)) / 1000.0;
  let mut out = Vec::new();
  for i in 0..count {
    let t = start + f64::from(i) * step;
    if t > duration {
      if out.is_empty() {
        out.push(duration);
      }
      break;
    }
    out.push(t);
    if (duration - t).abs() < 1e-9 {
      break;
    }
  }
  out
}

/// `mm:ss.mmm`, matching the web Frame Extract labels.
pub fn format_time_precise(secs: f64) -> String {
  let ms_total = (secs.max(0.0) * 1000.0).round() as u64;
  let mins = ms_total / 60_000;
  let secs = (ms_total % 60_000) / 1000;
  let ms = ms_total % 1000;
  format!("{mins:02}:{secs:02}.{ms:03}")
}

/// `frame-01-00-00-000.png`.
pub fn frame_file_name(index: u32, timestamp: f64) -> String {
  let stamp = format_time_precise(timestamp).replace([':', '.'], "-");
  format!("frame-{:02}-{stamp}.png", index + 1)
}

/// Writes one PNG at `timestamp` seconds into `output`.
pub fn extract_frame(input: &Path, timestamp: f64, output: &Path) -> Result<(), String> {
  let status = ffmpeg_cmd("ffmpeg").args(["-hide_banner", "-nostdin", "-loglevel", "error", "-y", "-ss", &format!("{timestamp:.3}"), "-i"]).arg(input).args(["-frames:v", "1", "-update", "1"]).arg(output).status().map_err(|e| format!("ffmpeg: {e}"))?;
  if !status.success() {
    return Err(format!("ffmpeg exited with {status}"));
  }
  if !output.is_file() {
    return Err("ffmpeg did not write a still".into());
  }
  Ok(())
}

fn probe(path: &Path) -> Result<ClipInfo, String> {
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
  let out = ffmpeg_cmd("ffprobe").args(["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,avg_frame_rate:format=duration", "-of", "json"]).arg(path).output().map_err(|e| format!("ffprobe: {e}"))?;
  if !out.status.success() {
    return Err(format!("ffprobe: {}", String::from_utf8_lossy(&out.stderr)));
  }
  let probe: Probe = serde_json::from_slice(&out.stdout).map_err(|e| format!("ffprobe: {e}"))?;
  let stream = probe.streams.first().ok_or_else(|| "no video stream".to_owned())?;
  let fps = match stream.avg_frame_rate.split_once('/') {
    Some((n, d)) => n.parse::<f64>().unwrap_or(24.0) / d.parse::<f64>().unwrap_or(1.0).max(1.0),
    None => stream.avg_frame_rate.parse().unwrap_or(24.0),
  };
  Ok(ClipInfo { width: stream.width.max(2), height: stream.height.max(2), fps: if fps.is_finite() && fps > 0.0 { fps } else { 24.0 }, duration: probe.format.duration.parse().unwrap_or(0.0) })
}

fn ffmpeg_cmd(program: &str) -> Command {
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

fn dropped_video(ui: &Ui) -> Option<PathBuf> {
  ui.input(|i| i.raw.dropped_files.iter().map(|f| f.path().to_path_buf()).find(|p| !p.as_os_str().is_empty() && is_video_path(p)))
}

fn is_video_path(path: &Path) -> bool {
  path.extension().and_then(|e| e.to_str()).is_some_and(|ext| VIDEO_EXTS.iter().any(|ok| ext.eq_ignore_ascii_case(ok)))
}

fn file_stem(path: &Path) -> String {
  path.file_name().and_then(|n| n.to_str()).unwrap_or("video").to_owned()
}

fn kv(ui: &mut Ui, key: &str, value: &str) {
  ui.horizontal(|ui| {
    ui.label(egui::RichText::new(key).size(13.0).color(theme::MUTED));
    ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
      ui.label(egui::RichText::new(value).size(13.0).family(theme::medium()).color(theme::INK));
    });
  });
}

fn panel(ui: &mut Ui, width: f32, content: impl FnOnce(&mut Ui)) {
  let (rect, _) = ui.allocate_exact_size(vec2(width, 220.0), Sense::hover());
  ui.painter().rect(rect, 0.0, theme::WASH, theme::hairline(), egui::StrokeKind::Inside);
  let mut inner = ui.new_child(egui::UiBuilder::new().max_rect(rect.shrink(18.0)));
  content(&mut inner);
}

fn number_field(ui: &mut Ui, label: &str, value: &mut u32, range: std::ops::RangeInclusive<u32>) {
  widgets::hud(ui, label, theme::FAINT);
  ui.add_space(4.0);
  ui.add(egui::DragValue::new(value).range(range).speed(1.0).update_while_editing(false));
}

fn load_png(ctx: &egui::Context, id: String, path: &Path) -> Option<TextureHandle> {
  let img = image::open(path).ok()?.into_rgba8();
  let size = [img.width() as usize, img.height() as usize];
  let color = ColorImage::from_rgba_unmultiplied(size, img.as_raw());
  Some(ctx.load_texture(id, color, TextureOptions::LINEAR))
}

#[cfg(test)]
mod tests {
  use super::*;
  use egui_kittest::Harness;
  use egui_kittest::kittest::Queryable;

  #[test]
  fn timestamps_stop_at_duration_and_clamp() {
    assert_eq!(timestamps(0.0, 4, 250, 2.0), vec![0.0, 0.25, 0.5, 0.75]);
    assert_eq!(timestamps(1.5, 10, 250, 2.0), vec![1.5, 1.75, 2.0]);
    assert_eq!(timestamps(2.0, 5, 100, 2.0), vec![2.0]);
    assert_eq!(timestamps(5.0, 3, 250, 1.0), vec![1.0], "start past the end clamps to duration");
    assert_eq!(timestamps(0.0, 0, 100, 1.0).len(), 1, "count 0 clamps up to 1");
    assert_eq!(timestamps(0.0, 999, 250, 1.0), vec![0.0, 0.25, 0.5, 0.75, 1.0], "count 999 clamps to 50, then duration cuts it");
  }

  #[test]
  fn precise_clock_and_file_names() {
    assert_eq!(format_time_precise(0.0), "00:00.000");
    assert_eq!(format_time_precise(65.042), "01:05.042");
    assert_eq!(format_time_precise(-1.0), "00:00.000");
    assert_eq!(frame_file_name(0, 1.5), "frame-01-00-01-500.png");
    assert_eq!(frame_file_name(9, 0.0), "frame-10-00-00-000.png");
  }

  #[test]
  fn video_paths_accept_common_containers() {
    assert!(is_video_path(Path::new("scene.MP4")));
    assert!(is_video_path(Path::new("/tmp/a.webm")));
    assert!(!is_video_path(Path::new("still.png")));
  }

  #[test]
  fn empty_page_offers_select_video() {
    let harness = build(FrameExtractPage::default());
    harness.get_by_label("Select Video");
    assert!(harness.query_by_label("Extract Frames").is_none());
  }

  #[test]
  fn loaded_page_shows_extract_and_switch() {
    let page = FrameExtractPage { clip: Some(OpenClip { path: PathBuf::from("/tmp/demo.mp4"), info: Some(ClipInfo { width: 640, height: 360, fps: 24.0, duration: 2.0 }), probe: None, player: None, probe_error: None }), ..Default::default() };
    let harness = build(page);
    assert!(harness.query_by_label("Extract Frames").is_some());
    assert!(harness.query_by_label("Switch Video").is_some());
    assert!(harness.query_by_label("Select Video").is_none());
  }

  #[test]
  fn extracts_stills_from_a_generated_clip() {
    if !video::ffmpeg_available() {
      eprintln!("skipping: ffmpeg/ffprobe not on PATH");
      return;
    }
    let dir = std::env::temp_dir().join("artcraft-native-frame-extract-test");
    std::fs::create_dir_all(&dir).unwrap();
    let clip = dir.join("clip.mp4");
    let status = ffmpeg_cmd("ffmpeg").args(["-y", "-loglevel", "error", "-f", "lavfi", "-i", "testsrc=duration=1:size=320x180:rate=24", "-pix_fmt", "yuv420p"]).arg(&clip).status().unwrap();
    assert!(status.success());
    let info = probe(&clip).unwrap();
    assert_eq!((info.width, info.height), (320, 180));
    assert!((info.duration - 1.0).abs() < 0.15);
    let out = dir.join("still.png");
    extract_frame(&clip, 0.2, &out).unwrap();
    let img = image::open(&out).unwrap();
    assert_eq!((img.width(), img.height()), (320, 180));
  }

  fn build(page: FrameExtractPage) -> Harness<'static, State> {
    let mut harness = Harness::builder().with_size(egui::vec2(1200.0, 800.0)).build_ui_state(
      |ui, s: &mut State| {
        if !s.fonts_ready {
          crate::theme::apply(ui.ctx());
          s.fonts_ready = true;
          return;
        }
        s.page.load_textures(ui.ctx());
        s.page.ui(ui);
      },
      State { page, fonts_ready: false },
    );
    harness.run();
    harness
  }

  struct State {
    page: FrameExtractPage,
    fonts_ready: bool,
  }
}
