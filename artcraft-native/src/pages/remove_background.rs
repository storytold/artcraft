//! BG Remove: pick a picture, take its background off on this machine and save the result as a
//! PNG. The work is done by `backend::background`; nothing is uploaded.

use std::path::PathBuf;
use std::sync::mpsc::Receiver;

use egui::{vec2, Align2, Color32, ColorImage, FontId, Rect, TextureHandle, TextureOptions, Ui};
use image::RgbaImage;

use crate::backend::background::{self, Progress, Stage};
use crate::overlays::lightbox::fit_inside;
use crate::pages::common::Env;
use crate::theme;
use crate::ui::icons::{self, Icon};
use crate::ui::widgets;

const IMAGE_EXTENSIONS: [&str; 4] = ["png", "jpg", "jpeg", "webp"];
const CONTROLS_HEIGHT: f32 = 88.0;
const PANEL_GAP: f32 = 12.0;
/// Larger pictures are shrunk for the screen only; the saved file keeps the full size.
const MAX_TEXTURE_SIDE: u32 = 2048;
const CHECKER_CELL: f32 = 12.0;
const CHECKER_DARK: Color32 = Color32::from_gray(52);
const CHECKER_LIGHT: Color32 = Color32::from_gray(78);

#[derive(Default)]
pub struct RemoveBackgroundPage {
  picture: Option<Picture>,
}

impl RemoveBackgroundPage {
  pub fn ui(&mut self, ui: &mut Ui, env: &mut Env) {
    let area = ui.max_rect();
    if let Some(picture) = &mut self.picture {
      picture.poll(&env.ctx);
    }
    let stage = Rect::from_min_max(area.min, egui::pos2(area.right(), area.bottom() - CONTROLS_HEIGHT)).shrink2(vec2(24.0, 16.0));
    self.stage(ui, stage);

    let mut picked = None;
    let mut save = None;
    let controls = Rect::from_min_max(egui::pos2(area.left() + 24.0, stage.bottom() + 16.0), area.max - vec2(24.0, 16.0));
    let mut child = ui.new_child(egui::UiBuilder::new().max_rect(controls));
    child.horizontal(|ui| {
      if widgets::button(ui, Some(Icon::Folder), if self.picture.is_some() { "Choose another picture" } else { "Choose a picture" }, widgets::Kind::Primary, 0.0, theme::CONTROL_H).clicked() {
        picked = rfd::FileDialog::new().add_filter("Pictures", &IMAGE_EXTENSIONS).pick_file();
      }
      if let Some(Picture { work: Work::Done { result, .. }, path, .. }) = &self.picture {
        if widgets::button(ui, Some(Icon::Download), "Save PNG", widgets::Kind::Secondary, 0.0, theme::CONTROL_H).clicked() {
          save = Some((saved_file_name(path), result.clone()));
        }
      }
    });
    child.add_space(8.0);
    child.label(egui::RichText::new("Runs on this computer. Nothing is uploaded.").size(12.0).color(theme::MUTED));

    if let Some(path) = picked {
      self.open(path, env);
    }
    if let Some((name, result)) = save {
      if let Some(path) = rfd::FileDialog::new().set_file_name(&name).add_filter("PNG", &["png"]).save_file() {
        match result.save_with_format(&path, image::ImageFormat::Png) {
          Ok(()) => env.toasts.success(format!("Saved {}", path.display())),
          Err(e) => env.toasts.error(format!("Couldn't save the picture: {e}")),
        }
      }
    }
  }

  fn open(&mut self, path: PathBuf, env: &mut Env) {
    let picture = match image::open(&path) {
      Ok(picture) => picture.to_rgba8(),
      Err(e) => {
        env.toasts.error(format!("Couldn't open {}: {e}", path.display()));
        return;
      },
    };
    let original = env.ctx.load_texture("bg-remove-original", for_screen(&picture), TextureOptions::LINEAR);
    let progress = background::spawn(env.backend.runtime(), env.ctx.clone(), picture);
    self.picture = Some(Picture { path, original, work: Work::Running { stage: Stage::Removing, progress } });
  }

  fn stage(&self, ui: &mut Ui, stage: Rect) {
    let half = (stage.width() - PANEL_GAP) / 2.0;
    let left = Rect::from_min_size(stage.min, vec2(half, stage.height()));
    let right = Rect::from_min_size(egui::pos2(left.right() + PANEL_GAP, stage.top()), vec2(half, stage.height()));
    for (rect, label) in [(left, "ORIGINAL"), (right, "NO BACKGROUND")] {
      ui.painter().rect_filled(rect, 0.0, Color32::BLACK);
      ui.painter().text(rect.left_top() + vec2(10.0, 8.0), Align2::LEFT_TOP, label, FontId::new(11.0, egui::FontFamily::Monospace), theme::MUTED);
    }
    let Some(picture) = &self.picture else {
      say(ui, stage, "Choose a picture to take its background off.", theme::MUTED);
      return;
    };
    paint_fitted(ui, left, &picture.original);
    match &picture.work {
      Work::Running { stage: step, .. } => {
        let text = if *step == Stage::DownloadingModel { "Getting the small model (once, about 5 MB)…" } else { "Taking the background off…" };
        icons::paint_spinner(ui, Rect::from_center_size(right.center() - vec2(0.0, 24.0), vec2(32.0, 32.0)), Color32::WHITE);
        ui.painter().text(right.center() + vec2(0.0, 24.0), Align2::CENTER_CENTER, text, FontId::new(13.0, egui::FontFamily::Proportional), theme::MUTED);
      },
      Work::Done { texture, .. } => {
        let fit = fit_inside(texture.size_vec2(), right.shrink(4.0).size());
        let image = Rect::from_center_size(right.center(), fit);
        paint_checkerboard(ui, image);
        egui::Image::new(texture).paint_at(ui, image);
      },
      Work::Failed(message) => say(ui, right, &format!("Couldn't take the background off: {message}"), theme::BAD),
    }
  }
}

struct Picture {
  path: PathBuf,
  original: TextureHandle,
  work: Work,
}

enum Work {
  Running { stage: Stage, progress: Receiver<Progress> },
  Done { result: RgbaImage, texture: TextureHandle },
  Failed(String),
}

impl Picture {
  fn poll(&mut self, ctx: &egui::Context) {
    let Work::Running { stage, progress } = &mut self.work else {
      return;
    };
    let mut finished = None;
    while let Ok(update) = progress.try_recv() {
      match update {
        Progress::Stage(next) => *stage = next,
        Progress::Done(result) => finished = Some(result),
      }
    }
    match finished {
      Some(Ok(result)) => {
        let texture = ctx.load_texture("bg-remove-result", for_screen(&result), TextureOptions::LINEAR);
        self.work = Work::Done { result, texture };
      },
      Some(Err(message)) => self.work = Work::Failed(message),
      None => ctx.request_repaint_after(std::time::Duration::from_millis(30)),
    }
  }
}

fn say(ui: &mut Ui, rect: Rect, text: &str, color: Color32) {
  ui.painter().text(rect.center(), Align2::CENTER_CENTER, text, FontId::new(14.0, egui::FontFamily::Proportional), color);
}

fn paint_fitted(ui: &mut Ui, panel: Rect, texture: &TextureHandle) {
  let fit = fit_inside(texture.size_vec2(), panel.shrink(4.0).size());
  egui::Image::new(texture).paint_at(ui, Rect::from_center_size(panel.center(), fit));
}

/// The grey squares that show through the see-through parts.
fn paint_checkerboard(ui: &mut Ui, rect: Rect) {
  let painter = ui.painter();
  painter.rect_filled(rect, 0.0, CHECKER_DARK);
  let (columns, rows) = ((rect.width() / CHECKER_CELL).ceil() as i32, (rect.height() / CHECKER_CELL).ceil() as i32);
  for row in 0..rows {
    for column in (row % 2..columns).step_by(2) {
      let cell = Rect::from_min_size(rect.min + vec2(column as f32 * CHECKER_CELL, row as f32 * CHECKER_CELL), vec2(CHECKER_CELL, CHECKER_CELL));
      painter.rect_filled(cell.intersect(rect), 0.0, CHECKER_LIGHT);
    }
  }
}

/// The picture as a texture, shrunk if it is bigger than a graphics card is guaranteed to take.
fn for_screen(image: &RgbaImage) -> ColorImage {
  let (width, height) = image.dimensions();
  let largest = width.max(height);
  let shown = if largest > MAX_TEXTURE_SIDE {
    let scale = MAX_TEXTURE_SIDE as f64 / largest as f64;
    image::imageops::resize(image, ((width as f64 * scale).round() as u32).max(1), ((height as f64 * scale).round() as u32).max(1), image::imageops::FilterType::Triangle)
  } else {
    image.clone()
  };
  ColorImage::from_rgba_unmultiplied([shown.width() as usize, shown.height() as usize], shown.as_raw())
}

/// `holiday.jpg` is offered as `holiday_no-background.png`.
fn saved_file_name(source: &std::path::Path) -> String {
  let stem = source.file_stem().map(|s| s.to_string_lossy().into_owned()).unwrap_or_else(|| "picture".to_owned());
  format!("{stem}_no-background.png")
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn saved_names_keep_the_picture_name() {
    assert_eq!(saved_file_name(std::path::Path::new("/photos/holiday.jpg")), "holiday_no-background.png");
    assert_eq!(saved_file_name(std::path::Path::new("")), "picture_no-background.png");
  }

  #[test]
  fn big_pictures_are_shrunk_for_the_screen_only() {
    let big = RgbaImage::new(4096, 1024);
    assert_eq!(for_screen(&big).size, [2048, 512]);
    assert_eq!(for_screen(&RgbaImage::new(300, 200)).size, [300, 200]);
  }
}
