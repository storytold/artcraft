//! Frame Extract: pick a local video, scrub to a moment and save that frame as a PNG. Frames come
//! from FFmpeg (`backend::video`), so the page asks for it when it isn't installed.

use std::path::PathBuf;
use std::sync::mpsc::{channel, Receiver};

use egui::{vec2, Align2, ColorImage, FontId, Rect, TextureHandle, TextureOptions, Ui};

use crate::backend::video::{self, VideoInfo};
use crate::overlays::lightbox::fit_inside;
use crate::pages::common::Env;
use crate::theme;
use crate::ui::icons::Icon;
use crate::ui::widgets;

const VIDEO_EXTENSIONS: [&str; 8] = ["mp4", "mov", "mkv", "webm", "avi", "m4v", "wmv", "flv"];
const CONTROLS_HEIGHT: f32 = 132.0;

#[derive(Default)]
pub struct FrameExtractorPage {
  clip: Option<Clip>,
}

impl FrameExtractorPage {
  pub fn ui(&mut self, ui: &mut Ui, env: &mut Env) {
    let area = ui.max_rect();
    if !video::ffmpeg_available() {
      ui.painter().text(area.center(), Align2::CENTER_CENTER, "Frame Extract needs FFmpeg. Install it and make sure ffmpeg and ffprobe are on your PATH.", FontId::new(15.0, egui::FontFamily::Proportional), theme::MUTED);
      return;
    }
    if let Some(clip) = &mut self.clip {
      clip.poll(&env.ctx);
    }
    let mut picked = None;
    let mut save = None;
    let stage = Rect::from_min_max(area.min, egui::pos2(area.right(), area.bottom() - CONTROLS_HEIGHT));
    self.stage(ui, stage);
    let controls = Rect::from_min_max(egui::pos2(area.left() + 24.0, stage.bottom()), area.max - vec2(24.0, 16.0));
    let mut child = ui.new_child(egui::UiBuilder::new().max_rect(controls));
    child.horizontal(|ui| {
      if widgets::button(ui, Some(Icon::Folder), if self.clip.is_some() { "Choose another video" } else { "Choose a video" }, widgets::Kind::Primary, 0.0, theme::CONTROL_H).clicked() {
        picked = rfd::FileDialog::new().add_filter("Video", &VIDEO_EXTENSIONS).pick_file();
      }
      if let Some(clip) = &self.clip {
        ui.label(egui::RichText::new(clip.path.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default()).color(theme::MUTED));
      }
    });
    if let Some(clip) = &mut self.clip {
      if let Some(info) = clip.info {
        child.add_space(8.0);
        child.horizontal(|ui| {
          if widgets::button(ui, Some(Icon::ChevronLeft), "Frame", widgets::Kind::Secondary, 0.0, theme::CONTROL_H).clicked() {
            clip.position = step(clip.position, -1.0, info);
          }
          if widgets::button(ui, Some(Icon::ChevronRight), "Frame", widgets::Kind::Secondary, 0.0, theme::CONTROL_H).clicked() {
            clip.position = step(clip.position, 1.0, info);
          }
          ui.style_mut().spacing.slider_width = (ui.available_width() - 330.0).max(120.0);
          ui.add(egui::Slider::new(&mut clip.position, 0.0..=(info.duration - 1.0 / info.fps).max(0.0)).show_value(false));
          ui.label(egui::RichText::new(format!("{} / {}", timestamp(clip.position), timestamp(info.duration))).monospace().color(theme::MUTED));
        });
        child.add_space(8.0);
        child.horizontal(|ui| {
          ui.add_enabled_ui(clip.frame.is_some(), |ui| {
            if widgets::button(ui, Some(Icon::Download), "Save frame", widgets::Kind::Primary, 0.0, theme::CONTROL_H).clicked() {
              if let Some(frame) = &clip.frame {
                save = Some((frame_file_name(&clip.path.to_string_lossy(), frame.time), frame.png.clone()));
              }
            }
          });
        });
      }
    }
    if let Some(path) = picked {
      self.clip = Some(Clip::open(path));
    }
    if let Some((name, png)) = save {
      if let Some(path) = rfd::FileDialog::new().set_file_name(&name).add_filter("PNG", &["png"]).save_file() {
        match std::fs::write(&path, png) {
          Ok(()) => env.toasts.success(format!("Saved {}", path.display())),
          Err(e) => env.toasts.error(format!("Couldn't save the frame: {e}")),
        }
      }
    }
  }

  fn stage(&self, ui: &mut Ui, stage: Rect) {
    let p = ui.painter();
    p.rect_filled(stage.shrink2(vec2(24.0, 16.0)), 0.0, egui::Color32::BLACK);
    let inner = stage.shrink2(vec2(28.0, 20.0));
    let message = match &self.clip {
      None => Some(("Choose a video to pull frames out of it.", theme::MUTED)),
      Some(clip) => match (&clip.error, &clip.frame) {
        (Some(e), _) => {
          ui.painter().text(inner.center(), Align2::CENTER_CENTER, format!("Couldn't read this video: {e}"), FontId::new(13.0, egui::FontFamily::Proportional), theme::BAD);
          None
        },
        (None, Some(frame)) => {
          let fit = fit_inside(frame.texture.size_vec2(), inner.size());
          egui::Image::new(&frame.texture).paint_at(ui, Rect::from_center_size(inner.center(), fit));
          None
        },
        (None, None) => Some(("Reading the video…", theme::MUTED)),
      },
    };
    if let Some((text, color)) = message {
      ui.painter().text(inner.center(), Align2::CENTER_CENTER, text, FontId::new(15.0, egui::FontFamily::Proportional), color);
    }
  }
}

/// One decoded frame: the PNG bytes saved on request and the texture shown on screen.
struct Frame {
  time: f64,
  png: Vec<u8>,
  texture: TextureHandle,
}

struct Clip {
  path: PathBuf,
  probe: Option<Receiver<Result<VideoInfo, String>>>,
  info: Option<VideoInfo>,
  /// The moment the slider points at.
  position: f64,
  /// A decode in flight, so a fast drag asks for one frame at a time.
  grab: Option<(f64, Receiver<Result<Vec<u8>, String>>)>,
  frame: Option<Frame>,
  error: Option<String>,
}

impl Clip {
  fn open(path: PathBuf) -> Self {
    let (tx, rx) = channel();
    let probe_path = path.to_string_lossy().into_owned();
    std::thread::spawn(move || {
      let _ = tx.send(video::probe(&probe_path));
    });
    Self { path, probe: Some(rx), info: None, position: 0.0, grab: None, frame: None, error: None }
  }

  fn poll(&mut self, ctx: &egui::Context) {
    if let Some(rx) = &self.probe {
      if let Ok(result) = rx.try_recv() {
        self.probe = None;
        match result {
          Ok(info) => self.info = Some(info),
          Err(e) => self.error = Some(e),
        }
      }
    }
    if let Some((time, rx)) = &self.grab {
      if let Ok(result) = rx.try_recv() {
        let time = *time;
        self.grab = None;
        match result.and_then(|png| decode(&png).map(|image| (png, image))) {
          Ok((png, image)) => {
            let texture = ctx.load_texture("frame-extractor", image, TextureOptions::LINEAR);
            self.frame = Some(Frame { time, png, texture });
            self.error = None;
          },
          Err(e) => self.error = Some(e),
        }
      }
    }
    // Decode the moment the slider is on once the previous frame is back.
    if self.info.is_some() && self.grab.is_none() && self.frame.as_ref().map(|f| f.time) != Some(self.position) && self.error.is_none() {
      let (tx, rx) = channel();
      let path = self.path.to_string_lossy().into_owned();
      let time = self.position;
      std::thread::spawn(move || {
        let _ = tx.send(video::grab_frame(&path, time));
      });
      self.grab = Some((time, rx));
    }
    if self.probe.is_some() || self.grab.is_some() {
      ctx.request_repaint_after(std::time::Duration::from_millis(30));
    }
  }
}

fn decode(png: &[u8]) -> Result<ColorImage, String> {
  let image = image::load_from_memory(png).map_err(|e| format!("couldn't read the frame: {e}"))?.to_rgba8();
  Ok(ColorImage::from_rgba_unmultiplied([image.width() as usize, image.height() as usize], image.as_raw()))
}

/// `1:05.250`, the moment shown next to the slider.
fn timestamp(secs: f64) -> String {
  let millis = (secs.max(0.0) * 1000.0).round() as u64;
  format!("{}:{:02}.{:03}", millis / 60_000, millis / 1000 % 60, millis % 1000)
}

/// The suggested file name for a saved frame: `clip_0-01-05.250.png`.
fn frame_file_name(clip: &str, secs: f64) -> String {
  let stem = std::path::Path::new(clip).file_stem().map(|s| s.to_string_lossy().into_owned()).unwrap_or_else(|| "frame".to_owned());
  format!("{stem}_{}.png", timestamp(secs).replace(':', "-"))
}

/// One frame earlier or later, kept inside the clip.
fn step(position: f64, frames: f64, info: VideoInfo) -> f64 {
  (position + frames / info.fps).clamp(0.0, (info.duration - 1.0 / info.fps).max(0.0))
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn timestamps_show_minutes_seconds_and_millis() {
    assert_eq!(timestamp(0.0), "0:00.000");
    assert_eq!(timestamp(65.25), "1:05.250");
    assert_eq!(timestamp(-3.0), "0:00.000");
  }

  #[test]
  fn frame_names_carry_the_clip_name_and_moment() {
    assert_eq!(frame_file_name("/videos/holiday.mp4", 65.25), "holiday_1-05.250.png");
    assert_eq!(frame_file_name("", 0.0), "frame_0-00.000.png");
  }

  #[test]
  fn stepping_stays_inside_the_clip() {
    assert_eq!(step(0.0, -1.0, info()), 0.0);
    assert!((step(1.0, 1.0, info()) - 1.04).abs() < 1e-9);
    assert!((step(9.99, 5.0, info()) - 9.96).abs() < 1e-9);
  }

  fn info() -> VideoInfo {
    VideoInfo { width: 1280, height: 720, fps: 25.0, duration: 10.0 }
  }
}
